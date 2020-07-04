const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let friendRequestSchema = Schema({
    to:{
		type:Schema.Types.ObjectId, ref: 'User'
    },
    from:{
        type:Schema.Types.ObjectId, ref: 'User'
    }
});

module.exports = mongoose.model("FriendRequest", friendRequestSchema);