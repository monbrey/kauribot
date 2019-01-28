const BaseEvent = require("./base")
const Role = require("../models/role")

module.exports = class RoleDeleteEvent extends BaseEvent {
    constructor() {
        super({
            name: "roleDelete",
            enabled: false
        })
    }

    async run(role) {
        let deleted = Role.deleteOne({ id: role.id })
        if (deleted) role.client.logger.info(`Deleted role ${deleted.name} from database`, { key: "roleDelete" })
        else role.client.logger.warn(`Unable to delete ${role.name} - not found`, { key: "roleDelete" })
        
        return deleted
    }
}