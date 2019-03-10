const BaseCommand = require("./base")
const Trainer = require("../models/trainer")

module.exports = class TrainerCommand extends BaseCommand {
    constructor() {
        super({
            name: "inventory",
            category: "Game",
            description: "View the inventory of a URPG Trainer",
            args: {
                "member": { type: "GuildMember" }
            },
            syntax: "!trainer [Trainer]",
            enabled: true,
            defaultConfig: { "guild": false }
        })
    }

    /**
     * @param {Message} profile - Message containing the embedded profile
     * @param {GuildMember} member - Discord GuildMember object
     * @param {Trainer} trainer - URPG Trainer object
     */
    async inventory(member, trainer) {
        // TODO
        // return member.sendPopup("Browsing inventory is not yet implemented.")
    }

    async run(message, args = [], flags = []) {
        const member = args.get("member") || message.member

        if (member.constructor.name !== "GuildMember") message.guild.members.find(m => (
            m.displayName.localeCompare(member, "en", {
                sensitivity: "base"
            }) === 0 ||
            m.user.username.localeCompare(member, "en", {
                sensitivity: "base"
            }) === 0
        ))
        if (!member) return message.channel.sendPopup("warn", `Could not find a Discord user matching ${member}`)

        try {
            let trainer = await Trainer.findById(member.id)
            if (!trainer) return message.channel.send(`Unable to find a trainer profile for ${member.displayName}`)

            let red = message.client.emojis.find(e => e.name === "red" && message.client.emojiServers.includes(e.guild))
            let pokeball = message.client.emojis.find(e => e.name === "pokeball" && message.client.emojiServers.includes(e.guild))

            let profile = await message.channel.send(await this.inventory(member, trainer))
            await profile.react(red)
            await profile.react(pokeball)

            return require("../util/profileLoop")(message, profile, member, trainer)
        } catch (e) { 
            message.client.logger.parseError(e, "inventory")
            return message.channel.sendPopup("error", "Error retrieving Trainer inventory")
        }

    }
}