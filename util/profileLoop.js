module.exports = async (message, profileMsg, member, trainer, lastReaction = null) => {
    if (lastReaction) await profileMsg.clearReactions()

    const pokeball = profileMsg.client.emojis.get('525071235806396426')
    const backpack = profileMsg.client.emojis.get('525071260007530518')
    const red = profileMsg.client.emojis.get('532330377281273862')

    const { roster } = message.client.commands.get('roster')
    const { inventory } = message.client.commands.get('inventory')
    const { profile, editProfile } = message.client.commands.get('trainer')

    try {
        switch (lastReaction) {
            case 'pokeball':
                profileMsg = await profileMsg.edit(await roster(member, trainer))
                await profileMsg.react(red)
                await profileMsg.react(backpack)
                break
            case 'backpack':
                profileMsg = await profileMsg.edit(await inventory(member, trainer))
                await profileMsg.react(red)
                await profileMsg.react(pokeball)
                break
            case 'red':
                profileMsg = await profileMsg.edit(await profile(member, trainer))
                await profileMsg.react(pokeball)
                await profileMsg.react(backpack)
                if (message.member === member) await profileMsg.react('📝')
                break
            case '📝':
                profileMsg = await profileMsg.edit(await editProfile(member, trainer))
                await profileMsg.react(red)
                break
        }
    } catch (e) {
        e.key = 'profileLoop'
        throw e
    }

    let filter = (reaction, user) =>
        user.id === message.author.id &&
        ['red', 'backpack', 'pokeball', '📝'].includes(reaction.emoji.name)

    let reactions = await profileMsg.awaitReactions(filter, {
        max: 1,
        time: 30000
    })

    if (!reactions.first()) return profileMsg.clearReactions()

    return module.exports(message, profileMsg, member, trainer, reactions.first().emoji.name)
}
