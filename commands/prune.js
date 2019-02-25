const BaseCommand = require("./base")

module.exports = class PruneCommand extends BaseCommand {
    constructor() {
        super({
            name: "prune",
            category: "Admin",
            description: "Bulk deletes messages from the channel",
            usage: "!prune #          [1-100]",
            enabled: true,
            defaultConfig: false,
            guildOnly: true,
            requiresPermission: ["MANAGE_MESSAGES"]})
    }

    async run(message, args = [], flags = []) {
        if(flags.includes("a") && message.author.id === message.client.applicationInfo.owner.id) {
            let clone = await message.channel.clone()
            await clone.setParent(message.channel.parent)
            await clone.setPosition(message.channel.position)
            message.client.logger.prune(message, deleted.size)
            return message.channel.delete()
        }

        let numToDelete = args[0] ? Math.min(parseInt(args[0]), 100) : 100

        let deleted = await message.channel.bulkDelete(numToDelete, true)
        message.client.logger.prune(message, deleted.size)
        return true
    }
}