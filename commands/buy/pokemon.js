const { RichEmbed } = require("discord.js")
const Pokemon = require("../../models/pokemon")

const getCart = (pokemon) => {
    return `${ pokemon.length > 0 ? pokemon.map(p => {
        let price = p.martPrice.pokemart ? `$${p.martPrice.pokemart.toLocaleString()}` : `${p.martPrice.berryStore.toLocaleString()} CC`
        return `${p.uniqueName} - ${price}`
    }).join("\n") : "Empty" }`
}

const updateCart = async (message, pokemon, cart = null) => {
    let embed = new RichEmbed()
        .setTitle(`Your Pokemart Pokecart | Wallet: ${await message.trainer.getBalanceString()}`)
        .setDescription(`Reply with the names of all Pokemon you wish to purchase, as they are shown in the Pokemart.
To remove selections from your cart, prefix the Pokemon with minus (-)
eg. \`-Bulbasaur, -Squirtle\`.
Multiple values can be entered separated by commas.

React with ✅ when you are ready to make your purchase.
React with ❌ to cancel and make no changes.`)
        .addField("Cart", getCart(pokemon))
        .addField("Subtotal", `$${getSubtotals(pokemon)[0].toLocaleString()} | ${getSubtotals(pokemon)[1].toLocaleString()} CC`)

    return cart ? await cart.edit(embed) : await message.channel.send(embed)
}

const getSubtotals = (pokemon) => {
    return pokemon.length > 0 ? pokemon.reduce((p, n) => {
        n.martPrice.pokemart ? p[0] += n.martPrice.pokemart : p[1] += n.martPrice.berryStore
        return p
    }, [0, 0]) : [0, 0]
}

const processPurchase = async (message, pokemon, cart) => {
    let embed = new RichEmbed(cart.embeds[0])

    embed.addField("Processing purchase...", "\u200B")
    cart = await cart.edit(embed)

    await pokemon.reduce(async (previousPromise, next) => {
        await previousPromise
        return message.trainer.addNewPokemon(next)
    }, Promise.resolve())

    await message.trainer.modifyCash(-getSubtotals(pokemon)[0])
    await message.trainer.modifyContestCredit(-getSubtotals(pokemon)[1])

    embed.fields[2].name = "Purchase complete!"
    embed.fields[2].value = `New balances: ${await message.trainer.getBalanceString()}`

    return await cart.edit(embed)
}

const showInvalid = (message, pokemon) => {
    if (pokemon.length > 0) {
        let embed = new RichEmbed()
            .error("Invalid item added",
                `The following Pokemon are not available in the Pokemart and were not added to your cart:
\`\`\`${pokemon.map(p=>p.uniqueName).join(", ")}\`\`\``)
        message.channel.send(embed).then(m => m.delete(5000))
    }
}

const buyPokemon = async (message, args, cart = null) => {
    let pResult = await Pokemon.findExact(args).sort("dexNumber")
    pResult = args.map(name => {
        let regex = new RegExp(`^${name}$`, "i")
        return pResult.find(p => regex.test(p.uniqueName))
    })
    let [pValid, pInvalid] = pResult.reduce(([pass, fail], item) => {
        return item.martPrice ? [
            [...pass, item], fail
        ] : [pass, [...fail, item]]
    }, [[], []])

    cart = await updateCart(message, pValid, cart)
    showInvalid(message, pInvalid)

    let responses = cart.channel.createMessageCollector(m => m.author.id === message.author.id, {})
    responses.on("collect", async m => {
        //Need to set a timeout interval in here
        let args = [...m.content.split(",")].map(arg => arg.trim())
        let [add, remove] = [
            args.filter(x => !x.startsWith("-")),
            args.filter(x => x.startsWith("-")).map(x => x.substring(1))
        ]

        let pResultNew = await Pokemon.findExact(add).sort("dexNumber")
        pResultNew = add.map(name => {
            let regex = new RegExp(`^${name}$`, "i")
            return pResult.find(p => regex.test(p.uniqueName))
        })
        pValid.push(...pResultNew.filter(p => p.martPrice && p.martPrice.pokemart))
        pInvalid = pResultNew.filter(p => !p.martPrice || !p.martPrice.pokemart)

        remove.forEach(r => {
            let regex = new RegExp(`^${r}$`, "i")
            let i = pValid.findIndex(p => regex.test(p.uniqueName))
            i >= 0 ? pValid.splice(i, 1) : message.channel.send(
                new RichEmbed().warning(`"${r}" was not found in your cart`)
            ).then(m => m.delete(5000))
        })

        cart = await updateCart(message, pValid, cart)
        showInvalid(message, pInvalid)
    })

    return (await cart.reactConfirm(message.author.id, 0) ? async () => {
        responses.stop()

        //TODO: Mart Coupon / Alternative payments

        //Handle cash exception
        if (getSubtotals(pValid)[0] > message.trainer.cash) {
            cart.clearReactions()
            let embed = new RichEmbed().error("Insufficient funds", "You have insufficient cash to complete this purchase. Please remove some items and try again.")
            message.channel.send(embed).then(m=>m.delete(5000))
            return this.buyPokemon(message, pValid.map(p => p.uniqueName), cart)
        }
        if (getSubtotals(pValid)[1] > message.trainer.contestCredit) {
            cart.clearReactions()
            let embed = new RichEmbed().error("Insufficient funds", "You have insufficient contest credit to complete this purchase. Please remove some items and try again.")
            message.channel.send(embed).then(m=>m.delete(5000))
            return this.buyPokemon(message, pValid.map(p => p.uniqueName), cart)
        }

        await processPurchase(message, pValid, cart)
        //TODO: Log the purchase to the logs channel
    }: () => {
        responses.stop()
        return message.channel.send("Purchase cancelled - no funds have been deducted")
    })()
}

module.exports = buyPokemon
