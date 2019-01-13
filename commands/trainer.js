const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Trainer = require("../models/trainer")

module.exports = class TrainerCommand extends BaseCommand {
    constructor() {
        super({
            name: "trainer",
            category: "Game",
            description: "View the profile of a URPG Trainer",
            usage: `
!trainer                View your profile
!trainer <trainer>      View <trainers>'s profile.
                        Accepts mentions, nicknames and usernames`,
            enabled: true,
            defaultConfig: false
        })
    }

    /**
     * TODO: Professions, badges, gyms, FORUM STATS
     * @param {GuildMember} member - Discord GuildMember object
     * @param {Trainer} trainer - URPG Trainer object
     */
    async profile(member, trainer) {
        let starter = await trainer.getPokemon(0)
        let joined = new Date(trainer.createdAt)
        let embed = new RichEmbed()
            .setTitle(`Public profile for ${trainer.username}`)
            .setThumbnail(member.user.avatarURL)
            .addField("Joined on", `${joined.toLocaleDateString("en-AU",{day: "numeric", month:"short", year:"numeric"})}`, true)
            .addField("Starter", starter.nickname || starter.basePokemon.uniqueName, true)
            .addField("Cash", `$${trainer.cash}`, true)
            .addField("Contest Credit", `${trainer.contestCredit} CC`, true)

        return embed
    }

    /**
     * @param {Message} profile - Message containing the embedded profile
     * @param {GuildMember} member - Discord GuildMember object
     * @param {Trainer} trainer - URPG Trainer object
     */
    async editProfile(member, trainer) {
        //TODO
        return new RichEmbed().warning("Profile editing is not yet implemented.")
    }

    async run(message, args = [], flags = []) {
        let member = args.length === 0 ? message.member : (message.mentions.members.first() ? message.mentions.members.first() : null)

        if (!member) member = message.guild.members.find(m => (
            m.displayName.localeCompare(args[0], 'en', {
                sensitivity: "base"
            }) === 0 ||
            m.user.username.localeCompare(args[0], 'en', {
                sensitivity: "base"
            }) === 0
        ))
        if (!member) return message.channel.send(`Could not find a Discord user matching ${args[0]}`)

        let trainer = await Trainer.findByDiscordId(member.id)
        if (!trainer) return message.channel.send(`Unable to find a trainer profile for ${member.displayName}`)

        let pokeball = message.client.myEmojis.find(e => e.name === "pokeball")
        let backpack = message.client.myEmojis.find(e => e.name === "backpack")

        let profile = await message.channel.send(await this.profile(member, trainer))
        await profile.react(pokeball)
        await profile.react(backpack)
        if(message.member === member) await profile.react("📝")

        return require("../util/profileLoop")(message, profile, member, trainer)
    }
}