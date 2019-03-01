const BaseEvent = require("./base")

module.exports = class GuildMemberUpdateEvent extends BaseEvent {
    constructor() {
        super({
            name: "guildMemberUpdate",
            enabled: false
        })
    }

    async run(oldMember, newMember) {
        if(oldMember.id === oldMember.guild.me.id && newMember.nickname != null) {
            try { 
                await newMember.setNickname(null) 
                if(newMember.guild.systemChannel) newMember.guild.systemChannel.sendPopup("Please don't weebify my name.")
            } catch (e) { newMember.client.logger.parseError(e, "guildMemberUpdate") }
            return newMember.client.logger.guildMemberUpdate(oldMember, newMember)
        }
    }
}