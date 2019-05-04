const BaseCommand = require('./base')
const CommandConfig = require('../models/commandConfig')

module.exports = class ReloadCommand extends BaseCommand {
    constructor() {
        super({
            name: 'reload',
            description: 'Reloads the provided command or event handler',
            enabled: true,
            args: { commands: { type: 'String' } }
        })
    }

    async run(message, args = [], flags = []) {
        const commands = args.get('commands')
        for (const c of commands) {
            let oldCommand = message.client.commands.get(c.toLowerCase())
            if (oldCommand) {
                try {
                    const _cmd = require(`./${oldCommand.name}`)
                    let command = new _cmd()
                    // Check if the command is enabled globally
                    if (!command.enabled) return

                    command.config =
                        (await CommandConfig.find({ commandName: command.name })) ||
                        (await CommandConfig.create({ commandName: command.name }))

                    if (command.init) await command.init(message.client)

                    message.client.commands.set(command.name, command)
                    if (command.aliases) {
                        for (const a of command.aliases) message.client.commands.set(a, command)
                    }
                    return message.channel.send(`${command.constructor.name} reloaded`)
                } catch (e) {
                    message.channel.send(`${c} failed to load`)
                    message.client.logger.parseError(e, this.name)
                } finally {
                    delete require.cache[require.resolve(`./${c.toLowerCase()}`)]
                }
            } else if (message.client.listeners(c).length > 0) {
                try {
                    const _event = require(`../events/${c}`)
                    let event = new _event()

                    if (event.enabled) {
                        message.client.removeAllListeners(c.toLowerCase())
                        message.client.on(event.name, event.run)
                        return message.client.logger.info(`${event.constructor.name} loaded`)
                    } else
                        return message.client.logger.info(`${event.constructor.name} is disabled`)
                } catch (e) {
                    return message.client.logger.parseError(e, this.name)
                } finally {
                    delete require.cache[require.resolve(`../events/${c.toLowerCase()}`)]
                }
            }
        }
    }
}
