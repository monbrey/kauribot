module.exports = async (array, promiseFunc) => {
    return await array.reduce(async (previousPromise, next) => {
        await previousPromise
        return promiseFunc(next)
    }, Promise.resolve())
}