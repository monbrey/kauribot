const Discord = require('discord.js')
const { Collection, MessageMentions, RichEmbed } = Discord
const CommandStats = require('../models/commandStats')

module.exports = class BaseCommand {
    /**
     * @constructor
     * @param {Object}      [options={}]
     * @param {String}          options.name - The name of the command, used to call it
     * @param {Object}          options.args - Named arguments and types for string splitting
     * @param {Array}           [options.aliases=[]] - Aliases which can also be used to call the command
     * @param {String}          [options.description=""] - Description of the command for !help
     * @param {String}          [options.syntax=""] - Command format guide
     * @param {Boolean}         [options.enabled=false] - If the command is enabled for use at the bot level
     * @param {Boolean}         [options.guildOnly=false] - If the command can only be run in server (no DM)
     */
    constructor(options = {}) {
        this.name = options.name || 'base'
        this.category = options.category || null
        this.description = options.description || 'No description provided'
        this.args = options.args || null
        this.aliases = options.aliases || []
        this.syntax = options.syntax || 'No syntax specified'
        this.enabled = options.enabled || false
        this.guildOnly = options.guildOnly || false

        this.active = require('../util/activeCommand')
    }

    /**
     * Returns an object of Boolean/undefined indicating if this command can be used in the current guild/channel/default
     * @param {Channel} channel
     */
    enabledIn(channel) {
        return {
            c: this.config.channels.get(channel.id),
            g: this.config.guilds.get(channel.guild.id),
            d: this.config.defaults.guild
        }
    }

    /**
     * Checks if the GuildMember has permission to run this command in this location
     * @param {GuildMember} member
     * @param {TextChannel} channel
     */
    permissionsFor(member, channel) {
        // If this command has a roles configured for the guild, check if the member has one of them
        const roles = channel.guild.roles.filter(r => this.config.roles.has(r.id))
        const rolePerms = roles.size
            ? roles.some(r => this.config.roles.get(r.id) && member.roles.has(r.id))
            : undefined

        if (rolePerms !== undefined) return rolePerms

        // If the command has default permissions required, check if the member has one of the permissions in the channel
        return this.config.defaults.permissions.length
            ? this.config.defaults.permissions.some(p =>
                channel.permissionsFor(member).hasPermission(p, true)
            )
            : true
    }

    /**
     * @param {Guild} guild - Discord.Guild
     * @returns {Boolean}
     */
    enabledInGuild(guild) {
        // Always exclude ownerOnly
        if (this.config.ownerOnly) return false

        const g = this.config.guilds.get(guild.id)
        return g !== undefined ? g : this.config.defaults.guild
    }

    /**
     * @param {Guild} guild - Discord.Guild
     * @returns {Boolean}
     */
    disabledInGuild(guild) {
        // Always exclude ownerOnly
        if (this.config.ownerOnly) return false

        const g = this.config.guilds.get(guild.id)
        return g !== undefined ? !g : !this.config.defaults.guild
    }

    /**
     * @param {Guild} guild - Discord.Guild
     * @returns {Boolean}
     */
    hasChannelConfigInGuild(guild) {
        const c = guild.channels.some(c => this.config.channels.has(c.id))
        return c
    }

    /**
     * @param {Guild} guild - Discord.Guild
     * @returns {Boolean}
     */
    restrictedInGuild(guild) {
        const g = Boolean(guild.roles.filter(r => this.config.roles.has(r.id)).size)
        return g ? true : Boolean(this.config.defaults.permissions.length)
    }

    /**
     * @param {Channel} channel - Discord.TextChannel
     */
    getHelp(channel) {
        if (this.requiresOwner) return

        const server = new Collection(this.config.guilds).get(channel.guild.id)
            ? 'Enabled'
            : 'Disabled'
        const channels = new Collection(this.config.channels)
            .filter((c, id) => c !== server && channel.guild.channels.has(id))
            .map((c, id) => channel.guild.channels.get(id).name)
        const roles = new Collection(this.config.roles)
            .filter((r, id) => channel.guild.roles.has(id))
            .map((r, id) => channel.guild.roles.get(id).name)

        let embed = new RichEmbed()
            .setTitle(this.name)
            .setDescription(this.description)
            .setURL(
                `https://monbrey.github.com/ultra-rpg-bot/commands/${this.category.toLowerCase()}#${
                    this.name
                }`
            )
        if (this.aliases.length > 0) embed.addField('Aliases', `\`${this.aliases.join('` `')}\``)
        embed
            .addField('Syntax', `\`${this.syntax}\``)
            .addField('Server staus', server, true)
            .addField('Channel overrides', channels.join('\n') || 'None', true)
            .addField('Role restrictions', roles.join('\n') || 'None', true)
            .setFooter('Click the title to go to the full documentation')

        return channel.send(embed)
    }

    /**
     *
     * @param {Message} message The Discord message from which the args originated
     * @param {Array} argArray An array of command arguments
     */
    async parseArgTypes(message, argArray) {
        if (!this.args) return argArray

        const resolved = await Promise.all(
            argArray.map(async arg => {
                if (arg.match(MessageMentions.USERS_PATTERN))
                    return message.guild.fetchMember(arg.replace(/[<@!>]/g, ''))
                if (arg.match(MessageMentions.CHANNELS_PATTERN))
                    return message.client.channels.get(arg.replace(/[<@#>]/g, ''))
                if (arg.match(MessageMentions.ROLES_PATTERN))
                    return message.guild.roles.get(arg.replace(/[<@&>]/g, ''))
                return arg
            })
        )

        const named = new Collection()
        Object.keys(this.args).forEach((name, index) => {
            // If we dont have enough args, stop processing
            if (index >= resolved.length) return

            // Get the arg type
            const type = this.args[name].type

            // If this is a final named arg, being group processing
            if (index === Object.keys(this.args).length - 1) {
                const remaining = resolved.slice(index)
                switch (type) {
                    case 'String':
                        named.set(name, remaining.join(' '))
                        break
                    case 'Array':
                        named.set(name, remaining)
                        break
                    case 'Collection':
                        named.set(
                            name,
                            new Collection(
                                remaining
                                    .filter(r => this.args[name].of.includes(r.constructor.name))
                                    .map(r => [r.id, r])
                            )
                        )
                        break
                    default:
                        named.set(name, resolved[index])
                        break
                }
            } else named.set(name, resolved[index])
        })

        for (const key of Object.keys(this.args)) {
            const { required } = this.args[key]
            const arg = named.get(key)

            if (required && !arg) {
                return message.channel.sendPopup('warn', `Required parameter missing: ${key}`)
            }
        }

        let valid = true
        named.forEach((value, key) => {
            if (
                value.constructor.name !== this.args[key].type &&
                this.args[key].type !== 'Any' &&
                valid
            ) {
                const position = Object.keys(this.args).indexOf(key)
                valid = false
                return message.channel.sendPopup(
                    'warn',
                    `Invalid argument in position ${position + 1}
**Received:** ${value.constructor.name}
**Expected:** ${this.args[key].type}`,
                    10000
                )
            }
        })

        return valid ? named : undefined
    }

    /**
     * @param {Snowflake} guild - The ID for the Discord Guild in which the command was run
     */
    async addStat(guild, stat) {
        switch (stat) {
            case 'received':
                return CommandStats.addReceived(this.name, guild)
            case 'executed':
                return CommandStats.addExecuted(this.name, guild)
            case 'succeeded':
                return CommandStats.addSucceeded(this.name, guild)
            default:
                throw new Error('Invalid stat provided')
        }
    }

    /**
     * @param {Message} message - A Discord.Message
     * @param {Array} args - Array of command arguments
     * @param {Array} flags - Array of command flags
     */
    async run(message, args = []) {
        return
    }
}
