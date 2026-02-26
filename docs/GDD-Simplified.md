# MMOLite — Simplified Art Direction Guide
## Quick Reference for Art Directors

---

## What Is This Game?

A **2D top-down fantasy MMO** built with LOVE 2D (Lua client) and Node.js (server). Think classic top-down Zelda exploration meets roguelite dungeon crawling meets gacha card collecting, all rendered with **colored rectangles and circles** — no traditional sprite art for characters.

Players explore a massive procedural continent, gather resources, craft items, collect ability cards from gacha packs, and delve into a daily-seeded infinite dungeon called **The Rift**.

---

## Visual Language

### Current Art Style
- **Characters:** Colored rectangle body + circle head
- **NPCs:** Same as characters, color-coded by function
- **Enemies:** Colored circles with name labels
- **Terrain:** Flat colored rectangles with subtle grid lines
- **Walls:** 3D-effect rectangles (highlight on top/left, shadow on bottom/right)
- **Icons:** Pre-existing pixel art sprite sheets for items, resources, skills

### The Principle
> Color IS information. Text IS atmosphere. The rectangles and circles are the aesthetic — not placeholders. Every visual element communicates gameplay state.

---

## The World at a Glance

### 8 Playable Races — Each Needs a Distinct Visual Identity

| Race | Color Palette | Architecture Feel | Personality |
|------|--------------|-------------------|-------------|
| **Human** | Gold, white, deep red | Stone cathedrals, fortified walls | Imperial, religious, bureaucratic |
| **Elf** | Deep green, silver, soft violet | Living-wood towers, vine structures | Ancient, scholarly, frail |
| **Orc** | Dark green, brown, bone-white | Tent cities, war banners, stone cairns | Nomadic warriors, honor-bound |
| **Dwarf** | Granite gray, iron blue, forge orange | Carved stone halls, forge-lit caverns | Stubborn craftsmen, underground |
| **Gnome** | Brass, copper, teal | Clockwork towers, gear walls, steam pipes | Inventors, collective, mechanical |
| **Goblin** | Murky green, shadow black, bone yellow | Hidden warrens, trap tunnels, mushroom gardens | Cunning survivors, guerrilla |
| **Lizard Folk** | Deep teal, dark blue, coral accent | Half-submerged temples, bioluminescent caves | Secretive, ritualistic, aquatic |
| **Cat Folk** | Sandy gold, warm amber, jade green | Desert tents, gambling houses, caravans | Lucky nomads, traders |

### 10 Major Cities

| City | Race | Vibe |
|------|------|------|
| The Holy Dominion | Human (starter) | Cathedral town, fortified, central hub |
| Solara | Human (capital) | Grand political center |
| Sylvaris | Elf | Forest canopy city, magical |
| Ironhold | Dwarf | Underground forge-city |
| Kragmor | Orc | Steppe war camp |
| BoneTrap | Goblin | Hidden swamp warren |
| Murkmire | Lizardfolk | Underwater temple complex |
| Mechspire | Gnome (capital) | Clockwork industrial city |
| Clockwork Harbor | Gnome (port) | Gear-driven harbor |
| Fortune's Rest | Catfolk | Desert oasis gambling town |

### 17 Overworld Biomes

Rendered as flat colored tiles. Key biomes and their feel:

| Biome | RGB Color | Feel |
|-------|-----------|------|
| Shimmering Sea | (50,85,140) | Deep blue ocean |
| Great Endless Desert | (210,185,125) | Warm sand |
| Dwarven Mountains | (115,105,95) | Cool gray rock |
| Scorched Sands | (185,145,85) | Hot orange-brown |
| Orcish Steppes | (165,175,95) | Yellow-green grass |
| Wildlands Forest | (35,85,35) | Deep green |
| Green Plains | (115,155,65) | Bright green |
| Shadowfen Swamp | (55,75,45) | Dark murky green |
| Holy Dominion | (135,155,105) | Civilized pastoral |
| Frostbound Reach | (200,210,225) | Ice blue-white |
| Elven South | (50,110,55) | Rich forest green |

---

## The Rift (Core Dungeon)

### 19 Dungeon Themes — Each Needs a Distinct Color Palette

**Castle Themes (Early Floors 1-5):**

