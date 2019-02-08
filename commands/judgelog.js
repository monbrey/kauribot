const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Trainer = require("../models/trainer")

module.exports = class JudgeLogCommand extends BaseCommand {
    constructor() {
        super({
            name: "judgelog",
            category: "Game",
            aliases: ["jl"],
            description: "Awards cash to coordinators and judge",
            usage: "!judgelog @first @second @third @fourth <rank> [-tieMod] <logURL>",
            enabled: true,
            defaultConfig: false,
            requiresRole: ["judge","chief-judge"]
        })
    }

    async run(message, args = [], flags = []) {
        // Check that four mentions are included
        if (message.mentions.members.size != 4)
            return message.channel.send("This command requires that four coordinators be mentioned.")

        let first = message.mentions.members.get(args[0].replace(/[<@!>]/g, ""))
        let second = message.mentions.members.get(args[1].replace(/[<@!>]/g, ""))
        let third = message.mentions.members.get(args[2].replace(/[<@!>]/g, ""))
        let fourth = message.mentions.members.get(args[3].replace(/[<@!>]/g, ""))
        let judge = message.member
        // Check that the ref isnt also a battler
        if ([first.id, second.id, third.id, fourth.id].includes(judge.id)) return message.channel.send("Illegal command usage - judge cannot also be a coordinator.")

        if (!await Trainer.discordIdExists(first.id)) return message.channel.send(`Could not find a URPG Trainer for ${first}`)
        if (!await Trainer.discordIdExists(second.id)) return message.channel.send(`Could not find a URPG Trainer for ${second}`)
        if (!await Trainer.discordIdExists(third.id)) return message.channel.send(`Could not find a URPG Trainer for ${third}`)
        if (!await Trainer.discordIdExists(fourth.id)) return message.channel.send(`Could not find a URPG Trainer for ${fourth}`)
        if (!await Trainer.discordIdExists(judge.id)) return message.channel.send(`Could not find a URPG Trainer for ${judge}`)

        let payments
        switch (args[4].toLowerCase()) {
            default:
                return message.channel.send(`\`${args[4]}\` is not a valid contest rank. Rank must be normal, super, hyper or master`)
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
            let tiedSpots = f.match(/[1-4]/g).map(x => x - 1)
            let [start, end, length] = [tiedSpots[0], tiedSpots[tiedSpots.length - 1] + 1, tiedSpots.length]
            payments.fill(payments.slice(start, end).reduce((total, num) => total + num) / length, start, end)
        })

        let rank = () => {
            if(args[4].toLowerCase().startsWith["n"]) return "Normal"
            if(args[4].toLowerCase().startsWith["s"]) return "Super"
            if(args[4].toLowerCase().startsWith["h"]) return "Hyper"
            if(args[4].toLowerCase().startsWith["m"]) return "Master"
        }

        let embed = new RichEmbed()
            .setTitle(`${rank} Rank Contest`)
            .setColor(parseInt("9b59b6", 16))
            .setDescription(`Please react to confirm the payments below:
            
**${first.nickname || first.user.username}** : +$${payments[0]}, ${payments[0]} CC (first)
**${second.nickname || second.user.username}** : +$${payments[1]}, ${payments[1]} CC  (second)
**${third.nickname || third.user.username}** : +$${payments[2]}, ${payments[2]} CC (third)
**${fourth.nickname || fourth.user.username}** : +$${payments[3]}, ${payments[3]} CC (fourth)

**${judge.nickname || judge.user.username}** : +$${payments[4]}, ${payments[4]} CC (judge)`)

        let prompt = await message.channel.send(embed)

        if (await prompt.reactConfirm(message.author.id)) {
            let firstCash = await Trainer.modifyCash(first.id, payments[0])
            let firstCC = await Trainer.modifyContestCredit(first.id, payments[0])
            let secondCash = await Trainer.modifyCash(second.id, payments[1])
            let secondCC = await Trainer.modifyContestCredit(second.id, payments[1])
            let thirdCash = await Trainer.modifyCash(third.id, payments[2])
            let thirdCC = await Trainer.modifyContestCredit(third.id, payments[2])
            let fourthCash = await Trainer.modifyCash(fourth.id, payments[3])
            let fourthCC = await Trainer.modifyContestCredit(fourth.id, payments[3])
            let judgeCash = await Trainer.modifyCash(judge.id, payments[4])
            let judgeCC = await Trainer.modifyContestCredit(judge.id, payments[4])

            embed.fields = []
            embed.setTitle("Contest payments confirmed")
                .setColor(parseInt("9b59b6", 16))
                .setDescription(`New cash balances:

**${first.nickname || first.user.username}** : $${firstCash}, ${firstCC} CC
**${second.nickname || second.user.username}** : $${secondCash}, ${secondCC} CC
**${third.nickname || third.user.username}** : $${thirdCash}, ${thirdCC} CC
**${fourth.nickname || fourth.user.username}** : $${fourthCash}, ${fourthCC} CC
**${judge.nickname || judge.user.username}** : $${judgeCash}, ${judgeCC} CC`)

            return message.channel.send(embed)

        }
    }
}
