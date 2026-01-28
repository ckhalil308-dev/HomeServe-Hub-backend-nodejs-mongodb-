const Demande = require('../models/Demande');
const Service = require('../models/Service');
exports.createDemande = async (req, res) => {
    try {
        const { service, description, prix, dateIntervention, adresse, numeroTelephone } = req.body;
        const existService = await Service.findById(service);
        if (!existService) {
            return res.status(404).json({ message: "Service introuvable" });
        }
        prixService = existService.prix;
        if (prix < prixService) {
            return res.status(400).json({ message: `Le prix doit être au minimum ${prixService} TND` });
        }

        const DemandeData = {
            client: req.user._id,
            service,
            description,
            prix,
            dateIntervention,
            adresse,
            numeroTelephone
        };
        existentDemande = await Demande.findOne({ client: req.user._id, service, status: { $in: ["En attente", "Offre envoyée"] } });
        if (new Date(dateIntervention) < new Date()) {
            return res.status(400).json({ message: "La date d'intervention doit être une date future" });
        }
        if (existentDemande) {
            return res.status(400).json({ message: "Vous avez déjà une demande en cours pour ce service" });
        }
        const nouvelleDemande = await Demande.create(DemandeData);

        res.status(201).json({ message: "Demande créée", demande: nouvelleDemande });

    }
    catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });

    }



}
exports.geteDemandeForPro = async (req, res) => {
    try {
        const proId = req.user._id;
        const services = await Service.find({ professionnelId: proId }).select('_id').sort({ createdAt: -1 });
        const mesServicesIds = services.map(service => service._id);
        const demandes = await Demande.find({ service: { $in: mesServicesIds } }).populate('client', 'nom prenom email').populate('service', 'nom titre description prix').sort({ createdAt: -1 });
        res.status(200).json(demandes);
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });


    }
}
exports.geteDemandeForClient = async (req, res) => {
    try {
        const { status } = req.query;
        // const skip = (page - 1) * limit;

        const clientId = req.user._id;
        if (status != "En attente" && status != "Approuve" && status != "Rejete" && status != "Termine" && status != "Offre envoyée" && status != "tous") {
            return res.status(400).json({ message: "Statut invalide" });
        }

        if (status == "tous") {
            const demandes = await Demande.find({ client: clientId, status: { $in: ["En attente", "Termine", "Rejete", "Offre envoyée"] } }).populate({
                path: 'service',
                select: 'titre description prix professionnelId',
                populate: {
                    path: 'professionnelId',
                    select: 'nom prenom email'
                }
            }).sort({ createdAt: -1 })
                ;
            return res.status(200).json(demandes);
        }
        const demandes = await Demande.find({ client: clientId, status: status }).sort({ createdAt: -1 })
            .populate({
                path: 'service',
                select: 'titre description prix professionnelId',
                populate: {
                    path: 'professionnelId',
                    select: 'nom prenom email'
                }
            }).sort({ createdAt: -1 })
        res.status(200).json(demandes);
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}
exports.updateStatus = async (req, res) => {
    try {
        const demandeId = req.params.id;
        const { status } = req.body;

        // if(status!="Offre envoyée" ||  status!=" En attente" ){
        //     return res.status(400).json({message:"Statut invalide1"});
        // }
        const validStatus = ['Approuve', 'Rejete', 'Termine'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ message: "Statut invalide2" });
        }
        const demande = await Demande.findById(demandeId);
        if (!demande) {
            return res.status(404).json({ message: "Demande introuvable" });
        }
        demande.status = status;
        await demande.save();
        res.status(200).json({ message: "Statut mis à jour", demande });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}
exports.ProposerPrix = async (req, res) => {
    try {
        const demandeId = req.params.id;
        const { prix } = req.body;
        const demande = await Demande.findById(demandeId);
        if (!demande) {
            return res.status(404).json({ message: "Demande introuvable" });
        }
        demande.prix = prix;
        demande.status = "Offre envoyée";
        await demande.save();
        res.status(200).json({ message: "Prix proposé avec succès", demande });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}
exports.getDemandeById = async (req, res) => {
    try {
        const id = req.params.id;
        const demande = await Demande.findById(id).populate('client', 'nom prenom email').populate('service', 'nom titre description prix');
        if (!demande) {
            return res.status(404).json({ message: "Demande introuvable" });
        }
        const statutsVisibles = ['Approuve', 'Termine'];
        if (!statutsVisibles.includes(demande.status)) {
            demande.numeroTelephone = "Masqué";
            if (demande.client) {
                demande.client.email = "Masqué";
            }
        }
        res.status(200).json(demande);


    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}
exports.getAllDemandes = async (req, res) => {
    try {
        const Statut=req.query.status ||"";
        const filter = {};
            if (Statut && Statut !== 'Tous') {
                     filter.status = Statut;
             }
        const page=req.query.page ||1;
        const limit=10;
        const skip=(page-1)*limit;
        const demandes = await Demande.find(filter).populate({
            path: 'client',
            select: 'nom prenom email'
        }).populate({
            path: 'service', select: ' titre description prix category',
        }).sort({ createdAt: -1 }).skip(skip).limit(limit);
         const DemandeRecentes = await Demande.find().populate({
            path: 'client',
            select: 'nom prenom email'
        }).populate({
            path: 'service', select: ' titre description prix category',
        }).sort({ createdAt: -1 })
                                                      .limit(5);
        const DemandeTerminees = demandes.filter(demande => demande.status === 'Termine');
        const total = await Demande.countDocuments(filter);
        res.status(200).json({
            demandes,
            total: total,
            termine: DemandeTerminees.length,
            recentes: DemandeRecentes
        });
    }
    catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }



}
