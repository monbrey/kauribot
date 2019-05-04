const BaseCommand = require('./base')
const EOT = require('../models/eot')
const { RichEmbed } = require('discord.js')

module.exports = class EotCommand extends BaseCommand {
    constructor() {
        super({
            name: 'eot',
            category: 'Info',
            description: 'Provides End-of-Turn effect information from the Refpedia',
            syntax: '!eot <effect>',
            args: { effect: { type: 'String' } },
            enabled: true
        })
    }

    async run(message, args = []) {
        const query = args.get('effect')
        const effect = await EOT.findClosest('effect', query, 0)
        const surrounding = await EOT.getSurrounding(effect.order)

        const grouped = []
        for (const e of surrounding) {
            const same = grouped.find(g => g.order === e.order)
            if (same) same.effect = `${same.effect}, ${e.effect}`
            else grouped.push(e)
        }

        const groupString = grouped
            .map(g => `${g.order.toString().includes('.') ? ' - ' : ''}${g.order}. ${g.effect}`)
            .join('\n')

        const embed = new RichEmbed()
            .setTitle(effect.effect)
            .setDescription(`${effect.effect} occurs at position ${effect.order}`)
            .addField('Surrounding Effects', groupString)

        return message.channel.send(embed)
    }
}
