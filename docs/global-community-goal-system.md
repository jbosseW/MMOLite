# The Rift Compact: Global Community Goal System
## MMOLite — Narrative & Systems Design Document

**Document Author:** Narrative Design
**Scope:** Server-wide community goal meta-layer, all shards
**Tech Stack:** Node.js + Socket.IO (server), LOVE 2D / Lua (client)
**Sits Alongside:** `rift-atmosphere-features.md`, `GDD-Detailed.md`
**Date:** February 2026

---

## Design Philosophy

The single most powerful thing an MMO can do is make a player feel that their session — even a brief one — mattered to something larger than themselves. Helldivers 2 proved this at scale: when the community collectively fails to hold a planet, the loss is felt. When the community succeeds against impossible odds, screenshots flood the internet within hours.

This system does not bolt a community event onto MMOLite. It grows out of what the world already is. The Rift is already a wound in the world. The races are already in uneasy political relationship with each other. The Adventure Guild already tracks what delvers accomplish. The bones are there. This document puts flesh on them.

**The core emotional arc every campaign cycle must deliver:**
1. **Week 1 — Discovery:** Something terrible is happening. Players encounter it organically.
2. **Week 2 — Mobilization:** The scale becomes clear. Every action feels like it matters.
3. **Week 3 — Crisis:** The deadline looms. Progress is uncertain. Players check the War Board daily.
4. **Week 4 — Resolution:** Either triumph or consequence. The world visibly changes.

A system that has no teeth — where failure is just "you miss a reward" — is not a community goal system. It is a checklist with a prize. This document designs teeth.

---

## Part I: The Narrative Framework

### I.1 — Why Is This Happening?

The Rift does not expand. This is canon. It was established centuries ago by the Second Compact — the treaty between all eight races that created the Adventure Guild as a containment authority. The Rift tears at the world, the Guild seals it floor by floor, the cycle continues.

**Until now.**

Three months ago (in-world time, zero months before campaign launch), something changed. The Rift began producing **Resonance Events** — moments when the boundary between the dungeon and the overworld thins catastrophically. A street in the Holy Dominion shimmered and showed a lava rift floor for four seconds before snapping back. A lake in the Elven South briefly drained into nothing and refilled with water from the Coral Grotto. A Dwarven mining tunnel in Ironhold broke through into a shadow realm antechamber that should not have been there.

The Adventure Guild calls these events **Bleeds**.

A Bleed is survivable. A cascade of Bleeds is not. Left unaddressed, Bleeds accelerate — each one weakens the boundary further, making the next one larger, until the distinction between the overworld and the Rift is no longer a distinction at all.

The races remember what the world looked like before the Second Compact. No one who is alive now remembers it directly. But the histories exist, and every scholar in every city knows the name for what is coming:

**The Confluence.**

The last time a Confluence occurred, it erased a civilization. The ruins of that civilization are what the dungeon themes called "Flooded Ruins" and "Void Debris" are built from.

This is why every player, in every city, from every race, is working together. Not because they like each other. Because the alternative is the end of the world they know.

### I.2 — The Rift Compact

Following the first confirmed Bleed, a diplomatic crisis erupted. The Holy Dominion wanted to seal the Rift entrance entirely. The Gnomish Collective wanted to study it. The Goblins of BoneTrap claimed they had been warning everyone about this for decades and that no one listened (they had been, and no one had). The Lizardfolk of Murkmire sent a delegation that spoke only to each other in Draconic for three days before issuing a one-sentence statement: *"This is the Third Passage. We have prepared."*

No one asked what they had prepared for.

The Adventure Guild — the one institution that commands respect across all eight racial territories because it is the one institution that has always existed between them — called an emergency session.

The result is the **Rift Compact**: a temporary multilateral agreement in which all eight racial governments contribute resources, personnel, and Guild authority to collective Rift suppression operations. Players are the operational arm of this Compact. The Guild tracks their contributions. The War Board displays their progress.

The Rift Compact replaces the old daily-seed structure as the **meta-narrative frame**. The daily delves are still happening. Now they mean something beyond leaderboard placement.

### I.3 — How This Connects to Every Existing System

| Existing System | How It Plugs Into the Compact |
|---|---|
| Rift dungeon clears | Each cleared floor is a "suppression" — the Guild registers it as Compact contribution |
| Overworld cave clears | "Bleed sealing" — overworld instability spreading from the Rift, contained by clearing caves |
| Enemy kills | Rift-origin creatures bleeding into the overworld; elimination stabilizes local Bleed index |
| Card fusion | Resonance cards — fused cards emit a trace of counter-resonance the Guild can harvest |
| Resources gathered | Guild supply drives — the Compact needs materials to build stabilizers |
| Guild membership | Guilds operate as Compact field units with their own contribution tracking |
| Crafting | Guild-issued blueprints for Compact infrastructure (stabilizer stations, resonance anchors) |
| Auction house | Compact resource procurement — the Guild buys specific materials at premium rates during crises |

No existing system is deprecated. Every one of them gains a narrative reason to matter more.

---

## Part II: Global Objective Types

Six types of Compact Operations, each drawing on different player activity metrics. A given campaign cycle (see Part IV) runs 2-3 operation types simultaneously, never all six at once.

---

### Operation Type 1: SUPPRESSION

**In-universe name:** Rift Suppression Operation
**What it tracks:** Total dungeon floors cleared, community-wide (Rift + overworld caves)
**Flavor metaphor:** Each cleared floor pushes the Rift's "tide" back by a measurable amount

**Sample goal as it appears on the War Board:**

> **SUPPRESSION OPERATION: THE SECOND DESCENT**
>
> *Category:* Rift Containment
> *Classification:* Compact Priority — URGENT
> *Deadline:* 14 days
>
> Guild analysis of Bleed frequency in the Elven South suggests an active Rift front has
> opened at depth equivalent to floors 40-60. The boundary is thinning from the inside.
>
> The Compact requires 50,000 combined floor clearances before the front reaches critical
> resonance. Each cleared floor anywhere in the world contributes. The Rift does not care
> about jurisdictional borders. Neither does the Compact.
>
> *Community Target:* 50,000 floors cleared
> *Current Progress:* 12,847 / 50,000
>
> "The front is real. We've been here before. We didn't hold it then.
>  We're going to hold it now." — Guildmaster Hana Voss, Holy Dominion Chapter

**Success condition:** 50,000 floors cleared before deadline
**Failure condition:** Timer expires with target unmet

**Success consequences:**
- The Bleed in the Elven South closes. A new dungeon wing (the "Elven Reliquary" theme cluster) becomes accessible for the following month as the stabilized rift zone can now be safely explored.
- All players receive a cosmetic: "Compact Seal — Second Descent" border for their character nameplate.
- Rift difficulty on floors 40-60 is reduced by 10% for two weeks (the suppression is holding — you can feel it).

