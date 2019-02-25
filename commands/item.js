const BaseCommand = require("./base")
const Item  = require("../models/item")

module.exports = class ItemCommand extends BaseCommand {
    constructor() {
        super({
            name: "item",
            category: "Info",
            description: "Provides Item information",
            usage: "!item <Item>",
            enabled: true,
            defaultConfig: true
        })
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            // Usage
            return
        }
        
        let query = args.join(" ")
        let item = await Item.findClosest("itemName", query)
        if (item) {
            message.client.logger.info({ key: "ability", search: query, result: item.abilityName })
            return message.channel.send(item.info())
        } else {
            message.client.logger.info({ key: "ability", search: query, result: "none" })
            return message.channel.send(`No results found for ${query}`)
        }
    }
}
