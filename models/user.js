const mongoose = require('mongoose');
const {Schema, model} = mongoose

const UserSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, unique: true, min: 6 },
    passwordConfirmation: { type: String, required: true, unique: true, min: 6 },
  });

const UserModel = model('User', UserSchema)

module.exports = UserModel

