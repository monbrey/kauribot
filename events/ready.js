const BaseEvent = require('./base')
const LogConfig = require('../models/logConfig')
const StarboardConfig = require('../models/starboardConfig')

module.exports = class ReadyEvent extends BaseEvent {
    constructor() {
        super({
            name: 'ready',
            enabled: true
        })
    }

    async init(client) {
        this.client = client
    }

    async run() {
        try {
            this.client.applicationInfo = await this.client.fetchApplication()
            // await this.client.applicationInfo.owner.send('URPG Discord Bot started')
        } catch (e) {
            this.client.logger.parseError(e, 'notify')
        }

        this.client.guilds.forEach(async guild => {
            // Set/clear bot nicknames
            try {
                await guild.me.setNickname(null)
            } catch (e) {
                this.client.logger.warn({ message: `${guild.name}: ${e.message}`, key: 'ready' })
            }

            guild.logChannel = guild.channels.get(await LogConfig.getLogChannel(guild.id))
            guild.starboard = await StarboardConfig.getConfigForGuild(guild.id)
        })
    }
}
