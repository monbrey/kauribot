const { RichEmbed } = require("discord.js")

let processPurchase = async (message, ability, cart) => {
    let embed = new RichEmbed(cart.embeds[0])

    embed.addField("Processing purchase...", "\u200B")
    cart.edit(embed)

    ability.unlocked = true
    await message.pokemon.save()
    await message.trainer.modifyCash(-4000)

    embed.fields[embed.fields.length - 1] = {
        name: "Purchase complete!",
        value: `New balances: ${await message.trainer.balanceString}`
    }

    return cart.edit(embed)
}

let buyAbility = async (message) => {
    await message.pokemon.populate("basePokemon hiddenAbility.ability").execPopulate()
    await message.pokemon.populate("basePokemon.ability").execPopulate()

    let name = await message.pokemon.getName()

    let unlocked = [
        ...message.pokemon.basePokemon.ability.map(a => a.abilityName),
        ...message.pokemon.hiddenAbility.filter(a => a.unlocked).map(a => `${a.ability.abilityName} (HA)`)
    ]
    let locked = [...message.pokemon.hiddenAbility.filter(a => !a.unlocked)]
    let lockedList = locked.map((a,i) => `${i + 1}. ${a.ability.abilityName}`)

    if(locked.length === 0) {
        return message.channel.sendPopup("warn","No locked abilities",`Your ${name} does not have any more Hidden Abilities that require unlocking`)
    }

    let embed = new RichEmbed()
        .setTitle(`${name}'s Abilities`)
        .setDescription(`Click the number corresponding to the Hidden Ability you would like to unlock for ${name}, or ❌ to cancel. Hidden Abilities cost $4,000 each.`)
    embed.addField("Known Abilities", unlocked.join("\n"), true)
    embed.addField("Locked Abilities", lockedList.join("\n"), true)

    let cart = await message.channel.send(embed)

    let listen = []
    for(let i in locked) {
        listen.push(message.client.emojiCharacters[parseInt(i) + 1])
        await cart.react(message.client.emojiCharacters[parseInt(i) + 1])
    }

    await cart.react("❌")

    let filter = (reaction, user) => [...listen, "❌"].includes(reaction.emoji.name) && user.id === message.author.id
    let response = await cart.awaitReactions(filter, {
        max: 1,
        time: 30000
    })

    if(!response.first()) {
        cart.clearReactions()
        return message.channel.send("Purchase timed out - no funds have been deducted")
    }

    return (
        (response.first().emoji.name === "❌") ? async () => {
            return message.channel.send("Purchase cancelled - no funds have been deducted")
    
            // TODO: Filter on HMs
            // TODO: Daycare Passes / Heart Scales
        } : () => {
            // Handle cash exception
            if (4000 > message.trainer.cash) {
                cart.clearReactions()
                return message.channel.sendPopup("error", null, "You have insufficient cash to complete this purchase. Please remove some items and try again.")
            }
    
            let ability = locked[listen.indexOf(response.first().emoji.name)]

            return processPurchase(message, ability, cart)
        }
    )()


}

module.exports = buyAbility