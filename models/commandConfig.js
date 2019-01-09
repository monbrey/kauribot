const mongoose = require("mongoose")

var commandConfigSchema = new mongoose.Schema({
    commandName: {
        type: String,
        required: true
    },
    guilds: {
        type: Map,
        of: Boolean,
        default: {}
    },
    channels: {
        type: Map,
        of: Boolean,
        default: {}
    }
})

commandConfigSchema.statics.getConfigForCommand = async function (client, command) {
    let config = await this.findOne({
        "commandName": command.name
    }) || await this.create({
        "commandName": command.name,
        "guilds": client.guilds.reduce((array, value) => {
            array[value.id] = command.defaultConfig
            return array
        }, {})
    })
    return config
}

commandConfigSchema.methods.setGuild = async function (_guild, status) {
    this.guilds.set(_guild, status)
    return await this.save()
}

commandConfigSchema.methods.setChannels = async function (_channels, status) {
    _channels.forEach(channel => {
        this.channels.set(channel, status)
    })

    return await this.save()
}

commandConfigSchema.methods.clearConfigForGuild = async function (_guild) {
    this.guilds.delete(_guild.id)
    _guild.channels.forEach(channel => {
        this.channels.delete(channel.id)
    })

    return await this.save()
}

module.exports = mongoose.model("CommandConfig", commandConfigSchema)
