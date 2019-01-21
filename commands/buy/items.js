const { RichEmbed } = require("discord.js")
const Item = require("../../models/item")

const getCart = (items) => {
    return `${ items.length > 0 ? items.map(i => {
        return `${i.itemName} - ${i.priceString}`
    }).join("\n") : "Empty" }`
}

const updateCart = async (message, pokemon, cart = null) => {
    let embed = new RichEmbed()
        .setTitle(`Your Pokemart Cart | Wallet: ${await message.trainer.getBalanceString()}`)
}