const Demande=require('../models/Demande');
const Service=require('../models/Service');
exports.createDemande=async(req,res)=>{
    try{
        const{ service,description, prix, dateIntervention }=req.body; 
        const nouvelleDemande = new Demande({
            status: 'en attente',
            description,
            prix,
            client: req.user._id,
            service,
            dateIntervention
        });

        await nouvelleDemande.save();
        res.status(201).json({ message: "Demande créée", demande: nouvelleDemande  });

    }
    catch(error){
        return res.status(500).json({message:'Server Error', error: error.message});

    }



}
exports.geteDemandeForPro=async(req,res)=>{
    try{
        const proId=req.user._id;
        const services=await Service.find({professionnelId:proId}).select('_id');
        const mesServicesIds=services.map(service=>service._id);
        const demandes=await Demande.find({service:{$in:mesServicesIds}}).populate('client','nom prenom email').populate('service','nom titre description prix');
        res.status(200).json(demandes);
    }
    catch(error){
        res.status(500).json({message:"Erreur serveur" , error: error.message});


    }
}
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(req.body);
        const { status } = req.body; 
        const demande = await Demande.findById(id).populate('service');
        
        if (!demande) return res.status(404).json({ message: "Introuvable" });

        if (demande.service.professionnelId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Non autorisé" });
        }

        demande.status = status;
        await demande.save();

        res.status(200).json({ message: "Statut mis à jour", demande });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};
