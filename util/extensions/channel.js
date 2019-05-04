const { RichEmbed } = require('discord.js')

const EMBED_COLORS = {
    error: 0xe50000,
    warn: 0xffc107,
    longwarn: 0xffc107,
    cancel: 0x004a7f,
    success: 0x267f00,
    info: 0xffffff
}

/**
 * @param {StringResolvable} [content] - Text for the message
 * @param {MessageOptions|Attachment|RichEmbed} options - Options for the message, can also be just a RichEmbed or Attachment
 * @param {Number} [timer] - How long to wait to delete the message in milliseconds
 */
const sendAndDelete = async function(content, options, timer) {
    if (!timer && typeof options === 'number') {
        timer = options
        options = undefined
    } else if (!timer) {
        timer = 10000
    }

    const m = await this.send(content, options)
    return m.delete(timer)
}

/**
 * @param {String} type - The type of popup to show
 * @param {String} [description] - Content for the embed
 * @param {Number} [timer] - How long to wait to delete the message in milliseconds
 */
const sendPopup = async function(type, description = null, timeout = 0) {
    if (!type) throw new Error('A popup type must be specified')
    if (timeout === null && typeof description === 'number') {
        timeout = description
        description = null
    }

    let embed = new RichEmbed({ color: EMBED_COLORS[type] }).setDescription(description)

    if (timeout === 0) this.send(embed)
    else this.sendAndDelete(embed, timeout)
    return
}

module.exports = { sendAndDelete, sendPopup }
