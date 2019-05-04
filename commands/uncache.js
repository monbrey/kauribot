const BaseCommand = require('./base')
const { cache } = require('../util/db')
const { RichEmbed } = require('discord.js')

module.exports = class UncacheCommand extends BaseCommand {
    constructor() {
        super({
            name: 'uncache',
            description: 'Clears a query from the database cache',
            enabled: true,
            args: { key: { type: 'String' } }
        })
    }

    async run(message, args, flags) {
        const cacheKeys = cache
            .keys()
            .map(k => `\`${k.replace('cacheman:cachegoose-cache:', '')}\``)

        const key = args.get('key')

        if (!key) {
            const embed = new RichEmbed().setTitle('Database cache')
                .setDescription(`The following keys currently exist in the database cache:
                ${cacheKeys.join(' ')}

                To clear the cached data for a key, use \`!uncache <key>\`
                New data will be loaded from the database the next time the query is run`)
            return message.channel.send(embed)
        }

        if (cacheKeys.includes(key)) {
            cache.del(`cacheman:cachegoose-cache:${key}`)
            return message.channel.sendPopup('info', `Cache data for ${key} deleted`, 5000)
        } else return message.channel.sendPopup('warn', `Cache data for ${key} not found`, 5000)
    }
}
