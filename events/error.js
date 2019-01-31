const BaseEvent = require("./base")

module.exports = class ErrorEvent extends BaseEvent {
    constructor() {
        super({
            name: "error",
            enabled: true
        })
    }

    async init(client) {
        this.logger = client.logger
    }
    
    async run (error) {
        //So APPARENTLY the mere EXISTENCE of this error handler
        //will make the bot auto-reconnect. Might as well log too
        try {
            this.logger.error({ code: error.code, stack: error.stack, key: this.name })
        } catch (e) {
            //If the logger fails, default to console for both errors
            console.error(error.stack)
            console.error(e.stack)
        }
    }
}