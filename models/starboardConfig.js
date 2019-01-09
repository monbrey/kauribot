const mongoose = require("mongoose")

var starboardConfigSchema = new mongoose.Schema({
    guild: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        required: true
    },
    emoji: {
        type: String,
        default: "⭐"
    },
    minReacts: {
        type: Number,
        default: 1
    }
})

starboardConfigSchema.statics.getConfigForGuild = async function(_guild) {
    return this.findOne({"guild":_guild})
}

starboardConfigSchema.statics.clearStarboardChannel = async function (_guild) {
    return await this.deleteOne({"guild":_guild})
}

module.exports = mongoose.model("StarboardConfig", starboardConfigSchema)
