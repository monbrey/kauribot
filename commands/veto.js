const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const { stripIndents, oneLine } = require("common-tags")

module.exports = class VetoCommand extends BaseCommand {
    constructor() {
        super({
            name: "veto",
            category: "Info",
            description: "Provides Veto Tier informaion from the Refpedia",
            usage: "!veto",
            enabled: true,
            defaultConfig: true
        })
    }

    async run(message, args = [], flags = []) {
        const embed = new RichEmbed()
            .setTitle("Veto Tiers")
            .setDescription(stripIndents`${oneLine`When multiple effects act on the same Pokemon to prevent the execution of a move,
            the referee will first check one effect, then the next, and so on. 
            This is the order that is checked. 
            When a move is vetoed from being executed, no other checks are performed.`}
            
            1. Freeze / Sleep
            2. Truant
            3. Disable
            4. Imprison
            5. Heal Block
            6. Confuse
            7. Flinch
            8. Taunt
            9. Gravity
            10. Attract
            11. Paralysis`)

        return message.channel.send(embed)
    }
}
