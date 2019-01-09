const BaseEvent = require("./base")
const { RichEmbed } = require("discord.js")

module.exports = class GuildMemberRemoveEvent extends BaseEvent {
    constructor(options) {
        super({
            name: "guildMemberRemove",
            enabled: true
        })
    }

    async run(member) {
        try {
            let count = 0
            let interval = member.client.setInterval(async () => {
                let auditLogs = await member.guild.fetchAuditLogs({
                    type: "MEMBER_KICK",
                    limit: 1
                })
                let lastLog = auditLogs.entries.first()
                if (lastLog.target.id === member.id && (Date.now() - lastLog.createdTimestamp) < 3000+(count*1000)) {
                    member.client.clearInterval(interval)
                    return member.client.logger.guildMemberRemove(member, lastLog)
                } else {
                    if (++count == 5) {
                        member.client.clearInterval(interval)
                        return member.client.logger.guildMemberRemove(member)
                    }
                }
            }, 1000)
        } catch (e) {
            return member.client.logger.error(`${e.stack}`)
        }
    }
}