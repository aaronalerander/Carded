const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var random = require('mongoose-simple-random');

let cardSchema = Schema({
    artist:{type:String},
    name:{type:String},
    cardClass:{type:String},
    rarity:{type:String},
    attack:{type:Number},
    health:{type:Number}
});
cardSchema.plugin(random);//added

module.exports = mongoose.model("Card", cardSchema);