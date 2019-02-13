const BaseCommand = require("../base")
const BuyPokemon = require("./pokemon")
const BuyMoves = require("./moves")
const BuyAbility = require("./ability")
const BuyItem = require("./items")
const validator = require("validator")
const { RichEmbed } = require("discord.js")
const Trainer = require("../../models/trainer")

module.exports = class BuyCommand extends BaseCommand {
    constructor() {
        super({
            name: "buy",
            description: "Make a purchase from the URPG Pokemart or Berry Store",
            usage: `
!buy <item>                 Purchase <item> and have the cost deducted from your account`,
            enabled: true,
            defaultConfig: false
        })
    }

    async run(message, args = [], flags = []) {
        message.trainer = await Trainer.findByDiscordId(message.author.id)

        switch (args[0].toLowerCase()) {
            case "pokemon":
                args[1] = args[1] ? args[1].split(/, */g) : []
                return await BuyPokemon(message, args[1])
            case "moves":
                if (args[1]) {
                    if (!validator.isInt(args[1], { min: 1 }))
                        return message.channel.send("Not a valid index (name lookup coming later)")
                    message.pokemon = await message.trainer.getPokemon(parseInt(args[1]) - 1)
                    if (!message.pokemon) return message.channel.send(RichEmbed.error(`Pokemon not found","No Pokemon found for index [${args[1]}]`))
                    else return await BuyMoves(message)
                }
                return message.channel.send("No index provided (name lookup coming later)")
            case "ability":
                if (args[1]) {
                    if (!validator.isInt(args[1], { min: 1 }))
                        return message.channel.send("Not a valid index (name lookup coming later)")
                    message.pokemon = await message.trainer.getPokemon(parseInt(args[1]) - 1)
                    if (!message.pokemon) return message.channel.send(RichEmbed.error(`Pokemon not found","No Pokemon found for index [${args[1]}]`))
                    else return await BuyAbility(message)
                }
                return message.channel.send("No index provided (name lookup coming later)")
            case "items": 
                return await BuyItem(message)
            default:
                return await this.welcome(message)
        }
    }
}
