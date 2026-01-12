const  mongoose  = require('mongoose');
const userShema=new mongoose.Schema({
    nom:{type:String,required:true},
    prenom:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    motDePasse:{type:String,required:true},
    role:{type:String,enum:['admin','client','professionnel'], default:'client'},
    specialite:{type:String,required:
        function () {
            return this.role === 'professionnel';
            
        }
    },
   


},{timestamps:true});
const User=mongoose.model('User',userShema);
module.exports=User;