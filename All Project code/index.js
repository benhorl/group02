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
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.

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
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('pages/login', { user: req.session.user });
});

app.get('/register', (req, res) => {
  res.render('pages/register', { user: req.session.user });
});

app.post('/register', async (req, res) => {
  // Hash the password using bcrypt library
  const hash = await bcrypt.hash(req.body.password, 10);

  const query = 'INSERT INTO users (username, password) VALUES ($1, $2)';
  const values = [req.body.username.toLowerCase(), hash]; //makes sure usernames cannot be repeated

  db.none(query, values)
    .then(() => {
      console.log('User registered successfully');
      res.redirect('/login');
    })
    .catch((error) => {
      console.error('Error registering user:', error);
      res.redirect('/register');
    });
});



app.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (user) {
      const match = await bcrypt.compare(password, user.password);

      if (match) {

        req.session.user = user;
        req.session.save();

        res.redirect('/discover');
      } else {
        res.status(401).send('Incorrect username or password.');
      }
    } else {
      res.redirect('/register');
    }
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/discover', (req, res) => {
  // Make an Axios call to the Ticketmaster API
  axios({
    url: 'https://app.ticketmaster.com/discovery/v2/events.json',
    method: 'GET',
    dataType: 'json',
    headers: {
      'Accept-Encoding': 'application/json',
    },
    params: {
      apikey: "", // Replace with your API_KEY
      keyword: 'Travis Scott',
      size: 10, // You can choose the number of events you want to return
    },
  })
  .then((results) => {
    res.render('pages/discover', { events: results.data._embedded.events, user: req.session.user });
  })
  .catch((error) => {
    console.error('API Error:', error);
    res.render('pages/discover', { events: [], user: req.session.user });
  });
});


app.get("/courses", (req, res) => {
  const taken = req.query.taken;
  // Query to list all the courses taken by a student

  db.any(taken ? student_courses : all_courses, [req.session.user.student_id])
    .then((courses) => {
      res.render("pages/courses", {
        courses,
        action: req.query.taken ? "delete" : "add",
      });
    })
    .catch((err) => {
      res.render("pages/courses", {
        courses: [],
        error: true,
        message: err.message,
      });
    });
});

app.post("/posts/add", (req, res) => {
  const { postTitle, postContent } = req.body;
  
  db.none('INSERT INTO posts(title, content) VALUES($1, $2)', [postTitle, postContent])
    .then(() => {
      res.redirect('/posts');
    })
    .catch((error) => {
      console.error(error);
      res.send('An error occurred');
    });
});


app.get('/posts/new', (req, res) => {
  res.render('pages/new-post', { user: req.session.user });
});

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


app.post("/courses/add", (req, res) => {
  const course_id = parseInt(req.body.course_id);
  db.tx(async (t) => {
    // This transaction will continue iff the student has satisfied all the
    // required prerequisites.
    const { num_prerequisites } = await t.one(
      `SELECT
        num_prerequisites
       FROM
        course_prerequisite_count
       WHERE
        course_id = $1`,
      [course_id]
    );

    if (num_prerequisites > 0) {
      // This returns [] if the student has not taken any prerequisites for
      // the course.
      const [row] = await t.any(
        `SELECT
              num_prerequisites_satisfied
            FROM
              student_prerequisite_count
            WHERE
              course_id = $1
              AND student_id = $2`,
        [course_id, req.session.user.student_id]
      );

      if (!row || row.num_prerequisites_satisfied < num_prerequisites) {
        throw new Error(`Prerequisites not satisfied for course ${course_id}`);
      }
    }

    // There are either no prerequisites, or all have been taken.
    await t.none(
      "INSERT INTO student_courses(course_id, student_id) VALUES ($1, $2);",
      [course_id, req.session.user.student_id]
    );
    return t.any(all_courses, [req.session.user.student_id]);
  })
    .then((courses) => {
      //console.info(courses);
      res.render("pages/courses", {
        courses,
        message: `Successfully added course ${req.body.course_id}`,
        action: "add",
      });
    })
    .catch((err) => {
      res.render("pages/courses", {
        courses: [],
        error: true,
        message: err.message,
      });
    });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
    } else {
      console.log('User logged out successfully');
    }
    res.render('pages/login', { user: undefined, message: 'Logged out Successfully' }); //logs out user
  });
});



// Authentication Required
app.use(auth);


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');
