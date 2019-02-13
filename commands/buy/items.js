const { RichEmbed } = require("discord.js")
const { stripIndent } = require("common-tags")
const Item = require("../../models/item")
const seqProm = require("../../util/sequentialPromises")

const getCart = (items) => {
    return `${ items.length > 0 ? items.map(i => {
        return `${i.itemName} - ${i.priceString}`
    }).join("\n") : "Empty" }`
}

const updateCart = async (message, items, cart = null) => {
    let embed = new RichEmbed()
        .setTitle(`Your Pokemart Pokecart | Wallet: ${await message.trainer.balanceString}`)
        .setDescription(stripIndent`Reply with the names of all items you wish to purchase, as they appear in the Pokemart.
        To remove selections from your cart, prefix the item with minus (-)
        Multiple values can be entered separated by commas.
        
        React with ✅ when you are ready to make your purchase.
        React with ❌ to cancel and make no changes.`)
        .addField("Cart", getCart(items))
        .addField("Subtotal", `$${getSubtotals(items)[0].toLocaleString()} | ${getSubtotals(items)[1].toLocaleString()} CC`)

    return cart ? await cart.edit(embed) : await message.channel.send(embed)
}

const getSubtotals = (items) => {
    return items.length > 0 ? items.reduce((p,n) => {
        n.martPrice.pokemart ? p[0] += n.martPrice.pokemart : p[1] += n.martPrice.berryStore
        return p
    }, [0,0]) : [0,0]
}

const showInvalid = (message, items) => {
    if (items.length > 0) {
        let embed = new RichEmbed()
            .error("Invalid item added",
                `The folowing Items are not available in the Pokemart and were not added to your cart:
\`\`\`${items.map(i=>i.itemName).join(", ")}\`\`\``)
        message.channel.deleteAfterSend(embed)
    }
}

const processPurchase = async (message, items, cart) => {
    let embed = new RichEmbed(cart.embeds[0])

    embed.addField("Processing purchase...", "\u200B")
    cart = await cart.edit(embed)

    await seqProm(items, message.trainer.addNewPokemon)

    await message.trainer.modifyCash(-getSubtotals(items)[0])
    await message.trainer.modifyContestCredit(-getSubtotals(items)[1])

    embed.fields[2].name = "Purchase complete"
    embed.fields[2].value = `New balances: ${await message.trainer.balanceString}`
    
    return cart.edit(embed)
}

const buyItems = async (message, args = [], cart = null) => {
    let iResult = await Item.findExact(args).sort("itemName")
    iResult = args.map(name => {
        let regex = new RegExp(`^${name}$`, "i")
        return iResult.find(i=>regex.test(i.itemName))
    })

    let [iValid, iInvalid] = iResult.reduce(([pass, fail], item) => {
        return item.martPrice ? [
            [...pass, item], fail
        ] : [pass, [...fail, item]]
    }, [[], []])

    cart = await updateCart(message, iValid, cart)
    showInvalid(message, iInvalid)

    const responses = cart.channel.createMessageCollector(m => m.author.id === message.author.id, {})
    responses.on("collect", async m => {
        let args = [...m.content.split(",")].map(arg => arg.trim())
        let [add, remove] = [
            args.filter(x => !x.startsWith("-")),
            args.filter(x => x.startsWith("-")).map(x => x.substring(1))
        ]

        let iResultNew = await Item.findExact(add).sort("itemName")
        iResultNew = add.map(name => {
            let regex = new RegExp(`^${name}$`, "i")
            return iResultNew.find(i => regex.test(i.itemName))
        })
        iValid.push(...iResultNew.filter(p => p.martPrice && p.martPrice.pokemart))
        iInvalid = iResultNew.filter(p => !p.martPrice || !p.martPrice.pokemart)

        remove.forEach(r => {
            let regex = new RegExp(`^${r}$`, "i")
            let i = iValid.findIndex(i => regex.test(i.itemName))
            i >= 0 ? iValid.splice(i, 1) : message.channel.deleteAfterSend(
                RichEmbed.warning(`"${r}" was not found in your cart`)
            )
        })

        cart = await updateCart(message, iValid, cart)
        showInvalid(message, iInvalid)
    })

    return (await cart.reactConfirm(message.author.id, 0) ? async () => {
        responses.stop()

        // TODO: Pickup / Honey Gather

        // Check affordability
        let subtotals = getSubtotals(iValid)
        let currencyError = message.trainer.canAfford(subtotals[0], subtotals[1])
        if(currencyError) {
            cart.clearReactions()
            let embed = RichEmbed.error("Insufficient funds", 
                `You have insufficient ${currencyError} to complete this purchase. Please remove some items and try again.`)
            message.channel.deleteAfterSend(embed)
            return this.buyItems(message, iValid.map(i=>i.itemName), cart)
        }

        processPurchase(message, iValid, cart)
    } : () => {
        responses.stop()
        return message.channel.send("Purchase cancelled - no funds have been deducted")
    })()
}

module.exports = buyItems