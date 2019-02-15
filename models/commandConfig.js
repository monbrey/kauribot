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
    },
    usage: [{
        guild: {
            type: String
        },
        count: {
            type: Number,
            default: 0
        }
    }]
})

commandConfigSchema.statics.getConfigForCommand = async function(client, command) {
    const configs = await this.find({}).cache(30)

    let config = configs.find(cfg => cfg.commandName === command.name) ||
        await this.create({
            "commandName": command.name,
            "guilds": client.guilds.reduce((array, value) => {
                array[value.id] = command.defaultConfig
                return array
            }, {}),
            "usage": [...client.guilds.map(g => { return { "guild": g.id } })]
        })

    for(let g of client.guilds.keyArray()) {
        if(!config.guilds.has(g)) {
            config.guilds.set(g, command.defaultConfig)
        }
    }   

    if(config.isModified()) await config.save()

    return config
}

commandConfigSchema.methods.setGuild = async function(_guild, status) {
    this.guilds.set(_guild, status)
    return await this.save()
}

commandConfigSchema.methods.setChannels = async function(_channels, status) {
    _channels.forEach(channel => {
        this.channels.set(channel, status)
    })

    return await this.save()
}

commandConfigSchema.methods.clearConfigForGuild = async function(_guild) {
    this.guilds.delete(_guild.id)
    _guild.channels.forEach(channel => {
        this.channels.delete(channel.id)
    })

    return await this.save()
}

commandConfigSchema.methods.updateCount = async function(_guild) {
    this.usage.find(u => u.guild === _guild).count++
    this.save()
}

module.exports = mongoose.model("CommandConfig", commandConfigSchema)