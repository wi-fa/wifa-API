const mongoose = require('mongoose')

const Schema = mongoose.Schema;

// Schema for page content
const pageContentSchema = new Schema({
    type: { type: String, required: true },
    // Setting to mixed type so we can store any type of data
    content: Schema.Types.Mixed
})

// Schema for website pages
const pageSchema = new mongoose.Schema({
    // Setting fields for each page on the website
    link: {
        text: String,
        url: String
    },
    navButton: String,
    pageTitle: String,
    header: String,
    headerParagraph: String,
    pageSymbol: String,
    // Array of page content from the schema above
    pageContent: [pageContentSchema]
})

// Creating page model from schema
const Page = mongoose.model('Page', pageSchema)

module.exports = Page
