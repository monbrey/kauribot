const BaseCommand = require("./base")
const Trainer = require("../models/trainer")

module.exports = class TrainerCommand extends BaseCommand {
    constructor() {
        super({
            name: "inventory",
            category: "Game",
            description: "View the inventory of a URPG Trainer",
            usage: `
!trainer                View your inventory
!trainer <trainer>      View <trainer>'s inventory.
                        Accepts mentions, nicknames and usernames`,
            enabled: true,
            defaultConfig: false
        })
    }

    /**
     * @param {Message} profile - Message containing the embedded profile
     * @param {GuildMember} member - Discord GuildMember object
     * @param {Trainer} trainer - URPG Trainer object
     */
    async inventory(member, trainer) {
        // TODO
        // return RichEmbed.warning("Browsing inventory is not yet implemented.")
    }

    async run(message, args = [], flags = []) {
        let member = args.length === 0 ? message.member : (message.mentions.members.first() ? message.mentions.members.first() : null)

        if (!member) member = message.guild.members.find(m => (
            m.displayName.localeCompare(args[0], "en", {
                sensitivity: "base"
            }) === 0 ||
            m.user.username.localeCompare(args[0], "en", {
                sensitivity: "base"
            }) === 0
        ))
        if (!member) return message.channel.send(`Could not find a Discord user matching ${args[0]}`)

        let trainer = await Trainer.findByDiscordId(member.id)
        if (!trainer) return message.channel.send(`Unable to find a trainer profile for ${member.displayName}`)

        let red = message.client.myEmojis.find(e => e.name === "red")
        let pokeball = message.client.myEmojis.find(e => e.name === "pokeball")

        let profile = await message.channel.send(await this.inventory(member, trainer))
        await profile.react(red)
        await profile.react(pokeball)

        return require("../util/profileLoop")(message, profile, member, trainer)
    }
}