| Theme | Wall | Floor | Accent | Feel |
|-------|------|-------|--------|------|
| Stone Keep | Warm gray | Light tan | Dull gold | Medieval fortress |
| Grand Hall | Brown-gray | Warm beige | Bright gold | Royal ballroom |
| Armory Vault | Cool gray-blue | Lavender-gray | Muted purple | Weapon storage |
| Throne Dungeon | Dark purple-gray | Muted violet | Royal gold | Fallen throne room |
| Catacombs | Dark brown | Dusty brown | Bone white | Ancient burial tunnels |

**Wild Themes (Deeper Floors 6+):**

| Theme | Wall | Floor | Accent | Feel |
|-------|------|-------|--------|------|
| Crystal Cavern | Deep blue | Blue-gray | Bright cyan | Glowing crystal caves |
| Fungal Forest | Dark green | Olive | Bright lime | Toxic mushroom jungle |
| Lava Rift | Dark red-brown | Hot red-brown | Bright orange | Volcanic hellscape |
| Frozen Depths | Steel blue | Light blue | Ice white | Frozen cavern |
| Flooded Ruins | Dark teal | Blue-gray | Aqua | Sunken civilization |
| Floating Islands | Purple-gray | Lavender | Bright violet | Gravity-defying platforms |
| Bone Yard | Dark tan | Light tan | Cream | Skeletal wasteland |
| Shadow Realm | Near black | Very dark violet | Deep purple | Void space |
| Overgrown Temple | Dark olive | Sage green | Yellow-green | Jungle ruins |
| Clockwork Maze | Dark bronze | Tan-bronze | Bright gold | Gear-filled corridors |
| Sand Tomb | Warm tan | Light sand | Gold | Egyptian-feel burial chambers |
| Coral Grotto | Dark teal | Blue-green | Coral pink | Underwater reef caves |
| Void Debris | Almost black | Very dark purple | Electric purple | Reality-breaking void |
| Ancient Library | Dark wood brown | Light wood | Amber gold | Dusty scroll halls |

### Boss Encounters (Every 10th Floor)

| Boss | Theme | Lore Hook |
|------|-------|-----------|
| The Iron Castellan | stone_keep | "He sealed himself in. He hasn't slowed down." |
| The Prismatic Queen | crystal_cavern | "Every gemstone was once part of something that breathed." |
| The Spore Mother | fungal_forest | Multi-phase, regenerating fungal horror |
| Molten Titan | lava_rift | Ancient heat concentration with opinions |
| Frost Colossus | frozen_depths | "The cold came first. The Colossus formed around it." |

---

## Card Gacha System — Visual Tiers

### 8 Rarity Tiers (Need Distinct Visual Treatment)

| Tier | Color | Hex | Use For |
|------|-------|-----|---------|
| Common | Gray | #888888 | Card borders, text, backgrounds |
| Uncommon | Green | #22cc22 | Card borders, subtle glow |
| Rare | Blue | #3388ff | Card borders, moderate glow |
| Ultra Rare | Purple | #aa44ff | Card borders, purple shimmer |
| Mythic Rare | Gold | #ffaa00 | Card borders, golden pulse |
| Legendary | Orange | #ff6600 | Card borders, fire-like glow |
| Godly | Red | #ff0000 | Card borders, intense red aura |
| Relic | White | #ffffff | Card borders, divine white radiance |

### 5 Card Visual Styles (Special Editions)

| Style | Chance | Effect Needed |
|-------|--------|--------------|
| Normal | 80% | Standard border |
| Holographic | 12% | Rainbow shimmer animation |
| Golden | 5% | Gold glow animation |
| Prismatic | 2.5% | Color-shifting animation |
| Void Edition | 0.5% | Dark particle effect |

---

## Key NPC Types — Color Coding

| NPC Function | Color | Shape |
|-------------|-------|-------|
| Guildmaster | Blue | Rectangle body + circle head |
| Quest Board | Gold/Yellow | Rectangle body + circle head |
| Leaderboard (Hall of Heroes) | Purple | Rectangle body + circle head |
| Dungeon Entrance (Rift Portal) | Purple (pulsing) | Larger glowing circle |
| Portal Nexus | Cyan | Circle |
| Shop Vendors | Various | Standard NPC shape |

---

## Enemy Visual Guide

### By Archetype

