const { Schema, model } = require("mongoose")

const eotSchema = new Schema({
    order: {
        type: Number,
        required: true,
    },
    effect: {
        type: String,
        required: true
    },
}, {
    collection: "eotEffects"
})

eotSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "EOT",
    startAt: 1
})

eotSchema.statics.getEffect = async function(query) {
    const effect = await this.findClosest("effect", query, {}, 0)
    return effect
}

eotSchema.statics.getSurrounding = async function(num) {
    const effects = await this.find({
        "order": {
            $gt: Math.floor(num) - 3, $lt: Math.floor(num) + 3
        }
    }).sort("order")

    return effects
}

module.exports = model("EOT", eotSchema)