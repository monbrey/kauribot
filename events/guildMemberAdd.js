const BaseEvent = require("./base")
const { RichEmbed } = require("discord.js")

module.exports = class GuildMemberAddEvent extends BaseEvent {
    constructor() {
        super({
            name: "guildMemberAdd",
            enabled: true
        })
    }

    async run(member) {
        let starter = member.guild.channels.find(c => c.name === "starter-request") || "#starter!-request"
        let embed = new RichEmbed()
            .setTitle(`Welcome to the Pokemon Ultra RPG, ${member.user.username}!`)
            .setColor(parseInt("00990F", 16))
            .setDescription(
                `__** What is the URPG? **__
The URPG is a multi-faceted game based on the Pokémon saga. You start as a Trainer with a starter Pokémon, working your way to capture new friends and battle for the championship while battling, writing, roleplaying, and making art along the way. We are the longest continually running Pokémon RPG in existence.
        
We have a website with all of our game information at pokemonurpg.com! Our Getting Started page, which has more information about getting started with URPG, is located here: https://pokemonurpg.com/info/general/getting-started/

Make your way over to the URPG Discord server to say hello! There, in the ${starter} channel, you can use the \`!start\` command to choose your starter!`)
            .setThumbnail("https://pokemonurpg.com/img/info/general/urpg-logo-large.png")
            .setAuthor("Professor Kauri", null, "https://pokemonurpg.com/")
            .setFooter("For a list of this bot's commands, type !help")
        
        try {   
            member.client.logger.guildMemberAdd(member)
            return member.send(embed)
        } catch (e) {
            return member.client.logger.error({ code: e.code, stack: e.stack, key: this.name })
        }
    }
}