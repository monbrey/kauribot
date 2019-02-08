const mongoose = require("mongoose")
require("./pokemon")
require("./move")

let purchasableSchema = new mongoose.Schema({
    refItem: {
        type: Number,
        required: true,
        refPath: "refType"
    },
    refType: {
        type: String,
        required: true,
        enum: ["Pokemon", "Move"]
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        enum: ["cash", "contestCredit"]
    },
    purchaseKey: {
        type: String,
        required: true
    }
})

purchasableSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "Purchasable",
    startAt: 1
})
purchasableSchema.plugin(require("./plugins/paginator"))

purchasableSchema.statics.getPokemon = async function(_page = 0) {
    return await this.paginate({
        refType: "Pokemon"
    }, {
        populate: {
            path: "refItem",
            select: "displayName dexNumber"
        }
    },
    (a, b) => {
        return a.refItem.dexNumber - b.refItem.dexNumber
    },
    _page,
    12
    )
}

purchasableSchema.statics.getTMs = async function(_page = 1) {
    return await this.paginate({
        refType: "Move",
        purchaseKey: /TM.*/
    }, {
        populate: {
            path: "refItem",
            select: "moveName"
        }
    },
    (a, b) => {
        return a.id - b.id
    },
    _page,
    12
    )
}

purchasableSchema.statics.getTMsByNumbers = async function(_array) {
    let all = await this.find({
        refType: "TM"
    }, null, {
        populate: {
            path: "refItem",
            select: "tmNumber moveTaught",
            populate: {
                path: "moveTaught",
                select: "moveName"
            }
        }
    })

    return all.filter(item => _array.includes(item.refItem.tmNumber))
}

purchasableSchema.statics.getHMs = async function(_page = 1) {
    return await this.paginate({
        refType: "Move",
        purchaseKey: /HM.*/
    }, {
        populate: {
            path: "refItem",
            select: "moveName"
        }
    },
    (a, b) => {
        return a.refItem.hmNumber - b.refItem.hmNumber
    },
    _page,
    12)
}

module.exports = mongoose.model("Purchasable", purchasableSchema)
