const { Schema, model } = require('mongoose')
const { RichEmbed } = require('discord.js')

const abilitySchema = new Schema({
    abilityName: {
        type: String,
        required: true
    },
    announcement: {
        type: String
    },
    desc: {
        type: String
    },
    additional: {
        type: String
    },
    affects: {
        type: String
    }
})

abilitySchema.plugin(require('mongoose-plugin-autoinc').autoIncrement, {
    model: 'Ability',
    startAt: 1
})

/**
 * Generates a informational RichEmbed for the ability
 * @returns [RichEmbed]
 */
abilitySchema.methods.info = function() {
    let embed = {
        title: `${this.abilityName}`,
        description: `${this.desc}`,
        fields: [],
        footer: {}
    }

    if (this.announcement) {
        switch (this.announcement) {
            case 'Active':
                embed.title += ' | Announced on activation'
                break
            case 'Enter':
                embed.title += ' | Announced on entry'
                break
            case 'Hidden':
                embed.title += ' | Hidden'
                break
        }
    }

    if (this.affects) {
        embed.fields.push({
            name: '**Interacts with the following:**',
            value: this.affects
        })
    }
    if (this.additional) {
        embed.footer = {
            text: this.additional
        }
    }

    return new RichEmbed(embed)
}

module.exports = model('Ability', abilitySchema)