**Failure consequences:**
- The Elven South Bleed worsens. A new overworld hazard appears in the Elven South biome: "Resonance Fissures" — certain tiles now deal minor damage until sealed by players through a follow-up mini-event.
- Floors 40-60 get a new "Bleed Surge" floor modifier for two weeks — enemy counts increase by 25%, but loot quality also increases (the chaos cuts both ways).
- A new story beat fires in the Rift antechamber — Guildmaster Voss is visibly shaken. Her dialogue changes. She doesn't tell you it's fine.

---

### Operation Type 2: THE HARVEST DRIVE

**In-universe name:** Compact Supply Operation
**What it tracks:** Community-wide resource gathering (specific resources change per cycle)
**Flavor metaphor:** The Guild is building a Resonance Anchor — a massive physical structure that pins the boundary in place. It needs materials.

**Sample goal as it appears on the War Board:**

> **SUPPLY OPERATION: ANCHOR POINT KRAGMOR**
>
> *Category:* Infrastructure
> *Classification:* Compact Priority — STANDARD
> *Deadline:* 7 days
>
> The Resonance Anchor scheduled for the Orcish Steppes requires a supply base
> the Orcish Khanate Confederation has agreed to host in Kragmor.
>
> The Compact's engineering corps requires:
> — Iron Ore: 200,000 units (current: 47,203)
> — Stone: 150,000 units (current: 88,941)
> — Clockwork Cores: 8,000 units (current: 1,209)
> — Mana Crystals: 5,000 units (current: 623)
>
> Deposit at any Guild Requisition Officer in any town.
> All contributing players receive Compact Requisition Stamps.
> Stamps are exchangeable at the Compact Store.
>
> "Ironhold won't say where their surplus went. Mechspire won't confirm their
>  shipment schedule. Kragmor is building something regardless. So are we."
>  — Requisition Officer Dav Morek, Adventure Guild

**Design notes:**
- Each resource type has an independent tracker — partial completion is visible and meaningful
- The Clockwork Cores and Mana Crystals are the friction points — high-skill resources that drive the upper end of the player base
- Common resources (Iron, Stone) give casual players immediate visible contribution
- The "Compact Store" is the reward vehicle — see Part III

**Success consequences:**
- The Resonance Anchor at Kragmor is visibly constructed — a new permanent map feature, a large glowing structure in the Orcish Steppes zone
- While the Anchor is "fully charged" (first two weeks post-success), all players in the Orcish Steppes and adjacent biomes get +15% XP bonus
- Compact Requisition Stamps from this operation can be spent on exclusive cosmetics and resource caches at the Compact Store
- An in-world NPC dialogue changes: Orcish Khanate NPCs in Kragmor now acknowledge the Compact. "I still don't trust the Dominion. But the anchor works."

**Failure consequences:**
- The Anchor is partially built — visible as a half-finished structure, which is its own form of storytelling
- Compact Store does not open for this cycle; Stamps carry over but accumulate no new ones
- The Orcish Steppes Bleed index ticks up — enemy spawn rates in that biome increase by 20% for two weeks
- A follow-up operation is automatically triggered at a lower difficulty (the Compact adjusts its expectations)

---

### Operation Type 3: THE GREAT HUNT

**In-universe name:** Compact Elimination Operation
**What it tracks:** Community-wide enemy kills — specifically Rift-origin creatures tagged as "Bleeds" (new enemy type that appears in overworld zones during high Bleed index)
**Flavor metaphor:** The Rift is leaking. Its creatures are crossing over. Hunt them before they establish footholds.

**Sample goal as it appears on the War Board:**

> **ELIMINATION OPERATION: CLEANSE THE SHADOWFEN**
>
> *Category:* Threat Suppression
> *Classification:* Compact Priority — URGENT
> *Deadline:* 10 days
>
> The Shadowfen has absorbed three Bleeds in the past week. Rift-origin entities
> have crossed over and are establishing nesting patterns in the deep swamp.
>
> Left unchecked, a nesting establishes a permanent Bleed anchor — a point the
> Rift can use as a re-entry foothold indefinitely, regardless of dungeon suppression.
>
> Compact Hunters are authorized to enter the Shadowfen and eliminate:
> — Bleed Crawlers: 40,000 (current: 11,204)
> — Bleed Wraiths: 15,000 (current: 2,107)
> — Bleed Anchors (elite): 500 (current: 47)
>
> Bleed enemies are marked on your radar when within 15 tiles.
> They drop Resonance Shards — bring them to any Guild chapter for Stamps.
>
> "They're not from here. They know they're not from here.
>  That's what makes them dangerous." — Ranger Kess, Compact Hunter Division

**Design notes:**
- Bleed enemies are a new enemy subtype that appear in overworld biomes during active operations — they use the existing enemy pool but with a "Bleed" prefix and a visual marker (glowing outline in void-purple)
- Bleed Anchors are elite enemies (existing Elite archetype) that require groups to kill, creating organic party formation incentive
- Resonance Shards are a currency that feeds directly into the Compact Store

