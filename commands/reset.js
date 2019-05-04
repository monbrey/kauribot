const BaseCommand = require('./base')

/* OWNER ONLY COMMAND */
module.exports = class ResetCommand extends BaseCommand {
    constructor() {
        super({
            name: 'reset',
            category: 'Admin',
            description: 'Resets the channel or guild',
            args: { target: { type: 'String' } },
            enabled: true,
            guildOnly: true
        })
    }

    async run(message, args = [], flags = []) {
        const target = args.get('target')

        if (target === 'channel') {
            try {
                let clone = await message.channel.clone()
                await clone.setParent(message.channel.parent)
                await clone.setPosition(message.channel.position)
                message.client.logger.prune(message, 'all')
                return message.channel.delete()
            } catch (e) {
                message.client.logger.parseError(e, 'prune')
                return message.channel.sendPopup('error', 'Error resetting channel')
            }
        } else if (target === 'guild') {
            for (const [, c] of message.guild.channels) {
                await c.delete()
            }
            message.guild.createChannel('general', { type: 'text' })
        }
    }
}
