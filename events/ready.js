const BaseEvent = require("./base")

module.exports = class ReadyEvent extends BaseEvent {
    constructor() {
        super({
            name: "ready",
            enabled: true
        })
    }
    
    // Place where I can trigger whatever I want when the bot is done
    async run() {
    }
}