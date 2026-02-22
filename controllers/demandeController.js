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
        // 1. Récupération de l'ID du pro (depuis le token JWT) et des query params
        const proId = req.user._id;
        const { status } = req.query; // ex: ?status=Approuve

        // 2. Trouver les IDs des services créés par ce professionnel
        const services = await Service.find({ professionnelId: proId }).select('_id');
        const mesServicesIds = services.map(service => service._id);

        // 3. Construction du filtre de recherche principal
        // On cherche les demandes qui concernent les services du pro
        let queryFilter = { service: { $in: mesServicesIds } };
        
        // Si le front demande un status spécifique (ex: "Approuve" ou "En attente")
        if (status) {
            queryFilter.status = status;
        }

        // 4. Exécution de la requête avec peuplement des données (Populate)
        const toutesLesDemandes = await Demande.find(queryFilter)
            .populate('client', 'nom prenom email')
            .populate('service', 'nom titre description prix')
            .sort({ createdAt: -1 });

        // 5. Calcul des statistiques pour les compteurs du dashboard
        // On filtre sur 'toutesLesDemandes' pour avoir les chiffres globaux
        const demandeApprouveFull = toutesLesDemandes.filter(d => d.status === 'Approuve' || d.status === 'Offre envoyée');
        const demandeRejeteFull = toutesLesDemandes.filter(d => d.status === 'Rejete');
        const demandeEnAttente = toutesLesDemandes.filter(d => d.status === 'En attente');
        const demandeTerminees = toutesLesDemandes.filter(d => d.status === 'Termine');

        // 6. Construction de l'objet de réponse final
        // On respecte les clés utilisées dans tes useState frontend
        const response = {
            demandes: toutesLesDemandes, // Liste principale (filtrée ou non)
            nbrDemandeApprouve: demandeApprouveFull.length,
            nbrDemandeTerminees: demandeTerminees.length,
            nbrDemandeEnAttente: demandeEnAttente.length,
            nbrDemandeRejete: demandeRejeteFull.length,
            
            // On limite à 5 pour les sections "Récents" du dashboard
            demandeRejete: demandeRejeteFull.slice(0, 5), 
            demandeApprouve: demandeApprouveFull.slice(0, 5)
        };

        // 7. Envoi de la réponse
        res.status(200).json(response);

    } catch (error) {
        console.error("Erreur Backend geteDemandeForPro:", error);
        res.status(500).json({ 
            message: "Erreur lors de la récupération des demandes", 
            error: error.message 
        });
    }
};
exports.geteDemandeForClient = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const clientId = req.user._id;
    const status = req.query.status; // optionnel

    const filter = { client: clientId };

    if (status && status !== 'tous') {
      filter.status = status;
    }
    const touslesDemandesCount = await Demande.countDocuments({ client: clientId });
    const demandesTermineesCount = await Demande.countDocuments({ client: clientId, status: 'Termine' });
    const demandesEnAttenteCount = await Demande.countDocuments({ client: clientId, status: 'En attente' });
    const demandesOffreEnvoyeeCount = await Demande.countDocuments({ client: clientId, status: 'Offre envoyée' });
    const demandesApprouveCount = await Demande.countDocuments({ client: clientId, status: 'Approuve' });
    const demandesRejeteCount = await Demande.countDocuments({ client: clientId, status: 'Rejete' });
   
    const demandes = await Demande.find(filter)
      .populate({
        path: 'service',
        select: 'titre description prix professionnelId',
        populate: {
          path: 'professionnelId',
          select: 'nom prenom email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      demandes,
      touslesDemandesCount,
      demandesTermineesCount,
      demandesEnAttenteCount,
      demandesOffreEnvoyeeCount,
      demandesApprouveCount,
      demandesRejeteCount
    
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
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



}}