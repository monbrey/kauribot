const { Schema, model } = require("mongoose")

const commandConfigSchema = new Schema({
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
        of: Boolean,
        default: {}
    }
})

commandConfigSchema.statics.setMissingDefaultsForCommand = async function(client, command) {
    if (!command.config) {
        command.config = await this.create({
            "commandName": command.name,
            "guilds": new Map(),
            "channels": new Map(),
            "roles": command.defaultConfig.roles ? new Map(command.defaultConfig.roles.map(r => [r, true])) : new Map()
        })
    }

    for (let g of client.guilds.keyArray()) {
        if (!command.config.guilds.has(g)) {
            command.config.guilds.set(g, command.defaultConfig.guild)
        }
    }

    if (command.config.isModified()) {
        await command.config.save()
    }

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

module.exports = model("CommandConfig", commandConfigSchema)