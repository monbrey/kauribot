const mongoose = require("mongoose")
const {
    RichEmbed,
    Collection
} = require("discord.js")
const Color = require("./color")
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
        }]
    },
    evolution: [{
        pokemon: {
            type: Number,
            ref: "Pokemon"
        },
        requires: {
            type: Number,
            ref: "Item"
        }
    }],
    mega: [{
        pokemon: {
            type: Number,
            ref: "Mega"
        },
        requires: {
            type: Number,
            ref: "Item"
        }
    }],
    primal: [{
        pokemon: {
            type: Number,
            ref: "Mega"
        },
        requires: {
            type: Number,
            ref: "Item"
        }
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
        }
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
        }
    },
    martPrice: {
        pokemart: {
            type: Number
        },
        berryStore: {
            type: Number
        }
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
        }
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

pokemonSchema.statics.findExact = function(speciesNames, query = {}) {
    speciesNames = speciesNames.map(name => new RegExp(`^${name}$`, "i"))
    return this.find(Object.assign(query, {
        "speciesName": {
            $in: speciesNames
        }
    }))
}

pokemonSchema.statics.findOneExact = function(speciesName, query = {}) {
    return this.findOne(Object.assign(query, {
        "speciesName": new RegExp(`^${speciesName}$`, "i")
    }))
}

pokemonSchema.statics.findPartial = function(speciesName, query = {}) {
    return this.find(Object.assign(query, {
        "speciesName": new RegExp(speciesName, "i")
    }))
}

pokemonSchema.methods.dex = async function() {
    let blankField = {
        "name": "\u200B",
        "value": "\u200B",
        "inline": true
    }
    let embed = {
        "title": `URPG Ultradex - ${this.displayName} (#${new String(this.dexNumber).padStart(3,"0")})`,
        "color": parseInt(await Color.getColorForType(this.type1.toLowerCase()), 16),
        "image": {
            "url": `https://pokemonurpg.com/img/models/${this.dexNumber}${this.spriteCode?`-${this.spriteCode}`:""}.gif`
        },
        "fields": [{
            "name": `${this.type2 ? "Types" : "Type" }`,
            "value": `${this.type1}${this.type2 ? `\n${this.type2}` : ""}`,
            "inline": true
        }],
        "footer": {
            "text": "Reactions | [M] View Moves "
        }
    }

    await this.populate("ability").execPopulate()
    embed.fields.push({
        "name": "Ability",
        "value": `${this.ability.map(a => a.abilityName).join("\n")}`,
        "inline": true
    })

    if (this.hiddenAbility.length > 0) {
        await this.populate("hiddenAbility").execPopulate()
        embed.fields.push({
            "name": "Hidden Ability",
            "value": `${this.hiddenAbility.map(a => a.abilityName).join("\n")}`,
            "inline": true
        })
    } else embed.fields.push(blankField)

    embed.fields.push({
        "name": `Gender${this.gender.male && this.gender.female ? "s" : ""}`,
        "value": this.gender.male ? (this.gender.female ? "Male\nFemale" : "Male") : (this.gender.female ? "Female" : "Genderless"),
        "inline": true
    })
    embed.fields.push({
        "name": "Height",
        "value": `${this.height}m`,
        "inline": true
    })
    embed.fields.push({
        "name": "Weight",
        "value": `${this.weight}kg`,
        "inline": true
    })

    let ranks = 0
    if (this.rank.story) {
        embed.fields.push({
            "name": "Story Rank",
            "value": this.rank.story,
            "inline": true
        })
        ranks++
    }
    if (this.rank.art) {
        embed.fields.push({
            "name": "Art Rank",
            "value": this.rank.art,
            "inline": true
        })
        ranks++
    }
    if (this.rank.park && this.parkLocation) {
        embed.fields.push({
            "name": "Park Rank",
            "value": `${this.rank.park}\n(${this.parkLocation})`,
            "inline": true
        })
        ranks++
    }

    if (ranks !== 0) {
        for (ranks; ranks < 3; ranks++)
            embed.fields.push(blankField)
    }

    if (this.martPrice.pokemart) embed.fields.push({
        "name": "Pokemart",
        "value": `$${this.martPrice.pokemart.toLocaleString()}`,
        "inline": true
    })
    if (this.martPrice.berryStore) embed.fields.push({
        "name": "Berry Store",
        "value": `${this.martPrice.berryStore.toLocaleString()} CC`,
        "inline": true
    })

    embed.fields.push({
        "name": "Stats",
        "value": `\`\`\`
HP  | ATT | DEF | SP.A | SP.D | SPE
${new String(this.hp).padEnd(3," ")} | ${new String(this.attack).padEnd(3," ")} | ${new String(this.defence).padEnd(3," ")} | ${new String(this.specialAttack).padEnd(4," ")} | ${new String(this.specialDefence).padEnd(4," ")} | ${this.speed}\`\`\``
    })

    if (this.mega.length == 1) embed.footer.text += "| [X] View Mega form"
    if (this.mega.length == 2) embed.footer.text += "| [X] View X Mega form | [Y] View Y Mega Form"
    if (this.primal.length == 1) embed.footer.text += "| [🇵] View Primal form"

    return new RichEmbed(embed)
}

pokemonSchema.methods.learnset = async function() {
    await this.populate("moves.level moves.tm moves.hm moves.bm moves.mt moves.sm").execPopulate()

    let moveCount = Object.values(this.moves).slice(1).reduce((acc, obj) => acc + obj.length, 0)
    let embed = new RichEmbed()
        .setTitle(`${this.speciesName} can learn ${moveCount} move(s)`)

    let learnset = []
    let moves = new Collection(Object.entries(this.moves).slice(1).filter(m => m.length > 0))
    moves.forEach((moveList, method) => {
        if (moveList.length > 0) learnset[method] = [...moveList.map(m => m.moveName)]
    })

    learnset.forEach(x => console.log(x))
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
    await this.populate("mega").execPopulate()
    return await this.mega[whichMega].dex(this)
}

pokemonSchema.methods.primalDex = async function(whichPrimal) {
    await this.populate("primal").execPopulate()
    return await this.primal[whichPrimal].dex(this)
}

module.exports = mongoose.model("Pokemon", pokemonSchema)