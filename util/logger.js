const { RichEmbed, Util } = require('discord.js')
const { transports, format, createLogger } = require('winston')
const { Loggly } = require('winston-loggly-bulk')

const consoleFormat = format.combine(
    format(info => {
        return info.level !== 'error' ? info : false
    })(),
    format.label({ label: process.env.NODE_ENV }),
    format.timestamp(),
    format.colorize(),
    format.json(),
    format.printf(info => {
        const message = info.message instanceof Object ? JSON.stringify(info.message) : info.message
        return `[${info.timestamp}] ${info.level}: ${message}`
    })
)

const consoleErrorFormat = format.combine(
    format.label({ label: process.env.NODE_ENV }),
    format.timestamp(),
    format.colorize(),
    format.json(),
    format.printf(info => {
        return (
            `[${info.timestamp}] ${info.level}: ` +
            (info.stack || info.message.stack || info.message)
        )
    })
)

const logglyFormat = format.combine(
    format.label({ label: process.env.NODE_ENV }),
    format.json(),
    format(info => {
        if (info.message.constructor.name === 'Object') {
            const message = info.message
            if (message.message) info.message = info.message.message
            else delete info.message
            Object.assign(info, message)
        }
        return info
    })()
)

const _transports = [
    new Loggly({
        token: 'd44ad9d7-6adf-43f1-bfa8-deddd4e209b4',
        subdomain: 'monbrey',
        tags: ['Winston-NodeJS', process.env.NODE_ENV, 'kauribot'],
        format: logglyFormat,
        json: true
    }),
    new transports.Console({
        format: consoleFormat,
        level: 'info'
    }),
    new transports.Console({
        format: consoleErrorFormat,
        level: 'error'
    })
]

class Logger {
    constructor() {
        Object.assign(
            this,
            createLogger({
                level: 'info',
                transports: _transports
            })
        )
    }

    /**
     * Builds a real stack for API Errors and parses it into a standard format for the logger
     * @param {Error} error
     * @param {string} key
     */
    async parseError(error, key = null) {
        const errorType = error.constructor.name
        error = { ...Util.makePlainError(error) }
        if (key) error.key = key

        if (errorType === 'DiscordAPIError') {
            Error.captureStackTrace(error)
            error.stack = `${errorType}: ${error.message}\n${error.stack
                .split('\n')
                .slice(2, -1)
                .join('\n')}`
        }

        this.error(Object.assign({ ...error }, { stack: error.stack }))
    }

    /**
     * Returns an object representing the server location of an event
     * @param {Message|Channel} input
     */
    location(input) {
        const location = input.constructor.name === 'Message' ? input.channel : input
        return {
            server: { id: location.guild.id, name: location.guild.name },
            channel: { id: location.id, name: location.name }
        }
    }

    /** EVENTS **/
    async guildMemberAdd(member) {
        this.info({
            message: 'New member joined',
            member: member.id,
            server: { name: member.guild.name, id: member.guild.id },
            key: 'guildMemberAdd'
        })

        if (!member.guild.logChannel) return

        let embed = new RichEmbed()
            .setAuthor(`${member.user.tag} (${member.id})`, member.user.displayAvatarURL)
            .setFooter('New member joined')
            .setTimestamp()

        return member.guild.logChannel.send(embed)
    }

    async guildMemberRemove(member, auditLog = null) {
        let embed = new RichEmbed().setAuthor(
            `${member.user.tag} (${member.id})`,
            member.user.displayAvatarURL
        )

        if (!auditLog) {
            this.info({
                message: 'Member left',
                member: member.id,
                server: { name: member.guild.name, id: member.guild.id },
                key: 'guildMemberRemove'
            })

            embed.setFooter('Member left').setTimestamp()
        } else {
            const action = auditLog.action === 'MEMBER_BAN_ADD' ? 'Ban' : 'Kick'
            this.info({
                message: 'Member removed',
                member: member.id,
                executor: auditLog.executor.id,
                action: action,
                reason: auditLog.reason ? auditLog.reason : 'No reason provided',
                server: { name: member.guild.name, id: member.guild.id },
                key: 'guildMemberRemove'
            })

            embed
                .setDescription(
                    `${action} by ${auditLog.executor}:
${auditLog.reason ? auditLog.reason : 'No reason provided'}`
                )
                .setFooter(`Member removed (${action})`)
        }

        if (member.guild.logChannel) return member.guild.logChannel.send(embed)
    }

