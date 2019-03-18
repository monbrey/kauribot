const BaseCommand = require("../base")
const { RichEmbed } = require("discord.js")
const Trainer = require("../../models/trainer")

const browsePokemon = require("./pokemon")
const browseItems = require("./items")

module.exports = class MartCommand extends BaseCommand {
    constructor() {
        super({
            name: "mart",
            category: "Game",
            description: "Browse with the URPG Pokemart",
            args: {
                itemType: "String"
            },
            syntax: "!mart <itemType>",
            enabled: true,
            defaultConfig: { guild: false }
        })
    }

    async welcome(message) {
        let tb = "```"
        let embed = new RichEmbed()
            .setTitle(
                `URPG Pokemart | Balance: $${message.trainer.cash.toLocaleString()}`
            )
            .setDescription(
                "The following commands can be used to browse the Pokemart and make purchases"
            )
            .addField(
                "Catalogue",
                `${tb}
Pokemon:  !mart pokemon [page#]
Items:    !mart items [category]
Moves:    Unlocked per-Pokemon, see below${tb}`
            )
            .addField(
                "Purchases",
                `${tb}
Pokemon:  !buy pokemon [<Pokemon>, <Pokemon>...]
Items:    !buy items [<Item>, <Item>...]
Moves:    !buy moves <roster-index>${tb}`
            )

        return message.channel.send(embed)
    }

    async run(message, args = [], flags = []) {
        try {
            message.trainer = await Trainer.findById(message.author.id)
        } catch (e) {
            message.client.logger.parseError(e, this.name)
            return message.channel.sendPopup(
                "error",
                "Error fetching Trainer from dataase"
            )
        }

        const type = args.get("itemType")
        if (!type) return this.welcome(message)

        switch (type) {
            case "pokemon":
                if (args[1])
                    return browsePokemon(
                        message,
                        args[1].match(/[1-9][0-9]*/) ? args[1] : 1
                    )
                else return browsePokemon(message)
            case "items":
                return browseItems(message)
            // case "em":
            //    if (args[1]) return await this.tmInterface(message, args[1].match(/[1-9][0-9]*/) ? args[1] : 1)
            //    else return await this.tmInterface(message)
            // case "hm":
            //    return await this.hmInterface(message)
            default:
                return this.welcome(message)
        }
    }
}
