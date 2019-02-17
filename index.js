#!/usr/bin/node

require("dotenv").config({ path: "variables.env" })


require("./util/discordExtensions") // Custom methods on Discord objects, to be replaced in 12.0 with Structures.extend
require("./util/mongooseExtensions")
require("./util/db")
const logger = require("./util/logger")

const { Client, Collection, Util } = require("discord.js")
const path = require("path")
const { promisify } = require("util")
const readdir = promisify(require("fs").readdir)
const config = Object.assign(require("./config")[process.env.NODE_ENV], require("./config")["common"])
const queue = require("p-queue")

class UltraRpgBot extends Client {
    constructor(options = {}) {
        super(options)
        this.logger = logger
        this.config = config
        this.prefix = config.prefix
        this.commands = new Collection()
        this.aliases = new Collection()
        this.activeCommands = new Collection()
        this.emojiCharacters = require("./util/emojiCharacters")

        // Queues for some events
        this.reactionQueue = new queue({
            concurrency: 1,
            autostart: true,
            intervalCap: 1,
            interval: 100
        })
    }

    async loadCommand(cmdFile) {
        try {
            const _command = require(path.join(__dirname, `commands/${cmdFile}`))
            let command = new _command()
            // Check if the command is enabled globally
            if (!command.enabled) return

            this.commands.set(command.name, command)
            if (command.aliases) {
                command.aliases.forEach(alias => this.aliases.set(alias, command.name))
            }
            return
        } catch (e) {
            return this.logger.error({ code: e.code, stack: e.stack, key: "loadCommand" })

        } finally {
            delete require.cache[require.resolve(path.join(__dirname, `commands/${cmdFile}`))]
        }
    }

    async loadEvent(eventFile) {
        try {
            const _event = require(path.join(__dirname, `events/${eventFile}`))
            let event = new _event(this)

            if (!event.enabled) return

            if (event.init)
                await event.init(this)

            return this.on(event.name, event.run.bind(event))
        } catch (e) {
            return this.logger.error({ code: e.code, stack: e.stack, key: "loadEvent" })
        } finally {
            delete require.cache[require.resolve(path.join(__dirname, `events/${eventFile}`))]
        }
    }

    async login() {
        await super.login(process.env.DISCORD_TOKEN)
        this.applicationInfo = await this.fetchApplication()
        // this.applicationInfo.owner.send("URPG Discord Bot started")
        return
    }

    async init() {
        // Load all commands
        try {
            let cmds = await readdir(path.join(__dirname, "commands"))

            await cmds.reduce(async (previousPromise, next) => {
                await previousPromise
                return this.loadCommand(next)
            }, Promise.resolve())

            this.logger.info({ message: "Command loading complete", key: "init" })
        } catch (e) {
            this.logger.error({ code: e.code, stack: e.stack, key: "init" })
        }

        // Load all events
        try {
            let events = await readdir(path.join(__dirname, "events"))

            await events.reduce(async (previousPromise, next) => {
                await previousPromise
                return this.loadEvent(next)
            }, Promise.resolve())

            this.logger.info({ message: "Event loading complete", key: "init" })
        } catch (e) {
            this.logger.error({ code: e.code, stack: e.stack, key: "init" })
        }

        try {
            await this.login()
            this.logger.info({ message: "Ultra RPG Bot connected to Discord", key: "init" })
        } catch (e) {
            this.logger.error({ code: e.code, stack: e.stack, key: "login" })
        }

        return
    }
}

const client = new UltraRpgBot({ disableEveryone: true })

try { 
    client.init() 
} catch (e) { 
    this.logger.error({ code: e.code, stack: e.stack, key: "init" }) 
}

process.on("uncaughtException", (e) => {
    logger.error({ code: e.code, stack: e.stack, key: "uncaughtException" })
})

process.on("unhandledRejection", (reason, p) => {
    logger.error({ ...Util.makePlainError(reason), key: "unhandledRejection" })
})