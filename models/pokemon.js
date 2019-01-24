const mongoose = require("mongoose")
const { RichEmbed, Collection } = require("discord.js")
const Color = require("./color")
const { oneLine, stripIndent } = require("common-tags")
require("./mega")

var pokemonSchema = new mongoose.Schema({
    dexNumber: {
        type: Number,
        required: true
    },
    speciesName: {
        type: String,
        required: true
    },
    uniqueName: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    spriteCode: {
        type: String
    },
    type1: {
        type: String,
        required: true
    },
    type2: {
        type: String
    },
    ability: [{
        type: Number,
        ref: "Ability"
    }],
    hiddenAbility: [{
        type: Number,
        ref: "Ability"
    }],
    moves: {
        level: [{
            type: Number,
            ref: "Move"
        }],
        tm: [{
            type: Number,
            ref: "Move"
        }],
        hm: [{
            type: Number,
            ref: "Move"
        }],
        bm: [{
            type: Number,
            ref: "Move"
        }],
        mt: [{
            type: Number,
            ref: "Move"
        }],
        sm: [{
            type: Number,
            ref: "Move"
        }],
    },
    evolution: [{
        pokemon: {
            type: Number,
            ref: "Pokemon"
        },
        exp: {
            type: Number
        },
        requires: {
            type: Number,
            ref: "Item"
        },
        trade: {
            type: Boolean
        },
        _id: false
    }],
    mega: [{
        pokemon: {
            type: Number,
            ref: "Mega"
        },
        requires: {
            type: Number,
            ref: "Item"
        },
        _id: false
    }],
    primal: [{
        pokemon: {
            type: Number,
            ref: "Mega"
        },
        requires: {
            type: Number,
            ref: "Item"
        },
        _id: false
    }],
    stats: {
        hp: {
            type: Number,
            required: true
        },
        attack: {
            type: Number,
            required: true
        },
        defence: {
            type: Number,
            required: true
        },
        specialAttack: {
            type: Number,
            required: true
        },
        specialDefence: {
            type: Number,
            required: true
        },
        speed: {
            type: Number,
            required: true
        },
    },
    height: {
        type: Number
    },
    weight: {
        type: Number
    },
    gender: {
        male: {
            type: Boolean
        },
        female: {
            type: Boolean
        },
    },
    martPrice: {
        pokemart: {
            type: Number
        },
        berryStore: {
            type: Number
        },
    },
    rank: {
        story: {
            type: String
        },
        art: {
            type: String
        },
        park: {
            type: String
        },
    },
    parkLocation: {
        type: String
    },
    starterEligible: {
        type: Boolean,
        required: true
    }
}, {
    collection: "pokemon"
})

pokemonSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "Pokemon",
    startAt: 1
})
pokemonSchema.plugin(require("./plugins/paginator"))

pokemonSchema.virtual("priceString").get(() => {
    if(this.martPrice.pokemart && this.martPrice.berryStore)
        return `$${this.martPrice.pokemart.toLocaleString()} | ${this.martPrice.berryStore.toLocaleString()} CC`
    return this.martPrice.pokemart ? 
        `$${this.martPrice.pokemart.toLocaleString()}` : 
        `${this.martPrice.berryStore.toLocaleString()} CC`
})

pokemonSchema.statics.getMartPokemon = async function(_page = 0) {
    return await this.paginate({
        "martPrice.pokemart": {
            $not: {
                $eq: null
            }
        }
    }, {
        select: "dexNumber uniqueName martPrice.pokemart"
    },
    (a, b) => {
        return a.dexNumber - b.dexNumber
    },
    _page,
    12
    )
}

pokemonSchema.statics.findExact = function(uniqueNames, query = {}) {
    uniqueNames = uniqueNames.map(name => new RegExp(`^${name}$`, "i"))
    return this.find(Object.assign(query, {
        "uniqueName": {
            $in: uniqueNames
        }
    }))
}

pokemonSchema.statics.findOneExact = function(uniqueName, query = {}) {
    return this.findOne(Object.assign(query, {
        "uniqueName": new RegExp(`^${uniqueName}$`, "i")
    }))
}

pokemonSchema.statics.findPartial = function(uniqueName, query = {}) {
    return this.find(Object.assign(query, {
        "uniqueName": new RegExp(uniqueName, "i")
    }))
}

