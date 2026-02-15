
const dotenv = require('dotenv');
 dotenv.config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.Grok_API_KEY });

exports.generateClientNeed = async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ message: "Topic manquant" });

        const categories = ['Plomberie', 'Électricité', 'Peinture', 'CVC', 'Réparations générales', 'Sécurité'];
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es un assistant qui classe les travaux. Réponds UNIQUEMENT avec un seul mot parmi cette liste : [${categories.join(', ')}]. Sans ponctuation.`
                },
                {
                    role: "user",
                    content: `Classe ce besoin : "${topic}"`
                }
            ],
            model: "llama-3.3-70b-versatile", // Modèle ultra performant
            temperature: 0.1, // Pour être très précis sur le choix du mot
        });

        const category = chatCompletion.choices[0]?.message?.content?.trim();

        res.status(200).json({ category: category || "Réparations générales" });

    } catch (error) {
        console.error("Erreur Groq:", error.message);
        res.status(500).json({ message: "Erreur lors de la classification", details: error.message });
    }
};
exports.UpdateDescription = async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) return res.status(400).json({ message: "Description manquante" });  
       const DescriptionUpdate = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Tu es un expert en rédaction professionnelle pour le secteur du bâtiment et des travaux. Ton rôle est de reformuler les descriptions pour les rendre claires, concises et professionnelles. Ne change jamais le sens technique. RÉPONDS UNIQUEMENT AVEC LE TEXTE REFORMULÉ. Ne commence pas par 'Voici la version reformulée' ou 'D'accord'."
                },
                {
                    role: "user",
                    content: `Reformule cette description de travaux : "${description}"`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3, // Slightly higher for better flow, but still focused
            max_tokens: 500,  
        });
        res.status(200).json({ updatedDescription: DescriptionUpdate.choices[0]?.message?.content?.trim() });
    }
    catch(error){
         console.error("UpdateDescription error:", error)
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}
exports.UpdateClientNeed = async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ message: "Topic manquant" });
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {   
                    role: "system",
                    content: "Tu es un assistant qui reformule les besoins des clients pour les rendre plus clairs et professionnels meme si si le text est en tunsien/arabe/angalis reformule avec la meeme language presnte . RÉPONDS UNIQUEMENT AVEC LE TEXTE REFORMULÉ."
                },
                {
                    role: "user",
                    content: `Reformule ce besoin : "${topic}"`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3, 
            max_tokens: 500, 
        });
        const reformulatedNeed = chatCompletion.choices[0]?.message?.content?.trim();
        res.status(200).json({ reformulatedNeed: reformulatedNeed || topic });
    }
    catch (error) {
        console.error("Erreur Groq:", error.message);
        res.status(500).json({ message: "Erreur lors de la reformulation", details: error.message });
    }
}   