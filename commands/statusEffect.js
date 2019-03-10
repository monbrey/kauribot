const BaseCommand = require("./base")
const StatusEffect = require("../models/statusEffect")


module.exports = class StatusEffectCommand extends BaseCommand {
    constructor() {
        super({
            name: "statuseffect",
            aliases: ["se"],
            category: "Info",
            description: "Provides Status Effect information",
            syntax: "!statuseffect <Status>",
            enabled: true,
            defaultConfig: { "guild": true }
        })
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            return message.channel.sendPopup("warn", `**Incorrect command usage**\n\n\`\`\`${this.usage}\`\`\``)
        }

        let query = args.join(" ")

        try {
            const [s1, s2] = await Promise.all([
                await StatusEffect.findClosest("statusName", query),
                await StatusEffect.findClosest("shortCode", query),
            ])

            
            const effect = s2 ? (s1 ? (s1.matchRating > s2.matchRating ? s1 : s2) : s2) : s1

            if (effect) {
                message.client.logger.statusEffect(message, query, effect.statusName)
                return message.channel.send(await effect.info())
            } else {
                message.client.logger.statusEffect(message, query, "none")
                return message.channel.send(`No results found for ${query}`)
            }
        } catch (e) {
            message.client.logger.parseError(e, "statusEffect")
            return message.channel.sendPopup("error", "Error retrieving Status information")
        }
    }
}
