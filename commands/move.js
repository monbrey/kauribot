const BaseCommand = require('./base')
const Move = require('../models/move')

module.exports = class MoveCommand extends BaseCommand {
    constructor() {
        super({
            name: 'move',
            category: 'Info',
            description: 'Provides Move information',
            args: { query: { type: 'String' } },
            syntax: '!move <move>',
            enabled: true
        })
    }

    async run({ channel, client }, args = [], flags = []) {
        const query = args.length('query')
        if (!query) return this.getHelp(channel)

        try {
            const move = await Move.findClosest('moveName', query)
            if (move) {
                client.logger.move(channel, query, move.moveName)
                return channel.send(await move.info())
            } else {
                client.logger.move(channel, query, 'none')
                return channel.sendPopup('warn', `No results found for ${query}`)
            }
        } catch (e) {
            e.key = 'move'
            throw e
        }
    }
}
