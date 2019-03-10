const BaseCommand = require("./base")
const EOT = require("../models/eot")
const { RichEmbed } = require("discord.js")

module.exports = class EotCommand extends BaseCommand {
    constructor() {
        super({
            name: "eot",
            category: "Info",
            description: "Provides End-of-Turn effect information from the Refpedia",
            syntax: "!eot <effect>",
            enabled: true,
            defaultConfig: { "guild": true }
        })
    }

    async run(message, args = [], flags = []) {
        const query = args.join(" ")
        const effect = await EOT.getEffect(query)
        const surrounding = await EOT.getSurrounding(effect.order)

        const grouped = []
        for(const e of surrounding) {
            const same = grouped.find(g => g.order === e.order)
            if(same) same.effect = `${same.effect}, ${e.effect}`
            else grouped.push(e)
        }

        const embed = new RichEmbed()
            .setTitle(effect.effect)
            .setDescription(`${effect.effect} occurs at position ${effect.order}`)
            .addField("Surrounding Effects", `${grouped.map(g => `${g.order.toString().includes(".") ? " - " : ""}${g.order}. ${g.effect}`).join("\n")}`)
            
        return message.channel.send(embed)
    }
}
