# MMOLite — Game Design Document (Detailed)
## For Art Direction & Production Reference

**Version:** 1.0
**Date:** February 2026
**Engine:** Node.js (Socket.IO) Server + LOVE 2D (Lua) Client
**Genre:** 2D Top-Down Fantasy MMO RPG
**Visual Style:** Colored rectangles, circles, and pixel-art icon overlays
**Target Platform:** PC (Windows/Mac/Linux via LOVE 2D)

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [World & Lore](#2-world--lore)
3. [Playable Races](#3-playable-races)
4. [RPG Stats & Progression](#4-rpg-stats--progression)
5. [Skills System](#5-skills-system)
6. [Card Gacha System](#6-card-gacha-system)
7. [Zones & Navigation](#7-zones--navigation)
8. [Overworld & Biomes](#8-overworld--biomes)
9. [Towns & Buildings](#9-towns--buildings)
10. [The Rift (Infinite Dungeon)](#10-the-rift-infinite-dungeon)
11. [Overworld Dungeons (Caves)](#11-overworld-dungeons-caves)
12. [Combat System](#12-combat-system)
13. [Enemy AI & Archetypes](#13-enemy-ai--archetypes)
14. [Crafting & Resources](#14-crafting--resources)
15. [Economy & Trading](#15-economy--trading)
16. [Social Systems](#16-social-systems)
17. [Portal & Travel](#17-portal--travel)
18. [Plot & Building](#18-plot--building)
19. [Controls & HUD](#19-controls--hud)
20. [Visual Direction](#20-visual-direction)
21. [Future Features](#21-future-features)
22. [Atmosphere & Narrative Design (Planned)](#22-atmosphere--narrative-design-planned)

---

## 1. Game Overview

MMOLite is a persistent-world 2D fantasy MMO where players explore a massive procedurally-generated continent, delve into daily-seeded infinite dungeons, collect gacha cards that grant passive and active abilities, craft items, trade with other players, and build on claimed land plots.

The game blends classic MMO social and economic gameplay (guilds, auction house, NPC shops, player trading) with a roguelite dungeon-crawling core (The Rift) and a deep collectible card system that replaces traditional equipment slots with a gacha-driven power system.

**Core Gameplay Loop:**
1. Explore the overworld — gather resources, discover caves, visit towns
2. Level skills by gathering, crafting, and combat
3. Earn card packs on level-up — open, equip, fuse, trade cards
4. Join the Adventure Guild — unlock The Rift dungeon
5. Delve The Rift — push deeper for better loot, leaderboard placement, guild rank
6. Trade and socialize — auction house, NPC shops, guilds, player-to-player trade
7. Build on your plot — claim land, place structures, set up a personal portal

**Server Architecture:**
- Multi-shard system with a master server coordinating shard discovery
- Currently 2 official shards: "Holy Dominion" (Shard 1) and "The Free Holds of Stone" (Shard 2)
- Redis-backed cross-process state sync
- Daily server wipe at midnight UTC (dungeon seeds, ephemeral state)
- Account data persists (encrypted file storage with AES-256-GCM)

---

## 2. World & Lore

### The Continent

The world is a massive fantasy continent spanning 10,000 km x 12,500 km (2000 x 2500 chunks, each chunk = 5 km). The continent contains diverse biomes shaped by the political and cultural territories of 8 playable races.

### Named Regions

| Region | Area | Biome | Description |
|--------|------|-------|-------------|
| **The Holy Dominion** | Central | Temperate plains | Theocratic human empire, political center of the known world. Cathedral cities, farmland, fortified towns. |
| **Elven South** | Southeast | Dense forest | Administered remnant of the ancient Elven bureaucratic caste. Towering trees, ley-line nodes, magical academies. |
| **Dwarven Mountains** | North-central | Alpine peaks | Anarcho-syndicalist holds carved into the stone. Vast underground forge-cities connected by mine shafts. |
| **Orcish Steppes** | West | Rolling grassland | Nomadic military confederation. Tent cities, horse herds, and a culture built around mounted warfare and honor. |
| **Gnomish Isles / Mechspire** | Far east | Temperate islands | Collectivist industrial state. Clockwork towers, gear-driven infrastructure, automated harbors. |
| **Clockwork Harbor** | East coast | Coastal | Gnomish port city. Trade hub where cogwork meets ocean. |
| **BoneTrap (Goblin Warren)** | Southwest | Swamp/forest edge | Decentralized guerrilla resistance. Hidden warrens, trap networks, and a culture of survival-through-stealth. |
| **Murkmire** | South | Deep swamp | Dual-natured settlement within the Shadow Fen Commune. Above the waterline: the commune's largest gathering point — mixed race, politically neutral, roughly 4,000 residents on stilts above standing water. Below the waterline: a lizardfolk sect stronghold with ritual pools, underwater temples, and ancient draconic ruins that outsiders rarely see. Functions as the primary surface-to-sect entry point for lizardfolk. |
| **Fortune's Rest** | Northern desert | Desert oasis | Catfolk diasporic settlement. Gambling dens, trade caravans, and a culture built around luck and pattern recognition. |
| **Frostbound Reach** | Far north | Tundra/ice | Frozen wilderness (62,500 sq km). Few settlements, extreme conditions. |
| **Great Endless Desert** | Central-south | Arid wasteland | Vast desert (187,500 sq km). Sand tombs, buried cities, scorching heat. |
| **Scorched Sands** | Western interior | Volcanic desert | Active volcanic region with lava tubes, obsidian flows, and mineral deposits. Distinct from the Wastes of Calidar — Scorched Sands is naturally hostile terrain, not the result of a weapon. Some orcish clans use the fringes for ritual trials. |
| **Shadowfen** | Southwest | Dense swamp | Magically concealed refuge. The Shadow Fen Commune shelters refugees, unsanctioned mages, and those who cannot exist under imperial documentation. Protected by the Veil — a field of concentrated refugee magic reinforced by infernal pacts. The empire classifies it as "uninhabitable exclusion zone." Thousands live here. |
| **Wastes of Calidar** | South | Glass desert | The former elven homeland, destroyed by Heaven's Atlas 847 years ago. Vitrified forests, boiled rivers, melted stone. The interior is genuinely uninhabitable — no life, no water, no shelter. The border draws scavengers and creatures pulled by residual magical energy. Return is forbidden by imperial decree. Every elf alive carries this place in cultural memory. |
| **The Shimmering Sea** | Surrounding ocean | Water | Encompasses the continent with islands, coastlines, and underwater features. |
| **Great Western Isle** | Far west | Mixed | Large island (30,000 sq km) off the western coast. |
| **Ashen Archipelago** | South | Volcanic islands | Chain of volcanic islands south of the mainland. |

### The Rift — Lore Foundation

The Rift is a wound in the world — a tear between what was and what is. Located near the starter town (The Holy Dominion), it manifests as an infinite dungeon that reseeds daily at midnight UTC. The Rift is not a neutral space; it responds to depth. Deeper floors exhibit increasing awareness, as if the dungeon itself recognizes and adapts to those who enter.

The Adventure Guild was established centuries ago to manage and document Rift expeditions. Guild wardens left chalk marks, maps, and journals throughout the Rift's corridors — evidence of generations of delvers who came before.

**Key Lore Tenets:**
- The Rift has preferences. It is older than any living memory.
- Most humanoid bosses were people once. What happened to them IS the dungeon's story.
- The Adventure Guild is ancient — references to Warden Grell (Year 847) and similar historical figures.
- Racial interactions in the dungeon are not cosmetic — Dwarves read dwarven ruins because Ironhold actually built underground. Lizardfolk are immune to flooding because their aquatic heritage is genuine biology.
- Daily seeds mean yesterday's records matter. Player loss is real and worth commemorating.
- Lore objects are written in the voice of the person who left them, never the voice of the game.

---

## 3. Playable Races

Race selection is **permanent** per character. Each race has unique stat bonuses, a racial feat with multiple effects, vision type, native languages, and weighted card pack pulls.

### Human
- **Lore:** Holy Dominion theocratic empire. Political power, trade dominance, bureaucratic efficiency.
- **Lifespan:** 70-90 years
- **Stat Bumps:** +1 Presence, +1 Resolve
- **Racial Feat — Dominion Authority:**
  - +15% XP to all skills
  - +20% market bonus in Holy Dominion biome
  - +10% diplomacy, +15% coercion, +15% deception
  - -25% property purchase cost
  - Weakness: +15% poison vulnerability
- **Vision:** Normal
- **Languages:** Common
- **Card Weight:** No special weighting (balanced pool)
- **Visual Direction:** Standard humanoid silhouette. Colors: warm golds, whites, deep reds (imperial/religious). Architecture: stone cathedrals, fortified walls, wheat fields.

### Elf
- **Lore:** Administered remnant of an ancient bureaucratic caste. Long-lived scholars and mages living among ancient forests.
- **Lifespan:** 500-800 years
- **Stat Bumps:** +2 Acumen, +1 Finesse, -2 Vigor, -1 Might
- **Racial Feat — Millennial Memory:**
  - +50% Magic XP
  - +30% faster magic unlocks
  - -15% melee damage (physically frail)
  - -10% max HP
  - Weakness: +25% poison vulnerability
- **Vision:** Normal
- **Languages:** Elvish, Common
- **Card Weight:** 40% chance per card draw forced to magic-tagged pool
- **Visual Direction:** Slender, tall silhouette. Colors: deep greens, silver, soft violet. Architecture: living-wood structures, vine-covered towers, ley-line circles.

### Orc
- **Lore:** Nomadic military confederation. Honor-bound warriors and mounted raiders of the vast steppes.
- **Lifespan:** 300-500 years
- **Stat Bumps:** +2 Might, +1 Vigor, -1 Acumen
- **Racial Feat — Khanate Vitality:**
  - +25% melee and archery XP
  - +10% mounted speed bonus
  - +25% base HP
  - +2 HP regen per second
- **Vision:** Normal
- **Languages:** Orcish, Common
- **Card Weight:** No special weighting
- **Visual Direction:** Broad, heavy silhouette. Colors: dark greens, browns, bone-white, iron gray. Architecture: tent-cities, war banners, horse corrals, stone cairns.

### Dwarf
- **Lore:** Anarcho-syndicalist holds carved into mountain stone. Born of the rock itself. Master craftsmen and miners.
- **Lifespan:** 300-500 years
- **Stat Bumps:** +2 Vigor, +1 Ingenuity, -1 Finesse
- **Racial Feat — Stone-Born Artisan:**
  - +25% Mining XP, +25% Crafting XP, +15% Jewel Working
  - Stone Skin: +10 base armor (stacks with equipment)
  - Minor tremor sense (detect nearby movement through stone)
  - +30% poison resistance
- **Vision:** Darkvision
- **Languages:** Dwarvish, Common
- **Card Weight:** No special weighting
- **Visual Direction:** Stocky, wide silhouette. Colors: granite gray, iron blue, deep amber, forge-fire orange. Architecture: massive stone halls, anvil-lined forges, minecart rails, crystal-lit caverns.

### Gnome
- **Lore:** Collectivist industrial state. Inventors, tinkerers, and engineers who build their civilization from gears and springs.
- **Lifespan:** 200-350 years
- **Stat Bumps:** +2 Ingenuity, +1 Acumen, -1 Might
- **Racial Feat — Tinker Savant:**
  - +50% Cogworking XP
  - +25% engineering/crafting speed
  - Baseline automaton/turret crafting ability (50% cost reduction)
  - +20% poison resistance
- **Vision:** Normal
- **Languages:** Gnomish, Common
- **Card Weight:** No special weighting
- **Visual Direction:** Small, compact silhouette. Colors: brass, copper, teal, gear-tooth bronze. Architecture: clockwork towers, steam pipes, gear walls, automated doors.

### Goblin
- **Lore:** Decentralized guerrilla resistance. Survivors who thrive in the margins through cunning, stealth, and resourcefulness.
- **Lifespan:** 30-60 years
- **Stat Bumps:** +2 Finesse, +1 Resolve, -1 Might
- **Racial Feat — Guerrilla Instinct:**
  - +30% stealth, +20% stealth attack, lockpicking, thievery, archery
  - Innate throwing knife ability
  - +30% movement speed in forest/swamp biomes
  - Penalty: +50% prison sentence multiplier (social stigma)
- **Vision:** Darkvision
- **Languages:** Goblin, Common
- **Card Weight:** 35% chance per card draw forced to stealth-tagged pool
- **Visual Direction:** Small, lean, angular silhouette. Colors: murky green, dark brown, bone-yellow, shadow-black. Architecture: hidden warrens, trap-laden tunnels, mushroom gardens, camouflaged entrances.

### Lizard Folk
- **Lore:** Secret sect-based civilization. Ancient draconic heritage, ritual magic practitioners, masters of water and swamp.
- **Lifespan:** 600-800 years
- **Stat Bumps:** +1 Acumen, +1 Resolve, +1 Finesse, -1 Presence
- **Racial Feat — Aquatic Heritage:**
  - +30% Fishing XP
  - Swim and dive freely without mounts
  - Water breathing (permanent)
  - Full poison immunity
  - Access to Ritual Magic skill tree (race-locked)
- **Vision:** Thermal
- **Languages:** Draconic, Common
- **Card Weight:** 25% chance per card draw forced to ritual-tagged pool
- **Visual Direction:** Scaled, reptilian silhouette. Colors: deep teal, dark green, dark blue, coral accent. Architecture: half-submerged temples, ritual pools, barnacle-covered stone, bioluminescent caverns.

### Cat Folk
- **Lore:** Diasporic nomads. Gambling culture, trade caravans, luck-based traditions. Spread across desert oases and trade routes.
- **Lifespan:** 60-80 years
- **Stat Bumps:** +2 Finesse, +1 Presence, -1 Vigor
- **Racial Feat — Pattern Recognition:**
  - +20% card luck (gacha rarity bump)
  - +15% general luck for all rolls
  - Better trade prices
  - +30% speed in desert biomes
  - Unarmed combat proficiency (+25%)
  - +15% stealth and lockpicking
  - Penalty: +50% prison sentence multiplier (social stigma)
- **Vision:** Darkvision
- **Languages:** Catfolk, Common
- **Card Weight:** 40% chance per card draw forced to luck-tagged pool + 20% rarity bump chance on every card
- **Visual Direction:** Lithe, feline silhouette. Colors: sandy gold, warm amber, midnight black, bright jade eyes. Architecture: desert tents, oasis pavilions, gambling houses, caravan wagons.

---

## 4. RPG Stats & Progression

### 7 Primary Stats

| Stat | Abbr | Effect |
|------|------|--------|
| **Vigor** | VIG | HP (+10 per point), stamina, poison resist, carry weight |
| **Might** | MGT | Melee damage (+5% per point), mining yield, harvest speed |
| **Finesse** | FIN | Crit chance (+0.8% per point), dodge (+0.5% per point), movement speed, fishing |
| **Acumen** | ACU | Magic power (+6% per point), XP gain bonus (+1% per point), crafting quality |
| **Resolve** | RES | Magic resist (+3% per point), debuff reduction, HP regen (+0.5/s per point) |
| **Presence** | PRE | Trade prices (+2% per point), NPC favor, party buff radius |
| **Ingenuity** | ING | Crafting speed (+3% per point), cogworking yield, repair efficiency |

### Stat Allocation
- **Base:** 5 in each stat
- **Creation points:** 5 free points to distribute at character creation
- **Level-up points:** +1 stat point every 3 levels
- **Racial bumps:** Applied on top of base (can go negative, minimum 1)

### HP Formula
```
Base HP = 50 + (Vigor * 10) + (Level * 5)
Final HP = Base HP * (1 + racial HP multiplier)
```

### Overall Level System
- **Max level:** 100
- **XP per level:** 250 * N (level N requires 250*N XP)
- **Skill XP spillover:** 10% of all skill XP earned feeds into overall level XP
- **Level-up rewards:**
  - Card pack (always) — 5-7 cards per pack
  - Stat point (every 3 levels)
  - Card slot unlock at levels 10, 20, 30, 40 (4 base → 8 max slots)

---

## 5. Skills System

### Skill Categories (25 total + 3 race-locked)

**Gathering (4):**
| Skill | Description | Biome Bonus Locations |
|-------|-------------|----------------------|
| Mining | Extract ores from nodes | Mountain, Wastes (+15%) |
| Woodcutting | Harvest wood from trees | Forest, Elven South (+15%) |
| Farming | Grow and harvest crops/herbs | Plains, Holy Dominion, Elven South (+25%) |
| Fishing | Catch fish and aquatic items | Beach, Swamp (+25%) |

**Crafting (4):**
| Skill | Description | Biome Bonus Locations |
|-------|-------------|----------------------|
| Cooking | Prepare food items | — |
| Glassworking | Sand → glass → lenses/vials | Scorched Sands, Wastes (+25%) |
| Crafting | General item/bar creation | — |
| Cogworking | Gnomish mechanical assembly | Clockwork Harbor, Gnomish Isles, Mechspire (+25%) |

**Combat (11):**
- Magic (base) + Elemental, Arcane, Divine, Shadow subtypes
- Melee (base) + Blade, Blunt, Martial subtypes
- Archery

**Rogue (2):** Lockpicking, Thievery

**Social (2):** Coercion, Deception

**Exploration (2):** Dungeon Dwelling, Dungeon Delving

**Race-Locked — Lizardfolk Only (3):** Ritual Magic, Water Rituals, Blood Rituals

### Skill Leveling
- Max skill level: 99
- XP per skill level: 100 * N
- 10% of skill XP spills over to overall level

---

## 6. Card Gacha System

### Overview
Cards are the primary power progression system beyond stats. They grant passive bonuses, active abilities, and unique effects. Cards are obtained from level-up packs, dungeon boss kills, and NPC vendors.

### Rarity Tiers (8 tiers)

| Tier | Name | Pull Weight | % Chance | Color |
|------|------|------------|----------|-------|
| 0 | Common | 4500 | 45.0% | Gray (#888) |
| 1 | Uncommon | 2500 | 25.0% | Green (#22cc22) |
| 2 | Rare | 1500 | 15.0% | Blue (#3388ff) |
| 3 | Ultra Rare | 800 | 8.0% | Purple (#aa44ff) |
| 4 | Mythic Rare | 400 | 4.0% | Gold (#ffaa00) |
| 5 | Legendary | 200 | 2.0% | Orange (#ff6600) |
| 6 | Godly | 80 | 0.8% | Red (#ff0000) |
| 7 | Relic | 20 | 0.2% | White (#ffffff) |

### Card Types (7 categories)
1. **Stat Boost** — Flat stat increases (+1/+2/+3 to a stat)
2. **Skill Boost** — XP percentage bonuses to specific skills
3. **Passive Perk** — Ongoing effects (HP regen, crit chance, dodge, speed, etc.)
4. **Active Ability** — Usable spells/attacks with cooldowns (Fireball, Heal, Lightning Bolt, etc.)
5. **Racial Feat** — Race-themed cards with bonus effects for matching race
6. **Gathering Boost** — Double gather chance, yield bonuses
7. **Equipment Modifier** — Weapon elemental enchants (fire, frost, poison)

### Card Visual Styles (5 styles)

| Style | Chance | Border Effect |
|-------|--------|--------------|
| Normal | 80% | None |
| Holographic | 12% | Rainbow shimmer |
| Golden | 5% | Gold glow |
| Prismatic | 2.5% | Prismatic color shift |
| Void Edition | 0.5% | Void particles (+10% to all effects) |

### Card Fusion
- Fuse 2 cards of the same rarity → 1 card of next rarity tier
- Max 2 fusions per card lineage
- Same-card fusion: effects stack with 5% bonus
- Different-card fusion: keep card 1's effects with 10% bonus
- +5% per fusion level on top
- Relic cards cannot be fused

### Card Collection Limits
- Max collection: 500 cards
- Max equipped: 4 base → 8 at level 40
- Pack size: 5-7 cards per pack

### Race-Specific Card Interactions
- **Cat Folk:** +20% rarity bump on every pull
- **Elf:** 40% chance pulls from magic-tagged pool
- **Goblin:** 35% chance pulls from stealth-tagged pool
- **Lizardfolk:** 25% chance pulls from ritual-tagged pool, access to race-locked ritual cards
- **Card Trading Restrictions:** Racial innate trait cards (tremor sense, water breathing, stone skin, etc.) cannot be traded to races that don't naturally have those traits

### Notable Cards (samples from 63+ total)

**Active Abilities:**
- Fireball I/II — Fire damage, scaling with Acumen
- Lightning Bolt — Lightning damage, scaling with Acumen
- Heal Self I/II — HP restoration, scaling with Resolve
- Shadow Strike — Shadow damage, scaling with Finesse
- Backstab I/II — Physical damage, requires stealth, scaling with Finesse
- Smoke Bomb — Enter stealth for 8 seconds
- Tidal Invocation (Lizardfolk only) — Water damage + slow
- Leviathan Pact (Lizardfolk only) — Transform into leviathan form

**Legendary+ Cards:**
- Phoenix Rebirth — Revive on death (10min cooldown)
- Nine Lives (Mythic) — Revive + 10% dodge + 15% luck
- Divine Blessing (Godly) — +8 all stats, +10% all XP
- Relic of Creation (Relic) — +10 all stats, +20% all XP, +100 HP
- Relic of Time (Relic) — -30% all cooldowns, +15% speed

**Dungeon-Specific:**
- Boss Slayer — +25% boss damage, +15% boss loot
- Rift Walker — +15% dungeon damage, +10% dungeon XP
- Rift Sovereign (Mythic) — +30% dungeon damage, +20% boss damage, +15% dungeon defense, +20% loot

---

## 7. Zones & Navigation

### Zone Types
1. **Town** — Safe zones with NPCs, shops, connections to overworld
2. **Building** — Interior sub-zones within towns (Adventure Guild, etc.)
3. **Overworld** — Open-world exploration (2000x2500 chunks, lazy generation)
4. **Dungeon** — Rift floors and cave floors (tile-based grid)

### Zone Connections
Zones connect via designated connection tiles. Players interact with connections to transition between zones. Buildings are entered/exited through door connections in their parent town.

### Current Zone Layout

```
Overworld (open world)
  ├── The Holy Dominion (starter_town) ← New players spawn here
  │     ├── Adventure Guild (adventure_guild) [building]
  │     │     ├── Guildmaster Aldric
  │     │     ├── Quest Board
  │     │     └── Hall of Heroes (Leaderboard)
  │     └── The Rift (rift_antechamber) [building]
  │           └── Rift Entrance → Dungeon Floors
  ├── Solara (solara) — Human capital
  ├── Sylvaris (sylvaris) — Elven city
  ├── Ironhold (ironhold) — Dwarven stronghold
  ├── Kragmor (kragmor) — Orcish fortress
  ├── BoneTrap (bonetrap) — Goblin warren
  ├── Murkmire (murkmire) — Lizardfolk citadel
  ├── Mechspire (mechspire) — Gnomish capital
  ├── Clockwork Harbor (clockwork_harbor_town) — Gnomish port
  ├── Fortune's Rest (fortunes_rest) — Catfolk oasis
  └── Hollow Earth (underground layer, 2000x2500)
      └── Cave entrances → Overworld Dungeons
```

---

## 8. Overworld & Biomes

### World Scale
- 2000 x 2500 chunks (10,000 km x 12,500 km)
- 1 chunk = 512 pixels = 16 tiles of 32px = 5 km
- Lazy generation: only visited chunks are generated
- Seeded deterministic RNG for consistent generation

### 17 Biomes

| ID | Name | Color (RGB) | Walk Speed | Description |
|----|------|-------------|------------|-------------|
| 0 | Water (Shimmering Sea) | (50,85,140) | Impassable | Ocean, requires boat/ship |
| 1 | Desert (Great Endless) | (210,185,125) | 50% | Arid sand, heat hazards |
| 2 | Mountain (Dwarven) | (115,105,95) | 60% | Rocky peaks, mine entrances |
| 3 | Scorched Sands | (185,145,85) | 50% | Volcanic desert, glass sand |
| 4 | Steppes (Orcish) | (165,175,95) | 90% | Rolling grassland |
| 5 | Forest (Wildlands) | (35,85,35) | 80% | Dense woodland |
| 6 | Plains (Green) | (115,155,65) | 100% | Open grassland, fastest terrain |
| 7 | Swamp (Shadowfen) | (55,75,45) | 60% | Murky marshland |
| 8 | Holy Dominion | (135,155,105) | 100% | Civilized farmland |
| 9 | Gnomish Isles | (95,135,75) | 90% | Temperate islands |
| 10 | Mechspire | (125,115,105) | 90% | Industrial city |
| 11 | Clockwork Harbor | (145,135,115) | 90% | Port town |
| 12 | Wastes of Calidar | (155,135,100) | 40% | Desolate wasteland |
| 13 | Beach (Coastline) | (200,190,150) | 80% | Sandy shores |
| 14 | Frostbound Reach | (200,210,225) | 30% | Frozen tundra |
| 15 | Southern Wastes | (175,150,110) | 40% | Blighted southern land |
| 16 | Elven South | (50,110,55) | 90% | Ancient forest |

### Sub-Chunk Terrain Features
Within each chunk's 16x16 tile grid:

| Feature | Color (RGB) | Speed | Description |
|---------|-------------|-------|-------------|
| River | (40,80,160) | Impassable | Flowing water, requires bridge |
| Lake | (45,90,155) | Impassable | Still water body |
| Shallow Water | (70,120,170) | 30% | Wadeable, very slow |
| Thick Forest | (20,55,20) | 20% | Nearly impassable undergrowth |
| Cave Entrance | (40,35,30) | Normal | Entry point to overworld dungeon |
| Riverbank | (110,95,60) | 50% | Muddy river edge |
| Bridge | (140,100,55) | 80% | Wooden crossing over water |

### Travel Speed
- Base walk: 200 px/s
- Horse mount: 2x (400 px/s)
- Caravan: 0.7x (140 px/s)
- Ship: 5x (1000 px/s)
- Airship: 20x (4000 px/s)

### Game Time
- 1 game-day = 60 real seconds
- Dynamic day/night cycle
- Weather system (state.js manages world weather)

---

## 9. Towns & Buildings

### 10 Anchor Towns

Each race has a capital city, plus the shared starter town. Towns are safe zones with NPC services, building entrances, and overworld connections (north/south/east/west exits).

| Town | Race | Size (px) | Key NPCs/Services |
|------|------|-----------|-------------------|
| The Holy Dominion | Human (starter) | 1600x1200 | Adventure Guild entrance, Rift entrance, portal nexus |
| Solara | Human (capital) | — | Full services, political center |
| Sylvaris | Elf | — | Magic academy, ley-line shrine |
| Ironhold | Dwarf | — | Great Forge, deep mines |
| Kragmor | Orc | — | War camp, training grounds |
| BoneTrap | Goblin | — | Hidden market, trap workshop |
| Murkmire | Lizardfolk | — | Ritual pools, underwater temple |
| Mechspire | Gnome (capital) | — | Clockwork workshop, automaton forge |
| Clockwork Harbor | Gnome (port) | — | Shipyard, trade docks |
| Fortune's Rest | Catfolk | — | Gambling hall, caravan depot |

### Key Buildings (Starter Town)

**Adventure Guild (600x500)**
- Guildmaster Aldric (adventure_guild NPC type) — Guild signup, rank progression
- Quest Board (dungeon_quest_board NPC type) — Daily dungeon quests
- Hall of Heroes (dungeon_leaderboard NPC type) — Leaderboard display

**The Rift Antechamber (800x600)**
- Rift Entrance (dungeon_entrance NPC type) — Portal to The Rift dungeon

### NPC Types & Visual Direction

| NPC Type | Color | Shape | Purpose |
|----------|-------|-------|---------|
| adventure_guild | Blue | Colored body + head circle | Guildmaster, guild registration |
| dungeon_quest_board | Gold/Yellow | Colored body + head circle | Quest assignment |
| dungeon_leaderboard | Purple | Colored body + head circle | Records display |
| dungeon_entrance | Purple (pulsing) | Larger circle with glow effect | Dungeon portal |
| portal_nexus | Cyan | — | Town-to-town teleportation |
| npc_shop | Various | — | Buy/sell items |

---

## 10. The Rift (Infinite Dungeon)

### Overview
- **Location:** Accessible from Rift Antechamber in starter town
- **Seed:** Daily (`rift_YYYY-MM-DD`), changes at midnight UTC
- **Depth:** Infinite floors, difficulty scales with depth
- **Party:** Solo or co-op (up to 4 players)
- **Requirement:** Adventure Guild membership (free signup)

### Guild Ranks (10 tiers)

| Rank | Name | Required Guild XP |
|------|------|-------------------|
| 0 | Stone | 0 |
| 1 | Copper | 100 |
| 2 | Bronze | 300 |
| 3 | Iron | 600 |
| 4 | Silver | 1000 |
| 5 | Gold | 2000 |
| 6 | Platinum | 4000 |
| 7 | Diamond | 8000 |
| 8 | Mythril | 15000 |
| 9 | Relic | 30000 |

### Floor Generation

**Floor Sizes:**
| Size | Dimensions | Rooms |
|------|-----------|-------|
| Small | 40x30 tiles | 4-6 |
| Medium | 56x42 tiles | 6-10 |
| Large | 72x54 tiles | 10-14 |
| Huge | 96x72 tiles | 14-20 |

**8 Layout Types:**
1. **BSP_ROOMS** — Binary space partition, rectangular rooms connected by corridors
2. **MAZE** — Winding corridors with dead ends and tight spaces
3. **LAKE** — Central open area surrounded by smaller chambers
4. **OPEN_CAVERN** — Large open space with scattered pillars/obstacles
5. **TEMPLE_HALLS** — Long ceremonial corridors with side chambers
6. **ARENA** — Large circular/oval room (always used for boss floors)
7. **ISLAND** — Rooms separated by gaps, connected by narrow bridges
8. **ORGANIC** — Natural-looking irregular cavern shapes

**Tile Types (14):**
| ID | Type | Description |
|----|------|-------------|
| 0 | Wall | Impassable, rendered as 3D-effect rectangles |
| 1 | Floor | Walkable, subtle grid lines |
| 2 | Corridor | Walkable passage between rooms |
| 3 | Door | Transition between rooms |
| 4 | Stairs Up | Return to previous floor |
| 5 | Stairs Down | Descend to next floor |
| 6 | Entrance | Floor entry point |
| 7 | Exit | Floor exit point |
| 8 | Chest | Interactable loot container |
| 9 | Trap | Damage on contact |
| 10 | Camp Spot | Placeable camp location (Rift only) |
| 11 | Shrine | Interactable buff station |
| 12 | Boss Door | Entrance to boss encounter |
| 13 | Shortcut | Hidden passage between rooms |

### Theme System (19 themes)

**Castle Themes (Floors 1-5):**
| Theme | Wall Color | Floor Color | Accent Color |
|-------|-----------|-------------|-------------|
| stone_keep | (90,85,80) | (140,130,120) | (180,160,100) |
| grand_hall | (100,90,75) | (170,155,130) | (220,190,80) |
| armory_vault | (70,70,80) | (120,115,125) | (160,140,180) |
| throne_dungeon | (60,50,65) | (110,95,115) | (200,170,50) |
| catacombs | (55,50,45) | (100,90,80) | (180,180,160) |

**Wild Themes (Floors 6+):**
| Theme | Wall Color | Floor Color | Accent Color |
|-------|-----------|-------------|-------------|
| crystal_cavern | (40,55,90) | (80,110,160) | (140,200,255) |
| fungal_forest | (35,55,35) | (70,100,60) | (150,220,100) |
| lava_rift | (60,30,20) | (110,55,35) | (255,120,30) |
| frozen_depths | (70,85,100) | (140,170,200) | (200,230,255) |
| flooded_ruins | (45,60,70) | (80,110,130) | (100,180,200) |
| floating_islands | (80,75,100) | (150,140,180) | (200,180,255) |
| bone_yard | (65,60,55) | (130,120,105) | (200,190,170) |
| shadow_realm | (25,20,35) | (50,40,65) | (120,60,180) |
| overgrown_temple | (50,70,45) | (95,125,80) | (180,200,80) |
| clockwork_maze | (85,75,60) | (150,135,110) | (200,170,60) |
| sand_tomb | (130,115,80) | (190,170,120) | (220,200,100) |
| coral_grotto | (40,70,85) | (80,130,150) | (255,130,140) |
| void_debris | (15,10,25) | (35,25,50) | (100,50,200) |
| ancient_library | (70,55,40) | (130,110,85) | (180,150,60) |

### Floor Progression
- **Floors 1-5:** Castle themes (stone_keep, grand_hall, etc.)
- **Floors 6+:** Wild/lore biome themes (crystal_cavern, lava_rift, etc.)
- **Every 10th floor:** Boss floor (always ARENA layout)

### Floor Modifiers (applied to specific floors)
Floors can have special modifiers that change gameplay:
- **blood_moon** — Enemy HP regeneration
- **silent_floor** — No atmosphere events (the silence IS the event)
- **sanctuary** — Safe floor, guaranteed merchant NPC
- **cursed** — Debuff effects
- **treasure_vault** — Extra chests
- Various others affecting enemy behavior, loot, and environment

### Camp System (Rift Only)
- Place camps at designated camp spots
- Cook food for HP restoration
- Shrine interaction for temporary buffs
- Risk: ambush chance (enemies may attack camp)
- Co-op feature: multiple players share camp benefits

### Quest System
- 3-5 daily quests generated per day
- Quest types: kill_count, boss_kill, floor_clear, no_damage_floor, etc.
- Tracked via Quest Board in Adventure Guild

### Leaderboard
- Deepest floor reached
- Most enemy kills
- Fastest boss kill
- Daily reset with seed

---

## 11. Overworld Dungeons (Caves)

### Overview
- **Location:** Spawn from cave entrances across the overworld map
- **Seed:** Location-based (`cave_<worldX>_<worldY>`), permanent per location
- **Depth:** 3-10 floors based on biome (final floor has boss)
- **Requirement:** None (no guild needed)
- **Theme:** Matches overworld biome

### Cave Floors by Biome

| Biome | Min Floors | Max Floors | Typical Themes |
|-------|-----------|-----------|----------------|
| Water | 2 | 4 | coral_grotto, flooded_ruins |
| Desert | 3 | 6 | sand_tomb, ancient_library |
| Mountain | 5 | 10 | crystal_cavern, frozen_depths |
| Scorched Sands | 3 | 5 | lava_rift, sand_tomb |
| Steppes | 2 | 5 | bone_yard, shadow_realm |
| Forest | 3 | 7 | fungal_forest, overgrown_temple |
| Plains | 2 | 4 | stone_keep, overgrown_temple |
| Swamp | 4 | 8 | flooded_ruins, fungal_forest |
| Holy Dominion | 3 | 6 | catacombs, throne_dungeon |
| Gnomish Isles | 2 | 5 | clockwork_maze, crystal_cavern |
| Mechspire | 3 | 6 | clockwork_maze, armory_vault |
| Clockwork Harbor | 2 | 4 | clockwork_maze, coral_grotto |

### Floor Sizes (smaller than Rift)
| Size | Dimensions | Rooms |
|------|-----------|-------|
| Small | 36x28 tiles | 3-5 |
| Medium | 48x36 tiles | 5-8 |
| Large | 64x48 tiles | 8-12 |

---

## 12. Combat System

### Current Controls
| Input | Action |
|-------|--------|
| Left Click | Primary attack (melee range) |
| Space | Primary attack (melee range) |
| E | Interact (NPC, chest, shrine, lore object) |
| WASD | Grid-based movement (1 tile per press) |

### Combat Flow
- Real-time, tile-based (top-down Zelda / Binding of Isaac inspired)
- Player attacks target the nearest enemy within attack range
- Damage = base attack * multipliers (stat bonuses, card effects, racial bonuses)
- Critical hits based on Finesse stat + card bonuses
- Dodge chance based on Finesse stat + card bonuses
- Enemies drop gold and XP on death
- Boss enemies drop card packs

### Dungeon Combat HUD
- HP bar (top of dungeon HUD)
- Stamina bar (below HP)
- Level and XP display (below stamina)
- Enemy names and HP shown when in range
- Damage numbers float above targets
- Status effects displayed as icons

---

## 13. Enemy AI & Archetypes

### 6 Enemy Archetypes

| Archetype | Detection | Range | Speed | Behavior |
|-----------|----------|-------|-------|----------|
| **Bruiser** | 4 tiles | 1 (melee) | 1 | Tank. High HP/DEF, heavy melee strikes. |
| **Skirmisher** | 5 tiles | 1 (melee) | 2 | Fast, fragile. Quick slashes, hit-and-run. |
| **Ranged** | 6 tiles | 4 | 1 | Stays at distance. Projectile attacks. |
| **Controller** | 5 tiles | 2-3 | 1 | Debuffs. Cursed touch, slows, armor breaks. |
| **Support** | 5 tiles | 3 | 1 | Heals allies. Weak personal attack. |
| **Elite** | 6 tiles | 1-2 | 1 | Mini-boss. Heavy strikes + stun abilities. |

### AI States
1. **Patrol** — Wander between rooms
2. **Chase** — Pursue detected player
3. **Search** — Lost player, checking last known position
4. **Return** — Moving back to patrol route
5. **Flee** (planned) — Run from boss engagement

### Enemy Tier Scaling
Each theme has 4 enemy tiers:
- **Shallow** (early floors) — 20-40 HP, 5-10 ATK, 2-6 DEF
- **Mid** (middle floors) — 40-100 HP, 12-22 ATK, 5-14 DEF
- **Deep** (late floors) — 85-180 HP, 18-34 ATK, 10-24 DEF
- **Boss** (every 10th floor) — 400-500 HP, 35-42 ATK, 24-30 DEF

### Boss Examples

| Boss | Theme | HP | ATK | DEF | XP | Gold |
|------|-------|-----|-----|-----|-----|------|
| The Iron Castellan | stone_keep | 400 | 35 | 25 | 200 | 100 |
| The Prismatic Queen | crystal_cavern | 450 | 38 | 28 | 220 | 120 |
| The Spore Mother | fungal_forest | 420 | 36 | 24 | 210 | 110 |
| Molten Titan | lava_rift | 500 | 42 | 30 | 250 | 140 |

### Boss Phases (example: The Spore Mother)
- **Phase 1 (100%-60%):** Standard attacks (Spore Slam, Toxic Cloud, Regeneration)
- **Phase 2 — Spore Bloom (60%-30%):** +30% ATK, new abilities (Spore Burst, Root Slam), speed increase
- **Phase 3 — Final Bloom (<30%):** +60% ATK, Death Spore (high damage + poison), Fungal Wrath, increased detection radius

### Enemy Loot Tables
Enemies drop themed items based on their pool:
- Gold (always)
- XP (always)
- Theme-specific resources (dungeon_essence, dark_crystal, boss_trophy)
- Boss kills: card packs

---

## 14. Crafting & Resources

### 31 Resource Types

**Ores & Metals:**
wood, stone, iron_ore → iron_bar, bronze_ore → bronze_bar, copper_ore → copper_bar, silver_ore → silver_bar, gold_ore → gold_bar, steel_bar (iron+bronze), mithril_ore → mithril_bar (mithril+mana_crystal)

**Food & Ingredients:**
fish, cooked_fish, shellfish, seaweed, wheat → bread, herbs, vegetables, mushroom, stew (fish+vegetables+herbs)

**Specialty:**
glass_sand → glass → glass_lens / glass_vial, cogs + gears + springs → clockwork_core, mana_crystal, gem_rough → gem_cut

**Potions:**
potion_health (herbs + glass_vial), potion_mana (mana_crystal + glass_vial)

**Dungeon Resources:**
dungeon_essence, dark_crystal, boss_trophy

### Biome-Specific Gathering

| Biome | Resources | Skills Required |
|-------|-----------|----------------|
| Plains | Wheat, herbs, vegetables, copper ore | Farming, Mining |
| Beach | Fish, shellfish, seaweed | Fishing |
| Swamp | Swamp herbs, muddy fish, mushrooms | Farming, Fishing |
| Scorched Sands | Glass sand, rough gems | Glassworking, Mining |
| Clockwork Harbor | Cogs, springs, gears | Cogworking |
| Elven South | Ancient herbs, mana crystals | Farming, Magic |
| Mountain | Copper ore, silver ore | Mining |
| Snow Mountains | Frozen silver, mithril deposits | Mining (high level) |
| Volcanic | Gold ore, volcanic iron | Mining |

### Crafting Stations
- **Forge:** Smelting ores, cooking food, making glass
- **Anvil:** Advanced crafting (clockwork cores, cut gems)
- **None (portable):** Potions (herbs + vials)

### Key Recipes

| Recipe | Station | Inputs | Skill Required |
|--------|---------|--------|----------------|
| Bronze Bar | Forge | 2 bronze ore | Crafting 3 |
| Steel Bar | Forge | 2 iron bar + 1 bronze bar | Crafting 10 |
| Mithril Bar | Forge | 3 mithril ore + 1 mana crystal | Crafting 18 |
| Hearty Stew | Forge | 1 cooked fish + 2 vegetables + 1 herbs | Cooking 5 |
| Glass Lens | Forge | 2 glass | Glassworking 5 |
| Clockwork Core | Anvil | 5 cogs + 3 gears + 2 springs | Cogworking 10 |
| Health Potion | None | 3 herbs + 1 glass vial | Cooking 5 |
| Mana Potion | None | 1 mana crystal + 1 glass vial | Magic 5 |
| Cut Gem | Anvil | 1 rough gem | Crafting 8 |

---

## 15. Economy & Trading

### Currency
- **Coins** (internally stored as `account.chips`)
- Earned from: enemy kills, quest rewards, selling to NPCs/auction
- Spent on: NPC shops, auction house, portal crafting, card vendors

### NPC Shops (7 types)
- Dynamic pricing: prices fluctuate every 30 seconds based on buy/sell pressure
- Presence stat grants up to 30% discount
- Supply/demand simulation

### Player Auction House
- List cards and resources for sale
- 5% listing fee
- 24-hour expiry
- Max 10 active listings per player
- Purchase locks prevent race conditions

### Card Vendors
- Buy: Common (50 coins), Uncommon (200 coins)
- Sell: 25% of base rarity value
- Style multipliers affect sell price

### Card Rarity Values

| Rarity | Base Value |
|--------|-----------|
| Common | 50 |
| Uncommon | 200 |
| Rare | 500 |
| Ultra Rare | 1,500 |
| Mythic Rare | 5,000 |
| Legendary | 15,000 |
| Godly | 50,000 |
| Relic | 200,000 |

### Player-to-Player Trading
- Direct P2P trade window
- Trade cards, resources, and coins
- Both players must confirm offers
- Race-restricted card trading enforced

---

## 16. Social Systems

### Guilds
- Create/join guilds
- Guild chat channel
- Guild vault (shared storage for deposit/withdraw)
- Runtime-only (planned: disk persistence)

### Friends System
- Friend requests by player ID
- Player profile viewing
- Duel requests

### Party System
- Form parties for dungeon co-op (up to 4 players)
- Shared XP and gold in dungeons
- Party members visible on minimap

### Chat
- Zone-wide chat
- Guild chat
- Private messages (planned)

### Player Display
- Character name displayed above player sprite
- Format: "CharacterName | Username" when they differ
- Race-colored indicators

---

## 17. Portal & Travel

### Anchor Portals
- Each town has a Portal Nexus NPC
- Free inter-town teleportation
- 30-second cooldown between teleports

### Personal Portals
- Craftable on claimed plots
- Requirements: Crafting level 20, 5 mana crystal + 10 stone + 5 iron bar + 3 cut gems
- Allows teleport to/from your plot from any town portal

---

## 18. Plot & Building

### Land Claiming
- Plot size: 2048x2048 pixels (4x4 chunks)
- Snapped to grid alignment
- One plot per player
- Two-step unclaim confirmation

### Building
- Place objects on claimed plots (forge, anvil, storage chest, walls, doors, bridges)
- Objects have crafting requirements
- Abandoned plots can be re-claimed by other players

---

## 19. Controls & HUD

### Full Control Scheme

| Input | Context | Action |
|-------|---------|--------|
| W/A/S/D | All | Move (grid-based in dungeon, free in overworld/town) |
| Left Click | Dungeon | Primary attack |
| Space | Dungeon | Primary attack |
| E | All | Interact (NPC, chest, shrine, door, connection) |
| Enter | All | Open/send chat |
| I | Game | Open inventory |
| C | Game | Open character sheet |
| K | Game | Open card collection |
| M | Game | Toggle map |
| P | Overworld | Claim plot |
| J | Dungeon | Open quest panel |
| Right Click | Game | Context menu (future: inspect, trade, duel) |

### HUD Elements

**Town/Overworld:**
- Player name + username above head
- Chat window (bottom)
- Minimap (corner)
- Resource/inventory indicators

**Dungeon:**
- HP bar (red)
- Stamina bar (green)
- Level / XP display
- Floor number
- Minimap with fog of war
- Controls hint: `[WASD] Move  [Click/Space] Attack  [E] Interact  [J] Quests`
- Enemy HP bars when in range
- Floating damage numbers

---

## 20. Visual Direction

### Art Style Philosophy
The game uses colored rectangles and circles as its visual primitives. This is a deliberate constraint, not a limitation. The aesthetic should evoke:
- **Minimalist clarity** — Every colored shape communicates gameplay information
- **Color as atmosphere** — Theme palettes set mood without illustration
- **Text as texture** — Lore, dialogue, and atmosphere events carry emotional weight through writing, not art

### Player Rendering
- Body: colored rectangle (player's chosen color)
- Head: smaller circle on top
- Name label: white text above head (up to 150px wide)
- Format: "CharacterName | Username" when different

### NPC Rendering
- Body: colored rectangle (type-specific color)
- Head: circle on top
- Color coding by function:
  - Blue: Guild/adventure NPCs
  - Gold/Yellow: Quest board
  - Purple: Leaderboard / dungeon entrance
  - Cyan: Portal
  - Various: Shop types

### Dungeon Rendering
- **Walls:** 3D-effect rectangles with highlight edge (top/left) and shadow edge (bottom/right)
- **Floors:** Flat rectangles with subtle grid lines (lighter shade grid at 0.03 alpha)
- **Corridors:** Same as floors with slightly different treatment
- **Theme colors:** All RGB values 0-255, client divides by 255 for LOVE 2D (0-1 range)
- **Fog of war:** Unexplored tiles hidden, revealed on player proximity
- **Enemies:** Colored circles (red tint) with name labels
- **Chests:** Small gold rectangles
- **Stairs:** Distinct colored markers

### Icon Assets (Pre-existing Sprite Sheets)
The project includes extensive icon sprite sheets in the `client/icons/` directory:
- `resourcesandfood/` — Resource and food item icons
- `skills/` — Skill and ability icons
- `items/` — Potion and equipment icons
- `loot/` — Loot and treasure icons
- `quest/` — Quest item icons
- `buildingmaterialicons/` — Building and tool icons
- `icons/characters/` — Race-specific character icons (Human, ELF, ORC, Dwarves, Gnomes, Goblin, Creatures, Animals)

### Color Palette Reference

**UI Colors:**
- Chat text: White
- System messages: Yellow
- Error messages: Red
- Atmosphere events: Muted amber/gray
- Damage numbers: Red (damage taken), White (damage dealt)
- Heal numbers: Green

**Rarity Colors:**
- Common: #888888 (gray)
- Uncommon: #22cc22 (green)
- Rare: #3388ff (blue)
- Ultra Rare: #aa44ff (purple)
- Mythic Rare: #ffaa00 (gold)
- Legendary: #ff6600 (orange)
- Godly: #ff0000 (red)
- Relic: #ffffff (white)

---

## 21. Future Features

### Combat Improvements
- Zelda/Binding of Isaac-style real-time feel
- Combat indicators (attack direction, damage areas)
- Status effect visuals
- Enemy AI patrol ticking (timer-based wandering)

### Dungeon Enhancements
- Dungeon skill benefits (dungeon_dwelling/delving effects)
- Speed_clear quest type (per-floor timer)
- Card pack on boss kill (data exists, needs wiring)
- Player revive system (corpse/revive/guild-revive)

### Client UI
- Auction house UI
- NPC shop UI
- Card collection viewer with fusion interface
- Full character sheet with stat allocation

### Persistence
- Guild disk persistence (currently runtime-only)
- Auction house persistence
- Full "chips to coins" rename completion

### World Events
- NPC shop price events (drought, surplus, etc.)
- World boss spawns
- Seasonal events

### Client Optimizations
- Viewport culling
- Scene cleanup
- Reconnection handling
- Asset caching

---

## 22. Atmosphere & Narrative Design (Planned)

A comprehensive atmosphere design document exists at `docs/rift-atmosphere-features.md` with 13 features organized by priority. Key planned features:

### Priority 1 — Maximum Impact, Minimum Effort
1. **Ambient Floor Events (AFEs)** — Theme-specific text events every 45-90 seconds with optional screen tints
2. **Discoverable Lore Objects (DLOs)** — Interactable corpses, journals, inscriptions with race-specific bonus interactions

### Priority 2 — High Impact, Moderate Effort
3. **Pre-Boss Atmospheric Progression** — 3-floor escalation before boss (disturbed events, fleeing enemies, wounded NPCs, boss intro cinematic)
4. **Environmental Hazards** — Lava flows, cave-ins, flooding, psychic static, fungal spores (theme-specific)
5. **Expanded NPC Encounters** — Rival Delvers, Cartographer's Ghost, Trapped Merchant, The Echo, race-specific dungeon NPCs

### Priority 3 — Deep Atmosphere
6. **Campfire Storytelling** — Narrative events at camps, dream visions for resting players
7. **Fog of War Events** — Sounds and text from unexplored areas, darkvision racial variants
8. **Blood Trails & Death Markers** — Cross-player death evidence, blood moon visual effects
9. **Boss Panic / Stampede** — Enemies flee when boss engages, pre-boss floor enemy migration
10. **Hidden Shortcut Discovery** — Lore-framed shortcut revelation with race bonuses

### Priority 4 — Ambitious, Long-Term
11. **Guild Memorial / Record Wall** — Narrative-enhanced leaderboard with daily memorials
12. **Rift Escalation Arc** — 6-tier narrative progression based on floor depth
13. **Persistent Floor Scars** — Cross-session memory (defeated bosses, discovered shortcuts, read lore)

### Key Atmosphere Principle
> "Every feature must make the dungeon feel alive, and make the player want to go deeper. The constraint of 2D colored rectangles is an asset, not a limitation. Text and color carry enormous emotional weight."

---

*End of Detailed GDD*
