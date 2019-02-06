const mongoose = require("mongoose")
const Trainer = require("./trainer")

const undergroundSchema = new mongoose.Schema({
    digs: [{
        trainer: {
            type: Number,
            ref: Trainer,
            required: true
        },
        month: {
            type: String,
            required: true
        },
        _id: false
    }],
    matrix: [{
        maxIndex: {
            type: Number,
            required: true
        },
        catName: {
            type: String
        },
        item: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            ref: "Item"
        },
        function: {
            type: String
        },
        _id: false
    }]
})

undergroundSchema.statics.getMatrix = async function() {
    let matrix = await this.findOne({}).select("matrix -_id").lean()
    return matrix.matrix
}

module.exports = mongoose.model("Underground", undergroundSchema)