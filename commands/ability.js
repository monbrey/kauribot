const BaseCommand = require('./base')
const Ability = require('../models/ability')

module.exports = class AbilityCommand extends BaseCommand {
    constructor() {
        super({
            name: 'ability',
            category: 'Info',
            description: 'Provides information on Pokemon Abilities',
            args: { query: { type: 'String' } },
            syntax: '!ability <ability>',
            enabled: true
        })
    }

    async run({ channel, client }, args = []) {
        const query = args.get('query')
        if (!query) return this.getHelp(channel)

        try {
            const ability = await Ability.findClosest('abilityName', query)
            if (ability) {
                client.logger.ability(channel, query, ability.abilityName)
                return channel.send(ability.info())
            } else {
                client.logger.ability(channel, query, 'none')
                return channel.sendPopup('warn', `No results found for ${query}`)
            }
        } catch (e) {
            e.key = 'ability'
            throw e
        }
    }
}
