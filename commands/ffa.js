const BaseCommand = require('./base')
const Trainer = require('../models/trainer')
const { stripIndents } = require('common-tags')

module.exports = class FFACommand extends BaseCommand {
    constructor() {
        super({
            name: 'ffa',
            category: 'Game',
            description: 'Add/remove yourself or ping the FFA list',
            syntax: '!ffa <-a|-r|-p>',
            enabled: true,
            guildOnly: true
        })
    }

    async run(message, args = [], flags = []) {
        if (flags.length !== 1) {
            return this.getHelp(message.channel)
        }

        if (flags.some(f => ['a', 'add'].includes(f))) {
            try {
                const trainer = await Trainer.findById(message.author.id)
                if (!trainer)
                    return message.channel.sendPopup('warn', 'Could not find a Trainer profile')
                trainer.ffaPing = true
                await trainer.save()
                return message.channel.sendPopup(
                    'success',
                    `FFA tagging enabled for ${message.author}`
                )
            } catch (e) {
                message.client.logger.parseError(e, 'ffa')
                return message.channel.sendPopup(
                    'error',
                    'Error updating Trainer settings in the database'
                )
            }
        } else if (flags.some(f => ['r', 'remove'].includes(f))) {
            try {
                const trainer = await Trainer.findById(message.author.id)
                if (!trainer)
                    return message.channel.sendPopup('warn', 'Could not find a Trainer profile')
                trainer.ffaPing = false
                await trainer.save()
                return message.channel.sendPopup(
                    'success',
                    `FFA tagging disabled for ${message.author}`
                )
            } catch (e) {
                message.client.logger.parseError(e, 'ffa')
                return message.channel.sendPopup(
                    'error',
                    'Error updating Trainer settings in the database'
                )
            }
        } else if (flags.some(f => ['p', 'ping'].includes(f))) {
            // Fetch all the guild members
            await message.guild.fetchMembers()

            const pings = await Trainer.find({ ffaPing: true }).select('_id')
            const pingList = pings
                .filter(p => message.guild.members.has(p._id))
                .map(p => `<@${p._id}>`)
                .join('\n')

            return message.channel.send(stripIndents`**FFA Ping List called by ${message.member}**

                Use \`ffa -add\` to add yourself to this list
                Use \`ffa -remove\` to be removed.

                ${pingList}`)
        }
    }
}
