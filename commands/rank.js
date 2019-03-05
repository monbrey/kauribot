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
        if (args.length == 0) return super.getHelp(message.channel)

        const rankQ = new RegExp(args[0], "i")
        let rankedPokemon, park
        try {
            rankedPokemon = await Pokemon.find({
                $or: [
                    { "rank.story": rankQ },
                    { "rank.art": rankQ }
                ]
            }).select("uniqueName dexNumber rank.story -_id").cache(0)

            if (rankedPokemon.length === 0) {
                park = true
                rankedPokemon = await Pokemon.find({ "rank.park": rankQ })
                    .select("uniqueName dexNumber parkLocation rank.park -_id").cache(0)
            }
        } catch (e) {
            message.client.logger.parseError(e, "rank")
            message.channel.sendPopup("error", "Error searching the database")
        }

        message.client.logger.rank(message, args[0], rankedPokemon.length)

        if(rankedPokemon.length === 0)
            return message.channel.sendPopup("warn", `No Pokemon with the rank "${args[0]}" could be found`)

        const grouped = park ? rankedPokemon.reduce((parkArray, poke) => {
            if (!parkArray[poke.parkLocation]) parkArray[poke.parkLocation] = []
            parkArray[poke.parkLocation].push(poke.uniqueName)
            return parkArray
        }, []) : rankedPokemon.reduce((genArray, poke) => {
            if (poke.dexNumber < 152) { genArray[0].push(poke.uniqueName); return genArray }
            if (poke.dexNumber < 252) { genArray[1].push(poke.uniqueName); return genArray }
            if (poke.dexNumber < 387) { genArray[2].push(poke.uniqueName); return genArray }
            if (poke.dexNumber < 494) { genArray[3].push(poke.uniqueName); return genArray }
            if (poke.dexNumber < 650) { genArray[4].push(poke.uniqueName); return genArray }
            if (poke.dexNumber < 722) { genArray[5].push(poke.uniqueName); return genArray }
            genArray[6].push(poke.uniqueName)
            return genArray
        }, [[], [], [], [], [], [], []])

        const embed = new RichEmbed()
        embed.title = park ? `${rankedPokemon[0].rank.park} Park rank Pokemon` : `${rankedPokemon[0].rank.story} Story / Art rank Pokemon`

        Object.keys(grouped).forEach(key => {
            if(grouped[key].length > 0)
                embed.addField(`${park ? key : `Gen ${parseInt(key) + 1}`}`, grouped[key].join(", "))
        })

        return message.channel.send(embed)
    }
}
