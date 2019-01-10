const BaseCommand = require("./base")
const Item  = require("../models/item")

module.exports = class ItemCommand extends BaseCommand {
    constructor() {
        super({
            name: "item",
            description: "Provides Item information",
            usage: "!item <Item>",
            enabled: true,
            defaultConfig: true
        })
    }

    async run(message, args = [], flags = []) {
        if (args.length === 0) {
            //Usage
            return
        }
        
        let query = args.join(" ")
        message.client.logger.info(`${message.author.username} searched for ${query}`, { key: "item" })

        //Return an exact match
        let item = await Item.findExact(query)
        if (item) return await message.channel.send(await item.info())
            
        //Otherwise do a partial match search
        let items = await Item.findPartial(query)
        //If nothing, search failed
        if (items.length === 0) return await message.channel.send(`No results found for ${query}`)
        //If one result, return it
        if (items.length === 1) return await message.channel.send(await items[0].info())
        //If multiple, prompt for a new command
        return await message.channel.send({
            "embed": {
                title: `${items.length} results found for "${query}"`,
                description: `${items.map(m => m.itemName).join("\n")}`,
                footer: {
                    text: "For more information, search again with one of the listed items"
                }
            }
        })
    }
}
