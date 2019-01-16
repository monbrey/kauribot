const mongoose = require("mongoose")

let colorSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    }
})

colorSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "Color",
    startAt: 1
})

colorSchema.statics.getColorForType = async function(type) {
    let pair = await this.findOne({ key: type })
    if(pair) return pair.color
    else return "0x000000"
}

module.exports = mongoose.model("Color", colorSchema)