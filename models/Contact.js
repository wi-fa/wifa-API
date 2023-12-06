const mongoose = require('mongoose')

const Schema = mongoose.Schema;

// Schema for contact form submissions
const contactSchema = new mongoose.Schema({
    // Setting fields for the contact form
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    phone: {
        type: String,
        required: true,
        match: [/^\d{10}$/, 'Please enter a valid phone number']
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    }
})

// Creating contact model from schema
const Contact = mongoose.model('Contact', contactSchema)

module.exports = Contact
