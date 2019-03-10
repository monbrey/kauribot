const BaseCommand = require("../base")
const BuyPokemon = require("./pokemon")
const BuyMoves = require("./moves")
const BuyAbility = require("./ability")
const BuyItem = require("./items")
const validator = require("validator")
const Trainer = require("../../models/trainer")
const { RichEmbed } = require("discord.js")

module.exports = class BuyCommand extends BaseCommand {
    constructor() {
        super({
            name: "buy",
            category: "Game",
            description: "Make a purchase from the URPG Pokemart or Berry Store",
            args: {
                "itemType": { type: "String" },
                "items": { type: "Array", of: "String" }
            },
            syntax: "!buy <type> [Pokemon...|Item...]|<Roster #>",
            enabled: true,
            defaultConfig: { "guild": false },
            guildOnly: true
        })
    }

    async welcome(message) {
        let tb = "```"
        let embed = new RichEmbed()
            .setTitle(`URPG Pokemart | Balance: $${message.trainer.cash.toLocaleString()}`)
            .setDescription("The following commands can be used to browse the Pokemart and make purchases")
            .addField("Catalogue", `${tb}
Pokemon:  !mart pokemon [page#]
Items:    !mart items [category]
Moves:    Unlocked per-Pokemon, see below${tb}`)
            .addField("Purchases", `${tb}
Pokemon:  !buy pokemon [<Pokemon>, <Pokemon>...]
Items:    !buy items [<Item>, <Item>...]
Moves:    !buy moves <Roster #>${tb}`)

        return message.channel.send(embed)
    }


    async run(message, args = [], flags = []) {
        message.trainer = await Trainer.findById(message.author.id)

        if (!args[0]) return this.welcome(message)

        switch (args[0].toLowerCase()) {
            case "pokemon":
                args[1] = args[1] ? args[1].split(/, */g) : []
                return BuyPokemon(message, args[1])
            case "moves":
                if (args[1]) {
                    if (!validator.isInt(args[1], { min: 1 }))
                        return message.channel.send("Not a valid index (name lookup coming later)")
                    message.pokemon = await message.trainer.getPokemon(parseInt(args[1]) - 1)
                    if (!message.pokemon) return message.channel.sendPopup("error", `No Pokemon found for index [${args[1]}]`)
                    else return BuyMoves(message)
                }
                return message.channel.send("No index provided (name lookup coming later)")
            case "ability":
                if (args[1]) {
                    if (!validator.isInt(args[1], { min: 1 }))
                        return message.channel.send("Not a valid index (name lookup coming later)")
                    message.pokemon = await message.trainer.getPokemon(parseInt(args[1]) - 1)
                    if (!message.pokemon) return message.channel.sendPopup("error", `No Pokemon found for index [${args[1]}]`)
                    else return BuyAbility(message)
                }
                return message.channel.send("No index provided (name lookup coming later)")
            case "items":
                return BuyItem(message)
            default:
                return this.welcome(message)
        }
    }
}
