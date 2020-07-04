const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let tradeRequestSchema = Schema({
    to:{type:Schema.Types.ObjectId, ref: 'User'},
    from:{type:Schema.Types.ObjectId, ref: 'User'},
    cardsRequested:[{ type: Schema.Types.ObjectId, ref: 'Card' }],
    cardsOffered:[{ type: Schema.Types.ObjectId, ref: 'Card' }]
});

module.exports = mongoose.model("TradeRequest", tradeRequestSchema);