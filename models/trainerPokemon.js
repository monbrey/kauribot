const mongoose = require('mongoose')

const TrainerPokemonMove = require('./schemas/trainerPokemonMove')
const TrainerPokemonAbility = require('./schemas/trainerPokemonAbility')
const TrainerPokemonBase = require('./schemas/trainerPokemonBase')

const trainerPokemonSchema = new mongoose.Schema(
    {
        trainer: { type: String, required: true, ref: 'Trainer' },
        basePokemon: { type: TrainerPokemonBase, required: true },
        nickname: { type: String, required: false },
        battles: { type: Number, required: true, default: 0 },
        exp: { type: Number, default: 0 },
        abilities: [TrainerPokemonAbility],
        moves: {
            level: [TrainerPokemonMove],
            tm: [TrainerPokemonMove],
            hm: [TrainerPokemonMove],
            bm: [TrainerPokemonMove],
            mt: [TrainerPokemonMove],
            sm: [TrainerPokemonMove]
        }
    },
    { collection: 'trainerPokemon' }
)

trainerPokemonSchema.plugin(require('mongoose-timestamp'))
trainerPokemonSchema.plugin(require('mongoose-plugin-autoinc').autoIncrement, {
    model: 'TrainerPokemon',
    startAt: 1
})

trainerPokemonSchema.methods.getName = async function() {
    if (this.nickname) return this.nickname
    if (!this.populated('basePokemon')) await this.populate('basePokemon').execPopulate()
    return this.basePokemon.uniqueName
}

trainerPokemonSchema.methods.isValidMove = function(moveID) {
    let filter = this.populated('moves.tm.move') === undefined ? m => m.move === moveID : m => m.move.id === moveID

    let m =
        this.moves.tm.find(filter) ||
        this.moves.hm.find(filter) ||
        this.moves.bm.find(filter) ||
        this.moves.mt.find(filter) ||
        this.moves.sm.find(filter)

    if (m) return true
}

trainerPokemonSchema.methods.isMoveKnown = function(moveID) {
    let filter = this.populated('moves.tm.move') === undefined ? m => m.move === moveID : m => m.move.id === moveID

    let m =
        this.moves.tm.find(filter) ||
        this.moves.hm.find(filter) ||
        this.moves.bm.find(filter) ||
        this.moves.mt.find(filter) ||
        this.moves.sm.find(filter)

    return !m || !m.learned ? false : true
}

trainerPokemonSchema.methods.getMovePrice = function(moveID) {
    let filter = this.populated('moves.tm.move') === undefined ? m => m.move === moveID : m => m.move.id === moveID

    let m = this.moves.tm.find(filter)
    if (m) return m.move.tm.martPrice.pokemart

    m = this.moves.hm.find(filter)
    if (m) return m.move.hm.martPrice.pokemart

    m = this.moves.bm.find(filter) || this.moves.mt.find(filter) || this.moves.sm.find(filter)
    if (m) return 4000

    return 0
}

trainerPokemonSchema.methods.unlockMoves = async function(moves) {
    for (let move of moves) move.learned = true
    // moves.forEach(move => {
    //     let filter = m => m.moveId === move.moveId
    //     let m =
    //         this.moves.tm.find(filter) ||
    //         this.moves.hm.find(filter) ||
    //         this.moves.bm.find(filter) ||
    //         this.moves.mt.find(filter) ||
    //         this.moves.sm.find(filter)

    //     m.learned = true
    // })

    return await this.save()
}

module.exports = mongoose.model('TrainerPokemon', trainerPokemonSchema)
