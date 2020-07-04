const mongoose = require("mongoose");
const ObjectId= require('mongoose').Types.ObjectId
const User = require("./UserModel");
const Card = require("./CardModel");
const express = require('express');
let router = express.Router();

router.get("/", queryParser);
router.get("/", loadUsers);
router.get("/", respondUsers);

router.get("/:uid", sendSingleUser);

//Load a user based on uid parameter
router.param("uid", function(req, res, next, value){
    
	let oid;
	console.log("This one Finding user by ID: " + value);
	try{
		oid = new ObjectId(value);
	}catch(err){
		res.status(404).send("User ID " + value + " does not exist.");
		return;
	}
	
	User.findById(value)
	.populate('cards')
	.populate('friends')
	.exec(function(err, result){
		if(err){
			console.log(err);
			res.status(500).send("Error reading user.");
			return;
		}
		
		if(!result){
			res.status(404).send("User ID " + value + " does not exist.");
			return;
		}
		
		console.log("Result:");
        console.log(result);
        req.user = result;
        if(req.session.loggedin && req.session.username === req.user.username){
            req.user.ownprofile = true;
        }
        next();
	});
});

//Send the representation of a single user that is a property of the request object
//Sends either JSON or HTML, depending on Accepts header
function sendSingleUser(req, res, next){
	if(req.user.ownprofile === true){
		res.render("pages/user", {user: req.user});
		next();
	}else{
		//send the not user page
		let loggedInObject = {};
		loggedInObject._id = req.session._id;
		res.format({
			"text/html": () => {res.render("pages/notUser", {user: req.user, loggedIn:loggedInObject} )},
			"application/json": () => {res.status(200).json(req.user)}
		});
		next();
	}
}

//Parse the query parameters
//limit: integer specifying maximum number of results to send back
//page: the page of results to send back (start is (page-1)*limit)
//name: string to find in user names to be considered a match
function queryParser(req, res, next){
	console.log("inside queryParse");
	if(!req.query.name){
		req.query.name = "?";
	}
	next();
}

function loadUsers(req, res, next){
	console.log("inside loadusers");
	User.find()
    .where("username").regex(new RegExp(".*" + req.query.name + ".*", "i")) 
	.exec(function(err, results){
		if(err){
			res.status(500).send("Error reading users.");
			console.log(err);
			return;
		}
		res.users = results;
		next();
		return;
	});
}

//Users the res.users property to send a response
//Sends either HTML or JSON, depending on Accepts header
function respondUsers(req, res, next){
	console.log("inside respondusers");
	res.format({
		//"text/html": () => {res.render("pages/users", {users: res.users, loggedin : req.session.loggedin} )},
		"application/json": () => {res.status(200).json(res.users)}
	});
	next();
	
}

//Export the router object, so it can be mounted in the store-server.js file
module.exports = router;