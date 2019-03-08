const mongoose = require("mongoose")

const commandConfigSchema = new mongoose.Schema({
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
    roles: {
        type: Map,
        of: "Boolean",
        default: {}
    }
})

commandConfigSchema.statics.getConfigForCommand = async function(client, command) {
    const configs = await this.find({}).cache(30)

    let config = configs.find(cfg => cfg.commandName === command.name)

    return config
}

commandConfigSchema.statics.setMissingDefaultsForCommand = async function(client, command) {
    if (!command.config) {
        command.config = await this.create({
            "commandName": command.name,
            "roles": [{ "135865553423302657": true }]
        })
    }

    for (let g of client.guilds.keyArray()) {
        if (!command.config.guilds.has(g)) {
            command.config.guilds.set(g, command.defaultConfig)
        }
    }

    if (command.config.isModified()) await command.config.save()

    return command.config
}

commandConfigSchema.methods.setGuild = async function(_guild, status) {
    this.guilds.set(_guild, status)
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