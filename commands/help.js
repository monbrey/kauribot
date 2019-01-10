const BaseCommand = require("./base")

module.exports = class HelpCommand extends BaseCommand {
    constructor() {
        super({
            name: "help",
            aliases: ["h"],
            description: "Displays help output",
            details: "Displays help output.\nIf you need help using the help command, you're probably beyond help.",
            usage: "!help",
            enabled: true,
            defaultConfig: true,
            lockConfig: true
        })
    }

    //TODO: This needs to filter on per-command configuration much more effectively
    async run(message, args = [], flags = []) {
        let embed = {
            title: "URPG Dicebot",
            description: `URPG's dice and general gamebot developed by Monbrey.
    Source code will be available on Github in the future.
    Any issues or feature requests, DM Monbrey or open an issue on the Github.`,
            fields: [{
                name: "Commands:",
                value: `\`\`\`${message.client.commands.map(cmd => {
                    if (cmd.enabled && !cmd.requiresOwner) {
                        return `!${cmd.name}\n${cmd.description}`
                    }
                }).join("\n")}\`\`\``
            }],
            footer: {
                text: "All commands have detailed help accessible via !<command> -h"
            }
        }

        return message.channel.send({
            "embed": embed
        })
    }
}
