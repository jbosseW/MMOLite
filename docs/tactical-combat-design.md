# MMOLite Tactical Combat System — Full Design Plan

## Reference Games Studied
- **Mewgenics** — Exhaustion timer, dynamic tile transformation, genetics-as-gacha, 2-action simplicity, status-determines-injury, disorders, Necrosis body part loss, 4-stage death
- **Final Fantasy Tactics** — CT-based initiative, cross-job ability slots, height/facing, delayed casting
- **Metal Slug Tactics** — Sync attacks, movement-as-defense, action-feel in turn-based
- **Baldur's Gate 3** — Simultaneous co-op turns, real-time→turn-based transition, environmental chains, reactions
- **Fear and Hunger** — Limb-specific severing, fracture (permanent HP reduction), infection spirals, mind/sanity, coin flip RNG at consequential moments
- **Darkest Dungeon** — Stress/affliction system, diseases curable only in town, town vs dungeon healing split, camp as triage, behavioral debuffs
- **Fallout 3-NV** — Crippled limbs with direct gameplay effects, doctor economy, prosthetic/cybernetic upgrades

---

## 1. CORE PHILOSOPHY

**"Cards are your class. The grid is your weapon. Movement keeps you alive."**

MMOLite's tactical combat sits at the intersection of:
- FFT's depth (CT initiative, ability synergy, terrain matters)
- Metal Slug Tactics' aggression incentive (movement = defense, sync attacks)
- BG3's multiplayer solution (simultaneous grouped turns, shared initiative tracker)
- Mewgenics' anti-stall pressure (exhaustion timer, speed-based play rewarded)

The card system replaces the traditional job/class system entirely. Your equipped cards ARE your build — a player with Fireball II + Ice Shard + Magic Resistance plays fundamentally differently from one with Backstab II + Smoke Bomb + Quick Reflexes. Card pulls are character progression. Card fusion is build optimization. This is the gacha-as-tactics-class loop.

---

## 2. COMBAT TRANSITION — SEAMLESS SWAP

### Overworld: Real-Time (Unchanged)
- Movement, gathering, crafting, trading, socializing — all stay real-time
- No combat in overworld (towns are safe zones)

