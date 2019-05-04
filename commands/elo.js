const BaseCommand = require('./base')
const { RichEmbed } = require('discord.js')
const Trainer = require('../models/trainer')

module.exports = class EloCommand extends BaseCommand {
    constructor() {
        super({
            name: 'elo',
            category: 'Game',
            description: 'Update the ELO ratings for two Battlers',
            args: {
                winner: { type: 'GuildMember' },
                loser: { type: 'GuildMember' }
            },
            syntax: '!elo <@Winner> <@Loser>',
            enabled: true
        })
    }

    async run(message, args = []) {
        let winner, loser
        try {
            winner = await Trainer.findById(args.get('winner').id)
            loser = await Trainer.findById(args.get('loser').id)
        } catch (e) {
            e.key = 'elo'
            throw e
        }

        /* FORMULA
         * Rating calculations - everyone starts at 1500. Pilfering the Elo rating system from Chess. Scores are win=1, draw=.5, loss=0
         * Expected calc - E[a]=1/(1+10^[(R[b]-R[a])/400]
         * New rating - new R[a]= old R[a]+ K(S[a]-E[a]) where K=32 unless R[a]>2000, then K=24
         */

        // Get current ratings
        const rA = winner.battleRecord.elo
        const rB = loser.battleRecord.elo

        // Calc expected ratings
        const eA = 1 / (1 + Math.pow(10, (rB - rA) / 400))
        const eB = 1 / (1 + Math.pow(10, (rA - rB) / 400))

        // Set K values
        const kA = rA > 2000 ? 24 : 32
        const kB = rB > 2000 ? 24 : 32

        // Calc new ratings
        const nA = Math.round(rA + kA * (1 - eA))
        const nB = Math.round(rB + kB * (0 - eB))

        const embed = new RichEmbed()
            .setTitle('ELO Rating Update (Pending)')
            .addField('Before', `<@${winner._id}> | ${rA}\n<@${loser._id}> | ${rB}`)
            .addField('After', `<@${winner._id}> | ${nA}\n<@${loser._id}> | ${nB}`)
            .setFooter('React to confirm the ELO changes')

        const prompt = await message.channel.send(embed)

        if (await prompt.reactConfirm(message.author.id)) {
            winner.battleRecord.elo = nA
            loser.battleRecord.elo = nB
            try {
                await Promise.all([winner.save(), loser.save()])

                embed.setTitle('ELO Rating Update')
                delete embed.footer
                await prompt.edit(embed)
            } catch (e) {
                e.key = 'elo'
                throw e
            }
        } else return prompt.delete()
    }
}
