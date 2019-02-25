const { RichEmbed } = require("discord.js")
const Item = require("../../models/item")
const emojiCharacters = require("../../util/emojiCharacters")

const browseItems = async (message, sentMessage = null) => {
    let embed = new RichEmbed()
        .setTitle(`URPG Pokemart | Item Catalogue\nBalance: ${message.trainer.balanceString}`)
        .setDescription(`Click the number to browse the corresponding item category
Use \`!buy items [<Item>, <Item>...]\` to make a purchase`)
        .addField("1. Battle Items", "Reusable items to be held by your Pokemon")
        .addField("2. Evolution", "These items disappear after being used to evolve a Pokemon")
        .addField("3. Megastones and Z-Crystals", "Unlease your Pokemon's ultimate power!")
        .addField("4. Miscellaneous", "Daycare Passes and other miscellaneous items")

    sentMessage = sentMessage ? await sentMessage.edit(embed) : await message.channel.send(embed)
    const reacts = [emojiCharacters["1"], emojiCharacters["2"], emojiCharacters["3"], emojiCharacters["4"]]
    for (const r of reacts) await sentMessage.react(r)

    const filter = (reaction, user) => reacts.includes(reaction.emoji.name) && user.id === message.author.id

    const response = await sentMessage.awaitReactions(filter, {
        max: 1, time: 30000
    })

    sentMessage.clearReactions()

    if (!response.first()) return
    return browseCategory(message, reacts.indexOf(response.first().emoji.name), sentMessage, 0)
}

const browseCategory = async (message, category = 0, sentMessage = null, subCategory = 0, _page = 1) => {
    const catMatches = [
        ["Choice Items", "Condition Lengtheners", "Damage Increasers", "Focus Items", "Gems", "Herbs", "HP Restoration", "Negative Effect on Holder", "Turn Order Alteration", "Power Boosters", "Other Items", "Type-Enhancing", "Plates", "Stat-Enhancing", "Memories"],
        ["Evolution", "Evolution Stones", "Evolution Items", "Trade Evolution Items", "Form Change Items"],
        ["Mega Evolution", "Z-Crystals"],
        ["Redeemables", "Scarves"]
    ]

    const subCategoryString = catMatches[category][subCategory]
    let items = await Item.find({ category: subCategoryString, "martPrice.pokemart": { $not: { $eq: null } } })

    let embed = new RichEmbed()
        .setTitle(`URPG Pokemart | Item Catalogue | Balance: $${message.trainer.balanceString}`)
        .setDescription(`Click the arrows to cycle through subcategories\n\n**${subCategoryString}**`)

    if (items.length < 25) {
        items.forEach(item => embed.addField(item.itemName, `$${item.martPrice.pokemart.toLocaleString()}`, true))
        while (embed.fields.length % 3 != 0) embed.addBlankField(true)
    } else {
        items = await Item.paginate({ 
            category: subCategoryString, 
            "martPrice.pokemart": { $not: { $eq: null } } 
        }, {},
        (a, b) => {
            if(a.itemName === "Mega Ring / Z-Ring") return -1
            if(b.itemName === "Mega Ring / Z-Ring") return 1
            return a.itemName.localeCompare(b.itemName)
        },
        _page,
        24)

        items.docs.forEach(item => embed.addField(item.itemName, `$${item.martPrice.pokemart.toLocaleString()}`, true))
        while (embed.fields.length % 3 != 0) embed.addBlankField(true)
    }

    const nextText = items.next ? `${subCategoryString} Page ${_page + 1} ->` : 
        subCategory !== catMatches[category].length - 1 ? `${catMatches[category][subCategory + 1]} ->` : ""
    const prevText = items.prev ? `<- ${subCategoryString} Page ${_page - 1}` : 
        subCategory !== 0 ? `<- ${catMatches[category][subCategory - 1]}` : ""
    embed.setFooter(`${prevText} | ${nextText}`)

    sentMessage = sentMessage ? await sentMessage.edit(embed) : await message.channel.send(embed)

    try {
        let next = await sentMessage.reactPaginator(
            message.author.id, 
            subCategory !== 0 || items.prev, 
            (subCategory !== catMatches[category].length - 1) || items.next
        )
        if (next === null) return

        if (next === true) return items.next ? browseCategory(message, category, sentMessage, subCategory, _page + 1) :
            browseCategory(message, category, sentMessage, subCategory + 1)
        else return items.prev ? browseCategory(message, category, sentMessage, subCategory, _page - 1) :
            browseCategory(message, category, sentMessage, subCategory - 1)
    } catch (e) {
        return message.client.logger.error({ code: e.code, stack: e.stack, key: "mart" })
    }
}

module.exports = browseItems