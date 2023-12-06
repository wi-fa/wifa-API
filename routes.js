const express = require('express')
const router = express.Router()
const multer = require('multer')
const Stats = require('./models/stats')
const Portfolio = require('./models/portfolio')
const Contact = require('./models/contact')
const Page = require('./models/page')
const User = require('./models/user')
const authenticateToken = require('./authMiddleware');


// POST route for my /contact endpoint (contact form)
router.post('/contact', async (req, res) => {
    try {
        // Creating a new contact item in my contact collection with the data collected from contact form with request body data
        const newContact = new Contact({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            subject: req.body.subject,
            message: req.body.message
        })

        // Saving the new contact info to db
        await newContact.save()

        // Fetching the current stats doc from db
        const stats = await Stats.findOne()

        // Checks if stats docs exist in db
        if (!stats) {
            // If it doesnt, we create a new one and setting pageVisits to 0 and formSubmissions to 1
            await Stats.create({ pageVisits: 0, formSubmissions: 1 })
        } else {
            // And if it exist we increment the formSubmission by 1
            await Stats.updateOne({}, { $inc: { formSubmissions: 1 } })
        }

        // After saving the contact data and updating the stats user is redirected to thanks.ejs
        res.redirect('thanks')
    } catch (error) {
        // If an error occurs we send a error response and log the error to console.
        console.error('Failed to save contact info')
        res.status(500).send('Failed to save contact info')
    }
})

// GET route for fetching contact data from db
router.get('/api/fetch-contactdata', async (req, res) => {
    try {
        // Fetching all data from the page collection in db
        // Storing the data in a variable
        const contactData = await Contact.find({})
        // Sending back the data as JSON
        res.json(contactData)
    } catch (error) {
        // If error we log it to console and send a error res
        console.error('Database fetch error:', error)
        res.status(500).json({
            error: 'Failed to fetch data from the database'
        })
    }
})

// GET route for portfolio page
router.get('/portfolio', async (req, res) => {
    // Calling the tracking function and passing portfolio as pageName
    await recordPageVisit('portfolio', req)
    try {
        // Fetch all docs for the portfolio collection in db
        const portfolioItems = await Portfolio.find({})

        // Checks if there is no item found
        if (portfolioItems.length === 0) {
            // If no items found we log it to the console
            console.log('No portfolio items found.')
        }
        // Render portfolio.ejs passing the fetched portfolio items to the ejs template
        res.render('portfolio', { portfolioItems: portfolioItems })
    } catch (error) {
        // If a error occurs and we could fetch the portfolio items we log it to console
        console.error('Failer to fetch portfolio items', error)
        res.status(500).send('Server Error')
    }
})


// GET route for admin page
router.get('/admin', (req, res) => {
    // Render adminLogin.ejs
    res.render('adminLogin')
})

// POST route for admin page (login form)
router.post('/admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (user && await bcrypt.compare(password, user.hash)) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.json({ token });
        } else {
            res.status(401).send('Invalid username or password');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error during login');
    }
});

// GET route for logout page (that doenst exist yet xD )
router.get('/logout', (req, res) => {
    req.logout()
    // When logged out you get redirected to the home page
    res.redirect('/admin')
})

// GET route for the dashboard!
router.get('/admin-dashboard', authenticateToken, (req, res) => {
    // Render adminDashboard.ejs
    res.render('adminDashboard') // Here its verry important that the user is authenticated!
})

