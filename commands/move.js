const BaseCommand = require("./base")
const Move = require("../models/move")


module.exports = class MoveCommand extends BaseCommand {
    constructor() {
        super({
            name: "move",
            category: "Info",
            description: "Provides Move information",
            syntax: "!move <move>",
            enabled: true,
            defaultConfig: { "guild": true }
        })
    }

    async run(message, args = [], flags = []) {
        if (flags.includes("m")) {
            let move = await Move.metronome()
            return await message.channel.send(await move.info())
        } else if (args.length === 0) {
            // Usage
            return
        }

        let query = args.join(" ")

        try {
            let move = await Move.findClosest("moveName", query)
            if (move) {
                message.client.logger.move(message, query, move.moveName)
                return message.channel.send(await move.info())
            } else {
                message.client.logger.move(message, query, "none")
                return message.channel.send(`No results found for ${query}`)
            }
        } catch (e) {
            message.client.logger.parseError(e, "move")
            return message.channel.sendPopup("error", "Error retrieving Move information")
        }
    }
}
