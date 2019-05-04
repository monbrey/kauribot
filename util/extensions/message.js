/**
 * Adds confirmation reactions to the message and listens to the response
 * @param {String} [listenTo=''] The ID of the user to listen to
 * @param {number} [timeout=30000] How long to wait for reactions
 * @returns {Promise<boolean>}
 */
const reactConfirm = async function(listenTo, timeout = 30000) {
    await this.react('✅')
    await this.react('❌')

    let filter = (reaction, user) =>
        ['✅', '❌'].includes(reaction.emoji.name) && user.id === listenTo
    let response = await this.awaitReactions(filter, {
        max: 1,
        time: timeout
    })

    if (!response.first()) return null
    return response.first().emoji.name === '✅' ? true : false
}

/**
 * Adds pagination controls to the message and listens to the response
 * @param {String}      [listenTo=''] - The ID of the user to listen to
 * @param {Boolean}     [back] - Should the back button be displayed
 * @param {Boolean}     [next] - Should the next button be displayed
 * @param {number}      [timeout=30000] - How long to wait for reactions
 * @returns {Promise<boolean>}
 */
const paginate = async function(listenTo, back, next, timeout = 30000) {
    // If we only have the 'forward' reaction, we want to remove it and put the 'back' in first
    if (back && !this.reactions.has('⬅')) {
        if (this.reactions.has('➡')) await this.reactions.get('➡').remove()
        await this.react('⬅')
    }
    if (!back && this.reactions.has('⬅')) await this.reactions.get('⬅').remove()
    if (next && !this.reactions.has('➡')) await this.react('➡')
    if (!next && this.reactions.has('➡')) await this.reactions.get('➡').remove()

    let filter = (reaction, user) =>
        ['⬅', '➡'].includes(reaction.emoji.name) && user.id === listenTo

    try {
        let response = await this.awaitReactions(filter, {
            max: 1,
            time: timeout
        })

        // Reset the selection
        await response.first().remove(listenTo)
        return response.first().emoji.name === '➡' ? true : false
    } catch (e) {
        this.clearReactions()
        return null
    }
}

const isFromOwnerGetter = function() {
    return this.author.id === this.client.applicationInfo.owner.id
}

module.exports = { reactConfirm, paginate, isFromOwnerGetter }
