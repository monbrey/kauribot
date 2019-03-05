const BaseCommand = require("./base")
const StarboardConfig = require("../models/logConfig")

module.exports = class StarboardCommand extends BaseCommand {
    constructor() {
        super({
            name: "starboard",
            category: "Admin",
            description: "Set the logging channel for the server.",
            args: {
                "arg": { type: "Any" },
            },
            syntax: "!logs #channel",
            usage: `No args : Display the current logging channel
#channel : Send logs to #channel`,
            enabled: true,
            defaultConfig: true,
            lockConfig: true,
            guildOnly: true,
            requiresPermission: ["ADMINISTRATOR", "MANAGE_ROLES"]
        })
    }

    async getStarboard(message) {
        let starChannel = message.guild.channels.get(message.guild.starboard.channel)
        if (starChannel) return message.channel.sendPopup("info", `The Starboard for this server is ${starChannel}.`)
        else return message.channel.sendPopup("warn", "The Starboard is not configured for this server, or is missing.")
    }

    async setStarboard(message, target) {
        if (!target.permissionsFor(message.guild.me).has("SEND_MESSAGES", true))
            return message.channel.sendPopup("warn", `Cannot send messages to ${target} - please change the bot permissions for that channel, or select a different channel`)

        try {
            let starboard = message.guild.starboard || new StarboardConfig({
                guild: target.guild.id,
                channel: target.id
            })
            starboard.channel = target.id
            await starboard.save()
            message.guild.starboard = starboard
            message.client.logger.starboard(message, target)
            return message.channel.sendPopup("success", `Starboard channel has been set to ${target}. It is recommended that you prevent other users from sending messages to this channel.`)
        } catch (e) {
            message.client.logger.parseError(e, "starboard")
            return message.channel.sendPopup("error", `Error updating starboard configuration: ${e.message}`)
        }
    }

    async emoji(message, arg) {
        if (!message.guild.starboard) return message.channel.sendPopup("warn", "This server has no Starboard")
        if (!arg) {
            if (message.guild.starboard.emoji)
                return message.channel.sendPopup("info", `The Starboard emoji for this server is ${message.guild.starboard.emoji}.`)
            else return message.channel.sendPopup("warn", "This setting requires an emoji to be provided")
        }

        try {
            message.guild.starboard.emoji = arg
            await message.guild.starboard.save()
            message.client.logger.starboard(message, arg, "emoji")
            return message.channel.sendPopup("success", `Starboard emoji has been set to ${arg}`)
        } catch (e) {
            message.client.logger.parseError(e, "starboard")
            return message.channel.sendPopup("error", `Error updating starboard configuration: ${e.message}`)
        }
    }

    async reacts(message, arg) {
        if (!message.guild.starboard) return message.channel.sendPopup("warn", "This server has no Starboard")
        if (!arg) {
            if (message.guild.starboard.minReacts)
                return message.channel.sendPopup("info", `The Starboard minimum reactions for this server is ${message.guild.starboard.minReacts}.`)
            else return message.channel.sendPopup("warn", "The Starboard is not configured for this server")
        }
        if(!/^[1-9][0-9]*$/.test(arg)) return message.channel.sendPopup("warn", "This setting requires a positive integer to be provided")

        try {
            message.guild.starboard.minReacts = parseInt(arg)
            await message.guild.starboard.save()
            message.client.logger.starboard(message, arg, "reacts")
            return message.channel.sendPopup("success", `Starboard minimum reactions has been set to ${arg}`)
        } catch (e) {
            message.client.logger.parseError(e, "starboard")
            return message.channel.sendPopup("error", `Error updating starboard configuration: ${e.message}`)
        }
    }

    async run(message, args = [], flags = []) {
        const arg = args.get("arg")
        if (flags.length === 0) {
            if (!arg)
                return this.getStarboard(message)
            else if (arg.constructor.name !== "TextChannel")
                return message.channel.sendPopup("warn", "To set a Starboard for this server, you must mention a TextChannel")
            else return this.setStarboard(message, arg)
        }

        if (flags.includes("emoji")) return this.emoji(message, arg)
        if (flags.includes("reacts")) return this.reacts(message, arg)
    }
}