const BaseCommand = require("./base")
const Item = require("../models/item")

module.exports = class ItemCommand extends BaseCommand {
    constructor() {
        super({
            name: "item",
            category: "Info",
            description: "Provides Item information",
            syntax: "!item <Item>",
            enabled: true,
            defaultConfig: { "guild": true }
        })
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            // Usage
            return
        }

        let query = args.join(" ")
        try {
            let item = await Item.findClosest("itemName", query)
            if (item) {
                message.client.logger.item(message, query, item.itemName)
                return message.channel.send(item.info())
            } else {
                message.client.logger.item(message, query, "none")
                return message.channel.send(`No results found for ${query}`)
            }
        } catch (e) {
            message.client.logger.parseError(e, "item")
            return message.channel.sendPopup("error", "Error retrieving Item information")
        }
    }
}
