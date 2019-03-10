const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Pokemon = require("../models/pokemon")
const strsim = require("string-similarity")

module.exports = class RankCommand extends BaseCommand {
    constructor() {
        super({
            name: "rank",
            category: "Info",
            description: "View all Pokemon of a specified rank",
            usage: "!rank <rank|location>",
            enabled: true,
            defaultConfig: { "guild": true }
        })
    }

    outputByGen(rankedPokemon) {
        const grouped = rankedPokemon.reduce((genArray, poke) => {
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
        embed.title = `${rankedPokemon[0].rank.story} Story / Art rank Pokemon`

        Object.keys(grouped).forEach(key => {
            if (grouped[key].length > 0)
                embed.addField(`Gen ${parseInt(key) + 1}`, grouped[key].join(", "))
        })

        return embed
    }

    outputByLocation(rankedPokemon) {
        const grouped = rankedPokemon.reduce((parkArray, poke) => {
            if (!parkArray[poke.parkLocation]) parkArray[poke.parkLocation] = []
            parkArray[poke.parkLocation].push(poke.uniqueName)
            return parkArray
        }, [])

        const embed = new RichEmbed()
        embed.title = `${rankedPokemon[0].rank.park} Park rank Pokemon`

        Object.keys(grouped).forEach(key => {
            if (grouped[key].length > 0)
                embed.addField(key, grouped[key].join(", "))
        })

        return embed
    }

    outputByRank(rankedPokemon) {
        const grouped = rankedPokemon.reduce((rankArray, poke) => {
            if(!rankArray[poke.rank.park]) rankArray[poke.rank.park] = []
            rankArray[poke.rank.park].push(poke.uniqueName)
            return rankArray
        }, [])

        const embed = new RichEmbed()
        embed.title = `Park Pokemon found in ${rankedPokemon[0].parkLocation}`

        if(grouped["Common"].length > 0) embed.addField("Common", grouped["Common"].join(", "))
        if(grouped["Uncommon"].length > 0) embed.addField("Uncommon", grouped["Uncommon"].join(", "))
        if(grouped["Rare"].length > 0) embed.addField("Rare", grouped["Rare"].join(", "))
        if(grouped["Legendary"].length > 0) embed.addField("Legendary", grouped["Legendary"].join(", "))


        return embed
    }

    async run(message, args = [], flags = []) {
        if (args.length == 0) return super.getHelp(message.channel)

        const rankQ = new RegExp(args.join(" "), "i")
        try {
            const rankedPokemon = await Pokemon.find({
                $or: [
                    { "rank.story": rankQ },
                    { "rank.art": rankQ }
                ]
            }).select("uniqueName dexNumber rank.story -_id").cache(0)

            if (rankedPokemon.length !== 0) {
                message.client.logger.rank(message, args[0], rankedPokemon.length)
                return message.channel.send(this.outputByGen(rankedPokemon))
            }
        } catch (e) {
            message.client.logger.parseError(e, "rank")
            return message.channel.sendPopup("error", "Error searching the database")
        }

        try {
            const rankedPokemon = await Pokemon.find({ "rank.park": rankQ })
                .select("uniqueName dexNumber parkLocation rank.park -_id").cache(0)

            if (rankedPokemon.length !== 0) {
                message.client.logger.rank(message, args[0], rankedPokemon.length)
                return message.channel.send(this.outputByLocation(rankedPokemon))
            }
        } catch (e) {
            message.client.logger.parseError(e, "rank")
            return message.channel.sendPopup("error", "Error searching the database")
        }

        // Search by location
        try {
            const locations = await Pokemon.find({}).distinct("parkLocation")
            const match = strsim.findBestMatch(args.join(" "), locations).bestMatch.target
            const rankedPokemon = await Pokemon.find({ "parkLocation": match })
                .select("uniqueName dexNumber parkLocation rank.park -_id").cache(0)

            if (rankedPokemon.length !== 0) {
                message.client.logger.rank(message, args[0], rankedPokemon.length)
                return message.channel.send(this.outputByRank(rankedPokemon))
            }
        } catch (e) {
            message.client.logger.parseError(e, "rank")
            return message.channel.sendPopup("error", "Error searching the database")
        }

        return message.channel.sendPopup("warn", `No Pokemon with the rank "${args[0]}" could be found`)
    }
}
