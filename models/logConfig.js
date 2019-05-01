const mongoose = require('mongoose')

const logConfigSchema = new mongoose.Schema({
    guild: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        required: true
    }
})

logConfigSchema.statics.getLogChannel = async function(_guild) {
    const configs = await this.find({}).cache(30, 'log-config')

    let mapping = await configs.find(cfg => cfg.guild === _guild)
    if (mapping) return mapping.channel
    else return null
}

logConfigSchema.statics.setLogChannel = async function(_guild, _channel) {
    let log =
        (await this.findOne({ guild: _guild })) ||
        (await this.create({ guild: _guild, channel: _channel }))
    log.channel = _channel
    return await log.save()
}

logConfigSchema.statics.clearLogChannel = async function(_guild) {
    return await this.deleteOne({ guild: _guild })
}

module.exports = mongoose.model('LogConfig', logConfigSchema)
