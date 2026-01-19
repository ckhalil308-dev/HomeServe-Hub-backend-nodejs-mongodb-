const Service = require("../models/Service");

    exports.getAllServices = async(req, res) => {
        try {
            const { category, minPrice, maxPrice } = req.query;  
            
            let filter = {};
            if(category) {
                filter.category = category;
            }
            if(minPrice || maxPrice) {
                filter.prix = {};
                if(minPrice) filter.prix.$gte = Number(minPrice);  
                if(maxPrice) filter.prix.$lte = Number(maxPrice);  
            }
            
            const services = await Service.find(filter).populate('professionnelId', 'nom prenom email');
            res.status(200).json(services);
        }
        catch(error) {
            res.status(500).json({message: error.message});
        }
    }
exports.getServiceById=async(req,res)=>{
    try{
        const id=req.params.id;
        const service=await Service.findById(id).populate('professionnelId', 'nom prenom email');
        if(!service){
            return res.status(404).json({message:"Service not found"});
        }
        res.status(200).json(service);
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
}
exports.createService=async(req,res)=>{
    try{
        const professionnelId=req.user._id;
        const {titre,description,prix,category}=req.body;
        const images = req.files.map(file => file.path);
        const ServiceData={
            titre,
            description,
            prix,
            category,
            professionnelId,
            imagesUrls: images
        };
        const newService=await Service.create(ServiceData);
        res.status(201).json(newService);
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
}
exports.deleteService=async(req,res)=>{
    try{
        const id=req.params.id;
        const service=await Service.findById(id);
        if(!service){
            return res.status(404).json({message:"Service not found"});
        }
        if(service.professionnelId.toString()!==req.user._id.toString()){
            return res.status(403).json({message:"Not authorized"});
        }
        await Service.findByIdAndDelete(id);
        res.status(200).json({message:"Service deleted"});          
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
}
exports.updateService=async(req,res)=>{
    try{
        const id=req.params.id;
        const updates=req.body;
        const service=await Service.findById(id);
        if(!service){
            return res.status(404).json({message:"Service not found"});
        }
        if(service.professionnelId.toString()!==req.user._id.toString()){
            return res.status(403).json({message:"Not authorized"});  
        }
        const updatedService=await Service.findByIdAndUpdate(id,updates,{new:true});
        res.status(200).json(updatedService);
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
}
exports.getServiceByProfessionnel=async(req,res)=>{
    try{
        const professionnelId=req.user._id;
        const services=await Service.find({professionnelId});
        if(services.length===0){
            return res.status(404).json({message:"No services found for this professionnel"});
        }
        res.status(200).json(services);
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
}

