const mongoose = require('mongoose')
const TrainerPokemon = require('./trainerPokemon')

const trainerSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    cash: {
        type: Number,
        required: true,
        default: 10000
    },
    contestCredit: {
        type: Number,
        required: true,
        default: 5000
    },
    battleRecord: {
        wins: {
            type: Number,
            default: 0
        },
        losses: {
            type: Number,
            default: 0
        },
        ffas: {
            type: Number,
            default: 0
        },
        _id: false
    },
    ffaPing: {
        type: Boolean,
        default: false
    },
    stats: {
        type: String
    },
    canRestart: {
        type: Boolean,
        default: false
    },
    admin: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        required: true,
        default: false
    },
    inventory: [
        {
            itemId: {
                type: Number,
                required: true,
                refPath: 'ref'
            },
            itemName: {
                type: String
            },
            ref: {
                type: String,
                enum: ['Item', 'Move']
            },
            count: {
                type: Number,
                default: 1
            },
            _id: false
        }
    ]
})

trainerSchema.plugin(require('mongoose-timestamp'))

trainerSchema.virtual('balance').get(function() {
    return { cash: this.cash, contestCredit: this.contestCredit }
})

trainerSchema.virtual('balanceString').get(function() {
    return `$${this.cash.toLocaleString()} | ${this.contestCredit.toLocaleString()} CC`
})

trainerSchema.statics.usernameExists = async function(username) {
    return this.findOne({
        username: new RegExp(`^${username}$`, 'i')
    })
}

trainerSchema.methods.cantAfford = function(cash = null, contestCredit = null) {
    const cashError = cash && cash > this.cash ? true : false
    const ccError = contestCredit && contestCredit > this.contestCredit ? true : false

    return cashError && ccError
        ? 'cash and contest credit'
        : cashError
            ? 'cash'
            : ccError
                ? 'contestCredit'
                : false
}

trainerSchema.methods.modifyCash = async function(amount) {
    this.cash += parseInt(amount)
    return this.save()
}

trainerSchema.methods.modifyContestCredit = async function(amount) {
    this.contestCredit += parseInt(amount)
    return this.save()
}

trainerSchema.methods.populatePokemon = async function() {
    return await this.populate({
        path: 'pokemon',
        populate: {
            path: 'basePokemon'
        }
    }).execPopulate()
}

trainerSchema.methods.getPokemon = async function(index = null) {
    if (!this.populated('pokemon')) await this.populatePokemon()
    return index !== null ? this.pokemon[index] : this.pokemon
}

trainerSchema.methods.findPokemon = async function(query) {
    if (!this.populated('pokemon')) await this.populatePokemon()
    return this.pokemon.filter(p => {
        return (
            (p.nickname && new RegExp(`^${query}$`, 'i').test(p.nickname)) ||
            new RegExp(`^${query}$`, 'i').test(p.pokemon.uniqueName)
        )
    })
}

trainerSchema.methods.listPokemon = async function() {
    if (!this.populated('pokemon')) await this.populatePokemon()
    return this.pokemon.map(p => p.nickname || p.pokemon.uniqueName)
}

// Adds a new TrainerPokemon for the provided Pokemon ID number
trainerSchema.methods.addNewPokemon = async function(pokemon) {
    let tp = new TrainerPokemon({
        trainer: this.id,
        basePokemon: pokemon.id,
        moves: { ...pokemon.moves },
        abilities: { ...pokemon.abilities }
    })

    for (let method in tp.moves) for (let m of tp.moves[method]) m.learned = false
    for (let a of tp.abilities) a.learned = !a.hidden

    await tp.save()
    this.pokemon.push(tp.id)
    return this.save()
}

trainerSchema.methods.addNewItem = async function(item, type) {
    this.inventory.push({ item: item.id, itemType: type })
    return this.save()
}

module.exports = mongoose.model('Trainer', trainerSchema)
