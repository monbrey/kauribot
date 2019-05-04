const BaseCommand = require('./base')
const { spawn } = require('child_process')

module.exports = class RebootCommand extends BaseCommand {
    constructor() {
        super({
            name: 'reboot',
            description: 'Forces the bot to logout and reinitialise',
            enabled: true,
            args: { hard: { type: 'String' } }
        })
    }

    async run(message, args = []) {
        const hard = args.get('hard')
        if (hard === 'hard') {
            await message.client.destroy()
            spawn(process.argv.shift(), process.argv, {
                cwd: process.cwd(),
                detached: true,
                stdio: 'inherit'
            })
            process.exit()
        } else {
            try {
                const goingDown = await message.channel.sendPopup(
                    'info',
                    '**Rebooting and reintialising now!**',
                    0
                )
                await message.client.destroy()
                await message.client.init()
                goingDown.delete()
                return message.channel.sendPopup('success', 'Rebooted successfully!')
            } catch (e) {
                e.key = 'reboot'
                throw e
            }
        }
    }
}
