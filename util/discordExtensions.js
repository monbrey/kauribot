const { Message, RichEmbed } = require("discord.js")

/**
 * Adds confirmation reactions to the message and listens to the response
 * @param {String} [listenTo=''] The ID of the user to listen to
 * @param {number} [timeout=30000] How long to wait for reactions 
 * @returns {Promise<boolean>}
 */
Message.prototype.reactConfirm = async function(listenTo, timeout = 30000) {
    await this.react("✅")
    await this.react("❌")

    let filter = (reaction, user) => ["✅", "❌"].includes(reaction.emoji.name) && user.id === listenTo
    let response = await this.awaitReactions(filter, {
        max: 1,
        time: timeout
    })

    return response.first().emoji.name === "✅" ? true : false
}

/**
 * Adds pagination controls to the message and listens to the response
 * @param {String}      [listenTo=''] - The ID of the user to listen to
 * @param {Boolean}     [back] - Should the back button be displayed
 * @param {Boolean}     [next] - Should the next button be displayed
 * @param {number}      [timeout=30000] - How long to wait for reactions 
 * @returns {Promise<boolean>}
 */
Message.prototype.reactPaginator = async function(listenTo, back, next, timeout = 30000) {
    //If we only have the 'forward' reaction, we want to remove it and put the 'back' in first
    if(this.reactions.has("➡") && !this.reactions.has("⬅")) await this.clearReactions()
    if(back && !this.reactions.has("⬅")) await this.react("⬅")
    if(next && !this.reactions.has("➡")) await this.react("➡")

    let filter = (reaction, user) => ["⬅", "➡"].includes(reaction.emoji.name) && user.id === listenTo

    try {
        let response = await this.awaitReactions(filter, {
            max: 1,
            time: timeout
        })

        //Reset the selection
        await response.first().remove(listenTo)
        return response.first().emoji.name === "➡" ? true : false
    } catch (e) {
        this.clearReactions()
        return null
    }
}

//Overriding the delete function with a way to cancel it
Message.prototype.cancellableDelete = async function(timeout) {
    this.deleteTimer = setTimeout(() => { this.delete() }, timeout)
    return this
}

Message.prototype.cancelDelete = async function() {
    clearTimeout(this.deleteTimer)
    return this
}

RichEmbed.prototype.error = function(title, description = null) {
    this.setTitle(title)
    this.setColor(parseInt("dc3545", 16))
    if(description) this.setDescription(description)
    return this
}

RichEmbed.prototype.warning = function(title, description = null) {
    this.setTitle(title)
    this.setColor(parseInt("ffc107", 16))
    if(description) this.setDescription(description)
    return this
}