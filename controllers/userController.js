const User = require('../models/User');
const Client = require('../models/Client');
const Professionnel = require('../models/Professionnel');
const Demande = require('../models/Demande');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

// Get all users (admin view)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-motDePasse');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Get all professionals with search & pagination
exports.getAllPros = async (req, res) => {
    try {
        const limit = 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const Search = req.query.Search || '';
        const nom = Search.split(' ')[1] || '';
        const prenom = Search.split(' ')[0] || '';

        const query = {
            role: 'professionnel',
            $or: [
                { nom: { $regex: nom, $options: 'i' } },
                { prenom: { $regex: prenom, $options: 'i' } },
                { specialite: { $regex: Search, $options: 'i' } }
            ],
            isBanned: false,
            isVerified: true
        };

        const [allPros, totalDocs, ProsNonVerifie, TotalNonVerifie] = await Promise.all([
            Professionnel.find(query).select('-motDePasse').skip(skip).limit(limit).sort({ createdAt: -1 }),
            Professionnel.countDocuments(query),
            Professionnel.find({ isVerified: false, isBanned: false }).skip((page - 1) * 5).limit(5).sort({ createdAt: -1 }),
            Professionnel.countDocuments({ isVerified: false })
        ]);

        const uneSemaineAvant = new Date();
        uneSemaineAvant.setDate(uneSemaineAvant.getDate() - 7);

        const nouveauxCount = await Professionnel.countDocuments({
            createdAt: { $gte: uneSemaineAvant }
        });

        res.status(200).json({
            total: totalDocs,
            nouveaux: nouveauxCount,
            totalPages: Math.ceil(totalDocs / limit),
            currentPage: page,
            allPros,
            ProsNonVerifie,
            TotalNonVerifie: Math.ceil(TotalNonVerifie / 5),
        });

    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Get all clients with search & pagination
exports.getAllClients = async (req, res) => {
    try {
        const limit = 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const Search = req.query.Search || '';
        const nom = Search.split(' ')[1] || '';
        const prenom = Search.split(' ')[0] || '';

        const query = {
            role: 'client',
            $or: [
                { nom: { $regex: nom, $options: 'i' } },
                { prenom: { $regex: prenom, $options: 'i' } },
            ],
            isBanned: false
        };

        const [clients, totalDocs] = await Promise.all([
            Client.find(query).select('-motDePasse').skip(skip).limit(limit).sort({ createdAt: -1 }),
            Client.countDocuments(query)
        ]);

        const uneSemaineAvant = new Date();
        uneSemaineAvant.setDate(uneSemaineAvant.getDate() - 7);

        const nouveauxCount = await Client.countDocuments({
            createdAt: { $gte: uneSemaineAvant },
            isBanned: false
        });

        res.status(200).json({
            total: totalDocs,
            nouveaux: nouveauxCount,
            totalPages: Math.ceil(totalDocs / limit),
            currentPage: page,
            clients
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Get own info
exports.getInfos = async (req, res) => {
    try {
        const id = req.user._id;
        const user = await User.findById(id).select('-motDePasse');
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id).select('-motDePasse');
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.getProByspecialite = async (req, res) => {
    try {
        const specialite = req.params.specialite;
        const pros = await Professionnel.find({ specialite }).select('-motDePasse');
        res.status(200).json(pros);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        res.status(200).json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};


exports.updateMe = async (req, res) => {
    try {
        const id = req.user._id;
        const role = req.user.role; // Récupéré via ton middleware auth

        const updates = {};
        if (req.body.nom) updates.nom = req.body.nom;
        if (req.body.prenom) updates.prenom = req.body.prenom;
        if (req.body.email) updates.email = req.body.email;

        // Utiliser le bon modèle selon le rôle pour accepter les champs spécifiques
        let modelToUse = User;
        if (role === 'professionnel') {
            modelToUse = Professionnel;
            if (req.body.specialite) updates.specialite = req.body.specialite;
        }

        const user = await modelToUse.findByIdAndUpdate(
            id, 
            { $set: updates }, 
            { new: true, runValidators: true }
        ).select('-motDePasse');

        res.status(200).json({ message: "Profil mis à jour", user });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Change password
exports.chnagerMotDePasse = async (req, res) => {
    try {
        const id = req.user._id;
        const { ancienMotDePasse, nouveauMotDePasse } = req.body;
        const user = await User.findById(id);
        const isMatch = await bcrypt.compare(ancienMotDePasse, user.motDePasse);
        if (!isMatch) return res.status(400).json({ message: "Ancien mot de passe incorrect" });

        const salt = await bcrypt.genSalt(10);
        user.motDePasse = await bcrypt.hash(nouveauMotDePasse, salt);
        await user.save();

        res.status(200).json({ message: "Mot de passe changé avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Verify professional
exports.verifyProfessionnel = async (req, res) => {
    try {
        const id = req.params.id;
        const pro = await Professionnel.findById(id);
        if (!pro) return res.status(404).json({ message: "Professionnel non trouvé" });

        pro.isVerified = true;
        await pro.save();

        res.status(200).json({ message: "Compte professionnel vérifié avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Ban user
exports.bannirUtilisateur = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        user.isBanned = true;
        await user.save();
        res.status(200).json({ message: "Utilisateur banni avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Unban user
exports.debannirUtilisateur = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        user.isBanned = false;
        await user.save();
        res.status(200).json({ message: "Utilisateur débanni avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Get banned users
exports.getBannedUsers = async (req, res) => {
    try {
        const limit = 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const Search = req.query.Search || '';
        const nom = Search.split(' ')[1] || '';
        const prenom = Search.split(' ')[0] || '';

        const query = {
            isBanned: true,
            $or: [
                { nom: { $regex: nom, $options: 'i' } },
                { prenom: { $regex: prenom, $options: 'i' } },
            ]
        };

        const bannedUsers = await User.find(query).select('-motDePasse').skip(skip).limit(limit);
        const totalDocs = await User.countDocuments(query);

        res.status(200).json({
            bannedUsers,
            totalDocs,
            totalPages: Math.ceil(totalDocs / limit),
            currentPage: page,
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Update user by admin
exports.modifierUsersByAdmin = async (req, res) => {

    try {

        const id = req.params.id;

        const updates = { ...req.body };





        const userActuel = await User.findById(id);

        if (!userActuel) return res.status(404).json({ message: "Utilisateur non trouvé" });



       

        if (updates.role && updates.role !== userActuel.role) {

           

           

            const typeValue = updates.role === 'professionnel' ? 'professionnel' : 'client';



         

            await User.collection.updateOne(

                { _id: new mongoose.Types.ObjectId(id) },

                {

                    $set: {

                        role: updates.role,

                   

                    }

                }

            );



           

            if (updates.role === 'professionnel') {

                await User.collection.updateOne(

                    { _id: new mongoose.Types.ObjectId(id) },

                    { $set: { isVerified: false, specialite: updates.specialite || "À définir" } }

                );

            }

        }

        const { role, ...autresUpdates } = updates;

       

        const userMisAJour = await User.findByIdAndUpdate(

            id,

            { $set: autresUpdates },

            { new: true, runValidators: true }

        ).select('-motDePasse');



        res.status(200).json({

            message: "Utilisateur mis à jour avec succès",

            user: userMisAJour

        });



    } catch (error) {

        console.error("Erreur Admin Update:", error);

        res.status(500).json({ message: "Erreur lors de la modification", error: error.message });

    }

}; 

exports.getMonthlyReport = async (req, res) => {
    try {
        console.log("Début de la récupération des données...");

        // 1. Définition des dates (Mois dernier)
        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
        const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

        // 2. Récupération des données
        // Note: Avec les discriminators, countDocuments() fonctionne sur Client et Professionnel
        const totalClients = 10; 
         const totalProfessionnels = 5;
        const [
            // totalClients,
            // totalProfessionnels,
            totalDemandes,
            newClients,
            newPros,
            newDemandes,
            demandesTerminees
        ] = await Promise.all([
            // Client.countDocuments(),
            // Professionnel.countDocuments(),
            
            Demande.countDocuments(),
            Client.countDocuments({ createdAt: { $gte: debutMois, $lt: finMois } }),
            Professionnel.countDocuments({ createdAt: { $gte: debutMois, $lt: finMois } }),
            Demande.countDocuments({ createdAt: { $gte: debutMois, $lt: finMois } }),
            Demande.countDocuments({ 
                createdAt: { $gte: debutMois, $lt: finMois }, 
                status: 'Termine' // 
            })
        ]);

        console.log("Données récupérées, création du PDF...");

        // 3. Configuration de PDFKit
        const doc = new PDFDocument({ margin: 50 });

        // IMPORTANT : Envoyer les Headers avant de piper
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Rapport_HomeServeHub.pdf');

        doc.pipe(res);

        // --- DESIGN ---
        doc.fontSize(20).text('HomeServeHub - RAPPORT MENSUEL', { align: 'center', underline: true });
        doc.moveDown(2);

        doc.fontSize(14).text('1. Statistiques Globales', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Nombre total de clients : ${totalClients}`);
        doc.text(`Nombre total de professionnels : ${totalProfessionnels}`);
        doc.text(`Nombre total de demandes : ${totalDemandes}`);
        
        doc.moveDown(1.5);

        doc.fontSize(14).text('2. Activité du Mois Dernier', { underline: true });
        doc.moveDown(0.5);
        doc.text(`Nouveaux clients : ${newClients}`);
        doc.text(`Nouveaux professionnels : ${newPros}`);
        doc.text(`Nouvelles demandes créées : ${newDemandes}`);
        doc.text(`Demandes terminées : ${demandesTerminees}`);

        doc.moveDown(2);
        doc.fontSize(10).fillColor('grey').text('Document généré automatiquement par HomeServeHub', { align: 'center' });

        // 4. Finalisation
        doc.end();
        console.log("PDF généré et envoyé avec succès !");

    } catch (error) {
        // C'EST ICI QUE TU VERRAIS L'ERREUR DANS TON TERMINAL
        console.error("ERREUR CRITIQUE DANS LE RAPPORT :");
        console.error(error); 
        
        if (!res.headersSent) {
            res.status(500).json({ 
                message: "Erreur lors de la génération du rapport", 
                error: error.message 
            });
        }
    }
};