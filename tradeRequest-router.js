const mongoose = require("mongoose");
const ObjectId= require('mongoose').Types.ObjectId
const User = require("./UserModel");
const FriendRequest = require("./FriendRequestModel");
const TradeRequest  = require("./TradeRequestModel");
const express = require('express');
let router = express.Router();

router.get("/", respondTradeRequests);
router.get("/:uid", sendSingleTrade);

router.post("/", express.json(), submitTradeRequest);
router.post("/responce", express.json(), TradeResponce);


//Load a user based on uid parameter
router.param("uid", function(req, res, next, value){
	let oid;
	console.log("Finding Trade by ID: " + value);
	try{
		oid = new ObjectId(value);
	}catch(err){
		res.status(404).send("Trade ID " + value + " does not exist.");
		return;
    }
    
    TradeRequest.findById(value)
    .populate("to")
    .populate("from")
    .populate("cardsRequested")
    .populate("cardsOffered")
    .exec(function(err, result){
		if(err){
			res.status(500).send("Error reading Trade Request");
			console.log(err);
			return;
        }

        if(!result){
			res.status(404).send("Order ID " + value + " does not exist.");
			return;
        }

        console.log(result);
        req.tradeRequest = result;
        next(); 
	});
});

//function to check if all elements in one array are in another
function checkElementsinArray(fixedArray,inputArray)
{
    var fixedArraylen = fixedArray.length;
    var inputArraylen = inputArray.length;
    if(fixedArraylen<=inputArraylen)
    {
        for(var i=0;i<fixedArraylen;i++)
        {
            if(!(inputArray.indexOf(fixedArray[i])>=0))
            {
                return false;
            }
        }
    }
    else
    {
        return false;
    }
    return true;
}

//trades the cards or doesnt trade the cards and deletes the trade request
function TradeResponce(req, res, next){
        TradeRequest.findById(req.body.tradeRequestId)
        .populate("to")
        .populate("from")
        .exec(function(err, trade){
        if(err){
            console.log(err);
            next();
            return;
        }
        // if accepts trades check if they both have the right cards and completes the trade
        if(req.body.decision === "true"){
            if(checkElementsinArray(trade.cardsRequested, trade.to.cards) && checkElementsinArray(trade.cardsOffered, trade.from.cards)){
                User.findById(trade.to._id,function(err,toUser){
                    if(err){
                        console.log(err);
                        next();
                        return;
                    }
                    //removes the cards
                    let removeArray = toUser.cards.filter( ( el ) => !trade.cardsRequested.includes( el ) );
                    //adds the cards
                    let newArray = removeArray.concat(trade.cardsOffered);
                    toUser.cards = newArray;
                    toUser.save(function(err,fromUser){
                        if(err){
                            console.log(err);
                            next();
                            return;
                        }
                        User.findById(trade.from._id,function(err,fromUser){
                            if(err){
                                console.log(err);
                                next();
                                return;
                            }
                            //remove the cards
                            let removeArray = fromUser.cards.filter( ( el ) => !trade.cardsOffered.includes( el ) );
                            //adds the cards
                            let newArray = removeArray.concat(trade.cardsRequested);
                            fromUser.cards = newArray;

                            fromUser.save(function(err,fromUser){
                                //delete the request
                                TradeRequest.deleteOne({_id: req.body.tradeRequestId}, function(err){
                                    if(err) console.log(err);
                                    console.log("deleted the tradeRequest and made trade")
                                    let responce = {};
                                    responce.action = "accepted"
                                    responce.userId = req.session._id
                                    res.status(200).json(responce);
                                });
                            })
                        })
                    })
                })
            }else{
                //deletes the request because users dont have the sames cards any more
                TradeRequest.deleteOne({_id: req.body.tradeRequestId}, function(err){
                    if(err) console.log(err);
                    console.log("trade request: users do not have the corecct cards anymore")
                    let responce = {};
                    responce.action = "error"
                    responce.userId = req.session._id
                    res.status(200).json(responce);
                });
            }
        }else{

            //delete this trade request bacause user declined
            TradeRequest.deleteOne({_id: req.body.tradeRequestId}, function(err){
                if(err) console.log(err);
                console.log("trade request declined deleted the tradeRequest")
                let responce = {};
                responce.action = "declined"
                responce.userId = req.session._id
                res.status(200).json(responce);

            });
        }
    })
}

//submits trade requests
function submitTradeRequest(req, res, next){
    let tr = new TradeRequest();
    tr.to = req.body.to;
    tr.from = req.session._id;
    tr.cardsRequested = req.body.requestedCards;
    tr.cardsOffered = req.body.proposedCards;
    tr.save(function(err, result){
        if(err) throw err;
        console.log("Trade Request saved to database");
        res.status(200).send();
    })
}

//responds users trade requests
function respondTradeRequests(req, res, next){
    TradeRequest.find()
    .where("to")
    .equals(req.session._id)
    .populate("to")
    .populate("from")
    .populate("cardsRequested")
    .populate("cardsOffered")
    .exec(function(err, results){
		if(err){
			res.status(500).send("Error reading Trade Request");
			console.log(err);
			return;
        }
        res.tradeRequests = results;
        res.format({
            //"text/html": () => {res.render("pages/users", {users: res.users, loggedin : req.session.loggedin} )},
            "application/json": () => {res.status(200).json(res.tradeRequests)}
        });
		next();
		return;
	});
}

//sends a single trade request page
function sendSingleTrade(req, res, next){
    let loggedInObject = {};
	loggedInObject._id = req.session._id;
    res.format({
        "application/json": function(){
            res.status(200).json(req.tradeRequest);
        },
        "text/html": () => { res.render("pages/trade", {trade: req.tradeRequest, loggedIn: loggedInObject}); }  // i have to implement a back button
    });
    next();
}

//Export the router object, so it can be mounted in the store-server.js file
module.exports = router;