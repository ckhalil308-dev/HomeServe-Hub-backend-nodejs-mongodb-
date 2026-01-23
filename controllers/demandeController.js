const Demande=require('../models/Demande');
const Service=require('../models/Service');
exports.createDemande=async(req,res)=>{
    try{
        const{ service,description, prix, dateIntervention }=req.body; 
        const existService=await Service.findById(service);
        if(!existService){
            return res.status(404).json({message:"Service introuvable"});
        }
        prixService=existService.prix;
        if(prix<prixService){
            return res.status(400).json({message:`Le prix doit être au minimum ${prixService} TND`});
        }
    
        const DemandeData={
            client: req.user._id,
            service,
            description,
            prix,
            dateIntervention
        };
        existentDemande=await Demande.findOne({client:req.user._id, service, status: { $in: 'En attente' } });
        if(dateIntervention < new Date()){
            return res.status(400).json({message:"La date d'intervention doit être une date future"});
        }
        if(existentDemande){
            return res.status(400).json({message:"Vous avez déjà une demande en cours pour ce service"});
        }
        const nouvelleDemande=await Demande.create(DemandeData);

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
exports.geteDemandeForClient=async(req,res)=>{
    try{
        const {status}=req.query;

        const clientId=req.user._id;
        if(status=="tous"){
            const demandes=await Demande.find({client:clientId}).populate({
                path: 'service',
                select: 'titre description prix professionnelId',
                populate: {
                    path: 'professionnelId',
                    select: 'nom prenom email'
                }
            });
            return res.status(200).json(demandes);
        }
       const demandes = await Demande.find({ client: clientId, status: status })
      .populate({
        path: 'service',
       select: 'titre description prix professionnelId',
         populate: {
         path: 'professionnelId',
      select: 'nom prenom email'
    }
  });
        res.status(200).json(demandes);
    }   
    catch(error){
        res.status(500).json({message:"Erreur serveur" , error: error.message});
    }
}
exports.updateStatus=async(req,res)=>{
    try{
        const demandeId=req.params.id;
        const{ status }=req.body;
        const validStatus=['En attente','Approuve','Rejete'];
        if(!validStatus.includes(status)){
            return res.status(400).json({message:"Statut invalide"});
        }
        const demande=await Demande.findById(demandeId);
        if(!demande){
            return res.status(404).json({message:"Demande introuvable"});
        }   
        demande.status=status;
        await demande.save();
        res.status(200).json({message:"Statut mis à jour", demande});
    }
    catch(error){
        res.status(500).json({message:"Erreur serveur" , error: error.message});
    }
}

