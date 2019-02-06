const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const { stripIndent } = require("common-tags")
const Item = require("../models/item")
const Move = require("../models/move")
const Trainer = require("../models/trainer")
const Underground = require("../models/underground")
const numEmoji = require("../util/emojiCharacters")

module.exports = class UndergroundCommand extends BaseCommand {
    constructor() {
        super({
            name: "underground",
            aliases: ["ug"],
            category: "Game",
            description: "URPG's item lottery - explore the Underground for a chance at rare and valuables items!",
            usage: stripIndent `
            !ug          Explore the Underground! ($2,500)
            !ug list     Show all Underground rewards`,
            enabled: true,
            defaultConfig: false,
        })
    }

    async init() {
        this.matrix = await Underground.getMatrix()
    }

    async giveItem(message, rolls, item) {
        const dbItem = await Item.findById(item)
        await message.trainer.addNewItem(dbItem, "Item")
        const embed = new RichEmbed()
            .setTitle("Underground result")
            .setDescription(stripIndent `
            **Rolls:** ${rolls.join(" | ")}
            **Found:** ${dbItem.itemName}`)
            .setFooter("The item has been added to your inventory")

        return message.channel.send(embed)
    }

    async chooseItem(message, rolls, item) {
        const items = await item.reduce(async (promise, i) => {
            await promise
            return Item.findById(i)
        }, Promise.resolve())

        const embed = new RichEmbed()
            .setTitle("Underground result")
            .setDescription(stripIndent`
            **Rolls:** ${rolls.join(" | ")}
            **Found:** Your choice of ${items[0].itemName} (1) or ${items[1].itemName} (2)!`)

        const sentMessage = await message.channel.send(embed)
        await sentMessage.react(numEmoji[1])
        await sentMessage.react(numEmoji[2])
        const filter = (reaction, user) => [numEmoji[1], numEmoji[2]].includes(reaction.emoji.name) && user.id === message.author.id
        let response = await sentMessage.awaitReactions(filter, {
            max: 1,
            time: 60000
        })

        // TODO: Meaningful timeout message
        if(!response.first()) return sentMessage.clearReactions()
        const index = response.first().emoji.name === numEmoji[1] ? 1 : 2
        return await message.trainer.addNewItem(items[index], "Item")
    }

    async convertItem(message, rolls, item) {

    }

    async forceConvertItem(mesasge, rolls, item) {
        
    }

    async redeemItem(message, rolls, item) {
        switch (item.constructor.name) {
            // An array indicates a choice between two options
            case "Array": return this.chooseItem(message, rolls, item)
            // Numbers have an optional conversion
            case "Number": return this.convertItem(message, rolls, item)
            // Strings force-convert to something else
            case "String": return this.forceConvertItem(message, rolls, item)
        }
    }

    async randomTM(message, rolls, item) {
        const tms = await Move.find({
            "tm.martPrice.pokemart": {
                $not: {
                    $eq: null
                },
            },
        })

        const randomTM = tms[Math.floor(Math.random() * tms.length)]
        await message.trainer.addNewItem(randomTM, "Move")

        const embed = new RichEmbed()
            .setTitle("Underground result")
            .setDescription(stripIndent `
            **Rolls:** ${rolls.join(" | ")}
            **Found:** TM${randomTM.tm.number} ${randomTM.moveName}`)
            .setFooter("The TM has been added to your inventory")

        return message.channel.send(embed)
    }

    async run(message, args = [], flags = []) {
        message.trainer = await Trainer.findByDiscordId(message.author.id)

        const rolls = []
        let ug = this.matrix

        // Loop through until we've worked our way to a single item
        do {
            const rand = Math.floor(Math.random() * ug.map(i => i.maxIndex)[ug.length - 1]) + 1
            const nextUg = ug.find(i => i.maxIndex >= rand)
            rolls.push(`${rand} ${nextUg.catName ? `(${nextUg.catName})` : ""}`.trim())
            ug = nextUg.function ? nextUg : nextUg.item
        } while (!ug.function)

        await this[ug.function](message, rolls, ug.item)

        const embed = new RichEmbed()
            .setTitle("Underground result")
            .setDescription(stripIndent `
            **Rolls:** ${rolls.join(" | ")}
            **Found:** ${ug.itemName}`)

        return message.channel.send(embed)
    }
}