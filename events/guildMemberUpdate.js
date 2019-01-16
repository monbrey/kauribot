const BaseEvent = require("./base")

module.exports = class GuildMemberUpdateEvent extends BaseEvent {
    constructor() {
        super({
            name: "guildMemberUpdate",
            enabled: true
        })
    }

    async run(oldMember, newMember) {
        if(oldMember.id === oldMember.guild.me.id && newMember.nickname != null) {
            try { await newMember.guild.me.setNickname(null) }
            catch (e) { this.logger.warn(`${newMember.guild.name} ${e.message}`) }
            if(newMember.guild.systemChannel) newMember.guild.systemChannel.send("Please don't weebify my name.")
        }
    }
}