const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Trainer = require("../models/trainer")

module.exports = class JudgeLogCommand extends BaseCommand {
    constructor() {
        super({
            name: "judgelog",
            category: "Game",
            aliases: ["jl"],
            args: {
                "first": "GuildMember",
                "second": "GuildMember",
                "third": "GuildMember",
                "fourth": "GuildMember",
                "rank": "String",
                "log": "String"
            },
            description: "Logs a contest and awards cash and content credits to Coordinators and Judge",
            usage: "!judgelog @first @second @third @fourth <rank> [-tieMod] <logURL>",
            enabled: true,
            defaultConfig: false,
            requiresRole: ["judge", "chief-judge"]
        })
    }

    async run(message, args = [], flags = []) {
        args = await this.parseArgs(message, args)
        if (args === false) return

        args.set("judge", message.member)
        
        // Check that four mentions are included
        // if (args.some(arg => args.filter(a => a.id === arg.id).size > 1))
        //    return message.channel.sendPopup("warn", "The same Coordinator cannot be placed twice")
        // Check that the judge isnt also one of the coordinators
        // if (args.first(4).map(a => a.id).includes(args.get("judge").id))
        //    return message.channel.sendPopup("warn", "The Judge cannot also be one of the Coordinators")

        let first, second, third, fourth, judge
        try {
            [first, second, third, fourth, judge] = await Promise.all([
                Trainer.findById(args.get("first").id),
                Trainer.findById(args.get("second").id),
                Trainer.findById(args.get("third").id),
                Trainer.findById(args.get("fourth").id),
                Trainer.findById(args.get("judge").id)
            ])
        } catch (e) {
            message.channel.sendPopup("error", "Error fetching Trainers from database", 0)
            return message.client.logger.error({ code: e.code, stack: e.stack, key: "judgelog" })
        }

        if (!first) return message.channel.send(`Could not find a URPG Trainer for ${args.get("first")}`)
        if (!second) return message.channel.send(`Could not find a URPG Trainer for ${args.get("second")}`)
        if (!third) return message.channel.send(`Could not find a URPG Trainer for ${args.get("third")}`)
        if (!fourth) return message.channel.send(`Could not find a URPG Trainer for ${args.get("fourth")}`)
        if (!judge) return message.channel.send(`Could not find a URPG Trainer for ${args.get("judge")}`)

        let payments
        switch (args.get("rank").toLowerCase()) {
            default:
                return message.channel.send(`\`${args.get("rank")}\` is not a valid contest rank. Rank must be normal, super, hyper or master`)
            case "n":
            case "normal":
            case "s":
            case "super":
                payments = [2000, 1500, 1000, 500, 1500]
                break
            case "h":
            case "hyper":
            case "m":
            case "master":
                payments = [2500, 2000, 1500, 1000, 1500]
                break
        }

        flags.filter(f => f.includes("tie")).forEach(f => {
            const tiedSpots = f.match(/[1-4]/g).map(x => x - 1)
            const [start, end, length] = [tiedSpots[0], tiedSpots[tiedSpots.length - 1] + 1, tiedSpots.length]
            payments.fill(payments.slice(start, end).reduce((total, num) => total + num) / length, start, end)
        })

        const rank = ((r) => {
            if (r.startsWith("n")) return "Normal"
            if (r.startsWith("s")) return "Super"
            if (r.startsWith("h")) return "Hyper"
            if (r.startsWith("m")) return "Master"
        })(args.get("rank").toLowerCase())

        let embed = new RichEmbed()
            .setTitle(`${rank} Rank Contest (Pending)`)
            .setColor(parseInt("9b59b6", 16))
            .setDescription(`${args.get("log")}\n\n**Payments**`)
            .addField(`${args.get("first").displayName} (1)`, `$${payments[0]}, ${payments[0]} CC`, true)
            .addField(`${args.get("second").displayName} (2)`, `$${payments[1]}, ${payments[1]} CC`, true)
            .addField(`${args.get("third").displayName} (3)`, `$${payments[2]}, ${payments[2]} CC`, true)
            .addField(`${args.get("fourth").displayName} (4)`, `$${payments[3]}, ${payments[3]} CC`, true)
            .addField(`${args.get("judge").displayName} (judge)`, `$${payments[4]}, ${payments[4]} CC`, true)
            .addBlankField(true)
            .setFooter("React to confirm that this log is correct")

        const prompt = await message.channel.send(embed)

        if (await prompt.reactConfirm(message.author.id)) {
            prompt.clearReactions()

            try {
                await Promise.all([
                    first.modifyCash(payments[0]),
                    first.modifyContestCredit(payments[0]),
                    second.modifyCash(payments[1]),
                    second.modifyContestCredit(payments[1]),
                    third.modifyCash(payments[2]),
                    third.modifyContestCredit(payments[2]),
                    fourth.modifyCash(payments[3]),
                    fourth.modifyContestCredit(payments[3]),
                    judge.modifyCash(payments[4]),
                    judge.modifyContestCredit(payments[4]),
                ])
            } catch (e) {
                message.channel.sendPopup("error","Error updating balances in database", 0)
                return message.client.logger.error({ code: e.code, stack: e.stack, key: "judgelog" })
            }

            embed.setTitle(`${rank(args.get("rank").toLowerCase())} Rank Contest (Pending)`)
            embed.fields = embed.fields.map(f => {
                return { name: f.name, value: f.value.split(" ").pop().join(" "), inline: true }
            })
            delete embed.footer
            prompt.edit(embed)
            return message.client.logger.judgelog(message, prompt)

        } else return prompt.delete()
    }
}
