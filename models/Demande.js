const mongoose=require('mongoose');

const demandeSchema=new mongoose.Schema({

    status:{type:String,required:true,enum:['En attente','Approuve','Rejete'],default:'En attente'},

    description:{type:String,required:true},

    prix:{type:Number,required:true},

    client:{

        type:mongoose.Schema.Types.ObjectId,ref:'User',required:true

    },

    service:{
                    
        type:mongoose.Schema.Types.ObjectId,ref:'Service',required:true

    },

    dateIntervention:{type:Date,required:true},







} ,{timestamps:true});
module.exports=mongoose.model('Demande',demandeSchema);