const User=require('../models/User');

exports.getAllUsers=async(req,res)=>{
    try{
        const users=await User.find().select('-motDePasse');
        res.status(200).json(users);


    }
    catch(error){
        res.status(500).json({message:"Erreur serveur"});
    }



}

exports.getAllPros=async(req,res) =>{
    try{
        const pros=await User.find({role:'professionnel'}).select('-motDePasse');
        res.status(200).json(pros);
    }
    catch(error){
        res.status(500).json({message:"Erreur serveur"});
    }



}
exports.getAllClients=async(req,res) =>{
    try{
        const clients=await User.find({role:'client'}).select('-motDePasse');
        res.status(200).json(clients);
    }
    catch(error){
        res.status(500).json({message:"Erreur serveur"});
    }
}
exports.getInfos=async(req,res)=>{
    try{
        const id =req.user.id;
        const user= await User.findById(id).select('-motDePasse');
        if(!user){
            return res.status(404).json({message:"Utilisateur non trouvé"});
        }
        res.status(200).json(user);



    }
    catch(error){
        res.status(500).json({message:"Erreur serveur"});
    }
}
exports.getUserById=async(req,res)=>{
    try{
        const id=req.params.id;
        const user=await User.findById(id).select('-motDePasse');
        if(!user){
            return res.status(404).json({message:"Utilisateur non trouvé"});
        }
        res.status(200).json(user);
    }
    catch(error){
        res.status(500).json({message:"Erreur serveur"});
    }
}
exports.getProByspecialite=async(req,res)=>{
    try{
        const specilaite=req.params.specialite;
        const pro=await User.find({specialite:specilaite, role:'professionnel'}).select('-motDePasse');
        res.status(200).json(pro);
    }
    catch(erroe){
        res.status(500).json({message:"Erreur serveur"});
    }


}
exports.deleteUser=async(req,res)=>{
    try{
        const id=req.params.id;
        const user=await User.findByIdAndDelete(id);
        if(!user){
            return res.status(404).json({message:"Utilisateur non trouvé"});
        }
        res.status(200).json({message:"Utilisateur supprimé avec succès"});


    }
    catch(error){
        res.status(500).json({message:"Erreur serveur"});
    }
}
exports.updateMe=async(req,res)=>{
    try{
        const id=req.user.id;
        const user=await User.findByIdAndUpdate(id,req.body).select('-role');
        if(!user){
            return res.status(404).json({message:"Utilisateur non trouvé"});
        }
        res.status(200).json({message:"Utilisateur mis à jour avec succès", user});
    }
    catch(error){
        res.status(500).json({message:"Erreur serveur"});
    }
}