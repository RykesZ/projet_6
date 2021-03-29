const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// Modèle de user utilisé pour la création d'objets user dans la base de données
const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);