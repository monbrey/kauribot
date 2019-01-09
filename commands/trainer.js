const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Trainer = require("../models/trainer")

module.exports = class TrainerCommand extends BaseCommand {
    constructor() {
        super({
            name: "trainer",
            aliases: ["roster", "inventory"],
            description: "View profiles of URPG Trainers",
            usage: `
!trainer                View your profile
!trainer <trainer>      View <trainer's> profile.
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
    async roster(member, trainer) {
        await trainer.populatePokemon()
        let plist1 = trainer.pokemon.map((p, i) => `${i+1}. ${p.basePokemon.uniqueName}`)
        let split = Math.ceil(trainer.pokemon.length / 2)
        let plist2 = plist1.splice(split)

        let embed = new RichEmbed()
            .setTitle(`Pokemon roster for ${trainer.username}`)
            .setThumbnail(member.user.avatarURL)
            .addField("\u200B", plist1.join("\n"), true)

        if (plist2.length > 0)
            embed.addField("\u200B", plist2.join("\n"), true)

        return embed
    }

    /**
     * @param {Message} profile - Message containing the embedded profile
     * @param {GuildMember} member - Discord GuildMember object
     * @param {Trainer} trainer - URPG Trainer object
     */
    async inventory(member, trainer) {
        //TODO
        return new RichEmbed().warning("Browsing inventory is not yet implemented.")
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

    async run(message, args = [], flags = [], carg = "trainer") {
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

        let profileLoop = async (message, profile, member, trainer, currentPage) => {
            await profile.clearReactions()

            switch (currentPage) {
                case "pokeball":
                    profile = await profile.edit(await this.roster(member, trainer))
                    await profile.react(profile.client.myEmojis.find(e => e.name === "red"))
                    break
                case "backpack":
                    profile = await profile.edit(await this.inventory(member, trainer))
                    await profile.react(profile.client.myEmojis.find(e => e.name === "red"))
                    break
                case "red":
                    profile = await profile.edit(await this.profile(member, trainer))
                    await profile.react(profile.client.myEmojis.find(e => e.name === "pokeball"))
                    await profile.react(profile.client.myEmojis.find(e => e.name === "backpack"))
                    if (message.member === member) await profile.react("📝")
                    break
                case "📝":
                    profile = await profile.edit(await this.editProfile(member, trainer))
                    await profile.react(profile.client.myEmojis.find(e => e.name === "red"))
                    break
            }

            let filter = (reaction, user) => user.id === message.author.id

            let reactions = await profile.awaitReactions(filter, {
                max: 1,
                time: 30000
            })

            if (!reactions.first()) return await profile.clearReactions()

            return profileLoop(message, profile, member, trainer, reactions.first().emoji.name)
        }

        let currentPage
        switch (carg) {
            case "trainer":
                currentPage = "red"
                break
            case "roster":
                currentPage = "pokeball"
                break
            case "inventory":
                currentPage = "backpack"
                break
        }

        let profile = await message.channel.send(new RichEmbed({ title:"Generating Profile..." }))

        return profileLoop(message, profile, member, trainer, currentPage)
    }
}
