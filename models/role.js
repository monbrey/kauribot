const mongoose = require("mongoose")

let roleSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true,
    },
    roleName: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: false
    },
    assigners: {
        type: [String],
        ref: "Role",
        required: false
    },
    configured: {
        type: Boolean,
        required: true,
        default: false
    }
})

roleSchema.statics.getRoleByName = async function(roleName) {
    return await this.findOne({"roleName": roleName})
}

roleSchema.statics.getRolesForGuild = async function(guildId) {
    return await this.find({"guildId": guildId})
}

module.exports = mongoose.model("Role", roleSchema)