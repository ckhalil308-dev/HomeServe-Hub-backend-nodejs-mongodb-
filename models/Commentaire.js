const mongoose=require('mongoose');
const commentaireSchema=new mongoose.Schema({
    service:{type:mongoose.Schema.Types.ObjectId,ref:'Service',required:true},
   auteur:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    contenu:{type:String,required:true},
    note:{type:Number,required:true,min:1,max:5},




} ,{timestamps:true});
const Commentaire=mongoose.model('Commentaire',commentaireSchema);
module.exports=Commentaire;