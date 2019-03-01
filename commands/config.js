const BaseCommand = require("./base")
const CommandConfig = require("../models/commandConfig")
const LogConfig = require("../models/logConfig")
const StarboardConfig = require("../models/starboardConfig")

module.exports = class ConfigCommand extends BaseCommand {
    constructor() {
        super({
            name: "config",
            category: "Admin",
            description: "Change bot configuration in this server.",
            syntax: "!config [command] [-switch] [#channel(s)]",
            usage: `No args : Run config wizard
command : Get status of command
-switch : Set server config [-enable|-disable]
#channel(s) : Set channel config`,
            enabled: true,
            defaultConfig: true,
            lockConfig: true,
            guildOnly: true,
            requiresPermission: ["ADMINISTRATOR", "MANAGE_ROLES"],
            examples: [
                "Get command stats: !config dice",
                "Toggle command config: !config -enable/-disable dice",
                "Channel-specific config: !config -enable dice #channel",
                "Clear command config: !config -clear dice",
                "Set logging: !config -set logs #channel",
                "Set starboard: !config -set starboard #channel",
                "Clear configuration: !config -clear dice"
            ]
        })
    }

    async runWizard(message) {
        message.channel.send("Wizardy stuff not yet implemented - use specific config commands")
    }

    /**
     * @param {Message} message - A Discord.Message object 
     * @param {string} arg - Configuration to retrieve
     */
    async getConfig(message, arg) {
        switch (arg) {
            case "logs": 
                if (message.guild.logChannel) return message.channel.send(`Logs are being output to ${message.guild.logChannel}.`)
                else return message.channel.send("Logging is not configured for this server.")
            case "starboard": {
                let starChannel = message.guild.channels.get(message.guild.starboard.channel)
                if (starChannel) return message.channel.send(`The Starboard for this server is ${starChannel}.`)
                else return message.channel.send("The Starboard is not configured for this server, or is missing.")
            }
            case "starboard-emoji":
                if (message.guild.starboard && message.guild.starboard.emoji)
                    return message.channel.send(`The Starboard emoji for this server is ${message.guild.starboard.emoji}.`)
                else return message.channel.send("The Starboard is not configured for this server")
            case "starboard-reacts":
                if (message.guild.starboard && message.guild.starboard.minReacts)
                    return message.channel.send(`The Starboard minimum reactions for this server is ${message.guild.starboard.minReacts}.`)
                else return message.channel.send("The Starboard is not configured for this server")
        }

        let command = message.client.commands.get(arg)
        if (!command) return message.channel.send(`No command matching ${message.client.prefix}${arg} found.`)

        if (command.lockConfig) return message.channel.send(`${message.client.prefix}${arg} is always enabled and is not a configurable command.`)

        if (!command.config.guilds.has(message.guild.id)) return message.channel.send(`${message.client.prefix}${arg} is not configured for this server.`)

        let embed = {
            "fields": []
        }

        let guildConf = command.config.guilds.get(message.guild.id)
        embed.fields.push({
            "name": `Server configuration for ${message.client.prefix}${arg}`,
            "value": guildConf ? "Enabled" : "Disabled"
        })

        let overrides = {
            "name": "Channel overrides",
            "value": ""
        }
        message.guild.channels.forEach(gc => {
            if (command.config.channels.has(gc.id)) {
                let channelConf = command.config.channels.get(gc.id)
                if (channelConf !== guildConf)
                    overrides.value += `#${gc.name} : ${channelConf ? "Enabled" : "Disabled"}\n`
            }
        })

        if (overrides.value !== "")
            embed.fields.push(overrides)

        return await message.channel.send({
            "embed": embed
        })
    }

    async setCommand(message, arg, status) {
        let command = message.client.commands.get(arg)
        if (!command) return message.channel.send(`No command matching ${message.client.prefix}${arg} found.`)
        if (command.lockConfig) return message.channel.send(`${message.client.prefix}${arg} is always enabled and is not a configurable command.`)

        if (message.mentions.channels.size > 0) {
            let dbConfig = await CommandConfig.getConfigForCommand(message.client, command)

            try {
                // If no guild config exists, set it to false as a default
                if (!command.config.guilds.has(message.guild.id)) await dbConfig.setGuild(message.guild.id, false)
                let update = await dbConfig.setChannels(message.mentions.channels.map(c => c.id), status)
                command.setConfig(update)
                return message.channel.send(`${message.client.prefix}${arg} ${status ? "enabled" : "disabled"} in ${message.mentions.channels.array().join(", ")}.`)
            } catch (e) {
                message.client.logger.error({ code: e.code, stack: e.stack, key: "config" })
                return message.channel.send(`Error updating command configuration: ${e.message}`)
            }
        } else {
            let dbConfig = await CommandConfig.getConfigForCommand(message.client, command)

            try {
                if (!command.config.guilds.has(message.guild.id)) await dbConfig.setGuild(message.guild.id, false)
                let update = await dbConfig.setGuild(message.guild.id, status)
                command.setConfig(update)
                return message.channel.send(`${message.client.prefix}${arg} ${status ? "enabled" : "disabled"} server-wide. Any existing channel overrides will still apply.`)
            } catch (e) {
                message.client.logger.error({ code: e.code, stack: e.stack, key: "config" })
                return message.channel.send(`Error updating command configuration: ${e.message}`)
            }
        }
    }

    async setFunction(message, arg, param = null) {
        switch (arg) {
            case "logs":
                if (!message.mentions.channels.first()) return message.channel.send("Setting a function requires a channel mention")
                try {
                    let logChannel = message.mentions.channels.first()
                    await LogConfig.setLogChannel(message.guild.id, logChannel.id)
                    message.guild.logChannel = logChannel
                    return message.channel.send(`Log channel has been set to ${logChannel}. It is recommended that you prevent other users from sending messages to this channel.`)

                } catch (e) {
                    message.client.logger.error({ code: e.code, stack: e.stack, key: "config" })
                    return message.channel.send(`Error updating function configuration: ${e.message}`)
                }
            case "starboard":
                if (!message.mentions.channels.first()) return message.channel.send("Setting a function requires a channel mention")
                try {
                    let starChannel = message.mentions.channels.first()
                    let starboard = message.guild.starboard || new StarboardConfig({
                        guild: message.guild.id,
                        channel: starChannel.id
                    })
                    await starboard.save()
                    message.guild.starboard = starboard
                    return message.channel.send(`Starboard channel has been set to ${starChannel}. It is recommended that you prevent other users from sending messages to this channel.`)

                } catch (e) {
                    message.client.logger.error({ code: e.code, stack: e.stack, key: "config" })
                    return message.channel.send(`Error updating function configuration: ${e.message}`)
                }
            case "starboard-emoji":
                if (!message.guild.starboard) return message.channel.send("This server has no Starboard")
                if (!param) return message.channel.send("This setting requires an emoji be provided")
                try {
                    message.guild.starboard.emoji = param
                    await message.guild.starboard.save()
                    return message.channel.send(`Starboard emoji has been set to ${param}`)
                } catch (e) {
                    return message.channel.send({
                        code: e.stack
                    })
                }
            case "starboard-reacts":
                if (!message.guild.starboard) return message.channel.send("This server has no Starboard")
                if (param === null || !/^[1-9][0-9]*$/.test(param)) return message.channel.send("This setting requires a positive whole number")
                try {
                    message.guild.starboard.minReacts = param
                    await message.guild.starboard.save()
                    return message.channel.send(`Starboard minimum reactions has been set to ${param}`)
                } catch (e) {
                    return message.channel.send({
                        code: e.stack
                    })
                }
        }
    }

    async clearConfig(message, arg) {
        switch (arg) {
            case "logs":
                if (message.guild.logChannel) {
                    await LogConfig.clearLogChannel(message.guild.id)
                    delete message.guild.logChannel
                    return message.channel.send("Logging channel cleared.")
                } else return message.channel.send("Logging is not configured for this server.")
            case "starboard":
                if (message.guild.starChannel) {
                    await StarboardConfig.clearStarboardChannel(message.guild.id)
                    delete message.guild.starChannel
                    return message.channel.send("Starboard channel cleared.")
                } else return message.channel.send("Starboard is not configured for this server.")
        }

        let command = message.client.commands.get(arg)
        if (!command) return message.channel.send(`No command matching ${message.client.prefix}${arg} found.`)
        if (command.lockConfig) return message.channel.send(`${message.client.prefix}${arg} is always enabled and is not a configurable command.`)

        if (!command.config.guilds.has(message.guild.id)) return message.channel.send(`${message.client.prefix}${arg} is not configured for this server.`)
        try {
            let dbConfig = await CommandConfig.getConfigForCommand(message.client, command)
            let update = dbConfig.clearConfigForGuild(message.guild)
            command.setConfig(update)
            return message.channel.send(`${message.client.prefix}${arg} configuration has been cleared.`)
        } catch (e) {
            message.client.logger.error({ code: e.code, stack: e.stack, key: this.name })
            return message.channel.send(`Error updating command configuration: ${e.message}`)
        }
    }

    async run(message, args = [], flags = []) {
        // No args should just run the wizard for full config
        if (flags.length === 0) return await this.runWizard(message)

        if(flags.includes("enable")) return this.setCommand(message, args[1], true)
        if(flags.includes("disable")) return this.setCommand(message, args[1], false)
        if(flags.includes("clear")) return this.clearConfig(message, args[1])
        if(flags.includes("set")) return await this.setFunction(message, args[1], args[2])
    }
}
