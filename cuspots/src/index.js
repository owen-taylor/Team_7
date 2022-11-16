const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');



// database configuration
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);
let spot_id = 0;
// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

app.set('view engine', 'ejs');
app.use(bodyParser.json());

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
app.use(express.static(__dirname + '/resources'));
//END OF USE COMMANDS SECTION

//START GET REQUEST SECTION
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home', (req, res) => {
  res.render('pages/home', {
    session: req.session.user,
  });
});

app.get('/login', (req, res) => {
    if(!req.session.user){
      res.render('pages/login');
    }else{
      res.redirect('/logout');
    }
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});
app.get('/logout', (req, res) =>{
  req.session.destroy();
  res.render('pages/login', {
    error: false,
    message: "logged out successfully",
  });
});

app.get('/map', (req, res) =>{
  if (!req.session.user) {
    // Default to register page.
    return res.redirect('/register');
  }
  const all_spots = `SELECT * FROM spots ORDER BY spots.spot_id ASC;`;
  db.any(all_spots)
    .then((spots) => {
      res.render("pages/map", {
        spots,
        key: req.session.user.api_key,
        session: req.session.user,
      });
    })
    .catch((err) => {
      res.render("pages/map", {
        courses: [],
        error: true,
        message: err.message,
      });
    });
});

app.post('/spot_location', (req, res) =>{
  const daMap = "https://maps.googleapis.com/maps/api/staticmap?zoom=17&size=2000x400&maptype=satellite&markers=color:red%7C"
  + String(req.body.lat) + "," + String(req.body.long)+ "&key=" + String(req.session.user.api_key);
  const all_spots = `SELECT * FROM spots ORDER BY spots.spot_id ASC;`;
  db.any(all_spots)
    .then((spots) => {
      res.render("pages/map", {
        spots,
        map: daMap,
        session: req.session.user,
      });
    })
    .catch((err) => {
      res.render("pages/map", {
        courses: [],
        error: true,
        message: err.message,
      });
    });
});

app.post('/rate_spot', (req, res) =>{
  spot_id = req.body.spot_id;
  const new_rating = `INSERT INTO ratings (rating, spot_id, user_id) VALUES (${req.body.value}, ${spot_id}, ${req.session.user.user_id});`;
  db.any(new_rating)
    .then((rating) => {
      res.redirect("/update_spot_ratings");
    })
    .catch((err) => {
      res.render("pages/map", {
        courses: [],
        error: true,
        message: err.message,
      });
    });
});

app.get('/update_spot_ratings', (req, res) =>{
  const update_avg_rating = `UPDATE spots SET avg_rating = (SELECT AVG(rating) FROM ratings WHERE ratings.spot_id = ${spot_id}) WHERE spots.spot_id = ${spot_id};`;
  db.any(update_avg_rating)
    .then((r) => {
      res.redirect("/map");
    })
    .catch((err) => {
      res.render("pages/map", {
        courses: [],
        error: true,
        message: err.message,
      });
    });
});

//END GET REQUEST SECTION


//START POST SECTION
//REGISTER:
app.post('/register', async (req, res) => {
  const username = req.body.username;
  const hash = await bcrypt.hash(req.body.password, 10);
  const query = `INSERT INTO users (username, password) VALUES ($1, $2);`;
  db.any(query, [username, hash])
    .then(function (data) {
      res.render('pages/login', {
        error: false,
        message: "account registered successfully",
      });
    })
    .catch(function (err) {
      res.render('pages/register', {
        error: true,
        message: "username unavailable",
      });
      return console.log(err);
    });
});
//LOGIN:
app.post('/login', async (req, res) => {
  const username = req.body.username;
  query = `SELECT * FROM users WHERE username = $1;`;
  db.any(query, [username])
    .then(async function (data){
      const password = data[0].password;
      const passwordInput = req.body.password;
      const match = await bcrypt.compare(passwordInput, password);
      if(!match){
        //password incorrect
        res.render('pages/login', {
          error: true,
          message: "Incorrect username or password.",
        });
        return console.log("Incorrect username or password.");
      }else{
        //password correct
        req.session.user = {
          api_key: process.env.API_KEY,
          username: username,
          user_id: data[0].user_id,
        };
        req.session.save();
        res.redirect('/map');
      }
    })
    .catch((err) => {
      res.render('pages/register', {
        error: true,
        message: "Could not find account. Create one here.",
      });
      
    });
});

app.post('/add_spot', async (req, res) => {
  const spot_name = req.body.spot_input;
  const latitude = req.body.latitude_input;
  const longitude = req.body.longitude_input;
  const query = `INSERT INTO spots (name, lat, long) VALUES ('${spot_name}', ${latitude}, ${longitude});`;
  db.any(query)
    .then(async function (data) {
        res.redirect('/map');
    })
    .catch(async function (err) {
      res.render('/map');
      return console.log(err);
    });
});

//END POST SECTION

app.listen(3000);
console.log('Server is listening on port 3000');