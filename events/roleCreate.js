const BaseEvent = require("./base")
const Role = require("../models/role")

module.exports = class RoleCreateEvent extends BaseEvent {
    constructor() {
        super({
            name: "roleCreate",
            enabled: true
        })
    }

    async run(role) {
        if (role.name === "@everyone") return

        let audits = await role.guild.fetchAuditLogs({
            "type": "ROLE_CREATE"
        })
        let corresponding = audits.entries.find(a => a.target.id === role.id)
        let creator = corresponding.executor.id
        let moderators = role.guild.roles.filter(r => r.hasPermission("MANAGE_ROLES", false, true)).map(r => r.id)
        let dbRole = await Role.create({
            id: role.id,
            guildId: role.guild.id,
            roleName: role.name,
            createdBy: creator,
            assigners: [ ...moderators ]
        })
        role.client.logger.info(`New role ${role.name} created`, { key: "roleCreate" })	
        return dbRole
    }
}
