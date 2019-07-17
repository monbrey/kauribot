const BaseEvent = require("./base");

module.exports = class MessageEvent extends BaseEvent {
    constructor() {
        super({
            name: "message",
            enabled: true
        });
    }

    /**
     * Parses <Message>.content for commands and following args
     * @param {Message} message
     * @returns {String, Array}
     */
    splitArgs({ content, client }) {
        let args = content
            .slice(client.prefix.length)
            .trim()
            .split(/ +/g);
        let command = args.shift().toLowerCase();

        return [command, args];
    }

    /**
     * Splits the args array to separate flags
     * @param {Array} args
     * @returns {Array<Array>}
     */
    splitFlags(args) {
        let filterFunc = x => x.startsWith("-");
        return [args.filter(x => !filterFunc(x)), args.filter(filterFunc).map(x => x.substring(1).toLowerCase())];
    }

    /**
     * Runs commands, updates stats and releases anti-spam
     * @param {BaseCommand} command
     * @param {Message} message
     * @param {Array} args
     * @param {Array} flags
     */
    async runCommand(command, message, args, flags) {
        try {
            command.active.set(message.author);
            await command.run(message, args, flags);
        } catch (e) {
            message.client.logger.parseError(e);
            message.channel.sendPopup(
                "error",
                "An error occured while running the command.\nMonbrey has been notified"
            );
            message.author.send(e.stack, { code: "asciidoc" }).catch(e => {});
        } finally {
            command.active.clear(message.author);
        }
    }

    async run(message) {
        // Ignore messages from bots
        if (message.author.bot) return;

        // Ignore messages that don't start with the prefix
        if (!message.content.startsWith(message.client.prefix)) return;

        // Log the message - refer to util/logger.js to see what is logged
        message.client.logger.message(message);

        // Split the arguments
        let [carg, argArray] = this.splitArgs(message);

        // Get the matching command class
        const command = message.client.commands.get(carg);
        if (!command) return;

        // Add a usage count to the command
        try {
            await command.addStat(message.guild.id, "received");
        } catch (e) {
            message.client.logger.parseError(e, "commandStats");
        }

        // Anti-spam protection
        const active = command.active.check(message.author);
        if (active) {
            if (active.timestamp < Date.now() - 5000)
                message.channel.sendPopup(
                    "warn",
                    `You already have an active ${message.client.prefix}${command.name} command.`
                );

            active.timestamp = Date.now();
            return;
        }

        // Split the flags out of the args
        let [args, flags] = this.splitFlags(argArray);

        // Intercept help flags and stop execution, as they aren't command-specific
        if (flags.includes("h")) {
            return command.getHelp(message.channel);
        }

        // Type-strict, positional argument parsing - still needs some work
        try {
            args = await command.parseArgTypes(message, args);
            if (args === false) return;
        } catch (e) {
            message.client.logger.parseError(e, "parseArgs");
            return message.channel.sendPopup("error", "Exception thrown while parsing arguments");
        }

        // Override if owner, otherwise ignore command if it requires owner
        if (message.isFromOwner) {
            return this.runCommand(command, message, args, flags);
        }
        if (command.config.ownerOnly) return;

        // Check if a guild-only command is being run in DM
        if (command.guildOnly && message.channel.type == "dm")
            return message.channel.sendPopup("warn", `${message.client.prefix}${command.name} is not available in DMs`);

        // Get the settings at the channel, guild and default levels
        const enabled = command.enabledIn(message.channel);

        // Check possible levels for the command to be disabled
        // No overrides, default off
        if (enabled.c === undefined && enabled.g === undefined && enabled.d === false)
            return message.channel.sendPopup(
                "warn",
                `${message.client.prefix}${
                    command.name
                } has not been configured for use in this server, and is off by default`
            );
        // Turned off in the guild with no channel override
        else if (enabled.c === undefined && enabled.g === false)
            return message.channel.sendPopup(
                "warn",
                `${message.client.prefix}${command.name} has been disabled on this server`
            );
        // Turned off in the channel
        else if (enabled.c === false)
            return message.channel.sendPopup(
                "warn",
                `${message.client.prefix}${command.name} has been disabled in this channel`
            );

        // Check if the command requires Discord Permissions or Roles, if it's being run in a Guild
        const authorised =
            message.guild === undefined ||
            command.permissionsFor(await message.guild.fetchMember(message.author), message.channel);

        if (!authorised)
            return message.channel.sendPopup(
                "warn",
                `You do not have the required permissions to use ${message.client.prefix}${command.name} here`
            );

        return this.runCommand(command, message, args, flags);
    }
};
