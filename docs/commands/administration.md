---
layout: default
title: Admin
parent: Commands
permalink: /commands/administration
nav_order: 3
---

# Administration Commands
{: .no_toc }

1. TOC
{:toc}

## Config

Allows specific commands to be enabled or disabled at the server and channel level

**Default Permissions**

`ADMINISTRATOR` only

**Syntax**

`!config <-switch> <Command> [TextChannel]...`

**Usage**

Switches: enable | disable | clear  
Command: The name of a bot command  
TextChannel: Any number of channel mentions to toggle the command in. If none are provided, server-level configuration will be set.

**Examples**

`!config -disable mart` - Disable the `mart` command at the server level  
`!config -enable mart #questions-approvals` - Enable the `mart` command in #questions-approvals only  
`!config -clear mart` - Reset the configuration for `mart` to the defaults  

Note: `-clear` has a known issue to be addressed shortly.