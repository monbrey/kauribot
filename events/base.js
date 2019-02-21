module.exports = class BaseEvent {
    constructor(options = {}) {
        this.name = options.name || "base"
        this.enabled = options.enabled || false
    }

    argsplit(array) {
        let filterFunc = x => x.startsWith("-")
        return [ 
            array.filter(filterFunc).map(x => x.substring(1).toLowerCase()),
            array.filter(x => !filterFunc(x))
        ]
    }
}