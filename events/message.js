const BaseEvent = require("./base")
const { SnowflakeUtil } = require("discord.js")
const CommandStats = require("../models/commandStats")

module.exports = class MessageEvent extends BaseEvent {
    constructor() {
        super({
            name: "message",
            enabled: true
        })
    }

    checkActiveCommand(message, command) {
        return message.client.activeCommands.find(ac =>
            ac.user === message.author.id && ac.command === command)
    }

    setActiveCommand(message, command) {
        message.client.activeCommands.set(SnowflakeUtil.generate(Date.now()), {
            "user": message.author.id,
            "command": command,
            "timestamp": Date.now()
        })
    }

    clearActiveCommand(message, command) {
        message.client.activeCommands.sweep(ac =>
            ac.user === message.author.id && ac.command === command)
    }

    async processCommand(message, command, _args) {
        // Split the args and the flags, then parse args into named arguments
        let [flags, args] = super.argsplit(_args)
        try {
            args = await command.parseArgs(message, args)
            if (args === false) return
        } catch (e) {
            message.client.logger.parseError(e, "parseArgs")
            return message.channel.sendPopup("error", "Unhandled exception thrown while parsing arguments")
        }


        // Intercept help flags as they aren't command-specific
        if (flags.includes("h")) {
            return command.getHelp(message.channel)
        }

        // If its the bot owner, run the command now without further checks
        if (message.author.id === message.client.applicationInfo.owner.id)
        // try { return command.run(message, args, flags) } catch (e) {
        //    message.client.logger.parseError(e, "runCommand")
        //    return message.channel.sendPopup("error", "Unhandled exception thrown while running command")
        // }

            // Check if its an owner-only command, don't run if it is We already ran 
            if (command.requiresOwner) return

        // Check that the command is enabled in this channel/server
        const cStatus = command.getChannelStatus(message.channel), gStatus = command.getGuildStatus(message.guild)

        if (cStatus === undefined) {
            if (gStatus === undefined)
                return message.channel.sendPopup("warn", `${message.client.prefix}${command.name} has not been configured for use in this server`)
            if (!gStatus)
                return message.channel.sendPopup("warn", `${message.client.prefix}${command.name} has been disabled on this server`)
        } else if (!cStatus)
            return message.channel.sendPopup("warn", `${message.client.prefix}${command.name} has been disabled in this channel`)

        // Check if a guild-only command is being run in DM
        if (command.guildOnly && message.channel.type == "dm")
            return message.channel.send("warn", `${message.client.prefix}${command.name} is not available is DMs`)

        // Check if the command requires Discord permissions
        if (command.requiresRole()) {
            if (!command.memberHasRequiredRole(message.member))
                return message.channel.send("warn", `None of your Roles has permissions to run ${message.client.prefix}${command.name}`)
        }
        try {
            return command.run(message, args, flags)
        } catch (e) {
            message.client.logger.parseError(e, "runCommand")
            return message.channel.sendPopup("error", `Error encountered while running the command: ${e.message}`)
        }

    }

    async run(message) {
        // Ignore messages from bots
        if (message.author.bot) return

        // Ignore messages that don't start with the prefix
        if (!message.content.startsWith(message.client.prefix)) return

        // Log the message - refer to util/logger.js to see what is logged
        message.client.logger.message(message)

        // Parse CSV's with spaces as a single argument
        // let content = message.content.replace(/, +/g, ",")
        // Split the args on spaces
        let _args = message.content.slice(message.client.prefix.length).trim().split(/ +/g)
        // Pull the command from the array
        let carg = _args.shift().toLowerCase()

        // Get the matching command class
        let command = message.client.commands.get(carg) || message.client.commands.get(message.client.aliases.get(carg))
        if (!command) return

        try {
            CommandStats.addReceived(command.name, message.guild.id)
        } catch (e) { message.client.logger.parseError(e, "commandStats") }

        const active = this.checkActiveCommand(message, command.name)
        if (active) {
            if (active.timestamp < Date.now() - 5000)
                message.channel.sendPopup("warn", `You already have an active ${message.client.prefix}${command.name} command.`)

            active.timestamp = Date.now()
            return
        }

        this.setActiveCommand(message, command.name)
        command.executed(message.guild.id)
        await this.processCommand(message, command, _args)
        command.succeeded(message.guild.id)
        return this.clearActiveCommand(message, command.name)
    }
}