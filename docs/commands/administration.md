---
layout: default
title: Admin
parent: Commands
permalink: /commands/admin
nav_order: 3
---

# Administration Commands
{: .no_toc }

1. TOC
{:toc}

## Config

Allows specific commands to be enabled or disabled at the server and channel level

**Default Permissions**

`@moderator` only

**Syntax**

`!config <Command> [-switch] [TextChannel|Role]...`

**Parameters**

- `Command` - The name of a bot command  
- `switch`: `[enable|disable|clear]` - If no switch is provided, the current status of the command is returned
- `TextChannel` - Any number of TextChannel mentions. Toggles the command for use in that channel. If none are provided, server-level configuration will be set.
- `Role` - Any number of Role mentions, or strings in the format @rolename if the role is not mentionable. Toggles authorisation for a Role to use the command at the server level.

**Examples**

- `!config mart` - Show the current configuration of the `mart` command
- `!config -disable mart` - Disable the `mart` command at the server level  
- `!config -enable mart #questions-approvals` - Enable the `mart` command in #questions-approvals only
- `!config -enable pay @official` - Allow officials to use the `pay` command
- `!config -clear mart` - Reset the configuration for `mart` to the defaults

**Notes**

- `Role` and `TextChannel` settings cannot be combined, eg you cannot enable one Role in a certain TextChannel, while enabling another Role in a different TextChannel.
- Known Issue: `-clear` does not remove channel/role configuration
- Known Issue: `Role` permissions are a work in progress. It is not recommend to add a role to commands that should be available to everyone.

## Logs

The Logs command gets or sets the destination channel for logging output

**Default Permissions**

`@moderator` only

**Syntax**

`!logs [TextChannel]`

**Parameters**

- `TextChannel` - The text channel to output logs to

**Examples**

- `!logs` - Show the current logging channel
- `!logs #bot-logs` - Set the logging channel to #bot-logs

## Starboard

The Starboard is an automated quote compilation - Discord messages that receive enough of the set reaction (default one ⭐) will be reposted in the set channel.  
The Starboard command gets or sets the starboard settings. 

**Default Permissions**

`@moderator` only

**Syntax**

`!starboard [-setting] [TextChannel|Number|Emoji]`

**Parameters**

- `setting` - `[channel|emoji|reacts]`. If no setting is specified, the default is `channel`
- `TextChannel` - The text channel to repost quotes to if the `channel` setting is provided
- `Number` - The number of reactions to require if the `reacts` setting is provided
- `Emoji` - The emoji to listen for if the `emoji` setting is provided. Accepts custom emoji
- If no TextChannel/Number/Emoji is provided with their corresponding setting flag, the current setting will be shown

**Examples**

- `!starboard` - Show the current Starboard channel
- `!starboard -channel #starboard` - Set the Starboard channel to #starboard
- `!starboard -reacts 3` - Require a minimum of three reactions
- `!starboard -emoji ⭐` - Set the emoji to ⭐