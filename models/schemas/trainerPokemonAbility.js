const { Schema } = require('mongoose')
const { obj } = require('./pokemonAbility')

module.exports = new Schema(
    Object.assign(
        {
            learned: { type: Boolean, default: false }
        },
        obj
    )
)
