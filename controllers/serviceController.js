const Service = require("../models/Service");
const User = require("../models/User");
const Demande = require("../models/Demande");

exports.getAllServices = async (req, res) => {
    try {
        const limit = 9;
        const { category, minPrice, maxPrice,page = 1 ,search= "" } = req.query;

        let filter = {};
        if (category && category !== 'tous') {
            filter.category = category;
        }
        if (minPrice || maxPrice) {
            filter.prix = {};
            if (minPrice) filter.prix.$gte = Number(minPrice);
            if (maxPrice) filter.prix.$lte = Number(maxPrice);
        }
        if (search) {
            filter.titre = { $regex: search, $options: 'i' };
        }

        const services = await Service.find(filter).limit(limit).skip((page - 1) * limit).populate('professionnelId', 'nom prenom email');
        res.status(200).json({services,
                              totalPages: Math.ceil(await Service.countDocuments(filter) / limit),
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.getServiceById = async (req, res) => {
    try {
        const id = req.params.id;
        const service = await Service.findById(id).populate('professionnelId', 'nom prenom email');
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.status(200).json(service);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
    exports.createService = async (req, res) => {
        try {
            const professionnelId = req.user._id;
            const { titre, description, prix, category } = req.body;
            const images = req.files.map(file => file.path);
            const professionnel = await User.findById(professionnelId);
            if(!professionnel.isVerified){
                return res.status(403).json({message:"Votre compte doit être vérifié pour ajouter un service"});
            }
            const ServiceData = {
                titre,
                description,
                prix,
                category,
                professionnelId,
                imagesUrls: images
            };
            const newService = await Service.create(ServiceData);
            res.status(201).json(newService);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
exports.deleteService = async (req, res) => {
    try {
        const id = req.params.id;
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        if (service.professionnelId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        await Demande.deleteMany({  service: id });
        await Service.findByIdAndDelete(id);
        res.status(200).json({ message: "Service deleted" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getServiceByProfessionnel = async (req, res) => {
    try {
        const professionnelId = req.user._id;
        const services = await Service.find({ professionnelId });
        if (services.length === 0) {
            return res.status(404).json({ message: "No services found for this professionnel" });
        }
        res.status(200).json(services);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.updateService = async (req, res) => { 
  try { 
    const id = req.params.id;
    const titre = req.body.titre;
    const description = req.body.description;
    const prix = req.body.prix;
    const existingImages = req.body.existingImages;
    
    console.log("Files received:", req.files);
    console.log("Body:", req.body);
    
    const service = await Service.findById(id); 
    if (!service) { 
      return res.status(404).json({ message: "Service not found" }); 
    } 
    
    if (service.professionnelId.toString() !== req.user._id.toString()) { 
      return res.status(403).json({ message: "Not authorized" }); 
    }
    let imagesUrls = [];

    if (existingImages && existingImages !== 'undefined') {
      try {
        imagesUrls = JSON.parse(existingImages);
      } catch (e) {
        imagesUrls = service.imagesUrls || [];
      }
    } else {
      imagesUrls = service.imagesUrls || [];
    }

    if (req.files && req.files.length > 0) {
      console.log("Adding new files...");
      req.files.forEach(file => {
        imagesUrls.push(`/uploads/${file.filename}`);
      });
    }
    
    console.log("Final images:", imagesUrls);
    
    const updatedService = await Service.findByIdAndUpdate(
      id, 
      { 
        titre, 
        description, 
        prix,
        imagesUrls
      }, 
      { new: true }
    );
    
    console.log("Updated service:", updatedService);
    res.status(200).json(updatedService); 
  } 
  catch (error) { 
    console.error("Full error:", error);
    res.status(500).json({ message: error.message }); 
  } 
}
