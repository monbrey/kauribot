const BaseCommand = require("./base")
const Move = require("../models/move")


module.exports = class MoveCommand extends BaseCommand {
    constructor() {
        super({
            name: "move",
            description: "Provides Move information",
            usage: "!move <Move>",
            enabled: true,
            defaultConfig: true
        })
    }

    async run(message, args = [], flags = [], carg = "move") {
        if(flags.includes("m")) {
            let move = await Move.metronome()
            return await message.channel.send(await move.info())
        }
        else if (args.length === 0) {
            //Usage
            return
        }
        
        let query = args.join(" ")
        message.client.logger.info(`${message.author.username} searched for ${query}`, { key: "move" })

        //Return an exact match
        let move = await Move.findOneExact(query)
        if (move) return await message.channel.send(await move.info())
            
        //Otherwise do a partial match search
        let moves = await Move.findPartial(query)
        //If nothing, search failed
        if (moves.length === 0) return await message.channel.send(`No results found for ${query}`)
        //If one result, return it
        if (moves.length === 1) return await message.channel.send(await moves[0].info())

        //If multiple, prompt for a new command
        return await message.channel.send({
            "embed": {
                title: `${moves.length} results found for "${query}"`,
                description: `${moves.map(m => m.moveName).join("\n")}`,
                footer: {
                    text: "For more information, search again with one of the listed moves"
                }
            }
        })
    }
}
