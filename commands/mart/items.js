const { RichEmbed } = require("discord.js")
const Item = require("../../models/item")
const emojiCharacters = require("../../util/emojiCharacters")

const browseItems = async (message, sentMessage = null) => {
    let embed = new RichEmbed()
        .setTitle(`URPG Pokemart | Item Catalogue\nBalance: ${message.trainer.balanceString}`)
        .setDescription(`Click the number to browse the corresponding item category
Use \`!buy items [<Item>, <Item>...]\` to make a purchase`)
        .addField("1. Helds (Damage and Stats)", "Life Orb, Expert Belt, Choice items, Gems and other stat-boosting items")
        .addField("2. Helds (Restoration)", "Leftovers, herbs and other restorative items")
        .addField("3. Helds (Type Boosters)", "Plates, Memories and other type-specific items")
        .addField("4. Helds (Ultimate Power)", "Mega evolution stones and Z-crystals")
        .addField("5. Evolution", "Evolution stones, trade evolution items and Rare Candies")
        .addField("6. Miscellaneous", "Daycare Passes and other miscellaneous items")

    sentMessage = sentMessage ? await sentMessage.edit(embed) : await message.channel.send(embed)
    await sentMessage.react(emojiCharacters["1"])
    await sentMessage.react(emojiCharacters["2"])
    await sentMessage.react(emojiCharacters["3"])
    await sentMessage.react(emojiCharacters["4"])
    await sentMessage.react(emojiCharacters["5"])
    await sentMessage.react(emojiCharacters["6"])

}

const browseCategory = async (message, category = 1, sentMessage = null) => {
    let items = await Pokemon.getMartPokemon(page)

    let embed = new RichEmbed()
        .setTitle(`URPG Pokemart | Pokemon Catalogue | Balance: $${message.trainer.balanceString}`)
        .setDescription(`Click the arrows to browse pages
Use \`!buy pokemon [<Pokemon>, <Pokemon>...]\` to make a purchase`)
        .setFooter(`Page ${page} of ${items.pages}`)

    items.docs.forEach(item => embed.addField(item.uniqueName, `$${item.martPrice.pokemart.toLocaleString()}`, true))

    while (embed.fields.length % 3 != 0) embed.addBlankField(true)

    sentMessage = sentMessage ? await sentMessage.edit(embed) : await message.channel.send(embed)

    try {
        let next = await sentMessage.reactPaginator(message.author.id, items.prev, items.next)

        if (next === true) return message.channel.send(this.browsePokemon(message, page + 1, sentMessage))
        if (next === false) return message.channel.send(this.browsePokemon(message, page - 1, sentMessage))
    } catch (e) {
        return
    }
}

module.exports = browseItems