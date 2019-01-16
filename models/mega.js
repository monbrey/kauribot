const mongoose = require("mongoose")
const { RichEmbed } = require("discord.js")
const Color = require("./color")
const { oneLine, stripIndent } = require("common-tags")

var megaSchema = new mongoose.Schema({
    displayName: {
        type: String,
        required: true
    },
    ability: [{
        type: Number,
        ref: "Ability",
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

megaSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "Mega",
    startAt: 1
})

megaSchema.methods.dex = async function(base) {
    let embed = new RichEmbed()
        .setTitle(`URPG Ultradex - ${this.displayName} (#${new String(base.dexNumber).padStart(3,"0")})`)
        .setColor(await Color.getColorForType(this.type1.toLowerCase()))
        .setImage(`https://pokemonurpg.com/img/models/${base.dexNumber}-${this.spriteCode || "mega"}.gif`)
        .addField(`${this.type2 ? "Types" : "Type" }`, `${this.type1}${this.type2 ? `\n${this.type2}` : ""}`, true)

    await this.populate("ability").execPopulate()
    embed.addField("Ability", `${this.ability.map(a => a.abilityName).join("\n")}`, true)
        .addBlankField(true)
        .addField("Height", `${this.height}m`, true)
        .addField("Weight", `${this.weight}kg`, true)
        .addBlankField(true)
        .addField("Stats", `\`\`\`${stripIndent`
			HP  | ATT | DEF | SP.A | SP.D | SPE
			${oneLine`
				${new String(base.stats.hp).padEnd(3," ")} | ${new String(this.attack).padEnd(3," ")} |
				${new String(this.defence).padEnd(3," ")} | ${new String(this.specialAttack).padEnd(4," ")} |
				${new String(this.specialDefence).padEnd(4," ")} | ${this.speed}
			`}
		`}\`\`\``)

    return embed
}

module.exports = mongoose.model("Mega", megaSchema)