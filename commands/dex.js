const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Pokemon = require("../models/pokemon")

module.exports = class DexCommand extends BaseCommand {
    constructor() {
        super({
            name: "dex",
            category: "Info",
            description: "Get Ultradex data for a Pokemon",
            syntax: "!dex <Pokemon>",
            enabled: true,
            defaultConfig: { "guild": true }
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

        try {
            let query = args.join(" ")
            let pokemon = await Pokemon.findClosest("uniqueName", query)
            if (pokemon) {
                message.client.logger.info({ key: "dex", search: query, result: pokemon.uniqueName })
                let dex = await message.channel.send(await pokemon.dex(query))
                dex.pokemon = pokemon
                dex.orig_author = message.author

                return this.prompt(dex)
            } else {
                message.client.logger.info({ key: "dex", search: query, result: "none" })
                return message.channel.sendPopup("warn", `No results found for ${query}`)
            }
        } catch (e) {
            message.client.logger.parseError(e, this.name)
            return message.channel.sendPopup("erorr", "Error searching the database")
        }
    }
}
