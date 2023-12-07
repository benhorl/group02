// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const path = require('path');
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
//const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.
const sdk = require('api')('@yelp-developers/v1.0#xtskmqwlofwyovu'); // Yelp Fusion search function
const sdkR = require('api')('@yelp-developers/v1.0#1a49qhalkmfd1mf'); // Yelp Fusion review function
const { decode } = require('querystring');

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS

app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use(express.static(path.join(__dirname, 'views', 'static')));

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// Authentication Middleware.

let globalSearch = ''; // global variable for persistence across pages
let restaurants = []; // global restaurant storage
let businessID // global restaurant signifier storage

const auth = (req, res, next) => {
    if (!req.session.user) {
        // Default to login page.
        return res.redirect('/login');
    }
    next();
};

// Default
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home', (req, res) => {
    res.render('pages/home', { user: req.session.user, location: req.session.location, globalSearch });
});

// Register
app.get('/register', (req, res) => {
    res.render('pages/register', { user: req.session.user, location: req.session.location, globalSearch });
});

app.post('/register', async (req, res) => {
    // Hash the password using bcrypt library
    const hash = await bcrypt.hash(req.body.password, 10);
    const { username, password, preferences, state, city } = req.body;

    const query = 'INSERT INTO users (username, password, preferences, state, city) VALUES ($1, $2, $3, $4, $5)';
    const values = [username.toLowerCase(), hash, preferences, state, city]; //makes sure usernames cannot be repeated
    
    db.none(query, values)
        .then(() => { //success state
            console.log('User registered successfully');
            app.locals.message = 'User registered successfully';
            app.locals.error = ''; // sets message color to be green
            res.redirect('/login');
        })
        .catch((error) => {
            console.error('Error registering user:', error);
            app.locals.message = 'Please select a unique username';
            app.locals.error = 'danger'; // sets message color to be red
            res.redirect('/register'); // directs back to register for another attempt
        });
});

// Login
app.get('/login', (req, res) => {
    res.render('pages/login', { user: req.session.user, location: req.session.location, globalSearch });
});

