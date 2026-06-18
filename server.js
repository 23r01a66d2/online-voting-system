const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const db = new sqlite3.Database('polls.db');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.use(session({
    secret: "pollingsystemsecret",
    resave: false,
    saveUninitialized: true
}));

// Create Tables if not exists
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, phone TEXT, aadhar TEXT, dob TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS polls (id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS options (id INTEGER PRIMARY KEY AUTOINCREMENT, poll_id INTEGER, option_text TEXT, logo TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS votes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, option_id INTEGER)");
});

// Routes
app.get("/", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const { username, password, phone, aadhar, dob } = req.body;
    const query = "INSERT INTO users (username, password, phone, aadhar, dob) VALUES (?, ?, ?, ?, ?)";
    db.run(query, [username, password, phone, aadhar, dob], (err) => {
        if (err) {
            res.send("Error: User registration failed.");
        } else {
            res.redirect("/login");
        }
    });
});

app.get("/login", (req, res) => {
    res.render("login", { message: req.query.message || '' });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const query = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.get(query, [username, password], (err, row) => {
        if (err || !row) {
            res.redirect("/login?message=Invalid login credentials.");
        } else {
            req.session.user = row;
            res.redirect("/vote");
        }
    });
});


app.get("/vote", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const query = "SELECT * FROM polls";
    db.all(query, [], (err, rows) => {
        if (err) {
            res.send("Error: Unable to fetch polls.");
        } else {
            res.render("vote", { polls: rows });
        }
    });
});

app.post("/vote", (req, res) => {
    const { poll_id, option_id } = req.body;
    const user_id = req.session.user.id;
    
    const query = "INSERT INTO votes (user_id, option_id) VALUES (?, ?)";
    db.run(query, [user_id, option_id], (err) => {
        if (err) {
            res.send("Error: Vote submission failed.");
        } else {
            res.redirect("/results");
        }
    });
});

app.get("/results", (req, res) => {
    const query = `
        SELECT polls.question, options.option_text, COUNT(votes.option_id) as votes_count
        FROM votes
        JOIN options ON votes.option_id = options.id
        JOIN polls ON options.poll_id = polls.id
        GROUP BY options.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            res.send("Error: Unable to fetch results.");
        } else {
            res.render("results", { results: rows });
        }
    });
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
