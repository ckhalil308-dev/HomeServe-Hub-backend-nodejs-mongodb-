const mongoose=require('mongoose');
const serviceSchema=new mongoose.Schema({
    titre:{type:String,required:true},
    description:{type:String,required:true},
    prix:{type:Number,required:true},
    category:{type:String,required:true},
    professionnelId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    imagesUrls:[String],
} ,{timestamps:true});

const Service=mongoose.model('Service',serviceSchema);
module.exports=Service;
    
