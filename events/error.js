const BaseEvent = require("./base")

module.exports = class ErrorEvent extends BaseEvent {
    constructor() {
        super({
            name: "error",
            enabled: true
        })
    }
    
    async run (error) {
        //So APPARENTLY the mere EXISTENCE of this error handler
        //will make the bot auto-reconnect. Might as well log too
        try {
            this.logger.error(`${error.message}`, { key: "unknown" })
        } catch (e) {
            /*
            //If the logger fails, default to console for both errors
            console.error(error)
            console.error(e)*/
        }
    }
}