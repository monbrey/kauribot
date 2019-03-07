const { Schema, model } = require("mongoose")
const { RichEmbed } = require("discord.js")

let statusEffectSchema = new Schema({
    statusName: {
        type: String,
        required: true
    },
    shortCode: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    }
})

statusEffectSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "StatusEffect",
    startAt: 1
})

statusEffectSchema.methods.info = async function() {
    let embed = new RichEmbed()
        .setTitle(`${this.statusName} (${this.shortCode})`)
        .setDescription(this.desc)
        .setColor(this.color)

    return embed
}

module.exports = model("StatusEffect", statusEffectSchema)