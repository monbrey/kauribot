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

---

## Start

Join the URPG and create your Trainer profile/account.  
Users will be taken through a series of prompts requesting the required information to start playing URPG

**Default Settings**

Enabled for everyone who has not yet created a bot-based profile

**Syntax**

`!start`

---

## FFA

Subscribe to, be removed from, or ping the FFA Subscriber List

**Default Settings**

Enabled for everyone to subscribe/unsubscribe  
Pinging only avaialble to referees in FFA channels

**Syntax**

`!ffa <-add|-remove|-ping>`

**Parameters**

- `-add | -a` - Subscribe to FFA notifications
- `-remove | -r` - Unsubscribe from FFA notifications
- `-ping | -p` - Ping all FFA subscribers

---

## Trainer

View a Trainer account profile 

**Default Settings**

Enabled for everyone who has a Trainer profile/account created via `!start`

**Syntax**

`!trainer [Trainer]`

**Parameters**

- `Trainer` - View the profile of [Trainer]. If not provided, view your own profile.

**Notes**:

This command also provides paginated access to `!roster` and `!inventory`, which act as alternate entry points to the profile pages  
~~When viewing your own profile, an additional reaction will allow you access to edit some fields (eg stats links)~~

---

## Roster

View the roster page of the Trainer account profile: see `!trainer`

**Syntax** 

`!roster [Trainer]`

---

## Inventory

View the inventory page of the Trainer account profile: see `!trainer`

**Syntax**

`!inventory [Trainer]`

---

## Mart

Browse the URPG Pokemart from within Discord via a paginated interface!

**Syntax**

`!mart <category>`

**Parameters**

- `category` - `<pokemon|items>`. Browse stock in the selected category

An embedded Pokemart of displayed 12 items per page will be shown in Discord  
The pages can be scrolled through using the reactions underneath the Embed  
The controls will time out after 30 seconds with no activity

---

## Buy

Purchase Pokemon and items or unlock moves and abilities on your Pokemon

**Syntax**

`!buy <category>`

**Parameters**

- `category` - `<pokemon|items|moves|ability>` - Select stock to purchase from the selected category



---

## Underground

---

## Ref Log

---

## Judge Log

---

## Pay

---

## Deduct



