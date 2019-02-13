const { Message, TextChannel, RichEmbed } = require("discord.js")

Object.defineProperties(Message.prototype, {
    /**
     * Adds confirmation reactions to the message and listens to the response
     * @param {String} [listenTo=''] The ID of the user to listen to
     * @param {number} [timeout=30000] How long to wait for reactions 
     * @returns {Promise<boolean>}
     */
    reactConfirm: {
        value: async function(listenTo, timeout = 30000) {
            await this.react("✅")
            await this.react("❌")

            let filter = (reaction, user) => ["✅", "❌"].includes(reaction.emoji.name) && user.id === listenTo
            let response = await this.awaitReactions(filter, {
                max: 1,
                time: timeout
            })

            if (!response.first()) return false
            return response.first().emoji.name === "✅" ? true : false
        }
    },

    /**
     * Adds pagination controls to the message and listens to the response
     * @param {String}      [listenTo=''] - The ID of the user to listen to
     * @param {Boolean}     [back] - Should the back button be displayed
     * @param {Boolean}     [next] - Should the next button be displayed
     * @param {number}      [timeout=30000] - How long to wait for reactions 
     * @returns {Promise<boolean>}
     */
    reactPaginator: {
        value: async function(listenTo, back, next, timeout = 30000) {
            // If we only have the 'forward' reaction, we want to remove it and put the 'back' in first
            if (this.reactions.has("➡") && !this.reactions.has("⬅")) await this.clearReactions()
            if (back && !this.reactions.has("⬅")) await this.react("⬅")
            if (next && !this.reactions.has("➡")) await this.react("➡")

            let filter = (reaction, user) => ["⬅", "➡"].includes(reaction.emoji.name) && user.id === listenTo

            try {
                let response = await this.awaitReactions(filter, {
                    max: 1,
                    time: timeout
                })

                // Reset the selection
                await response.first().remove(listenTo)
                return response.first().emoji.name === "➡" ? true : false
            } catch (e) {
                this.clearReactions()
                return null
            }
        }
    },
    cancellableDelete: {
        value: async function(timeout) {
            this.deleteTimer = setTimeout(() => { this.delete() }, timeout)
            return this
        }
    },
    cancelDelete: {
        value: async function() {
            clearTimeout(this.deleteTimer)
            return this
        }
    }
})

Object.defineProperties(TextChannel.prototype, {
    deleteAfterSend: {
        /**
         * @param {StringResolvable} [content] - Text for the message
         * @param {MessageOptions|Attachment|RichEmbed} options - Options for the message, can also be just a RichEmbed or Attachment
         * @param {Number} [timer] - How long to wait to delete the message in milliseconds
         */
        value: async function(content, options, timer) {
            if (!timer && typeof (options) === "number") {
                timer = options
                options = undefined
            } else {
                timer = 5000
            }

            const m = await this.send(content, options)
            return m.delete(timer)
        }
    }
})

Object.defineProperties(RichEmbed, {
    error: {
        value: function(title = null, description = null) {
            let embed = new this().setColor("0xE50000")

            if (title) embed.setTitle(title)
            if (description) embed.setDescription(description)

            return embed
        }
    },
    warning: {
        value: function(title = null, description = null) {
            let embed = new this().setColor("0xffc107")

            if (title) embed.setTitle(title)
            if (description) embed.setDescription(description)

            return embed
        }
    },
    cancel: {
        value: function(title = null, description = null) {
            let embed = new this().setColor("0x004A7F")

            if (title) embed.setTitle(title)
            if (description) embed.setDescription(description)

            return embed
        }
    }
})