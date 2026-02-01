
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