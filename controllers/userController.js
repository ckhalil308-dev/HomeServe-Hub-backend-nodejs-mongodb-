const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-motDePasse');
        res.status(200).json(users);


    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }



}

exports.getAllPros = async (req, res) => {
    try {
        const limit = 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const Search = req.query.Search || '';
        const nom = Search.split(' ')[1] || '';
        const prenom = Search.split(' ')[0] || '';

        let query = {
            role: 'professionnel',
            $or: [
                { nom: { $regex: nom, $options: 'i' } },
                { prenom: { $regex: prenom, $options: 'i' } },
                { specialite: { $regex: Search, $options: 'i' } }
            ]
        };

        query.isBanned=false;

        // On lance la recherche ET le compte en même temps (plus rapide)
        const [allPros, totalDocs, ProsNonVerifie, TotalNonVerifie] = await Promise.all([
            User.find(query).select('-motDePasse').skip(skip).limit(limit).sort({ createdAt: -1 }),
            User.countDocuments(query),
            User.find({ role: 'professionnel', isVerified: false, isBanned: false }).skip((page - 1) * 5).limit(5).sort({ createdAt: -1 }),
            User.countDocuments({ role: 'professionnel', isVerified: false })
        ]);

        const uneSemaineAvant = new Date();
        uneSemaineAvant.setDate(uneSemaineAvant.getDate() - 7);

        const nouveauxCount = await User.countDocuments({
            role: 'professionnel',
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
exports.getAllClients = async (req, res) => {
    try {
        const limit = 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const Search = req.query.Search || '';
        const nom = Search.split(' ')[1] || '';
        const prenom = Search.split(' ')[0] || '';

        let query = {
            role: 'client',
            $or: [
                { nom: { $regex: nom, $options: 'i' } },
                { prenom: { $regex: prenom, $options: 'i' } },
            ]
        };
        query.isBanned=false;

        const [clients, totalDocs] = await Promise.all([
            User.find(query).select('-motDePasse').skip(skip).limit(limit).sort({ createdAt: -1 }),
            User.countDocuments(query)
        ]);

        const uneSemaineAvant = new Date();
        uneSemaineAvant.setDate(uneSemaineAvant.getDate() - 7);

        const nouveauxCount = await User.countDocuments({
            role: 'client',
            isBanned:false,
            createdAt: { $gte: uneSemaineAvant }
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
exports.getInfos = async (req, res) => {
    try {
        const id = req.user._id;
        const user = await User.findById(id).select('-motDePasse');
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.status(200).json(user);



    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
}
exports.getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id).select('-motDePasse');
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
}
exports.getProByspecialite = async (req, res) => {
    try {
        const specilaite = req.params.specialite;
        const pro = await User.find({ specialite: specilaite, role: 'professionnel' }).select('-motDePasse');
        res.status(200).json(pro);
    }
    catch (erroe) {
        res.status(500).json({ message: "Erreur serveur" });
    }


}
exports.deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.status(200).json({ message: "Utilisateur supprimé avec succès" });


    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
}
exports.updateMe = async (req, res) => {
    try {
        const id = req.user._id;
        const userActuel = await User.findById(id);
        const updates = {};


        if (req.body.nom && req.body.nom !== userActuel.nom) {
            updates.nom = req.body.nom;
        }
        if (req.body.prenom && req.body.prenom !== userActuel.prenom) {
            updates.prenom = req.body.prenom;
        }

        if (req.body.email && req.body.email !== userActuel.email) {
            const exitUser = await User.findOne({ email: req.body.email });
            if (exitUser) {
                return res.status(400).json({ message: "Email déjà utilisé" });
            }
            updates.email = req.body.email;
        }
        if (req.user.role === 'professionnel' && req.body.specialite) {
            updates.specialite = req.body.specialite;
        }
        const user = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        }).select('-motDePasse -role');

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json({ message: "Profil mis à jour", user });

    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};
exports.chnagerMotDePasse = async (req, res) => {
    try {
        const id = req.user._id;
        const { ancienMotDePasse, nouveauMotDePasse } = req.body;
        const user = await User.findById(id);
        const isMatch = await bcrypt.compare(ancienMotDePasse, user.motDePasse);
        if (!isMatch) {
            return res.status(400).json({ message: "Ancien mot de passe incorrect" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(nouveauMotDePasse, salt);
        user.motDePasse = hashedPass;
        await user.save();
        res.status(200).json({ message: "Mot de passe changé avec succès" });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }

}
exports.verifyProfessionnel = async (req, res) => {
    try {
        const id = req.params.id;
        const Pro = await User.findById(id);
        if (!Pro || Pro.role !== 'professionnel') {
            return res.status(404).json({ message: "Professionnel non trouvé" });
        }
        Pro.isVerified = true;
        await Pro.save();
        res.status(200).json({ message: "Compte professionnel vérifié avec succès" });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
}
exports.bannirUtilisateur = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        user.isBanned = true;
        await user.save();
        res.status(200).json({ message: "Utilisateur banni avec succès" });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
}
exports.debannirUtilisateur = async (req, res) => {
    try {
          const allowedRoles = ['user', 'professionnel'];
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        user.isBanned = false;
        await user.save();
        res.status(200).json({ message: "Utilisateur débanni avec succès" });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
}
exports.getBannedUsers = async (req, res) => {
    try {
        
         const limit = 10;
        const page = parseInt(req.query.page    ) || 1;
        const skip = (page - 1) * limit;
        const Search = req.query.Search || '';
        const nom = Search.split(' ')[1] || '';
        const prenom = Search.split(' ')[0] || '';
            let query = {
            isBanned: true,
            $or: [
                { nom: { $regex: nom, $options: 'i' } },
                { prenom: { $regex: prenom, $options: 'i' } },
            ]
        };

        const bannedUsers = await User.find(query).select('-motDePasse').skip(skip).limit(limit);
        const totalDocs = await User.countDocuments(query);

        res.status(200).json({ bannedUsers, 
                               totalDocs,
                                totalPages: Math.ceil(totalDocs / limit),
                                 currentPage: page,

         });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
}
exports.modifierUsersByAdmin = async (req, res) => {
    const allowedRoles = ['client', 'professionnel'];
    try {
        const id = req.params.id;
        const userActuel = await User.findById(id);
        const updates = {};
        if (!userActuel) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        if (req.body.nom && req.body.nom !== userActuel.nom) {
            updates.nom = req.body.nom;
        }
        if (req.body.prenom && req.body.prenom !== userActuel.prenom) {
            updates.prenom = req.body.prenom;
        }

        if (req.body.email && req.body.email !== userActuel.email) {
            const exitUser = await User.findOne({ email: req.body.email });
            if (exitUser) {
                return res.status(400).json({ message: "Email déjà utilisé" });
            }
            updates.email = req.body.email;
        }
      

        if (
            req.body.role &&
            allowedRoles.includes(req.body.role) &&
            req.body.role !== userActuel.role
           
         ) 
         {
            if(req.body.role==="professionnel" ){
               updates.isVerified = false; 
               updates.specialite = "À définir"
            }

            updates.role = req.body.role;
        }
        const user = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        }).select('-motDePasse');
        res.status(200).json({ message: "Utilisateur mis à jour avec succès", user });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
}