const BaseEvent = require("./base")

module.exports = class MessageEvent extends BaseEvent {
    constructor() {
        super({
            name: "message",
            enabled: true
        })
    }

    async run(message) {
        // Ignore messages from bots / don't start with the prefix
        if (message.author.bot) return
        if (!message.content.startsWith(message.client.prefix)) return

        message.location = message.guild ? `${message.guild.name} #${message.channel.name}` : "DM"
        message.client.logger.info(`${message.author.username} in ${message.location}: ${message.content}`, {
            key: "message"
        })

        //Before we get args, testing a method which would parse CSV as a single arg
        let content = message.content.replace(/, +/g, ",")
        let _args = content.slice(message.client.prefix.length).trim().split(/ +/g)
        let carg = _args.shift().toLowerCase()

        let command = message.client.commands.get(carg) || message.client.commands.get(message.client.aliases.get(carg))
        if (!command) return

        let [flags, args] = await super.argsplit(_args)

        //Check that the command is enabled in this server/channel, let owner run regardless
        let enabled = message.author === message.client.applicationInfo.owner || (
            command.config.channels.has(message.channel.id) ? //If channel config
                command.config.channels.get(message.channel.id) : //Get channel config
                command.config.guilds.get(message.guild.id) //Else try guild config
        )

        //Intercept help flags as they aren't command-specific
        if(flags.includes("h")) return command.getHelp(message.channel)

        //Check if a guild-only command is being run in DM
        if (command.guildOnly && message.channel.type == "dm") return

        //Check if its an owner-only command
        if (command.requiresOwner && message.author != message.client.applicationInfo.owner) return

        //Check that the command should be run, allow owner to run any
        let permissions = message.author === message.client.applicationInfo.owner || (
            command.requiresPermission ?
                message.channel.memberPermissions(message.member).has(command.requiresPermission, true) :
                true
        )

        if (permissions && enabled)
            command.run(message, args, flags)
        else if (enabled === false)
            message.channel.send("This command has been disabled.")
        else if (typeof enabled === "undefined")
            message.channel.send("This command has not been configured in this server.")
        else if (!permissions)
            message.channel.send("You don't have the required server/channel permissions to use this command.")
    }
}
