const User = require('./User');
const mongoose = require('mongoose');

const Professionnel = User.discriminator(
    'professionnel',
    new mongoose.Schema({
        specialite: { type: String, required: true }
    })
);

module.exports = Professionnel;