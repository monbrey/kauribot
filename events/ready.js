const BaseEvent = require("./base")
const CommandConfig = require("../models/commandConfig")
const LogConfig = require("../models/logConfig")
const StarboardConfig = require("../models/starboardConfig")

module.exports = class ReadyEvent extends BaseEvent {
    constructor() {
        super({
            name: "ready",
            enabled: true
        })
    }

    async init(client) {
        this.client = client
    }
    // Place where I can trigger whatever I want when the bot is done
    async run() {
        this.client.commands.forEach(async command => {
            // Get the configuration for the command
            command.config = await CommandConfig.getConfigForCommand(this.client, command)
            
            // Check if the command has an init method
            if (command.init)
                await command.init(this.client)            
        })

        this.client.guilds.forEach(async guild => {
            // Set my nickname
            try {
                await guild.me.setNickname(null)
            } catch (e) {
                this.client.logger.warn(`${guild.name}: ${e.message}`)
            }

            guild.logChannel = guild.channels.get(await LogConfig.getLogChannel(guild.id))
            guild.starboard = await StarboardConfig.getConfigForGuild(guild.id)
        })

        this.client.myEmojis = this.client.emojis.filter(e => this.client.config.emojiServers.includes(e.guild.id))
    }
}