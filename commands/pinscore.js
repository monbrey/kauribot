const BaseCommand = require("./base")
const {
    Collection, RichEmbed
} = require("discord.js")

module.exports = class PinscoreCommand extends BaseCommand {
    constructor() {
        super({
            name: "pinscore",
            description: "Tally a scoreboard for pinned messages",
            enabled: false,
            defaultConfig: false,
            requiresOwner: true
        })
    }

    async run(message, args = [], flags = []) {
        let embed = new RichEmbed()
            .setTitle("Pinned Message Scoreboard")
            .setDescription("Generating scoreboard, please wait. This may take some time.")

        let placeholder = await message.channel.send(embed)

        var score = {}
        let channels = message.mentions.channels.size > 0 ? message.mentions.channels : new Collection().set(message.channel.id, message.channel)
        let messageSets = await Promise.all(channels.map(async channel => {
            return await channel.fetchPinnedMessages()
        }))

        messageSets.forEach(messages => {
            messages.forEach(m => {
                score[m.author.username] = m.author.username in score ? score[m.author.username] + 1 : 1
            })
        })

        let newScore = Object
            .entries(score)
            .sort()
            .reduce((_sortedObj, [k,v]) => ({
                ..._sortedObj, 
                [k]: v
            }), {})

        let scoreString = JSON.stringify(newScore, null, 2)
        embed.setDescription(scoreString.substring(1, scoreString.length - 1))
        placeholder.edit({"embed": embed})
    }
}