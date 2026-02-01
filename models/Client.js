const User = require('./User');
const mongoose = require('mongoose');

const Client = User.discriminator('client', new mongoose.Schema({}));

module.exports = Client;