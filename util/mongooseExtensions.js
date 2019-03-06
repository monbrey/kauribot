const { Model } = require("mongoose")
const strsim = require("string-similarity")

Object.defineProperties(Model, {
    /**
     * Uses the string-similarity library to find the closest match to a particular field
     * @param {String} - The field to match 
     * @param {String} - The value to find similarity to
     * @param {Object} - Any additional query parameters
     * @returns {Promise<Document>}
     */
    findClosest: {
        value: async function(field, value, query = {}, threshold = 0.33) {
            const allValues = (await this.find({}).select(`${field} -_id`).cache()).map(x => x[field])
            const closest = strsim.findBestMatch(value, allValues).bestMatch
            if(closest.rating < threshold) return null
            query[field] = closest.target
            const closestObject = await this.findOne(query)
            closestObject.matchRating = closest.rating
            return closestObject
        }
    }
})