**Success consequences:**
- The Shadowfen Bleed is sealed. A new cave dungeon entrance spawns in the Shadowfen — the "Bleed Scar Cave," using the Shadow Realm theme, available for one month
- Goblin players get a special interaction in BoneTrap: the local underground runners who monitored the Shadowfen Bleed have intel on the next operation (small XP bonus on next cycle's first session)
- A Shadowfen NPC (a hermit who watched the whole thing) has updated dialogue acknowledging what happened: "The swamp remembers. It always remembers."

**Failure consequences:**
- A Bleed Anchor establishes itself permanently in the Shadowfen — a new map feature that continuously spawns low-level Bleed enemies in that biome until a future cleanup operation
- The Shadowfen biome gets a persistent debuff: "Resonance Instability" — fog of war does not clear fully in this biome for one month
- Lizardfolk players who frequent Murkmire (adjacent to Shadowfen) find NPC dialogue has changed: "We told them. We told all of them. The swamp is not safe. It has not been safe since the Bleeds started."

---

### Operation Type 4: THE RESONANCE FORGE

**In-universe name:** Compact Resonance Contribution Operation
**What it tracks:** Community-wide card fusions
**Flavor metaphor:** When cards are fused, they emit a trace of "counter-resonance" — the energy signature that destabilizes the Rift. The Guild has built collection apparatus to harvest this. The more fusions, the more fuel the apparatus accumulates.

**This is the lore justification for why the gacha/fusion system matters at a world-scale level.**

**Sample goal as it appears on the War Board:**

> **RESONANCE OPERATION: THE FORGE DRIVE**
>
> *Category:* Arcane Infrastructure
> *Classification:* Compact Priority — STANDARD
> *Deadline:* 14 days
>
> The Grand Resonance Apparatus in Mechspire — the only structure capable of
> projecting a counter-resonance field across multiple Bleed sites simultaneously —
> requires 10,000 units of distilled counter-resonance to reach operational capacity.
>
> When cards are fused, the process releases trace counter-resonance. The Gnomish
> Collective has patented a collection method. For the duration of this operation,
> any card fusion anywhere in the world contributes to the Apparatus.
>
> Higher rarity fusions contribute more. A Mythic fusion counts for 50 standard fusions.
>
> *Community Target:* 10,000 counter-resonance units
> *Current Progress:* 2,847 / 10,000
>
> Rarity contribution weights:
>   Common → 1 unit
>   Uncommon → 2 units    Rare → 5 units
>   Ultra Rare → 15 units  Mythic → 50 units
>   Legendary → 150 units  Godly → 500 units  Relic → 2,000 units
>
> "The math is simple. Fuse cards. Save the world. Buy more packs." — Tinker Vaz,
> Gnomish Collective Engineering Corps (this sign was later taken down)

**Design notes:**
- This operation tactically promotes gacha spending without being crass about it — the lore frame makes it feel like genuine contribution, not a conversion funnel
- The rarity weights mean whales accelerate the meter but casuals still move it
- The in-world joke on the sign ("Buy more packs") was removed — but it was there, and players will find out about it

**Success consequences:**
- The Grand Resonance Apparatus activates. For two weeks, all Bleed indices across all biomes are reduced by 30% — this visibly changes the world (fewer Bleed enemies spawning everywhere)
- A new card type becomes available from the Compact Store: "Resonance Cards" — cards that have a special Void Edition variant exclusively available during active Apparatus periods
- Gnome players get a unique cosmetic title: "Apparatus Engineer" — the Collective acknowledges their racial contribution to making it work

**Failure consequences:**
- The Apparatus partially charges but does not reach operational capacity
- The Gnomish Collective issues a public statement that is technically diplomatic but reads as a pointed criticism of the other seven races' commitment (visible as a news ticker on the War Board)
- All Bleed indices increase by 10% for the following cycle — the window of opportunity was missed

---

### Operation Type 5: THE LONG MARCH

**In-universe name:** Compact Territory Recovery Operation
**What it tracks:** Overworld exploration — players discovering new chunks, entering new zones, and completing overworld cave dungeons in a specific target region
**Flavor metaphor:** The Rift's influence creates "Resonance Fog" — areas where the boundary is thin become genuinely dangerous to enter without Compact presence. Establishing boots on the ground stabilizes these areas.

**Sample goal as it appears on the War Board:**

> **TERRITORY OPERATION: RECLAIM THE FROSTBOUND REACH**
>
> *Category:* Territory Recovery
> *Classification:* Compact Priority — SEASONAL
> *Deadline:* 30 days
>
> The Frostbound Reach has absorbed eight Bleeds in the past month — more than any
> other region. Resonance Fog now covers 40% of the Reach. The Compact cannot
> suppress what it cannot reach.
>
> Compact Explorers are authorized to enter the Frostbound Reach and establish
> a presence in its uncharted territories. Every new zone entered, every cave
> cleared, every Bleed Anchor destroyed contributes to Territory Coverage.
>
> Target: Achieve 60% Territory Coverage of the Frostbound Reach
> Current Coverage: 22%
>
> Territory Coverage is calculated from unique players who have entered each
> sub-zone at least once. It is a measure of presence, not destruction.
>
> Additional objective: Locate and recover the Compact Survey Team — 7 Guild
> members sent to the Reach three weeks ago. No communication received.
>
> "Seven Guild members went to the Reach. We're asking thousands to follow.
>  That math used to bother me. It stopped bothering me when I understood
>  what happens if we don't go." — Guildmaster Hana Voss

**Design notes:**
- This operation incentivizes exploration of underutilized biomes without forcing players there
- The "Survey Team" is a narrative hook — players who reach deep into the Reach encounter the camp of the missing Guild members (a scripted lore object sequence)
- Territory Coverage is a metric that naturally distributes across player skill levels — any player can enter a zone, even if they can't fight there long
- 30-day window makes this a seasonal objective, not a weekly sprint

**Success consequences:**
- The Frostbound Reach is "stabilized" — a new Anchor is built there, overworld Bleed spawns cease
- The missing Survey Team is "found" — their journals are published as in-game lore objects, available to read from the War Board history section
- New permanent cave dungeon entrances open in the Reach (using Frozen Depths and Bone Yard themes)
- Players who contributed to Territory Coverage in the Reach receive a Frostbound Reach map cosmetic item

**Failure consequences:**
- 60% of the Frostbound Reach becomes a "Resonance Dead Zone" — players who enter without the right equipment take passive damage (the Resonance Fog mechanic, a new persistent environmental hazard)
- The Survey Team is presumed lost. A memorial entry appears on the Guild's Record Wall: "Seven names. The Reach keeps them."
- A new story thread opens: who sent the Survey Team into known danger? Was it incompetence or something else?

---

### Operation Type 6: THE COUNCIL TRIAL

**In-universe name:** Compact Unified Strike Operation
**What it tracks:** A specific boss kill count — a named Rift boss must be defeated a certain number of times across the community
**Flavor metaphor:** The Rift has learned to stabilize certain boss entities at specific floors. These entities function as "Rift Anchors from above" — the Rift keeps regenerating them because their presence reinforces the boundary from its side. The Compact's tactical analysts call this "the boss is doing the Rift's work for it." The solution is termination. Repeated termination.

**Sample goal as it appears on the War Board:**

> **UNIFIED STRIKE OPERATION: EXECUTE THE CASTELLAN**
>
> *Category:* High-Value Elimination
> *Classification:* Compact Priority — CRITICAL
> *Deadline:* 7 days
>
> Guild analysis has identified the Iron Castellan — resident boss of floor 10 —
> as an active Rift Anchor. Each time he regenerates (which the Rift does daily,
> with the seed), he reinforces the boundary from within. The structure of his
> curse has become load-bearing architecture.
>
> The Compact requires The Iron Castellan to be defeated 2,000 times before
> the current seed's resonance window closes. After 2,000 defeats, his anchor
> contribution drops below the threshold at which it matters.
>
> Yes. He will come back tomorrow. This is about the window, not the outcome.
>
> *Current Castellan Defeats:* 847 / 2,000
>
> Every defeating party receives standard boss loot plus a "Compact Strike Token."
> Ten Tokens redeem for a guaranteed Rare card pack at the Compact Store.
>
> "I've killed him eleven times this week. Every time I open his armor,
>  there's less of him in there. I don't know if that's progress or just
>  the Rift running out of whatever it's been using to fill him."
>  — Delver Orin Farr, Adventure Guild Bronze Rank

**Design notes:**
- This operation creates a specific, actionable goal that can unite the player base around a single target
- The explanation for why killing him repeatedly matters is lore-complete and internally consistent with established canon (the Rift uses bosses as anchors)
- The philosophical undertone — he comes back tomorrow regardless — is left in deliberately. The Compact Strike Token rewards acknowledge the futility without pretending it isn't worth doing.
- The anonymous delver's quote on the board is a player-submitted quote (from the previous cycle's community). The dev picks the best one each cycle.

