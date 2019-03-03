const { Message, TextChannel, DMChannel, RichEmbed } = require("discord.js")
const EMBED_COLORS = {
    "ERROR": 0xE50000,
    "WARN": 0xFFC107,
    "CANCEL": 0x004A7F,
    "SUCCESS": 0x267F00
}

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
            if (back && !this.reactions.has("⬅")) {
                if(this.reactions.has("➡")) await this.reactions.get("➡").remove()
                await this.react("⬅")
            }
            if (!back && this.reactions.has("⬅")) await this.reactions.get("⬅").remove()
            if (next && !this.reactions.has("➡")) await this.react("➡")
            if (!next && this.reactions.has("➡")) await this.reactions.get("➡").remove()

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
    "sendAndDelete": {
        /**
         * @param {StringResolvable} [content] - Text for the message
         * @param {MessageOptions|Attachment|RichEmbed} options - Options for the message, can also be just a RichEmbed or Attachment
         * @param {Number} [timer] - How long to wait to delete the message in milliseconds
         */
        value: async function(content, options, timer) {
            if (!timer && typeof (options) === "number") {
                timer = options
                options = undefined
            } else if (!timer) {
                timer = 10000
            }

            const m = await this.send(content, options)
            return m.delete(timer)
        }
    },
    "sendPopup": {
        value: async function(type, description = null, timeout = null) {
            if (!type) throw new Error("A popup type must be specified")
            if (timeout === null && typeof (description) === "number") {
                timeout = description
                description = null
            }

            let embed = new RichEmbed({ color: EMBED_COLORS[type.toUpperCase()] })
                .setDescription(description)

            if (timeout === 0 || type === "error") return this.send(embed)
            else return this.sendAndDelete(embed, timeout)
        }
    }
})

Object.defineProperties(DMChannel.prototype, {
    "sendAndDelete": {
        /**
         * @param {StringResolvable} [content] - Text for the message
         * @param {MessageOptions|Attachment|RichEmbed} options - Options for the message, can also be just a RichEmbed or Attachment
         * @param {Number} [timer] - How long to wait to delete the message in milliseconds
         */
        value: async function(content, options, timer) {
            if (!timer && typeof (options) === "number") {
                timer = options
                options = undefined
            } else if (!timer) {
                timer = 5000
            }

            const m = await this.send(content, options)
            return m.delete(timer)
        }
    },
    "sendPopup": {
        value: async function(type, description = null, timeout = null) {
            if (!type) throw new Error("A popup type must be specified")
            if (timeout === null && typeof (description) === "number") {
                timeout = description
                description = null
            }

            let embed = new RichEmbed({ color: EMBED_COLORS[type.toUpperCase()] })
                .setDescription(description)

            if (timeout === 0 || type === "error") return this.send(embed)
            return this.sendAndDelete(embed, timeout)
        }
    }
})