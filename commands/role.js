const BaseCommand = require("./base")
const { RichEmbed } = require("discord.js")
const Role = require("../models/role")
/*
let addAssigners = async (message, dbRole) => {
    try {
        let assigners = message.guild.roles.filter(r => dbRole.assigners.includes(r.id))
        let assignerNames = assigners.map(r => r.name)
        let embed = new RichEmbed()
            .setTitle(`Configuring role: ${dbRole.name}`)
            .setDescription("Please list any additional roles, by name, who should be able to assign this role with `!role`. Multiple roles can be separated by spaces.\n\nReact with ✅ when all roles have been listed - you will then be able to select roles to remove.\nReact with ❌ to cancel and make no changes.")
            .setAuthor("Professor Kauri", "https://cdn.discordapp.com/embed/avatars/0.png")
            .addField("Roles:", `\`\`\`${assignerNames.join(" ")}\`\`\``)

        let sentMessage = await message.author.send(embed)
        await sentMessage.react("✅")
        await sentMessage.react("❌")

        let responses = sentMessage.channel.createMessageCollector(m => !m.author.bot, {})
        let filter = (reaction, user) => ["✅", "❌"].includes(reaction.emoji.name) && user.id === message.author.id
        let reactions = sentMessage.createReactionCollector(filter, {
            max: 1
        })

        responses.on("collect", async m => {
            console.log("Response collected", m.content)
            let addRoles = m.content.split(" ")
            addRoles.forEach(r => {
                let role = message.guild.roles.find(gr => gr.name === r)
                if (role) {
                    assigners.push(role)
                    assignerNames.push(role.name)
                } else m.user.send(`No role matching ${m.name} was found`)
            })

            embed.fields[0].value = `\`\`\`${assignerNames.join(" ")}\`\`\``
            sentMessage.edit(embed)
        })

        reactions.on("collect", r => {
            console.log("Reaction collected", r.emoji.name)
            if (r.emoji.name === "✅") {
                reactions.stop()
                responses.stop()
                dbRole.assigners = assigners.map(r => r.id)
                await dbRole.save()
            } else {
                reactions.stop()
                responses.stop()
            }
            message.client.logger.info(`Role "${dbRole.roleName}" updated`, {
                key: "role"
            })

            return dbRole
        })

        reactions.on("end")
    } catch (e) {
        return message.client.logger.error(`Error configuring "${dbRole.roleName}": ${e.stack}`, {
            key: "role"
        })
    }
}

let removeAssigners = async (message, dbRole) => {
    try {
        let assigners = message.guild.roles.filter(r => dbRole.assigners.includes(r.id))
        let assignerNames = assigners.map(r => r.name)
        let embed = new RichEmbed()
            .setTitle(`Configuring role: ${dbRole.name}`)
            .setDescription("Please list any roles, by name, who should NOT be able to assign this role with `!role`. Multiple roles can be separated by spaces.\n\nReact with ✅ when all removals have been made.\nReact with ❌ to cancel and make no changes.")
            .setAuthor("Professor Kauri", "https://cdn.discordapp.com/embed/avatars/0.png")
            .addField("Roles:", `\`\`\`${assignerNames.join(" ")}\`\`\``)

        let sentMessage = await message.author.send(embed)
        await sentMessage.react("✅")
        await sentMessage.react("❌")

        let responses = sentMessage.channel.createMessageCollector(m => !m.author.bot, {})
        let filter = (reaction, user) => ["✅", "❌"].includes(reaction.emoji.name) && user.id === message.author.id
        let reactions = message.createReactionCollector(filter, {
            max: 1
        })

        responses.on("collect", async m => {
            let removeRoles = m.content.split(" ")
            removeRoles.forEach(r => {
                let role = message.guild.roles.find(gr => gr.name === r)
                //Check if this role is equal to or higher than their role                        
                if (role) {
                    if (role.comparePositionTo(message.member.highestRole) >= 0)
                        message.channel.send("You cannot remove a role higher than or equal to your highest role.")
                    else {
                        assigners.delete(role.id)
                        assignerNames = assigners.map(r => r.name)
                    }
                } else m.user.send(`No role matching ${m.name} was found`)
            })

            embed.fields[0].value = `\`\`\`${assignerNames.join(" ")}\`\`\``
            message.edit(embed)
        })

        reactions.on("collect", async r => {
            if (r.emoji.name === "✅") {
                reactions.stop()
                responses.stop()
                dbRole.assigners = assigners.map(r => r.id)
                await dbRole.save()
            } else {
                reactions.stop()
                responses.stop()
            }
            message.client.logger.info(`Role "${dbRole.roleName}" updated`, {
                key: "role"
            })

            return dbRole
        })
    } catch (e) {
        return message.client.logger.error(`Error configuring "${dbRole.roleName}": ${e.stack}`, {
            key: "role"
        })
    }
}
*/

