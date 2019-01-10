const BaseCommand = require("./base")
const TriviaQuestion = require("../models/triviaQuestion")

module.exports = class EvalCommand extends BaseCommand {
    constructor() {
        super({
            name: "trivia",
            aliases: ["e"],
            description: "Runs a trivia game in this channel",
            enabled: false,
            defaultConfig: true,
            requiresPermission: ["ADMINISTRATOR", "MANAGE_ROLES"]
        })

        this.running = null
    }

    async sendQuestion(channel) {
        let tq = await TriviaQuestion.random()
        await channel.send(tq.question)

        let answerFilter = m => m.content.toLowerCase().includes(tq.answer.toLowerCase()) && !m.author.bot
        try {
            let correctAnswer = await channel.awaitMessages(answerFilter, {
                max: 1,
                time: 45000,
                errors: ["time"]
            })
            channel.send(`${correctAnswer.first().member} got the answer: \`${tq.answer}\``)
        } catch (e) {
            channel.send(`Nobody got the answer: \`${tq.answer}\``)
        } finally {
            if(this.running) {
                setTimeout(() => { this.sendQuestion(channel) }, 15000)
            } 
        }
    }

    async run(message, args = [], flags = []) {
        let toggle = args[0]

        if (toggle === "start") {
            if (this.running) {
                return message.channel.send("Trivia is already running")
            }

            this.running = true
            this.sendQuestion(message.channel)
        }
        if (toggle === "stop") {
            this.running = false
            message.channel.send("Trivia will stop after any queued questions are completed.")

        }
    }
}
