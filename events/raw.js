const BaseEvent = require("./base")
const { MessageReaction } = require("discord.js")

module.exports = class RawEvent extends BaseEvent {
    constructor(_client) {
        super({
            name: "raw",
            enabled: true
        })

        this.client = _client
    }

    async MESSAGE_REACTION_ADD(data) {
        // Check if the message is cached, we dont want to process the event twice
        const channel = this.client.channels.get(data.channel_id)
        if(channel.messages.has(data.message_id)) return

        // Fetch it so it will be cached
        let message = await channel.fetchMessage(data.message_id)
        let emoji = data.emoji.id ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name

        // Get the actual reaction from the fetched message
        let reaction = message.reactions.get(emoji)

        // Finally, emit the event
        this.client.emit("messageReactionAdd", reaction, this.client.users.get(data.user_id))
    }

    async MESSAGE_REACTION_REMOVE(data) {
        // Check if the message is cached, we dont want to process the event twice
        const channel = this.client.channels.get(data.channel_id)
        if(channel.messages.has(data.message_id)) return

        // Fetch it so it will be cached
        let message = await channel.fetchMessage(data.message_id)
        let emoji = data.emoji.id ? `${data.emoji.name} :${data.emoji.id}` : data.emoji.name

        // Get the actual reaction from the fetched message
        let reaction = message.reactions.get(emoji) || new MessageReaction(message, data.emoji, 0, false)

        // Finally, emit the event
        this.client.emit("messageReactionRemove", reaction, this.client.users.get(data.user_id))
    }

    async run(data) {
        let eventName = data.t
        let eventData = data.d

        if(this[eventName]) {
            this[eventName](eventData)
            this.client.logger.raw(data)
        }
    }
}