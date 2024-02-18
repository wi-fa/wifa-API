// server.js
const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const app = express()
const cors = require('cors')
const routes = require('./routes')
// const pageVisitRoutes = require('./routes')
const PORT = process.env.PORT || 3030
require('dotenv').config()

// Connect to db using Mongoose
mongoose
    // Connection string to db
    .connect(process.env.MONGODB_URI)
    .then(() => {
        // If connection works i success messages logs
        console.log('Connected to MongoDB Atlas')
    })
    .catch((err) => {
        // If error a error message is logged
        console.error('MongoDB connection error', err)
    })

app.use(cors({
    origin: 'http://localhost:5173'
}))

// Serve static files from the 'public' directory
app.use(express.static('public'))

// Parse URL-encoded
app.use(express.urlencoded({ extended: false }))

app.use(express.json())

// Import and use the routes defined in api.js
app.use('/', routes)

// Additional routes for page visit statistics
// app.use('/api', pageVisitRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err)

    // Render the error.ejs template with the error message
    res.status(500).render('error', { error: err })
})

// Start the server on the specified PORT
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
