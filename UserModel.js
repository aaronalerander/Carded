const mongoose = require("mongoose");
const Schema = mongoose.Schema;






let userSchema = Schema({
	//Names will be strings between 1-30 characters
	//Must consist of only A-Z characters
	//Will be trimmed automatically (i.e., outer spacing removed)
	username: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 30,
		match: /[A-Za-z]+/,
		trim: true
	},
	password: {
		type: String, 
		required: true,
		minlength: 1,
		maxlength: 30,
		match: /[A-Za-z]+/,
		trim: true
	},
    friends:[{type:Schema.Types.ObjectId, ref: 'User'}],
    cards:[{type:Schema.Types.ObjectId, ref: 'Card'}]
});



//Instance method finds friend request
userSchema.methods.findFriendRequests = function(callback){
	this.model('FriendRequest').find()
    .where("to").equals(this._id)
	.exec(callback);
};

//Instance method finds trade request
userSchema.methods.findTradeRequests = function(callback){
	this.model('TradeRequest').find()
	.where("to").equals(this._id)
	.exec(callback);
};

module.exports = mongoose.model("User", userSchema);