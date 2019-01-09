const mongoose = require("mongoose")

var trainerPokemonSchema = new mongoose.Schema({
    basePokemon: {
        type: Number,
        required: true,
        ref: "Pokemon"
    },
    nickname: {
        type: String,
        required: false
    },
    battles: {
        type: Number,
        required: true,
        default: 0
    },
    hiddenAbility: [{
        ability: {
            type: Number,
            ref: "Ability"
        },
        unlocked: {
            type: Boolean,
            default: false
        }
    }],
    moves: {
        tm: [{
            move: {
                type: Number,
                ref: "Move",
            },
            learned: {
                type: Boolean,
                default: false
            },
            _id: false,
            id: false
        }],
        hm: [{
            move: {
                type: Number,
                ref: "Move",
            },
            learned: {
                type: Boolean,
                default: false
            },
            _id: false,
            id: false
        }],
        bm: [{
            move: {
                type: Number,
                ref: "Move",
            },
            learned: {
                type: Boolean,
                default: false
            },
            _id: false,
            id: false
        }],
        mt: [{
            move: {
                type: Number,
                ref: "Move",
            },
            learned: {
                type: Boolean,
                default: false
            },
            _id: false,
            id: false
        }],
        sm: [{
            move: {
                type: Number,
                ref: "Move",
            },
            learned: {
                type: Boolean,
                default: false
            },
            _id: false,
            id: false
        }]
    },
}, {
    collection: "trainerPokemon"
})

trainerPokemonSchema.plugin(require("mongoose-timestamp"))
trainerPokemonSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "TrainerPokemon",
    startAt: 1
})

trainerPokemonSchema.methods.getName = async function () {
    if (this.nickname) return this.nickname
    if (!this.populated("basePokemon")) await this.populate("basePokemon").execPopulate()
    return this.basePokemon.uniqueName
}

trainerPokemonSchema.methods.isValidMove = function (moveID) {
    let filter = this.populated("moves.tm.move") === undefined ?
        m => m.move === moveID :
        m => m.move.id === moveID

    let m = this.moves.tm.find(filter) ||
        this.moves.hm.find(filter) ||
        this.moves.bm.find(filter) ||
        this.moves.mt.find(filter) ||
        this.moves.sm.find(filter)

    if (m) return true
}

trainerPokemonSchema.methods.isMoveKnown = function (moveID) {
    let filter = this.populated("moves.tm.move") === undefined ?
        m => m.move === moveID :
        m => m.move.id === moveID

    let m = this.moves.tm.find(filter) ||
        this.moves.hm.find(filter) ||
        this.moves.bm.find(filter) ||
        this.moves.mt.find(filter) ||
        this.moves.sm.find(filter)

    return (!m || !m.learned) ? false : true
}

trainerPokemonSchema.methods.getMovePrice = function (moveID) {
    let filter = this.populated("moves.tm.move") === undefined ?
        m => m.move === moveID :
        m => m.move.id === moveID

    let m = this.moves.tm.find(filter)
    if (m) return m.move.tm.price

    m = this.moves.hm.find(filter)
    if (m) return m.move.hm.price

    m = this.moves.bm.find(filter) ||
        this.moves.mt.find(filter) ||
        this.moves.sm.find(filter)
    if (m) return 4000

    return 0
}

trainerPokemonSchema.methods.unlockMoves = async function (moves) {
    let populated = this.populated("moves.tm.move") === undefined

    moves.forEach(move => {
        let filter = populated ? m => m.move === move.id : m => m.move.id === move.id
        let m = this.moves.tm.find(filter) ||
            this.moves.hm.find(filter) ||
            this.moves.bm.find(filter) ||
            this.moves.mt.find(filter) ||
            this.moves.sm.find(filter)

        m.learned = true
    })

    return await this.save()
}

module.exports = mongoose.model("TrainerPokemon", trainerPokemonSchema)
