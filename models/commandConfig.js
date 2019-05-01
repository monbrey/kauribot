const { Schema, model } = require('mongoose')

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
    },
    defaults: {
        guild: { type: Boolean, default: true },
        permissions: { type: Array, of: String },
        _id: false
    },
    ownerOnly: {
        type: Boolean,
        default: true
    },
    canBeDisabled: {
        type: Boolean,
        default: true
    },
    canChangePermissions: {
        type: Boolean,
        default: true
    }
})

commandConfigSchema.methods.clearConfigForGuild = async function(_guild) {
    this.guilds.delete(_guild.id)
    _guild.channels.forEach(channel => {
        this.channels.delete(channel.id)
    })

    return await this.save()
}

module.exports = model('CommandConfig', commandConfigSchema)
