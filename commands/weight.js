const BaseCommand = require("./base")
const Pokemon = require("../models/pokemon")
const { RichEmbed } = require("discord.js")

module.exports = class WeightCommand extends BaseCommand {
    constructor() {
        super({
            name: "weight",
            category: "Info",
            description: "Provides information on weight-based moves for a specific Pokemon, or interaction between two Pokemon",
            usage: `!weight <Pokemon>
!weight <User> <Target>`,
            enabled: true,
            defaultConfig: true
        })
    }

    calcOne(weight) {
        if (weight.between(0.1, 10)) return 20
        if (weight.between(10.1, 25)) return 40
        if (weight.between(25.1, 50)) return 60
        if (weight.between(50.1, 100)) return 80
        if (weight.between(100.1, 200)) return 100
        if (weight >= 200.1) return 120

        return 0
    }

    calcTwo(user, target) {
        const ratio = Math.floor((user / target))

        if (ratio <= 1) return 40
        if (ratio === 2) return 60
        if (ratio === 3) return 80
        if (ratio === 4) return 100
        if (ratio >= 5) return 120

        return 0
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            // Usage
            return
        }

        try {
            const query = args.join(" ")
            const [one, two, ignore] = query.split(",").map(a => a.trim())

            if (one && !two) {
                let pokemon = await Pokemon.findClosest("uniqueName", one)
                if (pokemon) {
                    message.client.logger.info({ key: "weight", search: query, result: pokemon.uniqueName })
                    const embed = new RichEmbed()
                        .setTitle(pokemon.uniqueName)
                        .setDescription("As the target of Grass Knot or Low Kick")
                        .addField("Weight", `${pokemon.weight}kg`, true)
                        .addField("Move Power", `${this.calcOne(pokemon.weight)} BP`, true)

                    return message.channel.send(embed)
                } else {
                    message.client.logger.info({ key: "dex", search: one, result: "none" })
                    message.channel.sendPopup("warn", `No results found for ${one}`)
                }
            } else if (one && two) {
                let p1 = await Pokemon.findClosest("uniqueName", one)
                let p2 = await Pokemon.findClosest("uniqueName", two)
                if (p1 && p2) {
                    message.client.logger.info({ key: "weight", search: query, result: `${p1.uniqueName} and ${p2.uniqueName}` })
                    const embed = new RichEmbed()
                        .setTitle(`${p1.uniqueName} vs ${p2.uniqueName}`)
                        .setDescription("Using Heat Crash or Heavy Slam")
                        .addField(`${p1.uniqueName}`, `${p1.weight}kg`, true)
                        .addField(`${p2.uniqueName}`, `${p2.weight}kg`, true)
                        .addField("Move Power", `${this.calcTwo(p1.weight, p2.weight)} BP`, true)

                    return message.channel.send(embed)
                }
                if (!p1) {
                    message.client.logger.info({ key: "dex", search: one, result: "none" })
                    message.channel.sendPopup("warn", `No results found for ${one}`)
                }
                if (!p2) {
                    message.client.logger.info({ key: "dex", search: two, result: "none" })
                    message.channel.sendPopup("warn", `No results found for ${two}`)
                }
                return
            }
        } catch (e) {
            message.client.logger.parseError(e, this.name)
            return message.channel.sendPopup("error", "Error searching the database")
        }
    }
}