| Archetype | Size | Behavior | Example Enemies |
|-----------|------|----------|----------------|
| Bruiser | Large circle | Slow, tanky melee | Golems, Guards, Bears, Knights |
| Skirmisher | Small circle | Fast, darting | Rats, Bats, Imps, Spiders |
| Ranged | Medium circle | Stays at distance | Archers, Wisps, Banshees |
| Controller | Medium circle | Debuffs, magic | Mages, Liches, Shades |
| Support | Medium circle | Near allies, healing | Hive Minds, Sirens |
| Elite | Large circle | Aggressive, multi-ability | Wardens, Titans |

### Enemy Examples by Theme

**Stone Keep:** Keep Guards, Giant Rats, Skeleton Sentries, Fallen Knights, Stone Golems
**Crystal Cavern:** Crystal Shards, Gem Bats, Cave Crawlers, Crystal Golems, Prismatic Wisps
**Fungal Forest:** Spore Walkers, Toxic Toads, Mycelium Treants, Bloat Wasps, Spore Hydras
**Lava Rift:** Magma Imps, Cinder Hounds, Fire Elementals, Magma Drakes, Infernal Demons
**Frozen Depths:** Frost Wolves, Ice Spirits, Snow Yetis, Frozen Knights, Frost Banshees
**Shadow Realm:** Deepest dark, void creatures, reality-bending enemies

---

## UI Overview

### Controls (for UI design)

```
[WASD] Move    [Click/Space] Attack    [E] Interact    [J] Quests
[I] Inventory  [C] Character  [K] Cards  [M] Map  [P] Plot
```

### HUD Layout (Dungeon)

```
+-------------------------------------------+
|  [HP BAR ████████░░]  Floor 7             |
|  [STAMINA ██████░░░]                       |
|  Lv. 12  XP: 1240/3000                    |
|                                  [MINIMAP] |
|                                  [       ] |
|           GAME AREA              [       ] |
|        (themed tiles,            [       ] |
|         enemies,                           |
|         player)                            |
|                                            |
+-------------------------------------------+
| [WASD] Move [Click/Space] Attack [E] ...  |
+-------------------------------------------+
```

### Player Name Display
```
   CharacterName | Username
        [HEAD]
       [BODY]
```
Name shows above player, up to 150px wide. When character name equals username, shows just the character name.

---

## Resource Icons (Existing Assets)

All icons are pre-existing PNG sprites in `client/icons/`:

**Metals:** Logs, Stones, Mineral ores, Metal bars (copper through mithril)
**Food:** Fish, Bread, Stew, Vegetables, Mushrooms, Wheat
**Specialty:** Glass vials, Gears, Springs, Clockwork cores, Crystals, Gems
**Potions:** Health (red), Mana (blue), Stamina (green), Strength (yellow)
**Tools:** Axes, Pickaxes, Forges, Anvils, Chests
**Quest:** Scrolls, Maps, Keys, Locks

---

## Planned Atmosphere Features (Design Complete, Not Yet Implemented)

1. **Ambient text events** every 45-90 seconds per dungeon floor (theme-specific eerie messages)
2. **Discoverable lore objects** — corpses, journals, inscriptions (race-specific bonus interactions)
3. **Boss intro cinematics** — black screen with boss name + epitaph before fight
4. **Environmental hazards** — lava flows, cave-ins, flooding, psychic static, spore clouds
5. **Campfire storytelling** — narrative events when resting at camps
6. **Death markers** — evidence of other players' deaths on dungeon floors
7. **Fog of war events** — sounds and text from unexplored areas
8. **Blood moon visual** — red vignette overlay on blood_moon modifier floors
9. **Rift Escalation Arc** — 6 narrative tiers based on floor depth, dungeon "wakes up" as you go deeper

---

## Summary — What Makes This Game Unique

1. **Card gacha replaces traditional equipment** — No armor/weapon drops. Power comes from collectible cards with 8 rarity tiers and special visual editions.
2. **8 deeply different races** — Not just stat differences. Each race has unique vision types, languages, card pool weights, and dungeon interactions.
3. **Daily-seeded infinite dungeon** — The Rift resets daily. Yesterday's records and deaths matter. The dungeon itself has lore and personality.
4. **Massive procedural world** — 10,000 km x 12,500 km continent with 17 biomes, each with unique resources and creatures.
5. **Full MMO economy** — NPC shops with dynamic pricing, player auction house, P2P trading, guild vaults.
6. **Colored rectangles as art style** — Deliberate constraint. Color communicates information. Text carries emotion. The minimalism is the aesthetic.

---

*End of Simplified Guide*
