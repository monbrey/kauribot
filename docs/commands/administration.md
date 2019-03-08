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

**Usage**

- `Command`: The name of a bot command  
- `switch`: [enable | disable | clear]. If no switch is provided, the current status of the command is returned
- `TextChannel`: Any number of TextChannel mentions. Toggles the command for use in that channel. If none are provided, server-level configuration will be set.
- `Role`: Any number of Role mentions, or strings in the format @rolename if the role is not mentionable. Toggles authorisation for a Role to use the command at the server level.

**Examples**

`!config -disable mart` - Disable the `mart` command at the server level  
`!config -enable mart #questions-approvals` - Enable the `mart` command in #questions-approvals only  
`!config -clear mart` - Reset the configuration for `mart` to the defaults

**Notes**

- `Role` and `TextChannel` settings cannot be combined, eg you cannot enable one Role in a certain TextChannel, while enabling another Role in a different TextChannel.
- Known Issue: `-clear` does not remove channel/role configuration