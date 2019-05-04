const between = function(a, b) {
    const min = Math.min.apply(Math, [a, b]),
        max = Math.max.apply(Math, [a, b])
    return this >= min && this <= max
}

module.exports = { between }
