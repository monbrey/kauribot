const mongoose = require("mongoose")
const cachegoose = require("cachegoose")
const logger = require("./logger")

cachegoose(mongoose, {})

mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGODB_URI, {
    useFindAndModify: false,
    useNewUrlParser: true
})
mongoose.set("useCreateIndex", true)

let db = mongoose.connection

db.on("connected", async () => {
    logger.info({ message: "Mongoose database connection established", key: "db" })
})

db.on("error", async (err) => {
    logger.error({ ...err, key: "db" })
})

db.on("disconnected", async () => {
    logger.warn({ message: "Mongoose default connection disconnected", key: "db"})
})

module.exports = db