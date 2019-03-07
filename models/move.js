const mongoose = require("mongoose")
const { RichEmbed } = require("discord.js")
const Color = require("./color")

let moveSchema = new mongoose.Schema({
    moveName: {
        type: String,
        required: true
    },
    moveType: {
        type: String,
        reuqired: true
    },
    desc: {
        type: String
    },
    power: {
        type: Number
    },
    accuracy: {
        type: Number
    },
    pp: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    contact: {
        type: Boolean
    },
    sheerForce: {
        type: Boolean
    },
    substitute: {
        type: Boolean
    },
    snatch: {
        type: Boolean
    },
    magicCoat: {
        type: Boolean
    },
    list: {
        type: Array
    },
    additional: {
        type: String
    },
    note: {
        type: String
    },
    zmove: {
        type: String
    },
    metronome: {
        type: Boolean,
        default: true
    },
    tm: {
        number: {
            type: Number
        },
        martPrice: {
            pokemart: {
                type: Number
            },
            berryStore: {
                type: Number
            },
        },
    },
    hm: {
        number: {
            type: Number
        },
        martPrice: {
            pokemart: {
                type: Number
            },
            berryStore: {
                type: Number
            },
        },
    }
}, {
    collection: "moves"
})

moveSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "Move",
    startAt: 1
})


moveSchema.statics.findOneExact = async function(moveName, query = {}) {
    return await this.findOne(Object.assign(query, {
        "moveName": new RegExp(`^${moveName}$`, "i")
    }))
}

moveSchema.statics.findExact = function(moveNames, query = {}) {
    moveNames = moveNames.map(name => new RegExp(`^${name}$`, "i"))
    return this.find(Object.assign(query, {
        "moveName": {
            $in: moveNames
        }
    }))
}

moveSchema.statics.findPartial = async function(moveName) {
    return await this.find({
        "moveName": new RegExp(moveName, "i")
    })
}

moveSchema.statics.metronome = async function() {
    let move = await this.aggregate([
        { $match: { metronome: true } },
        { $sample: { size: 1 }}
    ])

    return new this(move[0])
}

moveSchema.methods.info = async function() {
    let embed = new RichEmbed()
        .setTitle(this.moveName)
        .setDescription(`
| Type: ${this.moveType} | Power: ${this.power ? this.power : "-"} | Accuracy: ${this.accuracy ? this.accuracy : "-"} | PP: ${this.pp} | Category: ${this.category} |

${this.desc} ${this.contact ? "Makes contact. " : ""}${this.sheerForce ? "Boosted by Sheer Force. " : ""}${this.substitute ? "Bypasses Substitute. " : ""}${this.snatch ? "Can be Snatched. " : ""}${this.magicCoat ? "Can be reflected by Magic Coat. " : ""}`)
        .setFooter(this.note || "")
        .setColor(parseInt(await Color.getColorForType(this.moveType.toLowerCase()), 16))

    if (this.additional) embed.addField("Additional note", this.additional)
    if (this.list && this.list.length != 0) embed.addField("Helpful data", this.list.join("\n"))
    if (this.tm) embed.addField("TM", `Taught by TM${this.tm.number.toString().padStart(2,0)} ($${this.tm.martPrice.pokemart.toLocaleString()})`)
    if (this.zmove) embed.addField("Z-Move", this.zmove)

    return embed
}

module.exports = mongoose.model("Move", moveSchema)
