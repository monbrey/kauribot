const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const { stripIndent, oneLine } = require("common-tags")

module.exports = class HelpCommand extends BaseCommand {
    constructor() {
        super({
            name: "help",
            category: "Info",
            aliases: ["h"],
            description: "Displays help output",
            usage: "!help [command]",
            enabled: true,
            defaultConfig: true,
            lockConfig: true
        })
    }

    //TODO: This needs to filter on per-command configuration much more effectively
    async run(message, args = [], flags = []) {
        if (!args[0]) {
            //Remove commands that the user doesn't have access too
            let commands = message.client.commands.filter(cmd => {
                let enabled = cmd.config.channels.has(message.channel.id) ? //If channel config
                    cmd.config.channels.get(message.channel.id) : //Get channel config
                    cmd.config.guilds.get(message.guild.id)
                let permission = cmd.requiresPermission ?
                    message.channel.memberPermissions(message.member).has(cmd.requiresPermission, true) :
                    true

                return (enabled && permission)
            })

            let game = commands.filter(cmd => cmd.category === "Game")
                .map(cmd => `${message.client.prefix}${cmd.name.padEnd(12, " ")}${cmd.description}`)
            let info = commands.filter(cmd => cmd.category === "Info")
                .map(cmd => `${message.client.prefix}${cmd.name.padEnd(12, " ")}${cmd.description}`)
            let admin = commands.filter(cmd => cmd.category === "Admin")
                .map(cmd => `${message.client.prefix}${cmd.name.padEnd(12, " ")}${cmd.description}`)
            let misc = commands.filter(cmd => cmd.category === "Miscellaneous")
                .map(cmd => `${message.client.prefix}${cmd.name.padEnd(12, " ")}${cmd.description}`)

            let embed = new RichEmbed()
                .setTitle("Pokemon URPG Discord Bot")
                .setDescription(stripIndent`${oneLine`Pokemon URPG's Discord game and information bot.
                Developed by Monbrey with the help and support of the community.`}
                
                Source code will be available on Github in the future.
                Any issues or feature requests, please DM Monbrey
                
                **Available Commands**`)
                .setFooter("Most commands have detailed help available via !help [command] or !command -h")

            if (game.length) embed.addField("Game", `\`\`\`${game.join("\n")}\`\`\``)
            if (info.length) embed.addField("Information", `\`\`\`${info.join("\n")}\`\`\``)
            if (admin.length) embed.addField("Administration", `\`\`\`${admin.join("\n")}\`\`\``)
            if (misc.length) embed.addField("Miscellaneous", `\`\`\`${misc.join("\n")}\`\`\``)

            return message.channel.send({
                "embed": embed
            })
        } else {
            let cmd = message.client.commands.get(args[0])
            if (!cmd) return

            return cmd.getHelp(message.channel)
        }
    }
}