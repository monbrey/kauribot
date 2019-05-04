const BaseCommand = require('./base')
const StatusEffect = require('../models/statusEffect')

module.exports = class StatusEffectCommand extends BaseCommand {
    constructor() {
        super({
            name: 'statuseffect',
            aliases: ['se'],
            category: 'Info',
            description: 'Provides Status Effect information',
            args: { effect: { type: 'String', required: true } },
            syntax: '!statuseffect <Status>',
            enabled: true
        })
    }

    async run(message, args = [], flags = []) {
        const query = args.get('effect')

        try {
            const [s1, s2] = await Promise.all([
                await StatusEffect.findClosest('statusName', query),
                await StatusEffect.findClosest('shortCode', query)
            ])

            const effect = s2 ? (s1 ? (s1.matchRating > s2.matchRating ? s1 : s2) : s2) : s1

            if (effect) {
                message.client.logger.statusEffect(message, query, effect.statusName)
                return message.channel.send(await effect.info())
            } else {
                message.client.logger.statusEffect(message, query, 'none')
                return message.channel.send(`No results found for ${query}`)
            }
        } catch (e) {
            message.client.logger.parseError(e, 'statusEffect')
            return message.channel.sendPopup('error', 'Error retrieving Status information')
        }
    }
}
