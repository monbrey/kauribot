const mongoose = require("mongoose")
const cachegoose = require("cachegoose")
const logger = require("./logger")
const fs = require("fs")

cachegoose(mongoose, {})

mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGODB_URI, {
    useFindAndModify: false,
    useNewUrlParser: true
})
mongoose.set("useCreateIndex", true)

let db = mongoose.connection

db.on("connected", async () => {
    const Pokemon = require("../models/pokemon")
    const Mega = require("../models/mega")

    let allMegas = await Mega.find({})
    allMegas.sort((a,b) => a.displayName.localeCompare(b.displayName))

    fs.writeFile("./mega.json", JSON.stringify(allMegas, null, 4), err => {
        console.log("Done")
    })
})

db.on("error", async (err) => {
    logger.error(`Mongoose default connection error: ${err}`)
})

db.on("disconnected", async () => {
    logger.warn("Mongoose default connection disconnected")
})

module.exports = db
