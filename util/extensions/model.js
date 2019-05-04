const strsim = require('string-similarity')

class PartialMatch {
    constructor(query, rating) {
        this.query = query
        this.rating = rating
    }
}

/**
 * Uses the string-similarity library to find the closest match to a particular field
 * @param {String} - The field to match
 * @param {String} - The value to find similarity to
 * @param {Object} - Any additional query parameters
 * @returns {PartialMatch}
 */
const findClosest = async function(field, value, threshold = 0.33) {
    const values = await this.find({})
        .sort('_id')
        .select(`_id ${field}`)
        .cache(0, `${this.modelName.toLowerCase()}-${field}`)

    const matchValues = values.map(x => x[field])
    const closest = strsim.findBestMatch(value, matchValues).bestMatch

    if (closest.rating < threshold) return null

    const closestId = values.find(x => x[field] === closest.target)._id
    return new PartialMatch(this.findById(closestId), closest.rating)
}

const findAllClosest = async function(field, value, threshold = 0.33) {
    const values = await this.find({})
        .sort('_id')
        .select(`_id ${field}`)
        .cache(0, `${this.modelName.toLowerCase()}-${field}`)

    const matchValues = values.map(x => x[field])
    const closest = strsim.findBestMatch(value, matchValues).bestMatch

    if (closest.rating < threshold) return null

    const query = {}
    query[field] = value

    return new PartialMatch(this.find(query), closest.rating)
}

module.exports = { findClosest, findAllClosest }
