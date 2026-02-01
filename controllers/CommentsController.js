const Commentaire=require('../models/Commentaire');
const dotenv = require('dotenv');
const Service=require('../models/Service');
const Demande=require('../models/Demande');
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
exports.getCommentairesParService=async(req,res)=>{
    try{
        const page=req.query.page || 1;
        const limit=5;
        const skip=(page-1)*limit;

        const serviceId=req.params.serviceId;
        const commentaires=await Commentaire.find({service:serviceId}).populate('auteur','nom prenom').skip(skip).limit(limit).sort({createdAt:-1});
        res.status(200).json({commentaires,
                              totalPages:Math.ceil(await Commentaire.countDocuments({service:serviceId})/limit),
                              totaleCommentaires:await Commentaire.countDocuments({service:serviceId})


        });
    }
    catch(error){
        res.status(500).json({message:"Erreur serveur",error:error.message});
    }
};

