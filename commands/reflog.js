const BaseCommand = require('./base')
const { RichEmbed, MessageMentions } = require('discord.js')
const Trainer = require('../models/trainer')
const { stripIndents } = require('common-tags')

module.exports = class RefLogCommand extends BaseCommand {
    constructor() {
        super({
            name: 'reflog',
            category: 'Game',
            aliases: ['rl'],
            description: 'Logs a battle and awards cash to Battlers and Referee',
            syntax: '!reflog',
            enabled: true,
            guildOnly: true
        })
    }

    async getSize({ author }, logMessage) {
        const log = new RichEmbed(logMessage.embeds[0])
        log.addField('Battle Size', '\u200b')
        const field = log.fields[log.fields.length - 1]

        await logMessage.edit(log)

        const { two, three, four, five, six } = require('../util/emojiCharacters')
        const reacts = [two, three, four, five, six]
        for (const r of reacts) await logMessage.react(r)

        const filter = (r, u) => reacts.includes(r.emoji.name) && u.id === author.id
        const response = await logMessage.awaitReactions(filter, { max: 1, time: 30000 })

        await logMessage.clearReactions()
        if (!response.first()) {
            field.value = 'Battle size selection timed out'
            await logMessage.edit(log)
            return null
        }

        const size = reacts.indexOf(response.first().emoji.name) + 2
        log.fields.splice(log.fields.length - 1)
        log.setTitle(`${size}v${size} Battle Log`)
        await logMessage.edit(log)
        return size
    }

    async getGym({ author }, logMessage) {
        const log = new RichEmbed(logMessage.embeds[0])
        log.addField('Was this a gym battle?', '\u200b')
        const field = log.fields[log.fields.length - 1]
        await logMessage.edit(log)

        const gym = await logMessage.reactConfirm(author.id)
        if (gym === null) {
            field.value = 'Gym battle confirmation timed out'
            await logMessage.edit(log)
            return null
        }

        log.fields.splice(log.fields.length - 1)
        return gym
    }

    async getTrainers({ channel, author }, logMessage) {
        const log = new RichEmbed(logMessage.embeds[0])
        log.addField(
            'Battlers',
            stripIndents`Please mention the Battlers who participated in a single message
            The winner(s) should be mentioned first`
        )
        const field = log.fields[log.fields.length - 1]

        const filter = m =>
            m.author.id === author.id &&
            m.mentions.users.size % 2 === 0 &&
            !m.mentions.users.has(m.author.id)
        const trainerPrompt = await channel.awaitMessages(filter, { maxMatches: 1, time: 60000 })

        if (!trainerPrompt.first()) {
            field.value = 'Prompt timed out before Battlers were mentioned'
            await logMessage.edit(log)
            return null
        }

        const response = trainerPrompt.first().content
        const trainers = await Promise.all(
            response
                .split(' ')
                .filter(t => t.match(MessageMentions.USERS_PATTERN))
                .map(t => {
                    return Trainer.findById(t.replace(/[<@!>]/g, ''))
                })
        )

        if (trainers.includes(null) || trainers.length % 2 !== 0) {
            field.value =
                'A Trainer profile could not be fetched for one or more of the Coordinators'
            await logMessage.edit(log)
            return null
        }

        return trainers
    }

    getPayments(size) {
        switch (size) {
            case '2':
                return [1000, 500, 1000]
            case '3':
                return [1500, 500, 1500]
            case '4':
                return [2500, 1000, 2000]
            case '5':
                return [3500, 1500, 2500]
            case '6':
                return [5000, 2500, 4000]
        }
    }

    async getDescription({ channel, author }, logMessage) {
        const log = new RichEmbed(logMessage.embeds[0])
        log.addField('Description', 'Please provide a description or log URL for the battle')
        const field = log.fields[log.fields.length - 1]

        await logMessage.edit(log)

        const filter = m => m.author.id === author.id
        const description = await channel.awaitMessages(filter, { maxMatches: 1, time: 60000 })

        if (!description.first()) {
            field.value = 'Prompt timed out before a description was provided'
            await logMessage.edit(log)
            return null
        }

        const response = description.first().content
        log.fields.slice(log.fields.length - 1)
        log.setDescription(response)
        await logMessage.edit(log)
        return response
    }

    async run(message, args = [], flags = []) {
        const ref = await Trainer.findById(message.author.id)

        const log = new RichEmbed().setTitle('Contest Log').setColor('0x1f8b4c')
        const logMessage = await message.channel.send(log)

        const size = await this.getSize(message, logMessage)
        if (!size) return

        const gym = size === 2 ? false : await this.getGym(message, logMessage)
        if (gym === null) return
        if (gym) {
            log.setTitle(`${size}v${size} Gym Battle Log`)
            await logMessage.edit(log)
        }

        const trainers = await this.getTrainers(message, logMessage)
        if (!trainers) return
        const [winner, loser] = trainers

        const payments = this.getPayments(size)
        if (gym) payments[0] += 500

        log.fields.splice(log.fields.length - 1)
        const pays = [
            `Winner | <@${winner._id}> | $${payments[0].toLocaleString()}`,
            `Loser | <@${loser._id}> | $${payments[1].toLocaleString()}`,
            `Referee | <@${ref.id}> | $${payments[2].toLocaleString()}`
        ].join('\n')

        log.addField('Payments', pays)
        await logMessage.edit(log)

        const desc = await this.getDescription(message, logMessage)
        if (!desc) return null

        log.setFooter('React to confirm that this log is correct')
        await logMessage.edit(log)

        if (await logMessage.reactConfirm(message.author.id)) {
            logMessage.clearReactions()

            const doPayments = [
                winner.modifyCash(payments[0]),
                loser.modifyCash(payments[1]),
                ref.modifyCash(payments[2])
            ]
            try {
                await Promise.all(doPayments)
            } catch (e) {
                e.key = 'reflog'
                throw e
            }

            log.setTitle(`${log.title} (Confirmed)`)
            delete log.footer
            logMessage.edit(log)
            return message.client.logger.refLog(message, logMessage)
        } else return log.delete()
    }
}
