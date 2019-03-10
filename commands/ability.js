const BaseCommand = require("./base")
const Ability = require("../models/ability")

module.exports = class AbilityCommand extends BaseCommand {
    constructor() {
        super({
            name: "ability",
            category: "Info",
            description: "Provides information on Pokemon Abilities",
            syntax: "!ability <ability>",
            enabled: true,
            defaultConfig: { "guild": true }
        })
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            return this.getHelp(true)
        }

        let query = args.join(" ")
        try {
            let ability = await Ability.findClosest("abilityName", query)
            if (ability) {
                message.client.logger.ability(message, query, ability.abilityName)
                return message.channel.send(ability.info())
            } else {
                message.client.logger.ability(message, query, "none")
                return message.channel.sendPopup("warn", `No results found for ${query}`)
            }
        } catch (e) {
            message.client.logger.parseError(e, "ability")
            return message.channel.sendPopup("error", "Error searching the database")
        }
    }
}