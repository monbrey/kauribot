const { Schema } = require('mongoose')

module.exports = new Schema({
    _id: false,
    pokemonId: { type: Number, ref: 'Pokemon', required: true },
    exp: { type: Number },
    uniqueName: { type: String },
    requires: { type: Number, ref: 'Item' },
    trade: { type: Boolean }
})
