const BaseEvent = require("./base")
const { RichEmbed } = require("discord.js")
const Role = require("../models/role")

module.exports = class RoleUpdateEvent extends BaseEvent {
    constructor() {
        super({
            name: "roleUpdate",
            enabled: false
        })
    }

    async updateRole(oldRole, newRole) {
        let dbRole
        try {
            dbRole = await Role.findOne({
                id: oldRole.id
            })
            if (!dbRole) {
                oldRole.client.logger.warn(`No role with name "${oldRole.name}" (${oldRole.id}) found in the database`, {
                    key: "roleUpdate"
                })
                return false
            }
        } catch (e) {
            oldRole.client.logger.error({ code: e.code, stack: e.stack, key: this.name })
        }

        dbRole.roleName = newRole.name
        dbRole.assigners.forEach((item, index, array) => {
            if(oldRole.guild.roles.get(item).comparePositionTo(newRole) > 0)
                array.splice(index, 1)
        })
        try {
            return await dbRole.save()
        } catch (e) {
            oldRole.client.logger.error({ code: e.code, stack: e.stack, key: this.name })
        }
    }

    async configureRole(newRole, dbRole) {
        try {
            let creator = await newRole.client.users.get(dbRole.createdBy)
            let embed = new RichEmbed()
                .setTitle(`You've just created a new role: ${newRole.name}`)
                .setDescription("Please list all other roles, by name, who should be able to assign this role with `!role`. Multiple roles can be separated by spaces.\n\nThe moderator role is added by default.\n\nReact with ✅ when all roles have been listed.\nReact with ❌ to cancel.")
                .setAuthor("Professor Kauri", "https://cdn.discordapp.com/embed/avatars/0.png")
                .addField("Roles:", "```moderator```")

            let message = await creator.send(embed)
            await message.react("✅")
            await message.react("❌")

            let assigners = ["moderator"]
            let assignIDs = []

            let responses = message.channel.createMessageCollector(m => !m.author.bot, {})
            let filter = (reaction, user) => ["✅", "❌"].includes(reaction.emoji.name) && user.id === creator.id
            let reactions = message.createReactionCollector(filter, {
                max: 1
            })

            responses.on("collect", async m => {
                let addRoles = m.content.split(" ")
                addRoles.forEach(r => {
                    let id = newRole.guild.roles.find(gr => gr.name === r)
                    if (id) {
                        assigners.push(r)
                        assignIDs.push(id)
                    } else m.user.send(`No role matching ${m.name} was found`)
                })

                embed.fields[0].value = `\`\`\`${assigners.join(" ")}\`\`\``
                message.edit(embed)
            })

            reactions.on("collect", async r => {
                if (r.emoji.name === "✅") {
                    reactions.stop()
                    responses.stop()
                    dbRole = await Role.update({
                        "id": newRole.id
                    }, {
                        "assigners": [...dbRole.assigners, ...assignIDs],
                        "configured": true
                    }, {
                        upsert: true,
                        setDefaultsOnInsert: true
                    })
                } else {
                    reactions.stop()
                    responses.stop()
                    dbRole = await Role.update({
                        "id": newRole.id
                    }, {
                        "configured": true
                    }, {
                        upsert: true,
                        setDefaultsOnInsert: true
                    })
                }
                newRole.client.logger.info(`Role "${newRole.name}" updated`, {
                    key: "roleUpdate"
                })

                return dbRole
            })
        } catch (e) {
            newRole.client.logger.error({ code: e.code, stack: e.stack, key: this.name })
        }
    }

    async run(oldRole, newRole) {
        // URPG, non-everyone roles only 
        //if (oldRole.guild.id !== "135864828240592896") return false
        if (oldRole.name === "@everyone" || newRole.name === "@everyone") return false
        // Discord sends an update event on every role when one is saved
        // Do a check that the roles actually have a difference in name or position
        if (oldRole.name === newRole.name || oldRole.comparePositionTo(newRole) !== 0) return

        let dbRole = await module.exports.updateRole(oldRole, newRole)
        // If this role is tagged as unconfigured, perform setup
        if (!dbRole.configured) {
            return await this.configureRole(newRole, dbRole)
        } else {
            newRole.client.logger.info(`Role "${newRole.name}" updated`, {
                key: "roleUpdate"
            })
            return dbRole
        }
    }
}
