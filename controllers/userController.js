const User=require('../models/User');
const bcrypt=require('bcrypt');

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
        const id =req.user._id;
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
exports.chnagerMotDePasse=async(req,res)=>{
    try{
        const id=req.user._id;
        const {ancienMotDePasse,nouveauMotDePasse}=req.body;
        const user=await User.findById(id);
        const isMatch=await bcrypt.compare(ancienMotDePasse,user.motDePasse);   
        if(!isMatch){
            return res.status(400).json({message:"Ancien mot de passe incorrect"});
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPass=await bcrypt.hash(nouveauMotDePasse,salt);
        user.motDePasse=hashedPass;
        await user.save();
        res.status(200).json({message:"Mot de passe changé avec succès"});
    }
    catch(error){
        res.status(500).json({message:"Erreur serveur"});
    }   

}   