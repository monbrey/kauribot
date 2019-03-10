const BaseCommand = require("./base")

module.exports = class RebootCommand extends BaseCommand {
    constructor() {
        super({
            name: "reboot",
            description: "Forces the bot to logout and reinitialise",
            enabled: true,
            defaultConfig: { "guild": false },
            lockedConfig: { "global": true },
            requiresOwner: true
        })
    }

    async run(message, args = [], flags = []) {
        try {
            const goingDown = await message.channel.sendPopup("error", "**Rebooting and reintialising now!**", 0)
            await message.client.destroy()            
            await message.client.init()
            goingDown.delete()
            message.channel.sendPopup("success", "Rebooted successfully!")
        } catch (e) {
            message.client.logger.parseError(e, this.name)
        }
    }
}