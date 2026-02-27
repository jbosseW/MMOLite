# MMOLite — Complete Systems Reference (Team 2 Audit Package)

**Generated:** February 26, 2026

> **Server entry:** `server.js` → `socket.js` (handler registration)
> **Client entry:** `client/main.lua` → `client/scenes/game.lua`
> **Data layer:** `rpg-data.js` (7,266 lines), `dungeon-data.js` (5,761 lines), `dungeon-combat.js` (9,691 lines), `dungeon-ai.js`
> **Accounts:** `accounts.js` (encrypted file storage, XP, cards, inventory)
> **State:** `state.js` (in-memory ephemeral: zones, positions, guilds, battles)

---

## Table of Contents

1. [Card System](#1-card-system)
2. [Gacha Mechanics](#2-gacha-mechanics)
3. [Card Fusion](#3-card-fusion)
4. [Card Equipping & Slots](#4-card-equipping--slots)
5. [Card Economy (Vendor / Auction / Trading)](#5-card-economy)
6. [Combat Engine](#6-combat-engine)
7. [Combat Actions & Resources](#7-combat-actions--resources)
8. [Damage Calculation](#8-damage-calculation)
9. [Status Effects](#9-status-effects)
10. [Boss Mechanics](#10-boss-mechanics)
11. [Enemy System](#11-enemy-system)
12. [Dungeon System](#12-dungeon-system)
13. [Race System](#13-race-system)
14. [Stat System](#14-stat-system)
15. [Skills System](#15-skills-system)
16. [Economy & NPC Shops](#16-economy--npc-shops)
17. [Crafting](#17-crafting)
18. [World & Biomes](#18-world--biomes)
19. [Overworld Monsters](#19-overworld-monsters)
20. [Guilds, Parties, Social](#20-guilds-parties-social)
21. [Mount System](#21-mount-system)
22. [Director System](#22-director-system)
23. [Resources List](#23-resources-list)
24. [Key Constants & Tuning](#24-key-constants--tuning)
25. [Known Gaps & Stubs](#25-known-gaps--stubs)

---

## 1. Card System

> **Source files:** `rpg-data.js:941` (CARD_TEMPLATES), `rpg-data.js:5525` (CARD_STYLES), `handlers/rpg-cards.js` (pack/fuse/equip handlers), `accounts.js:3378` (equipRpgCard), `accounts.js:3552` (getEquippedCardEffects)

**817 unique card templates** across 8 types:

| Card Type | Count | Description |
|-----------|-------|-------------|
| `stat_boost` | 21+ | +1/+2/+3 to each of 7 stats |
| `skill_boost` | 9+ | % XP bonuses to skills |
| `passive_perk` | 200+ | HP regen, dodge, crit, speed, resist, etc. |
| `active_ability` | 150+ | Fireball, heal, lightning, shadow strike, etc. |
| `racial_feat` | 40+ | Race-specific bonuses (bonus if matching race) |
| `gathering_boost` | 30+ | Yield and XP for resource gathering |
| `equipment_modifier` | 20+ | Armor/weapon enhancements |
| `reactive` | 10+ | Conditional triggered effects |

**25+ Archetypes:** melee_dps, glass_cannon, tank, pure_defense, support, assassin, scout, cc_dot, grappler, aquatic, night_hunter, utility, and more.

### 8 Rarity Tiers

| Rarity | Weight | Rate | Color |
|--------|--------|------|-------|
| Common | 4500 | 45.0% | Gray |
| Uncommon | 2500 | 25.0% | Green |
| Rare | 1500 | 15.0% | Blue |
| Ultra Rare | 800 | 8.0% | Purple |
| Mythic Rare | 400 | 4.0% | Orange |
| Legendary | 200 | 2.0% | Orange-Red |
| Godly | 80 | 0.8% | Red |
| Relic | 20 | 0.2% | White |

### 5 Card Styles

| Style | Drop Rate | Sell Multiplier | Special |
|-------|-----------|-----------------|---------|
| Normal | 80.0% | 1.0x | — |
| Holographic | 12.0% | 1.5x | Rainbow shimmer |
| Golden | 5.0% | 2.0x | Gold glow |
| Prismatic | 2.5% | 3.0x | Prismatic shift |
| Void Edition | 0.5% | 5.0x | +10% effect values |

### 351 Unique Effect Types

**Offense (80+):** damage, bonus_damage, aoe_damage, melee_damage_bonus, spell_damage_bonus, spell_damage_mult, crit_bonus, crit_damage_bonus, crit_damage_mult, lifesteal, on_hit_poison, on_hit_bleed, proc_explosion, stealth_attack_bonus, boss_damage_bonus, dungeon_damage_bonus, execute_threshold, chain_attack, double_attack, momentum_damage, soul_shards, etc.

**Defense (40+):** armor_bonus, damage_reduction, flat_damage_reduction, shield, hp_bonus, hp_regen, hp_multiplier, mana_shield, damage_reflect, parry_chance, block_chance, block_damage_reduction, last_stand, fortress, damage_sponge, adaptive_resist, cc_immunity, debuff_resist, etc.

**Control (60+):** stun, slow, fear, knockback, taunt, dispel, cooldown_reduction, blind, root, grapple, silence, charm, polymorph, etc.

**Resources (30+):** mana_regen, mana_restore, resource_cost_reduction, resource_max_bonus, bloodlust_on_kill, focus_consecutive_bonus, resource_retain_on_switch, resource_decay_reduction, etc.

**Crafting/Gathering (20+):** craft_bonus, gather_bonus, double_gather, crop_yield_bonus, herb_yield_bonus, rare_resource_chance, xp_bonus_all_gathering, etc.

**Gacha/Economy (5+):** card_luck_bonus, luck_bonus, sell_price_bonus, gold_steal_chance, gold_drop_bonus.

**Vision/Perception (5+):** grants_vision, full_map_vision, hidden_detection, tremor_sense, shadow_sight, true_sight, echolocation_mastery.

---

## 2. Gacha Mechanics

> **Source files:** `handlers/rpg-cards.js:91` (card_open_pack), `rpg-data.js:869` (SOFT_PITY_START), `rpg-data.js:5652` (RACE_POOL_BIAS), `accounts.js:3220` (pityPullsSinceLegendary)

### Pack Opening
- **Cards per pack:** 6 (fixed)
- **Packs earned:** Every overall level-up
- **Source:** `account.pendingPacks`

### Pity System

| Mechanic | Threshold | Effect |
|----------|-----------|--------|
| Soft Pity | 80 pulls without Legendary+ | +2% per additional pull |
| Hard Pity | 120 pulls | Guaranteed Legendary |
| Reset | Any Legendary+ pull | Counter resets to 0 |
| Persistence | `account.pityPullsSinceLegendary` | Survives sessions |

### Race-Weighted Draws (RACE_POOL_BIAS)

| Race | Pool Tag | Chance | Extra |
|------|----------|--------|-------|
| Elf | `magic` | 40% | — |
| Goblin | `stealth` | 35% | — |
| Cat Folk | `luck` | 40% | +12% rarity bump per card |
| Lizard Folk | `ritual` | 25% | — |

### Luck Bonus Stacking
- Cards with `luck_bonus` or `card_luck_bonus` effects stack additively
- Applied as independent rarity bump chance per card
- Capped at 100%

### Rate Disclosure
Event `get_gacha_rates` returns: base rates, effective rates after modifiers, race modifiers, equipped card luck bonuses, pity info, pack info.

---

## 3. Card Fusion

> **Source files:** `rpg-data.js:5823` (fuseCards), `handlers/rpg-cards.js:128` (card_fuse handler)

| Rule | Value |
|------|-------|
| Input | 2 cards of same rarity |
| Output | 1 card of next rarity tier |
| Max fusions per card | 2 |
| Relic cards | Cannot be fused |
| Fusion bonus | +5% per fusion level to numeric effects |
| Style inheritance | Highest visual tier from sources |
| Lineage tracking | `fusionLineage[]` stores source IDs |

**Example:** 2× Uncommon → 1× Rare (fusion level 1, +5% effects)

---

## 4. Card Equipping & Slots

> **Source files:** `handlers/rpg-cards.js:153` (card_equip/unequip), `accounts.js:3378` (equipRpgCard), `accounts.js:3552` (getEquippedCardEffects, 60s cache), `rpg-data.js:488` (canTradeCardToRace)

### Slot Unlocks

| Level | Active Slots | Passive Slots | Total |
|-------|-------------|---------------|-------|
| 1 | 1 | 0 | 1 |
| 5 | 1 | 1 | 2 |
| 10 | 2 | 1 | 3 |
| 15 | 2 | 2 | 4 |
| 20 | 3 | 2 | 5 |
| 25 | 3 | 3 | 6 |
| 30 | 4 | 3 | 7 |

- **Active slots:** `active_ability` type cards (damage/heal)
- **Passive slots:** Everything else (stat_boost, passive_perk, etc.)
- **Effects cache:** Computed once, cached 60s, invalidated on equip/unequip

### Racial Feat Bonus
Cards with `type: 'racial_feat'` have `raceBonus` field. If equipped by matching race, `effect.raceValue` used instead of `effect.value`.
- Example: Elven Grace = +20% magic XP (all races), +30% (if Elf)

---

## 5. Card Economy

> **Source files:** `handlers/rpg-cards.js:200` (card_vendor_buy/sell), `handlers/mmo-auction.js:15` (MAX_LISTINGS), `handlers/mmo-auction.js:168` (browse), `handlers/mmo-auction.js:401` (buy), `handlers/trade.js:19` (trade_request), `handlers/trade.js:381` (trade_cancel)

### Card Vendor (NPC)

| Rarity | Buy Price | Sell Value | Buyback Rate |
|--------|-----------|-----------|--------------|
| Common | 50 | 50 | 25% (12.5) |
| Uncommon | 200 | 200 | 25% (50) |
| Rare+ | Not sold | 500-5000+ | 25% of base |

- Style multipliers apply to sell: holo 1.5x, golden 2x, prismatic 3x, void 5x
- Cannot sell equipped cards
- Collection cap: 1000 cards max

### Auction House

| Parameter | Value |
|-----------|-------|
| Max listings per player | 20 |
| Max total listings | 500 |
| Listing fee | 5% of sale price |
| Listing expiry | 24 hours |
| Price range | 1–1,000,000 coins |
| Persistence | Saved to disk (data/auction/) |

### Card Trading Restrictions

**Racial innate traits CANNOT be traded to races without that trait:**
`tremor_sense`, `water_breathing`, `swim_no_mount`, `ocean_dive`, `stone_skin`, `throwing_knives`, `unarmed_proficiency`, `ritual_magic_access`, `poison_immunity`

- `raceLocked` cards → only tradeable to specified race
- Same-race players CAN trade upgraded versions of innate cards
- All base skill/stat cards trade freely
- Validated at both offer time AND execution time (atomic)

---

## 6. Combat Engine

> **Source files:** `dungeon-combat.js:50` (CT_THRESHOLD & constants), `dungeon-combat.js:48` (TURN_TIMER_MS), `dungeon-combat.js:2504` (applyGroupScaling), `dungeon-combat.js:367` (bfsMovementRange)

### CT (Charge Time) Initiative

| Constant | Value | Description |
|----------|-------|-------------|
| CT_THRESHOLD | 100 | CT needed to act |
| CT_SIMULTANEOUS_BAND | 5 | Players within 5 CT act together |
| INITIAL_CT_RANDOM | 20 | Random CT at combat start |
| CT_RESET_ATTACKED | 0 | CT after basic attack |
| CT_RESET_MOVED_ONLY | 20 | CT after move-only turn |
| CT_RESET_WAITED | 40 | CT after waiting |
| TURN_TIMER_MS | 15000 | 15s player decision window |
| ENEMY_ANIM_DELAY_MS | 500 | Enemy action delay |

**Speed formula:** `ct += unit.speed * speedMult` per tick. Players within CT_SIMULTANEOUS_BAND of highest CT act as a group.

### Party Scaling

| Party Size | HP Mult | ATK Mult |
|------------|---------|----------|
| Solo (1) | 0.80 | 0.75 |
| Duo (2) | 0.90 | 0.88 |
| Trio (3) | 0.97 | 0.95 |
| 4 Players | 1.00 | 1.00 |
| 5+ (Rally) | +0.10/player | +0.10/player |

Rally mode (5+ players): spawns reinforcements every 2 turns, max 20 enemies.

### Exhaustion

| Mode | Starts At | Damage/Turn |
|------|-----------|-------------|
| Normal | Turn 12 | 5 × (turn - 12) |
| Boss | Turn 20 | 5 × (turn - 20) |

Applies to ALL units. Unblockable. Forces fast resolution.

---

## 7. Combat Actions & Resources

> **Source files:** `dungeon-combat.js:45` (PLAYER_BASE_MP), `dungeon-combat.js:6439` (executeAbility), `dungeon-combat.js:785` (calculateDamage), `dungeon-combat.js:5104` (soul_shards processing)

### Per-Turn Resources

| Resource | Per Turn | Notes |
|----------|----------|-------|
| MP (Movement) | 3 | −1 heavy armor, +1 aquatic on water |
| AP (Action) | 1 | Attack, ability, item, card swap |
| RP (Reaction) | 1 | Defensive reactions vs enemy attacks |

### Available Actions

| Action | AP Cost | Description |
|--------|---------|-------------|
| `move` | 0 (uses MP) | BFS pathfinding, 4-directional cardinal |
| `attack` | 1 | Basic attack, range depends on weapon |
| `ability` | 1 | Card ability, variable resource cost |
| `wait` | 0 | Skip, gain CT_RESET_WAITED (40) |
| `end_turn` | 0 | Explicit end |
| `swap_card` | 1 | Mid-combat equip/unequip |
| `use_item` | 1 | Consume food/potion for buff |
| `npc_heal` | 1 | NPC healer action, 10 mana |

### Four-Pool Resource System

| Resource | Max | Regen | Gain Mechanic | Primary Races |
|----------|-----|-------|---------------|---------------|
| **Mana** | 50 (60 primary) | 3/turn | Passive regen | Elf, Gnome |
| **Stamina** | 50 (57 secondary) | 2/turn | Passive regen | Dwarf, Cat Folk |
| **Bloodlust** | 50 (55 primary) | 0 base | +15 on kill, +3 on hit, +2 on take damage | Orc, Goblin |
| **Focus** | 50 (55 secondary) | 0 base | +10 consecutive on target, +5 basic attack | Human, Lizard Folk |

**Race Primary Resources:** Human→focus, Elf→mana, Orc→bloodlust, Dwarf→stamina, Gnome→mana, Goblin→bloodlust, Lizard Folk→focus, Cat Folk→stamina

**Bloodlust Decay:** −3/turn after 2 turns of inactivity. Card `resource_decay_reduction` reduces.

**Focus Retention on Target Switch:** 25% base. Card `resource_retain_on_switch` improves.

---

## 8. Damage Calculation

> **Source files:** `dungeon-combat.js:785` (calculateDamage), `dungeon-combat.js:850` (critical hit logic), `dungeon-combat.js:920` (dodge/block), `dungeon-combat.js:1050` (element multipliers)

### Core Formula

```
Player → Enemy:
  baseAtk = (might × 2) + (level × 1.5) + weaponDamage
  damage = max(1, floor(baseAtk × meleeDmgMult × (1 − armorReduction)))

Armor Reduction:
  armorReduction = targetDef / (targetDef + 50)
  // 0 DEF = 0%, 50 DEF = 50%, 100 DEF = 66%
```

### Critical Hits

```
critChance = 0.05 + crit_bonus_cards + vision_bonus + hunters_instinct
critChance = min(0.75, critChance)  // 75% cap

critMult = 1.5 (base) + crit_damage_bonus (cards) + shatter_bonus (frozen/stunned)
// Range: 1.5x to ~2.3x
```

### Dodge

```
dodgeChance = baseStatDodge + dodge_bonus_cards + animal_form_bonus
dodgeChance = min(0.60, dodgeChance)  // 60% cap
// Successful dodge → riposte buff (+25% damage next attack)
```

### Block

```
blockChance = min(0.50, blockChance)  // 50% cap
blockReduction = 0.50 (base) − block_damage_reduction_cards
// Successful block → aegis buff (+5% damage)
```

### Darkness Penalties
- **No vision in dark:** 30% miss chance, 20% damage reduction
- **Enemy vs blinded player:** +15% damage
- **Mitigated by:** any vision type, torch, lantern, shadow_sight

### Elemental Multipliers
Multiplicative system via `ELEMENT_MULTIPLIERS` table (fire/ice/lightning/poison/dark/holy/arcane/wind/earth).

---

## 9. Status Effects

> **Source files:** `dungeon-combat.js:4586` (tickStatusEffects), `dungeon-combat.js:2182` (hot_streak), `dungeon-combat.js:5104` (soul_shards), `dungeon-combat.js:3200` (combat passives processing)

### Crowd Control

| Effect | Duration | Mechanics |
|--------|----------|-----------|
| `stunned` | 1-3 turns | Skip turn |
| `rooted` | 1-3 turns | Immobilized, can still attack |
| `slowed` | 2-4 turns | Speed × 0.5-0.7 |
| `knockdown` | 1 turn | Skip turn |
| `grappled` | Variable | Immobilize both, DoT to target |
| `taunted` | 1-2 turns | Forced to attack source |
| `frozen` | 1-2 turns | Immobilized, speed × 0 |

### Damage Over Time

| Effect | Tick Damage | Duration |
|--------|-------------|----------|
| `poisoned` | 3-5/turn | 3-5 turns |
| `bleeding` | 4-6/turn | 2-4 turns |
| `burning` | 5-8/turn | 2-3 turns |
| `constricted` | 6/turn | Variable (immobilize + DoT) |

### Buffs

| Effect | Bonus | Duration |
|--------|-------|----------|
| `riposte` | +25% damage | 2 turns (from dodge/block) |
| `hot_streak` | +50% damage + free ability | 2 turns (from 2 consecutive crits) |
| `aegis` | +5% damage | 2-3 turns (from blocking) |
| `ebon_might` | +10% damage/armor to 3 allies | 2 turns |
| `death_shroud` | Second HP pool (30% max HP) | 99 turns |
| `soul_shards_empowered` | +75% dark ability damage | 3 turns (at 5 soul shards) |
| `primal_surge` | +15% damage | 2 turns (after animal form expires) |

### Combat Passives (from Equipped Cards)

**Offense:**
- `lifesteal`: Heal % of damage dealt
- `on_hit_poison` (15%), `on_hit_bleed` (10%): Chance to apply DoT
- `hot_streak`: 2 consecutive crits → free ability + 50% damage
- `hunters_instinct`: +15% vs debuffed, +10% crit vs marked
- `shatter`: +30% crit damage vs frozen/stunned
- `soul_shards`: +1/kill, at 5 shards → +75% dark damage
- `poison_aura`: Adjacent enemies take poison tick

**Defense:**
- `mana_shield`: Absorb % damage from mana pool
- `damage_reflect`: Reflect % back to attacker
- `parry_chance` (15%): Negate melee entirely
- `last_stand`: +30% DR below 20% HP
- `fortress`: +15% armor when stationary
- `adaptive_resist`: +20% resist vs last-hit element
- `counter_chance_bonus`: 50% attack as counter
- `escape_artist`: CC duration reduced to 1 turn max

**Support:**
- `battle_commander`: Allies +5% damage in range 3
- `healing_aura`: Allies regen 1% max HP/turn in range 2
- `inspiring_presence`: Allies +10% mana regen in range 3
- `spirit_link_party`: Redirect 15% ally damage to self
- `rallying_defense`: Block → nearby allies +3 armor
- `guardian_angel`: Auto-revive ally once/combat at 40% HP
- `vulnerability`: CC expiry → target takes +15% damage for 2 turns

---

## 10. Boss Mechanics

> **Source files:** `dungeon-data.js:172` (BOSS_MECHANICS), `dungeon-combat.js:9263` (LICH_RAID_PHASES), `dungeon-data.js:758` (ENEMY_POOLS with boss entries)

### 8 Boss Mechanic Types

| Mechanic | Effect |
|----------|--------|
| **Resurrect** | Revives at 50% HP, +30% ATK, new abilities |
| **Death AoE** | Leaves damaging zone (radius 3, 8 turns, 40% ATK/turn) |
| **Shield Phase** | Immune until 2 shield-bearer minions (15% boss HP) killed |
| **Summon Portals** | 2 portals spawn minions every 4 turns |
| **Split** | At 50% HP, splits into 2 copies (60% HP, 70% ATK each) |
| **Regenerator** | 3% max HP regen per turn |
| **Reflect** | 25% damage reflected back to attacker |
| **Fury** | ATK scales 1.0x→2.0x as HP drops 100%→10% |

### Boss Assignments (23 unique bosses)

| Boss | Theme | Mechanic |
|------|-------|----------|
| Iron Castellan | stone_keep | Shield Phase |
| Prismatic Queen | crystal_cavern | Reflect |
| Spore Matriarch | fungal_forest | Split |
| Molten Titan | lava_rift | Death AoE |
| Shadow Lich | shadow_realm | Summon Portals |
| Frost King | frozen_depths | Regenerator |
| Bone Lord | bone_yard | Resurrect |
| Sand King | sand_tomb | Resurrect |
| Forge Overlord | iron_forge | Fury |
| Manor Patriarch | haunted_manor | Summon Portals |
| Tidal Kraken | tidal_vault | Death AoE |
| Plague Father | plague_warren | Death AoE |
| Elven Keeper | elven_reliquary | Shield Phase |
| Gnomish Director | gnomish_workshop | Split |
| Orc Warlord | orc_barrow | Fury |
| Goblin Overlord | goblin_warrens | Summon Portals |
| Frost Sovereign | frost_citadel | Death AoE |
| Ashen Watcher | ashen_observatory | Death AoE |
| Dragon Vyraxion | dragons_den | Death AoE |
| Dinosaur Rex | dinosaur_jungle | Fury |
| Spider Broodmother | spider_hive | Summon Portals |
| Vampire Count | vampire_castle | Regenerator |
| Arch-Lich | lich_sanctum | Resurrect |

---

## 11. Enemy System

> **Source files:** `dungeon-data.js:522` (ENEMY_RANKS), `dungeon-data.js:534` (DIFFICULTY_TIERS), `dungeon-data.js:353` (CLASS_TEMPLATES), `dungeon-data.js:758` (ENEMY_POOLS), `dungeon-ai.js:25` (ARCHETYPES), `dungeon-ai.js:245` (initEnemyAI), `dungeon-ai.js:1629` (decideTurnAction)

### Enemy Tiers Per Pool

Each of 22 theme-pools contains:
- **Shallow:** Early-floor enemies (low HP/XP)
- **Mid:** Mid-depth enemies
- **Deep:** Late-depth enemies
- **Boss:** Single unique boss template

### Enemy Ranks

| Rank | HP | ATK | DEF | XP/Gold | Templates |
|------|-----|-----|-----|---------|-----------|
| Normal | 1.0x | 1.0x | 1.0x | 1.0x | 0 |
| Elite | 1.5x | 1.3x | 1.2x | 1.8x | 1 |
| Rare | 2.0x | 1.5x | 1.4x | 2.5x | 1 |
| Champion | 3.0x | 1.8x | 1.6x | 4.0x | 2 |

### 8 Class Templates (applied to ranked enemies)

| Template | HP | ATK | DEF | Abilities | Element |
|----------|-----|-----|-----|-----------|---------|
| Pyromancer | 1.1x | 1.3x | 0.9x | Fireball | Fire |
| Frostweaver | 1.1x | 1.2x | 1.1x | Frost Bolt | Ice |
| Berserker | 1.3x | 1.4x | 0.7x | Frenzy Strike | — |
| Shadow | 0.9x | 1.3x | 0.8x | Shadow Strike + Bleed | Dark |
| Healer | 1.2x | 0.8x | 1.2x | Heal Pulse | — |
| Venomancer | 1.0x | 1.2x | 1.0x | Venom Spit + Poison | Poison |
| Stormcaller | 1.0x | 1.3x | 0.9x | Chain Lightning + Stun | Lightning |
| Guardian | 1.5x | 0.8x | 1.6x | Shield Bash + Stun | — |

### 5 AI Archetypes

| Archetype | Detection | Behavior |
|-----------|-----------|----------|
| Bruiser | 4 tiles | Heavy strike, close range |
| Skirmisher | 5 tiles | Quick slash, mobile |
| Ranged | 6 tiles | Ranged shots, keeps distance |
| Controller | 5 tiles | Debuff abilities |
| Support | 5 tiles | Healing + striking |
| Elite | 6 tiles | Dual abilities + stun |

### Difficulty Modes

| Mode | HP | ATK | DEF | Elite% | Rare% | Champ% | Rewards | Bonus Loot |
|------|-----|-----|-----|--------|-------|--------|---------|------------|
| Standard | 1.0x | 1.0x | 1.0x | 5% | 2% | 0.5% | 1.0x | 0% |
| Veteran | 1.3x | 1.2x | 1.15x | 10% | 4% | 1% | 1.3x | 10% |
| Elite | 1.7x | 1.4x | 1.3x | 15% | 8% | 2% | 1.6x | 20% |
| Mythic | 2.2x | 1.7x | 1.5x | 25% | 12% | 5% | 2.0x | 35% |

---

## 12. Dungeon System

> **Source files:** `handlers/dungeon.js:4223` (dungeon_enter), `handlers/dungeon.js:4733` (dungeon_move), `handlers/dungeon.js:962` (getRiftFloor), `handlers/dungeon.js:86` (floorAccessOrder), `dungeon-data.js:4060` (generateFloor), `dungeon-data.js:3702` (CAMP_CONFIG), `dungeon-data.js:3727` (DUNGEON_SKILL_PERKS)

### Two Dungeon Types

| Feature | The Rift (Infinite) | Overworld Caves (Finite) |
|---------|---------------------|--------------------------|
| Seed | `rift_YYYY-MM-DD` (daily) | `cave_<worldX>_<worldY>` (permanent) |
| Floors | Infinite | 3-10 (biome-dependent) |
| Requirement | Adventure Guild membership | None |
| Final Floor | Boss every 10th | Boss on last floor |
| Camps | Yes (6-turn, 4 max/run) | No |
| Daily Quests | 3-5 per day | No |
| Leaderboard | Yes (3 categories) | No |

### 8 Layout Types
BSP_ROOMS, MAZE, LAKE, OPEN_CAVERN, TEMPLE_HALLS, ARENA, ISLAND, ORGANIC

### 31 Themes
**Castle (5):** stone_keep, grand_hall, armory_vault, throne_dungeon, catacombs
**Wild (14):** crystal_cavern, fungal_forest, lava_rift, frozen_depths, flooded_ruins, floating_islands, bone_yard, shadow_realm, overgrown_temple, clockwork_maze, sand_tomb, coral_grotto, void_debris, ancient_library
**Advanced (12+):** iron_forge, haunted_manor, tidal_vault, plague_warren, elven_reliquary, gnomish_workshop, orc_barrow, mirage_palace, frost_citadel, goblin_warrens, ashen_observatory, sunken_cathedral, dragons_den, vampire_castle, lich_sanctum, spider_hive, dinosaur_jungle, and more

### 14 Tile Types
WALL, FLOOR, CORRIDOR, DOOR, STAIRS_UP, STAIRS_DOWN, ENTRANCE, EXIT, CHEST, TRAP, CAMP_SPOT, SHRINE, BOSS_DOOR, SHORTCUT

### Floor Size Scaling

| Size | Tiles | Rooms |
|------|-------|-------|
| Small | 40×30 | 4-6 |
| Medium | 56×42 | 6-10 |
| Large | 72×54 | 10-14 |
| Huge | 96×72 | 14-20 |

### Camp System (Rift Only)
- Place on CAMP_SPOT tiles, max 4 camps per run
- Cook food, pray at shrine, ambush risk
- Shrine buffs: +10% XP, +5% dodge, +20% resist (cumulative)

### Fog of War & Vision

| Vision Type | Base Range | Dark Range | Races |
|-------------|-----------|------------|-------|
| Normal | 7 tiles | 1 tile | Human, Elf, Orc, Gnome |
| Darkvision | 7 tiles | 5 tiles | Dwarf, Goblin, Cat Folk |
| Thermal | 7 tiles | 7 tiles + through walls | Lizard Folk |
| Tremor | 10 tile radius | 10 tiles | Dwarf (passive) |

Light sources: Torch (300s, 4 tiles), Lantern (600s, 6 tiles).

### Lich Raid (16-32 Player Endgame)
- Multi-party (up to 8 parties of 4)
- Party-group rotation: P1→P2→P3→Boss multi-action
- 5-minute gather phase, 60s countdown, 24h cooldown
- Boss uses threat table for target selection

### Chest Tiers
Common → Uncommon → Rare → Legendary (upgraded by treasure_vault card, delving perk, castle theme bonus)

### Leaderboard Categories
1. Deepest Floor (all-time)
2. Most Kills (daily)
3. Fastest Boss (daily)

---

## 13. Race System

> **Source files:** `rpg-data.js:11` (RACES), `handlers/character-creation.js:12` (race_select), `handlers/character-creation.js:37` (stat_allocate)

### 8 Races

| Race | Stat Bumps | Vision | Speed | Key Perks |
|------|-----------|--------|-------|-----------|
| **Human** | +1 PRE, +1 RES | Normal | 10 | +15% all XP, +20% market in Holy Dominion, coercion/deception, −25% property cost |
| **Elf** | +2 ACU, +1 FIN, −1 VIG | Normal | 9 | +50% magic XP, +30% magic unlock, −15% melee, −10% HP |
| **Orc** | +2 MGT, +1 VIG, −1 ACU | Normal | 11 | +25% melee/archery, +25% HP, +10% mount speed, +2 HP regen/s |
| **Dwarf** | +2 VIG, +1 ING, −1 FIN | Darkvision | 8 | +25% mining/crafting, Stone Skin (+10 armor), tremor sense |
| **Gnome** | +2 ING, +1 ACU, −1 MGT | Normal | 9 | +50% cogworking XP, +25% engineering, automaton crafting, 50% cost reduction |
| **Goblin** | +2 FIN, +1 RES, −1 MGT | Darkvision | 13 | +30% stealth, +20% stealth attack/lockpicking/thievery/archery, +30% forest/swamp speed |
| **Lizard Folk** | +1 ACU, +1 RES, +1 FIN, −1 PRE | Thermal | 10 | +30% fishing, swim/dive, water breathing, poison immunity, ritual magic |
| **Cat Folk** | +2 FIN, +1 PRE, −1 VIG | Darkvision | 12 | +20% card luck, +15% general luck, unarmed, +15% stealth/lockpick, +30% desert speed |

### 8 Languages
Common, Elvish, Orcish, Dwarvish, Gnomish, Goblin, Draconic, Catfolk. Each race starts with native + Common.

---

## 14. Stat System

> **Source files:** `rpg-data.js:576` (STAT_NAMES), `handlers/character-creation.js:37` (stat_allocate), `accounts.js:3100` (stat point grants on level-up)

### 7 Primary Stats (Base 5, +5 at creation, +1 per 3 levels)

| Stat | Effects |
|------|---------|
| **Vigor (VIG)** | HP (50 + VIG×10 + level×5), stamina, poison resist, carry weight |
| **Might (MGT)** | Melee damage (×1.05/point), mining yield (+1%), harvest speed (+2%) |
| **Finesse (FIN)** | Crit chance (+0.8%), dodge (+0.5%), movement speed (+0.5%) |
| **Acumen (ACU)** | Magic power (×1.06/point), XP gain (+1%), crafting quality |
| **Resolve (RES)** | Magic resist (×3%), debuff reduction, HP regen (+0.5/level) |
| **Presence (PRE)** | Trade prices (+2%), NPC favor, party buff radius |
| **Ingenuity (ING)** | Crafting speed (+3%), cogworking yield, engineering +25% |

---

## 15. Skills System

> **Source files:** `rpg-data.js:709` (SKILL_DEFINITIONS), `accounts.js:1051` (xpForLevel), `accounts.js:1060` (overallXpForLevel), `accounts.js:1070` (addSkillXp with spillover)

### 33 Total Skills

**Gathering (4+3 phantom):** Mining, Woodcutting, Farming, Fishing + Herbalism, Foraging, Survival

**Crafting (9+):** Cooking, Glassworking, Crafting, Sewing, Cogworking, Alchemy, Enchanting, Leatherworking, Brewing, Carpentry, Jewelcrafting

**Combat (9):** Magic (+ elemental/arcane/divine/shadow), Melee (+ blade/blunt/martial), Archery

**Rogue (2):** Lockpicking, Thievery

**Social (2):** Coercion, Deception

**Exploration (3):** Dungeon Dwelling, Dungeon Delving, Anatomy

**Race-Locked (3):** Ritual Magic, Water Rituals, Blood Rituals (Lizard Folk only)

### XP Formulas

| Type | Formula | Cap |
|------|---------|-----|
| Skill XP per level | `floor(80 × n^1.7)` | No cap (Infinity) |
| Overall XP per level | `floor(200 × n^1.6)` | No cap (Infinity) |
| XP spillover | 10% of skill XP → overall | — |

### Dungeon Skill Perks (12 bonuses, all wired)
Dungeon Dwelling and Dungeon Delving grant bonuses at level milestones: trap resist, ambush prevention, chest tier upgrades, boss loot bonuses, vision improvements, etc.

---

## 16. Economy & NPC Shops

> **Source files:** `handlers/npc-shop.js:12` (BASE_PRICES), `handlers/npc-shop.js:48` (SHOPS), `handlers/npc-shop.js:103` (TICK_INTERVAL), `handlers/npc-shop.js:191` (npc_shop_browse)

### 7 Shop Types
General Store, Blacksmith, Fishmonger, Alchemist, Jeweler, Gnomish Engineer, Provisions Merchant

### Dynamic Pricing

| Parameter | Value |
|-----------|-------|
| Tick interval | 30 seconds |
| Price range | 0.5x – 2.0x base |
| Buy activity | Increases price (+pressure) |
| Sell activity | Decreases price (−pressure) |
| Pressure decay | 85% per tick |
| Natural drift | 0.5% toward 1.0 baseline |
| Buy markup | +20% over market |
| Sell discount | 80% of market |
| Presence bonus | Up to 30% discount (presence × 2%) |

### Base Prices (selected)
wood: 5, stone: 8, iron_ore: 15, iron_bar: 35, fish: 10, wheat: 8, herbs: 12, mana_crystal: 50, gem_cut: 100, clockwork_core: 120, potion_health: 35

---

## 17. Crafting

> **Source files:** `rpg-data.js:6005` (NEW_RECIPES), `handlers/crafting.js:1213` (get_recipes), `handlers/crafting.js:1225` (craft_item)

### Station Types
None (basic), Forge (smelting), Anvil (weapons/armor), Loom (cloth), Alchemy Lab (potions)

### Recipe Examples (100+ total)

**No Station:**
- Wooden weapons (sword, dagger, mace, spear, staff, wand, bow, shield)
- Forge, storage chest, walls, doors, bridges, boats, plot stakes

**Forge:**
- iron_bar (2 iron_ore → 1 iron_bar)

**Anvil (crafting 5+):**
- Iron weapons/armor (swords, axes, maces, shields, helms)
- Tool tiers: copper (lv2), bronze (lv4), steel (lv10), mithril (lv22)

**Alchemy Lab:**
- Potions: health, mana, strength, agility, intellect, resistance, speed
- Antidotes, elixirs, flasks

### Tool Tier Bonuses

| Tier | Yield | XP Mult | Crafting Req |
|------|-------|---------|-------------|
| Copper | 2 | 1.05x | Level 2 |
| Bronze | 2 | 1.10x | Level 4 |
| Steel | 3 | 1.15x | Level 10 |
| Mithril | 4 | 1.25x | Level 22 |

---

## 18. World & Biomes

> **Source files:** `worldgen.js:24` (CHUNK_SIZE), `worldgen.js:46` (BIOME), `worldgen.js:108` (BIOME_SPEED), `worldgen.js:176` (WORLD_DUNGEONS), `worldgen.js:1580` (generateChunk), `worldgen.js:1248` (getBiomeAtPixel), `worldgen.js:1256` (isWalkable), `handlers/portal.js:167` (portal_travel), `handlers/plot.js:9` (PLOT_SIZE), `handlers/plot.js:147` (claim_plot)

### World Scale
- 2000 × 2500 chunks, 512px each
- Total: 10,000 km × 12,500 km
- Lazy generation with seeded RNG

### 17 Surface Biomes

| ID | Biome | Speed | Element |
|----|-------|-------|---------|
| 0 | Shimmering Sea | 0 (water) | Ice |
| 1 | Great Endless Desert | 0.5x | Earth |
| 2 | Dwarven Mountains | 0.6x | Earth |
| 3 | Scorched Sands | 0.5x | Fire |
| 4 | Orcish Steppes | 0.9x | Wind |
| 5 | Wildlands (Forest) | 0.8x | Earth |
| 6 | Green Plains | 1.0x | Neutral |
| 7 | Shadowfen (Swamp) | 0.6x | Poison |
| 8 | Holy Dominion | 1.0x | Holy |
| 9 | Gnomish Isles | 0.9x | Lightning |
| 10 | Mechspire | 0.9x | Lightning |
| 11 | Clockwork Harbor | 0.9x | Lightning |
| 12 | Wastes of Calidar | 0.4x | Dark |
| 13 | Coastline (Beach) | 0.8x | Ice |
| 14 | Frostbound Reach | 0.3x | Ice |
| 15 | Southern Wastes | 0.4x | Dark |
| 16 | Elven South | 0.9x | Arcane |

Plus **Hollow Earth** underground layer.

### Terrain Features
RIVER (impassable), LAKE (impassable), SHALLOW_WATER (0.3x), THICK_FOREST (0.2x), CAVE_ENTRANCE (dungeon portal), BRIDGE (0.8x), WORLD_DUNGEON (fixed POI)

### 10 Anchor Towns
Holy Dominion (Human starter), Solara (Human capital), Sylvaris (Elf), Ironhold (Dwarf), Kragmor (Orc), BoneTrap (Goblin), Murkmire (Lizard Folk), Mechspire (Gnome), Clockwork Harbor (Gnome port), Fortune's Rest (Cat Folk)

### 32 Fixed World Dungeons
Named dungeons across all regions with unique themes, floor counts (3-8), and level requirements (5-35+).

### Portal System
- Free inter-town teleportation via Portal Nexus NPC
- Personal portals: craftable on plots (crafting lv20, 5 mana_crystal + 10 stone + 5 iron_bar + 3 gem_cut)
- 30s cooldown between teleports

### Plot System
- 512×512 px (1 chunk), interior 4096×4096
- Cost: 1000 coins (−25% Human), two-step unclaim, reclaimable by others

---

## 19. Overworld Monsters

> **Source files:** `handlers/monsters.js` (monster definitions, spawn logic), `handlers/monsters.js:840` (zone_combat_engage)

| Monster | HP | ATK | DEF | Biomes | Min Level |
|---------|-----|-----|-----|--------|-----------|
| Forest Wolf | 35 | 10 | 4 | Forest, Elven South | 1 |
| Mountain Goat | 45 | 8 | 8 | Mountain | 1 |
| Desert Scorpion | 30 | 14 | 5 | Desert, Scorched Sands | 1 |
| Plains Boar | 50 | 9 | 6 | Plains, Holy Dominion | 1 |
| Snow Bear | 80 | 18 | 10 | Frostbound | 5 |
| Swamp Lizard | 40 | 11 | 5 | Swamp | 2 |
| Cave Bat | 20 | 7 | 2 | Mountain, Forest, Swamp, Wastes | 1 |
| Shore Crab | 30 | 8 | 10 | Beach | 1 |
| Volcanic Imp | 28 | 15 | 3 | Scorched Sands, Wastes | 4 |
| Dark Sprite | 22 | 12 | 2 | Forest, Elven South, Swamp | 2 |
| Steppe Hawk | 25 | 13 | 3 | Steppes | 2 |
| Sand Viper | 24 | 16 | 3 | Desert, Scorched Sands | 3 |
| Frost Spider | 32 | 11 | 5 | Frostbound, Mountain | 3 |
| Clockwork Beetle | 38 | 10 | 12 | Gnomish Isles, Mechspire | 3 |
| Waste Crawler | 60 | 14 | 8 | Wastes, Southern Wastes | 4 |

Spawn: every 45s, max 3-5 per zone, despawn after 10m idle, drops biome-appropriate resources.

---

## 20. Guilds, Parties, Social

> **Source files:** `handlers/guild.js:75` (guild_create), `handlers/guild.js:301` (guild_vault_deposit/withdraw), `handlers/party.js:9` (party_create), `handlers/trade.js:19` (trade_request)

### Guilds
- Creation: 50 coins, 2+ char name
- Max members: 50
- Roles: leader, member
- Vault: shared card/resource storage (persisted to data/guilds/)
- Chat: guild-wide messaging
- Adventure Guild: 10 ranks (Stone → Relic)

### Parties
- Max 4 members, leader invites
- Shared dungeon instances
- Party-only chat

### P2P Trading
- 2-sided atomic exchange: request → accept → offer → confirm → execute
- Cards, resources, coins
- 30s expiry if not accepted
- Race restrictions enforced at both offer and execution time

---

## 21. Mount System

> **Source files:** `worldgen.js:583` (MOUNT_SPEEDS), `handlers/character-creation.js` (set_mount), `client/scenes/game.lua:565` (mount rendering)

### Mount Types & Speeds

| Mount | Speed Mult | Notes |
|-------|-----------|-------|
| Horse | 2.0x | Standard land mount |
| Caravan | 0.7x | Slow, cargo |
| Ship | 5.0x | Water only |
| Airship | 20.0x | Future/premium |

- Orc racial: +10% mounted speed when mount > 1.0x
- Client renders horse body/legs, caravan body/wheels
- Server validates mount speed with 5s cached lookup

---

## 22. Director System

> **Source files:** `director-lich.js:539` (playerCleanse), `director-lich.js:396` (getCorruptionForArea), `director-macro.js`, `director-metrics.js`, `director-micro.js`, `director-ocean.js`, `director-raid.js`

### 6 Director Modules

| Module | Purpose |
|--------|---------|
| `director-lich.js` | Lich Sanctum raid, corruption spread, cleansing |
| `director-macro.js` | World-scale event distribution |
| `director-metrics.js` | Difficulty scaling, group metrics |
| `director-micro.js` | Zone-level event generation |
| `director-ocean.js` | Leviathan ocean raid events |
| `director-raid.js` | Multi-zone raid orchestration |

**Corruption System:**
- Lich spreads corruption across chunks
- Players cleanse with purification crystals
- Card bonuses affect cleanse radius/amount
- Corruption data broadcast to nearby players via spatial grid

---

## 23. Resources List

> **Source files:** `rpg-data.js:788` (ALL_RESOURCE_TYPES), `handlers/zone.js` (resource_harvest), `handlers/npc-shop.js:12` (BASE_PRICES per resource)

**70+ resource types** across categories:

**Ores/Bars:** iron_ore, iron_bar, bronze_ore, bronze_bar, copper_ore, copper_bar, silver_ore, silver_bar, gold_ore, gold_bar, steel_bar, mithril_ore, mithril_bar, stormsteel_ore, stormsteel_bar, deepsilver_ore, deepsilver_bar, soulforged_bar, voidmetal_ore, voidmetal_bar

**Food:** fish, cooked_fish, shellfish, seaweed, wheat, herbs, vegetables, mushroom, bread, stew

**Glass:** glass_sand, glass, glass_lens, glass_vial

**Clockwork:** cogs, gears, springs, clockwork_core

**Potions:** potion_health, potion_mana, potion_strength, potion_agility, potion_intellect, potion_resistance, potion_speed, antidote, poison_vial

**Magic:** mana_crystal, gem_rough, gem_cut, enchantment_shard, arcane_essence, sigil_ink, transmutation_dust

**Gems:** ruby, emerald, sapphire, topaz, amethyst, diamond, onyx, opal, moonstone, jade, bloodstone, void_shard

**Textiles:** hide, leather, wool, thread, cloth, silk, silk_cloth

**Dungeon:** dungeon_essence, dark_crystal, boss_trophy, torch, lantern, oil, purification_crystal

**Augments:** coiled_spring, barbed_edge, resonant_core, clockwork_sight, venom_reservoir, mana_conduit, reactive_plating, sigil_ward, dampening_weave, thorned_plates, vitality_mesh

---

## 24. Key Constants & Tuning

> **Source files:** `dungeon-combat.js:1-100` (combat constants), `handlers/mmo-auction.js:15` (auction constants), `handlers/npc-shop.js:103` (shop tick), `rpg-data.js:869` (gacha constants), `server.js:109` (ping settings), `state.js:1177` (wipeEphemeral)

### Combat

| Constant | Value |
|----------|-------|
| CT_THRESHOLD | 100 |
| TURN_TIMER_MS | 15,000 (15s) |
| BASE_MP | 3 |
| BASE_AP | 1 |
| BASE_RP | 1 |
| EXHAUSTION_START | Turn 12 (normal), Turn 20 (boss) |
| EXHAUSTION_PER_TURN | 5 damage |
| CRIT_BASE | 5% |
| CRIT_CAP | 75% |
| DODGE_CAP | 60% |
| BLOCK_CAP | 50% |
| MANA_REGEN | 3/turn |
| STAMINA_REGEN | 2/turn |
| BLOODLUST_ON_KILL | +15 |
| BLOODLUST_DECAY | −3/turn (after 2 turn delay) |
| FOCUS_CONSECUTIVE_GAIN | +10 |
| OFFLINE_XP_BONUS | 1.10x |

### Economy

| Constant | Value |
|----------|-------|
| Auction fee | 5% |
| Auction expiry | 24 hours |
| Auction max listings | 500 total, 20 per player |
| NPC price tick | 30 seconds |
| NPC price range | 0.5x – 2.0x |
| Buy markup | +20% |
| Sell discount | 80% |
| Plot cost | 1000 coins |
| Guild creation | 50 coins |
| Portal cooldown | 30 seconds |

### Gacha

| Constant | Value |
|----------|-------|
| Cards per pack | 6 |
| Soft pity start | 80 pulls |
| Hard pity | 120 pulls |
| Soft pity rate | +2% per pull |
| Cat Folk rarity bump | 12% |
| Max collection | 1000 cards |
| Max fusion count | 2 |
| Fusion bonus | +5% per level |

---

## 25. Known Gaps & Stubs

> **Source files:** See individual sections above. Client entry: `client/scenes/game.lua:565` (game.load), `client/scenes/game.lua:1113` (zone_positions listener), `client/scenes/game.lua:1132` (batch_move listener), `client/scenes/game.lua:12290` (dungeon rendering), `client/scenes/game.lua:12` (debugLog)

### Fully Wired & Working
- Card gacha with pity, race weighting, styles
- Card fusion, equipping, vendor buy/sell
- Turn-based CT combat with 4-pool resources
- 8 boss mechanic types across 23 bosses
- 31 dungeon themes, 8 layouts, fog of war
- NPC shops with dynamic pricing
- Auction house (persisted)
- P2P trading with race restrictions
- Crafting with 100+ recipes
- Portal system (town + personal)
- Plot claiming with interiors
- Overworld monster spawning + AI
- Mount speed + rendering
- Guild vault + persistence
- Director corruption/cleansing system

### Partial / Stub
- **PvP combat:** Placeholder only, no implementation
- **Quest progression tracking:** Infrastructure exists, progress not wired
- **Phantom skill benefits:** Herbalism/Foraging/Survival grant XP but no gameplay perks
- **NPC shop world events:** Price fluctuation via random events not implemented
- **Player revive/corpse:** Death teleports to town, no corpse/guild-revive
- **Auction house persistence recovery:** Persisted but large-scale recovery untested
- **Full combat balance pass:** Formulas exist but no systematic tuning audit done

---

*End of Systems Reference. All data extracted directly from source code as of February 26, 2026.*
