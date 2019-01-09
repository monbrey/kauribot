const BaseEvent = require("./base")
const { emojiServers } = require("../config").common

module.exports = class EmojiCreateEvent extends BaseEvent {
    constructor() {
        super({
            name: "emojiCreate",
            enabled: true
        })
    }

    async run(emoji) {
        if(emojiServers.includes(emoji.guild.id)) {
            emoji.client.myEmojis.set(emoji.id, emoji)

            console.log("Create", emoji, emoji.client.myEmojis.size)
        }
    }
}