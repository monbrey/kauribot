const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
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
        // Set the default filter
        let filter = (reaction, user) => ["🇲"].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        await dex.react("🇲")

        // One mega override
        if (dex.pokemon.mega.length == 1) {
            await dex.react("🇽")
            filter = (reaction, user) => ["🇲", "🇽"].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        }
        // Two mega override
        if (dex.pokemon.mega.length == 2) {
            await dex.react("🇽")
            await dex.react("🇾")
            filter = (reaction, user) => ["🇲", "🇽", "🇾"].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        }
        // Primal override
        if (dex.pokemon.primal.length == 1) {
            await dex.react("🇵")
            filter = (reaction, user) => ["🇲", "🇵"].includes(reaction.emoji.name) && user.id === dex.orig_author.id
        }

        let response = await dex.awaitReactions(filter, {
            max: 1,
            time: 20000
        })
        
        if (response.size > 0) {
            // Otherwise proceed through the workflow
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
        return dex.clearReactions()
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            // Usage
            return
        }

        let query = args.join(" ")

        // Find a match
        let pokemon = await Pokemon.findClosest(query)

        console.log(pokemon.matchRating)

        // Return an error if nothing was found
        if(!pokemon) return message.channel.deleteAfterSend(RichEmbed.error(`No matches found for ${query}`))

        // Log the search
        message.client.logger.info({ key: "dex", search: query, result: pokemon.uniqueName})

        // Start the dex prompt workflow
        let dex = await message.channel.send(await pokemon.dex(query))
        dex.pokemon = pokemon
        dex.orig_author = message.author

        return this.prompt(dex)
    }
}
