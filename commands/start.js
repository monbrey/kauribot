const BaseCommand = require('./base')
const validator = require('validator')
const { RichEmbed } = require('discord.js')
const Pokemon = require('../models/pokemon')
const Trainer = require('../models/trainer')

module.exports = class StartCommand extends BaseCommand {
    constructor() {
        super({
            name: 'start',
            category: 'Game',
            description: 'Start playing URPG!',
            details: 'Your entry point into the world of URPG! Follow the prompts to select your starter Pokemon!',
            syntax: '!start',
            enabled: true,
            defaultConfig: { guild: false },
            guildOnly: true
        })
    }

    valid(p) {
        return {
            name: `You've selected ${p.displayName}${p.formName ? ' (' + p.formName + ')' : ''}!`,
            value: `In URPG, we have no four-move limit, so ${
                p.displayName
            } will start with all of the moves that it can learn level up. You can see a full list of ${
                p.displayName
            }’s moves here, on its [URPG Dex page](https://pokemonurpg.com/pokemon/${p.speciesName}).`
        }
    }

    invalid(p) {
        return `The starter you've chosen, ${p.displayName}${
            p.formName ? ' (' + p.formName + ')' : ''
        }, either doesn’t evolve, is an evolved form, or is on our exception list:\n\nDratini, Larvitar, Bagon, Kabuto, Omanyte, Scyther, Lileep, Anorith, Beldum, Porygon, Gible, Shieldon, Cranidos, Munchlax, Riolu, Tirtouga, Archen, Deino, Larvesta, Amaura, Tyrunt, Goomy.\n\nRemember that the Pokemon must be able to evolve, must be the lowest form in that evolution line, and must not be on the above list to be chosen as a starter.`
    }

    async getUsername(message, sentMessage, embed) {
        try {
            if (!embed.fields[1]) embed.addField('What name would you like your Trainer to be known as?', '\u200B')
            else embed.fields[1].value = '\u200B'
            sentMessage.edit(embed)

            let filter = m => m.author.id === message.author.id && !m.content.startsWith(message.client.prefix)

            let response = await message.channel.awaitMessages(filter, {
                maxMatches: 1,
                time: 30000
            })
            if (response.size == 0) {
                embed.fields[1].value = `Username input timed out. You can start again at any time with ${
                    message.client.prefix
                }start`
                sentMessage.edit(embed)
                return false
            }

            let username = response.first().content

            if (username.toLowerCase() === 'cancel') return null
            response.first().delete()

            if (await Trainer.usernameExists(username)) {
                message.channel.sendPopup('warn', 'A trainer with that name already exists')
                return await this.getUsername(message, sentMessage, embed)
            } else if (!validator.isAscii(username)) {
                message.channel.sendPopup('warn', 'The trainer name provided contains invalid (non-ASCII) characters')
                return await this.getUsername(message, sentMessage, embed)
            } else if (
                !validator.isLength(username, {
                    min: 1,
                    max: 64
                })
            ) {
                message.channel.sendPopup('warn', 'Trainer names must be between 1 and 64 characters')
                return await this.getUsername(message, sentMessage, embed)
            } else return username
        } catch (e) {
            message.client.logger.parseError(e, this.name)
        }
    }

    async confirmUsername(message, sentMessage, embed) {
        try {
            sentMessage.clearReactions()
            if (embed.fields.length == 3) embed.fields.splice(2)
            sentMessage.edit(embed)

            let username = await this.getUsername(message, sentMessage, embed)
            if (!username) return

            embed.fields[1].value = username
            embed.addField('Is this the name you would like to use?', '\u200B')
            await sentMessage.edit(embed)
            return (await sentMessage.reactConfirm(message.author.id))
                ? username
                : await this.confirmUsername(message, sentMessage, embed)
        } catch (e) {
            message.client.activeCommands.sweep(x => x.user === message.author.id && x.command === 'start')
            message.client.logger.parseError(e, this.name)
        }
    }

    async getStarter(message, sentMessage, embed) {
        try {
            if (!embed.fields[3])
                embed.addField(
                    'What Pokemon would you like to be your partner as you begin your URPG journey?',
                    '\u200B'
                )
            else embed.fields[3].value = '\u200B'
            sentMessage.edit(embed)

            let filter = m => m.author.id === message.author.id && !m.content.startsWith(message.client.prefix)

            let response = await message.channel.awaitMessages(filter, {
                maxMatches: 1,
                time: 30000
            })
            if (response.size === 0) {
                embed.fields[4].value = `Starter selection timed out. You can start again at any time with ${
                    message.client.prefix
                }start`
                sentMessage.edit(embed)
                return false
            }

            let query = response.first().content
            if (query.toLowerCase() === 'cancel') return
            response.first().delete()

            let exactMatch = await Pokemon.findOneExact(query)
            if (exactMatch) {
                if (exactMatch.starterEligible) return exactMatch
                else {
                    message.channel.sendPopup('longwarn', this.invalid(exactMatch))
                    return await this.getStarter(message, sentMessage, embed)
                }
            }

            let partialMatch = await Pokemon.findPartial(query)
            if (!partialMatch || partialMatch.length == 0) {
                message.channel.sendPopup(
                    'warn',
                    `Your request for ${query} did not match any Pokemon.\nPlease check your spelling and try again using the full name of the basic Pokemon.`
                )
                return await this.getStarter(message, sentMessage, embed)
            } else if (partialMatch.length == 1) {
                if (partialMatch[0].starterEligible) return partialMatch[0]
                else {
                    message.channel.sendPopup('longwarn', this.invalid(partialMatch[0]))
                    return await this.getStarter(message, sentMessage, embed)
                }
            } else {
                let validResults = partialMatch.filter(p => p.starterEligible)

                if (!validResults || validResults.length == 0) {
                    // No valid starters
                    message.channel.sendPopup(
                        'warn',
                        `Your request for ${query} matched multiple Pokemon, but none were eligible to be selected as a Starter Pokemon.\nPlease try again using the full name of the basic Pokemon.`
                    )
                    return await this.getStarter(message, sentMessage, embed)
                } else if (validResults.length == 1) {
                    // One valid starter
                    return validResults[0]
                } else {
                    let newList = validResults.map(p => p.uniqueName)
                    message.channel.sendPopup(
                        'warn',
                        `Multiple starter Pokemon matching "${query}" were found - the list of matching Pokemon is below.\nPlease try again using the Pokemon's full name.\n\n${newList.join(
                            '\n'
                        )}`
                    )
                    return await this.getStarter(message, sentMessage, embed)
                }
            }
        } catch (e) {
            message.client.activeCommands.sweep(x => x.user === message.author.id && x.command === 'start')
            message.client.logger.parseError(e, this.name)
        }
    }

    async confirmStarter(message, sentMessage, embed) {
        try {
            sentMessage.clearReactions()
            if (embed.fields.length == 5) embed.fields.splice(4)
            sentMessage.edit(embed)

            let starter = await this.getStarter(message, sentMessage, embed)
            if (!starter) return

            embed.fields[3].value = starter.uniqueName
            embed.fields.push(this.valid(starter))
            embed.setThumbnail(
                `https://pokemonurpg.com/img/models/${starter.dexNumber}${
                    starter.uniqueName.indexOf('Alola') > 0 ? '-alola' : ''
                }.gif`
            )
            embed.addField('Is this the Pokemon you want to start with?', '\u200B')

            await sentMessage.edit(embed)

            return (await sentMessage.reactConfirm(message.author.id))
                ? starter
                : await this.confirmStarter(message, sentMessage, embed)
        } catch (e) {
            message.client.activeCommands.sweep(x => x.user === message.author.id && x.command === 'start')
            message.client.logger.parseError(e, this.name)
        }
    }

    async run(message, args = [], flags = []) {
        // Check if the user already has a Trainer in the database
        let trainer = await Trainer.findById(message.author.id)
        if (trainer) {
            message.channel.send(
                'You have previously signed up for the URPG. To request a restart, please contact a Moderator.'
            )
            return message.client.activeCommands.find()
        } else
            trainer = new Trainer({
                _id: message.author.id
            })

        let embed = new RichEmbed()
            .setDescription('Reply with `cancel` to exit your Starter Request')
            .addField(
                'Welcome to the Pokemon Ultra Role Playing Game!',
                'To begin with, lets get some information about you, new Pokemon Trainer!'
            )

        let sentMessage = await message.channel.send(embed)

        let username = await this.confirmUsername(message, sentMessage, embed)
        if (username) {
            trainer.username = username
        } else return message.channel.sendPopup('info', 'Starter request cancelled.')

        embed.fields[2].name = `Okay ${username}, it's time to select your starter Pokemon!`
        embed.fields[2].value =
            'Remember that in URPG, you can choose any Pokemon that can evolve as your starter **__except__**:\nDratini, Larvitar, Bagon, Kabuto, Omanyte, Scyther, Lileep, Anorith, Beldum, Porygon, Gible, Shieldon, Cranidos, Munchlax, Riolu, Tirtouga, Archem, Deino, Larvesta, Amura, Tyrunt or Goomy.'
        await sentMessage.edit(embed)

        let starter = await this.confirmStarter(message, sentMessage, embed)
        if (!starter) return message.channel.sendPopup('info', 'Starter request cancelled.')

        try {
            let newTrainer = await trainer.save()
            if (newTrainer) {
                await newTrainer.addNewPokemon(starter)
                message.client.activeCommands.sweep(x => x.user === message.author.id && x.command === 'start')

                embed.fields[5].value = `Congratulations! New Trainer ${trainer.username} and ${
                    starter.displayName
                } registered.`
                sentMessage.edit(embed)
                // TODO: Preferred pronoun/role handling
            }
        } catch (e) {
            message.client.logger.parseError(e, this.name)
            return message.channel.sendPopup('error', 'Error saving new Trainer to the database')
        }

        message.client.logger.start(message, trainer, starter)
    }
}
