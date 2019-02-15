const request = require("request-promise-native")
const logger = require("./logger")

module.exports = async (pokemon) => {
    const assets = {}
    try { 
        await request.head(`https://img.pokemondb.net/sprites/sun-moon/normal/${pokemon.uniqueName.toLowerCase()}.png`) 
        assets.image = `https://img.pokemondb.net/sprites/sun-moon/normal/${pokemon.uniqueName.toLowerCase()}.png`
    } catch (e) { 
        try {
            await request.head(`https://img.pokemondb.net/sprites/x-y/normal/${pokemon.uniqueName.toLowerCase()}.png`) 
            assets.image = `https://img.pokemondb.net/sprites/x-y/normal/${pokemon.uniqueName.toLowerCase()}.png`
        } catch (e) {
            logger.warn(`No image found for ${pokemon.uniqueName}`, { "key": "getAsset" })
        }
    }
    try { 
        await request.head(`https://img.pokemondb.net/sprites/sun-moon/icon/${pokemon.uniqueName.toLowerCase()}.png`) 
        assets.icon = `https://img.pokemondb.net/sprites/sun-moon/icon/${pokemon.uniqueName.toLowerCase()}.png`
    } catch (e) { 
        logger.warn(`No icon found for ${pokemon.uniqueName}`, { "key": "getAsset" })
    }

    return assets
}