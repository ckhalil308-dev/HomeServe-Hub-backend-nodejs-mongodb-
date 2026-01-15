const mongoose = require('mongoose');
const Service = require("../models/Service");
const dotenv = require('dotenv');

// Remplace par ta vraie URL de connexion
const MONGO_URI = "mongodb://localhost:27017/service_hub" ;

const createTestService = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connexion réussie pour le test...");

        const serviceData = {
            titre: "Service Test Temporaire",
            description: "A supprimer plus tard",
            prix: 99,
            category: "Test",
            professionnelId: "6967e653e853246509d0f181", 
            imagesUrls: []
        };

        const tempService = await Service.create(serviceData);
        console.log("✅ SERVICE CRÉÉ :", tempService._id);
        
        await mongoose.connection.close(); // On ferme proprement
    } catch (err) {
        console.error("❌ ERREUR :", err.message);
    }
};

createTestService();