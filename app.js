//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
// mongoose.connect("mongodb://localhost:27017/userDB", {
mongoose.connect("mongodb+srv://rk-mongo:Rajkp@cluster0.vbjj1.mongodb.net/userDB", {
    urlencoded: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

var secret = "process.env.SOME_LONG_UNGUESSABLE_STRING";
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/login", function (req, res) {
    User.findOne({ email: req.body.username }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser.password === req.body.password) {
                res.render("secrets");
            }
        }
    });
});

app.post("/register", function (req, res) {
    let user = new User({
        email: req.body.username,
        password: req.body.password
    });
    user.save();
    res.render("secrets");
});

app.listen(3000, function () {
    console.log("Server started at port 3000");
});
