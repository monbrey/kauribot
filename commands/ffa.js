const BaseCommand = require("./base")
const Trainer = require("../models/trainer")
const { stripIndents } = require("common-tags")

module.exports = class FFACommand extends BaseCommand {
    constructor() {
        super({
            name: "ffa",
            category: "Game",
            description: "Add/remove yourself or ping the FFA list",
            syntax: "!ffa <-a|-r|-p>",
            enabled: true,
            defaultConfig: { "guild": true },
            lockConfig: {
                "global": true
            },
            guildOnly: true
        })
    }

    async run(message, args = [], flags = []) {
        if (flags.length !== 1) {
            message.channel.sendPopup("warn", `The !ffa command must be run with a single flag:
        \`\`\`${this.usage}\`\`\``)
            return
        }

        if (flags.some(f => ["a", "add"].includes(f))) {
            try {
                const trainer = await Trainer.findById(message.author.id)
                if (!trainer) return message.channel.sendPopup("warn", "Could not find a Trainer profile")
                trainer.ffaPing = true
                await trainer.save()
                return message.channel.sendPopup("success", `FFA tagging enabled for ${message.author}`)
            } catch (e) {
                message.client.logger.parseError(e, "ffa")
                return message.channel.sendPopup("error", "Error updating Trainer settings in the database")
            }
        } else if (flags.some(f => ["r", "remove"].includes(f))) {
            try {
                const trainer = await Trainer.findById(message.author.id)
                if (!trainer) return message.channel.sendPopup("warn", "Could not find a Trainer profile")
                trainer.ffaPing = false
                await trainer.save()
                return message.channel.sendPopup("success", `FFA tagging disabled for ${message.author}`)
            } catch (e) {
                message.client.logger.parseError(e, "ffa")
                return message.channel.sendPopup("error", "Error updating Trainer settings in the database")
            }
        } else if (flags.some(f => ["p", "ping"].includes(f))) {
            const channel = ["136222872371855360", "269634154101080065"].includes(message.channel.id)  // #ffa1, #ffa2
            const role = ["358431855743336448", "243949285438259201"].some(r => message.member.roles.has(r)) // senior-referee, referee

            if (channel && role) {
                const pings = await Trainer.find({ ffaPing: true }).select("_id")
                const pingList = pings.map(p => `<@${p.id}>`).join("\n")

                return message.channel.send(stripIndents`**FFA Ping List called by ${message.member}**
                
                Use \`ffa -add\` to add yourself to this list
                Use \`ffa -remove\` to be removed.

                ${pingList}`)
            } 
            if(!role) return message.channel.sendPopup("warn", "The FFA list can only be pinged by referees")
            if(!channel) return message.channel.sendPopup("warn", "The FFA list can only be pinged in an FFA channel")
        }
    }
}
/*

            if (channel && referee) {
                pingList = ""
                count = 1
                PingUser.find().sort({ username: 1 }).exec((err, list) => {
                    list.forEach((user) => {
                        if (user.discord_id != message.author.id)
                            pingList += "<@" + user.discord_id + ">\n"
                    })
                    message.channel.send(`FFA Ping List called by ${message.member.nickname || message.author.username}

Use \`ffa -a\` to add yourself to this list, or \`ffa -r\` to be removed.

${pingList}`)
                })
            }
            else if (!referee) {
                message.author.send("Sorry, that command is restricted to members with the 'referee' role.")
            }
            else if (!channel) {
                message.author.send("The FFA ping command only works in the #ffa chats. Please try again there.")
            }
            break
            default:
        message.channel.send(`The !ffa command must be run with a single flag:
            \`\`\`${exports.help.usage}\`\`\``)
return
        }
    }

exports.conf = {
    enabled: true
}

exports.help = {
    name: "ffa",
    category: "Game",
    description: "",
    usage:
}*/