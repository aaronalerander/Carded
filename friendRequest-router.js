const mongoose = require("mongoose");
const ObjectId= require('mongoose').Types.ObjectId
const User = require("./UserModel");
const FriendRequest = require("./FriendRequestModel");
const express = require('express');
let router = express.Router();

router.get("/", respondFriendRequests);

router.post("/", express.json(), submitFriendRequest);
router.post("/responce", express.json(), friendRequestResponce);

//accepts or declines friend request and deletes friendRequest from database
function friendRequestResponce(req, res, next){
    FriendRequest.findById(req.body.friendRequestId ,function(err, friendRequest){
        if(err){
            console.log(err);
            next();
            return;
        }
        console.log("Friend Request:");
        console.log(friendRequest);
        console.log("req.body.decision")
        console.log(req.body.decision)
        if(req.body.decision === "true"){
            //make each other friends
            User.findById(friendRequest.to,function(err,toUser){
                if(err){
                    console.log(err);
                    next();
                    return;
                }
                toUser.friends.push(friendRequest.from);
                toUser.save(function(err,fromUser){
                    if(err){
                        console.log(err);
                        next();
                        return;
                    }
                    User.findById(friendRequest.from,function(err,fromUser){
                        if(err){
                            console.log(err);
                            next();
                            return;
                        }
                        fromUser.friends.push(friendRequest.to);
                        fromUser.save(function(err,fromUser){
                            //delete the request
                            FriendRequest.deleteOne({_id: req.body.friendRequestId}, function(err){
                                if(err) console.log(err);
                                console.log("deleted the friendRequest and made friends")
                                let info = {};
                                info.response = "accepted";
                                res.status(200).json(info);
                            });
                        })
                    })
                })
            })
        }else{
            FriendRequest.deleteOne({_id: req.body.friendRequestId}, function(err){
                if(err) console.log(err);

                let info = {};
                info.response = "declined";
                res.status(200).json(info);
            });
        }
    })
}

//function creates a friend Request and saves to the database
function submitFriendRequest(req, res, next){
    let fr = new FriendRequest();
    fr.to = req.body.toId;
    fr.from = req.session._id;
    fr.save(function(err, result){
        if(err) throw err;

        res.status(200).send();
    })
}



//responds with the friend requests for the current user
function respondFriendRequests(req, res, next){
    FriendRequest.find()
    .where("to")
    .equals(req.session._id)
    .populate("from")
    .exec(function(err, results){
		if(err){
			res.status(500).send("Error reading Friend Request");
			console.log(err);
			return;
        }
        res.friendRequests = results;

        res.format({
            //"text/html": () => {res.render("pages/users", {users: res.users, loggedin : req.session.loggedin} )},
            "application/json": () => {res.status(200).json(res.friendRequests)}
        });
		next();
		return;
	});
}

//Export the router object, so it can be mounted in the store-server.js file
module.exports = router;