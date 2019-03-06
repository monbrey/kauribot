const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const { stripIndents, oneLine } = require("common-tags")

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

    async run(message, args = [], flags = []) {
        if (!args[0]) {
            // Remove commands that the user doesn't have access too
            let commands = message.client.commands.filter(cmd => {
                const enabled = cmd.config.channels.has(message.channel.id) ? // If channel config
                    cmd.config.channels.get(message.channel.id) : // Get channel config
                    cmd.config.guilds.get(message.guild.id)
                const permission = cmd.requiresPermission ?
                    cmd.requiresPermission.some(perm =>
                        message.channel.memberPermissions(message.member).has(perm, true)
                    ) : true
                const role = cmd.requiresRole ?
                    message.member.roles.some(role => cmd.requiresRole.includes(role.name)) :
                    true

                return (enabled && permission && role && !this.requiresOwner)
            })

            let game = commands.filter(cmd => cmd.category === "Game")
                .map(cmd => cmd.name).sort((a,b)=>a.localeComare(b))
            let info = commands.filter(cmd => cmd.category === "Info")
                .map(cmd => cmd.name).sort((a,b)=>a.localeComare(b))
            let admin = commands.filter(cmd => cmd.category === "Admin")
                .map(cmd => cmd.name).sort((a,b)=>a.localeComare(b))
            let misc = commands.filter(cmd => cmd.category === "Miscellaneous")
                .map(cmd => cmd.name).sort((a,b)=>a.localeComare(b))

            let embed = new RichEmbed()
                .setTitle("Pokemon URPG Discord Bot")
                .setDescription(stripIndents`${oneLine`Pokemon URPG's Discord game and information bot.
                Developed by Monbrey with the help and support of the community.`}
                
                The source code is available on [Github](https://github.com/Monbrey/ultra-rpg-bot)
                Any issues or feature requests, [log an issue](https://github.com/Monbrey/ultra-rpg-bot/issues)

                Full documentation will be written soon™
                
                **Available Commands**`)
                .setFooter("Most commands have more help available via !help [command] or !command -h")

            if (game.length) embed.addField("Gameplay Interaction", `\`${game.join("` `")}\``)
            if (info.length) embed.addField("Information and Lookups", `\`${info.join("` `")}\``)
            if (admin.length) embed.addField("Administration Functions", `\`${admin.join("` `")}\``)
            if (misc.length) embed.addField("Miscellaneous", `\`${misc.join("` `")}\``)

            return message.channel.send({
                "embed": embed
            })
        } else {
            let cmd = message.client.commands.get(args[0]) || message.client.commands.get(message.client.aliases.get(args[0]))
            if (!cmd) return

            return cmd.getHelp(message.channel)
        }
    }
}