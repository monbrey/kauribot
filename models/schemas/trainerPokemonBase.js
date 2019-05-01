const { Schema } = require('mongoose')

module.exports = new Schema({
    pokemonId: { type: Number, required: true, ref: 'Pokemon' },
    dexNumber: { type: Number, required: true },
    speciesName: { type: String, required: true },
    uniqueName: { type: String, required: true },
    displayName: { type: String, required: true },
    type1: { type: String, required: true },
    type2: { type: String, required: true },
    evolution: { type: Array },
    mega: { type: Array },
    primal: { type: Array }
})