//Get route for /api/page-stats endpoint
router.get('/api/page-stats', async (req, res) => {
    try {
        // Retrieve the 'days' query parameter with a default of 7 days if not specified
        const days = parseInt(req.query.days) || 7

        // Calculate the start date based on the 'days' parameter
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        const stats = await Stats.findOne()

        if (stats) {
            // Filter dailyVisits for the last 'days' days
            const filteredDailyVisits = stats.dailyVisits.filter((visit) => {
                const visitDate = new Date(visit.date)
                return visitDate >= startDate
            })

            // Prepare and send the response
            res.json({
                dailyVisits: filteredDailyVisits.map((visit) => visit.count),
                totalPageVisits: stats.pageVisits,
                totalFormSubmissions: stats.formSubmissions,
                pageVisitCounts: Array.from(stats.pageVisitCounts || new Map())
            })
        } else {
            // Default response if no stats are found
            res.json({
                dailyVisits: Array(days).fill(0),
                totalPageVisits: 0,
                totalFormSubmissions: 0,
                pageVisitCounts: []
            })
        }
    } catch (error) {
        // If there is any problem fetching the data we log and sending error response.
        console.error('Error fetching stats:', error)
        res.status(500).send('Error fetching stats')
    }
})

// GET route for fetching data from db
router.get('/api/fetch-pagedata', async (req, res) => {
    try {
        // Fetching all data from the page collection in db
        // Storing the data in a variable
        const pages = await Page.find({})
        // Sending back the data as JSON
        res.json(pages)
    } catch (error) {
        // If error we log it to console and send a error res
        console.error('Database fetch error:', error)
        res.status(500).json({
            error: 'Failed to fetch data from the database'
        })
    }
})

// GET route for the admin portfolio managemnet page
router.get(
    '/admin-dashboard/portfolio',
    authenticateToken,
    async (req, res) => {
        try {
            // Fetching all portfolio item from db
            const portfolioItems = await Portfolio.find({}).lean()
            if (portfolioItems.length === 0) {
                //If no items are found we log a message
                console.log('No portfolio items found.')
            }
            // Render adminPortfolio.ejs and passing the fetched portfolio items
            res.render('adminPortfolio', { portfolioItems: portfolioItems })
        } catch (error) {
            // And again we log and send a error res if theres any problem with the fetch
            console.error('Failer to fetch portfolio items', error)
            res.status(500).send('Server Error')
        }
    }
)

// Multer disk storage config for image uploads
const storage = multer.diskStorage({
    // Here we choose the destination for the files thats uploaded
    destination: function (req, file, cb) {
        cb(null, 'public/images/')
    },
    // Here we choose the naming for the uploaded files.
    filename: function (req, file, cb) {
        // adding a timestamp to filename
        cb(null, Date.now() + '-' + file.originalname)
    }
})

// Creating a multer instance with storage configuration
const upload = multer({ storage: storage })

// GET route for adding a new portfolio item
router.get(
    '/admin-dashboard/portfolio/add-item',
    authenticateToken,
    (req, res) => {
        // Render addPortfolioItem.ejs
        res.render('addPortfolioItem')
    }
)

// POST route for adding a new portfolio item
router.post(
    '/admin-dashboard/portfolio/add-item',
    authenticateToken,
    upload.single('projectImg'), // Here we also use multer to upload the image
    async (req, res) => {
        // If the file (image) isnt uploaded we send a error response
        if (!req.file) {
            return res.status(400).send('No file uploaded.')
        }

        // Creating a new portfolio item using request body
        const newItem = new Portfolio({
            projectType: req.body.projectType,
            projectName: req.body.projectName,
            projectDescription: req.body.projectDescription,
            projectTools: req.body.projectTools,
            projectLink: {
                url: req.body.projectLinkUrl
            },
            projectImg: req.file.path.replace('public', ''), // Check if there's an uploaded file and adjust the path
            projectImgAlt: req.body.projectImgAlt // Make sure you have an input field named 'projectImgAlt' in your form
        })

        // Saving the new item to db
        try {
            await newItem.save()
            // Logging the new item to console
            console.log('New item saved:', newItem)
            // Redirecting back to the portfolio overview page
            res.redirect('/admin-dashboard/portfolio')
        } catch (error) {
            // If error we log it to console and send a error response
            console.error('Error saving new item:', error)
            res.status(500).send('Failed to add new item')
        }
    }
)

