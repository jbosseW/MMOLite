# MMOLite — Complete Feature Audit

**Date:** February 26, 2026
**Project:** Fantasy MMO RPG — Node.js (Socket.IO) Server + LOVE 2D (Lua) Client

---

## Table of Contents

1. [Fully Wired Features (Server + Client Working)](#1-fully-wired-features)
   - [Core Gameplay Loop](#11-core-gameplay-loop)
   - [Card / Gacha System](#12-card--gacha-system)
   - [Dungeon System](#13-dungeon-system)
   - [Turn-Based Tactical Combat](#14-turn-based-tactical-combat)
   - [Social / Party / Guild](#15-social--party--guild)
2. [Server Wired, Client UI Missing](#2-server-wired-client-ui-missing)
3. [Stub / Not Implemented](#3-stub--not-implemented)
4. [Card System Deep Dive](#4-card-system-deep-dive)
   - [All 820+ Cards by Category](#41-all-820-cards-by-category)
   - [Rarity Tiers & Drop Rates](#42-rarity-tiers--drop-rates)
   - [Pity System](#43-pity-system)
   - [Race-Weighted Pack Drawing](#44-race-weighted-pack-drawing)
   - [Card Styles](#45-card-styles)
   - [Card Fusion](#46-card-fusion)
   - [Card Equipping & Slots](#47-card-equipping--slots)
   - [Card Vendor Pricing](#48-card-vendor-pricing)
   - [Card Effect Types (100+)](#49-card-effect-types-100)
   - [Card Archetypes](#410-card-archetypes)
5. [Combat System Deep Dive](#5-combat-system-deep-dive)
   - [Initiative & Turn Order](#51-initiative--turn-order)
   - [Damage Calculation](#52-damage-calculation)
   - [Status Effects](#53-status-effects)
   - [Resource Pools](#54-resource-pools)
   - [Boss Mechanics](#55-boss-mechanics)
   - [Enemy Rank System](#56-enemy-rank-system)
   - [Difficulty Tiers](#57-difficulty-tiers)
   - [Rally Scaling (Group Size)](#58-rally-scaling-group-size)
   - [Permadeath](#59-permadeath)
6. [Dungeon System Deep Dive](#6-dungeon-system-deep-dive)
   - [Rift vs Overworld Caves](#61-rift-vs-overworld-caves)
   - [8 Layout Types](#62-8-layout-types)
   - [31 Dungeon Themes](#63-31-dungeon-themes)
   - [80+ Enemy Types](#64-80-enemy-types)
   - [Fog of War & Vision](#65-fog-of-war--vision)
   - [Camp System](#66-camp-system)
   - [Guild Ranks & Daily Quests](#67-guild-ranks--daily-quests)
7. [Economy & Progression](#7-economy--progression)
   - [Economy Flow Diagram](#71-economy-flow-diagram)
   - [NPC Shop System](#72-npc-shop-system)
   - [Auction House](#73-auction-house)
   - [P2P Trading](#74-p2p-trading)
   - [Crafting System](#75-crafting-system)
   - [Resource / Gathering](#76-resource--gathering)
   - [Skill / XP Progression](#77-skill--xp-progression)
   - [Character Stats](#78-character-stats)
8. [Race System](#8-race-system)
   - [8 Playable Races](#81-8-playable-races)
   - [Card Trading Restrictions by Race](#82-card-trading-restrictions-by-race)
   - [Languages](#83-languages)
9. [World & Infrastructure](#9-world--infrastructure)
   - [10 Anchor Towns](#91-10-anchor-towns)
   - [Portal System](#92-portal-system)
   - [Plot & Building System](#93-plot--building-system)
   - [Mount System](#94-mount-system)
10. [Client Technical Overview](#10-client-technical-overview)
    - [All Scenes](#101-all-scenes)
    - [Game Scene UI Panels](#102-game-scene-ui-panels)
    - [Keybindings](#103-keybindings)
    - [Rendering & Visuals](#104-rendering--visuals)
    - [Audio](#105-audio)
    - [Networking Events (Client → Server)](#106-networking-events-client--server)
    - [Networking Events (Server → Client)](#107-networking-events-server--client)
11. [Subsystem Completeness Matrix](#11-subsystem-completeness-matrix)
12. [Priority Gaps & Recommendations](#12-priority-gaps--recommendations)

---

## 1. Fully Wired Features

### 1.1 Core Gameplay Loop

| Feature | Details |
|---------|---------|
| Overworld Exploration | 2000×2500 chunks, 17 biomes, chunk streaming, WASD movement, sprint, camera follow |
| Town / Zone Navigation | 10 anchor towns, zone connections, zone enter/exit transitions |
| Resource Gathering | 28 resource types, hold-E harvesting, skill XP, cooldowns, biome-specific resources |
| Crafting | 60+ recipes, station proximity (forge/anvil), skill requirements, durability system, gem socketing, augments, imbuing, scrolls, food consumption |
| Character Stats | 7 stats (VIG/MGT/FIN/ACU/RES/PRE/ING), allocation UI, effects on gameplay |
| Race System | 8 races, permanent selection, stat bumps, racial feats, vision types, languages |
| Skill / XP Progression | 35+ skills, polynomial XP curves, 10% spillover to overall level, multiplier stacking |
| Chat | Local zone chat, guild chat, whispers, party chat |
| Portal System | 10 town teleports, personal portal crafting, 30s cooldown |
| Plot Claiming | 512×512 plots, claim/unclaim (two-step confirm), persistence to disk |
| Object Placement | 25+ placeable types (forge, anvil, chest, walls, etc.), owner-only, persistence |

### 1.2 Card / Gacha System

| Feature | Details |
|---------|---------|
| 820+ Card Templates | stat_boost, skill_boost, passive_perk, active_ability, racial_feat, gathering_boost, equipment_modifier, reactive |
| 8 Rarity Tiers | Common (45%) → Relic (0.2%), weight-based distribution |
| Pity System | Soft pity at 80 pulls (+2%/pull), hard pity at 120 guaranteed Legendary |
| Race-Weighted Packs | Elf→magic (40%), Goblin→stealth (35%), Cat Folk→luck (40%) + rarity bump (12%), Lizard Folk→ritual (25%) |
| Pack Opening | 6 cards/pack, level-up grants, animated reveal UI in client |
| Card Equipping | 7 slots (4 active + 3 passive), unlocks at levels 10/20/30/40 |
| Card Fusion | Same rarity → next tier, max 2 fusions per lineage, 5–10% effect bonus, style inheritance |
| 5 Card Styles | Normal (80%), Holographic (12%), Golden (5%), Prismatic (2.5%), Void (0.5% + 10% effect bonus) |
| Card Vendor | Buy common/uncommon, sell any at 25% base value with style multipliers |
| Card Collection UI | 3 tabs (collection / vendor / loadouts), filtering, sorting, detail view, 5 saved loadouts |
| Card Archetypes | DPS, tank, support, scout, assassin, glass_cannon, cc_dot, night_hunter, grappler, aquatic |

### 1.3 Dungeon System

| Feature | Details |
|---------|---------|
| The Rift (Infinite) | Daily-seeded, infinite floors, guild rank requirement (10 ranks: Stone → Relic) |
| Overworld Caves (Finite) | 3–10 floors, location-seeded, biome-themed, no guild requirement |
| Floor Generation | 8 layout types (BSP, Maze, Lake, Cavern, Temple, Arena, Island, Organic) |
| 31 Themes | Unique colors, elements, resistances, enemy pools per theme |
| 80+ Enemy Types | 4 tiers (shallow/mid/deep/boss), 4 ranks (normal/elite/rare/champion), 8 class templates |
| Boss Mechanics | 8 unique types: resurrect, death_aoe, shield_phase, summon_portals, split, regenerator, reflect, fury |
| Fog of War | LOS computation, darkvision races, torch/lantern system (300s/600s), fog memory |
| Camp System | Cook food, shrine buffs, ambush risk (Rift only) |
| Daily Quests | 3–5 per day: kill_enemies, no_damage, clear_floor, speedrun, survive_duration |
| Leaderboard | Deepest floor, most kills, fastest boss |
| 4 Difficulty Tiers | Standard / Veteran / Elite / Mythic with scaling multipliers |

### 1.4 Turn-Based Tactical Combat

| Feature | Details |
|---------|---------|
| CT Initiative | Speed-based charge time; CT ≥ 100 = can act; simultaneous turns grouped within CT range of 5 |
| Grid Movement | BFS pathfinding, tile effects, occupied tile blocking |
| 4-Pool Resources | Mana (+3/turn), Stamina (+2/turn), Bloodlust (combat-reactive), Focus (combo-based) |
| Damage Calculation | Stat scaling, crit (1.5×), armor reduction, elemental resist/weakness, armor pen, lifesteal, reflect |
| Status Effects | Burn, Poison, Bleed (tick damage); Stun, Root, Slow (CC); CC immunity via cards |
| Equipped Cards Applied | combatPassive + effects resolved into player combat state at dungeon entry |
| Exhaustion Mechanic | Turn 12+: escalating damage taken (prevents stalling) |
| Rally Scaling | 1–3 players = weaker enemies; 5+ players = reinforcement spawns; max 20 enemies |
| Permadeath | 120s bleedout timer, revivable by teammates within 2 tiles, true death on timer expiry |
| 15-Second Turn Timer | Per-player decision window |

### 1.5 Social / Party / Guild

| Feature | Details |
|---------|---------|
| Party System | Create, invite, accept, leave, kick, party chat |
| Guild System | Create, join, leave, guild chat, vault (deposit/withdraw), persisted to disk as JSON |
| Context Menu | Right-click players: friend, party invite, trade, duel, profile, whisper |
| Character Select | Up to 4 characters per account, permadeath Hall of Heroes for dead characters |
| Multiple Characters | Create, rename, delete characters with PIN confirmation |

---

## 2. Server Wired, Client UI Missing

These systems are **fully functional on the server** but the player **cannot access them** because there is no LOVE 2D UI built yet.

| Feature | Server Status | What's Missing on Client |
|---------|---------------|--------------------------|
| NPC Shops (7 types) | Full: buy/sell, dynamic supply/demand pricing every 30s, Presence stat discount (up to 30%) | Client shows basic buy/sell but no price trends, no history, no market overview |
| Auction House | Full: list cards & resources, paginated browse, buy, cancel, 5% fee, 24h expiry, persisted to disk | No client UI at all |
| P2P Trading | Full: request → accept → offer → confirm flow, atomic validation, 30s timeout, anti-double-spend locks | No client UI at all |
| Overworld Monsters | 25+ types, biome-specific spawning, AI patrol/chase, max 80 per zone | No client-side rendering of overworld monsters |
| Quest System | Quest data structures exist, dungeon daily quests generate | No main quest log / quest tracker UI |
| Skill Trees | Melee/Magic subtypes defined (blade/blunt/martial, elemental/arcane/divine/shadow) | No skill tree visualization UI |
| Raid System | Lich raid gathering + multi-phase boss, raid floors every 50 dungeon floors | Partial client UI (gathering visible, boss phases incomplete) |
| Leviathan World Boss | Server spawns/manages roaming world bosses, multi-phase combat | Basic position tracking only on client |
| Lich Corruption | Server tracks zone corruption spread, shadow damage to players | Client renders purple overlay but player can't interact or cleanse |
| Knowledge / Codex | Glossary, lore, books, timeline, race lore system | Framework exists but content is sparse |

---

## 3. Stub / Not Implemented

| Feature | Current State |
|---------|---------------|
| PvP Combat | Skeletal framework in `battle.js`: challenge/accept/action events exist but damage is hardcoded to 10, no real formula, no monster roster |
| Card P2P Trading | `canTradeCardToRace()` validation logic exists but no socket handler wired, no client UI |
| Mount System | `account.mount` field stored, mount switching works, but no speed effects applied, no rendering, no combat restrictions |
| NPC Shop World Events | Price fluctuation via world events ("drought reduces herb supply") — not implemented |
| Dungeon Skill Benefits | `dungeon_dwelling` / `dungeon_delving` skills defined but effects not wired into gameplay |
| Card Pack on Boss Kill | Data supports it but not wired in dungeon handler |
| Enemy Patrol Ticking | Chase-on-player-move works, but timer-based patrol wandering not implemented |
| Audio | Zero audio — no music, no SFX, no ambient sounds |
| Player Corpse / Revive Visuals | Permadeath logic works but no visual death/revive animations on client |
| Guild Permissions / Ranks | Basic leader/member roles exist, no rank progression or permission system for general guilds |
| Guild Events / Wars | Not implemented |

---

## 4. Card System Deep Dive

### 4.1 All 820+ Cards by Category

| Category | Approx Count | Example Cards |
|----------|-------------|---------------|
| Stat Boosts (I/II/III) | ~30 | +1/2/3 Vigor, Might, Finesse, Acumen, Resolve, Presence, Ingenuity |
| Skill XP (+10/20/30%) | ~50 | Mining XP, Magic XP, Cooking XP, Archery XP, Lockpicking XP, Thievery XP |
| Combat Abilities (Damage) | ~300+ | Fireball, Lightning Bolt, Ice Shard, Meteor, Earth Spike, Holy Smite, Shadow Strike, Backstab, Assassinate |
| Support / Healing | ~30 | Heal Self, Heal Ally, Circle of Healing, Rejuvenation, Resurrection, Mass Heal, Cleanse, Purify, Sanctuary |
| Defense / Tanks | ~30 | Stone Skin, Shield Wall, Divine Shield, Bone Armor, Guardian Stance, War Cry |
| Crowd Control / DoT | ~25 | Poison Blade, Smoke Bomb, Oil Slick, Bramble Trap, Ice Wall, Poison Nova |
| Stealth / Rogue | ~25 | Backstab, Shadow Cloak, Lockmaster, Pickpocket, Vanish, Ambush, Garrote |
| Crafting / Trade | ~20 | Forge Mastery, Master Smith, Master Chef, Gourmet, Potion Potency, Transmutation |
| Gathering | ~15 | Double Ore, Double Wood, Bountiful Harvest, Green Thumb, Master Farmer |
| Racial Feats | ~25 | Elven Grace, Orcish Fury, Dwarven Endurance (race-locked bonuses) |
| Luck / Fortune | ~15 | Lucky Coin, Fortune's Favor, Jackpot, Loaded Dice, Miracle Worker, Nine Lives |
| Crime / Underworld | ~20 | Pickpocket Strike, Dirty Tricks, Shakedown, Marked for Death, Blackmail, Knife Fan, Escape Route |
| Dungeon-Specific | ~15 | Dungeon Fortitude, Delver's Instinct, Rift Walker, Boss Slayer, Dungeon Master, Rift Sovereign |
| Lizard Folk Rituals | ~10 | Tidal Invocation, Serpent Ward, Deep Communion, Primordial Sight, Leviathan Pact, Blood Tide Ritual |
| Necromancy | ~15 | Raise Skeleton, Life Drain, Soul Drain, Corpse Explosion, Death Grip, Bone Armor, Death Aura, Death Pact |
| Life Magic | ~15 | Healing Light, Greater Heal, Regeneration, Purify, Barrier of Light, Mass Heal, Divine Grace |
| Cogworking / Automaton | ~15 | Automaton Deploy, Clockwork Sentinel, Overclock, Explosive Charge, Repair Bot, Tesla Coil, Turret Upgrade |
| Synergy Cards | ~20 | Garden Chef, Herbalist Alchemist, Enchanted Forge, Feast Healer, Battle Cook, Runic Smith, Naturalist |
| Mythic+ / Relics | ~15 | All Stats V, XP Master, Phoenix Rebirth, Time Warp, Divine Blessing, World Shaper, Relic of Creation |
| Vision Equipment | ~10 | Thermal Goggles, Tremor Boots, Night Eye Elixir, All-Seeing Eye, Hunter's Visor |
| Equipment Modifiers | ~15 | Flaming, Frost, Poison, Holy, Shadow, Lightning weapon enchantments |
| Cleric / Purification | ~10 | Purifying Light, Sanctified Ward, Corruption Resistance, Holy Bulwark, Blessed Aegis, Divine Crusader |
| Farming / Gardening | ~10 | Green Thumb, Master Farmer, Nature's Blessing, Herb Garden, Botanical Knowledge, Master Gardener |

### 4.2 Rarity Tiers & Drop Rates

| Rarity | Weight | Drop Rate | Color | Base Sell Value |
|--------|--------|-----------|-------|-----------------|
| Common | 4500 | 45.0% | Gray (#888888) | 50 coins |
| Uncommon | 2500 | 25.0% | Green (#22cc22) | 200 coins |
| Rare | 1500 | 15.0% | Blue (#3388ff) | 500 coins |
| Ultra Rare | 800 | 8.0% | Purple (#aa44ff) | 1,500 coins |
| Mythic Rare | 400 | 4.0% | Orange (#ffaa00) | 5,000 coins |
| Legendary | 200 | 2.0% | Orange-Red (#ff6600) | 15,000 coins |
| Godly | 80 | 0.8% | Red (#ff0000) | 50,000 coins |
| Relic | 20 | 0.2% | White (#ffffff) | 200,000 coins |

**Total weight: 10,000**
Sell price to vendor = 25% of base value × style multiplier.

### 4.3 Pity System

| Mechanic | Value |
|----------|-------|
| Soft Pity Start | 80 pulls without Legendary+ |
| Soft Pity Bonus | +2% Legendary chance per pull beyond 80 |
| Hard Pity | Guaranteed Legendary at pull 120 |
| Pity Reset | When any Legendary or higher is pulled |
| Tracking Field | `account.pityPullsSinceLegendary` |

### 4.4 Race-Weighted Pack Drawing

| Race | Pool Bias | Chance per Draw | Effect |
|------|-----------|-----------------|--------|
| Elf | Magic-tagged cards | 40% | Forced draw from magic card pool |
| Goblin | Stealth-tagged cards | 35% | Forced draw from stealth card pool |
| Cat Folk | Luck-tagged cards | 40% | Forced draw from luck pool |
| Cat Folk | Rarity bump | 12% | Each card has 12% chance to advance one rarity tier |
| Lizard Folk | Ritual-tagged cards | 25% | Forced draw from ritual/magic pool |
| Human | No bias | — | Standard rates |
| Orc | No bias | — | Standard rates |
| Dwarf | No bias | — | Standard rates |
| Gnome | No bias | — | Standard rates |

### 4.5 Card Styles

| Style | Drop Chance | Border Effect | Sell Multiplier | Special |
|-------|-------------|---------------|-----------------|---------|
| Normal | 80% | None | 1.0× | — |
| Holographic | 12% | Rainbow shimmer | 1.5× | — |
| Golden | 5% | Gold glow | 2.0× | — |
| Prismatic | 2.5% | Prismatic shift | 3.0× | — |
| Void | 0.5% | Void particles | 5.0× | +10% to all numeric effect values |

On fusion: fused card inherits the best style from either parent (void > prismatic > golden > holographic > normal).

### 4.6 Card Fusion

| Rule | Details |
|------|---------|
| Input | Two cards of the same rarity |
| Output | One card of the next rarity tier |
| Max Fusions | 2 per card lineage |
| Relic Restriction | Relic cards cannot be fused |
| Same Card Bonus | If both cards have same cardId: max effect values × 1.05 |
| Different Card Bonus | If different cardIds: keep card1 effects × 1.10 |
| Fusion Level Bonus | Additional × (1 + fusionCount × 0.05) |
| Style Inheritance | Inherits best style from either parent |
| Name | Appended with +1, +2 based on fusion count |

### 4.7 Card Equipping & Slots

| Slot Type | Count | Unlocked At | Card Types |
|-----------|-------|-------------|------------|
| Active | 1 | Level 1 | active_ability, equipment_modifier, reactive |
| Active | 2 | Level 10 | (same) |
| Active | 3 | Level 20 | (same) |
| Active | 4 | Level 30 | (same) |
| Passive | 1 | Level 5 | passive_perk, skill_boost, stat_boost, gathering_boost, racial_feat |
| Passive | 2 | Level 15 | (same) |
| Passive | 3 | Level 25 | (same) |
| **Total** | **7** | Level 30 | — |

Card effects are aggregated via `getEquippedCardEffects()` and sent to client on equip/unequip. Racial feat cards apply `raceValue` bonus if equipped race matches.

### 4.8 Card Vendor Pricing

**Buying from Vendor:**

| Category | Common Price | Uncommon Price | Higher Rarities |
|----------|-------------|----------------|-----------------|
| Starter Cards (curated shop) | 20 coins | 50 coins | Not available |
| Regular Cards | 50 coins | 200 coins | Not available |

**Selling to Vendor** (25% of base × style multiplier):

| Rarity | Normal | Holographic | Golden | Prismatic | Void |
|--------|--------|-------------|--------|-----------|------|
| Common | 12 | 18 | 25 | 37 | 62 |
| Uncommon | 50 | 75 | 100 | 150 | 250 |
| Rare | 125 | 187 | 250 | 375 | 625 |
| Ultra Rare | 375 | 562 | 750 | 1,125 | 1,875 |
| Mythic Rare | 1,250 | 1,875 | 2,500 | 3,750 | 6,250 |
| Legendary | 3,750 | 5,625 | 7,500 | 11,250 | 18,750 |
| Godly | 12,500 | 18,750 | 25,000 | 37,500 | 62,500 |
| Relic | 50,000 | 75,000 | 100,000 | 150,000 | 250,000 |

### 4.9 Card Effect Types (100+)

| Category | Effect Names |
|----------|-------------|
| Stat Modifiers | stat_boost, stat_boost_all, hp_bonus, hp_multiplier, hp_regen |
| XP Bonuses | xp_bonus_all, xp_bonus_skill, xp_bonus_all_gathering |
| Skill Bonuses | mining_xp, crafting_xp, magic_xp, melee_xp, speed_bonus, crit_bonus, dodge_bonus, carry_weight |
| Combat Passives | lifesteal, poison_aura, mana_shield, debuff_resist, heal_on_kill, mana_regen |
| Gathering | double_gather, gather_bonus, double_gather_all |
| Crafting | craft_bonus, craft_quality_bonus, ingredientSaveChance, crafted_weapon_damage_bonus |
| Economy | luck_bonus, card_luck_bonus, loot_bonus, rare_resource_chance |
| Cooking | food_heal_bonus, food_buff_duration, food_buff_potency, feast_chance |
| Alchemical | potion_effectiveness, potion_duration_bonus, transmute_chance |
| Trading | sell_price_bonus, card_buyback_bonus, dungeon_gold_bonus |
| Crime / Stealth | stealth_bonus, lockpicking_bonus, thievery_bonus, steal_chance, stealth_attack_bonus |
| Specialized | tremor_sense_enhanced, grants_vision, hidden_detection, trap_detect_bonus, trap_damage_reduction |

### 4.10 Card Archetypes

| Archetype | Playstyle | Typical Cards |
|-----------|-----------|---------------|
| melee_dps | High melee damage output | Fireball, Power Strike, Cleave |
| glass_cannon | Maximum damage, low defense | Lightning Bolt, Meteor, Assassinate |
| assassin | Burst + stealth | Backstab, Vanish, Ambush, Garrote |
| pure_defense | Maximum survivability | Stone Skin, Shield Wall, Guardian Stance |
| tank | High HP, aggro management | War Cry, Bone Armor, Divine Shield |
| support | Healing and buffs | Heal Self, Circle of Healing, Sanctuary |
| utility | Crafting/gathering efficiency | Double Ore, Master Smith, Potion Potency |
| scout | Exploration and detection | Trap Detect, Tremor Sense, Night Vision |
| cc_dot | Crowd control + damage over time | Poison Cloud, Ice Wall, Bramble Trap |
| night_hunter | Darkness-focused stealth | Shadow Cloak, Shadow Strike, Dark Vision |
| grappler | Close-range control | Dirty Tricks, Oil Slick, Pin Down |
| aquatic | Water-based abilities | Tidal Invocation, Deep Communion, Water Breathing |

---

## 5. Combat System Deep Dive

### 5.1 Initiative & Turn Order

| Mechanic | Details |
|----------|---------|
| System | CT (Charge Time) based |
| Speed Accrual | All units gain CT equal to their speed each tick |
| Action Threshold | CT ≥ 100 allows unit to act |
| Simultaneous Grouping | Units within CT range of 5 act in same round |
| Post-Attack CT | CT = 0 (fastest reset) |
| Post-Move CT | CT = 20 |
| Post-Wait CT | CT = 40 |
| Turn Timer | 15 seconds per player decision |

### 5.2 Damage Calculation

| Step | Formula |
|------|---------|
| Base Damage | Weapon damage + stat scaling (Might for melee, Acumen for magic) |
| Critical Hit | Crit chance roll → 1.5× damage multiplier |
| Dodge | Dodge chance roll → complete miss |
| Armor Reduction | `damage × (1 - armor / (armor + 100))` |
| Elemental Resist/Weakness | 0.3× (strong resist) to 1.5× (weakness) multiplier |
| Armor Penetration | Bypasses a % of enemy armor |
| Lifesteal | % of dealt damage healed back to attacker |
| Reflect | Enemy returns % of received damage to attacker |

### 5.3 Status Effects

| Effect | Type | Behavior |
|--------|------|----------|
| Burn | Tick Damage | Fire damage per turn |
| Poison | Tick Damage | Poison damage per turn, can stack |
| Bleed | Tick Damage | Physical damage per turn |
| Stun | CC | Cannot act for duration |
| Root | CC | Cannot move for duration |
| Slow | CC | Reduced movement for duration |
| CC Immunity | Passive | Granted by equipped card passives, prevents all CC |
| Element Immunity | Passive | Immune to specific element damage (fire, ice, poison, lightning, etc.) |

### 5.4 Resource Pools

| Resource | Base Regen/Turn | Special Behavior |
|----------|-----------------|------------------|
| Mana | +3 | Standard magic resource |
| Stamina | +2 | Physical ability resource |
| Bloodlust | +15 on kill, +3 on hit, +2 on damage taken | Decays −3/turn after 2 turns idle |
| Focus | +10 per consecutive hit on same target | Resets on target switch |

### 5.5 Boss Mechanics

| Mechanic | Trigger | Effect |
|----------|---------|--------|
| Resurrect | Boss reaches 0 HP | Resurrects at 50% HP with new ability set |
| Death AoE | Boss dies | Leaves damaging zone for 8 turns post-death |
| Shield Phase | Boss activates | Immune to all damage until shield-bearer minions are killed |
| Summon Portals | Every 4 turns | Spawns minion-producing portals on the battlefield |
| Split | Boss reaches 50% HP | Fractures into 2 weaker copies |
| Regenerator | Passive | Heals 3% max HP per turn (must burst down) |
| Reflect | Passive | Reflects 25% of all damage back to attacker |
| Fury | HP-scaling | Attack power increases as HP drops (max 2.0× at 10% HP) |

### 5.6 Enemy Rank System

| Rank | HP Mult | ATK Mult | DEF Mult | XP Mult | Gold Mult | Class Templates |
|------|---------|----------|----------|---------|-----------|-----------------|
| Normal | 1.0× | 1.0× | 1.0× | 1.0× | 1.0× | 0 |
| Elite | 1.5× | 1.3× | 1.2× | 1.8× | 1.5× | 1 random |
| Rare | 2.0× | 1.5× | 1.4× | 2.5× | 2.0× | 1 random |
| Champion | 3.0× | 1.8× | 1.6× | 4.0× | 3.0× | 2 random |

**8 Class Templates** (applied to Elite+ enemies):

| Class | HP Mult | ATK Mult | DEF Mult | Granted Ability |
|-------|---------|----------|----------|-----------------|
| Pyromancer | 1.1× | 1.3× | 0.9× | Fireball |
| Frostweaver | 1.1× | 1.2× | 1.1× | Frost Bolt |
| Berserker | 1.3× | 1.4× | 0.7× | Frenzy Strike |
| Shadow | 0.9× | 1.3× | 0.8× | Shadow Strike |
| Healer | 1.2× | 0.8× | 1.2× | Heal Pulse |
| Venomancer | 1.0× | 1.2× | 1.0× | Venom Spit |
| Stormcaller | 1.0× | 1.3× | 0.9× | Chain Lightning |
| Guardian | 1.5× | 0.8× | 1.6× | Shield Bash |

### 5.7 Difficulty Tiers

| Difficulty | HP Mult | ATK Mult | DEF Mult | Elite Chance | Rare Chance | XP Mult |
|------------|---------|----------|----------|--------------|-------------|---------|
| Standard | 1.0× | 1.0× | 1.0× | 5% | 2% | 1.0× |
| Veteran | 1.3× | 1.2× | 1.15× | 10% | 4% | 1.3× |
| Elite | 1.7× | 1.4× | 1.3× | 15% | 8% | 1.6× |
| Mythic | 2.2× | 1.7× | 1.5× | 25% | 12% | 2.0× |

### 5.8 Rally Scaling (Group Size)

| Players | Enemy HP | Enemy ATK | Notes |
|---------|----------|-----------|-------|
| 1 | −20% | −25% | Solo scaling down |
| 2 | −10% | −12% | Duo scaling |
| 3 | −3% | −5% | Small group |
| 4 | Baseline | Baseline | Intended group size |
| 5+ | +10% per extra | +10% per extra | Reinforcement spawning |

Max 20 enemies on field simultaneously.

**Offline Mode:** −10% enemy stats, +10% XP bonus, no gold bonus.

### 5.9 Permadeath

| Stage | Timer | Details |
|-------|-------|---------|
| Downed | 120 seconds | Player enters bleedout state |
| Revive Window | During bleedout | Other players within 2 tiles (not in combat) can revive |
| Revive Result | — | Restored to 25% HP |
| True Death | Bleedout expires | Character permanently dead, added to Hall of Heroes |

---

## 6. Dungeon System Deep Dive

### 6.1 Rift vs Overworld Caves

| Property | The Rift | Overworld Caves |
|----------|----------|-----------------|
| Floors | Infinite | 3–10 based on biome |
| Seed | Daily (`rift_YYYY-MM-DD`) | Location (`cave_X_Y`) |
| Permanence | Resets daily | Permanent per world location |
| Guild Requirement | Yes (Adventure Guild rank) | No |
| Camp System | Yes | No |
| Boss Floors | Every 10th floor (Arena layout) | Final floor only |
| Raid Floors | Every 50th floor (8–16 players) | None |
| Theme Progression | Floors 1–5: castle; 6+: wild/lore | Matches overworld biome |
| Daily Quests | 3–5 generated per day | None |
| Leaderboard | Yes | No |

### 6.2 8 Layout Types

| Layout | Description |
|--------|-------------|
| BSP_ROOMS | Binary Space Partition with interconnected rooms and corridors |
| MAZE | Twisting corridors with dead ends and narrow passages |
| LAKE | Flooded central chamber with raised platforms and islands |
| OPEN_CAVERN | Large open space with scattered columns and natural formations |
| TEMPLE_HALLS | Structured religious architecture with symmetrical halls |
| ARENA | Open single arena (used for boss floors) |
| ISLAND | Island clusters separated by water |
| ORGANIC | Procedurally grown cavern structures with natural flow |

### 6.3 31 Dungeon Themes

**Castle Themes (Floors 1–5):**
stone_keep, grand_hall, armory_vault, throne_dungeon, catacombs, iron_forge, haunted_manor

**Wild / Lore Themes (Floors 6+):**
crystal_cavern, fungal_forest, lava_rift, frozen_depths, flooded_ruins, floating_islands, bone_yard, shadow_realm, overgrown_temple, clockwork_maze, sand_tomb, coral_grotto, void_debris, ancient_library

**Extended Themes:**
tidal_vault, plague_warren, elven_reliquary, gnomish_workshop, orc_barrow, mirage_palace, frost_citadel, goblin_warrens, ashen_observatory, sunken_cathedral, puzzle_labyrinth, celestial_spire, infernal_pit, dragons_den, vampire_castle, lich_sanctum, cogwork_foundry, astral_rift, dinosaur_jungle, spider_hive, sunken_depths, abyssal_dark, werewolf_den, troll_caves, ruined_village, ocean_arena

Each theme has: wall/floor/accent RGB colors, element mapping, resistances & weaknesses, unique enemy pools (shallow/mid/deep/boss tiers).

### 6.4 80+ Enemy Types

Enemies organized by theme, 4–8 per tier per theme. Examples:

| Theme | Shallow | Mid | Deep | Boss |
|-------|---------|-----|------|------|
| stone_keep | Skeleton Guard, Rat Swarm | Stone Golem, Dark Knight | Shadow Assassin | Throne Guardian |
| lava_rift | Fire Imp, Magma Slug | Lava Elemental, Flame Priest | Obsidian Golem | Molten Titan |
| frozen_depths | Ice Sprite, Frost Bat | Ice Golem, Frost Mage | Frozen Revenant | Frost Wyrm |
| fungal_forest | Mushroom Sprite, Spore Crawler | Myconid Warrior, Fungal Beast | Rot Hulk | Fungal Overmind |
| shadow_realm | Shadow Wisp, Dark Imp | Shadow Knight, Void Walker | Nightmare Shade | Shadow Lord |
| clockwork_maze | Gear Rat, Spring Trap | Clockwork Soldier, Steam Golem | Mech Spider | Clockwork Titan |

### 6.5 Fog of War & Vision

| Feature | Details |
|---------|---------|
| LOS Algorithm | Tile-based line-of-sight via `dungeon-vision.js` |
| Three States | Unseen (black), Remembered (gray/dimmed), Visible (fully lit) |
| Darkvision Races | Dwarf, Goblin, Cat Folk — larger vision radius in dense fog |
| Thermal Vision | Lizard Folk — heat signature overlay showing warm entities |
| Tremor Sense | Lizard Folk / Dwarf — ground vibration ripples showing movement |
| Torch | 300s duration, standard light radius |
| Lantern | 600s duration, larger light radius |
| Light Propagation | Light sources illuminate surrounding tiles, affects enemy visibility filtering |
| Fog Memory | Players remember previously explored tiles (shown dimmed) |
| Pitch-Black Floors | Special mechanic — no ambient light, requires torch/lantern |

### 6.6 Camp System

| Action | Availability | Effect |
|--------|-------------|--------|
| Cook | Rift only | Prepare meals (cooking skill check), restore stamina |
| Shrine | Rift only | Gain temporary stat buffs (ATK, DEF, HP, LUCK bonuses) |
| Ambush | Random event | Chance enemies attack camp during rest period |

### 6.7 Guild Ranks & Daily Quests

**10 Adventure Guild Ranks:**

| Rank | Order |
|------|-------|
| Stone | 1 (starting) |
| Bronze | 2 |
| Iron | 3 |
| Steel | 4 |
| Mithril | 5 |
| Adamant | 6 |
| Runestone | 7 |
| Titanite | 8 |
| Mythril | 9 |
| Relic | 10 (highest) |

**Daily Quest Types:**

| Quest Type | Objective |
|------------|-----------|
| kill_enemies | Kill N enemies on a floor |
| no_damage | Clear a floor without taking damage |
| clear_floor | Fully explore and clear a floor |
| speedrun | Complete a floor within time limit |
| survive_duration | Survive N turns in combat without dying |

---

## 7. Economy & Progression

### 7.1 Economy Flow Diagram

```
Gathering (free)
  └→ Resources
       ├→ Crafting → Items / Equipment / Consumables
       ├→ NPC Shops (buy/sell with dynamic pricing)
       ├→ Auction House (player marketplace, 5% fee)
       └→ P2P Trading (direct swap)

Level-Up
  └→ Card Packs
       └→ Cards
            ├→ Equip (combat power)
            ├→ Fuse (rarity upgrade)
            ├→ Sell to Vendor (coins)
            ├→ Auction House (coins)
            └→ Guild Vault (shared storage)
```

**Currency:** `coins` (underlying field is still `account.chips` in code).

### 7.2 NPC Shop System

**Status:** Server FULL, Client STUB

| Property | Value |
|----------|-------|
| Shop Types | 7 (general, blacksmith, fishmonger, alchemist, jeweler, engineer, provisions) |
| Resource Types | 28 with base prices 5–120 coins |
| Price Range | 0.5× to 2.0× of base price |
| Fluctuation Tick | Every 30 seconds |
| Pressure Decay | 15% per tick |
| Natural Drift | 0.5% per tick back toward 1.0× |
| Buy Markup | 20% above market price |
| Sell Discount | 80% of market price |
| Presence Discount | 2% per stat point above 5 (max 30%) |
| Anti-Arbitrage | Sell price capped at 95% of buy price |

### 7.3 Auction House

**Status:** Server FULL + Persisted to Disk, Client STUB

| Property | Value |
|----------|-------|
| Storage | `data/auction/listings.json` (debounced saves) |
| Listing Types | RPG cards and resources |
| Max Listings/Player | 20 |
| Max Total Listings | 500 |
| Marketplace Fee | 5% of sale price |
| Expiry | 24 hours (items auto-returned) |
| Pagination | Default 50, max 100 per page |
| Filters | Type, rarity, search term |
| Race Condition Prevention | Purchase locks on both buyer and seller |

### 7.4 P2P Trading

**Status:** Server FULL, Client STUB

| Step | Details |
|------|---------|
| 1. Request | Must be in same zone, 30s auto-expiry if not accepted |
| 2. Accept | Target player accepts |
| 3. Offer | Both players add items: resources, cards, coins (max 10 items) |
| 4. Confirm | Both players lock in offers |
| 5. Execute | Atomic transfer with full re-validation at execution time |
| Safety | Double-spend prevention via execution locks on both accounts |

### 7.5 Crafting System

**Status:** Server FULL, Client STUB

| Feature | Details |
|---------|---------|
| Recipe Count | 60+ recipes across multiple tiers |
| Station Types | None (basic), Forge (smelting), Anvil (smithing), Crafting Table, Alchemy Table, etc. |
| Skill Requirements | Many recipes require minimum crafting/skill level |
| Durability | Tools and weapons decay with use, can be repaired (normal + emergency) |
| Gem Sockets | Socket gems into items for stat bonuses |
| Augmentation | Apply augment materials to items |
| Imbuing | Special effects on rings and jewelry |
| Scrolls | Consumable utility items via inscription |
| Food | Edible items for healing/buffs via consume_food event |

**Placeable Structures:** Forge, anvil, storage chest, wall, door, raft, bridge, crop plot, water trough, crafting table, upgrade station, trading booth, bed, bookshelf, cauldron, table, chair, barrel, crate, banner, loom, alchemy table, enchanting table, tanning rack, brewery, jeweler's bench.

### 7.6 Resource / Gathering

| Resource Category | Examples |
|-------------------|----------|
| Wood | wood |
| Stone | stone |
| Ores | iron_ore, bronze_ore, copper_ore, silver_ore, gold_ore, steel_ore, mithril_ore |
| Bars | iron_bar, bronze_bar |
| Fish | fish, cooked_fish, shellfish |
| Plants | herbs, vegetables, mushroom, wheat, seaweed |
| Food | bread, stew |
| Glass | glass_sand, glass, glass_lens, glass_vial |
| Clockwork | cogs, gears, springs, clockwork_core |
| Magic | mana_crystal |
| Gems | gem_rough, gem_cut |
| Potions | potion_health, potion_mana |

**Gathering Skills:** Mining, Woodcutting, Farming, Fishing, Foraging, Skinning, Herbalism.

**Yield Scaling:** Affected by Might stat, Finesse stat, skill level, and tool quality.

### 7.7 Skill / XP Progression

**35+ Skills across categories:**

| Category | Skills |
|----------|--------|
| Gathering | Mining, Woodcutting, Farming, Fishing, Foraging, Skinning, Herbalism |
| Crafting | Cooking, Glassworking, Crafting, Cogworking, Alchemy, Enchanting, Leatherworking, Brewing, Carpentry, Jewelcrafting, Transmutation, Sigil Scripting, Sewing |
| Combat | Magic (+elemental/arcane/divine/shadow), Melee (+blade/blunt/martial), Archery, Necromancy, Life Magic, Weather Magic, Animal Handling |
| Rogue | Lockpicking, Thievery |
| Social | Coercion, Deception, Psychology, Gourmand |
| Exploration | Dungeon Dwelling, Dungeon Delving, Survival, Anatomy |
| Race-Locked | Ritual Magic, Water Rituals, Blood Rituals (Lizard Folk only) |

**XP Formulas:**

| Type | Formula | Notes |
|------|---------|-------|
| Skill XP | `xpForLevel(n) = 80 × n^1.7` | Polynomial curve |
| Spillover | 10% of all skill XP → overall level | Automatic |
| Overall XP | `overallXpForLevel(n) = 200 × n^1.6` | Separate curve |
| Max Level | 100 (overall) / 99 (skills) | — |

**XP Multiplier Stack (applied in order):**

1. Server xpRate config
2. Racial bonuses (e.g., Elf +50% magic XP)
3. Acumen stat bonus: +1% per point above 5
4. Equipped card bonuses (xp_bonus_all, xp_bonus_skill)
5. Tool/method bonuses

**Level-Up Rewards:**

| Reward | When |
|--------|------|
| Card Pack | Every level-up |
| Stat Point | Every 3 levels (starting level 3) |
| Active Card Slot | Levels 1, 10, 20, 30 |
| Passive Card Slot | Levels 5, 15, 25 |

### 7.8 Character Stats

| Stat | Short | Effects |
|------|-------|---------|
| Vigor | VIG | HP, stamina, poison resist, carry weight |
| Might | MGT | Melee damage, mining yield, harvest speed |
| Finesse | FIN | Crit chance, dodge, movement speed, fishing |
| Acumen | ACU | Magic power, +1% XP per point above 5, crafting quality |
| Resolve | RES | Magic resist, debuff reduction, HP regen |
| Presence | PRE | Trade prices (−2% per point above 5), NPC favor, party buff range |
| Ingenuity | ING | Crafting speed, cogworking yield, repair effectiveness |

**Base:** 5 each. **At creation:** +5 free points. **Growth:** +1 free point every 3 levels.

---

## 8. Race System

### 8.1 8 Playable Races

| Race | Stat Bumps | Vision | Racial Feat | Key Perks |
|------|-----------|--------|-------------|-----------|
| Human | +PRE, +RES | Normal | Dominion Authority | +15% XP, +20% Holy Dominion market, coercion/deception, −25% property cost |
| Elf | +ACU, +FIN, −2 VIG, −MGT | Normal | Millennial Memory | +50% magic XP, +30% magic unlocks, −15% melee, −10% HP |
| Orc | +MGT, +VIG, −ACU | Normal | Khanate Vitality | +25% melee/archery, +25% HP, +2 HP regen/s |
| Dwarf | +VIG, +ING, −FIN | Darkvision | Stone-Born Artisan | +25% mining/crafting, +15% jewel, Stone Skin (+10 armor), minor tremor sense |
| Gnome | +ING, +ACU, −MGT | Normal | Tinker Savant | +50% cogworking XP, +25% engineering, automaton crafting |
| Goblin | +FIN, +RES, −MGT | Darkvision | Guerrilla Instinct | +30% stealth, +20% stealth attack/thievery/lockpicking/archery, +30% biome speed, knives |
| Lizard Folk | +ACU, +RES, +FIN, −PRE | Thermal | Aquatic Heritage | +15% fishing, swim/dive freely, water breathing, ocean caves, full tremor sense |
| Cat Folk | +FIN, +PRE, −VIG | Darkvision | Pattern Recognition | +20% card luck, +15% general luck, unarmed, +15% stealth/lockpick, +30% desert speed |

### 8.2 Card Trading Restrictions by Race

| Rule | Details |
|------|---------|
| Innate Trait Cards | Tremor sense, water breathing, stone skin, etc. — cannot be traded to races without those traits |
| Race-Locked Cards | Lizard Folk ritual magic — can only be traded to Lizard Folk |
| Same-Race Trading | Players of same race CAN trade upgraded/altered versions of innate cards |
| Base Cards | All base skill/perk/stat cards can be traded freely between any race |

### 8.3 Languages

| Language | Native Race(s) |
|----------|---------------|
| Common | All races |
| Elvish | Elf |
| Orcish | Orc |
| Dwarvish | Dwarf |
| Gnomish | Gnome |
| Goblin | Goblin |
| Draconic | Lizard Folk |
| Catfolk | Cat Folk |

All races can learn additional languages over time through study/immersion.

---

## 9. World & Infrastructure

### 9.1 10 Anchor Towns

| Town | Zone ID | Race | Ref Position | Overworld Pixel |
|------|---------|------|-------------|-----------------|
| The Holy Dominion | starter_town | Human (starter) | (35, 42) | (529920, 661504) |
| Solara | solara | Human (capital) | (40, 38) | (532480, 659456) |
| Sylvaris | sylvaris | Elf | (45, 55) | (535040, 668160) |
| Ironhold | ironhold | Dwarf | (32, 8) | (528384, 644096) |
| Kragmor | kragmor | Orc | (18, 25) | (521216, 652800) |
| BoneTrap | bonetrap | Goblin | (10, 38) | (517120, 659456) |
| Murkmire | murkmire | Lizard Folk | (15, 52) | (519680, 666624) |
| Mechspire | mechspire | Gnome | (95, 38) | (560640, 659456) |
| Clockwork Harbor | clockwork_harbor_town | Gnome (port) | (92, 50) | (559104, 665600) |
| Fortune's Rest | fortunes_rest | Cat Folk | (35, −8) | (529920, 635904) |

### 9.2 Portal System

**Anchor Portals (Town-to-Town):**

| Property | Value |
|----------|-------|
| Cost | Free |
| Requirement | Must be in a town near Portal Nexus NPC |
| Destinations | All 10 anchor towns |
| Cooldown | 30 seconds between teleports |

**Personal Portals:**

| Property | Value |
|----------|-------|
| Crafting Cost | 5 mana crystals + 10 stone + 5 iron bars + 3 gem cuts |
| Skill Requirement | Crafting level 20 |
| Placement | On claimed plot only |
| Usage Range | 256 pixels from portal |
| Cooldown | 30 seconds |
| Destruction | Can destroy to reclaim partial resources |

### 9.3 Plot & Building System

| Property | Value |
|----------|-------|
| Plot Size | 512×512 pixels (1 chunk) |
| Snapping | Grid-aligned (512px) |
| Limit | One plot per player |
| Unclaim | Two-step confirmation (30s timeout) |
| Re-claim | Abandoned plots can be claimed by other players |
| Persistence | `data/plots/{zoneId}.json` |

**Placeable Objects (25+ types):**

| Category | Objects |
|----------|---------|
| Crafting Stations | Forge, anvil, crafting table, alchemy table, enchanting table, brewery, jeweler's bench, loom, tanning rack |
| Storage | Storage chest (max 20 items), barrel, crate |
| Structure | Wall, door, bed, table, chair, bookshelf, banner |
| Utility | Cauldron, crop plot, water trough, upgrade station, trading booth |
| Transport | Raft, bridge |

### 9.4 Mount System

**Status:** PARTIAL — stored but not rendered or mechanically applied

| Mount | Type | Notes |
|-------|------|-------|
| Horse | Land | Standard mount |
| Caravan | Land | Trade/storage mount |
| Raft | Water | Requires raft item in inventory |
| Boat | Water | Requires boat item in inventory |
| Ship | Water | Not implemented |
| Airship | Air | Not implemented |
| Flying Mount | Air | Not implemented |
| Sea Mount | Water | Not implemented |

---

## 10. Client Technical Overview

### 10.1 All Scenes

| Scene | File | Purpose |
|-------|------|---------|
| Shards | `scenes/shards.lua` | Server selection: browse servers, direct connect, host offline/LAN |
| Login | `scenes/login.lua` | Authentication: PoW challenge, password, key/account management |
| Character Select | `scenes/character_select.lua` | Multi-character: list/play/create/rename/delete, permadeath Hall of Heroes |
| Race Select | `scenes/race_select.lua` | One-time race choice with stat preview and permanent confirmation |
| Game | `scenes/game.lua` | Main gameplay: overworld, towns, dungeons, all UI panels |

**Scene Flow:** Shards → Login → Character Select → Race Select (first time) → Game

### 10.2 Game Scene UI Panels

| Panel | Keybind | Features |
|-------|---------|----------|
| Inventory | I | Resource list, items, crafting recipes with skill requirements |
| Character Sheet | C | 7 stats display, free stat points, level/XP bars, skill list |
| Card Collection | K | View/equip/fuse cards, filter by type/rarity, detail view, 5 loadout slots |
| World Map | M | Overworld map, chunk streaming, biome colors, resource/cave markers |
| Chat | Enter | Local, guild, whisper, party chat with message history (50 messages) |
| Equipment | B | Equip/unequip gear, durability display, repair |
| Dungeon Quests | Q | Daily quests, progress tracking, leaderboard, guild info (dungeon only) |
| Party | P | Member list, invite management, party chat |
| NPC Shop | Talk to NPC | Buy/sell resources (basic UI, no trends) |
| Card Vendor | Talk to NPC | Buy common/uncommon, sell any card |
| Portal | Talk to NPC | Anchor town list, teleport with cooldown |
| Context Menu | Right-click player | Friend, party, trade, duel, profile, whisper |
| Placement Mode | Command | Build on claimed plot, remove objects, preview |

### 10.3 Keybindings

**Movement:**

| Key | Action |
|-----|--------|
| W / A / S / D | Move up / left / down / right |
| Shift + WASD | Sprint (2× speed, stamina drain) |

**UI Panels:**

| Key | Action |
|-----|--------|
| I | Toggle Inventory |
| C | Toggle Character Sheet |
| K | Toggle Card Collection |
| M | Toggle World Map |
| Q | Toggle Dungeon Quests (in dungeon) |
| L | Toggle Leaderboard (in dungeon) |
| P | Toggle Party Panel |
| B | Toggle Equipment |
| E | Interact / Harvest (hold for auto-harvest) |
| Enter | Toggle Chat Input |
| Escape | Close topmost panel / go back |
| F10 | Admin Panel (server hosts only) |

**Dungeon-Specific:**

| Key | Action |
|-----|--------|
| W / A / S / D | Move one tile (grid-based) |
| Space | End turn / wait |
| 1 / 2 / 3 | Use equipped card ability 1 / 2 / 3 |

### 10.4 Rendering & Visuals

| System | Details |
|--------|---------|
| Overworld | Tile-based terrain, chunk streaming, 17 biome colors, rivers, lakes, forests, caves |
| Towns | NPCs (shops, guilds, portals), placed objects, player sprites with nametags |
| Dungeons | 32px tile grid, 31 theme color schemes, fog of war (3 states), enemy sprites with HP bars |
| Players | Colored circles with name tags, guild tags, racial colors |
| UI | Rarity-colored cards, floating damage/XP numbers, health/stamina bars, context menus |
| Effects | Level-up golden ring, card reveal animation, corruption purple pulse, time-of-day tint |
| Weather | Visual overlay (rain, fog, clear sky) |
| Lighting | Time-of-day shadows (dawn/day/dusk/night) |

### 10.5 Audio

**Not implemented.** Zero audio — no music, no SFX, no ambient sounds.

### 10.6 Networking Events (Client → Server)

| Category | Events |
|----------|--------|
| Auth | race_select, account_set_pin |
| Zone | zone_enter, zone_move, zone_chat, zone_monsters_request |
| Harvest | resource_harvest |
| Crafting | get_recipes, craft_item, repair_item, emergency_repair, consume_food, gem_socket_item, apply_augment, imbue_ring, inscribe_scroll |
| Stats | stat_allocate, equip_item, get_durability |
| Cards | card_open_pack, card_equip, card_unequip, get_cards, card_fuse, card_vendor_buy, card_vendor_sell |
| Guild | guild_create, guild_join, guild_leave, guild_chat, guild_vault_browse, guild_vault_deposit, guild_vault_withdraw |
| Trade | trade_request, trade_accept, trade_offer, trade_confirm, trade_cancel |
| Auction | mmo_auction_browse, mmo_auction_list_card, mmo_auction_list_resource, mmo_auction_buy, mmo_auction_cancel |
| Shop | npc_shop_browse, npc_shop_buy, npc_shop_sell, npc_shop_prices, npc_shop_all_prices |
| Land | claim_plot, unclaim_plot, place_object, remove_object |
| Portal | portal_list, portal_travel, portal_craft, portal_destroy |
| Dungeon | dungeon_enter, dungeon_exit, dungeon_move, dungeon_attack, dungeon_open_chest, dungeon_harvest, dungeon_camp_place, dungeon_camp_action, dungeon_quest_list, dungeon_quest_complete, dungeon_guild_signup, dungeon_leaderboard, dungeon_descend, dungeon_ascend |
| Combat | tc_combat_start, tc_combat_action, tc_combat_reaction, tc_combat_end |
| Party | party_create, party_invite, party_accept, party_leave, party_message, party_kick |
| Admin | admin_xp_rate, admin_drop_rate, server_shutdown |

### 10.7 Networking Events (Server → Client)

| Category | Events |
|----------|--------|
| Auth | identity, password_required, pin_required, pin_set_success, pin_set_error |
| Zone | zone_state, player_entered_zone, player_left_zone, player_moved, zone_move_corrected, zone_message, zone_positions, zone_monsters, zone_monster_spawned, zone_monster_died, zone_error |
| Character | race_selected, race_select_error, stat_updated, stat_error, rpg_stats |
| Cards | card_collection, card_pack_opened, card_equipped, card_unequipped, card_fuse_result, card_error |
| Inventory | inventory_updated, mount_changed |
| Harvest | harvest_result, harvest_error, resource_depleted, resource_destroyed |
| Crafting | recipes_list, craft_result, craft_error |
| Equipment | durability_info, equipment_updated, equip_error, repair_result, repair_error |
| Placement | object_placed, object_removed, place_error, place_result, plot_claimed, plot_unclaimed, claim_plot_result, unclaim_plot_result |
| Trade | trade_request_received, trade_started, trade_offer_updated, trade_partner_confirmed, trade_completed, trade_cancelled, trade_expired, trade_error |
| Shop | npc_shop_list, npc_shop_prices_result, npc_shop_bought, npc_shop_sold, npc_shop_error |
| Auction | mmo_auction_browse, mmo_auction_buy, mmo_auction_cancel |
| Guild | guild_joined, guild_left, guild_message, guild_error |
| Portal | portal_list, portal_traveled, portal_error |
| Dungeon | dungeon_floor_state, dungeon_player_moved, dungeon_combat_result, dungeon_chest_result, dungeon_trap_triggered, dungeon_harvest_result, dungeon_camp_placed, dungeon_camp_result, dungeon_camp_ambush, dungeon_guild_result, dungeon_quest_list_result, dungeon_quest_complete_result, dungeon_leaderboard_result, dungeon_enemy_updated, dungeon_player_died, dungeon_combat_state, dungeon_enemy_attack, dungeon_boss_phase, dungeon_visibility_update, dungeon_vision_changed, dungeon_torch_active, dungeon_lantern_active, dungeon_trap_detected, dungeon_shortcut_found, dungeon_error, cave_is_dungeon |
| Combat | tc_combat_start, tc_combat_turn, tc_combat_initiative, tc_combat_action_resolved, tc_combat_reaction, tc_combat_reaction_result, tc_combat_result, tc_combat_end, tc_units_spawned, tc_combat_error |
| Party | party_created, party_updated, party_disbanded, party_invite_received, party_invite_sent, party_message, party_error |
| Permadeath | player_downed, player_downed_notification, player_revived, permadeath_triggered, hall_of_heroes_result |
| World | world_time, server_stats, world_event, zone_director_update, corruption_update, corruption_damage, town_under_attack, corruption_cleanse_result, corruption_card_cleanse_result |
| Raid | raid_state_update, raid_boss_ready, raid_boss_hp, raid_boss_wipe, raid_boss_mechanic, raid_gathering_update, raid_joined, raid_activated, raid_cancelled, raid_boss_engage, raid_complete |
| Leviathan | leviathan_positions, leviathan_warning, leviathan_aggro, leviathan_combat_start, leviathan_part_destroyed, leviathan_phase_change, leviathan_enrage, leviathan_flee_success, leviathan_flee_failed, leviathan_info_result |
| Knowledge | knowledge_data, knowledge_book_content, knowledge_book_discovered, knowledge_term_unlocked |
| Admin | admin_result, server_shutdown, admin_kicked, server_rules_updated |

---

## 11. Subsystem Completeness Matrix

| System | Server | Client UI | Persistence | Overall Status |
|--------|--------|-----------|-------------|----------------|
| Overworld Exploration | FULL | FULL | N/A | FULLY WIRED |
| Town / Zone Navigation | FULL | FULL | N/A | FULLY WIRED |
| Resource Gathering | FULL | FULL | Account file | FULLY WIRED |
| Crafting | FULL | STUB | N/A | SERVER ONLY |
| Character Stats | FULL | FULL | Account file | FULLY WIRED |
| Race System | FULL | FULL | Account file | FULLY WIRED |
| Skill / XP Progression | FULL | PARTIAL | Account file | MOSTLY WIRED |
| Card Pack Opening | FULL | FULL | Account file | FULLY WIRED |
| Card Equipping | FULL | FULL | Account file | FULLY WIRED |
| Card Fusion | FULL | PARTIAL | Account file | MOSTLY WIRED |
| Card Vendor | FULL | FULL | Account file | FULLY WIRED |
| Card Collection UI | FULL | FULL | Account file | FULLY WIRED |
| Card P2P Trading | STUB | NONE | N/A | NOT IMPLEMENTED |
| NPC Shops | FULL | STUB | In-memory | SERVER ONLY |
| Auction House | FULL | NONE | Disk (JSON) | SERVER ONLY |
| P2P Trading | FULL | NONE | Real-time | SERVER ONLY |
| Guild System | FULL | STUB | Disk (JSON) | MOSTLY WIRED |
| Party System | FULL | FULL | In-memory | FULLY WIRED |
| Plot Claiming | FULL | STUB | Disk (JSON) | SERVER ONLY |
| Object Placement | FULL | STUB | Disk (JSON) | SERVER ONLY |
| Portal System | FULL | PARTIAL | Account file | MOSTLY WIRED |
| Mount System | PARTIAL | NONE | Account file | STUB |
| Rift Dungeon | FULL | FULL | Daily seed | FULLY WIRED |
| Overworld Caves | FULL | FULL | Location seed | FULLY WIRED |
| Tactical Combat | FULL | FULL | In-combat | FULLY WIRED |
| Fog of War | FULL | FULL | Per-floor | FULLY WIRED |
| Camp System | FULL | FULL | Per-floor | FULLY WIRED |
| Daily Quests | FULL | FULL | Per-day | FULLY WIRED |
| Dungeon Leaderboard | FULL | FULL | In-memory | FULLY WIRED |
| Boss Mechanics | FULL | FULL | Per-combat | FULLY WIRED |
| Permadeath | FULL | FULL | Account file | FULLY WIRED |
| PvP Combat | STUB | NONE | N/A | NOT IMPLEMENTED |
| Overworld Monsters | FULL | NONE | In-memory | SERVER ONLY |
| Raid System | PARTIAL | PARTIAL | In-memory | PARTIAL |
| Leviathan World Boss | PARTIAL | PARTIAL | In-memory | PARTIAL |
| Corruption System | PARTIAL | PARTIAL | In-memory | PARTIAL |
| Quest System (Main) | STUB | NONE | Account file | NOT IMPLEMENTED |
| Audio | N/A | NONE | N/A | NOT IMPLEMENTED |
| Chat | FULL | FULL | In-memory | FULLY WIRED |

---

## 12. Priority Gaps & Recommendations

### High Impact — Server Systems Awaiting Client UI

These are the biggest wins: the server code is complete and tested, only needing LOVE 2D client panels.

| Priority | Feature | Effort Estimate | Impact |
|----------|---------|-----------------|--------|
| 1 | Auction House Client UI | Medium | Enables player economy — currently completely inaccessible |
| 2 | P2P Trading Client UI | Medium | Core social feature — server fully ready |
| 3 | NPC Shop Full UI (price trends, market overview) | Medium | Economy depth — basic buy/sell exists but no market data shown |
| 4 | Overworld Monster Client Rendering | Medium | Makes the overworld feel alive — 25+ monster types already spawning on server |
| 5 | Crafting UI Enhancement | Low | Currently basic — needs station proximity display, recipe browser |

### Medium Impact — Missing Mechanics

| Priority | Feature | Effort Estimate | Impact |
|----------|---------|-----------------|--------|
| 6 | Card P2P Trading Socket Handler | Low | Validation logic exists, just needs wiring |
| 7 | Card Pack Drop on Boss Kill | Low | Data supports it, one-line wiring in dungeon handler |
| 8 | Mount Speed + Rendering | Medium | Stored but no gameplay or visual effect |
| 9 | Enemy Patrol Ticking (timer-based) | Low | Chase works, just needs idle wandering |
| 10 | Dungeon Skill Benefits Wiring | Low | Skills exist but effects not applied |

### Low Impact (But Noticeable) — Polish

| Priority | Feature | Effort Estimate | Impact |
|----------|---------|-----------------|--------|
| 11 | Audio (music + SFX) | High | Zero audio currently — significant atmosphere gap |
| 12 | PvP Combat Formulas | High | Skeleton exists, needs real damage calc + UI |
| 13 | Guild Permissions / Rank System | Medium | Only leader/member roles currently |
| 14 | Main Quest System | High | No quest content beyond dungeon dailies |
| 15 | NPC Shop World Events | Medium | Price fluctuation via world events not implemented |

---

*Generated from codebase audit — February 26, 2026*
