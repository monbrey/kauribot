const BaseCommand = require('./base')
const CommandConfig = require('../models/commandConfig')
const { RichEmbed } = require('discord.js')
const { stripIndents } = require('common-tags')

module.exports = class ConfigCommand extends BaseCommand {
    constructor() {
        super({
            name: 'config',
            category: 'Admin',
            description: 'Change bot configuration in this server.',
            args: { command: { type: 'String' } },
            syntax: '!config <command>',
            enabled: true
        })
    }

    /**
     * Generate a RichEmbed showin the configuration of commands in this Guild
     * @param {Message} message
     * @returns {RichEmbed}
     */
    generateGuildInfo(message) {
        const { commands } = message.client

        const enabled = commands.filter(c => c.enabledInGuild(message.guild))
        const disabled = commands.filter(c => c.disabledInGuild(message.guild))

        const channelOverrides = commands.filter(c => c.hasChannelConfigInGuild(message.guild))
        const roleOverrides = commands.filter(c => c.restrictedInGuild(message.guild))

        const enabledOutput = enabled.map(c => {
            let name = c.name
            name = channelOverrides.has(c.name) ? `[${name}]` : name
            name = roleOverrides.has(c.name) ? `{${name}}` : name
            return `\`${name}\``
        })
        const disabledOutput = disabled.map(c => {
            let name = c.name
            name = channelOverrides.has(c.name) ? `[${name}]` : name
            return `\`${name}\``
        })

        const embed = new RichEmbed()
            .setTitle(`Server-level command configuration for ${message.guild.name}`)
            .setDescription(
                '`[command]` - may be overriden in specific channels\n`{command}` - has additional role/permission restrictions'
            )
            .addField('Enabled', `${enabledOutput.join(' ')}`)
            .addField('Disabled', `${disabledOutput.join(' ')}`)
            .setFooter('Use !config <command> to view/edit detailed configuration')

        return embed
    }

    /**
     * Generates a RichEmbed for the command configuration and returns the reactions required
     * @param {Message} message
     * @param {BaseCommand} command
     * @returns {RichEmbed}
     */
    generateCommandInfo(message, command) {
        const { prefix: p } = message.client
        const {
            channels: cConf,
            roles: rConf,
            defaults: { permissions }
        } = command.config

        const guildConfig = command.enabledInGuild(message.guild)
        const channelConfig = message.guild.channels.filter(
            c => cConf.has(c.id) && cConf.get(c.id) !== guildConfig
        )
        const roleConfig = message.guild.roles.filter(r => rConf.has(r.id))

        const embed = new RichEmbed()
            .setTitle(`Configuration settings for ${p}${command.name} in ${message.guild.name}`)
            .addField('Server level', guildConfig ? 'Enabled' : 'Disabled')
        if (channelConfig.size) embed.addField('Channel overrides', channelConfig.array().join(' '))
        if (roleConfig.size) embed.addField('Role required', roleConfig.array().join(' '))
        else if (permissions.length) embed.addField('Permissions required', permissions.join(' '))

        if (!command.config.canBeDisabled && !command.config.canChangePermissions) {
            embed.setFooter('This command cannot be disabled or restricted')
        }

        return embed
    }

    /**
     * Adds the edit controls to a generated RichEmbed
     * @param {Message} message
     * @param {RichEmbed} info
     * @param {BaseCommand} command
     */
    addEditControls(message, info, command) {
        if (command.config.canBeDisabled) {
            const enableLine = command.enabledInGuild(message.guild)
                ? '\\❌ - Disable this command for the server'
                : '\\✅ - Enable this command for the server'
            info.addField('Toggles', `${enableLine}`)
            info.fields[info.fields.length - 1].value += `
            \\🔲 - Edit Channel overrides for this command`
        }
        if (command.config.canChangePermissions) {
            info.fields[info.fields.length - 1].value += `
            \\🚫 - Edit Role restrictions for this command`
        }
        info.fields[info.fields.length - 1].value += `
        \\🔄 - Reset all server configuration for this command`

        return info
    }

    /**
     * Listens to reactions and triggers the command config edit functions
     * @param {Message} message - A Discord.Message object
     * @param {Message} sent
     * @param {BaseCommand} command
     */
    async configure(message, sent, command) {
        const reacts = ['✅', '❌', '🔲', '🚫', '🔄'].filter(e =>
            sent.embeds[0].fields[sent.embeds[0].fields.length - 1].value.includes(e)
        )
        try {
            for (const r of reacts) await sent.react(r)
        } catch (e) {
            e.key = 'config'
            throw e
        }

        const filter = (r, u) => reacts.includes(r.emoji.name) && u.id === message.author.id
        try {
            const response = await sent.awaitReactions(filter, { time: 30000, max: 1 })
            sent.clearReactions()

            if (!response.first()) return

            await (async () => {
                switch (response.first().emoji.name) {
                    case '✅':
                        return this.toggleCommand(message, command)
                    case '❌':
                        return this.toggleCommand(message, command)
                    case '🔲':
                        return this.manageChannels(message, command)
                    case '🚫':
                        return this.manageRoles(message, command)
                    case '🔄':
                        return this.reset(command)
                }
            })()
        } catch (e) {
            e.key = 'config'
            throw e
        }

        return sent.edit(this.generateCommandInfo(message, command))
    }

    async toggleCommand(message, command) {
        const toggle = !command.enabledInGuild(message.guild)
        command.config.guilds.set(message.guild.id, toggle)
        return command.config.save()
    }

    async manageChannels(message, command) {
        const { channels } = message.guild
        const serverConfig = command.enabledInGuild(message.guild)

        const embed = new RichEmbed()
            .setTitle(`Channel overrides for ${message.client.prefix}${command.name}`)
            .setDescription(
                stripIndents`Mention channels to add or remove their override
                Click \\✅ when finished to save changes, or \\❌ to cancel
                Changes will be automatically cancelled after 5 minutes`
            )
            .addField('Server setting', `${serverConfig ? 'Enabled' : 'Disabled'} `)
            .addField(`Channel overrides (${!serverConfig ? 'Enabled' : 'Disabled'})`, '\u200B')

        const evalOverrides = () => {
            const overrides = channels.filter(
                c => ![undefined, serverConfig].includes(command.config.channels.get(c.id))
            )
            embed.fields[embed.fields.length - 1].value = overrides.array().join(' ') || 'None'
        }

        evalOverrides()

        const channelEdit = await message.channel.send(embed)

        const collector = channelEdit.channel.createMessageCollector(
            m => m.author.id === message.author.id
        )

        collector.on('collect', message => {
            for (const id of message.mentions.channels.keyArray()) {
                command.config.channels.has(id)
                    ? command.config.channels.delete(id)
                    : command.config.channels.set(id, !serverConfig)
            }
            message.delete()
            evalOverrides()
            channelEdit.edit(embed)
        })

        collector.on('end', collected => {
            return channelEdit.delete()
        })

        const save = await channelEdit.reactConfirm(message.author.id, 300000)
        command.config = save
            ? await command.config.save()
            : await CommandConfig.findOne({ commandName: command.name })
        collector.stop()
    }

    async manageRoles(message, command) {
        const { roles } = message.guild
        const serverConfig = command.enabledInGuild(message.guild)

        if (!serverConfig)
            return message.channel.sendPopup(
                'warn',
                'Role restrictions can only be applied to enabled commands',
                5000
            )

        const embed = new RichEmbed()
            .setTitle(`Role permissions for ${message.client.prefix}${command.name}`)
            .setDescription(
                stripIndents`Reply with Role names to add or remove their authorisation
                Adding any Role authorisation will replace the default Discord permissions check
                Removing all roles allows the command to be used by anyone, or reverts it to the default Discord permissions requirements
                Click \\✅ when finished to save changes, or \\❌ to cancel
                Changes will be automatically cancelled after 5 minutes`
            )
            .addField('Role / Permissions restrictions', '\u200B')

        const evalAuthorisations = () => {
            const authorisations = roles.filter(r => command.config.roles.get(r.id))
            embed.fields[embed.fields.length - 1].value =
                authorisations.array().join(' ') ||
                command.config.defaults.permissions.join(' ') ||
                'None'
        }

        evalAuthorisations()

        const roleEdit = await message.channel.send(embed)

        const collector = roleEdit.channel.createMessageCollector(
            m => m.author.id === message.author.id
        )

        collector.on('collect', message => {
            const args = message.content.split(' ')
            for (const arg of args) {
                const role = message.guild.roles.find(r => r.name === arg)
                if (role) {
                    command.config.roles.has(role.id)
                        ? command.config.roles.delete(role.id)
                        : command.config.roles.set(role.id, true)
                }
            }

            message.delete()
            evalAuthorisations()
            roleEdit.edit(embed)
        })

        collector.on('end', collected => {
            return roleEdit.delete()
        })

        const save = await roleEdit.reactConfirm(message.author.id, 300000)
        command.config = save
            ? await command.config.save()
            : await CommandConfig.findOne({ commandName: command.name })
        collector.stop()
    }

    async reset(message, command) {
        command.config.guilds.delete(message.guild.id)
        for (const c of message.guild.channels.keyArray()) {
            if (command.config.channels.has(c.id)) command.config.channels.delete(c.id)
        }
        for (const r of message.guild.roles.keyArray()) {
            if (command.config.roles.has(r.id)) command.config.roles.delete(r.id)
        }
        return command.config.save()
    }

    async run(message, args = []) {
        // No args should just run the wizard for full config
        if (args.size === 0) return await this.sendGuildInfo(message)

        const { commands, aliases, prefix: p } = message.client
        const carg = args.get('command')
        const command = commands.get(carg) || commands.get(aliases.get(carg))
        if (!command)
            return message.channel.sendPopup('warn', `No command matching ${p}${carg} found`, 5000)

        if (command.config.ownerOnly) return

        const info = this.generateCommandInfo(message, command)
        if (!info.footer) info.setFooter('Click the pencil to edit the configuration')

        const sent = await message.channel.send(info)
        await sent.react('✏')

        let filter = (r, u) => r.emoji.name === '✏' && u.id === message.author.id
        const edit = await sent.awaitReactions(filter, { time: 30000, max: 1 })
        await sent.clearReactions()

        if (!edit.first()) return
        await sent.edit(this.addEditControls(message, info, command))

        return this.configure(message, sent, command)
    }
}
