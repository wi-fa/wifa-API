const mongoose = require('mongoose')

const Schema = mongoose.Schema;

// Schema for storing website statistics
const statsSchema = new mongoose.Schema({
    // Tracking the total number of page visits
    pageVisits: { type: Number, default: 0 },
    // Tracking the total number of contact form submissions
    formSubmissions: { type: Number, default: 0 },
    // Tracking the daily vistits and storing them in an array
    dailyVisits: [{ date: Date, count: Number }],
    // Mapping the page visits by page name
    pageVisitCounts: { type: Map, of: Number, default: () => new Map() }
})

// Creating stats model from schema
const Stats = mongoose.model('Stats', statsSchema)

module.exports = Stats
