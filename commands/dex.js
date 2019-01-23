const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const strsim = require("string-similarity")
const Pokemon  = require("../models/pokemon")

module.exports = class DexCommand extends BaseCommand {
    constructor() {
        super({
            name: "dex",
            category: "Info",
            description: "Get Pokedex data for a Pokemon",
            usage: `
!dex [x]                        Get Pokedex data for <pokemon>`,
            enabled: true,
            defaultConfig: true
        })
    }

    async prompt(dex) {
        //Set the default filter
        let filter = (reaction, user) => ["🇲"].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        await dex.react("🇲")

        //One mega override
        if (dex.pokemon.mega.length == 1) {
            await dex.react("🇽")
            filter = (reaction, user) => ["🇲", "🇽"].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        }
        //Two mega override
        if (dex.pokemon.mega.length == 2) {
            await dex.react("🇽")
            await dex.react("🇾")
            filter = (reaction, user) => ["🇲", "🇽", "🇾"].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        }
        //Primal override
        if (dex.pokemon.primal.length == 1) {
            await dex.react("🇵")
            filter = (reaction, user) => ["🇲", "🇵"].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        }

        let response = await dex.awaitReactions(filter, {
            max: 1,
            time: 20000
        })
        
        if (response.size > 0) {
            //Otherwise proceed through the workflow
            switch (response.first().emoji.name) {
                case "🇲":
                    await dex.edit(await dex.pokemon.learnset())
                    break
                case "🇽":
                    await dex.edit(await dex.pokemon.megaDex(0))
                    break
                case "🇾":
                    await dex.edit(await dex.pokemon.megaDex(1))
                    break
                case "🇵":
                    await dex.edit(await dex.pokemon.primalDex(0))
                    break
            }
        }

        let embed = new RichEmbed(dex.embeds[0])
        embed.setFooter("")
        await dex.edit(embed)
        return await dex.clearReactions()
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            //Usage
            return
        }

        let query = args.join(" ")
        message.client.logger.info(`${message.author.username} searched for ${query}`, {
            key: "dex"
        })

        //Send an exact match
        let pokemon = await Pokemon.findOneExact(query)
        let dex
        if (pokemon) dex = await message.channel.send(await pokemon.dex(message.client))
        else {
            const allPokemonNames = await Pokemon.find().distinct("uniqueName")
            const matches = strsim.findBestMatch(query, allPokemonNames)
            console.log(matches)
            //Otherwise do a partial match search
            pokemon = await Pokemon.findPartial(query)
            //If nothing, search failed
            if (pokemon.length === 0) return await message.channel.send(`No results found for ${query}`)
            //If one result, return it
            else if (pokemon.length === 1) {
                pokemon = pokemon[0]
                dex = await message.channel.send(await pokemon.dex(message.client))
            } else {
                //If multiple, prompt for a new command
                return await message.channel.send({
                    "embed": {
                        title: `${pokemon.length} results found for "${query}"`,
                        description: `${pokemon.map(p => p.speciesName).join("\n")}`,
                        footer: {
                            text: "For more information, search again with one of the listed Pokemon"
                        }
                    }
                })
            }
        }

        //If we get here, we should have sent a Message (dex), start prompt workflow
        dex.pokemon = pokemon
        dex.orig_author = message.author
        await this.prompt(dex)
    }
}
