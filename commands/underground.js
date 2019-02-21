const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const { stripIndent } = require("common-tags")
const Item = require("../models/item")
const Move = require("../models/move")
const Trainer = require("../models/trainer")
const { Underground, Digs, Pending } = require("../models/underground")
const numEmoji = require("../util/emojiCharacters")

module.exports = class UndergroundCommand extends BaseCommand {
    constructor() {
        super({
            name: "underground",
            aliases: ["ug"],
            category: "Game",
            description: "URPG's item lottery - explore the Underground for a chance at rare and valuables items!",
            usage: stripIndent`
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
            .setDescription(stripIndent`
            **Rolls:** ${rolls.join(" | ")}
            **Found:** ${dbItem.itemName}!${dbItem.desc ? `\n\n${dbItem.desc}` : ""}`)
            .setFooter("The item has been added to your inventory")

        message.channel.send(embed)
        return true
    }

    async chooseItem(message, rolls, item) {
        const items = await Promise.all(item.map(i => Item.findById(i)))

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
            time: 120000
        })

        // Return the message reference if no item is chosen, to be logged as a Pending
        if (!response.first()) {
            sentMessage.clearReactions()
            return sentMessage
        }

        const index = response.first().emoji.name === numEmoji[1] ? 0 : 1
        message.trainer.addNewItem(items[index], "Item")

        embed.description += `\n\n**Chosen:** ${items[index].itemName}`
        embed.setFooter("The item has been added to your inventory")

        sentMessage.edit(embed)
        return true
    }

    async convertItem(message, rolls, item) {
        item = await Item.findById(item)
        message.channel.send(item, { code: "js" })
        return true
    }

    async forceConvertItem(message, rolls, item) {
        const amount = (() => {
            switch (item) {
                case "Big Nugget":
                    return 10000
                case "Nugget":
                    return 5000
                case "Pearl String":
                    return 7500
                case "Star Piece":
                    return 2500
                case "Big Pearl":
                    return 3000
                case "Relic Silver":
                    return 3500
                case "Relic Copper":
                    return 1000
                case "Pearl":
                    return 1500
                case "Stardust":
                    return 2000
                default:
                    return 0
            }
        })()

        if (amount) {
            message.trainer.modifyCash(amount)
            const embed = new RichEmbed()
                .setTitle("Underground result")
                .setDescription(stripIndent`
                **Rolls:** ${rolls.join(" | ")}
                **Found:** ${item}!
    
                The ${item} has been inspected and valued at $${amount.toLocaleString()}!`)
                .setFooter("The money has been added to your account")

            message.channel.send(embed)
            return true
        }

        const tm = await (() => {
            switch (item) {
                case "Blue Shard":
                    return Move.findById(357)
                case "Green Shard":
                    return Move.findById(336)
                case "Red Shard":
                    return Move.findById(509)
                case "Yellow Shard":
                    return Move.findById(387)
                default:
                    return 0
            }
        })()

        if (tm) {
            const embed = new RichEmbed()
                .setTitle("Underground result")
                .setDescription(stripIndent`
                **Rolls:** ${rolls.join(" | ")}
                **Found:** ${item}!
    
                The ${item} has been exchanged for TM${tm.tm.number} ${tm.moveName}!`)
                .setFooter("The TM has been added to your inventory")

            message.channel.send(embed)
            return true
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
            .setDescription(stripIndent`
            **Rolls:** ${rolls.join(" | ")}
            **Found:** Random TM!
            
            ...TM${randomTM.tm.number} ${randomTM.moveName}!`)
            .setFooter("The TM has been added to your inventory")

        message.channel.send(embed)
        return true
    }

    async resolve(message, rolls, ug) {
        let result = await this[ug.function](message, rolls, ug.item)
        if (result === true) return Digs.addDig(message.trainer.id, result.id)
        else { // Handle pending choices
            Pending.create({
                "message": result.id,
                "channel": result.channel.id,
                "item": ug,
                "trainer": message.author.id,
                "month": new Date(Date.now()).getMonth(),
                "rolls": rolls
            })
            const embed = new RichEmbed()
                .setTitle("Underground result pending")
                .setDescription(`Your Underground dig item selection has timed out
You can resume your selection at a later time with the command below

\`!ug claim ${result.url}\``, 0)
            try { return await message.author.send(embed) } catch (e) { return await message.channel.send(embed) }
        }
    }

    async run(message, args = [], flags = []) {
        message.trainer = await Trainer.findById(message.author.id)
        if (!message.trainer) return message.channel.sendPopup("error", null,
            "You must have a URPG Trainer profile to run this command.")

        if (!this.matrix) await this.init()

        if (args[0] === "claim" && args[1]) {
            let [channel, ugMsg] = args[1].split(/\//g).slice(5)
            try {
                if (!channel || !ugMsg) {
                    message.channel.sendPopup("error", null, "Unable to parse Underground Message URL")
                    throw new Error("Unable to parse Underground Message URL")
                }

                const pendingUg = await Pending.findOne({
                    "channel": channel,
                    "message": ugMsg
                })

                if (!pendingUg) {
                    message.channel.sendPopup("warn", null, "No pending Underground item pickup matches that URL")
                    throw new Error(`No pickup found for ${channel}/${ugMsg}`)
                }

                if (pendingUg.trainer !== message.author.id) {
                    message.channel.sendPopup("warn", null, "That pending Underground item pickup is not yours to claim!")
                    throw new Error("Unauthorised claim attempt")
                }

                const rolls = pendingUg.rolls
                const ug = pendingUg.item
                pendingUg.remove()
                return this.resolve(message, rolls, ug)
            } catch (e) {
                return message.client.logger.error({ code: e.code, stack: e.stack, key: "underground" })
            }
        }

        // Else make a new roll
        if (!await Digs.canDig(message.trainer.id))
            return message.channel.sendPopup("warn", null, "Maximum digs for this month reached")

        const rolls = []
        let ug = this.matrix

        // Loop through until we've worked our way to a single item
        const dice = [28, 10, 5]
        do {
            const rand = dice.shift()// Math.floor(Math.random() * ug.map(i => i.maxIndex)[ug.length - 1]) + 1
            const nextUg = ug.find(i => i.maxIndex >= rand)
            rolls.push(`${rand} ${nextUg.catName ? `(${nextUg.catName})` : ""}`.trim())
            ug = nextUg.function ? nextUg : nextUg.item
        } while (!ug.function)

        return this.resolve(message, rolls, ug)
    }
}