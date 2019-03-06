const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Trainer = require("../models/trainer")

module.exports = class TrainerCommand extends BaseCommand {
    constructor() {
        super({
            name: "trainer",
            category: "Game",
            description: "View the profile of a URPG Trainer",
            args: {
                "member": { type: "GuildMember" }
            },
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
            .addField("Joined on", `${joined.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`, true)
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
        // TODO
        // return RichEmbed.warning("Profile editing is not yet implemented.")
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
            if (!trainer) return message.channel.sendPopup("warn", `Unable to find a trainer profile for ${member.displayName}`)     

            let pokeball = message.client.emojis.find(e => e.name === "pokeball" && message.client.emojiServers.includes(e.guild.id))
            let backpack = message.client.emojis.find(e => e.name === "backpack" && message.client.emojiServers.includes(e.guild.id))

            let profile = await message.channel.send(await this.profile(member, trainer))
            await profile.react(pokeball)
            await profile.react(backpack)
            if (message.member === member) await profile.react("📝")

            require("../util/profileLoop")(message, profile, member, trainer)
            return
        } catch (e) {
            message.client.logger.parseError(e, "trainer")
            return message.channel.sendPopup("error", "Error retrieving Trainer profile")
        }
    }
}