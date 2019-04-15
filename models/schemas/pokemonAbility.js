const { Schema } = require('mongoose')

module.exports = new Schema({
    _id: false,
    abilityId: { type: Number, ref: 'Ability', required: true },
    abilityName: { type: String, required: true },
    hidden: { type: Boolean }
})
