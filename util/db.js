const mongoose = require('mongoose')
const cachegoose = require('cachegoose-events')
const logger = require('./logger')

cachegoose(mongoose, {})
const { cache } = cachegoose

mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGODB_URI, {
    useFindAndModify: false,
    useNewUrlParser: true
})
mongoose.set('useCreateIndex', true)

let db = mongoose.connection

db.on('connected', async () => {
    logger.info({ message: 'Mongoose database connection established', key: 'db' })
})

db.on('error', async err => {
    logger.parseError(err, 'db')
})

db.on('disconnected', async () => {
    logger.warn({ message: 'Mongoose default connection disconnected', key: 'db' })
})

cache.on('get', key => {
    logger.debug(`Fetched ${key} from database cache`)
})

cache.on('set', key => {
    logger.debug(`Set ${key} in database cache`)
})

cache.on('del', key => {
    logger.debug(`Deleted ${key} from database cache`)
})

module.exports = { db, cache }
