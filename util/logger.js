const { RichEmbed } = require("discord.js")
const { transports, format, createLogger } = require("winston")
const { Loggly } = require("winston-loggly-bulk")
const { stripIndent } = require("common-tags")

const consoleFormat = format.combine(
    format(info => { return (info.level !== "error" ? info : false) })(),
    format.label({ label: process.env.NODE_ENV }),
    format.timestamp(),
    format.colorize(),
    format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
)

const consoleErrorFormat = format.combine(
    format.label({ label: process.env.NODE_ENV }),
    format.timestamp(),
    format.colorize(),
    format.printf(info => {
        return `[${info.timestamp}] ${info.level}: ${info.message.code}\n${info.message.stack}`
    })
)

const _transports = [
    new Loggly({
        token: "d44ad9d7-6adf-43f1-bfa8-deddd4e209b4",
        subdomain: "monbrey",
        tags: ["Winston-NodeJS", process.env.NODE_ENV],
        json: true,
    }),
    new transports.Console({
        format: consoleFormat,
        level: "info",
    }),
    new transports.Console({
        format: consoleErrorFormat,
        level: "error",
    })
]

if (process.env.NODE_ENV === "production") {
    _transports.push(
        new transports.File({
            filename: "./ultra-rpg-bot.log"
        }),
        new transports.File({
            filename: "./ultra-rpg-bot-errors.log",
            level: "error"
        })
    )
}
class Logger {
    constructor() {
        Object.assign(this, createLogger({
            level: "info",
            transports: _transports
        }))
    }

    async message(message) {
        this.info({
            message: "Message processed",
            content: message.content,
            author: { nickname: message.member.displayName, username: message.author.username, id: message.author.id },
            server: { name: message.guild.name, id: message.guild.id },
            channel: { name: message.channel.name, id: message.channel.id },
            key: "message"
        })
    }

    async newStarter(message, trainer, starter) {
        this.info(`New trainer ${trainer.username} (${trainer.discord_id}) registered`, {
            key: "start"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("New trainer started")
            .setTimestamp()
            .setDescription(`New trainer ${trainer.username} (${message.member}) started with ${starter.uniqueName}`)

        return message.guild.logChannel.send(embed)
    }

    async reflog(message, log, description) {
        this.info(`${message.author.tag} logged a battle: ${log.url}`, {
            key: "reflog"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("Battle logged")
            .setColor(parseInt("1f8b4c", 16))
            .setDescription(stripIndent `
            ${message.member} logged a battle in [${log.channel}](${log.url})
            ${description}`)
            .setTimestamp()

        return message.guild.logChannel.send(embed)
    }

    async judgelog(message, log, description) {
        this.info(`${message.author.tag} logged a contest: ${log.url}`, {
            key: "judgelog"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("Contest logged")
            .setColor(parseInt("1f8b4c", 16))
            .setDescription(stripIndent `
            ${message.member} logged a contest in [${log.channel}](${log.url})
            ${description}`)
            .setTimestamp()

        return message.guild.logChannel.send(embed)
    }

    async pay(message, target, amount, log) {
        this.info(`${message.author.tag} paid ${amount} to ${target}: ${log.url}`, {
            key: "pay"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("Payment logged")
            .setColor(parseInt("1f8b4c", 16))
            .setDescription(`${message.author.tag} paid ${amount} to ${target}: ${log.url}`)
            .setTimestamp()

        return message.guild.logChannel.send(embed)
    }

    async deduct(message, target, amount, log) {
        this.info(`${message.author.tag} deducted ${amount} from ${target}: ${log.url}`, {
            key: "deduct"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("Deduction logged")
            .setColor(parseInt("1f8b4c", 16))
            .setDescription(`${message.author.tag} deducted ${amount} from ${target}: ${log.url}`)
            .setTimestamp()

        return message.guild.logChannel.send(embed)
    }

    async messageDelete(message, auditLog) {
        let member = message.member
        let memberTag = message.author.tag
        let channel = message.channel
        let channelName = message.channel.name
        let guildName = message.guild.name
        let executor = auditLog ? auditLog.executor : "Author or bot"
        let executorTag = auditLog ? executor.tag : "Author or bot"

        this.info(`A message by ${memberTag} in ${guildName}#${channelName} was deleted by ${executorTag}: ${message.cleanContent}`, {
            key: "messageDelete"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("Message deleted")
            .addField("Author", member, true)
            .addField("Channel", channel, true)
            .addField("Deleted by", executor, true)

        if (message.content) embed.addField("Content", message.cleanContent)
        if (message.attachments[0]) embed.addField("Image", message.attachments[0].url)

        try {
            if (message.embeds[0]) {
                embed.addField("Embed", "`See below`")
                await message.guild.logChannel.send(embed)
                return message.guild.logChannel.send(new RichEmbed(message.embeds[0]))
            } else return message.guild.logChannel.send(embed)
        } catch (e) {
            this.error(e.stack)
        }
    }

    async prune(message, numDeleted) {
        this.info(`${message.author.tag} deleted ${numDeleted} messages from ${message.guild.name}#${message.channel.name}`, {
            key: "prune"
        })

        if (!message.guild.logChannel) return

        let embed = new RichEmbed()
            .setFooter("Messages pruned")
            .addField("Channel", message.channel, true)
            .addField("Deleted by", message.member, true)
            .addField("Number Deleted", numDeleted, true)

        try {
            return message.guild.logChannel.send(embed)
        } catch (e) {
            this.error(e.stack)
        }
    }

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

        if (auditLog) { //Was kicked
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
    }
}

module.exports = new Logger()