const BaseCommand = require('./base')
const { RichEmbed } = require('discord.js')
const Pokemon = require('../models/pokemon')

module.exports = class RankCommand extends BaseCommand {
    constructor() {
        super({
            name: 'rank',
            category: 'Info',
            description: 'View all Pokemon of a specified rank',
            usage: '!rank <rank|location>',
            args: { query: { type: 'String' } },
            enabled: true
        })
    }

    outputByGen(rankedPokemon) {
        const rank = rankedPokemon[0].rank.story

        const gens = {
            1: rankedPokemon.filter(p => p.dexNumber < 152).map(p => p.displayName),
            2: rankedPokemon.filter(p => p.dexNumber < 252).map(p => p.displayName),
            3: rankedPokemon.filter(p => p.dexNumber < 387).map(p => p.displayName),
            4: rankedPokemon.filter(p => p.dexNumber < 494).map(p => p.displayName),
            5: rankedPokemon.filter(p => p.dexNumber < 650).map(p => p.displayName),
            6: rankedPokemon.filter(p => p.dexNumber < 722).map(p => p.displayName),
            7: rankedPokemon.filter(p => p.dexNumber >= 722).map(p => p.displayName)
        }

        const embed = new RichEmbed()
        embed.title = `${rank} Story / Art Eank Pokemon`

        Object.keys(gens).forEach(key => {
            if (gens[key].length > 0)
                embed.addField(`Gen ${parseInt(key) + 1}`, gens[key].join(', '))
        })

        return embed
    }

    outputByLocation(rankedPokemon) {
        const rank = rankedPokemon[0].rank.park
        const locations = {}
        for (const poke of rankedPokemon) {
            if (!locations[poke.parkLocation]) locations[poke.parkLocation] = []
            locations[poke.parkLocation].push(poke.displayName)
        }

        const embed = new RichEmbed()
        embed.title = `${rank} Park Rank Pokemon`

        Object.keys(locations).forEach(key => {
            if (locations[key].length > 0) embed.addField(key, locations[key].join(', '))
        })

        return embed
    }

    outputByRank(rankedPokemon) {
        const location = rankedPokemon[0].parkLocation

        const ranks = []
        for (const poke of rankedPokemon) {
            if (!ranks[poke.rank.park]) ranks[poke.rank.park] = []
            ranks[poke.rank.park].push(poke.displayName)
        }

        const embed = new RichEmbed()
        embed.title = `Park Pokemon found in ${location}`

        Object.keys(ranks).forEach(key => {
            if (ranks[key].length > 0) embed.addField(key, ranks[key].join(', '))
        })

        return embed
    }

    async run(message, args = [], flags = []) {
        const query = args.get('query')
        if (!query) return super.getHelp(message.channel)

        const rankQ = new RegExp(args.join(' '), 'i')
        try {
            const rankedPokemon = await Pokemon.find({
                $or: [{ 'rank.story': rankQ }, { 'rank.art': rankQ }]
            })
                .select('displayName dexNumber rank.story -_id')
                .cache(0, `rank-${rankQ}`)

            if (rankedPokemon.length !== 0) {
                message.client.logger.rank(message, query, rankedPokemon.length)
                return message.channel.send(this.outputByGen(rankedPokemon))
            }
        } catch (e) {
            e.key = 'rank'
            throw e
        }

        try {
            const rankedPokemon = await Pokemon.find({ 'rank.park': rankQ })
                .select('displayName dexNumber parkLocation rank.park -_id')
                .cache(0, `rank-${rankQ}`)

            if (rankedPokemon.length !== 0) {
                message.client.logger.rank(message, query, rankedPokemon.length)
                return message.channel.send(this.outputByLocation(rankedPokemon))
            }
        } catch (e) {
            e.key = 'rank'
            throw e
        }

        // Search by location
        try {
            // eslint-disable-next-line no-unused-vars
            const [rankedPokemon, rating] = await Pokemon.findAllClosest('parkLocation', query)

            if (rankedPokemon.length !== 0) {
                message.client.logger.rank(message, query, rankedPokemon.length)
                return message.channel.send(this.outputByRank(rankedPokemon))
            }
        } catch (e) {
            e.key = 'rank'
            throw e
        }

        return message.channel.sendPopup('warn', `No Pokemon matching "${query}" could be found`)
    }
}
