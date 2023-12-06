const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const saltRounds = 10

const Schema = mongoose.Schema;

// User schema for authentication
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    hash: { type: String, required: true }
})

userSchema.pre('save', function (next) {
    if (this.isModified('hash')) {
        bcrypt.hash(this.hash, saltRounds, (err, hash) => {
            if (err) {
                return next(err)
            }
            this.hash = hash
            next()
        })
    } else {
        next()
    }
})

// Creating user model from schema
const User = mongoose.model('User', userSchema)

module.exports = User
