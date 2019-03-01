const BaseEvent = require("./base")

module.exports = class GuildMemberRemoveEvent extends BaseEvent {
    constructor() {
        super({
            name: "guildMemberRemove",
            enabled: true
        })
    }

    async run(member) {
        try {
            let auditLogs = await member.guild.fetchAuditLogs({
                user: member.user,
                limit: 1
            })
            let lastLog = auditLogs.entries.first()
            if (lastLog.target.id === member.id && (Date.now() - lastLog.createdTimestamp) < 5000) {
                return member.client.logger.guildMemberRemove(member, lastLog)
            } else return member.client.logger.guildMemberRemove(member)
        } catch (e) {
            return member.client.logger.parseError(e, this.name)
        }
    }
}