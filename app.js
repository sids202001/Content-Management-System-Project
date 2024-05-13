
require('dotenv').config();

// Import required modules
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import routes
const postRoutes = require('./server/routes/posts'); // adjust path as necessary
const commentRoutes = require('./server/routes/comments');


// Import database configuration and helpers
const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers');

// Create Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Use middleware to handle form data and JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use middleware for cookies and HTTP methods
app.use(cookieParser());
app.use(methodOverride('_method'));

// MongoDB URL from environment variables
const mongoUrl = 'mongodb+srv://sawantsiddhesh2:a8uRPg5Cz8LiuxRa@cluster0.6t6jx52.mongodb.net/';

// Configure session with MongoDB Store
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: mongoUrl,
  }),
}));

// Serve static files
app.use(express.static('public'));

// Configure templating engine
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Attach route helpers to app locals
app.locals.isActiveRoute = isActiveRoute;

// Use main, admin, and genre-specific routes
app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));
app.use('/', require('./server/routes/postsByGenre'));

// Use posts routes
app.use('/', require('./server/routes/posts'));
app.use('/', require('./server/routes/comments'));


// Start server listening on configured port
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
