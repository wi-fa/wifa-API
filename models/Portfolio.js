const mongoose = require('mongoose')

const Schema = mongoose.Schema;

// Schema for portfolio items
const portfolioSchema = new mongoose.Schema({
    // Setting fields for the portfolio items
    projectType: String,
    projectName: String,
    projectDescription: String,
    projectTools: String,
    projectLink: {
        text: { type: String, default: 'Visit the app' },
        url: String
    },
    // URL or path to the project image
    projectImg: String,
    // Alt text for the project image
    projectImgAlt: String
})

// Creating portfolio model from schema
const Portfolio = mongoose.model('Portfolio', portfolioSchema)

module.exports = Portfolio
