const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Pokemon = require("../models/pokemon")
const Trainer = require("../models/trainer")

module.exports = class MartCommand extends BaseCommand {
    constructor() {
        super({
            name: "mart",
            description: "Browse with the URPG Pokemart",
            usage: `
!mart                   Browse the URPG Pokemart catalogue`,
            enabled: true,
            defaultConfig: false
        })
    }

    async welcome(message) {
        let embed = new RichEmbed()
            .setTitle(`URPG Pokemart | Balance: $${message.trainer.cash.toLocaleString()}`)
            .setDescription("The following commands can be used to browse the Pokemart and make purchases")
            .addField("Catalogue", "Pokemon: `!mart pokemon <page#>`")
            .addField("Purchases", "Pokemon: `!buy pokemon [<Pokemon>, <Pokemon>...]`\nMoves: `!buy moves <Index/Pokemon> (Pokemon not yet supported)`")
        //.addField("Items", "`!mart items <page#>`")
        //.addField("Moves", "`!mart moves`")
        //.addField("Other", "!mart other")

        return await message.channel.send(embed)
    }

    async browsePokemon(message, page = 1, sentMessage = null) {
        let items = await Pokemon.getMartPokemon(page)

        let embed = new RichEmbed()
            .setTitle(`URPG Pokemart | Pokemon Catalogue | Balance: $${message.trainer.cash.toLocaleString()}`)
            .setDescription(`Click the arrows to browse pages
Use \`!buy pokemon [<Pokemon>, <Pokemon>...]\` to make a purchase`)
            .setFooter(`Page ${page} of ${items.pages}`)

        items.docs.forEach(item => embed.addField(item.uniqueName, `$${item.martPrice.pokemart.toLocaleString()}`, true))

        while (embed.fields.length % 3 != 0) embed.addBlankField(true)

        if (sentMessage) {
            await sentMessage.edit(embed)
        } else sentMessage = await message.channel.send(embed)

        try {
            let next = await sentMessage.reactPaginator(message.author.id, items.prev, items.next)

            if (next === true) return await message.channel.send(this.browsePokemon(message, page + 1, sentMessage))
            if (next === false) return await message.channel.send(this.browsePokemon(message, page - 1, sentMessage))
        } catch (e) {
            return
        }
    }

    async run(message, args = [], flags = []) {
        message.trainer = await Trainer.findByDiscordId(message.author.id)

        switch (args[0]) {
        case "pokemon":
            if (args[1]) return await this.browsePokemon(message, args[1].match(/[1-9][0-9]*/) ? args[1] : 1)
            else return await this.browsePokemon(message)
        //case "em":
        //    if (args[1]) return await this.tmInterface(message, args[1].match(/[1-9][0-9]*/) ? args[1] : 1)
        //    else return await this.tmInterface(message)
        //case "hm":
        //    return await this.hmInterface(message)
        default:
            await this.welcome(message)
        }
    }
}