app.post('/login', async (req, res, next) => {
    const { username, password } = req.body;

    try {
        const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
        // One or none check for usernames; would indicate database error 

        if (user) {
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                app.locals.message = ''; // clears message

                req.session.user = user; // sets session username

                res.redirect('/home'); // directs to home page
            } else {
                app.locals.message = 'Incorrect username or password';
                app.locals.error = 'danger'; // sets message color to red
                res.redirect('/login'); // directs back to login
            }
        } else {
            app.locals.message = 'Please create an account';
            app.locals.error = ''; // message color to green
            res.redirect('/register'); //directs user to create account
        }

    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Search
app.get('/search', async (req, res) => {
    let resArr;
    let strArr = req._parsedOriginalUrl.query.split("&"); // string manipulation to separate location and term
    const place = decodeURIComponent(strArr[0].slice(2)).replace('+', '\xa0'); // string slicing to remove extraneous characters
    const search = decodeURIComponent(strArr[1].slice(2)).replace('+', '\xa0'); // and remove url formating

    globalSearch = search;

    let userWishlist = [];

    if (req.session.user) { //if there is a user logged in
        const username = req.session.user.username;
        const wishlist = await db.any('SELECT alias FROM wishlist WHERE username = $1', [username]);
        userWishlist = wishlist.map(item => item.alias);

    }
    req.session.location = place; //saves location selected to session
    req.session.save();


    sdk.auth(process.env.API_KEY); //https://docs.developer.yelp.com/reference/v3_business_search
    await sdk.v3_business_search({ location: place, term: search, sort_by: 'best_match', limit: '10' })
        .then(results => {
            resArr = results.data.businesses;
            for (let i = 0; i < resArr.length; i++) {
                restaurants[i] = resArr[i].name + "+" + resArr[i].alias; //generates list of restaurants with unique signifier attached
            } // feeds restaurant information to search results page
            res.render('pages/search', { user: req.session.user, search: resArr, userWishlist, location: req.session.location, globalSearch });
        })
        .catch(err => console.error(err));
})

// Reviews
app.get('/reviews/:id', async (req, res) => { // reviews for given website
    sdkR.auth(process.env.API_KEY);
    businessID = req.params.id;
    let str;
    let msg;

    for (let i = 0; i < restaurants.length; i++) {
        str = restaurants[i].split("+"); // splits restaurant name and unique signifier
        if (str[1] == businessID)
            msg = str[0]; // finds correct restaurant name to display on page
    }
    //https://docs.developer.yelp.com/reference/v3_business_reviews
    sdkR.v3_business_reviews({ limit: '5', sort_by: 'yelp_sort', business_id_or_alias: businessID })
        .then(results => {
            resArr = results.data.reviews; // Yelp's existing reviews
            db.any(`SELECT * FROM posts WHERE alias = '${businessID}';`) // our reviews
                .then(data => { // both are fed into the reviews page
                    res.render('pages/reviews', { user: req.session.user, location: req.session.location, yelp: resArr, reviews: data, name: msg, globalSearch });
                })


        })
        .catch(err => console.error(err));
})

// Profile
app.get('/profile/:Username?', async (req, res) => {
    const currentUser = req.session.user; // logged in user

    if (req.params.Username) {
        // selected username in URL
        const viewedUsername = req.params.Username.toLowerCase();
        // db entry with the same username
        const viewedUser = await db.oneOrNone('SELECT * FROM users WHERE username ILIKE $1', [viewedUsername]);

        if (currentUser && viewedUsername === currentUser.username.toLowerCase()) {
            // gets reviews written by logged in user
            const reviews = await db.any('SELECT * FROM posts WHERE username ILIKE $1', [currentUser.username]);

            res.render('pages/profile', { user: currentUser, location: req.session.location, reviews, globalSearch });
        } else if (viewedUser) {
            // gets reviews for selected user
            const reviews = await db.any('SELECT * FROM posts WHERE username ILIKE $1', [viewedUsername]);
            // gets wishlist for selected user
            const wishlist = await db.any('SELECT * FROM wishlist WHERE username ILIKE $1', [viewedUsername]);

            res.render('pages/other-profile', { user: currentUser, viewedUser, location: req.session.location, globalSearch, reviews, wishlist });
        } else {
            res.status(404).send('User not found!');
        }
    } else if (currentUser) {
        // if no username provided, default to logged in user
        const reviews = await db.any('SELECT * FROM posts WHERE username ILIKE $1', [currentUser.username]);

        res.render('pages/profile', { user: currentUser, location: req.session.location, reviews, globalSearch });
    } else {
        res.redirect('/login');
    }
});

// Profile wishlist
app.get('/wishlist/', async (req, res) => {
    if (req.session.user) {
        const currentUser = req.session.user;

        // displays logged in user's wishlist as a separate page
        const wishlist = await db.any('SELECT * FROM wishlist WHERE username ILIKE $1', [currentUser.username]);

        res.render('pages/wishlist', { user: currentUser, location: req.session.location, wishlist, globalSearch });
    }
    else
        res.redirect('/login');


});

// New review
app.get('/posts/new/', (req, res) => {
    let str;
    let msg;
    for (let i = 0; i < restaurants.length; i++) {
        str = restaurants[i].split("+"); // splits restaurant name and unique signifier
        if (str[1] == businessID)
            msg = str[0]; // collects correct restaurant name
    }
    if (req.session.user) // if logged in, feeds information into form
        res.render('pages/new-post', { user: req.session.user, location: req.session.location, locals: businessID, name: msg, globalSearch });
    else // if not logged in, asks for login
        res.redirect('/login');
});

app.post("/posts/add/", (req, res) => {
    const { user, restaurantName, locationOf, postContent, starRating, alias } = req.body;
    // Inserts new review from information generated from /posts/new's form

    db.none('INSERT INTO posts (username, restaurant, located, content, rating, alias) VALUES($1, $2, $3, $4, $5, $6)', [user, restaurantName, locationOf, postContent, starRating, alias])
        .then(() => {
            res.redirect('/reviews/' + alias);
        })
        .catch((error) => {
            console.error(error);
            res.send('An error occurred');
        });
});

//Remove post
//TODO attach to reviews
app.post("/posts/delete/:id", (req, res) => {
    const postId = req.params.id;

    db.none('DELETE FROM posts WHERE id = $1', [postId])
        .then(() => {
            res.redirect('/posts');
        })
        .catch((error) => {
            console.error(error);
            res.send('An error occurred');
        });
});

// Add to wishlist
app.post('/wishlist/:username/:restaurant/:located/:alias', async (req, res) => {
    const { username, restaurant, located, alias } = req.params;

    const duplicate = await db.oneOrNone('SELECT * FROM wishlist WHERE username = $1 AND restaurant = $2 AND located = $3 AND alias = $4', [username, restaurant, located, alias]);

    if (duplicate) {
        // Restaurant is already in the wishlist, return an error response
        return res.status(400).send('Restaurant already in the wishlist');
    }
    db.none('INSERT INTO wishlist(username, restaurant, located, alias) VALUES($1, $2, $3, $4)', [username, restaurant, located, alias])
        .then(() => { // inserts restaurant into wishlist associated with username
            res.status(200).send('Added to wishlist successfully');
        })
        .catch((error) => {
            console.error('Error:', error);
            res.status(500).send('Internal Server Error');
        });
});

// Delete from wishlist
app.delete('/wishlist/:username/:restaurant/:located/:alias', (req, res) => {
    const { username, restaurant, located, alias } = req.params;

    db.none('DELETE FROM wishlist WHERE username = $1 AND restaurant = $2 AND located = $3 AND alias = $4', [username, restaurant, located, alias])
        .then(() => { // removes item from db when username and restaurant match
            res.status(200).send('Deleted from wishlist successfully');
        })
        .catch((error) => {
            console.error('Error:', error);
            res.status(500).send('Internal Server Error');
        });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => { // logs out by destroying session variables
        if (err) {
            console.error('Error logging out:', err);
        } else {
            console.log('User logged out successfully');
            globalSearch = '';
        }
        res.render('pages/login', { location: undefined, user: undefined, message: 'Logged out Successfully', error: '', globalSearch: undefined }); //logs out user
    });
});

//Welcome Test for Lab 11
app.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});

// Authentication Required
app.use(auth);


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');