module.exports = class RoleCommand extends BaseCommand {
    constructor() {
        super({
            name: "role",
            description: "Assign a role to a user",
            details: "Assign a URPG server role to a user",
            usage: `
!role <role> @user          Assign <role> to @user
!role -r <role> @user       Remove <role> from @user`,
            enabled: false,
            defaultConfig: false
        })
    }

    async init(client) {
        // Get all roles from each guild, check that they exist in db
        client.guilds.tap(async guild => {
            let dbRoles = await Role.getRolesForGuild(guild.id)
            dbRoles = dbRoles.map(r => r.id)
            let missing = guild.roles.filter(r => {
                return dbRoles.indexOf(r.id) === -1 && r.name != "@everyone"
            })
            let removed = dbRoles.filter(r => {
                return !guild.roles.find(gr => gr.id == r)
            })

            // Log each missing role into the database
            missing.forEach(m => {
                /**
                 * Assigners are:
                 *   Roles with ADMINISTRATOR or MANAGE_ROLES
                 *   in a higher position than this role
                 */
                let assigners = guild.roles.filter(r => {
                    return r.hasPermission("MANAGE_ROLES", false, true) && m.comparePositionTo(r) < 0
                }).map(r => r.id)

                Role.create({
                    "id": m.id,
                    "guildId": guild.id,
                    "roleName": m.name,
                    "assigners": [...assigners]
                })
            })

            // Remove each removed role from the database
            removed.forEach(r => r.remove())

        })
        return true
    }

    async addAssigners(message, dbRole) {
        try {
            let assigners = message.guild.roles.filter(r => dbRole.assigners.includes(r.id))
            let assignerNames = assigners.map(r => r.name)
            let embed = new RichEmbed()
                .setTitle(`Configuring role: ${dbRole.roleName}`)
                .setDescription("Please list any additional roles, by name, who should be able to assign this role with `!role`. Multiple roles can be separated by spaces.\n\nReact with ✅ when all roles have been listed - you will then be able to select roles to remove.\nReact with ❌ to cancel and make no changes.")
                .setAuthor("Professor Kauri", "https://cdn.discordapp.com/embed/avatars/0.png")
                .addField("Roles:", `\`\`\`${assignerNames.join(" ")}\`\`\``)

            let sentMessage = await message.author.send(embed)
            await sentMessage.react("✅")
            await sentMessage.react("❌")

            let responses = sentMessage.channel.createMessageCollector(m => !m.author.bot, {})

            responses.on("collect", async m => {
                let addRoles = m.content.split(" ")
                addRoles.forEach(r => {
                    let role = message.guild.roles.find(gr => gr.name === r)
                    if (role) {
                        assigners.set(role.id, role)
                        assignerNames.push(role.name)
                    } else m.channel.send(`No role matching ${r} was found`)
                })
    
                embed.fields[0].value = `\`\`\`${assignerNames.join(" ")}\`\`\``
                sentMessage.edit(embed)
            })

            let filter = (reaction, user) => ["✅", "❌"].includes(reaction.emoji.name) && user.id === message.author.id
            let reactions = await sentMessage.awaitReactions(filter, {
                max: 1
            })

            return reactions
        } catch (e) {
            return message.client.logger.error(`Error configuring "${dbRole.roleName}": ${e.stack}`, {
                key: "role"
            })
        }
    }

    async removeAssigners(message, dbRole) {
        try {
            message.client.setTimeout(() => {
                return console.log("two")
            }, 10000)
        } catch (e) {
            return message.client.logger.error(`Error configuring "${dbRole.roleName}": ${e.stack}`, {
                key: "role"
            })
        }
    }

    async run(message, args = [], flags = []) {
        let roleName = flags.indexOf("c") == 0 ? args.join(" ") : args.slice(0, args.length - 1).join(" ")
        let role = message.guild.roles.find(r => r.name === roleName)
        let dbRole = await Role.getRoleByName(roleName)

        if (!role) return message.channel.send(`${roleName} is not a valid role for this guild.`)
        if (!dbRole) return message.channel.send(`Configuration for ${roleName} not found.`)

        if (flags.includes("c")) {
            // Only allow configuration by users with MANAGE_ROLES or higher
            let permission = message.member.hasPermission("MANAGE_ROLES", false, true, true)
            if (permission) {
                await this.addAssigners(message, dbRole)
                await this.removeAssigners(message, dbRole)
                return
            }
        } else {
            // Do nothing
        }

        /*

        if (flags.includes("c")) {
            //Only allow roles to be configured by users with MANAGE_ROLES or higher
            let permission = message.member.hasPermission("MANAGE_ROLES", false, true, true)
            if (permission) {
                addAssigners(message, dbRole).then((returned) => { console.log(returned); removeAssigners(message, dbRole) })
                return
            }
        } else {
            let assignee = message.mentions.members.first()
            if (!assignee) return message.channel.send("This command must mention a user.")

            //Check that the user is allowed to modify the role
            let permission = message.member.roles.some(role => dbRole.assigners.includes(role.id))
            if (!permission) return message.channel.send(`You do not have permission to assign ${role.name}`)

            if (flags.includes("r")) {
                assignee.removeRole(role.id, `Role applied by ${message.member.nickname || message.author.username}`)
                    .then(() => {
                        message.client.logger.info(`${message.member.nickname || message.author.username} removed ${roleName} from ${assignee.nickname || assignee.user.username}`)
                        return message.channel.send(`Role "${roleName}" removed from ${assignee.nickname || assignee.user.username}`)
                    })
                    .catch((err) => {
                        if (err.message == "Missing Permissions") {
                            return message.channel.send(`This bots role in this server does not allow it to modify ${roleName}.`)
                        } else {
                            return message.channel.send("Unknown error assigning role.")
                        }
                    })
            } else {
                assignee.addRole(role.id, `Role applied by ${message.member.nickname || message.author.username}`)
                    .then(() => {
                        message.channel.send(`Role "${roleName}" given to ${assignee.nickname || assignee.user.username}`)
                        message.client.logger.info(`${message.member.nickname || message.author.username} gave ${roleName} to ${assignee.nickname || assignee.user.username}`)
                    })
                    .catch((err) => {
                        if (err.message == "Missing Permissions") {
                            message.channel.send(`This bots role in this server does not allow it to assign "${roleName}".`)
                        } else {
                            message.channel.send("Unknown error assigning role.")
                            console.error(err.stack)
                        }
                    })
            }
        }*/
    }
}
