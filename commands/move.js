const BaseCommand = require("./base")
const Move = require("../models/move")


module.exports = class MoveCommand extends BaseCommand {
    constructor() {
        super({
            name: "move",
            category: "Info",
            description: "Provides Move information",
            usage: "!move <Move>",
            enabled: true,
            defaultConfig: true
        })
    }

    async run(message, args = [], flags = []) {
        if(flags.includes("m")) {
            let move = await Move.metronome()
            return await message.channel.send(await move.info())
        } else if (args.length === 0) {
            // Usage
            return
        }
        
        let query = args.join(" ")

        let move = await Move.findClosest("moveName", query)
        if (move) {
            message.client.logger.info({ key: "move", search: query, result: move.moveName })
            return message.channel.send(await move.info())
        } else {
            message.client.logger.info({ key: "move", search: query, result: "none" })
            return message.channel.send(`No results found for ${query}`)
        }
    }
}