### Dungeon Entry: Real-Time Exploration
- Players move freely on the dungeon grid in real-time
- Can see enemies patrolling (fog of war still applies)
- Can position before engaging (BG3's preparation phase)
- Can interact with chests, shrines, camps without triggering combat

### Combat Trigger → Turn-Based Snap
**Triggers:**
- Player attacks an enemy (manual engagement)
- Player enters an enemy's detection radius (4-6 tiles by archetype)
- Boss room entered (scripted trigger)
- Trap triggers enemy alert

**Transition Animation (client-side):**
1. Screen flash — brief white pulse (0.15s)
2. "ENCOUNTER!" text slides in from right (0.3s)
3. Camera pulls back slightly to show full combat area
4. Initiative bar slides down from top of screen
5. Tile grid overlay fades in (subtle grid lines on floor tiles)
6. Turn begins — total transition: ~0.8 seconds

**Engagement Radius:**
- All enemies within 8 tiles of the triggering enemy join the encounter
- All players within 10 tiles of the trigger point join the encounter
- Players further away continue real-time exploration until they enter range
- Late-joining players insert into the initiative order at the next available slot

### Combat End → Real-Time Resume
- Last enemy dies or flees
- "VICTORY!" text + XP/loot summary overlay (2s)
- Grid overlay fades out
- Players resume real-time movement
- Transition out: ~0.5 seconds

---

## 3. INITIATIVE SYSTEM — CT-BASED (FFT MODEL)

### Charge Time (CT) Queue

Every combatant (players and enemies) has a CT value starting at 0. Each game tick advances all CT values by their Speed stat. When CT reaches 100, that unit acts.

```
CT Formula:
  ct_gain_per_tick = base_speed + (finesse_stat * 0.5) + equipment_speed_bonus + card_speed_bonus

Base Speed by Race:
  Human:      10
  Elf:         9 (slow but magical)
  Orc:        11 (slightly fast)
  Dwarf:       8 (slowest, tankiest)
  Gnome:       9
  Goblin:     13 (fastest race)
  Lizard Folk: 10
  Cat Folk:   12 (fast and agile)
```

### CT After Acting
- Moved AND attacked: CT resets to 0
- Only moved OR only attacked: CT resets to 20 (slight advantage)
- Waited (skipped turn): CT resets to 40 (significant advantage — next turn comes sooner)

This creates the FFT "Wait" strategy — sacrificing a turn to act sooner next round.

### Initiative Display (BG3 Model)
- Horizontal strip at top of screen
- Portrait icons ordered left→right by who acts next
- Color-coded by player (P1=blue, P2=green, P3=orange, P4=purple)
- Enemy portraits in red
- Active unit highlighted with pulsing border
- All players see the same tracker (shared state via socket broadcast)

### Simultaneous Player Turns (BG3 Solution)
When multiple players have CT reaching 100 in the same tick window (within 5 CT of each other):
- They ALL act simultaneously
- Each player sees their own movement/ability options
- Actions resolve in parallel
- If two players target the same enemy, both attacks land (no wasted action)
- Server processes all simultaneous actions, then broadcasts results

This prevents the DOS2 problem of 10-minute waits between turns in 4-player co-op.

### Haste / Slow Effects
- **Haste**: CT gain doubled (from cards like "Quick Reflexes" or abilities)
- **Slow**: CT gain halved (from enemy debuffs or environmental effects)
- **Stun**: CT frozen for duration (unit skipped in queue)
- **Fear**: Unit must use movement to flee from source (can't attack)

---

## 4. ACTION ECONOMY — MOVE + ACT + REACT

### Per Turn: 3 Resources

**1. Movement Points (MP)**
```
Base MP = 3 tiles
Bonuses:
  + Finesse / 10 (rounded down)
  + Card bonuses (Quick Reflexes: +1 MP)
  + Race bonus (Goblin: +1 MP in swamp/forest, Cat Folk: +1 MP in desert)
  + Haste: double MP

Max MP = 6 tiles (hard cap to prevent runaway builds)
```

Movement is NOT restricted to before or after action — you can split it:
- Move 2 tiles → Attack → Move 1 tile (retreat after striking)
- This enables hit-and-run tactics (Metal Slug Tactics skirmisher feel)

**2. Action Points (AP) — 1 per turn**
Spend on one of:
- Basic Attack (melee range 1, or weapon range)
- Card Ability (equipped active ability card)
- Item Use (potion, throwable)
- Interact (open chest, activate shrine — only outside combat)

**3. Reaction Points (RP) — 1 per round**
Triggers automatically on specific conditions (BG3 model):
- **Counter-Strike**: When enemy attacks you in melee, 30% chance to strike back (Finesse-based)
- **Dodge Roll**: When enemy attacks you, spend reaction to halve damage (requires "Evasion" card)
- **Magic Shield**: When hit by magic, absorb X damage (requires "Magic Resistance" card)
- **Opportunity Attack**: When enemy moves out of your melee range, free attack

Reaction cards are equipped in the passive perk card slot. You get ONE reaction per round (refreshes when your turn starts again).

### Movement-as-Defense (Metal Slug Tactics Adaptation)

**Momentum Shield:**
For every tile moved during your turn, gain +1 Momentum Shield point.
- Momentum Shield absorbs incoming damage before HP (like Metal Slug's Dodge)
- Momentum Shield expires at the START of your next turn
- Maximum Momentum Shield = your MP value
- Standing still = 0 shield = maximum vulnerability

This mechanically rewards aggressive repositioning every turn. Turtling (standing still and attacking) leaves you exposed. The optimal play pattern is: move, strike, reposition.

```
Example:
  Player has 4 MP, moves 3 tiles, attacks, moves 1 more tile
  Momentum Shield = 4 (moved 4 total tiles)
  Next enemy attack deals 15 damage
  → 15 - 4 = 11 damage taken (shield absorbs 4)
  → Shield drops to 0 after absorbing
```

---

## 5. CARD-AS-CLASS SYSTEM

### How Cards Replace Jobs

In FFT, your Job determines your abilities. In MMOLite, your **equipped cards** determine your abilities. This is the gacha-as-class-system loop.

### Card Slots in Combat

```
Slot 1: Primary Action Card    — Your main active ability (Fireball, Backstab, Heal Self, etc.)
Slot 2: Secondary Action Card  — Your backup ability (Ice Shard, Smoke Bomb, Lightning Bolt, etc.)
Slot 3: Passive/Reaction Card  — Always-on effect OR reaction trigger
Slot 4: Passive/Stat Card      — Stat boost, skill boost, or second passive

Unlocked at levels:
  Level 1:  Slots 1-2
  Level 10: Slot 3
  Level 20: Slot 4
  Level 30: Slot 5 (bonus — any type)
  Level 40: Slot 6 (bonus — any type)
```

### Card Ability Examples in Tactical Context

**Fireball II (Rare, Active)**
- AP Cost: 1 action
- Range: 4 tiles
- AoE: 3x3 tile area
- Damage: 20 + (Acumen * 1.5)
- Effect: Creates BURNING tiles (3 turns) in the blast area
- Charge Time: 1 tick delay (FFT-style — spell fires on next tick, enemies can dodge)

**Backstab II (Uncommon, Active)**
- AP Cost: 1 action
- Range: 1 tile (must be behind target)
- Damage: 35 + (Finesse * 2.0) — massive if flanking
- Effect: Guaranteed critical hit from behind
- No charge time (instant)
- Bonus: If target didn't see you (stealth), damage doubled

**Heal Self (Common, Active)**
- AP Cost: 1 action
- Range: Self
- Heal: 25 + (Resolve * 1.5)
- No charge time
- Cooldown: 3 rounds

**Smoke Bomb (Uncommon, Active)**
- AP Cost: 1 action
- Range: 3 tiles (throw)
- AoE: 2x2 tile area
- Effect: Creates SMOKE tiles (2 turns) — blocks line of sight, enemies can't target through
- Allies inside smoke get +50% dodge chance

**Quick Reflexes (Common, Passive)**
- +1 MP per turn
- +15% dodge chance
- Unlocks "Dodge Roll" reaction

**Stone Skin (Rare, Passive — Dwarf affinity)**
- +10 flat armor
- Immunity to knockback
- -1 MP per turn (trade-off: tanky but slow)

**Nine Lives (Legendary, Passive — Cat Folk affinity)**
- First lethal hit per dungeon run instead leaves you at 1 HP
- +20% luck on all rolls
- Unlocks "Lucky Counter" reaction (on dodge, counter-attack for free)

### Racial Card Synergies in Combat

Each race's affinity cards create natural archetypes without locking players in:

| Race | Natural Archetype | Key Cards | Combat Feel |
|------|-------------------|-----------|-------------|
| Human | Commander/Support | Dominion Authority, XP boost cards | Buff allies, level faster, versatile |
| Elf | Glass Cannon Mage | Millennial Memory, Fireball, Lightning | High magic damage, fragile, charge-time spells |
| Orc | Berserker Bruiser | Khanate Vitality, melee boost cards | High HP, high melee damage, charges in |
| Dwarf | Immovable Tank | Stone-Born Artisan, Stone Skin | Highest armor, slow, holds chokepoints |
| Gnome | Gadgeteer/Trapper | Tinker Savant, cogwork cards | Place turrets/traps, area denial |
| Goblin | Rogue/Assassin | Guerrilla Instinct, Backstab, Smoke | Fastest, flanking, stealth kills |
| Lizard Folk | Ritualist/Controller | Aquatic Heritage, ritual cards | Status effects, terrain manipulation, unique magic |
| Cat Folk | Lucky Skirmisher | Pattern Recognition, Nine Lives, Lucky Coin | Crit-based, dodge-based, high risk/high reward |

But any race can equip any non-race-locked card. A Dwarf with Fireball II is valid. An Elf with Stone Skin is valid. The racial cards are stronger for their race but the system is open.

---

## 6. SYNC ATTACKS — CO-OP COMBO SYSTEM (METAL SLUG ADAPTATION)

### The Core Loop

When a player attacks an enemy, every allied player within LINE OF SIGHT of that enemy AND within 4 tiles of the attacker gets a FREE basic attack on the same target.

```
Sync Attack Rules:
  1. Triggering player declares attack on enemy
  2. Server checks all other players:
     - Are they in the same combat encounter?
     - Do they have line of sight to the target? (Bresenham ray, no walls between)
     - Are they within 4 tiles of the ATTACKER (not the target)?
  3. Qualifying allies fire their basic weapon attack (no card abilities)
  4. All damage resolves simultaneously
  5. Sync attacks do NOT consume the ally's action or reaction
  6. Limit: Each ally can sync-attack ONCE per round (prevents infinite chains)
  7. Against bosses: Max 2 sync attacks per round (boss protection)
```

### Why This Works for MMOLite

- 4-player co-op = up to 3 sync attacks on every primary attack
- Positioning your party for maximum sync coverage IS the tactical puzzle
- Creates moments of massive coordinated damage that feel amazing
- Rewards grouping up (risk: AoE vulnerability) vs spreading out (safety: less sync damage)
- Simple to understand, deep to master

### Sync Attack Visual
- Allied portraits flash when sync triggers
- Small projectile/slash effect from each syncing ally toward the target
- Damage numbers stack and pop simultaneously
- Brief "SYNC x3!" text if all 3 allies join in

---

## 7. TILE EFFECTS & ENVIRONMENTAL COMBAT (MEWGENICS + BG3)

### Dynamic Tile System

The dungeon grid already uses tile types (FLOOR, CORRIDOR, DOOR, etc.). Combat adds ELEMENTAL TILES that transform the battlefield:

```
Tile Types & Effects:

BURNING (Fire)
  - Created by: Fire spells, fire enemy abilities, oil + any fire source
  - Effect: Units entering or starting turn take 3 damage/turn
  - Duration: 3 turns
  - Spread: 20% chance to spread to adjacent FLOOR tiles each turn
  - Interaction: Melts ICE tiles, evaporates WATER tiles

FROZEN (Ice)
  - Created by: Ice spells, ice enemy abilities, water + freeze source
  - Effect: Units entering must pass Finesse check or SLIP (lose remaining MP, fall prone)
  - Duration: 4 turns
  - Interaction: Fire removes it instantly

POISONED (Toxic)
  - Created by: Poison abilities, fungal enemies, alchemy throwables
  - Effect: Units entering gain POISON status (1 dmg/tick, 5 ticks, stacks to 3)
  - Duration: 5 turns
  - Interaction: Fire burns it away (creates brief SMOKE)

ELECTRIFIED (Lightning)
  - Created by: Lightning spells, electrified water
  - Effect: Units entering take 5 lightning damage + STUNNED for 1 tick
  - Duration: 2 turns
  - Interaction: Water tiles adjacent become ELECTRIFIED too (chain!)

SMOKE (Obscured)
  - Created by: Smoke Bomb card, fire + water interaction, burning wood
  - Effect: Blocks line of sight through tile, +50% dodge for units inside
  - Duration: 2 turns
  - Interaction: Wind effects clear it

WATER (Wet)
  - Created by: Water spells, pipe/fountain destruction, some floor traps
  - Effect: Slows movement (costs 2 MP per tile instead of 1)
  - Duration: Permanent until evaporated
  - Interaction: Lightning makes it ELECTRIFIED, Fire evaporates it, Ice freezes it

OIL (Flammable)
  - Created by: Oil barrel destruction, certain enemy abilities
  - Effect: No direct damage, slows movement slightly
  - Duration: Permanent until ignited
  - Interaction: ANY fire source → massive BURNING area (5x damage on ignition)

BRAMBLE (Thorny)
  - Created by: Plant/fungal enemies, nature spells
  - Effect: 2 damage on entry, costs 2 MP per tile
  - Duration: 4 turns
  - Interaction: Fire burns it instantly (creates brief BURNING)
```

### Elemental Chain Reactions (BG3 Model)

Players can set up multi-step environmental combos:

```
Example Combo 1 — "The Oil Trap":
  Turn 1: Lizard Folk casts Water Ritual → creates WATER tiles in corridor
  Turn 2: Gnome throws Oil Flask → OIL spreads on WATER
  Turn 3: Elf casts Fireball into the OIL zone → MASSIVE BURNING explosion
  Result: 3x fire damage to all enemies in the corridor

Example Combo 2 — "The Lightning Grid":
  Turn 1: Player opens water valve (dungeon interactable) → WATER floods 5x5 area
  Turn 2: Lightning Bolt card → WATER becomes ELECTRIFIED
  Result: All enemies standing in water take 5 damage + stun

Example Combo 3 — "The Ambush":
  Turn 1: Goblin uses Smoke Bomb → SMOKE blocks enemy line of sight
  Turn 2: Party moves into flanking positions through SMOKE
  Turn 3: Orc attacks from behind enemy → triggers 3 sync attacks from hidden positions
  Result: Massive alpha strike with backstab bonuses
```

### Pre-Combat Environmental Setup

Before triggering combat, players in real-time exploration can:
- Push barrels into position (oil barrels, explosive barrels)
- Place Gnome turret cards (if equipped) as area denial
- Cast preparatory spells (Smoke, Water, Oil) on patrol paths
- Position for maximum sync attack coverage

If ALL players are hidden (stealth) when combat triggers:
- **Surprise Round** — All enemies skip their first turn (BG3 model)
- Only Goblin and Cat Folk have natural stealth bonuses for this
- "Shadow Cloak" card enables any race to attempt pre-combat stealth

---

## 8. EXHAUSTION TIMER — ANTI-STALL (MEWGENICS MODEL)

### The Pressure Clock

After **Turn 12** of any combat encounter, EXHAUSTION activates:
- Turn 13: All player units take 2 unblockable damage at turn start
- Turn 14: All player units take 4 unblockable damage
- Turn 15: All player units take 6 unblockable damage
- Each subsequent turn: +2 additional damage

This damage CANNOT be healed, shielded, or avoided. It is a hard timer.

### Why Turn 12

- Average non-boss encounter should resolve in 4-8 turns
- Boss encounters should resolve in 8-12 turns
- Turn 12 gives comfortable room but punishes excessive caution
- Creates genuine tension in drawn-out fights: "We need to finish this NOW"

### Speed Reward Bonus (Mewgenics Loot Model)

Faster clears = better rewards:
```
Turns to clear    Loot bonus
  1-4             +50% gold, +25% XP, guaranteed rare+ drop
  5-8             +25% gold, +10% XP
  9-12            Standard drops
  13+             -25% gold (exhaustion penalty), no bonus drops
```

This creates a positive feedback loop: aggressive play → faster clears → better loot → stronger builds → even faster clears.

---

## 9. BOSS ENCOUNTERS — PUZZLE FIGHTS (MEWGENICS MODEL)

### Boss Design Philosophy

Every boss is a PUZZLE, not a stat check. Each requires discovering a mechanic unique to that boss.

### Example Boss Redesigns

**Iron Castellan (Stone Keep, Floor 10)**
```
Phase 1 (100%-60% HP): "The Formation"
  - Summons 2 Keep Guards every 2 turns
  - Guards form a SHIELD WALL — Castellan takes 0 damage while guards live
  - Puzzle: Kill the guards to expose the boss
  - Sync attacks are critical here (focus fire guards down fast)

Phase 2 (60%-30% HP): "The Charge"
  - Castellan charges in a straight line (4 tiles) every turn
  - Charge deals 2x damage and STUNS for 1 turn
  - Puzzle: Position so he charges into walls (stuns HIMSELF for 2 turns)
  - Environmental: If he charges through BURNING tiles, takes fire damage

Phase 3 (30%-0% HP): "Last Stand"
  - Castellan plants his sword, becomes immobile
  - Every turn, fires shockwave in + pattern (3 tiles each direction)
  - Puzzle: Stand on diagonal tiles (safe from + pattern)
  - Kill fast — exhaustion timer is ticking
```

**Prismatic Queen (Crystal Cavern, Floor 10)**
```
Phase 1 (100%-50% HP): "Refraction"
  - Queen creates 3 Crystal Mirror copies (25% of her HP each)
  - Attacking a mirror reflects 50% damage back at attacker
  - Puzzle: Use environmental attacks (push barrels, tile effects) to
    destroy mirrors without taking reflected damage
  - Lightning abilities shatter ALL mirrors instantly

Phase 2 (50%-0% HP): "Prismatic Storm"
  - Queen cycles colors each turn: RED → BLUE → GREEN → PURPLE
  - RED turn: All fire attacks do 0 damage, ice does 2x
  - BLUE turn: All ice attacks do 0 damage, lightning does 2x
  - GREEN turn: All poison attacks do 0 damage, fire does 2x
  - PURPLE turn: All magic does 0 damage, physical does 2x
  - Puzzle: Read the color, use the counter-element
  - Party diversity rewarded (single-element parties struggle)
```

**Spore Mother (Fungal Forest, Floor 10)**
```
Phase 1 (100%-60% HP): "The Garden"
  - Floor covered in BRAMBLE tiles that regenerate each turn
  - Spore Mother heals 15 HP/turn while standing on BRAMBLE
  - Puzzle: Burn the bramble (fire clears it) to stop her healing
  - Movement penalty from bramble forces careful pathing

Phase 2 (60%-30% HP): "Spore Bloom"
  - Releases POISONED cloud that covers 60% of the arena
  - Poison: 3 stacks per turn to anyone in cloud
  - Puzzle: Safe tiles marked with glowing mushrooms (2-3 per turn, random)
  - Must dash between safe tiles while dealing damage
  - Goblin racial bonus: immune to 1 stack of poison

Phase 3 (30%-0% HP): "Final Bloom"
  - Roots erupt from floor — 3 random tiles per turn become INSTANT KILL zones
  - 1-turn warning: tiles glow red before roots erupt
  - Puzzle: Read the warnings, reposition every turn
  - Movement-as-defense at its most critical
  - Nine Lives card (Cat Folk legendary) saves you once here
```

---

## 10. MULTIPLAYER COMBAT FLOW — 4-PLAYER CO-OP

### Turn Flow for 4 Players

```
Round Start:
  → Server calculates CT for all combatants
  → Groups players with adjacent CT values (within 5 CT)
  → Broadcasts initiative order to all clients

Player Group Turn (Simultaneous):
  → All grouped players see "YOUR TURN" simultaneously
  → Each player independently:
    1. Moves (path highlighted, can split move)
    2. Uses action (attack, card ability, item)
    3. Ends turn (button or auto-end after action)
  → Server waits for all grouped players to end turn (15-second timer)
  → If timer expires, remaining players auto-end (skip)
  → Server resolves all actions simultaneously
  → Broadcasts results (damage, effects, deaths, tile changes)

Enemy Group Turn:
  → AI processes all enemies in CT order
  → Actions animate sequentially (0.3s per enemy for readability)
  → Players can trigger REACTIONS during enemy turn
  → Reaction prompt: 3-second decision window

Round End:
  → Status effects tick (burn, poison, bleed)
  → Exhaustion check (if turn > 12)
  → Tile effects update (fire spreads, ice melts, smoke clears)
  → CT advances for next round
  → Loop
```

### Turn Timer
- **15 seconds per player turn** (generous but prevents AFK stalling)
- Timer visible to all players
- Last 5 seconds: timer turns red, warning sound
- If timer expires: player's turn skipped (no action, no movement)
- In solo play: no timer (play at your own pace)

### Disconnect Handling (BG3 Lessons Applied)
- Player disconnects → their character enters AUTO-DEFEND mode:
  - Holds position
  - Uses basic attack on nearest enemy if in range
  - Does not use card abilities or items
  - Does not move
- No host menu intervention required
- Disconnected player can rejoin anytime → immediately reclaims character
- Character persists in combat until encounter ends or party wipes

### Late Join
- Player enters dungeon floor while combat is active
- They are inserted into the initiative order at the NEXT available position
- They start at the edge of the combat zone
- Their first turn begins normally

### Death in Co-op
- Player reaches 0 HP → enters DOWNED state
- Downed: Cannot act, takes 2 damage/turn (bleed out timer)
- Ally can spend their ACTION to revive (must be adjacent, heals to 25% HP)
- If all players downed → party wipe → all teleport to town
- If at least one player alive, downed players can be revived

---

## 11. VISUAL STYLE — PIXEL ART TACTICAL

### Camera & View

```
Default View:
  - Top-down orthogonal (current MMOLite style)
  - 32x32 pixel tiles
  - Combat zoom: camera pulls back 20% to show more of battlefield
  - Grid overlay: subtle dotted lines on tile borders (50% opacity)

Active Unit Highlight:
  - Pulsing golden border around current actor's tile
  - Movement range: blue-tinted tiles (reachable this turn)
  - Attack range: red-tinted tiles (targetable from current position)
  - Card ability range: orange-tinted tiles (ability-specific AoE preview)
  - Enemy threat range: dark red tiles (where enemies CAN attack on their turn)
```

### UI Layout During Combat

```
┌─────────────────────────────────────────────────────────────┐
│  [P1]→[E1]→[P2][P3]→[E2]→[E3]→[P4]→[E4]...   TURN: 7/12 │  ← Initiative Bar
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     DUNGEON GRID                            │
│                  (32x32 tile view)                           │
│                                                             │
│  ┌──────┐                                                   │
│  │ P1   │  ← Party portraits (left edge)                    │
│  │ HP   │     Show HP bar, status icons, momentum shield    │
│  │ MP   │                                                   │
│  ├──────┤                                                   │
│  │ P2   │                                                   │
│  │ HP   │                                                   │
│  ├──────┤                                                   │
│  │ P3   │                                                   │
│  │ HP   │                                                   │
│  ├──────┤                                                   │
│  │ P4   │                                                   │
│  │ HP   │                                                   │
│  └──────┘                                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Card1] [Card2] [BasicAtk] [Wait] [Item]  │ MP: ●●●○  │  │  ← Action Bar
│  AP: ● RP: ●   Momentum: ████░░            │ End Turn   │  │
└─────────────────────────────────────────────────────────────┘
```

### Color Palette for Combat UI

```
Movement Range Tiles:     rgba(60, 130, 255, 0.25)   — Soft blue
Attack Range Tiles:       rgba(255, 60, 60, 0.25)    — Soft red
Card Ability AoE Preview: rgba(255, 160, 40, 0.3)    — Soft orange
Enemy Threat Tiles:       rgba(180, 30, 30, 0.15)    — Dark red (subtle)
Sync Attack Line:         rgba(255, 255, 100, 0.6)   — Yellow flash
Active Unit Border:       rgba(255, 215, 0, 1.0)     — Gold
Momentum Shield Bar:      rgba(100, 200, 255, 0.8)   — Cyan
Exhaustion Warning:       rgba(200, 50, 50, 0.4)     — Red overlay (screen edge)

Tile Effect Colors (match existing theme palettes):
  BURNING:     rgba(255, 120, 30, 0.6)   — Matches Lava Rift accent
  FROZEN:      rgba(200, 230, 255, 0.5)  — Matches Frozen Depths accent
  POISONED:    rgba(100, 200, 60, 0.4)   — Matches Fungal Forest accent
  ELECTRIFIED: rgba(180, 180, 255, 0.5)  — White-blue crackle
  SMOKE:       rgba(80, 80, 80, 0.6)     — Gray cloud
  WATER:       rgba(60, 100, 200, 0.3)   — Blue pool
  OIL:         rgba(40, 30, 20, 0.5)     — Dark brown slick
  BRAMBLE:     rgba(80, 120, 40, 0.4)    — Dark green thorns
```

### Animation Style

```
Attack Animations:
  - Basic melee: 3-frame slash (0.2s) — sprite sheet strip
  - Basic ranged: projectile sprite travels tile-to-tile (0.15s/tile)
  - Card abilities: 4-6 frame effect animation centered on target tile(s)
  - Sync attacks: smaller slash/projectile from each ally (0.15s, overlap)

Movement Animations:
  - Tile-to-tile hop (existing 0.15s move, slightly bouncy)
  - Path preview: dotted line from unit to destination

Damage Numbers:
  - White for normal damage
  - Yellow for critical hits (larger font, bounce)
  - Red for damage taken
  - Green for healing
  - Cyan for Momentum Shield absorbed
  - Purple for status effect damage (poison, bleed)

Status Effect Icons:
  - Small 8x8 pixel icons above unit sprite
  - Burn: flame icon (orange)
  - Poison: skull icon (green)
  - Stun: stars icon (yellow)
  - Bleed: droplet icon (red)
  - Haste: arrow-up icon (blue)
  - Slow: arrow-down icon (gray)
```

---

## 12. ENEMY AI IN TURN-BASED CONTEXT

### Adapting the Existing AI State Machine

The current `dungeon-ai.js` state machine (idle/patrol/alert/evaluate/position/attack/reset/fallback) maps directly to turn-based:

```
Real-Time State    →    Turn-Based Equivalent
─────────────────────────────────────────────
idle/patrol        →    Pre-combat patrol (real-time phase)
alert              →    Combat triggered (enters initiative)
evaluate           →    Start of AI turn: pick target + action
position           →    AI movement phase: move toward preferred range
attack             →    AI action phase: use ability on target
reset              →    Leash check: return to spawn if no targets
fallback           →    Retreat behavior: flee when HP below threshold
```

### AI Decision Priority (Per Turn)

```
1. SURVIVAL CHECK
   - HP below retreat threshold? → Flee toward spawn
   - Adjacent to 3+ enemies? → Reposition (controller/support/ranged)

2. SUPPORT CHECK (Support archetype only)
   - Ally below 50% HP within heal range? → Heal ally
   - Ally has debuff? → Cleanse ally (if ability available)

3. THREAT ASSESSMENT
   - Calculate threat score for each player:
     threat = (damage_dealt_to_allies * 2) + (is_healer * 50) + (is_low_hp * 30)
   - Target highest threat player

4. ABILITY SELECTION
   - Can use special ability? (off cooldown, in range) → Use it
   - Can use basic attack? (in range) → Attack
   - Can't reach target? → Move toward preferred range

5. MOVEMENT
   - Bruiser/Skirmisher: Move toward target (close range)
   - Ranged: Move to preferred range (2-3 tiles from target)
   - Controller: Move to maximize AoE coverage
   - Support: Move to stay near allies (2-3 tiles)
   - Elite: Adaptive (changes by phase)

6. FLANKING (Skirmisher archetype)
   - If target has ally adjacent, attempt to move to OPPOSITE side
   - Backstab bonus: +50% damage from behind
```

### Enemy Turn Animation Speed
- Each enemy action: 0.4s animation + 0.2s pause
- Max 8 enemies per encounter (prevents 30-second enemy phases)
- If >8 enemies, some act simultaneously (grouped by type)
- "Fast Forward" button: 2x speed enemy turns (player option)

---

## 13. DUNGEON INTEGRATION

### How Tactical Combat Fits the Dungeon Loop

```
Dungeon Floor Flow:
  1. Enter floor (real-time)
  2. Explore — find rooms, chests, shrines, stairs (real-time)
  3. Encounter enemies — SNAP to turn-based
  4. Resolve combat — SNAP back to real-time
  5. Loot, heal at camp, continue exploring
  6. Find stairs → next floor
  7. Every 10th floor: Boss encounter (always turn-based)
```

### Rift-Specific Mechanics
- Daily seed means all players face the same dungeon layout
- Leaderboard: "Fastest Floor 10 Clear" tracks turn count, not real-time
- Camp system: Cooking food grants combat buffs (HP regen, +damage, +MP)
- Shrine buffs: Random per-floor buffs (Haste for 3 encounters, +2 MP, etc.)
- Floor modifiers (from existing rift-atmosphere-features.md):
  - "Burning Ground": Random tiles become BURNING each round
  - "Frozen Wastes": All water tiles are ICE, movement costs +1
  - "Toxic Spores": POISONED tiles spawn near enemies
  - "Lightning Storm": Random ELECTRIFIED tiles each round
  - "Dense Fog": Reduced visibility (fog of war closer)

### Overworld Cave Dungeons
- Same tactical combat system
- Shorter (3-10 floors)
- No camp system
- Boss on final floor
- Entry doesn't require guild membership

---

## 14. PROGRESSION REWARDS FOR TACTICAL PLAY

### XP Distribution (Adapted from Mewgenics)

```
Combat XP Pool = sum of all enemy XP values
Distribution:
  - ALL participating players receive equal XP (no "carry" strategy needed for MMO)
  - Speed bonus applies to total pool before distribution
  - Dungeon Delving skill gains XP from every combat
  - Weapon skill (Melee/Magic/Archery) gains XP based on action type used

Speed Bonus:
  Turns 1-4:   Pool × 1.5
  Turns 5-8:   Pool × 1.25
  Turns 9-12:  Pool × 1.0
  Turns 13+:   Pool × 0.75
```

### Card Pack Drops

```
Normal enemies:  5% chance of card pack per kill
Elite enemies:   25% chance of card pack
Boss enemies:    100% card pack (guaranteed)
  Speed bonus on boss:
    Turns 1-8:   Pack has +1 card AND rarity bump (+1 tier to one random card)
    Turns 9-12:  Standard pack
    Turns 13+:   Pack has -1 card
```

### Dungeon Skill Benefits (Now Wired to Combat)

```
Dungeon Delving (Skill):
  Level 10: +5% damage in dungeons
  Level 20: +1 MP in dungeons
  Level 30: +10% damage in dungeons
  Level 40: +10% gold from dungeon enemies
  Level 50: +2 MP in dungeons (total +3 from skill)
  Level 60: +15% damage in dungeons (total +30%)
  Level 70: +1 card slot in dungeons only
  Level 80: Exhaustion starts at Turn 15 instead of 12
  Level 90: +50% sync attack damage
  Level 99: "Rift Walker" title + unique card drop
```

---

## 15. IMPLEMENTATION PHASES

### Phase 1: Core Turn Engine (Server) — ~3-4 days
- CT initiative system in `dungeon-combat.js` (new file)
- Turn state machine: `WAITING_FOR_CT` → `PLAYER_TURN` → `ENEMY_TURN` → `ROUND_END`
- Movement validation (MP-based, path-checking)
- Basic attack action with damage calc
- Socket events: `combat_start`, `combat_turn`, `combat_action`, `combat_result`, `combat_end`
- Simultaneous player grouping logic
- Turn timer (15s)

### Phase 2: Client Combat UI — ~3-4 days
- Initiative bar (top of screen)
- Tile range overlays (movement blue, attack red, ability orange)
- Action bar (card slots + basic attack + wait + end turn)
- Momentum shield display
- Turn transition animation (real-time → turn-based snap)
- Movement path preview (click tile → show path → confirm)
- Damage number popups
- Status effect icons

### Phase 3: Card Abilities in Combat — ~2-3 days
- Card ability execution (range, AoE, damage, effects)
- Charge time system (delayed spells)
- Cooldown tracking per card per combat
- Tile effect creation (BURNING, FROZEN, etc.)
- Tile effect interactions (fire + oil, water + lightning, etc.)
- AoE preview before casting

### Phase 4: Sync Attacks + Reactions — ~2 days
- Sync attack detection (LOS check, range check)
- Sync attack animation (simultaneous projectiles/slashes)
- Reaction system (opportunity attack, dodge roll, counter-strike)
- Reaction prompt UI (3-second decision window during enemy turn)

### Phase 5: Multiplayer Sync — ~2-3 days
- Simultaneous turn grouping (CT adjacency detection)
- Parallel action resolution (server-side)
- Late join handling
- Disconnect → auto-defend mode
- Reconnection → reclaim character
- Turn timer synchronization across clients
- Initiative bar sync (all players see same state)

### Phase 6: AI Adaptation — ~2 days
- Convert AI state machine from tick-based to turn-based
- AI decision tree (threat assessment, ability selection, positioning)
- Flanking behavior for skirmishers
- Support AI (healing priority)
- Boss phase transitions in turn-based context
- Enemy turn animation sequencing

### Phase 7: Boss Puzzles + Polish — ~2-3 days
- Implement puzzle mechanics for each boss
- Exhaustion timer system
- Speed bonus loot multiplier
- Floor modifier effects in combat
- Environmental object interaction (barrels, valves)
- "Fast Forward" enemy turns option
- Combat log (text log of all actions/damage)
- Sound effect hooks (attack, spell, sync, level up)

### Phase 8: Wound & Injury System — ~3-4 days
- Body region tracking (6 regions per character)
- Wound table implementation (24 wounds, 4 tiers x 6 regions)
- Wound-cause mapping (status-determines-injury logic)
- Wound severity escalation (same-region stacking)
- Scar formation (Tier 4 grace period, boss finishing moves)
- Wound effects on combat stats (MP reduction, damage penalties, etc.)
- Client wound display (body region diagram, wound icons on portrait)

### Phase 9: Stress & Mental System — ~2-3 days
- Stress 0-100 tracking with visual thresholds
- Stress source/relief event hooks
- Affliction system (5 afflictions with behavioral AI override)
- Affliction cure mechanics (in-dungeon and town)
- Client stress visualization (portrait changes, audio cues)
- Co-op stress propagation (shared stress events)

### Phase 10: Prosthetics & Healing Economy — ~2-3 days
- Prosthetic item definitions and crafting recipes
- Prosthetic stat modification system
- Town Cleric NPC (scar removal, resurrection, cleansing services)
- Camp triage/surgery/splint actions
- Healer card abilities (Mend Wounds, Restore Mind, Purify, etc.)
- Infection system (4 stages, floor-based progression)
- Co-op carry mechanic (0 MP ally transport)

### Phase 11: Death & Revival System — ~1-2 days
- 4-stage death system (Downed → Dying → Death's Door → Dead)
- Revive mechanics (different requirements per stage)
- Death consequences (scars, coin tax, card destruction chance)
- Spectator mode for dead players
- "Nine Lives" and "Resurrect" card exception handling
- Battle Bond tracking (co-op revive relationship)

**Total Estimate: ~24-34 days (with AI assistance: ~15-21 days)**

### File Structure (New + Modified)

```
NEW FILES:
  server/
    dungeon-combat.js      — Turn engine, CT system, action resolution
    combat-tiles.js         — Tile effect system (burning, frozen, etc.)
    combat-sync.js          — Sync attack detection, reaction system

  client/
    scenes/combat-ui.lua    — Combat UI rendering (initiative bar, action bar, ranges)
    scenes/combat-anim.lua  — Combat animations (attacks, spells, sync, tile effects)

MODIFIED FILES:
  server/
    handlers/dungeon.js     — Wire combat trigger, replace real-time attack with turn start
    dungeon-ai.js           — Convert to turn-based decision tree
    dungeon-data.js         — Add boss puzzle phase data, ability charge times
    socket.js               — Register new combat socket events

  client/
    scenes/game.lua         — Add combat state, transition animations, input routing
```

---

## 16. OPEN DESIGN QUESTIONS

These should be decided before implementation begins:

1. **PvP**: Should the tactical system support player-vs-player duels? (Adds complexity but huge engagement potential)

2. **Spectator Mode**: Can non-combat players watch an ongoing encounter? (Good for streaming/social)

3. **Friendly Fire**: Can player AoE abilities hit allies? (BG3 says yes — adds depth and comedy. FFT says yes. Metal Slug says no.)

4. **Undo Movement**: Can a player undo their movement before committing their action? (FFT allows this, BG3 does not, MST does not)

5. **Enemy Intent Display**: Show enemy intended targets/actions before their turn? (Into the Breach model — more strategic. MST chose NOT to — more chaotic. Recommend: show for normal enemies, hide for bosses.)

6. **Card Ability Friendly Targets**: Can healing/buff abilities target allies? (Recommend yes — enables support builds)

7. **Overworld Combat**: Should random encounters exist in the overworld, or keep combat dungeon-only? (Recommend dungeon-only for clean separation)

8. **Turn-Based Toggle**: Should players be able to toggle real-time combat in dungeons for easy floors? (BG3's voluntary turn-based mode, reversed — voluntary real-time for trivial encounters)

---

## 17. WHY THIS DESIGN WORKS FOR MMOLITE

### It leverages what already exists:
- 32x32 tile grid ✓ (no new rendering engine needed)
- 6 enemy archetypes with distinct behaviors ✓ (direct AI mapping)
- 80+ enemy types with abilities ✓ (already have damage/range/cooldown data)
- Card system with active abilities ✓ (cards become your tactical loadout)
- 8 races with distinct stat profiles ✓ (natural archetype differentiation)
- Co-op dungeon infrastructure ✓ (zone broadcasting, party system)
- Socket.IO real-time sync ✓ (add turn events to existing event system)

### It fills the market gap:
- No existing game combines gacha card system + tactical turn-based + 4-player co-op
- FFT and MST have no multiplayer. BG3 is 3D/expensive. Mewgenics is single-player.
- A pixel-art tactical co-op MMO with gacha-as-class is genuinely novel.

### It respects the player's time:
- Simultaneous turns prevent co-op waiting
- Exhaustion timer prevents fights from dragging
- Speed bonuses reward efficient play
- Real-time exploration between fights keeps pacing snappy
- Average encounter: 3-5 minutes. Boss: 8-12 minutes.

### It creates depth from simple rules:
- Move + Act + React = 3 resources (easy to learn)
- CT initiative = plan ahead (FFT's depth)
- Momentum Shield = movement is defense (MST's aggression)
- Sync Attacks = positioning is the puzzle (MST's combo system)
- Tile effects = environmental storytelling (BG3's chains)
- Card loadout = your build (gacha-as-class)
- Exhaustion = clock is ticking (Mewgenics' pressure)
- Wounds = every fight matters (Fear and Hunger's consequence)
- Stress = party morale is a resource (Darkest Dungeon's tension)
- Prosthetics = turn loss into power (unique to MMOLite)

Each rule is simple. Combined, they create emergent complexity that rewards mastery without overwhelming new players.

### It makes healers essential (MMO social incentive):
- Wound/injury system creates genuine demand for healer-specced players
- Healers aren't just HP batteries — they cure wounds, manage stress, treat infections
- A good healer lets you push 2x deeper into dungeons
- Natural party role differentiation without forced class systems

---

## 18. WOUNDS, INJURIES & PERMANENT CONSEQUENCES

### Reference Games Studied (Consequence Systems)
- **Mewgenics** — Status-determines-injury, disorders with dual upside/downside, Necrosis body part loss, 4-stage death
- **Fear and Hunger** — Limb-specific severing, fracture (permanent max HP reduction), infection spirals, mind/sanity, coin flip RNG
- **Darkest Dungeon** — Stress 0-200, afflictions with behavioral effects, diseases curable only in town, town vs dungeon healing split
- **Fallout 3-NV** — Crippled limbs with direct gameplay effects, fixable at doctors, stimpack economy

### Design Philosophy: "Every Scar Tells a Story"

Combat is dangerous. Injuries accumulate during a run. Healers (cards or specced players) can patch you up mid-run but only partially. Full recovery requires a town Cleric or a dedicated healer player. Prosthetics offer permanent stat trade-offs that become part of your identity. The goal is combat with *weight and consequence* — not punishing difficulty, but meaningful risk.

---

### 18.1 THE THREE DAMAGE LAYERS

**Layer 1: HP (Temporary — Heals Freely)**
- Standard health pool, recovers with potions, healing cards, camp rest
- This is your "shield" — losing HP is routine and expected

**Layer 2: WOUNDS (Run-Persistent — Requires Healer)**
- Gained from being downed, critical hits, traps, boss mechanics, and status effect thresholds
- Persist for the entire dungeon run
- **In-dungeon fixes**: Healer-specced player (Resolve 15+, healing cards), camp triage (partial), rare consumables
- **Town fixes**: Cleric NPC (costs coins), rest at inn (slow natural recovery over multiple real-time hours)
- Each wound has a mechanical effect that directly impacts combat

**Layer 3: SCARS (Permanent — Town Only or Prosthetic)**
- Gained from stacking 3+ wounds in the same body region, or from boss "finishing moves"
- Persist AFTER the dungeon run ends
- **Only fixable by**: Town Cleric (expensive), dedicated healer player with Legendary healing card, or replaced by a Prosthetic
- Scars that aren't fixed become part of your character — some players will collect them as badges of honor

---

### 18.2 BODY REGION SYSTEM

Six targetable regions, each with distinct wound effects:

```
BODY REGIONS:
  HEAD        — Vision, magic power, sanity
  TORSO       — Max HP, stamina, breathing
  LEFT ARM    — Shield use, dual-wield, casting secondary
  RIGHT ARM   — Primary weapon, main attack power
  LEFT LEG    — Movement speed, dodge, balance
  RIGHT LEG   — Movement speed, sprint, stability
```

Enemies don't target specific body parts normally — instead, the wound system uses the **cause** to determine the **location** (Mewgenics "status-determines-injury" model):

```
WOUND LOCATION RULES:
  Downed by MELEE attack    → 60% Torso, 20% Arms, 20% Legs
  Downed by RANGED attack   → 40% Torso, 30% Head, 30% Arms
  Downed by MAGIC attack    → 50% Head, 30% Torso, 20% random
  Downed by FIRE status     → 40% Arms, 30% Torso, 30% Legs (burns)
  Downed by POISON status   → 70% Torso, 30% random (organ damage)
  Downed by ICE/FROZEN      → 50% Legs, 30% Arms, 20% Torso (frostbite)
  Downed by LIGHTNING        → 40% Head, 30% Arms, 30% random (nerve damage)
  Downed by BLEED status    → Region of highest existing wound (compounds)
  Downed by FALL/TRAP       → 50% Legs, 30% Torso, 20% Head
  Boss FINISHING MOVE       → Specific to boss (scripted)
```

---

### 18.3 WOUND TABLE (24 Wounds — 4 Tiers per Region)

```
HEAD WOUNDS:
  Tier 1: Concussion        — -15% magic damage, -10% Acumen, vision blur (screen edge distortion)
  Tier 2: Fractured Skull   — Max HP -15%, -20% magic damage, periodic dizzy (skip 1 tick CT)
  Tier 3: Blinded Eye       — -30% ranged accuracy, -2 tile vision range, can't sync attack from >2 tiles
  Tier 4: Shattered Jaw     — Can't use consumables, -30% Presence → SCAR if not healed within 3 floors

TORSO WOUNDS:
  Tier 1: Cracked Ribs      — -10% max HP, 20% chance to self-stun 1 tick when hit
  Tier 2: Punctured Lung    — -1 MP/turn (labored breathing), -20% post-combat stamina
  Tier 3: Gut Wound         — Healing received -40%, food/potion effects halved
  Tier 4: Internal Bleeding — 1 HP/turn passive bleed (even outside combat), -15% max HP
                               → SCAR if not healed within 3 floors

LEFT ARM WOUNDS:
  Tier 1: Sprained Wrist    — Can't shield block, -20% secondary weapon damage
  Tier 2: Fractured Arm     — Can't dual-wield, -30% blocking effectiveness
  Tier 3: Dislocated Shoulder — -2 tile throw/cast range on secondary abilities
  Tier 4: Severed Hand (L)  — No two-handed weapons, no shield, -50% crafting speed
                               → SCAR if not healed within 3 floors

RIGHT ARM WOUNDS:
  Tier 1: Sprained Wrist    — -15% primary attack damage
  Tier 2: Fractured Arm     — -30% primary attack damage, -20% card ability damage
  Tier 3: Dislocated Shoulder — -2 tile melee range (heavy weapons), -25% damage
  Tier 4: Severed Hand (R)  — -50% primary attack damage, one-handed weapons only
                               → SCAR if not healed within 3 floors

LEFT LEG WOUNDS:
  Tier 1: Twisted Ankle     — -1 MP
  Tier 2: Fractured Knee    — -2 MP, can't dodge roll (reaction disabled)
  Tier 3: Hamstrung         — MP reduced to 1, -50% dodge chance, can't flee combat
  Tier 4: Crushed Leg       — MP = 0 (must be carried by ally or crawl 1 tile/turn)
                               → SCAR if not healed within 3 floors

RIGHT LEG WOUNDS:
  Tier 1: Twisted Ankle     — -1 MP
  Tier 2: Fractured Knee    — -2 MP, -30% Momentum Shield generation
  Tier 3: Hamstrung         — MP reduced to 1, can't trigger opportunity attacks
  Tier 4: Crushed Leg       — MP = 0 (same as left)
                               → SCAR if not healed within 3 floors
```

### Wound Severity Escalation

Wounds in the same region stack and escalate:

```
  1st wound in region: Tier 1 (Minor — e.g., Sprained Wrist)
  2nd wound in region: Tier 2 (Moderate — e.g., Fractured Arm)
  3rd wound in region: Tier 3 (Severe — e.g., Dislocated Shoulder)
  4th wound in region: Tier 4 (Critical — e.g., Severed Hand)
                        → Becomes a SCAR if not healed within 3 floors

Each new wound in a region REPLACES the old one (upgrades severity).
You don't have "Sprained Wrist" AND "Fractured Arm" — it becomes just "Fractured Arm."
```

---

### 18.4 SCAR SYSTEM (Permanent Consequences)

Scars form from:
1. Tier 4 wounds not healed within 3 dungeon floors
2. Boss finishing moves (scripted, specific per boss)
3. Stage 4 Death (all current wounds become scars)

```
SCARS (Permanent until fixed at town or replaced with prosthetic):

  Scarred Face        — -5 Presence permanently, +5 Resolve ("intimidating")
  Blind in One Eye    — -2 tile vision, -20% ranged, +10% melee (compensated)
  Missing Left Hand   — No shield, no two-hand, eligible for LEFT PROSTHETIC
  Missing Right Hand  — -50% attack, eligible for RIGHT PROSTHETIC
  Lame Leg            — -1 MP permanently, eligible for LEG PROSTHETIC
  Collapsed Lung      — -1 MP permanently, -15% stamina
  Brain Damage        — -3 Acumen permanently, +3 Might ("simple but strong")
  Nerve Damage        — -3 Finesse permanently, +3 Vigor ("tough but clumsy")
```

**Scar Removal Costs (Town Cleric):**
```
  Minor Scar:    500 coins + 2 mana crystals
  Major Scar:    2000 coins + 5 mana crystals + 1 gem cut
  Severed Limb:  5000 coins + 10 mana crystals + 3 gem cut (magical regrowth)
                 OR replaced with Prosthetic (see below)
```

---

### 18.5 PROSTHETICS SYSTEM — Turning Scars Into Power

Prosthetics are **crafted items** that replace a severed/destroyed body part. They don't restore the original — they give something DIFFERENT. Every prosthetic is a trade-off. Some players will deliberately seek out specific prosthetics for the stat profiles.

```
LEFT/RIGHT HAND PROSTHETICS:

  Iron Grip (Dwarf specialty)
    — Craft: 5 iron bar + 3 cogs + 2 gears
    — Effect: +20% grip strength (melee damage), can use two-hand weapons again
    — Trade-off: No fine manipulation (-30% lockpicking, -20% crafting)

  Clockwork Hand (Gnome specialty)
    — Craft: 3 clockwork core + 5 gears + 3 springs + 2 glass lens
    — Effect: +25% crafting speed, +15% engineering, built-in lock pick (+20% lockpicking)
    — Trade-off: -10% melee damage (lighter), maintenance required (oil every 10 floors)

  Shadow Claw (Goblin specialty)
    — Craft: 5 iron bar + 3 mana crystal + Fungal Forest boss drop
    — Effect: +30% stealth attack damage, built-in blade (always armed), +15% thievery
    — Trade-off: -20% Presence (terrifying), can't use shields

  Mana Conduit (Elf specialty)
    — Craft: 5 mana crystal + 3 gem cut + 2 glass + Crystal Cavern boss drop
    — Effect: +20% magic damage, +1 card ability range, channel spells through it
    — Trade-off: +2 lightning damage taken (conductive), -15% melee

LEG PROSTHETICS:

  Ironwood Peg (Basic)
    — Craft: 5 wood + 3 iron bar + 2 springs
    — Effect: Restores MP to base -1 (functional but slower)
    — Trade-off: Can't dodge roll, noisy (-20% stealth)

  Steamwork Leg (Gnome specialty)
    — Craft: 3 clockwork core + 5 gears + 5 springs + 3 iron bar
    — Effect: Restores full MP, +1 MP (powered stride), can JUMP 2 tiles (ignore terrain)
    — Trade-off: Fuel cost (1 coal/5 floors), loud (-30% stealth), vulnerable to EMP/lightning

  Spring Heel (Cat Folk specialty)
    — Craft: 5 springs + 3 iron bar + 2 mana crystal + Desert boss drop
    — Effect: Restores full MP, +2 dodge, can LEAP 3 tiles (once per combat)
    — Trade-off: -10% knockback resistance, fragile (breaks on Tier 3+ leg wound)

EYE PROSTHETICS (for Blind in One Eye scar):

  Gem Eye (Dwarf specialty)
    — Craft: 3 gem cut + 2 glass lens + 1 mana crystal
    — Effect: Restores vision range, see through 1 wall tile (tremor sense equivalent)
    — Trade-off: Glows faintly (-10% stealth in dark), dazzled in bright rooms (-10% accuracy)

  Void Eye (Lizard Folk ritual)
    — Craft: 5 mana crystal + 3 gem cut + rare Hollow Earth drop
    — Effect: Restores vision, sees invisible/stealthed enemies, +10% magic damage
    — Trade-off: -5 Resolve (sanity cost), periodic "visions" (screen distortion effect)

  Tinker's Monocle (Gnome specialty)
    — Craft: 3 glass lens + 2 clockwork core + 2 gears
    — Effect: Restores vision, +15% ranged accuracy, identifies enemy HP/weaknesses
    — Trade-off: Fragile (destroyed by Tier 2+ head wound, must rebuild)
```

**Design Principle**: Every prosthetic is a CHOICE, not just a fix. A Goblin with a Shadow Claw is a *better* assassin than they were with their original hand. Players will seek out specific injuries to install specific prosthetics.

---

### 18.6 STRESS & MENTAL WOUNDS

```
STRESS SYSTEM:
  Scale: 0-100 (not shown as number — conveyed through visual/audio cues on character portrait)

  Stress Sources:
    Ally goes down:              +15 to all party
    You go down:                 +25 on revival
    Ally dies (party wipe near): +30 to all party
    Boss phase transition:       +10
    Critical hit taken:          +5
    Trapped:                     +10
    Exhaustion timer active:     +3/turn
    In darkness (torch out):     +2/turn
    Using cursed cards:          +5 per use

  Stress Relief:
    Kill an enemy:               -3 (per player)
    Speed kill (turns 1-4):      -10
    Camp rest:                   -20
    Camp cooking (good food):    -15
    Shrine blessing:             -25
    "Calm Mind" card ability:    -20 (target ally)
    3+ allies alive:             -1/turn passive (safety in numbers)
```

### Stress Thresholds

```
  0-30:  COMPOSED  — No effect, calm portrait
  31-50: UNEASY   — Worried portrait, occasional mutter ("..."), -5% accuracy
  51-70: STRESSED  — Gritted teeth, shaky hands, -10% accuracy, -5% damage
  71-85: BREAKING  — Pale/sweating portrait, -15% accuracy, -10% damage
                     20% chance per turn to refuse an order (must pick different action)
  86-100: AFFLICTION — Character snaps. Gains one random AFFLICTION:
```

### Afflictions (Behavioral Debuffs)

```
  PARANOID — "They're plotting against me."
    — Refuses healing from allies (healer cards from others have no effect)
    — +20% damage (adrenaline), +15% dodge (hypervigilant)
    — 15% chance per turn to attack nearest unit (ally OR enemy)

  HOPELESS — "We're all going to die here."
    — -30% damage, -20% accuracy
    — 10% chance to skip turn entirely (slumps)
    — Allies near this character gain +5 stress/turn (demoralizing)

  MASOCHISTIC — "Pain is the only real thing."
    — Moves TOWARD enemies instead of away
    — +25% damage, but takes 5 self-damage per attack
    — Won't flee even at critical HP

  SELFISH — "I need to survive. Only me."
    — Won't use abilities on allies (no support)
    — Hoards items (can't share potions)
    — +10% dodge, +10% damage (self-preservation)

  IRRATIONAL — "The walls are breathing."
    — Random target selection (attacks random enemy/ally in range)
    — +20% magic damage (unhinged power)
    — 15% chance to use random card ability instead of chosen one
```

**Affliction Cure:**
- In-dungeon: "Restore Mind" legendary card, or camp rest (50% chance)
- Town: Inn rest (guaranteed), Cleric "Cleanse Spirit" service (200 coins)
- Affliction clears when stress drops below 30

---

### 18.7 EXPANDED STATUS EFFECTS (32 Total)

#### Elemental Statuses (12)

```
BURNING (Fire)
  3 dmg/turn, 3 turns. On down: Tier 1 arm/torso wound.
  Visual: Orange flicker, small flame particles

FROZEN (Ice)
  Skip 1 CT tick, -2 MP, 2 turns. If hit while frozen: SHATTER (2x damage).
  Visual: Blue tint, ice crystal overlay, cold breath puff

POISONED (Toxic)
  2 dmg/turn stacking (max 5), 5 turns. 3+ stacks on down = Gut Wound.
  Visual: Green droplets rising, sickly green tint

ELECTRIFIED (Lightning)
  5 burst dmg on apply, chains to adjacent wet/armored units. On down = Nerve Damage risk.
  Visual: White-blue sparks arcing across sprite

BLEEDING (Physical)
  1 dmg/turn, 6 turns, stacks to 3. Compounds existing wounds (same-region escalation).
  Visual: Red droplets falling, small blood pool

WET (Water)
  No direct damage. 2x lightning damage, instant freeze from ice, halves fire damage.
  Visual: Dripping animation, blue sheen

CORRODED (Acid)
  -2 armor/turn, 3 turns. At 0 armor: direct HP damage. On down = Torso wound.
  Visual: Bubbling green-yellow, armor flicker

CURSED (Shadow)
  Healing received -50%, +10% damage taken, 4 turns. On down = Brain Damage scar risk.
  Visual: Dark purple wisps, shadowy tendrils

RADIANT (Holy)
  Undead/shadow enemies: 3x damage. Living units: +2 HP regen/turn, 3 turns.
  Visual: Golden glow, light motes rising

PETRIFYING (Earth)
  -1 MP/turn, 3 turns. At 0 MP: PETRIFIED (skip 2 turns, immune to damage).
  Visual: Gray stone texture creeping up from feet

ENTANGLED (Nature)
  Can't move (0 MP), can still attack/cast. 2 turns. Break free with Might check.
  Visual: Green vines wrapping sprite

SILENCED (Arcane)
  Can't use card abilities (basic attack only). 2 turns.
  Visual: Blue X over mouth, sparkle muzzle
```

#### Physical Conditions (8)

```
STUNNED       — Skip next tick. Visual: Yellow stars circling head.
FEARED        — Must move away from source, can't attack source. 2 turns. Trembling sprite.
PRONE         — -50% dodge, enemies +30% accuracy vs you. 1 MP to stand. Sprite tilted.
BLINDED       — -50% accuracy, no sync attacks, -3 tile vision. 2 turns. Dark overlay.
WEAKENED      — -30% damage all attacks. 3 turns. Slouched sprite, gray tint.
EXPOSED       — +30% damage taken. 2 turns. Cracked shield icon, red outline.
SLOWED        — CT gain halved, -2 MP. 2 turns. Blue trailing afterimage.
TAUNTED       — Must target the taunter. 2 turns. Red arrow to taunter, angry icon.
```

#### Positive Statuses (8)

```
HASTE         — CT gain doubled, +2 MP. 3 turns. Blue speed lines, afterimage.
REGENERATING  — +3 HP/turn. 4 turns. Doesn't fix wounds. Green sparkles rising.
SHIELDED      — Absorbs next X damage. Until broken or 3 turns. Translucent blue dome.
FORTIFIED     — +5 armor, immune to knockback/prone. 3 turns. Stone border, wide stance.
INSPIRED      — +15% damage, +15% accuracy, immune to Hopeless. 3 turns. Golden glow.
INVISIBLE     — Can't be targeted. Breaks on attack. 3 turns max. 30% opacity shimmer.
BLESSED       — +20% healing received, next wound reduced 1 tier. 3 turns. White glow, halo.
FOCUSED       — Next card ability +50% damage/effect. Until used or 3 turns. Concentration rings.
```

### Elemental Interaction Matrix

```
ATTACKER →    Fire    Ice     Lightning  Poison   Water   Acid    Shadow   Holy
TARGET ↓
─────────────────────────────────────────────────────────────────────────────
WET           ×0.5    FREEZE  ×2+CHAIN   Normal  Extend  Normal  Normal  Normal
BURNING       Extend  CANCEL  Normal     SMOKE   CANCEL  Normal  ×1.5   ×0.5
FROZEN        CANCEL  Extend  SHATTER    Normal  CANCEL  Normal  Normal  ×1.5
POISONED      SMOKE   Normal  Normal     Extend  Normal  ×1.5   Normal  CLEANSE
CORRODED      Normal  Normal  ×1.5       Normal  WASH    Extend  Normal  ×1.5
OIL(tile)     EXPLODE Normal  EXPLODE    Normal  Normal  Normal  Normal  Normal
PETRIFIED     CRACK   Normal  CRACK      Normal  Normal  ×2.0   Normal  Normal
ENTANGLED     BURN    Normal  Normal     ×1.5    Normal  ×1.5   Normal  Normal

Legend: CANCEL = removes status, Extend = +duration, CHAIN = spreads to adjacent,
        SMOKE = smoke tile, FREEZE = instant frozen, SHATTER = 2x + remove,
        EXPLODE = 5x fire + burning area, CRACK = break petrify + 3x,
        WASH = removes acid, CLEANSE = removes poison, BURN = remove + fire tile
```

---

### 18.8 INFECTION SYSTEM

```
Source: Undead/fungal/sewer enemies, unhealed Tier 3+ wounds after 5 floors

Infection Stages (advances 1 stage per floor):
  Stage 1: FESTERING  — Wound icon turns green-yellow. Warning only. No effect.
  Stage 2: INFECTED   — -5% max HP, wound region +1 tier. Healing cost doubled.
  Stage 3: SPREADING  — -10% max HP, adjacent region gains Tier 1 wound. Fever (+5 stress/floor).
  Stage 4: SEPSIS     — -25% max HP, all stats -2. Must exit within 2 floors or die.

Treatment:
  In-dungeon: Herbs (2x herbs = cure Stage 1-2), "Purify" card (any stage), camp triage (Stage 1 only)
  Town: Cleric (200 coins Stage 1-2, 500 Stage 3, 1000 Stage 4)
  Prevention: Potion of Resistance (immune to infection for 5 floors)
```

---

### 18.9 DEATH & REVIVAL (4-Stage System)

```
Stage 1: DOWNED (0 HP)
  — Can't act, prone
  — 2 bleed damage/turn (death timer)
  — Ally revive: Action + adjacent = revive at 25% HP
  — Auto-revive if combat ends while downed (but gain wound from cause)
  — 5 turns before Stage 2

Stage 2: DYING (5 turns downed without revive)
  — Revive requires Action + adjacent + healing card/item
  — Revive at 10% HP, gain 2 wounds (source-determined)
  — +30 stress to entire party
  — 3 turns before Stage 3

Stage 3: DEATH'S DOOR (8 turns downed total)
  — Only revivable by Legendary healing card OR "Last Rites" camp action
  — Revive at 1 HP, gain Tier 4 wound (guaranteed scar candidate)
  — +50 stress to entire party
  — 2 turns before Stage 4

Stage 4: DEAD
  — Dead for THIS run. Body remains (party can loot their items/cards).
  — Dead player spectates.
  — After combat: respawn at floor entrance (lose all floor loot) or exit dungeon.
  — Town: Resurrect at Cleric (500 coins), revives with all scars, -50% coins as death tax.
  — All wounds become scars (no grace period).
  — Each equipped card: 5% chance of being DESTROYED on death.

  EXCEPTIONS:
    "Nine Lives" (Cat Folk legendary) — prevents Stage 4 once per run
    "Resurrect" (Godly card) — reverses death back to Stage 1
```

---

### 18.10 CAMP TRIAGE (Between Combats)

```
REST (Existing)
  — Restore 50% HP, -10 stress. No wound treatment.

TRIAGE (New — requires herbs)
  — Cost: 2 herbs
  — Reduce one wound by 1 tier (Tier 3→2, Tier 1→healed)
  — One triage per camp per player

SURGERY (New — requires healer + herbs + glass vial)
  — Cost: 3 herbs + 1 glass vial + healer player (Resolve 15+)
  — Fully heal one wound of any tier
  — Can treat infection (Stage 1-3)
  — One surgery per camp total (shared resource)

SPLINT (New — requires wood)
  — Cost: 2 wood
  — Suppress leg/arm wound effects for 3 floors (wound NOT healed, just stabilized)
  — Can't splint same wound twice

APPLY PROSTHETIC (New — requires crafted prosthetic)
  — Replace a Scar with matching prosthetic
  — Permanent until removed at town or destroyed by Tier 4 wound to same region
  — Can be done at camp or in town
```

---

### 18.11 THE HEALER ROLE IN CO-OP

This system creates genuine demand for healer-specced players:

```
HEALER BUILD:
  Required: Resolve 15+ (stat investment matters)
  Key Cards:
    "Mend Wounds" (Uncommon, Active)    — Heal HP + wound -1 tier. Range 2. CD 4.
    "Restore Mind" (Legendary, Active)  — Remove affliction, -30 stress. Range 3. CD once/combat.
    "Purify" (Rare, Active)             — Cure infection + cleanse 2 statuses. Range 2. CD 5.
    "Blessed Hands" (Rare, Passive)     — All healing +30%, wound treatment +1 tier.
    "Calm Mind" (Uncommon, Active)      — -20 stress to ally. Range 3. CD 3.
    "Triage" (Ultra Rare, Active)       — Heal ALL allies in 3-tile radius, 50% power. CD 6.
    "Sanctify" (Mythic, Active)         — 3x3 RADIANT tiles: +3 HP/turn, immune to
                                          undead/shadow statuses. 3 turns. CD once/combat.

HEALER GAMEPLAY LOOP:
  In combat: Balance healing and damage (healers CAN fight)
  Between combats: Treat wounds at camp, cure infections, manage party stress
  Value: A healer lets you push DEEPER (floor 30 vs floor 15 without healer)
  Social: Healers are WANTED for co-op parties (natural MMO social incentive)
```

---

### 18.12 CO-OP WOUND INTERACTIONS

```
CARRY:
  - Player with 0 MP (Crushed Leg) can be CARRIED by adjacent ally
  - Carrier: -2 MP, can't attack (both hands full)
  - Carried player: Can still use ranged attacks/card abilities
  - Tactical choice: carry the mage to safety vs leave them as stationary turret

FIELD MEDIC BONUS:
  - Party has a dedicated healer (3+ healing cards equipped):
    - All wound tier thresholds +1 (harder to escalate)
    - Camp triage heals +1 additional tier
    - Passive: -5 stress/floor (party confidence)

SHARED STRESS:
  - Stress events affect whole party (seeing ally downed, etc.)
  - Stress relief from kills also shared
  - Co-op provides natural stress resistance (-1/turn with 3+ allies)
  - An afflicted player's behavior affects EVERYONE (Hopeless spreads stress)

REVIVE CHAIN:
  - Player A revives Player B → B gets "Grateful" buff (+10% damage, 3 turns)
  - Same players revive each other 3+ times in a run → "Battle Bond"
    permanent +5% sync attack damage between those two players (persists after run)
```

---

### 18.13 BOSS FINISHING MOVES (Scripted Scars)

Each boss has a unique finishing move that inflicts a specific scar if it connects:

```
Iron Castellan (Stone Keep)
  "Executioner's Sweep" — Phase 3, targets lowest HP player
  If hit: "Scarred Face" scar (guaranteed, bypasses wound tiers)

Prismatic Queen (Crystal Cavern)
  "Prismatic Overload" — Phase 2, AoE on color-mismatch
  If hit: "Blind in One Eye" scar (light burned out retina)

Spore Mother (Fungal Forest)
  "Root Grasp" — Phase 3, targets players on non-safe tiles
  If caught: "Lame Leg" scar + Stage 2 Infection (immediate)

Hollow Emperor (Hollow Earth, deep floors)
  "Void Touch" — Phase 2, targets highest Acumen player
  If hit: "Brain Damage" scar (mind shattered by void)

Clockwork Colossus (Mechspire dungeon)
  "Crushing Grip" — Phase 1, targets player who broke shield wall
  If caught: "Missing Hand" scar (mechanically crushed, matching hand side)
```

These finishing moves are telegraphed (1 turn warning, specific tile markers) so they're avoidable. Getting hit is a player mistake, not RNG — making the scar feel earned and fair.
