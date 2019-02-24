const { RichEmbed } = require("discord.js")
const BaseCommand = require("./base")
const Trainer = require("../models/trainer")

module.exports = class DeductCommand extends BaseCommand {
    constructor() {
        super({
            name: "deduct",
            category: "Game",
            description: "Removes money from a mentioned user's account",
            usage: "!deduct",
            enabled: true,
            defaultConfig: false,
            requiresRole: ["moderator", "official", "chief-judge",
                "elder-arbiter", "elite-ranger", "expert-curator",
                "lead-grader", "senior-referee"
            ],
            examples: [
                "!deduct @User 10000 <reason>",
                "!deduct @User 5000cc <reason>"
            ]
        })
    }

    async run(message, args = [], flags = []) {
        let member = message.mentions.members.first()
        if (!member)
            return message.channel.sendPopup("warn", "You must mention a URPG player")
        if (!args[1])
            return message.channel.sendPopup("warn", "You must provide an amount of money > 0")

        let trainer = await Trainer.findById(member.id)
        if (!trainer)
            return message.channel.sendPopup("error", `Could not find a URPG Trainer for ${member}`)

        let arg = args.splice(1).join(" ")
        if(!/^\$?[1-9][0-9,]* ?(?:CC)?$/gi.test(arg))
            return message.channel.sendPopup("error", `Provided amount "${arg}" is not valid`)

        let type = /^[1-9][0-9,]* (?:CC)$/gi.test(arg) ? "cc" : "cash"
        let amount = parseInt(arg.replace(/\D/g, ""))
        let currency = type === "cc" ? `${amount.toLocaleString()} CC` : `$${amount.toLocaleString()}`

        let embed = new RichEmbed()
            .setTitle("Deduction pending")
            .setDescription(`Please confirm the deduction of ${currency} from ${member.displayName}`)

        let prompt = await message.channel.send(embed)

        if (await prompt.reactConfirm(message.author.id)) {
            flags.includes("cc") ? await trainer.modifyContestCredit(-amount) : await trainer.modifyCash(-amount)

            embed.setTitle("Deduction confirmed")
                .addField("New cash balances", await trainer.balanceString)

            prompt.edit(embed)
            message.client.logger.deduct(message, member, currency, prompt)
        } else {
            prompt.delete()
            message.channel.sendPopup("cancel", "No deduction has been made")
        }
    }
}