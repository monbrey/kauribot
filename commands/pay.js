const { RichEmbed } = require("discord.js")
const BaseCommand = require("./base")
const Trainer = require("../models/trainer")

module.exports = class PayCommand extends BaseCommand {
    constructor() {
        super({
            name: "pay",
            category: "Game",
            description: "Adds money to a mentioned user's account",
            usage: "!pay [-cc] <@User> <amount>",
            enabled: true,
            defaultConfig: false,
            requiresRole: ["moderator", "official", "chief-judge",
                "elder-arbiter", "elite-ranger", "expert-curator",
                "lead-grader", "senior-referee"
            ]
        })
    }

    async run(message, args = [], flags = []) {
        let member = message.mentions.members.first()
        if (!member)
            return message.channel.send("You must mention a URPG player to pay")
        if (!args[1])
            return message.channel.send("You must provide an amount of money > 0")

        if (member.id === message.author.id)
            return message.channel.send("You cannot use this command to pay yourself")

        let trainer = await Trainer.findByDiscordId(member.id)
        if (!trainer)
            return message.channel.send(`Could not find a URPG Trainer for ${member}`)

        if(!/^\$[1-9][0-9]*$/.test(args[1]))
            return message.channel.send(`Provided amount "${args[1]}" is not a positive whole number > 0`)

        let amount = parseInt(args[1])
        let currency = flags.includes("cc") ? `${amount.toLocaleString()} CC` : `$${amount.toLocaleString()}`

        let embed = new RichEmbed()
        .setTitle("Payment pending")
        .setDescription(`Please confirm the payment of ${currency} to ${member.displayName}`)

        let prompt = await message.channel.send(embed)

        if (await prompt.reactConfirm(message.author.id)) {
            flags.includes("cc") ? await trainer.modifyContestCredit(amount) : await trainer.modifyCash(amount)

            embed.setTitle("Payment confirmed")
            .addField("New cash balances", await trainer.getBalanceString())

            await prompt.edit(embed)
        }
    }
}