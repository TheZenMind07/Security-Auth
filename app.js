//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();
const findOrCreate = require("mongoose-findorcreate");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: true
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

// mongoose.connect("mongodb://localhost:27017/userDB", {
mongoose.connect("mongodb+srv://rk-mongo:Rajkp@cluster0.vbjj1.mongodb.net/userDB", {
    urlencoded: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

// var secret = process.env.SECRET;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/secrets"
        },
        function (accessToken, refreshToken, profile, cb) {
            User.findOrCreate({ googleId: profile.id }, function (err, user) {
                return cb(err, user);
            });
        }
    )
);

// passport.use(
//     new FacebookStrategy(
//         {
//             clientID: FACEBOOK_APP_ID,
//             clientSecret: FACEBOOK_APP_SECRET,
//             callbackURL: "http://localhost:3000/auth/facebook/secrets"
//         },
//         function (accessToken, refreshToken, profile, cb) {
//             User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//                 return cb(err, user);
//             });
//         }
//     )
// );
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login" }), function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
    "/auth/facebook/secrets",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    }
);

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated) {
        User.find({ secret: { $ne: null } }, function (err, foundUsers) {
            res.render("secrets", { foundUsers: foundUsers });
        });
        // res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req, res) {
    const sec = req.body.secret;
    // User.findById(req.body._id)
    // console.log()
    User.findById(req.user._id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            foundUser.secret = sec;
            foundUser.save();
        }
    });
    res.redirect("/secrets");
});

app.post("/login", function (req, res) {
    // User.findOne({ email: req.body.username }, function (err, foundUser) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         bcrypt.compare(req.body.password, foundUser.password, function (err, result) {
    //             result == true;
    //             res.render("secrets");
    //         });
    //         // if (foundUser.password === req.body.password) {
    //         //     res.render("secrets");
    //         // }
    //     }
    // });
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
    // User.authenticate(req.body.username, req.body.password, function (err, user) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         passport.authenticate("local")(req, res, function () {
    //             res.redirect("/secrets");
    //         });
    //     }
    // });
});

app.post("/register", function (req, res) {
    // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    //     let user = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     user.save();
    //     res.render("secrets");
    // });
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});

app.listen(3000, function () {
    console.log("Server started at port 3000");
});
