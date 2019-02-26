const { Schema, model } = require("mongoose")

const commandStatsSchema = new Schema({
    command: {
        type: String,
        required: true,
    },
    guild: {
        type: String,
        required: true
    },
    counts: {
        received: [Number],
        executed: [Number],
        succeeded: [Number],
        _id: false
    }
})

commandStatsSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "CommandStats",
    startAt: 1
})

commandStatsSchema.statics.addReceived = async function(command, guild) {
    // if (process.env.NODE_ENV !== "production") return

    const query = { "command": command, "guild": guild }
    const stat = await this.findOne(query) || await this.create(query)
    stat.counts.received.push(Date.now())
    stat.save()
}

commandStatsSchema.statics.addExecuted = async function(command, guild) {
    // if (process.env.NODE_ENV !== "production") return

    const query = { "command": command, "guild": guild }
    const stat = await this.findOne(query) || await this.create(query)
    stat.counts.executed.push(Date.now())
    stat.save()
}

commandStatsSchema.statics.addSucceeded = async function(command, guild) {
    // if (process.env.NODE_ENV !== "production") return

    const query = { "command": command, "guild": guild }
    const stat = await this.findOne(query) || await this.create(query)
    stat.counts.succeeded.push(Date.now())
    stat.save()
}

commandStatsSchema.statics.getCount = async function(command, guild) {
    const stat = await this.findOne({ "command": command, "guild": guild })
    if(!stat) return null
    return {
        received: stat.counts.received.length,
        executed: stat.counts.executed.length,
        succeeded: stat.counts.succeeded.length
    }
}

module.exports = model("CommandStats", commandStatsSchema)