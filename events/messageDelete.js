const BaseEvent = require("./base")

module.exports = class MessageDeleteEvent extends BaseEvent {
    constructor() {
        super({
            name: "messageDelete",
            enabled: false
        })
    }

    async run(message) {
        let count = 0

        let findLog = async (message) => {
            let auditLogs = await message.guild.fetchAuditLogs({
                type: "MESSAGE_DELETE",
            })

            let logResult = auditLogs.entries.first()

            try {
                if (
                    logResult &&
                        logResult.extra.channel.id === message.channel.id &&
                        logResult.target.id === message.author.id &&
                        logResult.createdTimestamp > (Date.now() - 5000)
                ) return message.client.logger.messageDelete(message, logResult)

                //This may need a loop to deal with delayed logs
                if (++count < 3) return setTimeout(() => {
                    findLog(message)
                }, 3000)

                //Otherwise we can assume this was deleted by the author
                //We don't care about bots deleting their own messages
                if (!message.author.bot) return message.client.logger.messageDelete(message)
            } catch (e) {
                message.client.logger.error({ code: e.code, stack: e.stack, key: this.name })
            }
        }

        return findLog(message)

    }
}
