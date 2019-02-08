const mongoose = require("mongoose")
const {	RichEmbed } = require("discord.js")

var itemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true
    },
    desc: {
        type: String
    },
    category: [{
        type: String
    }],
    martPrice: {
        pokemart: {
            type: Number
        },
        berryStore: {
            type: Number
        },
    },
})

itemSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "Item",
    startAt: 1
})

itemSchema.virtual("priceString").get(() => {
    if(this.martPrice.pokemart && this.martPrice.berryStore)
        return `$${this.martPrice.pokemart.toLocaleString()} | ${this.martPrice.berryStore.toLocaleString()} CC`
    return this.martPrice.pokemart ? 
        `$${this.martPrice.pokemart.toLocaleString()}` : 
        `${this.martPrice.berryStore.toLocaleString()} CC`
})

itemSchema.statics.findExact = function(itemNames, query = {}) {
    itemNames = itemNames.map(name => new RegExp(`^${name}$`, "i"))
    return this.find(Object.assign(query, {
        "itemName": {
            $in: itemNames
        }
    }))
}

itemSchema.statics.findPartial = function(itemName) {
    return this.find({
        "itemName": new RegExp(itemName, "i")
    })
}

itemSchema.methods.info = async function() {
    let embed = new RichEmbed()
        .setTitle(this.itemName)
        .setDescription(this.desc)
    
    if(this.price) embed.addField("Mart Price", `$${this.price}`)

    return embed
}

module.exports = mongoose.model("Item", itemSchema)