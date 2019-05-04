const { Schema, model } = require('mongoose')
const { RichEmbed, Collection } = require('discord.js')
const Color = require('./color')

const PokemonMove = require('./schemas/pokemonMove')
const PokemonEvolution = require('./schemas/pokemonEvolution')
const PokemonAbility = require('./schemas/pokemonAbility')
const Mega = require('./mega')

const pokemonSchema = new Schema(
    {
        dexNumber: { type: Number, required: true, index: true },
        speciesName: { type: String, required: true },
        uniqueName: { type: String, required: true, index: true },
        displayName: { type: String, required: true },
        spriteCode: { type: String },
        type1: { type: String, required: true },
        type2: { type: String },
        abilities: [PokemonAbility],
        moves: {
            level: [PokemonMove],
            tm: [PokemonMove],
            hm: [PokemonMove],
            bm: [PokemonMove],
            mt: [PokemonMove],
            sm: [PokemonMove]
        },
        evolution: [PokemonEvolution],
        mega: [
            {
                megaId: { type: Number, ref: 'Mega' },
                displayName: { type: String },
                _id: false
            }
        ],
        primal: [
            {
                primalId: { type: Number, ref: 'Mega' },
                displayName: { type: String },
                _id: false
            }
        ],
        stats: {
            hp: { type: Number, required: true },
            attack: { type: Number, required: true },
            defence: { type: Number, required: true },
            specialAttack: { type: Number, required: true },
            specialDefence: { type: Number, required: true },
            speed: { type: Number, required: true }
        },
        height: { type: Number },
        weight: { type: Number },
        gender: { male: { type: Boolean }, female: { type: Boolean } },
        martPrice: { pokemart: { type: Number }, berryStore: { type: Number } },
        rank: {
            story: { type: String },
            art: { type: String },
            park: { type: String }
        },
        assets: {
            image: { type: String },
            icon: { type: String }
        },
        parkLocation: { type: String },
        starterEligible: { type: Boolean, required: true }
    },
    { collection: 'pokemon' }
)

pokemonSchema.plugin(require('mongoose-plugin-autoinc').autoIncrement, {
    model: 'Pokemon',
    startAt: 1
})
pokemonSchema.plugin(require('./plugins/paginator'))

pokemonSchema.virtual('priceString').get(() => {
    if (this.martPrice.pokemart && this.martPrice.berryStore) {
        return `$${this.martPrice.pokemart.toLocaleString()} | ${this.martPrice.berryStore.toLocaleString()} CC`
    }
    return this.martPrice.pokemart
        ? `$${this.martPrice.pokemart.toLocaleString()}`
        : `${this.martPrice.berryStore.toLocaleString()} CC`
})

pokemonSchema.statics.getMartPokemon = async function(_page = 0) {
    return await this.paginate(
        { 'martPrice.pokemart': { $not: { $eq: null } } },
        { select: 'dexNumber uniqueName martPrice.pokemart' },
        (a, b) => {
            return a.dexNumber - b.dexNumber
        },
        _page,
        12
    )
}

pokemonSchema.statics.findExact = function(uniqueNames, query = {}) {
    uniqueNames = uniqueNames.map(name => new RegExp(`^${name}$`, 'i'))
    return this.find(Object.assign(query, { uniqueName: { $in: uniqueNames } }))
}

pokemonSchema.statics.findOneExact = function(uniqueName, query = {}) {
    return this.findOne(Object.assign(query, { uniqueName: new RegExp(`^${uniqueName}$`, 'i') }))
}

pokemonSchema.statics.findPartial = function(uniqueName, query = {}) {
    return this.find(Object.assign(query, { uniqueName: new RegExp(uniqueName, 'i') }))
}