**Success consequences:**
- The Castellan's resonance anchor signature collapses for the following two weeks — floor 10 gets a new boss: "The Castellan's Shadow," a version of the fight with new mechanics, representing the Rift having to improvise a replacement
- Card drop rates from floor 10 increase by 15% for two weeks
- A permanent entry is added to the Guild Archive: "The Second Compact's record of the Unified Strike against the Iron Castellan — [date]. 2,000 documented kills. The anchor held for 11 days before the Rift rebuilt it."

**Failure consequences:**
- The Castellan's resonance anchor pulses — a new floor modifier appears on floors 9 and 10 for the following two weeks: "Anchor Resonance" — the Castellan has increased HP and his counter-strike damage is doubled
- A new atmospheric event fires on floor 10 specifically: *"The armor knows you've been here before. It does not feel threatened."*

---

## Part III: The Consequence System

### III.1 — The Bleed Index

The spine of the consequence system is a single, visible number called the **Bleed Index**.

The Bleed Index for each major region is displayed on the War Board. It runs from 0 (stable) to 100 (cascade imminent). Every failed operation increases the relevant region's Bleed Index by a set amount. Every successful operation decreases it.

The Bleed Index is not hidden from players. It is the most prominent number on the War Board.

| Bleed Index | Status | Overworld Effect | Dungeon Effect |
|---|---|---|---|
| 0-20 | Stable | Normal | Normal |
| 21-40 | Unstable | Minor Bleed enemy spawns in region | +10% floor modifier weight |
| 41-60 | Active Bleed | Moderate spawns, visual distortion effect on tiles | +20% enemy count on floors |
| 61-80 | Surge | Heavy spawns, Resonance Fog patches appear | +35% enemy count, Blood Moon more frequent |
| 81-99 | Critical | Resonance Dead Zones (passive damage areas), NPC dialogue reflects crisis | +50% enemy count, new hostile floor modifier |
| 100 | CONFLUENCE EVENT | Full server-wide event fires — see III.3 | Rift floors are replaced by Confluence floors (see III.3) |

The Bleed Index gives players a metric they can understand and track. When they see it at 78 for the Holy Dominion, they know things are bad. When they succeed at a Suppression Operation and watch it drop to 54, they feel the needle move.

### III.2 — The Compact Store

All Compact operations generate currency: **Compact Stamps** (standard) and **Resonance Shards** (from Bleed enemy kills).

The Compact Store is an NPC available in every town — a Guild representative running an operation-specific supply table. The Store is only open when an operation is active or recently concluded. It closes between cycles.

**Compact Store inventory (rotates each cycle, sample):**

| Item | Cost | Description |
|---|---|---|
| Compact Card Pack | 50 Stamps | 5-card pack with guaranteed Uncommon minimum, increased Rare chance |
| Resonance Card Pack | 200 Stamps | 5-card pack with increased chance of Void Edition cards |
| Compact Cosmetic — Nameplate Border | 100 Stamps | Operation-specific nameplate decoration |
| Compact Cosmetic — Character Tint | 150 Stamps | Operation-specific character color overlay |
| Resource Cache (Small) | 30 Stamps | Random selection of gathered resources |
| Resource Cache (Large) | 80 Stamps | Larger resource cache, includes rare materials |
| Bleed Tracker (consumable) | 20 Shards | Highlights Bleed enemies on local radar for 2 hours |
| Resonance Blade (temp card) | 500 Shards | Temporary combat card valid for one week, deals bonus damage to Bleed enemies |
| Compact Archive Entry | 25 Stamps | Unlocks a lore document from the operation's story in the player's Codex |

**Design principle:** The Store must have something for everyone. Casuals who contributed modestly can still buy the Archive Entry and the Nameplate Border. Dedicated contributors who farmed Stamps can reach the card packs. Hunters who killed Bleed elites all week can reach the Resonance Blade. No player should finish a cycle with nothing to show for participation.

### III.3 — The Confluence Event

If the Bleed Index for any region reaches 100 — a scenario that requires multiple consecutive operation failures — a **Confluence Event** fires.

This is not a punishment. It is a story.

A Confluence Event is a server-wide limited-time crisis that overrides the normal operation cycle. It lasts 72 hours. It is the hardest content in the game and the most narratively significant.

**How a Confluence fires:**

The War Board displays a warning 48 hours before the Index reaches 100. This is visible to all players. It cannot be triggered without prior warning — it is never a surprise, only an inevitability the community either prevents or faces.

When it fires:

1. A server-wide message broadcasts to all players: *"CONFLUENCE EVENT — [Region] has crossed the threshold. The Rift and the overworld are converging. Report to your nearest Guild chapter for Compact Emergency Protocol."*

2. The affected region's biome tiles visually change — the color palette shifts to incorporate void-purple distortion tiles interspersed with normal tiles. Players see the world breaking.

3. The Rift, for 72 hours, runs Confluence floors — a new floor type that mixes the dungeon's existing themes with the overworld biome. A Confluence floor in the Holy Dominion might look like a lava rift that has the cathedral architecture of the Dominion growing through it — a visual collision of two worlds.

4. New enemies appear: **Confluence Entities** — the Rift's creatures merged with overworld fauna. A Confluence Hound looks like a dog that is also a shadow. A Confluence Knight looks like a fallen knight with a crystal cavern embedded in its chest.

5. A 72-hour community goal fires: defeat a specific Confluence boss that spawns in the affected region's overworld. The boss is unique — it only exists during Confluence Events. Its name is specific to the region: *The Dominion Collapse*, *The Reach Unraveling*, *The Murkmire Submergence*.

**Confluence success:** The region is stabilized. Its Bleed Index resets to 30. Players who participated in the Confluence Event receive a "Confluence Witness" title — a permanent mark that they were present for this event. The world recovers but it remembers — NPC dialogue references the Confluence as a historical event afterward.

**Confluence failure (the 72 hours pass without defeating the boss):** The region enters "Resonance Occupation" — a persistent state that lasts until a future Recovery Operation succeeds. During Resonance Occupation, the biome is partially Rift-overlaid: enemies are harder, Resonance Dead Zones are everywhere, but loot quality is dramatically elevated. The world is broken in that region. Playing in it is harder and more rewarding. This state is narratively framed as the Compact having "lost a front" — not permanently, but for now.

