const BaseCommand = require("./base")

module.exports = class DiceCommand extends BaseCommand {
    constructor() {
        super({
            name: "dice",
            category: "Game",
            aliases: ["d","roll-dice"],
            description: "Rolls one or more x-sided dice",
            usage: `
!d [x]                          Roll one [sides] sided die
!d -v [x]                       Roll with verification ID
!d [x] [y] [z] ...              Roll multiple dice with [x, y ,z] sides

All numbers must be positive integers`,
            enabled: true,
            defaultConfig: true
        })
    }

    async run(message, args = [], flags = []) {
        if(args.length < 1) return message.channel.send(`\`\`\`Usage: ${this.usage}\`\`\``)

        let rolls = args.filter(arg => /^[1-9]\d*(?:,*[1-9]\d*)?$/.test(arg)).map(arg => { if(!arg.includes(",")) return arg
            if(/^[1-9]\d*$/.test(arg.split(",")[0]) && /^[1-9]\d*$/.test(arg.split(",")[1]))
                return new Array(parseInt(arg.split(",")[0])).fill(arg.split(",")[1])
        }).reduce((acc, val) => acc.concat(val), []).map(arg => Math.floor((Math.random() * arg) + 1))
        
        if(rolls.length == 0) return message.channel.send(`\`\`\`Usage: ${this.usage}\`\`\``)

        let vID = Date.now()
        let verify = flags.includes("v")
        message.channel.send(`${message.author.username} rolled ${rolls.join(", ")}${verify ? ` - verification ID #${vID}` : ""}`)
        message.client.logger.info(`(${vID}) ${message.author.username} rolled ${rolls.join(", ")} in ${message.location}`, { key: "dice" })
    }
}