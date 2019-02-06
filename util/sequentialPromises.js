module.exports = async (array, promiseFunc) => {
    return await array.reduce(async (previousPromise, next) => {
        console.log(previousPromise)
        await previousPromise
        return promiseFunc(next)
    }, Promise.resolve())
}