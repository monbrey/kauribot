const BaseCommand = require('./base')
const Move = require('../models/move')

module.exports = class MetronomeCommand extends BaseCommand {
    constructor() {
        super({
            name: 'metronome',
            category: 'Game',
            description: 'Select a random move',
            syntax: '!metronome',
            enabled: true
        })
    }

    async run(message) {
        let move = await Move.metronome()
        return message.channel.send(await move.info())
    }
}
