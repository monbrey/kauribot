const BaseCommand = require('./base')
const Item = require('../models/item')

module.exports = class ItemCommand extends BaseCommand {
    constructor() {
        super({
            name: 'item',
            category: 'Info',
            description: 'Provides Item information',
            syntax: '!item <Item>',
            args: { item: { type: 'String' } },
            enabled: true
        })
    }

    async run(message, args = [], flags = []) {
        const item = args.get('item')

        if (!item) {
            return this.getHelp()
        }

        try {
            let item = await Item.findClosest('itemName', item)
            if (item) {
                message.client.logger.item(message, item, item.itemName)
                return message.channel.send(item.info())
            } else {
                message.client.logger.item(message, item, 'none')
                return message.channel.send(`No results found for ${item}`)
            }
        } catch (e) {
            message.client.logger.parseError(e, 'item')
            return message.channel.sendPopup('error', 'Error retrieving Item information')
        }
    }
}
