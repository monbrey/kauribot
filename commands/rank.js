const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Pokemon = require("../models/pokemon")

module.exports = class RankCommand extends BaseCommand {
    constructor() {
        super({
            name: "rank",
            category: "Info",
            description: "View all Pokemon of a specified rank",
            usage: `
!rank <Rank>        View all Pokemon of <Rank>
                    Accept Story, Art and Park ranks`,
            enabled: true,
            defaultConfig: false
        })
    }

    async run(message, args = [], flags = []) {
        if(args.length == 0) return super.getHelp(message.channel)

        const rankQ = new RegExp(args[0], "i")
        const rankedSA = await Pokemon.find({
            $or: [
                { "rank.story": rankQ },
                { "rank.art": rankQ }
            ]
        }).select("speciesName -_id").cache(0)

        if(rankedSA.length !== 0) {
            const names = rankedSA.map(x => x.speciesName).sort((a,b) => a.localeCompare(b))
            const embed = new RichEmbed()
                .setTitle(`Pokemon of Story/Art rank "${args[0]}"`)
                .setDescription(names.join(", "))

            return message.channel.send(embed)
        }

        const rankedP = await Pokemon.find({ "rank.park": rankQ })
            .select("speciesName parkLocation -_id").cache(0)

        if(rankedP.length !== 0) {
            const names = rankedP.map(x => x.speciesName).sort((a,b) => a.localeCompare(b))
            const embed = new RichEmbed()
                .setTitle(`Pokemon of Park rank "${args[0]}"`)
                .setDescription(names.join(", "))
    
            return message.channel.send(embed)
        }
    }
}
