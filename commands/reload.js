const BaseCommand = require("./base")
const CommandConfig = require("../models/commandConfig")

module.exports = class ReloadCommand extends BaseCommand {
    constructor() {
        super({
            name: "reload",
            description: "Reloads the provides command or event handler",
            enabled: true,
            defaultConfig: false,
            requiresOwner: true
        })
    }

    async run(message, args = [], flags = []) {
        args.forEach(async (arg) => {
            let command = message.client.commands.get(arg)
            if(command) {
                try {
                    const _command = require(`./${arg.toLowerCase()}`)
                    if (!_command) throw new Error()
                    let command = new _command()
                    //Check if the command is enabled globally
                    if (command.enabled) {
                        await command.setConfig(await CommandConfig.getConfigForCommand(message.client, command))
                        //Check if the command has an init method
                        if (command.init)
                            await command.init(message.client)

                        message.client.commands.set(command.name, command)
                        if (command.aliases) {
                            command.aliases.forEach(alias => message.client.aliases.set(alias, command.name))
                        }
                        return message.channel.send(`${command.constructor.name} loaded`)
                    } else {
                        return message.channel.send(`${command.constructor.name} is disabled`)
                    }
                } catch (e) {
                    message.channel.send(`${arg} failed to load`)
                    return message.client.logger.error(`${arg} failed to reload\n${e.stack}`, {
                        key: "reload"
                    })
                } finally {
                    delete require.cache[require.resolve(`./${arg.toLowerCase()}`)]
                }
            } else if(message.client.listeners(arg).length > 0) {
                try {
                    const _event = require(`../events/${arg}`)
                    let event = new _event()
        
                    if (event.enabled) {
                        message.client.removeAllListeners(arg)
                        message.client.on(event.name, event.run)
                        return await message.client.logger.info(`${event.constructor.name} loaded`)
                    } else return await message.client.logger.info(`${event.constructor.name} is disabled`)
                } catch (e) {
                    return await message.client.logger.error(`${arg} failed to load\n${e.stack}`)
                } finally {
                    delete require.cache[require.resolve(`../events/${arg}`)]
                }
            }
        })
    }
}
