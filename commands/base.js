const Discord = require("discord.js")
const { Collection, MessageMentions, RichEmbed } = Discord
const CommandStats = require("../models/commandStats")

module.exports = class BaseCommand {
    /**
     * @constructor
     * @param {Object}      [options={}]
     * @param {String}          options.name - The name of the command, used to call it
     * @param {Object}          options.args - Named arguments and types for string splitting
     * @param {Array}           [options.aliases=[]] - Aliases which can also be used to call the command
     * @param {String}          [options.description=""] - Description of the command for !help
     * @param {String}          [options.syntax=""] - Command format guide
     * @param {String}          [options.usage=""] - Detailed syntax breakdown
     * @param {Boolean}         [options.enabled=false] - Enable the command in the bot
     * @param {Boolean}         [options.defaultConfig=false] - Default enabled state for a guild
     * @param {Boolean}         [options.lockConfig=false] - If the default state can be changed
     * @param {Boolean}         [options.guildOnly=false] - If the command can only be run in server (no DM)
     * @param {Boolean|Array}   [options.requiresPermission=false] - Discord permissions required to run the command
     * @param {Boolean|Array}   [options.requiresRole=false] - Any server role which can run the command
     * @param {Boolean}         [options.requiresOwner=false] - Restrict this command to the bot owner
     */
    constructor(options = {}) {
        this.name = options.name || "base"
        this.category = options.category || null
        this.args = options.args || null
        this.aliases = options.aliases || []
        this.description = options.description || "No description provided"
        this.syntax = options.syntax || "No syntax specified"
        this.usage = options.usage || "No usage specified"
        this.examples = options.examples || ["None available"]
        this.enabled = options.enabled || false
        this.defaultConfig = options.defaultConfig || false
        this.guildOnly = options.guildOnly || false
        this.override = options.override || false,
        this.requiresPermission = options.requiresPermission || false
        this.requiresRole = options.requiresRole || false
        this.requiresOwner = options.requiresOwner || false
    }

    /**
     * @param {CommandConfig} config - A CommandConfig Mongoose document
     */
    async setConfig(config) {
        this.config = config
    }

    /**
     * @param {String} guild - Discord Guild ID
     */
    async isEnabledInGuild(guild) {
        return this.config.guilds.includes(guild)
    }

    /**
     * @param {String} channel - Discord Channel ID
     */
    async isEnabledInChannel(channel) {
        return this.config.channel.includes(channel)
    }

    /**
     * @param {Channel} channel - A Discord Channel object
     */
    async getHelp(channel) {
        if (this.requiresOwner) return

        let embed = new RichEmbed()
            .setTitle(this.name)
            .setDescription(this.description)
        if (this.aliases.length > 0)
            embed.addField("Aliases", `\`${this.aliases.join("` `")}\``)
        embed.addField("Syntax", `\`${this.syntax}\``)
            .addField("Usage", `${this.usage}`)
            .addField("Examples", `\`${this.examples.join("`\n`")}\``)
            .addField("Available in DMs", this.guildOnly ? "No" : "Yes", true)
        if (this.requiresPermission)
            embed.addField("Requires Permissions", this.requiresPermission.join("\n"), true)
        if (this.requiresRole)
            embed.addField("Requires Roles", this.requiresRole.join("\n"), true)

        return channel.send(embed)
    }

    /**
     * 
     * @param {Message} message The Discord message from which the args originated
     * @param {Array} argArray An array of command arguments
     */
    async parseArgs(message, argArray) {
        console.log(argArray)
        if (!this.args) return argArray

        const customEmojiRe = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/

        const resolved = await Promise.all(argArray.map(async arg => {
            if (arg.match(MessageMentions.USERS_PATTERN))
                return message.guild.fetchMember(arg.replace(/[<@!>]/g, ""))
            if (arg.match(MessageMentions.CHANNELS_PATTERN))
                return message.client.channels.get(arg.replace(/[<@#>]/g, ""))
            if (arg.match(MessageMentions.CHANNELS_PATTERN))
                return message.guild.roles.get(arg.replace(/[<@&>]/g, ""))
            if (arg.match(customEmojiRe)) {
                return message.guild.emojis.get(arg.match(customEmojiRe)[3])
            }
            return arg
        }))

        const named = new Collection()
        Object.keys(this.args).forEach((name, index) => {
            // If we dont have enough args, stop processing
            if (index >= resolved.length) return

            // Get the arg type
            const type = this.args[name].type

            console.log(name)
            console.log(type)

            // If this is a final named arg, being group processing
            if (index === Object.keys(this.args).length - 1) {
                const remaining = resolved.slice(index)
                switch (type) {
                    case "String": named.set(name, remaining.join(" "))
                        break
                    case "Array": named.set(name, remaining)
                        break
                    case "Collection": named.set(name, new Collection(
                        remaining.filter(r => this.args[name].of.includes(r.constructor.name))
                            .map(r => [r.id, r])
                    ))
                        break
                    default: named.set(name, resolved[index])
                        break
                }
            } else named.set(name, resolved[index])
        })

        let valid = true
        named.forEach((value, key) => {
            if (value.constructor.name !== this.args[key].type || this.args[key].type === "Any" && valid) {
                const position = Object.keys(this.args).indexOf(key)
                valid = false
                return message.channel.sendPopup("warn", `Invalid argument in position ${position + 1}
**Received:** ${value.constructor.name}
**Expected:** ${this.args[key]}`, 10000)
            }
        })

        return valid ? named : undefined
    }

    /**
     * @param {Guild} guild - The ID for the Discord Guild in which the command was executed
     */
    async executed(guild) {
        return CommandStats.addExecuted(this.name, guild)
    }

    /**
     * @param {Guild} guild - The ID for the Discord Guild in which the command was executed
     */
    async succeeded(guild) {
        return CommandStats.addSucceeded(this.name, guild)
    }

    /**
     * @param {Message} message - A Discord.Message
     * @param {Array} args - Array of command arguments
     * @param {Array} flags - Array of command flags
     */
    async run(message, args = [], flags = []) {
        return
    }
}
