const BaseCommand = require("./base")
const Ability = require("../models/ability")

module.exports = class AbilityCommand extends BaseCommand {
    constructor() {
        super({
            name: "ability",
            category: "Info",
            description: "Provides information on Pokemon Abilities",
            usage: "!ability <Ability>",
            enabled: true,
            defaultConfig: true,
            examples: [
                "!ability Overgrow",
                "!ability Blaze",
                "!ability Torrent"
            ]
        })
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            return this.getHelp(true)
        }

        let query = args.join(" ")
        let ability = await Ability.findExact(query)
        if (ability) {
            message.client.logger.info({ key: "ability", search: query, result: 1 })
            return message.channel.send(ability.info())
        } else {
            message.client.logger.info({ key: "ability", search: query, result: abilities.length })
            let abilities = await Ability.findPartial(query)
            if (abilities.length === 0) return message.channel.send(`No results found for ${query}`)
            else if (abilities.length === 1) return message.channel.send(ability[0].info())
            else {
                return message.channel.send({
                    "embed": {
                        title: `${abilities.length} results found for "${query}"`,
                        description: `${abilities.map(a => a.abilityName).join("\n")}`,
                        footer: {
                            text: "For more information, search again with one of the listed abilities"
                        }
                    }
                })
            }
        }
    }
}