const mongoose = require('mongoose')
const {
	RichEmbed
} = require('discord.js')
const Color = require('./color')

var megaSchema = new mongoose.Schema({
	displayName: {
		type: String,
		required: true
	},
	ability: [{
		type: Number,
		ref: 'Ability',
		required: true,
	}],
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

megaSchema.methods.dex = async function (base) {
	let blankField = {
		"name": '\u200B',
		"value": '\u200B',
		"inline": true
	}
	let embed = {
		"title": `URPG Ultradex - ${this.displayName} (#${new String(base.dexNumber).padStart(3,'0')})`,
		"color": parseInt(await Color.getColorForType(this.type1.toLowerCase()), 16),
		"image": {
			"url": `https://pokemonurpg.com/img/models/${base.dexNumber}-${this.spriteCode || "mega"}.gif`
		},
		"fields": [{
			"name": `${this.type2 ? "Types" : "Type" }`,
			"value": `${this.type1}${this.type2 ? `\n${this.type2}` : ''}`,
			"inline": true
		}],
		"footer": {}
	}

	await this.populate('ability').execPopulate()
	embed.fields.push({
		"name": "Ability",
		"value": `${this.ability.map(a => a.abilityName).join('\n')}`,
		"inline": true
	})
	embed.fields.push(blankField)

	embed.fields.push({
		"name": "Height",
		"value": `${this.height}m`,
		"inline": true
	})
	embed.fields.push({
		"name": "Weight",
		"value": `${this.weight}kg`,
		"inline": true
	})
	embed.fields.push(blankField)

	embed.fields.push({
		"name": "Stats",
		"value": `\`\`\`
HP  | ATT | DEF | SP.A | SP.D | SPE
${new String(base.hp).padEnd(3,' ')} | ${new String(this.attack).padEnd(3,' ')} | ${new String(this.defence).padEnd(3,' ')} | ${new String(this.specialAttack).padEnd(4,' ')} | ${new String(this.specialDefence).padEnd(4,' ')} | ${this.speed}\`\`\``
	})

	return new RichEmbed(embed)
}

module.exports = mongoose.model('Mega', megaSchema)
