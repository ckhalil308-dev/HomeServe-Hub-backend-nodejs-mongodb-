const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');
const Professionnel = require('../models/Professionnel');

exports.register = async (req, res) => {
    try {
        const { nom, prenom, email, motDePasse, role, specialite } = req.body;

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ message: "Email déjà utilisé" });
        }
        if (role === 'admin') {
            return res.status(403).json({ message: "Création de compte admin non autorisée" });
        }

        
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(motDePasse, salt);

        let newUser;


        if (role === 'professionnel') {
            if (!specialite) {
                return res.status(400).json({ message: "Spécialité requise" });
            }
            newUser = await Professionnel.create({
                nom,
                prenom,
                email: email.toLowerCase(),
                motDePasse: hashedPass,
                specialite
            });
        } else {
            newUser = await Client.create({
                nom,
                prenom,
                email: email.toLowerCase(),
                motDePasse: hashedPass
            });
        }

        res.status(201).json({
            message: "Compte créé avec succès",
            userId: newUser._id,
            role: newUser.role
        });

    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, motDePasse } = req.body;

        const existUser = await User.findOne({ email: email.toLowerCase() });
        if (!existUser) {
            return res.status(400).json({ message: "Email ou mot de passe incorrect" });
        }

        const isMatch = await bcrypt.compare(motDePasse, existUser.motDePasse);
        if (!isMatch) {
            return res.status(400).json({ message: "Email ou mot de passe incorrect" });
        }

        if (existUser.isBanned) {
            return res.status(403).json({ message: "Compte banni. Contactez l'administrateur." });
        }

        const token = jwt.sign(
            { id: existUser._id, nom: existUser.nom, prenom: existUser.prenom, role: existUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: "Connexion réussie",
            token,
            user: {
                id: existUser._id,
                nom: existUser.nom,
                prenom: existUser.prenom,
                role: existUser.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};
