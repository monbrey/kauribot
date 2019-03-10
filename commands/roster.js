const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Trainer = require("../models/trainer")

module.exports = class RosterCommand extends BaseCommand {
    constructor() {
        super({
            name: "roster",
            category: "Game",
            description: "View the roster of a URPG Trainer",
            args: {
                "member": { type: "GuildMember" }
            },
            syntax: "!roster [Trainer]",
            enabled: true,
            defaultConfig: { "guild": false }
        })
    }

    /**
     * @param {Message} profile - Message containing the embedded profile
     * @param {GuildMember} member - Discord GuildMember object
     * @param {Trainer} trainer - URPG Trainer object
     */
    async roster(member, trainer) {
        await trainer.populatePokemon()
        let plist1 = trainer.pokemon.map((p, i) => `${i + 1}. ${p.basePokemon.uniqueName}`)
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

            let red = message.client.emojis.find(e => e.name === "red" && message.client.emojiServers.includes(e.guild))
            let backpack = message.client.emojis.find(e => e.name === "backpack" && message.client.emojiServers.includes(e.guild))

            let profile = await message.channel.send(await this.roster(member, trainer))
            await profile.react(red)
            await profile.react(backpack)

            require("../util/profileLoop")(message, profile, member, trainer)
            return
        } catch (e) {
            message.client.logger.parseError(e, "inventory")
            return message.channel.sendPopup("error", "Error retrieving Trainer inventory")
        }
    }
}