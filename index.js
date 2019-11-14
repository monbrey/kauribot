#!/usr/bin/node

require('./util/extensions') // Custom methods on objects, to be replaced in 12.0 with Structures.extend
require('./util/db')
const logger = require('./util/logger')

const { Client, Collection } = require('discord.js')
const { join } = require('path')
const { readdir } = require('fs').promises
const { prefix } = Object.assign(
    require('./config')[process.env.NODE_ENV],
    require('./config')['common']
)
const queue = require('p-queue')
const CommandConfig = require('./models/commandConfig')

class UltraRpgBot extends Client {
    constructor(options = {}) {
        super(options)
        this.logger = logger
        this.prefix = prefix
        this.commands = new Collection()
        this.activeCommands = new Collection()

        // Queues for some events
        this.reactionQueue = new queue({
            concurrency: 1,
            autostart: true,
            intervalCap: 1,
            interval: 100
        })
    }

    async loadCommand(cmdFile, configs) {
        const _command = require(join(__dirname, `commands/${cmdFile}`))
        let command = new _command()

        // Check if the command is enabled globally
        if (!command.enabled) return

        command.config =
            configs.find(cfg => cfg.commandName === command.name) ||
            (await CommandConfig.create({ commandName: command.name }))

        if (command.init) {
            await command.init(this)
        }

        this.commands.set(command.name, command)
        if (command.aliases) {
            for (const a of command.aliases) this.commands.set(a, command)
        }

        delete require.cache[require.resolve(join(__dirname, `commands/${cmdFile}`))]
        return
    }

    async loadEvent(eventFile) {
        const _event = require(join(__dirname, `events/${eventFile}`))
        let event = new _event(this)

        if (!event.enabled) return

        if (event.init) await event.init(this)

        delete require.cache[require.resolve(join(__dirname, `events/${eventFile}`))]
        return this.on(event.name, event.run.bind(event))
    }

    async init() {
        // Load all commands
        let cmds = await readdir(join(__dirname, 'commands'))
        let events = await readdir(join(__dirname, 'events'))

        try {
            const configs = await CommandConfig.find({}).cache(30, 'command-config')

            await Promise.all(cmds.map(c => this.loadCommand(c, configs)))
            this.logger.info({ message: 'Command loading complete', key: 'init' })
        } catch (e) {
            this.logger.parseError(e, 'loadCommand')
        }

        try {
            await Promise.all(events.map(e => this.loadEvent(e)))
            this.logger.info({ message: 'Event loading complete', key: 'init' })
        } catch (e) {
            this.logger.parseError(e, 'loadEvent')
        }

        try {
            await this.login(process.env.IMF_KAURI_TOKEN)
            this.logger.info({ message: 'Ultra RPG Bot connected to Discord', key: 'init' })
        } catch (e) {
            this.logger.parseError(e, 'login')
        }

        return
    }
}

const client = new UltraRpgBot({
    disableEveryone: true,
    disabledEvents: [
        'TYPING_START',
        'VOICE_STATE_UPDATE',
        'VOICE_SERVER_UPDATE',
        'CHANNEL_PINS_UPDATE'
    ],
    restTimeOffset: 250
})

client.init()

// process.on('uncaughtException', e => {
//     logger.parseError(e, 'uncaughtException')
// })

// process.on('unhandledRejection', reason => {
//     logger.parseError(reason, 'unhandledRejection')
// })