    async guildMemberUpdate(oldMember, newMember) {
        this.info({
            message: 'Member updated',
            member: newMember.id,
            server: { name: newMember.guild.name, id: newMember.guild.id },
            key: 'guildMemberUpdate'
        })
    }

    async message(message) {
        this.info({
            message: 'Message processed',
            content: message.content,
            author: message.author.id,
            ...this.location(message),
            key: 'message'
        })
    }

    async messageDelete(message) {}

    async messageReactionAdd(reaction, user) {
        this.info({
            message: 'Message reaction added',
            target: reaction.message.id,
            ...this.location(reaction.message),
            reactor: user.id,
            count: reaction.count,
            key: 'messageReactionAdd'
        })
    }

    async messageReactionRemove(reaction, user) {
        this.info({
            message: 'Message reaction removed',
            target: reaction.message.id,
            ...this.location(reaction.message),
            reactor: user.id,
            count: reaction.count,
            key: 'messageReactionRemove'
        })
    }

    async raw(data) {
        this.info({
            message: 'Raw event processed',
            name: data.t,
            key: 'raw'
        })
    }

    async ready() {
        this.info({
            message: 'Client ready',
            key: 'ready'
        })
    }

    async roleCreate() {}

    async roleDelete() {}

    async roleUpdate() {}