---

## Part IV: Cadence and Pacing

### IV.1 — The Four-Week Campaign Cycle

Each campaign cycle runs exactly four weeks. Two to three operations run simultaneously, each at different deadlines within the cycle.

**Week-by-week structure:**

**Week 1 — The Announcement**
- Monday: New cycle begins. War Board updates. Guildmaster Voss broadcasts a brief narrative statement (a few sentences of in-world context about what changed, why these operations matter now).
- The first operation is announced: a 7-day Standard priority operation. Accessible, visible, gets the community engaged quickly.
- Second operation announced: a 14-day operation that asks more of players.

**Week 2 — The Grind**
- The 7-day operation concludes. Success/failure narrative fires. World state changes if applicable.
- A new 7-day operation begins (or the follow-up if the first failed).
- The 14-day operation is at its midpoint. The War Board shows whether the community is on pace.

**Week 3 — The Crisis**
- The 14-day operation is in its final week. Progress visibility is highest here — the "days remaining" display on the War Board becomes more prominent.
- If the community is behind pace, a "Compact Emergency Alert" fires: a server-wide message stating the operation's current shortfall and what it will mean if the deadline passes.
- A new 7-day operation (often a Great Hunt or Council Trial — high-urgency types) fires concurrently.

**Week 4 — The Resolution**
- All operations conclude.
- Narrative resolution fires for every outcome — success OR failure.
- The Bleed Index updates visibly across all regions.
- If the Bleed Index is high enough for a Confluence to be imminent, the 48-hour warning fires at the end of Week 4, carrying into the next cycle's start.
- The Compact Store is fully open for 48 hours post-cycle (conclusion window) before the next cycle begins.

**Between cycles (48 hours):**
- The Compact Store is open for redemption.
- No new operations active.
- The War Board shows the cycle's results: "Cycle 4 Results — 2 of 3 operations succeeded. Bleed Index: -15 overall. The Dominion holds. The Reach does not."
- This is a narrative breathing room. Players reflect on what happened. They plan for next cycle.

### IV.2 — Seasonal Arcs

Four campaign cycles form one **Seasonal Arc** — a 16-week narrative arc with a thematic through-line.

**Example Seasonal Arc: "The Fracture Season"**

*Cycle 1:* The first Bleeds appear. Players encounter the system for the first time. Operations are at lower difficulty (the Compact is still assessing the threat). Narrative frame: the Guild is urgent but cautiously optimistic.

*Cycle 2:* The Bleeds accelerate in one specific region. The Council Trial target is revealed to be a boss that was, until now, accessible only at deep floors — but has been pulled toward the surface by Rift resonance. Narrative frame: the scope is becoming clear. The Guild's tone shifts.

*Cycle 3:* A Confluence Event fires if the community hasn't held the Bleed Index below 60 in the targeted region. Even if no Confluence fires, the operations this cycle are the hardest of the arc. Narrative frame: crisis. Multiple factions have competing ideas about how to respond. The Goblin delegation says they told everyone this would happen. They're right.

*Cycle 4 (Season Finale):* A special operation type that has not appeared before — a 28-day Long March into the most-blighted region. The community either reclaims it and ends the arc on a hopeful note, or fails and ends on a somber one. Either way, a definitive narrative resolution fires. Guildmaster Voss gives a long statement. The world state changes in a lasting way. A new Seasonal Arc title is added to the game's history, accessible from the War Board's Archive section.

**Between seasons (one full week):**
- No operations active
- Full Compact Store access
- Seasonal Arc summary published to the War Board Archive
- Bleed Indices partially reset (the world never fully recovers, but breathing room is given)
- Preview of the next Seasonal Arc's theme appears at the end of the week

### IV.3 — Preventing Burnout

**Design rules:**

1. **Operations never require daily play.** A player who logs in three times a week can meaningfully contribute to any Standard operation. The Urgent operations require more — but "more" means more sessions per week, not more hours per session.

2. **Contribution is cumulative and never wiped.** If a player misses Week 1 of a cycle, their Week 2 contributions still matter. The meter does not reset on schedule.

3. **The Compact Store caches Stamps.** Stamps earned in previous cycles do not expire for 60 days. A player returning from a break can spend their old Stamps immediately.

4. **Failed operations do not erase player progress.** A player who contributed 5,000 Iron Ore to a failed Harvest Drive still contributed 5,000 Iron Ore. They do not receive the success reward, but their individual contribution score is recorded and affects their personal tier (see Part V).

5. **The narrative frame honors failure.** When an operation fails, the in-world response treats it as a real setback — not a punishment. The Guild didn't fail because players were lazy. The Compact underestimated the Rift. The next operation starts from that position, not from shame.

---

## Part V: Contribution Tracking

### V.1 — Individual Contribution Score

Every player has a personal Contribution Score for each active operation. It is tracked separately from community progress.

Contribution Score is calculated from:
- Volume of contribution (floors cleared, resources deposited, enemies killed, fusions performed)
- Relative contribution percentile at the time of operation conclusion (where does your total rank?)
- Bonus for early contribution (contributing in Week 1 of a 14-day operation gets a 1.2x multiplier — the Compact rewards those who move first)

At operation conclusion, each player is assigned a **Contribution Tier** for that operation:

| Tier | Threshold | Reward | Badge |
|---|---|---|---|
| Observer | 1-10th percentile | 5 Stamps | No badge |
| Enlisted | 11-40th percentile | 20 Stamps | Bronze circle indicator on nameplate |
| Operative | 41-70th percentile | 50 Stamps | Silver circle indicator |
| Vanguard | 71-90th percentile | 100 Stamps | Gold circle indicator |
| Compact Elite | 91-99th percentile | 200 Stamps + exclusive cosmetic | Gold + glow indicator |
| Singular | Top 10 overall | 500 Stamps + unique cosmetic + archive entry | Named in operation archive |

**Critical design note:** Tiers are awarded in percentiles, not raw numbers. A casual player who contributes what they can will always be able to reach Operative tier if they play consistently. Whales and dedicated grinders reach Vanguard and Elite — but Operative is always within reach for a player who shows up. This prevents the tier system from becoming a whale-only vanity parade.

### V.2 — The Singular Recognition

The top 10 contributors per operation (by absolute contribution score) receive the "Singular" tier. Their names are added to the War Board as "Compact Operatives of Record — [Operation Name]." This entry is permanent — it goes into the archive and can be read by anyone who visits the War Board afterward.

The Singular cosmetic is operation-specific and cannot be obtained any other way. It is not tradeable. It is a certificate of presence, not a power advantage.

This is how you make dedicated players feel genuinely heroic without making casual players feel worthless.

### V.3 — Guild Contribution Tracking

