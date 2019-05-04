const BaseCommand = require('./base')

module.exports = class StartCommand extends BaseCommand {
    constructor() {
        super({
            name: 'migrate',
            category: 'Game',
            details: 'Creates a wallet for existing URPG players',
            syntax: '!migrate <cash> <cc>',
            enabled: false,
            guildOnly: true
        })
    }

    async run(message, args = []) {}
}
