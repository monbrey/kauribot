const { Schema, model } = require("mongoose")
const Trainer = require("./trainer")

const undergroundSchema = new Schema({
    matrix: [{
        maxIndex: {
            type: Number,
            required: true
        },
        catName: {
            type: String
        },
        item: {
            type: Schema.Types.Mixed,
            required: true,
            ref: "Item"
        },
        function: {
            type: String
        },
        _id: false
    }]
})

undergroundSchema.statics.getMatrix = async function() {
    const matrix = await this.findOne({}).select("matrix -_id").lean()
    return matrix.matrix
}

module.exports.Underground = model("Underground", undergroundSchema)

const undergroundDigsSchema = new Schema({
    trainer: {
        type: String,
        ref: Trainer,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    result: {
        type: String
    }
})

undergroundDigsSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "UndergroundDigs",
    startAt: 1,
})

undergroundDigsSchema.statics.canDig = async function(id) {
    const m = new Date(Date.now()).getMonth()
    const digs = await this.countDocuments({ "trainer": id, month: m })
    const pendingDigs = await Pending.countDocuments({ "trainer": id, month: m })
    return digs + pendingDigs < 2
}

undergroundDigsSchema.statics.addDig = function(trainerID, resultID) {
    this.create({
        trainer: trainerID,
        month: new Date(Date.now()).getMonth(),
        result: resultID
    })
}

module.exports.Digs = model("UndergroundDigs", undergroundDigsSchema)

const undergroundPendingSchema = new Schema({
    message: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        required: true
    },
    item: {
        type: Schema.Types.Mixed,
        required: true,
        ref: "Item"
    },
    trainer: {
        type: String,
        required: true
    },
    month: {
        type: String,
        required: true
    },
    rolls: {
        type: Array,
        required: true
    }
})

undergroundPendingSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "UndergroundPending",
    startAt: 1,
})

const Pending = module.exports.Pending = model("UndergroundPending", undergroundPendingSchema)