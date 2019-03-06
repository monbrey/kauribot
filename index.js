#!/usr/bin/node

require("dotenv").config({ path: "variables.env" })
require("./util/extensions") // Custom methods on objects, to be replaced in 12.0 with Structures.extend
require("./util/db")
const logger = require("./util/logger")

const { Client, Collection } = require("discord.js")
const path = require("path")
const { promisify } = require("util")
const readdir = promisify(require("fs").readdir)
const { prefix, emojiServers } = Object.assign(require("./config")[process.env.NODE_ENV], require("./config")["common"])
const queue = require("p-queue")
const CommandConfig = require("./models/commandConfig")

class UltraRpgBot extends Client {
    constructor(options = {}) {
        super(options)
        this.logger = logger
        this.prefix = prefix
        this.emojiServers = emojiServers
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
        const _command = require(path.join(__dirname, `commands/${cmdFile}`))
        let command = new _command()
        // Check if the command is enabled globally
        if (!command.enabled) return

        command.config = await CommandConfig.getConfigForCommand(this, command)

        if (command.init)
            await command.init(this)

        this.commands.set(command.name, command)
        if (command.aliases) {
            command.aliases.forEach(alias => this.aliases.set(alias, command.name))
        }

        delete require.cache[require.resolve(path.join(__dirname, `commands/${cmdFile}`))]
        return
    }

    async loadEvent(eventFile) {
        const _event = require(path.join(__dirname, `events/${eventFile}`))
        let event = new _event(this)

        if (!event.enabled) return

        if (event.init)
            await event.init(this)

        delete require.cache[require.resolve(path.join(__dirname, `events/${eventFile}`))]
        return this.on(event.name, event.run.bind(event))

    }

    async login() {
        await super.login(process.env.DISCORD_TOKEN)
        this.applicationInfo = await this.fetchApplication()
        // this.applicationInfo.owner.send("URPG Discord Bot started")
        return
    }

    async init() {
        // Load all commands
        let cmds = await readdir(path.join(__dirname, "commands"))
        let events = await readdir(path.join(__dirname, "events"))

        try {
            await Promise.all(cmds.map(c => this.loadCommand(c)))
            this.logger.info({ message: "Command loading complete", key: "init" })
        } catch (e) {
            this.logger.parseError(e, "loadCommand")
        }

        try {
            await Promise.all(events.map(e => this.loadEvent(e)))
            this.logger.info({ message: "Event loading complete", key: "init" })
        } catch (e) {
            this.logger.parseError(e, "loadEvent")
        }

        try {
            await this.login()
            this.logger.info({ message: "Ultra RPG Bot connected to Discord", key: "init" })
        } catch (e) {
            this.logger.parseError(e, "login")
        }

        return
    }
}

const client = new UltraRpgBot({ disableEveryone: true })

client.init()

process.on("uncaughtException", (e) => {
    logger.parseError(e, "uncaughtException")
})

process.on("unhandledRejection", (reason, p) => {
    logger.parseError(reason, "unhandledRejection")
})