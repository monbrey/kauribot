const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const { stripIndent } = require("common-tags")
const Underground = require("../models/underground")

module.exports = class UndergroundCommand extends BaseCommand {
    constructor() {
        super({
            name: "underground",
            aliases: ["ug"],
            category: "Game",
            description: "Explore the Underground for a random item",
            usage: stripIndent `
            !ug`,
            enabled: false,
            defaultConfig: false
        })
    }

    async init() {
        //The UG matrix won't change very often, so we can just load it on startup
        this.matrix = await Underground.getMatrix()
    }

    async run(message, args = [], flags = []) {
        let rolls = []
        let item = this.matrix

        //Loop through until we've worked our way to a single item
        while (item.constructor.name === "Array") {
            let rand = Math.floor(Math.random() * item.map(i => i.maxIndex)[item.length - 1]) + 1
            item = item.find(i => i.maxIndex >= rand).item
            rolls.push(rand)
        }

        let embed = new RichEmbed()
            .setTitle("Underground result")
            .setDescription(stripIndent `
            **Rolls:** ${rolls.join(", ")}
            **Found:** ${item}`)

        return message.channel.send(embed)
    }
}