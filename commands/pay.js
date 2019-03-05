const { RichEmbed } = require("discord.js")
const BaseCommand = require("./base")
const Trainer = require("../models/trainer")

module.exports = class PayCommand extends BaseCommand {
    constructor() {
        super({
            name: "pay",
            category: "Game",
            description: "Adds money to a mentioned user's account",
            args: {
                "target": { type: "GuildMember" },
                "amount": { type: "String" },
                "reason": { type: "String" }
            },
            usage: "!pay <@User> <amount> [reason]",
            enabled: true,
            defaultConfig: false,
            requiresRole: ["moderator", "official", "chief-judge",
                "elder-arbiter", "elite-ranger", "expert-curator",
                "lead-grader", "senior-referee"
            ],
            examples: [
                "!pay @User $10000 Grader Wages",
                "!pay @User 5000CC Contest bonus event",
                "Default currency is Cash if none specified"
            ]
        })
    }

    async run(message, args = [], flags = []) {
        const { client: { logger } } = message

        let trainer = await Trainer.findById(args.get("target").id).catch(e => logger.parseError(e, this.name))
        if (!trainer) return message.channel.sendPopup("warn", `Could not find a URPG trainer for ${args.get("target")}`)

        if (!/^\$?[1-9][0-9,]* ?(?:CC)?$/gi.test(args.get("amount")))
            return message.channel.sendPopup("warn", `Provided amount "${args.get("amount")}" is not valid`)

        args.set("type", /^[1-9][0-9,]*(?:CC)$/gi.test(args.get("amount")) ? "cc" : "cash")
        args.set("amount", parseInt(args.get("amount").replace(/\D/g, "")))
        let currency = args.get("type") === "cc" ?
            `${args.get("amount").toLocaleString()} CC` :
            `$${args.get("amount").toLocaleString()}`

        let embed = new RichEmbed()
            .setTitle(`Payment to ${args.get("target").displayName} (Pending)`)
            .setDescription(args.get("reason"))
            .addField("Amount", `${currency}`, true)
            .setFooter("React to confirm that this payment is correct")

        try {
            let prompt = await message.channel.send(embed)

            if (await prompt.reactConfirm(message.author.id)) {
                prompt.clearReactions()

                try {
                    if (args.get("type") === "cc") await trainer.modifyContestCredit(args.get("amount"))
                    else await trainer.modifyCash(args.get("amount"))
                } catch (e) {
                    message.channel.sendPopup("error", "Error updating balances in database")
                    return message.client.logger.parseError(e, "pay")
                }

                embed.setTitle(`Payment to ${args.get("target").displayName}`)
                    .addField("Updated Balance", await trainer.balanceString)

                prompt.edit(embed)
                return message.client.logger.pay(message, prompt)
            }
        } catch (e) { logger.parseError(e, this.name) }
    }
}