    /** COMMANDS **/
    async ability(channel, query, result) {
        this.info({
            message: 'Abilities searched',
            query,
            result,
            ...this.location(channel),
            key: 'ability'
        })
    }
    async deduct(message, log) {
        this.info({
            message: 'Deduction logged',
            author: message.author.id,
            ...this.location(message),
            log: log.url,
            key: 'deduct'
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter('deduct')
            .setDescription(
                `${message.member.displayName} made a deduction in [${log.channel.name}](${
                    log.url
                })`
            )
            .setTimestamp()

        try {
            return message.guild.logChannel.send(embed)
        } catch (e) {
            this.parseError(e, 'logger')
        }
    }

    async dice(channel, response, result) {
        this.info({
            message: 'Dice rolled',
            result,
            ...this.location(channel),
            verification: response,
            key: 'dice'
        })
    }

    async item(message, query, result) {
        this.info({
            message: 'Items searched',
            query,
            result,
            ...this.location(message),
            key: 'item'
        })
    }

    async judgelog(message, log) {
        this.info({
            message: 'Contest logged',
            author: message.author.id,
            ...this.location(message),
            log: log.url,
            key: 'judgelog'
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter('judgelog')
            .setColor('0x9b59b6')
            .setDescription(
                `${message.member.displayName} logged a contest in [${log.channel.name}](${
                    log.url
                })`
            )
            .setTimestamp()

        try {
            return message.guild.logChannel.send(embed)
        } catch (e) {
            this.parseError(e, 'logger')
        }
    }

    async logs(message, target) {
        this.info({
            message: 'Log channel set',
            ...this.location(message),
            target: { id: target.id, name: target.name },
            executor: message.author.id,
            key: 'logs'
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter('logs')
            .setDescription(`${message.member.displayName} set the logging channel to ${target}`)
            .setTimestamp()

        try {
            return message.guild.logChannel.send(embed)
        } catch (e) {
            this.parseError(e, 'logger')
        }
    }

    async move(message, query, result) {
        this.info({
            message: 'Moves searched',
            query: query,
            result: result,
            ...this.location(message),
            key: 'move'
        })
    }

    async pay(message, log) {
        this.info({
            message: 'Payment logged',
            author: message.author.id,
            ...this.location(message),
            log: log.url,
            key: 'pay'
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter('pay')
            .setDescription(
                `${message.member.displayName} made a payment in [${log.channel.name}](${log.url})`
            )
            .setTimestamp()

        try {
            return message.guild.logChannel.send(embed)
        } catch (e) {
            this.parseError(e, 'logger')
        }
    }

    async prune(message, numDeleted) {
        this.info({
            message: 'Messages pruned',
            ...this.location(message),
            deleted: numDeleted,
            key: 'prune'
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter('prune')
            .setDescription(
                `${message.member.displayName} deleted ${numDeleted} messages from ${
                    numDeleted === 'all' ? message.channel.name : message.channel
                }`
            )
            .setTimestamp()

        try {
            return message.guild.logChannel.send(embed)
        } catch (e) {
            this.parseError(e, 'logger')
        }
    }

    async reflog(message, log) {
        this.info({
            message: 'Battle logged',
            author: message.author.id,
            server: { name: message.guild.name, id: message.guild.id },
            channel: { name: message.channel.name, id: message.channel.id },
            log: log.url,
            key: 'reflog'
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter('reflog')
            .setColor('0x1f8b4c')
            .setDescription(
                `${message.member.displayName} logged a battle in [${log.channel.name}](${log.url})`
            )
            .setTimestamp()

        try {
            return message.guild.logChannel.send(embed)
        } catch (e) {
            this.parseError(e, 'logger')
        }
    }

    async rank(message, query, result) {
        this.info({
            message: 'Ranks searched',
            query: query,
            result: result,
            ...this.location(message),
            key: 'rank'
        })
    }

    async starboard(message, target, param = null) {
        this.info({
            message: 'Starboard config updated',
            config: param ? param : 'channel',
            param: target.id,
            ...this.location(message),
            key: 'starboard'
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter('starboard')
            .setDescription(
                `${message.member.displayName} set the starboard-${
                    param ? param : 'channel'
                } to ${target}`
            )
            .setTimestamp()

        try {
            return message.guild.logChannel.send(embed)
        } catch (e) {
            this.parseError(e, 'logger')
        }
    }

    async start(message, trainer, starter) {
        this.info({
            message: 'New trainer started',
            ...this.location(message),
            trainer: { id: trainer.id, username: trainer.username },
            starter: starter.uniqueName,
            key: 'start'
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter('start')
            .setTimestamp()
            .setDescription(
                `New trainer ${trainer.username} (${message.member} : ${
                    message.member.id
                }) started with ${starter.uniqueName}`
            )

        return message.guild.logChannel.send(embed)
    }

    async statusEffect(message, query, result) {
        this.info({
            message: 'Status Effects searched',
            query: query,
            result: result,
            ...this.location(message),
            key: 'move'
        })
    }

    /*
    async purchase(message, customer, log) {
        this.info({
            "message": `${customer} made a Pokemart purchase`,
            "log": log.url,
            "key": "buy"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("Pokemart purchase")
            .setTimestamp()
            .setDescription(`${customer} made a purchase in [${log.channel}](${log.url}`)

        return message.guild.logChannel(embed)
    }

    async newStarter(message, trainer, starter) {
        this.info(`New trainer ${trainer.username} (${trainer.id}) registered`, {
            key: "start"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("New trainer")
            .setTimestamp()
            .setDescription(`New trainer ${trainer.username} (${message.member}) started with ${starter.uniqueName}`)

        return message.guild.logChannel.send(embed)
    }




    /*
    async guildMemberAdd(member) {
        this.info(`${member.user.tag} joined ${member.guild.name}`, {
            key: "guildMemberAdd"
        })

        if (!member.guild.logChannel) return

        let embed = new RichEmbed()
            .setAuthor(`${member.user.tag} (${member.id})`, member.user.avatarURL)
            .setFooter("User joined")
            .setTimestamp()

        return member.guild.logChannel.send(embed)
    }

    async guildMemberRemove(member, auditLog) {
        let executor = auditLog ? auditLog.executor : member
        let executorTag = auditLog ? executor.tag : executor.user.tag

        let embed = new RichEmbed()
            .setAuthor(`${member.user.tag} (${member.id})`, member.user.avatarURL)
            .setTimestamp()

        if (auditLog) { // Was kicked
            this.info(`${member.user.tag} was kicked from ${member.guild.name} by ${executorTag}`, {
                key: "guildMemberRemove"
            })

            embed.setDescription(`Kicked by ${executor}`).setFooter("User kicked")
        } else {
            this.info(`${member.user.tag} left ${member.guild.name}`, {
                key: "guildMemberRemove"
            })
            embed.setFooter("User left")
        }

        if (member.guild.logChannel) return member.guild.logChannel.send(embed)
    }*/
}

module.exports = new Logger()
