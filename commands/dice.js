const BaseCommand = require('./base')

module.exports = class DiceCommand extends BaseCommand {
    constructor() {
        super({
            name: 'dice',
            category: 'Game',
            aliases: ['d', 'roll-dice'],
            description: 'Rolls one or more x-sided dice',
            syntax: '!d <x|x,y>',
            args: { die: { type: 'Array', of: 'String' } },
            enabled: true
        })
    }

    async run({ author, channel, client }, args = [], flags = []) {
        let rolls = args
            .get('die')
            .filter(arg => /^[1-9]\d*(?:,*[1-9]\d*)?$/.test(arg))
            .map(arg => {
                if (!arg.includes(',')) return arg
                if (/^[1-9]\d*$/.test(arg.split(',')[0]) && arg.split(',')[1] !== '')
                    if (
                        /^[1-9]\d*$/.test(arg.split(',')[0]) &&
                        /^[1-9]\d*$/.test(arg.split(',')[1])
                    )
                        return new Array(parseInt(arg.split(',')[0])).fill(arg.split(',')[1])
            })
            .reduce((acc, val) => acc.concat(val), [])
            .map(arg => Math.floor(Math.random() * arg + 1))

        if (rolls.length == 0)
            return channel.sendPopup(
                'warn',
                'None of the provide dice were valid. Valid formats are `#` and `#,#`'
            )

        const response = channel.send(`${author.username} rolled ${rolls.join(', ')}`)
        return client.logger.dice(channel, response.id, rolls)
    }
}
