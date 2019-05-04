const { Message, TextChannel, DMChannel } = require('discord.js')
const { Model } = require('mongoose')

const { reactConfirm, paginate, isFromOwnerGetter } = require('./message')
Object.defineProperties(Message.prototype, {
    reactConfirm: { value: reactConfirm },
    reactPaginator: { value: paginate },
    isFromOwner: { get: isFromOwnerGetter }
})

const { sendAndDelete, sendPopup } = require('./channel')
Object.defineProperties(TextChannel.prototype, {
    sendAndDelete: { value: sendAndDelete },
    sendPopup: { value: sendPopup }
})

Object.defineProperties(DMChannel.prototype, {
    sendAndDelete: { value: sendAndDelete },
    sendPopup: { value: sendPopup }
})

const { findClosest, findAllClosest } = require('./model')
Object.defineProperties(Model, {
    findClosest: { value: findClosest },
    findAllClosest: { value: findAllClosest }
})

const { between } = require('./number')
Object.defineProperties(Number.prototype, {
    between: { value: between }
})
