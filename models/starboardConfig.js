const mongoose = require('mongoose')

const starboardConfigSchema = new mongoose.Schema({
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
        default: '⭐'
    },
    minReacts: {
        type: Number,
        default: 1
    }
})

starboardConfigSchema.statics.getConfigForGuild = async function(_guild) {
    const configs = await this.find({}).cache(30, 'starboard-config')

    return await configs.find(cfg => cfg.guild === _guild)
}

starboardConfigSchema.statics.setStarboardChannel = async function(_guild, _channel) {
    let starboard =
        (await this.findOne({ guild: _guild })) ||
        (await this.create({ guild: _guild, channel: _channel }))
    starboard.channel = _channel
    return starboard.save()
}

starboardConfigSchema.statics.clearStarboardChannel = async function(_guild) {
    return this.deleteOne({ guild: _guild })
}

module.exports = mongoose.model('StarboardConfig', starboardConfigSchema)
