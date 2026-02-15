const Commentaire=require('../models/Commentaire');
const dotenv = require('dotenv');
const Service=require('../models/Service');
const Demande=require('../models/Demande');
const mongoose = require('mongoose');
 dotenv.config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.Grok_API_KEY });
exports.ajouterCommentaire=async(req,res)=>{
    try{
        const {service,contenu,note}=req.body;
        if(!service||!contenu||note === undefined){
            return  res.status(400).json({message:"Tous les champs sont requis"});
        }
        const auteur=req.user._id;
        if(!auteur){
            return res.status(401).json({message:"Utilisateur non authentifié"});
        }
        const serviceExiste=await Service.findById(service);
        if(!serviceExiste){
            return res.status(404).json({message:"Service non trouvé"});
        }
        const existDemande = await Demande.findOne({ 
            service: service, 
            client: auteur, 
            status: "Termine" 
        });
        if(!existDemande){
            return res.status(403).json({message:"Vous ne pouvez pas commenter ce service sans l'avoir utilisé"});
        }
         const  ExistCommentaire = await Commentaire.findOne({ service: service, auteur: auteur });
        if (ExistCommentaire) {
            return res.status(400).json({ message: "Vous avez déjà commenté ce service" });
        }
        

        const commentaire={
            service,
            auteur,
            contenu,
            note
        }
        const moderation = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Tu es un modérateur de contenu. Analyse le texte suivant. Si le texte contient des insultes meme en arabe , du racisme, de la haine ou est inapproprié, réponds uniquement par le mot 'REJET'. Sinon, réponds uniquement par 'OK'."
                },
                {
                    role: "user",
                    content: contenu
                }
            ],
            model: "llama-3.3-70b-versatile", 
            temperature: 0.1,
        });
        if (moderation.choices[0].message.content === "REJET") {
            return res.status(400).json({ message: "Contenu inapproprié détecté" });
        }
        const nouveauCommentaire=new Commentaire(commentaire);
        await nouveauCommentaire.save();
        res.status(201).json({message:"Commentaire ajouté avec succès",commentaire:nouveauCommentaire});
    }
    catch(error){
        res.status(500).json({message:"Erreur serveur",error:error.message});
    }
};
exports.getCommentairesParService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        // 1. Exécuter les requêtes en parallèle pour gagner du temps
        const [commentaires, totalCommentaires, averageNote] = await Promise.all([
            Commentaire.find({ service: serviceId })
                .populate('auteur', 'nom prenom')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Commentaire.countDocuments({ service: serviceId }),
            Commentaire.aggregate([
                { $match: { service: new mongoose.Types.ObjectId(serviceId) } },
                { $group: { _id: null, avgNote: { $avg: "$note" } } }
            ])
        ]);
        const avgNote = averageNote.length > 0 ? averageNote[0].avgNote : 0;
        res.status(200).json({
            commentaires,
            avgNote: parseFloat(avgNote.toFixed(1)), 
            totalCommentaires,
            totalPages: Math.ceil(totalCommentaires / limit),
            currentPage: page
        });

    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};
exports.getRatingPerService = async (req, res) => {
    try {
        // 1. Get the ID specifically from params (match your route variable, e.g., :id)
        const { id } = req.params; 

        // 2. You MUST await the aggregation, otherwise it's just a pending Promise
        const stats = await Commentaire.aggregate([
            { $match: { service: new mongoose.Types.ObjectId(id) } },
            { $group: { _id: null, avgNote: { $avg: "$note" } } }
        ]);
        const nbr=await Commentaire.countDocuments({ service: id });

        // 3. Extract the value safely
        const avgNote = stats.length > 0 ? stats[0].avgNote : 0;

        // 4. Return as a number (or { rating: avgNote })
        res.status(200).json({ avgNote, nbr }); 
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

