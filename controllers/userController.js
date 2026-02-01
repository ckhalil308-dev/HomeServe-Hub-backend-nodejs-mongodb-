const User = require('../models/User');
const Client = require('../models/Client');
const Professionnel = require('../models/Professionnel');
const bcrypt = require('bcrypt');

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
            isBanned: false
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

// Get user by id
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

// Get professional by specialty
exports.getProByspecialite = async (req, res) => {
    try {
        const specialite = req.params.specialite;
        const pros = await Professionnel.find({ specialite }).select('-motDePasse');
        res.status(200).json(pros);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Delete user
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

// Update own profile
exports.updateMe = async (req, res) => {
    try {
        const id = req.user._id;
        const userActuel = await User.findById(id);
        if (!userActuel) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const updates = {};
        if (req.body.nom && req.body.nom !== userActuel.nom) updates.nom = req.body.nom;
        if (req.body.prenom && req.body.prenom !== userActuel.prenom) updates.prenom = req.body.prenom;
        if (req.body.email && req.body.email !== userActuel.email) {
            const existUser = await User.findOne({ email: req.body.email });
            if (existUser) return res.status(400).json({ message: "Email déjà utilisé" });
            updates.email = req.body.email;
        }

        if (userActuel.role === 'professionnel' && req.body.specialite) {
            updates.specialite = req.body.specialite;
        }

        const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-motDePasse -role');
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
    const allowedRoles = ['client', 'professionnel'];
    try {
        const id = req.params.id;
        const userActuel = await User.findById(id);
        if (!userActuel) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const updates = {};
        if (req.body.nom && req.body.nom !== userActuel.nom) updates.nom = req.body.nom;
        if (req.body.prenom && req.body.prenom !== userActuel.prenom) updates.prenom = req.body.prenom;
        if (req.body.email && req.body.email !== userActuel.email) {
            const exitUser = await User.findOne({ email: req.body.email });
            if (exitUser) return res.status(400).json({ message: "Email déjà utilisé" });
            updates.email = req.body.email;
        }

        if (req.body.role && allowedRoles.includes(req.body.role) && req.body.role !== userActuel.role) {
            if (req.body.role === "professionnel") {
                updates.isVerified = false;
                updates.specialite = "À définir";
            }
            updates.role = req.body.role;
        }

        const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-motDePasse');
        res.status(200).json({ message: "Utilisateur mis à jour avec succès", user });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};
