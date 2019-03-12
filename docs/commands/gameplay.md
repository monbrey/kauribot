---
layout: default
title: Gameplay
parent: Commands
permalink: /commands/gameplay
nav_order: 1
---

# Gameplay Commands
{: .no_toc }

1. TOC
{:toc}

## Dice

URPG's most core function - dice rolling

**Default Settings**

Enabled for everyone

**Syntax**

`!dice [-v] <x|y,x>...`

**Aliases**

- `!d`
- `!roll-dice`

**Parameters**

- `x` - An integer > 0. Rolls a single x-sided die
- `y,x` - Two integers > 0. Rolls y-dice of x-sides

Any number of parameters in the two formats can be included, separated by spaces  
Arguments of the second type which have an invalid side, eg `,6` `6,` `0,6` will be read as `6`

- `-v` - Provide a verification ID for the dice-roll

**Examples**

- `!d 100` - Roll a 100-sided dice
- `!d 2,10` - Roll two 10-sided dice
- `!d 2,100 8` - Roll two 100-sided dice and an 8-sided die



# FFA

Subscribe to, remove from or ping the FFA Subscriber List

**Default Settings**

Enabled for everyone to subscribe/unsubscribe  
Pinging only avaialble to referees in FFA channels

**Syntax**

`!ffa <-add|-remove|-ping>`

**Parameters**

- `-add | -a` - Subscribe to FFA notifications
- `-remove | -r` - Unsubscribe from FFA notifications
- `-ping | -p` - Ping all FFA subscribers