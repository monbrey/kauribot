#!/usr/bin/node

require("./util/discordExtensions") //Custom methods on Discord objects, to be replaced in 12.0 with Structures.extend
require("dotenv").config({ path: "variables.env" })
require("./util/db")

const { Client, Collection } = require("discord.js")
const path = require("path")
const { promisify } = require("util")
const readdir = promisify(require("fs").readdir)
const config = Object.assign(require("./config")[process.env.NODE_ENV], require("./config")["common"])
const queue = require("p-queue")

const CommandConfig = require("./models/commandConfig")
const LogConfig = require("./models/logConfig")
const StarboardConfig = require("./models/starboardConfig")

class UltraRpgBot extends Client {
    constructor(options = {}) {
        super(options)
        this.logger = require("./util/logger")
        this.config = config
        this.prefix = config.prefix
        this.commands = new Collection()
        this.aliases = new Collection()
        this.activeCommands = new Collection()
        this.emojiCharacters = require("./util/emojiCharacters")

        //Queues for some events
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
            //Check if the command is enabled globally
            if (!command.enabled) return

            await command.setConfig(await CommandConfig.getConfigForCommand(this, command))
            //Check if the command has an init method
            if (command.init)
                await command.init(this)

            this.commands.set(command.name, command)
            if (command.aliases) {
                command.aliases.forEach(alias => this.aliases.set(alias, command.name))
            }
            return
        } catch (e) {
            return this.logger.error(`${cmdFile} failed to load\n${e.stack}`)
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
            return this.logger.error(`${eventFile} failed to load\n${e.stack}`)
        } finally {
            delete require.cache[require.resolve(path.join(__dirname, `events/${eventFile}`))]
        }
    }

    async login() {
        await super.login(process.env.DISCORD_TOKEN)
        this.applicationInfo = await this.fetchApplication()
        //this.applicationInfo.owner.send("URPG Discord Bot started")
        return
    }

    async init() {
        try {
            await this.login()
            this.logger.info("Ultra RPG Bot connected to Discord")
        } catch (e) {
            this.logger.error(`Login failed: ${e.message}`)
        }

        //Load all commands
        try {
            let cmds = await readdir(path.join(__dirname, "commands"))

            await cmds.reduce(async (previousPromise, next) => {
                await previousPromise
                return this.loadCommand(next)
            }, Promise.resolve())

            this.logger.info("Command loading complete")
        } catch (e) {
            this.logger.error(`${e.message}`)
        }

        //Load all events
        try {
            let events = await readdir(path.join(__dirname, "events"))

            await events.reduce(async (previousPromise, next) => {
                await previousPromise
                return this.loadEvent(next)
            }, Promise.resolve())

            this.logger.info("Event loading complete")
        } catch (e) {
            this.logger.error(`${e.message}`)
        }

        //Run per-guild configuration
        this.guilds.forEach(async guild => {
            //Set my nickname
            try {
                await guild.me.setNickname(null)
            } catch (e) {
                this.logger.warn(`${guild.name}: ${e.message}`)
            }

            guild.logChannel = guild.channels.get(await LogConfig.getLogChannel(guild.id))
            guild.starboard = await StarboardConfig.getConfigForGuild(guild.id)
        })

        this.myEmojis = this.emojis.filter(e => config.emojiServers.includes(e.guild.id))

        return
    }
}

const client = new UltraRpgBot({
    disableEveryone: true
})

try {
    client.init()
} catch (e) {
    client.logger.error(`Unable to initialise bot. ${e}`)
}

process.on("unhandledRejection", (reason) => {
    client.logger.error(`Unhandled Promise Rejection: ${reason.stack}`)
})