module.exports = class BaseEvent {
    constructor(options = {}) {
        this.name = options.name || 'base'
        this.enabled = options.enabled || false
    }
}
