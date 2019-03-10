const BaseCommand = require("./base")

module.exports = class PruneCommand extends BaseCommand {
    constructor() {
        super({
            name: "prune",
            category: "Admin",
            description: "Bulk deletes messages from the channel",
            usage: "!prune [number]",
            enabled: true,
            defaultConfig: { 
                "guild": false,
                "roles": ["135865553423302657"]
            },
            guildOnly: true
        })
    }

    async run(message, args = [], flags = []) {
        if(flags.includes("a") && message.author.id === message.client.applicationInfo.owner.id) {
            try {
                let clone = await message.channel.clone()
                await clone.setParent(message.channel.parent)
                await clone.setPosition(message.channel.position)
                message.client.logger.prune(message, "all")
                return message.channel.delete()
            } catch (e) { 
                message.client.logger.parseError(e, "prune")
                return message.channel.sendPopup("error", "Error resetting channel")
            }
        }

        let numToDelete = args[0] ? Math.min(parseInt(args[0]), 100) : 100

        try {
            let deleted = await message.channel.bulkDelete(numToDelete, true)
            message.client.logger.prune(message, deleted.size)
        } catch (e) { 
            message.client.logger.parseError(e, "prune")
            return message.channel.sendPopup("error", "Error deleting messages from channel")
        }
        return true
    }
}