const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Trainer = require("../models/trainer")

module.exports = class TrainerCommand extends BaseCommand {
    constructor() {
        super({
            name: "roster",
            category: "Game",
            description: "View the roster of a URPG Trainer",
            usage: `
!trainer                View your roster
!trainer <trainer>      View <trainer>'s roster.
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

    async run(message, args = [], flags = []) {
        let member = args.length === 0 ? message.member : message.mentions.members.first()

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
        let backpack = message.client.myEmojis.find(e => e.name === "backpack")

        let profile = await message.channel.send(await this.roster(member, trainer))
        await profile.react(red)
        await profile.react(backpack)

        return require("../util/profileLoop")(message, profile, member, trainer)
    }
}