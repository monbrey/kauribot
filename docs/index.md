# urpg-discord

Repository hosted by Monbrey, developed by anyone who is interested.

## Installation

To get up and running with your own development version of the URPG Discord bot

1. Create a fork of the urpg-discord repository, or ask me for collaborator access to this repository
2. Clone the forked repository
3. Run `npm install` to install all required npm packages and dependencies
4. Create an app on the [Discord Developer Portal](https://discordapp.com/developers/docs/intro)
5. Create a Bot user for the app and copy the token to `./app/config.js` under DISCORD_TOKEN
6. Generate an OAuth2 URL. Leave the default **Bot** selected.
7. Open the provided URL in a browser window to add your bot to a server, or provide the URL to server owners
8. Enter a connection URI in `.app/config.js` for a MongoDB under MONGODB_URI. I can provide the URI for the existing database
9. Run `git update-index --assume-unchanged .\app\config.js` to prevent Git from trying to commit the config file - those tokens should not be made public
10. Run `node index.js` to launch the bot

## Developing and contributing changes

### Developers

Any development to urpg-dicebot should be done in a forked repository or separate branch.
When changes are tested and ready for the Production version, submit a [Pull Request](https://help.github.com/articles/about-pull-requests/) from your fork/branch for review

### Community

You don't have to be a developer to help out with the project! Anyone in the URPG can create [issues](https://github.com/Monbrey/urpg-discord/issues) for bugs or feature requests which can be worked on by the developers.

## The modular structure of the bot

urpg-discord is derived from the modular structure written for urpg-dicebot. All event handlers (except 'ready') and commands are loaded automatically in `./app/urpgbot.js` from the relevant directories. urpg-discord uses the [Discord.js](https://discord.js.org/#/) API library.

### Events

Events documented under the [Client](https://discord.js.org/#/docs/main/stable/class/Client) interface can be handled by event handlers.

Event handlers go in the `./app/events` directory, and should be match the name of the event handler. For example, the 'message' event is in `./app/events/message.js`.

The event handler module should export an event handler function which takes the **client (urpgbot)** and any **event parameters**

```javascript
module.exports = (urpgbot, message) => {
    //Handle the message event
}
```

### Commands

Commands are custom modules for the purposes of interacting with Discord. Commands modules go in the `./app/commands` directory. Current naming convention matches the command.

The **message** event handler is responsbile for translating any message the bot receives into commands, extracting any flags or arguments, then running the command logic. It is recommended you read through `./app/events/message.js` and understand it's workflow. I tried to give it good commenting.

There are three required exports and one optional export in each command module

**exports.conf**

The **conf** exports provides the configuring for calling the command.

 - conf.name - \<string\> - The name of the command by which it can be called
 - conf.enabled - \<boolean\> - Determines if this command should be loaded or not
 - conf.aliases - \<Array\> - Any alternate names by which this command can be called. Optional

```javascript
exports.conf = {
    name: "d",
    enabled: true,
    aliases: ['dice','roll-dice']
}
```
**exports.help**

The **help** object is used to build help text when the command is run with the `-h` flag.
The shortDesc is output when viewing the whole list of commands.
The description is used when requesting help with a specific command.

```javascript
exports.help = {
    name: "d, dice, roll-dice",
    category: "Game",
    shortDesc: "Roll one or more die",
    description: "Rolls an x-sided dice, or y-number of x-sided dice",
    usage: `
!d [x]                          Roll one [x] sided die
!d [y],[x]                      Roll [y] [x] sided dice
!d -v [x] | !d -v [y],[x]       Roll with verification ID

All variables will only accept positive integers`
}
```

**exports.run**

The **run** object is the function responsible for handling the command. All **run** functions take three parameters

 - urpgbot - The Discord.js [Client](https://discord.js.org/#/docs/main/stable/class/Client) object. Can be used for all interactions with Discord
 - message - The [Message](https://discord.js.org/#/docs/main/stable/class/Message) object which was passed through the message event handler
 - args - The command arguments which were extracted from the message event handler. Any arguments which mention a user will be converted to the full [GuildMember](https://discord.js.org/#/docs/main/stable/class/GuildMember) object.

In most cases the **Client** object is not required, as message handling can be entirely with the **Message**. It is *strongly recommended* that you familiarise yourself with the **Message** object and how to use it.

```javascript
exports.run = (urpgbot, message, args) => {
    message.author.send("It's really easy to reply to the author of the message")
    message.channel.send("Or reply in the public channel in which the message was sent")
    message.react(':O') //But seriously, learn how to use this.
}
```

**exports.init** (Optional)

Similar to **run**, **init** is a function which runs before the command is loaded into the bot to be called by users. It takes only the **Client** object as a parameter. Any preparation that must be done for your command to work (checking the server/environment etc) should be done here.

A command template can be found [here](template.js)
