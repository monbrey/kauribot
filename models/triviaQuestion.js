const mongoose = require("mongoose")

let triviaQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        reuqired: true
    }
})

triviaQuestionSchema.plugin(require("mongoose-plugin-autoinc").autoIncrement, {
    model: "TriviaQuestion",
    startAt: 1
})

triviaQuestionSchema.statics.random = async function () {
    let question = await this.aggregate([
        { $sample: { size: 1 }}
    ])

    return new this(question[0])
}

module.exports = mongoose.model("TriviaQuestion", triviaQuestionSchema)