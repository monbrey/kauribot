const BaseCommand = require('./base')
const LogConfig = require('../models/logConfig')

module.exports = class LogsCommand extends BaseCommand {
    constructor() {
        super({
            name: 'logs',
            category: 'Admin',
            description: 'Set the logging channel for the server.',
            args: {
                channel: { type: 'TextChannel' }
            },
            syntax: '!logs [TextChannel]',
            enabled: true,
            guildOnly: true
        })
    }

    async run(message, args = [], flags = []) {
        const target = args.get('channel')

        if (!target) {
            if (message.guild.logChannel)
                return message.channel.sendPopup(
                    'success',
                    `Logs are being output to ${message.guild.logChannel}.`
                )
            else
                return message.channel.sendPopup(
                    'warn',
                    'Logging is not configured for this server.'
                )
        } else if (target.constructor.name !== 'TextChannel')
            return message.channel.sendPopup(
                'warn',
                'To set a destination for log output, you must mention a TextChannel'
            )
        else {
            if (!target.permissionsFor(message.guild.me).has('SEND_MESSAGES', true))
                return message.channel.sendPopup(
                    'warn',
                    `Cannot send messages to ${target} - please change the bot permissions for that channel, or select a different channel`
                )

            try {
                await LogConfig.setLogChannel(message.guild.id, target.id)
                message.guild.logChannel = target
                message.client.logger.logs(message, target)
                return message.channel.sendPopup(
                    'success',
                    `Logs will be sent to ${target}. It is recommended that you prevent other users from sending messages to this channel.`,
                    0
                )
            } catch (e) {
                message.client.logger.parseError(e, 'config')
                return message.channel.sendPopup(
                    'error',
                    `Error updating logs configuration: ${e.message}`
                )
            }
        }
    }
}
