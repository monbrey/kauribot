const BaseCommand = require("./base")
const CommandConfig = require("../models/commandConfig")

module.exports = class ConfigCommand extends BaseCommand {
    constructor() {
        super({
            name: "config",
            category: "Admin",
            description: "Change bot configuration in this server.",
            args: {
                "command": { type: "String" },
                "targets": { type: "Collection", of: ["TextChannel", "Role"] }
            },
            syntax: "!config <Command> [-switch] [TextChannel|Role]...",
            enabled: true,
            defaultConfig: true,
            lockConfig: true,
            guildOnly: true
        })
    }

    async runWizard(message) {
        message.channel.send("Wizardy stuff not yet implemented - use specific config commands")
    }

    /**
     * @param {Message} message - A Discord.Message object 
     * @param {String} arg - Configuration to retrieve
     */
    async getConfig(message, arg) {
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

    async setCommand(message, args, status) {
        const cmd = args.get("command")
        const command = message.client.commands.get(cmd)
        if (!command) return message.channel.send(`No command matching ${message.client.prefix}${cmd} found.`)
        if (command.lockConfig) return message.channel.send(`${message.client.prefix}${cmd} is always enabled and is not a configurable command.`)

        const targets = args.get("targets")
        if (targets) {
            let dbConfig = await CommandConfig.getConfigForCommand(message.client, command)

            try {
                // If no guild config exists, set it to false as a default
                if (!command.config.guilds.has(message.guild.id)) await dbConfig.setGuild(message.guild.id, false)
                targets.forEach(t => {
                    switch (t.constructor.name) {
                        case "TextChannel": dbConfig.channels.set(t.id, status)
                            break
                        case "Role": dbConfig.roles.set(t.id, status)
                            break
                        default:
                            message.channel.sendPopup("warn", `Commands cannot be configured for a ${t.constructor.name}: ${t}`)
                    }
                })
                command.setConfig(dbConfig)
                await dbConfig.save()
                return message.channel.sendPopup("success", `${message.client.prefix}${cmd} ${status ? "enabled" : "disabled"} in/for ${targets.array().join(", ")}`, 0)
            } catch (e) {
                message.client.logger.parseError(e, "config")
                return message.channel.sendPopup("error", "Error updating command configuration")
            }
        } else {
            let dbConfig = await CommandConfig.getConfigForCommand(message.client, command)

            try {
                if (!command.config.guilds.has(message.guild.id)) await dbConfig.setGuild(message.guild.id, false)
                dbConfig.guilds.set(message.guild.id, status)
                command.setConfig(dbConfig)
                await dbConfig.save()
                return message.channel.send(`${message.client.prefix}${cmd} ${status ? "enabled" : "disabled"} server-wide. Any existing channel overrides will still apply.`)
            } catch (e) {
                message.client.logger.parseError(e, "config")
                return message.channel.sendPopup("error", "Error updating command configuration")
            }
        }
    }

    async clearConfig(message, arg) {
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
            message.client.logger.parseError(e, this.name)
            return message.channel.sendPopup("error", "Error updating command configuration")
        }
    }

    async run(message, args = [], flags = []) {
        // No args should just run the wizard for full config
        if (flags.length === 0)
            if (args.size === 0) return await this.runWizard(message)
            else return this.getConfig(message, args.get("command"))

        if (flags.includes("enable")) return this.setCommand(message, args, true)
        if (flags.includes("disable")) return this.setCommand(message, args, false)
        if (flags.includes("clear")) return this.clearConfig(message, args.get("command"))
    }
}
