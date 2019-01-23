const { Collection, RichEmbed } = require("discord.js")
const Move  = require("../../models/move")

let getMoveLists = async (pokemon) => {
    if (!pokemon.populated("moves.tm.move moves.hm.move moves.bm.move moves.mt.move moves.sm.move"))
        await pokemon.populate("moves.tm.move moves.hm.move moves.bm.move moves.mt.move moves.sm.move").execPopulate()

    let learnset = []
    let moves = new Collection(Object.entries(pokemon.moves).slice(1).filter(m => m.length > 0))
    moves.forEach((moveList, method) => {
        if (moveList.length > 0) learnset[method] = [...moveList]
    })

    // 1024 character splitter
    for (let method in learnset) {
        learnset[method] = learnset[method].sort((a, b) => {
            return a.move.moveName.localeCompare(b.move.moveName)
        })
    }

    return learnset
}

let getCart = async (pokemon, mValid) => {
    let learnset = await getMoveLists(pokemon)

    for (let method in learnset) {
        learnset[method] = learnset[method].map(m => {
            return m.learned ? `~~${m.move.moveName}~~` : (mValid.some(move => m.move.id === move.id) ? `**${m.move.moveName}**` : `${m.move.moveName}`)
        })

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

    return learnset
}

let updateCart = async (message, mValid, cart = null) => {
    let learned = Object.values(message.pokemon.moves).slice(1).reduce((acc, obj) => acc + obj.filter(m => m.learned).length, 0)
    let total = Object.values(message.pokemon.moves).slice(1).reduce((acc, obj) => acc + obj.length, 0)

    let embed = new RichEmbed()
        .setTitle(`${await message.pokemon.getName()} has learned ${learned}/${total} EMs`)
        .setDescription(`Respond with the names of moves you would like to unlock on ${await message.pokemon.getName()}.
It's recommended that you copy and paste from the list below to ensure exact matching.
To remove selections from your cart, prefix the move(s) with minus (-)
eg. \`-Fire Blast, -Thunderbolt\`.

Moves marked with ~~strikethrough~~ have been learned previously
Selected moves to purchase will be marked **bold**
React with ✅ to complete your purchase, or ❌ to cancel`)

    let moveCart = await getCart(message.pokemon, mValid)

    //Construct the embed fields
    if (moveCart["tm"]) embed.addField("By TM", moveCart["tm"].join(", "))
    if (moveCart["tm1"]) embed.addField("By TM", moveCart["tm1"].join(", "))
    if (moveCart["tm2"]) embed.addField("By TM (cont)", moveCart["tm2"].join(", "))
    if (moveCart["tm3"]) embed.addField("By TM (cont)", moveCart["tm3"].join(", "))
    if (moveCart["hm"]) embed.addField("By HM", moveCart["hm"].join(", "))
    if (moveCart["bm"]) embed.addField("By BM", moveCart["bm"].join(", "))
    if (moveCart["mt"]) embed.addField("By MT", moveCart["mt"].join(", "))
    if (moveCart["sm"]) embed.addField("By SM", moveCart["sm"].join(", "))

    embed.addField("Subtotal", `$${getSubtotal(message.pokemon, mValid).toLocaleString()}`)

    return cart ? await cart.edit(embed) : await message.channel.send(embed)
}

let getSubtotal = (pokemon, mValid) => {
    return mValid.length > 0 ? mValid.reduce((p, n) => {
        return p += pokemon.getMovePrice(n.id)
    }, 0) : 0
}

let processPurchase = async (message, mValid, cart) => {
    let embed = new RichEmbed(cart.embeds[0])

    embed.addField("Processing purchase...", "\u200B")
    cart.edit(embed)

    await message.pokemon.unlockMoves(mValid)
    await message.trainer.modifyCash(-getSubtotal(message.pokemon, mValid))

    cart = await updateCart(message, mValid, cart)

    embed = new RichEmbed(cart.embeds[0])

    embed.addField("Purchase complete!", `New balances: ${await message.trainer.balanceString}`)

    return cart.edit(embed)
}

let showInvalid = (message, known, invalid) => {
    if (known.length > 0 || invalid.length > 0) {
        let embed = new RichEmbed().error("Invalid item added", "The following moves were not added to your cart:")
        
        if(known.length > 0)
            embed.addField("Already knows:", `\`\`\`${known.map(m=>m.moveName).join(", ")}\`\`\``)

        if(invalid.length > 0)
            embed.addField("Cannot learn:", `\`\`\`${invalid.map(m=>m.moveName).join(", ")}\`\`\``)

        message.channel.send(embed).then(m => m.delete(5000))
    }
}

let buyMoves = async (message, mValid = [], cart = null) => {
    cart = await updateCart(message, mValid)

    let responses = message.channel.createMessageCollector(m => !m.author.bot && m.author.id === message.author.id, {})

    responses.on("collect", async msg => {
        let args = msg.content.split(",").map(x => x.trim())
        let [add, remove] = [
            args.filter(x => !x.startsWith("-")),
            args.filter(x => x.startsWith("-")).map(x => x.substring(1))
        ]

        let mResult = await Move.findExact(add)
        mValid.push(...mResult.filter(m => message.pokemon.isValidMove(m.id) && !message.pokemon.isMoveKnown(m.id)))
        let mKnown = [...mResult.filter(m => message.pokemon.isMoveKnown(m.id))]
        let mInvalid = [...mResult.filter(m => !message.pokemon.isValidMove(m.id))]

        remove.forEach(r => {
            let i = mValid.findIndex(m => m.moveName === r)
            i >= 0 ? mValid.splice(i, 1) : message.channel.send(
                new RichEmbed().warning(`"${r}" was not found in your cart`)
            ).then(msg => msg.delete(5000))
        })

        cart = await updateCart(message, mValid, cart)
        showInvalid(message, mKnown, mInvalid)
    })

    return (await cart.reactConfirm(message.author.id, 0) ? async () => {
        responses.stop()

        //TODO: Filter on HMs
        //TODO: Daycare Passes / Heart Scales

        //Handle cash exception
        if (getSubtotal(message.pokemon, mValid) > message.trainer.cash) {
            cart.clearReactions()
            let error = await message.channel.send("You have insufficient cash to complete this purchase. Please remove some items and try again.")
            error.delete(5000)
            return this.buyMoves(message, mValid, cart)
        }

        return processPurchase(message, mValid, cart)
    }: () => {
        responses.stop()
        return message.channel.send("Purchase cancelled - no funds have been deducted")
    })()
}

module.exports = buyMoves