Guilds have a collective Contribution Score equal to the sum of their members' individual scores, divided by guild size (preventing large guilds from simply outweighing smaller ones by volume). Guilds are ranked on a secondary leaderboard: the **Compact Guild Rankings**.

The top-ranked guild at the end of each cycle earns the "Compact Vanguard" title for all members, displayed next to their guild tag. This title rotates — it is held until the next cycle concludes.

Additionally, a guild that achieves the top rank in every operation of a four-cycle Seasonal Arc earns the **Arc Architects** title — a permanent guild achievement displayed in their guild profile.

**Guild vault integration:** A guild can designate a portion of their vault resources as "Compact Committed" — resources that automatically count toward active Harvest Drive operations without requiring individual members to manually deposit them. This is a quality-of-life feature that also creates a strategic dimension: does the guild pool resources for the community goal, or retain them for personal use?

### V.4 — The Contribution Journal

Each player has a personal **Contribution Journal** accessible from the War Board interface — a record of every operation they have participated in, their tier, and a brief narrative flavor line specific to the operation.

The Journal is written in the voice of the Guild's administrative record:

> *Cycle 4, Operation: Cleanse the Shadowfen*
> *Contribution Tier: Vanguard*
> *Recorded contribution: 847 Bleed Crawlers eliminated, 203 Bleed Wraiths, 12 Bleed Anchors*
>
> *"Operative [PlayerName] ([Race]) deployed to the Shadowfen on day 2 of the operation.
>  Sustained engagement for 9 of 10 operation days. No absences recorded.
>  Contribution placed in top 22% of all participating operatives.
>  Designation: Vanguard."*
>
> *— Guild Registrar, Holy Dominion Chapter*

The journal makes every player's personal history visible to them and reinforces the sense that they are a named entity in a real institutional record, not an anonymous number on a progress bar.

---

## Part VI: Communication Systems

### VI.1 — The War Board

The War Board is a physical object in the world — a large bulletin board structure placed in the entrance of every Guild chapter in every major town. It is also accessible via a keybind (default: `G`) from anywhere in the world, opening a UI panel.

The War Board has five sections:

**ACTIVE OPERATIONS** (top, most prominent)
Each active operation displays as a card with:
- Operation name and type
- A two-to-three sentence narrative description (in-universe voice)
- Progress bar (community total / target)
- Time remaining (large, impossible to miss)
- Personal contribution this cycle (your number, below the community bar)
- A single quote from a Guild NPC or named delver at the bottom

**BLEED INDEX** (side panel)
A region map showing all major areas with their current Bleed Index. Color-coded from green (0-20) to dark red (81-100). Each region can be clicked for a brief narrative status note from the Guild's intelligence division.

**COMPACT STORE** (tab)
The store, accessible when open. Displays all items with Stamp/Shard costs. Shows the player's current Stamp and Shard balance.

**CYCLE HISTORY** (tab)
Previous cycles and their outcomes. Presented as brief in-world after-action reports. The player's own contribution in each past operation is highlighted.

**CONTRIBUTION JOURNAL** (tab)
Personal record — see V.4.

### VI.2 — Herald NPCs

Each town has a **Compact Herald** — a new NPC type (rendered as a gold-bordered circle, distinct from other NPCs) stationed near the town entrance. The Herald has three lines of rotating dialogue that update with each operation:

**Cycle start dialogue:**
*"The Compact has issued new orders. The Bleed in [region] is getting worse. Find the War Board for full details."*

**Midpoint dialogue (if community is behind pace):**
*"We're not going to make it at this rate. Get into the [relevant activity]. The deadline is [X] days."*

**Midpoint dialogue (if community is on pace):**
*"The meters are moving. Keep at it. We're close enough to matter."*

**Post-operation dialogue (success):**
*"[Region] is stable. The Guild's registering the outcome. Check the Store — it's open."*

**Post-operation dialogue (failure):**
*"The [operation name] fell short. The Bleed Index in [region] has risen. The next operation begins soon. Rest while you can."*

The Herald is the game's equivalent of a news anchor. Their dialogue is the first thing a returning player sees when they log in and walk into town. It calibrates their sense of the world's state in seconds.

### VI.3 — In-World Notifications

When a major event occurs, a brief notification appears in the bottom-right of the client UI — the same area used for standard system messages, but in a distinct gold/amber color to differentiate Compact events:

| Event | Notification Text |
|---|---|
| Operation completes (success) | **[COMPACT]** Operation "[Name]" succeeded. World state updated. |
| Operation completes (failure) | **[COMPACT]** Operation "[Name]" failed. Bleed Index rising in [region]. |
| New operation begins | **[COMPACT]** New operation: "[Name]" — see War Board for details. |
| Confluence warning fires | **[COMPACT — CRITICAL]** Bleed Index in [region] approaching Confluence. 48 hours. |
| Confluence begins | **[COMPACT — CRITICAL]** CONFLUENCE EVENT ACTIVE. [Region] is converging. |
| Singular tier awarded | **[COMPACT]** You are recorded as a Compact Operative of Record for "[Operation]." |

None of these notifications interrupt gameplay. They appear, hold for 5 seconds, and fade. A player who wants to know more opens the War Board. A player who is in the middle of a dungeon floor sees the notification and knows something changed.

### VI.4 — The Broadcast Moment

When a Suppression or Council Trial operation tips over its success threshold — when the community meter hits 100% — a server-wide broadcast fires to every active player simultaneously.

This is the only message in the entire game that appears in the center of the screen rather than the notification corner, in a large font, for 4 seconds:

> **OPERATION "[NAME]" COMPLETE.**
> **[X,XXX] OPERATIVES. [Y DAYS] OF WORK.**
> **THE RIFT RETREATS.**

Then it fades, and the world state changes quietly in the background.

This moment exists for one reason: players who are in the middle of something completely unrelated to the operation — fishing in the Elven South, running a trade route, sitting in their guild chat — need to feel it. The broadcast is the equivalent of cheering you can hear from the next street over. You don't know exactly what happened. You know that something did, and that it was good.

---

## Part VII: Sample Campaign — "Season One: The Fracture Season"

*A full narrative outline of the first Seasonal Arc, as a reference for implementation and tone.*

### Season Setting

The first Seasonal Arc begins four months after the first confirmed Bleed. The races have signed the Rift Compact but are still suspicious of each other. The Holy Dominion Chapter of the Adventure Guild is hosting the Compact's operational coordination because they have the most Guild infrastructure — a fact that the other races have opinions about.

Guildmaster Hana Voss is the NPC face of the Compact. She is human. She is aware of the irony. Her dialogue thread across the four cycles is the season's emotional backbone.

### Cycle 1: "The First Numbers"

