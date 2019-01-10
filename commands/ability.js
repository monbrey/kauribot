const BaseCommand = require("./base")
const Ability = require("../models/ability")

module.exports = class AbilityCommand extends BaseCommand {
    constructor() {
        super({
            name: "ability",
            description: "Provides Ability information",
            usage: "!ability <Ability>",
            enabled: true,
            defaultConfig: true
        })
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            //Usage
            return
        }
        
        let query = args.join(" ")
        message.client.logger.info(`${message.author.username} searched for ${query}`, { key: "ability" })

        let ability = await Ability.findExact(query)
        if (ability) {
            return await message.channel.send(ability.info())
        } else {
            let abilities = await Ability.findPartial(query)
            if (abilities.length === 0) return await message.channel.send(`No results found for ${query}`)
            else if (abilities.length === 1) return await message.channel.send(ability[0].info())
            else return await message.channel.send({
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
