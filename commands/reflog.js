const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Trainer = require("../models/trainer")

module.exports = class RefLogCommand extends BaseCommand {
    constructor() {
        super({
            name: "reflog",
            category: "Game",
            aliases: ["rl"],
            args: {
                "winner": "GuildMember",
                "loser": "GuildMember",
                "size": "String",
                "log": "String"
            },
            description: "Awards cash to battlers and ref",
            usage: "!reflog <@winner> <@loser> <size> [-gym] <description/logURL>",
            enabled: true,
            defaultConfig: false,
            guildOnly: true,
            requiresRole: ["referee", "senior-referee"]
        })
    }

    async run(message, args = [], flags = []) {
        args = await this.parseArgs(message, args)
        if (args === false) return

        args.set("ref", message.member)
        /*
        // Checks that two different users are included
        if (args.get("winner").id === args.get("loser").id)
            return message.channel.sendPopup("warn","The same user cannot be both the winner and loser of the battle")
        // Check the the ref isnt paying themselves
        if ([args.get("winner").id, args.get("loser").id].includes(args.get("ref").id))
            return message.channel.sendPopup("warn", "The referee cannot also be one of the battlers")
*/

        args.set("size", args.get("size").indexOf("v") == 1 ? args.get("size")[0] : args.get("size"))

        const [winnerTrainer, loserTrainer, refTrainer] = await Promise.all([
            Trainer.findById(args.get("winner").id),
            Trainer.findById(args.get("loser").id),
            Trainer.findById(args.get("ref").id)
        ])

        if (!winnerTrainer) return message.channel.send(`Could not find a URPG Trainer for ${args.get("winner")}`)
        if (!loserTrainer) return message.channel.send(`Could not find a URPG Trainer for ${args.get("loser")}`)
        if (!refTrainer) return message.channel.send(`Could not find a URPG Trainer for ${args.get("ref")}`)

        let payments
        switch (args.get("size")) {
            default: return message.channel.send(`\`${args.get("size")}\` is not a valid battle size. Battle size must be between 2 and 6`)
            case "2":
                if (!flags.includes("gym")) {
                    payments = [1000, 500, 1000]
                    break
                } else return message.channel.send(`\`${args.get("size")}\` is not a valid gym battle size. Battle size must be between 3 and 6`)
            case "3": payments = [1500, 500, 1500]
                break
            case "4": payments = [2500, 1000, 2000]
                break
            case "5": payments = [3500, 1500, 2500]
                break
            case "6": payments = [5000, 2500, 4000]
                break
        }

        if (flags.includes("gym")) payments[0] += 500

        let embed = new RichEmbed()
            .setTitle(`${args.get("size")}v${args.get("size")}${flags.includes("gym") ? " Gym" : ""} Battle (Pending)`)
            .setColor(parseInt("1f8b4c", 16))
            .setDescription(`${args.get("log")}\n\n**Payments**`)
            .addField(`**${args.get("winner").displayName}**`, `$${payments[0]} (win)`, true)
            .addField(`**${args.get("loser").displayName}**`, `$${payments[1]} (lose)`, true)
            .addField(`**${args.get("ref").displayName}**`, `$${payments[2]} (ref)`, true)
            .setFooter("React to confirm this log is correct")

        let prompt = await message.channel.send(embed)

        if (await prompt.reactConfirm(message.author.id)) {
            prompt.clearReactions()

            await Promise.all([
                winnerTrainer.modifyCash(payments[0]),
                loserTrainer.modifyCash(payments[1]),
                refTrainer.modifyCash(payments[2])
            ])

            embed.setTitle(`${args.get("size")}v${args.get("size")}${flags.includes("gym") ? " Gym" : ""} Battle`)
            embed.fields = embed.fields.map(f => { 
                return { name: f.name, value: f.value.split(" ")[0], inline: true } 
            })
            delete embed.footer
            prompt.edit(embed)
            return message.client.logger.reflog(message, prompt, args.get("log"))
        } else return prompt.delete()
    }
}