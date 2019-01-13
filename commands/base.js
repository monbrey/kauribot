const {
    RichEmbed
} = require("discord.js")

module.exports = class BaseCommand {
    /**
     * @constructor
     * @param {Object}      [options={}]
     * @param {String}          options.name - The name of the command, used to call it
     * @param {Array}           [options.aliases=[]] - Aliases which can also be used to call the command
     * @param {String}          [options.description=""] - Description of the command for !help
     * @param {String}          [options.usage=""] - Detailed usage of the command
     * @param {Boolean}         [options.enabled=false] - Enable the command in the bot
     * @param {Boolean}         [options.defaultConfig=false] - Default enabled state for a guild
     * @param {Boolean}         [options.lockConfig=false] - If the default state can be changed
     * @param {Boolean}         [options.guildOnly=false] - If the command can only be run in server (no DM)
     * @param {Boolean}         [options.requiresPermission=false] - Discord permissions required to run the command
     * @param {Boolean}         [options.requiresOwner=false] - Restrict this command to the bot owner
     */
    constructor(options = {}) {
        this.name = options.name || "base"
        this.category = options.category || null
        this.aliases = options.aliases || []
        this.description = options.description || ""
        this.usage = options.usage || ""
        this.enabled = options.enabled || false
        this.defaultConfig = options.defaultConfig || false
        this.guildOnly = options.guildOnly || false
        this.override = options.override || false,
        this.requiresPermission = options.requiresPermission || false
        this.requiresOwner = options.requiresOwner || false
    }

    async setConfig(config) {
        this.config = config
    }

    async isEnabledInGuild(guild) {
        return this.config.guilds.includes(guild)
    }

    async isEnabledInChannel(channel) {
        return this.config.channel.includes(channel)
    }

    async getHelp(channel) {
        let prefix = channel.client.prefix

        if (this.requiresOwner) return

        let embed = new RichEmbed()
            .setTitle(`${prefix}${this.name}`)
            .setDescription(this.description)
            .addField("Usage", `\`\`\`${this.usage}\`\`\``)
            .addField("Available in DM", this.guildOnly ? "No" : "Yes", true)
            .addField("Requires Permissions", this.requiresPermission ? this.requiresPermission.join(", ") : "No", true)

        return channel.send(embed)
    }
}