pokemonSchema.methods.dex = async function(query) {
    const color = await Color.getColorForType(this.type1.toLowerCase())
    const dexString = this.dexNumber.toString().padStart(3, '0')
    const title = `URPG Ultradex - ${this.displayName} (#${dexString})`
    const types = `${this.type1}${this.type2 ? ` | ${this.type2}` : ''}`
    const abilities = this.abilities.map(a => (a.hidden ? `${a.abilityName} (HA)` : a.abilityName))
    const genders = Object.keys(this.gender.toObject())
        .filter(k => this.gender[k])
        .map(k => `${k.charAt(0).toUpperCase()}${k.slice(1)}`)

    const embed = new RichEmbed()
        .setTitle(title)
        .setColor(color)
        .setThumbnail(this.assets.icon)
        .setImage(this.assets.image)
        .addField(`${this.type2 ? 'Types' : 'Type'}`, types)
        .addField('Abilities', abilities.join(' | '))
        .addField('Legal Genders', genders.length ? genders.join(' | ') : 'Genderless')
        .addField('Height and Weight', `${this.height}m, ${this.weight}kg`)
        .setFooter('Reactions | [M] View Moves ')

    if (this.matchRating !== 1) {
        const percent = Math.round(this.matchRating * 100)
        const note = `Closest match to your search "${query}" with ${percent}% similarity`
        embed.setDescription(note)
    }

    const rank = []
    if (this.rank.story) rank.push(`Story - ${this.rank.story}`)
    if (this.rank.art) rank.push(`Art - ${this.rank.art}`)
    if (this.rank.park && this.parkLocation)
        rank.push(`Park - ${this.rank.park} (${this.parkLocation})`)
    if (rank.length) embed.addField('Creative Ranks', rank.join(' | '))

    const prices = []
    if (this.martPrice.pokemart) prices.push(`${this.martPrice.pokemart.toLocaleString()}`)
    if (this.martPrice.berryStore) prices.push(`${this.martPrice.berryStore.toLocaleString()} CC`)
    if (prices.length) embed.addField('Price', `${prices.join(' | ')}`)

    let statsStrings = Object.values(this.stats.toObject()).map(s => s.toString().padEnd(3, ' '))
    statsStrings = `HP  | Att | Def | SpA | SpD | Spe\n${statsStrings.join(' | ')}`
    embed.addField('Stats', `\`\`\`${statsStrings}\`\`\``)

    if (this.mega.length == 1) embed.footer.text += '| [X] View Mega form'
    if (this.mega.length == 2) embed.footer.text += '| [X] View X Mega form | [Y] View Y Mega Form'
    if (this.primal.length == 1) embed.footer.text += '| [🇵] View Primal form'

    return embed
}

pokemonSchema.methods.learnset = function(dex) {
    const moveCount = Object.values(this.moves.toObject())
        .slice(1)
        .reduce((acc, obj) => acc + (obj ? obj.length : 0), 0)

    const embed = new RichEmbed()
        .setTitle(`${this.displayName} can learn ${moveCount} move(s)`)
        .setColor(dex.embeds[0].colors)

    const learnset = []
    const moves = new Collection(
        Object.entries(this.moves)
            .slice(1)
            .filter(m => m.length > 0)
    )
    moves.forEach((moveList, method) => {
        if (moveList.length > 0) learnset[method] = [...moveList.map(m => m.moveName)]
    })

    // 1024 character splitter
    for (const method in learnset) {
        learnset[method] = learnset[method].sort()
        let remainingLearnset = learnset[method].join(', ')
        let counter = 1
        let pieces = Math.ceil(remainingLearnset.length / 1024)

        while (remainingLearnset.length > 1024) {
            const splitPoint = remainingLearnset.lastIndexOf(
                ', ',
                Math.floor(remainingLearnset.length / pieces--)
            )
            learnset[`${method}${counter++}`] = remainingLearnset
                .substring(0, splitPoint)
                .split(', ')
            remainingLearnset = remainingLearnset.substring(splitPoint + 2)
            delete learnset[method]
            if (remainingLearnset.length < 1024) {
                learnset[`${method}${counter++}`] = remainingLearnset.split(', ')
            }
        }
    }

    // Construct the embed fields
    if (learnset['level']) embed.addField('By Level', learnset['level'].join(', '))
    if (learnset['tm']) embed.addField('By TM', learnset['tm'].join(', '))
    if (learnset['tm1']) embed.addField('By TM', learnset['tm1'].join(', '))
    if (learnset['tm2']) embed.addField('By TM (cont)', learnset['tm2'].join(', '))
    if (learnset['tm3']) embed.addField('By TM (cont)', learnset['tm3'].join(', '))
    if (learnset['hm']) embed.addField('By HM', learnset['hm'].join(', '))
    if (learnset['bm']) embed.addField('By BM', learnset['bm'].join(', '))
    if (learnset['mt']) embed.addField('By MT', learnset['mt'].join(', '))
    if (learnset['sm']) embed.addField('By SM', learnset['sm'].join(', '))

    return embed
}

pokemonSchema.methods.megaDex = async function(whichMega) {
    const mega = await Mega.findById(this.mega[whichMega].megaId)
    return mega.dex(this)
}

pokemonSchema.methods.primalDex = async function(whichPrimal) {
    const primal = await Mega.findById(this.mega[whichPrimal].primalId)
    return primal.dex(this)
}

module.exports = model('Pokemon', pokemonSchema)
