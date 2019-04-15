const { Schema } = require('mongoose')

module.exports = new Schema({
    _id: false,
    moveId: { type: Number, ref: 'Move', required: true },
    moveName: { type: String, required: true },
    moveType: { type: String, required: true },
    displayName: { type: String, required: true },
    tmNumber: { type: Number },
    hmNumber: { type: Number }
})
