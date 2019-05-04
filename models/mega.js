const mongoose = require('mongoose')
const { RichEmbed } = require('discord.js')
const Color = require('./color')
const { stripIndents } = require('common-tags')

const megaSchema = new mongoose.Schema({
    displayName: {
        type: String,
        required: true
    },
    ability: [
        {
            type: Number,
            ref: 'Ability',
            required: true
        }
    ],
    type1: {
        type: String,
        required: true
    },
    type2: {
        type: String
    },
    attack: {
        type: Number,
        required: true
    },
    defence: {
        type: Number,
        required: true
    },
    specialAttack: {
        type: Number,
        required: true
    },
    specialDefence: {
        type: Number,
        required: true
    },
    speed: {
        type: Number,
        required: true
    },
    height: {
        type: Number
    },
    weight: {
        type: Number
    },
    spriteCode: {
        type: String
    }
})

megaSchema.plugin(require('mongoose-plugin-autoinc').autoIncrement, {
    model: 'Mega',
    startAt: 1
})

megaSchema.methods.dex = async function(base) {
    const color = await Color.getColorForType(this.type1.toLowerCase())
    const dexString = base.dexNumber.toString().padStart(3, '0')
    const title = `URPG Ultradex - ${this.displayName} (#${dexString})`
    let embed = new RichEmbed()
        .setTitle(title)
        .setColor(color)
        .setImage(
            `https://pokemonurpg.com/img/models/${base.dexNumber}-${this.spriteCode || 'mega'}.gif`
        )
        .addField(
            `${this.type2 ? 'Types' : 'Type'}`,
            `${this.type1}${this.type2 ? ` | ${this.type2}` : ''}`
        )
        .addField('Ability', `${this.ability.abilityName}`)
        .addField('Height and Weight', `${this.height}m, ${this.weight}kg`)

    const stats = Object.values({ hp: base.stats.hp, ...this.stats.toObject() })
    embed.addField(
        'Stats',
        `\`\`\`${stripIndents`HP   | ATT  | DEF  | SP.A | SP.D | SPE
        ${stats.map(s => s.toString().padEnd(4, ' ')).join(' | ')}`}\`\`\``
    )

    return embed
}

module.exports = mongoose.model('Mega', megaSchema)
