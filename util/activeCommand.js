const { SnowflakeUtil } = require('discord.js')

module.exports = (() => {
    return {
        check(user) {
            user.client.activeCommands.find(ac => ac.user === user.id && ac.command === this.name)
        },
        set(user) {
            const snowflake = SnowflakeUtil.generate(Date.now())
            user.client.activeCommands.set(snowflake, {
                user: user.id,
                command: this.name,
                timestamp: Date.now()
            })
        },
        clear(user) {
            user.client.activeCommands.sweep(ac => ac.user === user.id && ac.command === this.name)
        }
    }
})()
