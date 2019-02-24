/**
 * @param {Object}              [query={}]
 * @param {Object}              [options={}]
 * @param {Object|String}         [options.select]
 * @param {Object|String}         [options.sort]
 * @param {Array|Object|String}   [options.populate]
 * @param {Number}                [options.page=1]
 * @param {Number}                [options.limit=10]
 * @param {Function}            [callback]
 *
 * @returns {Promise<Object>}
 */
let paginate = async function(query = {}, options = {}, sortFunc, page = 1, limit = 12) {
    let docs = await this.find(query, null, options).lean().cache(0)
    let count = docs.length
    let next = (page * limit) < docs.length ? page + 1 : false
    let prev = page > 1 ? page - 1 : false
    let pages = Math.ceil(count / limit)

    if(sortFunc) docs.sort(sortFunc)

    return {
        "docs": docs.slice((page - 1) * limit, page * limit),
        "count": count,
        "page": page,
        "next": next,
        "prev": prev,
        "pages": pages
    }
}

module.exports = function(schema) {
    schema.statics.paginate = paginate
}

module.exports.paginate = paginate
