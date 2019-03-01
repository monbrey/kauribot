const BaseEvent = require("./base")
const {
    RichEmbed
} = require("discord.js")

module.exports = class MessageReactionRemoveEvent extends BaseEvent {
    constructor() {
        super({
            name: "messageReactionRemove",
            enabled: true
        })
    }

    async run(reaction, user) {
        const message = reaction.message

        // Check that the starChannel is set
        if (!message.guild.starboard || !message.guild.starboard.channel) return

        let starChannel = message.guild.channels.get(message.guild.starboard.channel)
        let starEmoji = message.guild.starboard.emoji || "⭐"
        let minReacts = message.guild.starboard.minReacts

        // And check it still exists
        if (!starChannel) return 

        // And that you're not trying to star a message in the starboard
        if (message.channel.id === starChannel.id) return

        // Ignore the author
        if (message.author.id === user.id) return

        // Check for the star emoji
        if (reaction.emoji.toString() !== starEmoji) return

        let getImage = async (attachment) => {
            const imageLink = attachment.split(".")
            const typeOfImage = imageLink[imageLink.length - 1]
            const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage)
            if (!image) return ""
            return attachment
        }

        // If we've passed ALL the checks, we can add this to the queue
        message.client.reactionQueue.add(async function() {
            // Get the messages from the channel
            let fetch = await starChannel.fetchMessages({
                limit: 100
            })

            fetch = fetch.filter(m => m.embeds.length > 0)
            // Check if it was previously starred
            const previous = fetch.find(m => m.embeds[0].footer.text.startsWith("⭐") && m.embeds[0].footer.text.endsWith(message.id))

            if (previous) {
                const star = parseInt(previous.embeds[0].fields[0].value)
                const starMsg = await starChannel.fetchMessage(previous.id)
                if (parseInt(star - 1) < minReacts) {
                    return await starMsg.delete()
                }

                const image = message.attachments.size > 0 ? await getImage(message.attachments.array()[0].url) : ""
                const embed = new RichEmbed()
                    .setColor(previous.embeds[0].color)
                    .setDescription(previous.embeds[0].description)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL)
                    .setTimestamp()
                    .addField(`Votes ${starEmoji}`, star - 1, true)
                    .addField("Link", `[Jump to message](${message.url})`, true)
                    .setFooter(`⭐ | ${message.id}`)
                    .setImage(image)
                return await starMsg.edit({
                    embed
                })
            }
        })

        return message.client.logger.messageReactionREmove(reaction, user)
    }
}
