const { RichEmbed } = require("discord.js")
const BaseCommand = require("./base")
const Trainer = require("../models/trainer")

module.exports = class DeductCommand extends BaseCommand {
    constructor() {
        super({
            name: "deduct",
            category: "Game",
            description: "Removes money from a mentioned user's account",
            args: {
                "target": "GuildMember",
                "amount": "String",
                "reason": "String"
            },
            usage: "!deduct @User <amount> [reason]",
            enabled: true,
            defaultConfig: false,
            requiresRole: ["moderator", "official", "chief-judge",
                "elder-arbiter", "elite-ranger", "expert-curator",
                "lead-grader", "senior-referee"
            ],
            examples: [
                "!deduct @User 10000 Overpaid by mistake",
                "!deduct @User 1000CC Error in Contest log"
            ]
        })
    }

    async run(message, args = [], flags = []) {
        args = await this.parseArgs(message, args)
        if (!args) return
        let trainer = await Trainer.findById(args.get("target").id)
        if (!trainer) return message.channel.sendPopup("warn", `Could not find a URPG trainer for ${args.get("target")}`)

        if (!/^\$?[1-9][0-9,]* ?(?:CC)?$/gi.test(args.get("amount")))
            return message.channel.send(`Provided amount "${args.get("amount")}" is not valid`)

        args.set("type", /^[1-9][0-9,]*(?:CC)$/gi.test(args.get("amount")) ? "cc" : "cash")
        args.set("amount", parseInt(args.get("amount").replace(/\D/g, "")))
        let currency = args.get("type") === "cc" ? `${args.get("amount").toLocaleString()} CC` : `$${args.get("amount").toLocaleString()}`

        let embed = new RichEmbed()
            .setTitle(`Deduction from ${args.get("target").displayName} (Pending)`)
            .setDescription(args.get("reason"))
            .addField("Amount", `${currency}`, true)
            .setFooter("React to confirm that this deduction is correct")

        let prompt = await message.channel.send(embed)

        if (await prompt.reactConfirm(message.author.id)) {
            prompt.clearReactions()
            
            try {
                if(args.get("type") === "cc") await trainer.modifyContestCredit(-args.get("amount"))
                else await trainer.modifyCash(-args.get("amount"))
            } catch (e) {
                message.channel.sendPopup("error", "Error updating balances in database")
                return message.client.logger.error({ code: e.code, stack: e.stack, key: "deduct" })
            }

            embed.setTitle(`Deduction from ${args.get("target").displayName}`)
                .addField("Updated Balance", await trainer.balanceString)

            prompt.edit(embed)
            return message.client.logger.deduct(message, prompt)
        }
    }
}