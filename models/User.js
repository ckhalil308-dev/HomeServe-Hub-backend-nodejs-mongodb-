const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    motDePasse: { type: String, required: true, minlength: 8 },
    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false }
}, {
    timestamps: true,
    discriminatorKey: 'role' 
});

const User = mongoose.model('User', userSchema);

module.exports = User;
