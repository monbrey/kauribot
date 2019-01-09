const BaseCommand = require("./base")
const config = require("../config")

module.exports = class RebootCommand extends BaseCommand {
    constructor() {
        super({
            name: "reboot",
            description: "Forces the bot to logout and reinitialise",
            enabled: true,
            defaultConfig: false,
            requiresOwner: true
        })
    }

    async run(message, args = [], flags = [], carg = "reboot") {
        try {
            await message.client.destroy()
            await message.client.login(process.env.DISCORD_TOKEN || config.discord_token)
            
            message.client.init()
        } catch (e) {
            message.client.logger.error(e.stack, { key: "reboot" })
        }
    }
}