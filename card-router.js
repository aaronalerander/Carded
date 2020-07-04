const mongoose = require("mongoose");
const ObjectId= require('mongoose').Types.ObjectId
const User = require("./UserModel");
const Card = require("./CardModel");
const express = require('express');
let router = express.Router();


router.get("/:uid", sendSingleOrder);




//Load a card based on uid parameter
router.param("uid", function(req, res, next, value){
	let oid;
	console.log("Finding card by ID: " + value);
	try{
		oid = new ObjectId(value);
	}catch(err){
		res.status(404).send("Card ID " + value + " does not exist.");
		return;
	}
	
	Card.findById(value, function(err, result){
		if(err){
			console.log(err);
			res.status(500).send("Error reading Card.");
			return;
		}
		
		if(!result){
			res.status(404).send("Card ID " + value + " does not exist.");
			return;
		}
		
		console.log("Card:");
		console.log(result);
        req.card = result;
        next();
	});
});


//sends a single card
function sendSingleOrder(req, res, next){
	//send the not user page
	let loggedInObject = {};
	loggedInObject._id = req.session._id;
    res.render("pages/card", {card: req.card, loggedIn: loggedInObject});
    next();
}

//Export the router object, so it can be mounted in the store-server.js file
module.exports = router;