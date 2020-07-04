const express = require('express');
const app = express();
const mongoose = require("mongoose");

//Models
const User = require("./UserModel");
const Card = require("./CardModel");

const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/tokens',
    collection: 'sessions'
  });
app.use(session({ secret: 'some secret here', store: store }))
app.set("view engine", "pug");
app.use(express.urlencoded({extended: true}));

app.use(express.static('public'));


//setting routers
let userRouter = require("./user-router");
app.use("/users", userRouter);
let cardRouter = require("./card-router");
app.use("/cards", cardRouter);
let friendRequestRouter = require("./friendRequest-router");
app.use("/friendRequests", friendRequestRouter);
let tradeRequestRouter  = require("./tradeRequest-router");
app.use("/tradeRequests", tradeRequestRouter);


//respond with the login/register page
app.get("/", (req, res, next)=> {
    res.render("pages/login");
});


//login user or register
app.post("/login", function(req, res, next){
    //check if logged in
	if(req.session.loggedin){
        console.log("Session loggedIn");
		res.status(401).send("You are already logged ");
		return;
    }

    //login or create user
	let username = req.body.username;
    let password = req.body.password;
    //checking database for user
	mongoose.connection.db.collection("users").findOne({username: username}, function(err, result){
        if(err)throw err;

		//console.log(result);
		if(result){
            //found user
            //checking if password is correct
            if(result.password !== password){
                res.status(401).send("Password not correct - user existes; Access denied. Enter correct password or register with another username");
                return;
            }
            //loggin in user
			console.log("Correct and Password");
            req.session.loggedin = true;
			req.session.username = username;
			req.session._id = result._id
			console.log("Username: " + username);
            res.redirect("/users/" + req.session._id);
            
		}else{
            //creating new user
            let u = new User();
            u.username = username;
            u.password = password;
            u.cards = [];

            //getting random 10 cards
             Card.findRandom({}, {}, {limit: 10}, function(err, results) {
                if (err) throw err;

                for(i=0; i<results.length; i++){
                    u.cards.push(results[i]._id);
                }

                //trying to save user
                u.save(function(err, result){
                    if(err){
                        console.log(err);
                        res.status(500).send("Error creating user.");
                        return;
                    }
                    //user saved
                    req.session.loggedin = true;
                    req.session.username = u.username;
                    req.session._id = result._id;
                    res.redirect("/users/" + req.session._id);
                })
            });            
		}
    });
});

//logs out user
app.get("/logout", function(req, res, next){
	req.session.loggedin = false;
	res.redirect("/");
})

mongoose.connect('mongodb://localhost/a5', {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    app.listen(3000);
    console.log("Server listening on port 3000");

});