**Operations:**
1. Suppression Operation (14 days): "The Southern Front" — 30,000 floors needed in the Elven South region
2. Harvest Drive (7 days): "Foundation Materials" — iron and stone for the first Resonance Anchor prototype

**Voss's opening statement** (posted on War Board at cycle start):
*"We have numbers now. That's the first thing. For three months we've been working from estimates, from old Compact models, from guesswork with confident voices attached. Now we have numbers. The Bleed frequency in the Elven South is up 340% over six months. I wanted to tell you all of this in person, but there's no in person large enough. So: the War Board. Read it. The numbers are real."*

**Cycle 1 outcome (regardless of player success/failure):** The Anchor prototype is built in a small form in the Elven South. It works. It's not big enough to matter yet. But it works. This is the hope note at the end of Cycle 1.

### Cycle 2: "The Kragmor Question"

**Operations:**
1. Harvest Drive (14 days): "Anchor Point Kragmor" — full materials for a real Anchor in Orcish territory
2. Great Hunt (7 days): "Clear the Steppes" — Bleed entities in the Orcish Steppes biome

**New narrative element:** The Orcish Khanate's cooperation with the Compact is conditional. A faction within the Khanate does not want a permanent Compact structure on their land, even if it helps. The Herald NPCs in Kragmor have tense dialogue. The War Board's regional status for the Steppes reads: *"Cooperation: Provisional. The Khanate has agreed in principle. The details remain."*

**Voss's mid-cycle statement** (fires at 50% mark, regardless of progress):
*"I've been asked why the Anchor has to be in Kragmor. There are other sites. I'll tell you the same thing I told the Dominion council: Kragmor is where the Bleed is most active. The Anchor goes where it's needed, not where it's convenient. If that answer isn't satisfying, I understand. Satisfying isn't what we're going for right now. Effective is."*

**Cycle 2 success:** The Kragmor Anchor is built. The Orcish Khanate NPC dialogue shifts — skeptical acceptance. The Anchor is a map feature. It glows. It's there.

**Cycle 2 failure:** The Harvest Drive comes up short. The Anchor is delayed. The Great Hunt's Bleed Index consequence fires. The Steppes deteriorate. Voss's failure statement: *"We asked Kragmor to host something we couldn't finish. I'll be speaking with the Khanate leadership tomorrow. I don't know yet what I'll say."*

### Cycle 3: "The Goblin Testimony"

**Operations:**
1. Long March (28 days): "Into the Shadowfen" — Territory Coverage for the Shadowfen region
2. Council Trial (7 days): "Execute the Spore Mother" — the Fungal Forest boss has been identified as a Rift Anchor

**New narrative element:** The BoneTrap Goblin delegation finally delivers the testimony they've been holding for three months. They have records of Bleed-adjacent phenomena going back nine years. They knew something was wrong before anyone else did. Their testimony is posted as a lore object on the War Board — players can read the full document. It's long. It's detailed. It's credible.

The Goblin testimony creates a political crisis that the Compact has to navigate: if the Goblins knew, why didn't anyone listen? Who was told and chose not to act? This thread is not resolved in Cycle 3. It carries into Cycle 4.

**Herald NPC in BoneTrap** (new dialogue after testimony publication):
*"Nine years. We've been filing reports for nine years. You're welcome, by the way. The War Board has the files now. Go read them if you want to understand what's coming."*

### Cycle 4: "Season Finale — The Reckoning"

**Operations:**
1. Suppression Operation (28 days, season finale): "Hold the Line Everywhere" — 150,000 floors needed across all regions simultaneously
2. Special Council Trial (14 days): "End the Dominion Bleed" — 3,000 kills of the Iron Castellan while the Dominion's Bleed Index is at critical (the operation only fires if the Dominion is at 61+ Bleed Index — a consequence-dependent operation)

**Voss's final cycle statement** (fires at cycle start):
*"I have the Goblin testimony on my desk. I've had it for two weeks. I'm going to tell you what I told the Compact Council when they asked me how I felt about it: I feel like we have work to do, and feelings are for after. If we hold the line this cycle — all of it — then we have time to have the conversation about how we got here. If we don't, the conversation won't matter. Season's end. Go."*

**Season finale outcomes:**

**If the community holds:** The Bleed Index across all regions falls below 40. A server-wide Confluence is averted. The season ends with Voss's final statement: *"We held. The numbers say so. I'm going to have the conversation with the Goblin delegation tomorrow. About nine years of filed reports. About what comes next. I'll tell you what they say."* — A new Seasonal Arc begins with that thread as its foundation.

**If the community fails to hold:** A Confluence Event fires in the most-blighted region. The 72-hour crisis engagement occurs. If the community defeats the Confluence boss, the season ends with acknowledged loss and hard-won partial victory. If the boss is not defeated, the season ends with Resonance Occupation of that region — and Voss's final statement: *"We didn't hold. I want to be honest about what that means before I say anything else. We held in places. We failed in places. The Rift knows which is which. So do I."*

---

## Part VIII: Technical Implementation Notes

These notes are design-facing, not engineering specs. Full implementation specs belong in a separate technical document.

### Server-Side Requirements

**New state objects needed:**
```javascript
// In state.js or a new compact-state.js
compactState = {
  currentCycle: {
    cycleNumber: int,
    startDate: timestamp,
    endDate: timestamp,
    operations: [
      {
        id: string,             // e.g. "suppression_southern_front"
        type: string,           // 'suppression' | 'harvest' | 'hunt' | 'forge' | 'march' | 'trial'
        name: string,
        description: string,
        narrative: string,      // longer in-universe text for War Board
        deadline: timestamp,
        target: number,
        current: number,        // atomic counter, updated on qualifying events
        status: 'active' | 'success' | 'failed',
        contributionLog: Map,   // playerId -> contributionScore
      }
    ],
  },
  bleedIndex: {
    holy_dominion: number,
    elven_south: number,
    orcish_steppes: number,
    // ... all regions
  },
  compactStore: {
    isOpen: boolean,
    items: [],                  // current store inventory
  },
  cycleHistory: [],             // past cycle outcomes
}
```

**Hooks into existing systems (additions, not replacements):**
- `dungeon_descend` event: increment `operation.current` for active Suppression ops
- `resource_harvest` event: increment relevant resource tracker for active Harvest ops
- Bleed enemy death in overworld: increment Hunt op tracker
- `card_fuse` event: increment Forge op tracker with rarity weight
- Zone enter for new chunk: increment March op territory tracker
- Boss death (`enemy.isBoss === true`): increment Council Trial op tracker

**New socket events required:**

