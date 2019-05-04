const { RichEmbed } = require('discord.js')
const BaseCommand = require('./base')
const Trainer = require('../models/trainer')

module.exports = class PayCommand extends BaseCommand {
    constructor() {
        super({
            name: 'pay',
            category: 'Game',
            description: 'Adds money to a mentioned user\'s account',
            args: {
                target: { type: 'GuildMember', required: true },
                amount: { type: 'String', required: true },
                reason: { type: 'String' }
            },
            syntax: '!pay <@User> <amount> [reason]',
            enabled: true,
            guildOnly: true
        })
    }

    async run(message, args = [], flags = []) {
        const target = args.get('target')
        const trainer = await Trainer.findById(target.id)
        if (!trainer)
            return message.channel.sendPopup(
                'warn',
                `Could not find a Trainer profile for ${target}`
            )

        let amount = args.get('amount')
        if (!/^\$?[1-9][0-9,]* ?(?:CC)?$/gi.test(amount))
            return message.channel.sendPopup(
                'warn',
                `Provided amount "${amount}" is not a valid number`
            )

        const type = /^[1-9][0-9,]*(?:CC)$/gi.test(amount) ? 'cc' : 'cash'
        amount = parseInt(args.get('amount').replace(/\D/g, ''))
        let currency =
            type === 'cc' ? `${amount.toLocaleString()} CC` : `$${amount.toLocaleString()}`

        let embed = new RichEmbed()
            .setTitle(`Payment to ${target.displayName} (Pending)`)
            .setDescription(args.get('reason'))
            .addField('Amount', `${currency}`, true)
            .setFooter('React to confirm that this payment is correct')

        try {
            let prompt = await message.channel.send(embed)

            if (await prompt.reactConfirm(message.author.id)) {
                prompt.clearReactions()

                try {
                    if (type === 'cc') await trainer.modifyContestCredit(amount)
                    else await trainer.modifyCash(amount)
                } catch (e) {
                    e.key = this.name
                    throw e
                }

                embed
                    .setTitle(`Payment to ${target.displayName}`)
                    .addField('Updated Balance', trainer.balanceString)

                prompt.edit(embed)
                return message.client.logger.pay(message, prompt)
            }
        } catch (e) {
            e.key = this.name
            throw e
        }
    }
}