// GET route for editing a specific portfolio item
router.get(
    '/admin-dashboard/portfolio/edit-item/:id',
    authenticateToken,
    async (req, res) => {
        try {
            // Fetching the portfolio item by ID from the URL
            const item = await Portfolio.findById(req.params.id).lean()
            if (!item) {
                // If item cant be found, sending back a 404
                return res.status(404).send('Item not found')
            }
            // Sending back the item data as JSON
            res.json(item)
        } catch (error) {
            // If problem with fetch we send and log error response
            console.error('Failed to fetch item for editing:', error)
            res.status(500).send('Server Error')
        }
    }
)

// POST route for specific portfolio item edit form, also using multer for image uploads
router.post(
    '/admin-dashboard/portfolio/edit-item/:id',
    authenticateToken,
    upload.single('projectImg'),
    async (req, res) => {
        try {
            // Collecting form data with request body
            const updateData = {
                projectType: req.body.projectType,
                projectName: req.body.projectName,
                projectDescription: req.body.projectDescription,
                projectTools: req.body.projectTools,
                projectLink: { url: req.body.projectLinkUrl },
                projectImgAlt: req.body.projectImgAlt
            }

            // If a new image was uploaded, update the image path
            if (req.file) {
                updateData.projectImg = '/public/images/' + req.file.filename
            }

            // Find the portfolio item by ID and update it with new data
            await Portfolio.findByIdAndUpdate(req.params.id, updateData)

            // Redirect to the portfolio overview page or send a success response
            res.redirect('/admin-dashboard/portfolio')
        } catch (error) {
            console.error('Failed to update portfolio item:', error)
            res.status(500).send('Error updating the portfolio item')
        }
    }
)

// DELETE route for deleting a specific portfolio item
router.delete(
    '/admin-dashboard/portfolio/delete-item/:id',
    authenticateToken,
    async (req, res) => {
        try {
            // Here we locating the item by ID then deleting it as the function suggests :)
            await Portfolio.findByIdAndDelete(req.params.id)
            // Sending back a success res
            res.status(200).send('Item deleted')
        } catch (error) {
            // If error we log it to console and send a error response
            console.error('Error deleting portfolio item:', error)
            res.status(500).send('Error deleting portfolio item')
        }
    }
)

// GET route for traffic page
router.get('/admin-dashboard/traffic', authenticateToken, (req, res) => {
    // Render adminTraffic.ejs
    res.render('adminTraffic')
})

// GET route for messages page
router.get(
    '/admin-dashboard/messages',
    authenticateToken,
    async (req, res) => {
        // Setting how many messages per page
        let perPage = 3
        let page = req.query.page || 1 // Setting the current page to 1

        try {
            // Fetching all messages from db
            const messages = await Contact.find({})
                // Setting up pagination with skip and limit
                .skip(perPage * page - perPage)
                .limit(perPage)
                .lean()

            // Counting the total number of messages
            const count = await Contact.countDocuments()
            // Calculating the total number of pages with math.ceil
            const pages = Math.ceil(count / perPage)
            console.log('Pages:', pages) // Logging how many pages there is in total

            // Render adminMessages.ejs and passing the messages, current page and total number of pages
            res.render('adminMessages', {
                messages: messages,
                current: page,
                pages: Math.ceil(count / perPage)
            })
        } catch (error) {
            // If error we log it to console and send a error res
            console.error('Error fetching messages:', error)
            res.status(500).send('Server Error')
        }
    }
)

// GET route for dummy error page
router.get('/example-error', (req, res, next) => {
    try {
        // This will intentionally throw an error
        throw new Error('This is an example error')
    } catch (error) {
        console.error('Caught an error:', error)
        // Throwing the error to the error middleware
        next(error)
    }
})

// GET route for dummy 404 page
router.get('*', (req, res) => {
    // Handle all other routes, including custom error rendering
    res.render('404', { is404: true })
})

// Exporting the router
module.exports = router
