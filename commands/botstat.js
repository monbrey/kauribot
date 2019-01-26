const BaseCommand = require("./base")

module.exports = class BotstatCommand extends BaseCommand {
    constructor() {
        super({
            name: "botstat",
            description: "Returns data about the bot system process",
            enabled: false,
            defaultConfig: false,
            lockConfig: true,
            requiresOwner: true
        })
    }

    async run(message, args = [], flags = []) {
        switch (args[0]) {
            case "memory":
            {
                const used = process.memoryUsage().heapUsed / 1024 / 1024
                return message.channel.send(`Currently using ${Math.round(used * 100) / 100} MB`)
            }
        }
    }
}