| Event | Direction | Purpose |
|---|---|---|
| `compact_state` | server → client | Full Compact state on login/request |
| `compact_update` | server → client | Partial update when operation progress changes |
| `compact_operation_resolved` | server → client | Broadcast when operation succeeds or fails |
| `compact_confluence_warning` | server → client | 48-hour warning broadcast |
| `compact_confluence_start` | server → client | Confluence Event begins |
| `compact_get_war_board` | client → server | Player requests War Board data |
| `compact_store_buy` | client → server | Player purchases from Compact Store |
| `compact_get_journal` | client → server | Player requests personal journal |
| `compact_guild_commit` | client → server | Guild commits vault resources |

**Persistence:** Operation progress, Bleed Index values, Stamp balances, and cycle history must persist to disk (or database). The Compact state is not ephemeral. It should use the same encrypted file storage pattern as accounts, stored in a `compact-state.json` file that survives server restarts.

### Client-Side Requirements

**New UI panel:** The War Board panel (keybind `G`) using the same panel architecture as the existing Inventory, Character Sheet, and Card Collection panels. Five tabs as described in Part VI.

**New NPC type:** Compact Herald. Uses existing NPC rendering (circle body with color). Gold-bordered circle distinct from current NPC color palette. Placed in each town zone file.

**Broadcast moment:** Center-screen large text for 4 seconds when operation succeeds. Uses existing screen overlay infrastructure (as used for dungeon boss intro — same mechanism).

**Bleed Index visual effects:** Region tile tinting at high Bleed Index values is an overworld rendering change — the most complex client-side addition. Can be implemented as a post-pass color overlay on biome tiles in the affected region. Lower priority — can ship without this and add visuals in a later patch.

---

## Part IX: Lore Canon Additions

The following facts are established by this system and must be maintained consistently across all future content:

1. **The Rift Compact exists.** It is a multilateral treaty. It is maintained by the Adventure Guild. The Guild's authority within the Compact is real but contested.

2. **Guildmaster Hana Voss is human.** She is aware of the irony. She does not apologize for it. She is competent, direct, and carries the weight of decisions that affect all eight races. She is not a villain and she is not a saint.

3. **The Goblin testimony is real.** The BoneTrap delegation filed reports nine years ago. Someone received them. This is an unresolved thread that future seasonal arcs can pull.

4. **The Lizardfolk know something specific.** Their delegation said "This is the Third Passage" and "We have prepared." Neither of these statements has been explained. They are intentional gaps.

5. **The Confluence has happened before.** The ruins in the dungeon themes "Flooded Ruins," "Void Debris," and "Sand Tomb" are the remnants of civilizations that were consumed by a previous Confluence. This is not speculation in-world — it is documented history that the academic communities of the Elven South and the Gnomish Collective agree on. They disagree about when, and about whether the current events are the same process or something new.

6. **Bleed enemies are not mindless.** They appear hostile because crossing through the Rift boundary is traumatic and disorienting. This is lore that most players will never encounter — but the NPC who knows this (a Lizardfolk scholar in Murkmire) should exist, saying: *"They are not from here. They know they are not from here. They are confused and they are frightened and that makes them very dangerous."*

7. **The Resonance Anchors are a Gnomish invention.** The other races have opinions about this. Mechspire did not patent the design out of altruism. The Compact negotiations over Anchor construction rights were contentious. This tension is background texture, not a plot point — but it informs how Gnome NPCs and Compact Herald dialogue is written in Gnomish territories.

---

## Appendix A: Sample War Board UI Text

*All text written in-universe, designed to be copy-pasted directly into game implementation.*

### Operation Card: The Southern Front (Suppression)

```
SUPPRESSION OPERATION: THE SOUTHERN FRONT
Category: Rift Containment | Priority: URGENT | 11 days remaining

The Bleed frequency in the Elven South has increased 340% over six months.
Guild analysis identifies floor-depth equivalence at levels 25-35 — accessible
to most Guild members currently active.

Every floor cleared anywhere contributes. The Rift does not respect borders.
Neither does the Compact.

Community: 18,204 / 30,000 floors cleared   [============------]  61%
Your contribution: 47 floors

"The South has been patient with us for a long time. It has asked for very
 little in return. I would like to be able to give it this." — Guildmaster Voss
```

### Operation Card: Anchor Point Kragmor (Harvest)

```
SUPPLY OPERATION: ANCHOR POINT KRAGMOR
Category: Infrastructure | Priority: STANDARD | 9 days remaining

The Orcish Khanate has authorized Compact construction at Kragmor.
The Resonance Anchor requires:

Iron Ore      [=================-] 89%   178,203 / 200,000
Stone         [=============-----] 67%   100,412 / 150,000
Clockwork Cores [=========---------] 47%   3,760 / 8,000
Mana Crystals [=====--------------] 28%   1,401 / 5,000

Deposit at any Guild Requisition Officer. All contributions earn Stamps.
Clockwork Cores and Mana Crystals earn triple Stamps this week.

Your contribution: 820 Iron Ore, 340 Stone, 0 Clockwork Cores, 0 Mana Crystals

"Ironhold won't say where their surplus went. Mechspire won't confirm their
 shipment schedule. Kragmor is building something regardless. So are we."
 — Requisition Officer Dav Morek, Adventure Guild
```

### Bleed Index Panel: Current Status

```
BLEED INDEX — CONTINENTAL STATUS

Holy Dominion    [=====--------------]  27%  UNSTABLE
Elven South      [===============----]  74%  SURGE
Orcish Steppes   [==========--------]  51%  ACTIVE BLEED
Shadowfen        [============------]  62%  ACTIVE BLEED
Frostbound Reach [================--]  82%  CRITICAL
Dwarven Mountains[====--------------]  21%  UNSTABLE
Gnomish Isles    [===--------------]   17%  STABLE
Murkmire         [=====--------------]  29%  UNSTABLE

[CLICK ANY REGION FOR STATUS REPORT]
```

### Guild Archive Entry: Past Operation

```
ARCHIVE — CYCLE 2, OPERATION: CLEAR THE STEPPES

Type: Great Hunt | Duration: 7 days | Outcome: SUCCESS

Community totals:
  Bleed Crawlers eliminated: 52,341 (target: 40,000)
  Bleed Wraiths eliminated:  18,204 (target: 15,000)
  Bleed Anchors destroyed:    623 (target: 500)

Bleed Index change: Orcish Steppes -18 (from 69 to 51)

Notable contributors: [Top 10 names listed]

After-action note — Guild Registrar:
"The Steppes operation exceeded targets in all three categories. Contributing
 factor: the Orcish Khanate's own hunters joined the operation on day 3,
 unprompted. This is not on record as an official Compact contribution but
 it happened and we noticed. — R. Kelleth, Holy Dominion Chapter Registrar"
```

---

*End of Document*

*Cross-references: `rift-atmosphere-features.md` (atmosphere events, death markers, floor memory), `GDD-Detailed.md` (race definitions, dungeon system, Guild structure), `GDD-Simplified.md` (town locations, biome palette)*
