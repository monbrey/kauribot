const BaseEvent = require("./base")
const { emojiServers } = require("../config").common

module.exports = class EmojiDeleteEvent extends BaseEvent {
    constructor() {
        super({
            name: "emojiDelete",
            enabled: true
        })
    }

    async run(emoji) {
        if (emojiServers.includes(emoji.guild.id) && emoji.client.myEmojis.has(emoji.id)) {
            emoji.client.myEmojis.sweep(e => e.id === emoji.id)
        }
    }
}
