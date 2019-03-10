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
                "winner": { type: "GuildMember", required: true },
                "loser": { type: "GuildMember", required: true },
                "size": { type: "String", required: true },
                "log": { type: "String" }
            },
            description: "Logs a battle and awards cash to Battlers and Referee",
            syntax: "!reflog <@winner> <@loser> <size> [-gym] <description/logURL>",
            enabled: true,
            defaultConfig: {
                "guild": false,
                "roles": ["135865553423302657"]
            },
            guildOnly: true,
        })
    }

    async run(message, args = [], flags = []) {
        args.set("ref", message.member)

        // Checks that two different users are included
        if (args.get("winner").id === args.get("loser").id)
            return message.channel.sendPopup("warn", "The same Battler cannot be both the winner and loser of the battle")
        // Check the the ref isnt paying themselves
        if ([args.get("winner").id, args.get("loser").id].includes(args.get("ref").id))
            return message.channel.sendPopup("warn", "The Referee cannot also be one of the Battlers")

        args.set("size", args.get("size").indexOf("v") == 1 ? args.get("size")[0] : args.get("size"))

        let winner, loser, referee
        try {
            [winner, loser, referee] = await Promise.all([
                Trainer.findById(args.get("winner").id),
                Trainer.findById(args.get("loser").id),
                Trainer.findById(args.get("ref").id)
            ])
        } catch (e) {
            message.channel.sendPopup("error", "Error fetching Trainers from database")
            return message.client.logger.parseError(e, "reflog")
        }

        if (!winner) return message.channel.sendPopup("warn", `Could not find a URPG Trainer for ${args.get("winner")}`)
        if (!loser) return message.channel.sendPopup("warn", `Could not find a URPG Trainer for ${args.get("loser")}`)
        if (!referee) return message.channel.sendPopup("warn", `Could not find a URPG Trainer for ${args.get("ref")}`)

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
            .setFooter("React to confirm that this log is correct")

        let prompt = await message.channel.send(embed)

        if (await prompt.reactConfirm(message.author.id)) {
            prompt.clearReactions()

            try {
                await Promise.all([
                    winner.modifyCash(payments[0]),
                    loser.modifyCash(payments[1]),
                    referee.modifyCash(payments[2])
                ])
            } catch (e) {
                message.channel.sendPopup("error", "Error updating balances in database")
                return message.client.logger.parseError(e, "reflog")
            }

            embed.setTitle(`${args.get("size")}v${args.get("size")}${flags.includes("gym") ? " Gym" : ""} Battle`)
            embed.fields = embed.fields.map(f => {
                return { name: f.name, value: f.value.split(" ")[0], inline: true }
            })
            delete embed.footer
            prompt.edit(embed)
            return message.client.logger.reflog(message, prompt)
        } else return prompt.delete()
    }
}