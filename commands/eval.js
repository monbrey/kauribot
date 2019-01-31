const BaseCommand = require("./base")

const clean = text => {
    if (typeof (text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203))
    else
        return text
}

module.exports = class EvalCommand extends BaseCommand {
    constructor() {
        super({
            name: "eval",
            aliases: ["e"],
            description: "Runs Javascript and returns the result",
            enabled: true,
            defaultConfig: false,
            lockConfig: true,
            requiresOwner: true
        })
    }

    async run(message, args = [], flags = []) {
        try {
            const code = args.join(" ")
            let evaled = await eval(code)

            if (!flags.includes("s")) {
                if (typeof evaled !== "string")
                    evaled = require("util").inspect(evaled)

                if(evaled.length >= 2000) message.channel.send("Response too long", { code: "xl" })
                else message.channel.send(clean(evaled), { code: "xl" })
            }
        } catch (e) {
            message.client.logger.error({ code: e.code, stack: e.stack, key: this.name })
        }
    }
}