pokemonSchema.methods.dex = async function() {
    let embed = new RichEmbed()
        .setTitle(`URPG Ultradex - ${this.displayName} (#${new String(this.dexNumber).padStart(3,"0")})`)
        .setColor(await Color.getColorForType(this.type1.toLowerCase()))
        .setImage(`https://pokemonurpg.com/img/models/${this.dexNumber}${this.spriteCode?`-${this.spriteCode}`:""}.gif`)
        .addField(`${this.type2 ? "Types" : "Type" }`, `${this.type1}${this.type2 ? `\n${this.type2}` : ""}`, true)
        .setFooter("Reactions | [M] View Moves ")

    await this.populate("ability").execPopulate()
    embed.addField("Ability", `${this.ability.map(a => a.abilityName).join("\n")}`, true)

    if (this.hiddenAbility.length > 0) {
        await this.populate("hiddenAbility").execPopulate()
        embed.addField("Hidden Ability", `${this.hiddenAbility.map(a => a.abilityName).join("\n")}`, true)
    } else embed.addBlankField()

    embed.addField(`Gender${this.gender.male && this.gender.female ? "s" : ""}`,
        this.gender.male ? (this.gender.female ? "Male\nFemale" : "Male") : (this.gender.female ? "Female" : "Genderless"),
        true)
        .addField("Height", `${this.height}m`, true)
        .addField("Weight", `${this.weight}kg`, true)

    let ranks = 0
    if (this.rank.story) {
        embed.addField("Story Rank", this.rank.story, true)
        ranks++
    }
    if (this.rank.art) {
        embed.addField("Art Rank", this.rank.art, true)
        ranks++
    }
    if (this.rank.park && this.parkLocation) {
        embed.addField("Park Rank", `${this.rank.park}\n(${this.parkLocation})`, true)
        ranks++
    }

    for (ranks; ranks > 0 && ranks < 3; ranks++)
        embed.addBlankField()

    if (this.martPrice.pokemart)
        embed.addField("Pokemart", `$${this.martPrice.pokemart.toLocaleString()}`, true)
    if (this.martPrice.berryStore)
        embed.addField("Berry Store", `${this.martPrice.berryStore.toLocaleString()} CC`, true)

    embed.addField("Stats", `\`\`\`${stripIndent`
        HP  | ATT | DEF | SP.A | SP.D | SPE
        ${oneLine`
            ${new String(this.stats.hp).padEnd(3," ")} | ${new String(this.stats.attack).padEnd(3," ")} |
            ${new String(this.stats.defence).padEnd(3," ")} | ${new String(this.stats.specialAttack).padEnd(4," ")} |
            ${new String(this.stats.specialDefence).padEnd(4," ")} | ${this.stats.speed}
        `}
    `}\`\`\``)

    if (this.mega.length == 1) embed.footer.text += "| [X] View Mega form"
    if (this.mega.length == 2) embed.footer.text += "| [X] View X Mega form | [Y] View Y Mega Form"
    if (this.primal.length == 1) embed.footer.text += "| [🇵] View Primal form"

    return embed
}

pokemonSchema.methods.learnset = async function() {
    await this.populate("moves.level moves.tm moves.hm moves.bm moves.mt moves.sm").execPopulate()

    let moveCount = Object.values(this.moves).slice(1).reduce((acc, obj) => acc + (obj ? obj.length : 0), 0)
    let embed = new RichEmbed()
        .setTitle(`${this.displayName} can learn ${moveCount} move(s)`)

    let learnset = []
    let moves = new Collection(Object.entries(this.moves).slice(1).filter(m => m.length > 0))
    moves.forEach((moveList, method) => {
        if (moveList.length > 0) learnset[method] = [...moveList.map(m => m.moveName)]
    })

    // 1024 character splitter
    for (let method in learnset) {
        learnset[method] = learnset[method].sort()
        var remainingLearnset = learnset[method].join(", ")
        let counter = 1
        let pieces = Math.ceil(remainingLearnset.length / 1024)

        while (remainingLearnset.length > 1024) {
            let splitPoint = remainingLearnset.lastIndexOf(", ", Math.floor(remainingLearnset.length / pieces--))
            learnset[`${method}${counter++}`] = remainingLearnset.substring(0, splitPoint).split(", ")
            remainingLearnset = remainingLearnset.substring(splitPoint + 2)
            delete learnset[method]
            if (remainingLearnset.length < 1024)
                learnset[`${method}${counter++}`] = remainingLearnset.split(", ")
        }
    }

    //Construct the embed fields
    if (learnset["level"]) embed.addField("By Level", learnset["level"].join(", "))
    if (learnset["tm"]) embed.addField("By TM", learnset["tm"].join(", "))
    if (learnset["tm1"]) embed.addField("By TM", learnset["tm1"].join(", "))
    if (learnset["tm2"]) embed.addField("By TM (cont)", learnset["tm2"].join(", "))
    if (learnset["tm3"]) embed.addField("By TM (cont)", learnset["tm3"].join(", "))
    if (learnset["hm"]) embed.addField("By HM", learnset["hm"].join(", "))
    if (learnset["bm"]) embed.addField("By BM", learnset["bm"].join(", "))
    if (learnset["mt"]) embed.addField("By MT", learnset["mt"].join(", "))
    if (learnset["sm"]) embed.addField("By SM", learnset["sm"].join(", "))

    return embed
}

pokemonSchema.methods.megaDex = async function(whichMega) {
    await this.populate("mega.pokemon").execPopulate()
    return await this.mega[whichMega].pokemon.dex(this)
}

pokemonSchema.methods.primalDex = async function(whichPrimal) {
    await this.populate("primal").execPopulate()
    return await this.primal[whichPrimal].pokemon.dex(this)
}

module.exports = mongoose.model("Pokemon", pokemonSchema)