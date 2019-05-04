const BaseEvent = require('./base')
const { Collection, RichEmbed } = require('discord.js')

module.exports = class MessageReactionAddEvent extends BaseEvent {
    constructor() {
        super({
            name: 'messageReactionAdd',
            enabled: true
        })

        // Stores messages and the time at which they were stored
        // Used to apply a 60 second timeout to errors
        this.messageCache = new Collection()
    }

    async run(reaction, user) {
        // Grab the mesasge for processing
        const message = reaction.message

        // Check that the starChannel is set
        if (!message.guild.starboard || !message.guild.starboard.channel) return

        // Fetch the starboard data
        let starChannel = message.guild.channels.get(message.guild.starboard.channel)
        let starEmoji = message.guild.starboard.emoji || '⭐'
        let minReacts = message.guild.starboard.minReacts

        // If this isnt a starboard reaction, we dont need to process it here
        if (reaction.emoji.toString() !== starEmoji) return

        // Clear out any messages which were cached over a minute ago
        this.messageCache = this.messageCache.filter(m => m < Date.now() - 60000)

        // If the message is still in the cache, we don't want to output errors
        let hideErrors = this.messageCache.has(message.id)

        // Cache the message ID with the current timestamp
        // This is a rolling 60 seconds to prevent spam
        this.messageCache.set(message.id, Date.now())

        // Check that the starboard still exists
        if (!starChannel)
            return hideErrors
                ? null
                : message.channel.send('The configured Starboard channel could not be found.')

        // And that you're not trying to star a message in the starboard
        if (message.channel.id === starChannel.id) return

        // Check they arent a narcissist
        if (message.author.id === user.id)
            return hideErrors
                ? null
                : message.channel.send(`You cannot ${starEmoji} your own messages`)

        // Check that the minimum number of reactions has been reached
        if (reaction.count < minReacts) return

        let getImage = async message => {
            if (message.attachments.size > 0) {
                if (
                    /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|jpeg|gif|png)/gi.test(
                        message.attachments.array()[0].url
                    )
                )
                    return message.attachments.array()[0].url
            }
            if (message.embeds.length > 0) {
                if (
                    message.embeds[0].type === 'image' &&
                    /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/gi.test(message.embeds[0].url)
                )
                    return message.embeds[0].url
            }

            return null
        }

        // If we've passed ALL the checks, we can add this to the queue
        message.client.reactionQueue.add(
            async function() {
                // Get the messages from the channel
                let fetch = await starChannel.fetchMessages({
                    limit: 100
                })
                // Check if it was previously starred
                fetch = fetch.filter(m => m.embeds.length > 0 && m.embeds[0].footer)
                const previous = fetch.find(
                    m =>
                        m.embeds[0].footer.text.startsWith('⭐') &&
                        m.embeds[0].footer.text.endsWith(message.id)
                )

                // Regex to check how many stars the embed has.
                const star = previous ? parseInt(previous.embeds[0].fields[0].value) + 1 : minReacts
                // We use the this.extension function to see if there is anything attached to the message.
                const image = await getImage(message)
                // If the message is empty, we don't allow the user to star the message.
                if (image === null && message.cleanContent.length < 1 && message.embeds.length < 1)
                    return message.channel.send('You cannot star an empty message.')

                const embed = new RichEmbed()
                    .setColor(previous ? previous.embeds[0].color : 15844367)
                    .setAuthor(message.author.tag, message.author.displayAvatarURL)
                    .setTimestamp()
                    .addField(`Votes ${starEmoji}`, star, true)
                    .addField('Link', `[Jump to message](${message.url})`, true)
                    .setFooter(`⭐ | ${message.id}`)
                    .setImage(image)

                if (previous && previous.embeds[0].description)
                    embed.setDescription(previous.embeds[0].description)
                else if (message.cleanContent) embed.setDescription(message.cleanContent)

                if (previous) {
                    // We fetch the ID of the message already on the starboard.
                    const starMsg = await starChannel.fetchMessage(previous.id)
                    // And now we edit the message with the new embed!
                    return await starMsg.edit({
                        embed
                    })
                } else return await starChannel.send(embed)
            },
            { priority: 1 }
        )

        return message.client.logger.messageReactionAdd(reaction, user)
    }
}
