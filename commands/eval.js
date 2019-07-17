const BaseCommand = require('./base')
const fetch = require('node-fetch')
// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js')

const clean = text => {
    if (typeof text === 'string')
        return text
            .replace(/`/g, '`' + String.fromCharCode(8203))
            .replace(/@/g, '@' + String.fromCharCode(8203))
    else return text
}

/* OWNER ONLY COMMAND */
module.exports = class EvalCommand extends BaseCommand {
    constructor() {
        super({
            name: 'eval',
            aliases: ['e'],
            description: 'Runs Javascript and returns the result',
            enabled: true
        })
    }

    async run(message, args = [], flags = []) {
        try {
            const code = args.join(' ')
            let evaled = await eval(code)

            if (evaled === undefined) return message.channel.sendPopup('info', 'No return value')

            const stringified = require('util').inspect(evaled, { compact: false })

            if (!flags.includes('s')) {
                if (stringified.length >= 2000) {
                    try {
                        const res = await fetch('https://hasteb.in/documents', {
                            method: 'POST',
                            body: stringified,
                            headers: { 'Content-Type': 'application/json' }
                        }).then(res => res.json())

                        message.channel.sendPopup(
                            'info',
                            `Return value too long: uploaded to https://hasteb.in/${res.key}.js`
                        )
                    } catch (e) {
                        return message.channel.sendPopup(
                            'error',
                            'Response too long, and hasteb.in appears to be down. Unable to post return value'
                        )
                    }
                } else {
                    message.channel.send(clean(stringified), { code: 'xl' })
                }
            }
        } catch (e) {
            message.client.logger.parseError(e, this.name)
            message.channel.sendPopup('error', e.message)
        }
    }
}
