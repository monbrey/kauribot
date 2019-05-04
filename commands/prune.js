const BaseCommand = require('./base')

module.exports = class PruneCommand extends BaseCommand {
    constructor() {
        super({
            name: 'prune',
            category: 'Admin',
            description: 'Bulk deletes messages from the channel',
            usage: '!prune [number]',
            args: { amount: { type: 'String' } },
            enabled: true,
            guildOnly: true
        })
    }

    async run(message, args = []) {
        const amount = args.get('amount')
        const numToDelete = args[0] ? Math.min(parseInt(amount), 100) : 100

        try {
            let deleted = await message.channel.bulkDelete(numToDelete, true)
            message.client.logger.prune(message, deleted.size)
        } catch (e) {
            e.key = this.name
            throw e
        }
        return true
    }
}
