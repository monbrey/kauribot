const mongoose = require('mongoose')

let colorSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    }
})

colorSchema.plugin(require('mongoose-plugin-autoinc').autoIncrement, {
    model: 'Color',
    startAt: 1
})

colorSchema.statics.getColorForType = async function(type) {
    const colors = await this.find({}).cache(0, 'type-colors')
    const pair = colors.find(c => c.key === type)
    if (pair) return pair.color
    else return '0x000000'
}

module.exports = mongoose.model('Color', colorSchema)
