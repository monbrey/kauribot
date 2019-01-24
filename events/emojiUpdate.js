const BaseEvent = require("./base")
const { emojiServers } = require("../config").common

module.exports = class EmojiUpdateEvent extends BaseEvent {
    constructor() {
        super({
            name: "emojiUpdate",
            enabled: true
        })
    }

    async run(emoji) {
        if(emojiServers.includes(emoji.guild.id)) {
            emoji.client.myEmojis.set(emoji.id, emoji)
        }
    }
}