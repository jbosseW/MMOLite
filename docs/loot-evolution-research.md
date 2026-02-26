# Loot Evolution Research: Unified Analysis & Implementation Guide

**Document Purpose:** Synthesis of loot system research across four reference games into actionable design recommendations for the MMOLite gacha city builder dungeon RPG.

**Current State Reference:** `accounts.js` WEAPON_TYPES (~80 weapons across 11 categories), armor across all slots, 8 rarity tiers (common through relic), crafting via `handlers/crafting.js`, 783 combat cards across 12 archetypes, 4 combat resource pools (mana/stamina/bloodlust/focus), 16 dual-wield combos, and equipment slots: main_hand, off_hand, head, chest, undershirt, arms, hands, legs, feet, ring1-6, necklace.

---

## Research Source Summaries

### Tales of Maj'Eyal (ToME4)

ToME4's equipment identity comes from its ego (affix) system. Every item can receive a minor ego (prefix) and a major ego (suffix) drawn from filtered pools specific to that item type. An iron longsword might become a "Cruel Iron Longsword of the Hawk" — Cruel adding a bleed-on-crit effect, of the Hawk adding a crit chance bonus. The ego system ensures that two items of the same base type are rarely identical, and the language of the prefix/suffix trains players to recognize what combinations they want before they see the full stat block.

Randarts (random artifacts) are fully procedural uniques: they receive a name generated from a vocabulary bank, a visual that may differ from their base type, and a set of effects pulled from a curated pool with internal budget constraints that prevent them from being either useless or game-breaking. This sits alongside hand-designed artifacts (egos are stripped, replaced with a fixed, often narrative-driven effect set).

Material progression follows five tiers: iron, steel, dwarven steel, voratun, and adamantite. Each tier is tied to depth zones, and crafting/upgrading requires that tier's ore. The gem socketing system (Lifebinding/Resonant/etc. gem types slotting into items with sockets) provides a secondary axis of customization that is independent of ego rolls.

Inscriptions are the most exportable single system in ToME4. They replace consumables with equipped reusable abilities on a cooldown — a player who finds a "Shielding Rune" equips it as an inscription slot and gains a reusable, upgradeable shield on a 15-turn cooldown, instead of burning potions. This shifts inventory management from consumable stockpiling to loadout crafting.

Tinker augments (available to steam-tech characters) allow physical modifications to be added to weapons and armor post-loot: a scope to extend range, a spring-loaded coil for movement, a toxic coating. These are placed at workbenches and can be removed and replaced.

### RuneScape

RuneScape's defining architecture is the combat triangle: melee beats ranged, ranged beats magic, magic beats melee. Every enemy in the game has an affinity, and using the correct attack style deals a damage and accuracy bonus while using the incorrect style incurs a penalty. This creates an active equipment-swap metagame in endgame content.

Material progression is one of the longest in gaming history: bronze, iron, steel, mithril, adamantite, rune, dragon, and then a jump to raid/boss-specific gear (Barrows, Godwars, Raids). Each bracket is numerically superior and tied to skill level requirements (requires Attack 40 for rune, Attack 70 for dragon, etc.).

The special attack system gives each weapon a unique expenditure from a 100% energy bar that regenerates over time. A Granite Maul fires immediately (costs 50%, can be chained twice in rapid succession), an Armadyl Godsword hits twice and heals the player (costs 50%), a Dark Bow fires two arrows in one shot (costs 65%). These specials define weapon identity beyond raw stats — a player choosing between two weapons of similar power often chooses based on which special attack serves their strategy.

Barrows provides the set item template: six pieces from a themed set, each wearable individually, but with a set effect that only activates at 4/5/6 pieces equipped (the full Dharok's set deals more damage the lower the wearer's HP, creating a high-risk gameplay mode). Degradation at 100,000 charges of use, requiring repair at Bob's Axes or using a repair kit.

The RS3 Invention skill introduced augmentation: a high-level skill that allows players to attach gizmos to weapons and armor. Gizmos are assembled from materials (harvested from disassembling items) and roll a set of perks from a probabilistic combination table. Perks like "Precise" (increases minimum damage), "Equilibrium" (reduces max damage but also raises min), "Biting" (chance for additional damage roll), and "Enhanced Devoted" (chance to halve damage taken) can be combined on the same piece. The system rewards deep investment in disassembling large quantities of specific item types to get desired perk combinations.

Ring imbuing in OSRS deserves specific note: certain rings (the Berserker, Archers, Seers, Warrior rings) can be imbued at a reward vendor to permanently double their stat bonus. This is a clear model for a "ring upgrade" track.

### Borderlands

Borderlands' genius is manufacturer identity as mechanical archetype. The manufacturer is not cosmetic — it is the weapon's personality:

- **Jakobs:** Fires as fast as you pull the trigger (semi-auto pistols, high damage per shot, wooden aesthetic, western frontier motif)
- **Torgue:** Gyrojet explosive rounds, reduced direct damage, explosion damage on impact, unique "sticky" variant
- **Maliwan:** Elemental damage emphasis, two elements available on one weapon with a swap button, high elemental chance, lower bullet damage
- **Tediore:** Thrown like a grenade on reload (acts as homing grenade, turret, or walking bomb depending on what is loaded)
- **Dahl:** Burst-fire in ADS (aim down sights), precise, military feel
- **Hyperion:** Accuracy improves with sustained fire (reverse of most weapons), corporate/clean aesthetic
- **Vladof:** Fastest fire rate in category, socialism-themed, underbelly barrels, high ammo consumption
- **Atlas:** Smart bullets that track enemies after impact

The legendary "red-text" system is directly exportable: each legendary has a single line of flavor text (usually a pop culture reference or piece of world-lore) that hints at its special effect, which operates completely outside normal stat ranges. The Bee shield gives +1000 amp damage on every bullet while fully charged — not a percentage, not a small bonus, a flat absurd number that rewrites what bullets do. The Infinity pistol never needs to reload. The Norfleet fires three Vladof E-tech missiles. These are not "+15% damage" items. They are mechanical exceptions.

The parts system (body, barrel, grip, stock, scope, accessory) means every weapon is an assembly of parts, each contributing to one or more stats. A Jakobs barrel on a non-Jakobs weapon increases damage but changes handling feel. This creates a space for "hybrid" items that bend category rules.

Anointments (introduced in Borderlands 3) are a post-drop modifier tier: a bonus effect applied to a fully generated item that activates under a specific condition (on action skill end, on kill, on grenade throw). This separates the weapon's base identity from an "activation condition" layer.

### Noita

Noita's wand system is the deepest single-item system in this research set. Every wand has eight base stats: shuffle (yes/no — whether spells fire in random order), spells/cast (how many spells fire per trigger), cast delay (time between activations), recharge time (time before wand reloads after depleting), mana max, mana charge rate, spell capacity (slots available), and spread (accuracy penalty).

Spells are modifiers, projectiles, triggers, and utilities: a Spark Bolt spell cast alone fires a bolt. A Spark Bolt modified by Damage Plus and then followed by Trigger: Explosion fires a bolt that, on impact, detonates. The trigger/payload architecture means spells combine multiplicatively, not additively — a piercing modifier attached to a homing modifier attached to a lightning bolt that triggers another lightning bolt on impact is not "+30% damage," it is a new behavior.

The Always Cast slot fires its spell every single shot regardless of wand sequence, enabling passive auras.

The perk system (106 perks, one offered per floor) is the lens through which wand builds are filtered — "Glass Cannon" doubles damage but halves HP, "Electricity Immunity" unlocks entire categories of dangerous self-damage builds. Perks and wands are co-designed for synergy: the wand system has no cap on interaction complexity, and the game's difficulty is calibrated around players discovering these interactions organically.

---

## Unified Analysis: What Your Game Should Adopt

---

### 1. Weapon and Equipment Affix System

**Design Principle**

Your current WEAPON_TYPES define static items. A mithril sword always has damage 22, speed 1.1. This means every mithril sword is identical, which flattens the excitement of finding one. The affix system converts every item find into a variable event. The player does not ask "did I find a mithril sword?" — they ask "what kind of mithril sword did I find?"

Affixes operate on two axes: prefix (modifies offensive capability) and suffix (modifies defensive/utility capability). Item type has a filtered pool for each — a dagger should never roll an affix that gives it a bonus to block chance, because daggers cannot block. Pool filtering by `category` and `slot` is the key implementation constraint.

**Data Structure**

```javascript
// In rpg-data.js or a new affixes.js

const WEAPON_AFFIXES = {
  // ── PREFIXES (offensive focus) ──
  prefixes: {
    // Melee physical
    'jagged':       { name: 'Jagged',      category: ['melee_blade', 'melee_blunt'], stats: { bleedChance: 0.10, damage: { flat: 2 } }, weight: 20, minRarity: 'common' },
    'serrated':     { name: 'Serrated',    category: ['melee_blade'],               stats: { bleedChance: 0.18, damage: { flat: 4 } }, weight: 12, minRarity: 'uncommon' },
    'cruel':        { name: 'Cruel',       category: ['melee_blade', 'melee_blunt'], stats: { critMult: 0.15, bleedChance: 0.08 }, weight: 10, minRarity: 'uncommon' },
    'brutal':       { name: 'Brutal',      category: ['melee_blunt'],               stats: { armorPenetration: 0.15, damage: { flat: 3 } }, weight: 14, minRarity: 'common' },
    'masterwork':   { name: 'Masterwork',  category: ['melee_blade', 'melee_blunt', 'archery', 'magic'], stats: { damage: { pct: 0.12 } }, weight: 8, minRarity: 'uncommon' },
    'tempered':     { name: 'Tempered',    category: ['melee_blade', 'melee_blunt'], stats: { damage: { pct: 0.08 }, durabilityBonus: 0.20 }, weight: 15, minRarity: 'common' },
    // Elemental
    'flaming':      { name: 'Flaming',     category: ['melee_blade', 'melee_blunt', 'archery'], stats: { element: 'fire', bonusDamage: 5, onHitStatus: { name: 'burning', chance: 0.12, duration: 2, tickDamage: 4 } }, weight: 10, minRarity: 'uncommon' },
    'frosted':      { name: 'Frosted',     category: ['melee_blade', 'melee_blunt', 'archery'], stats: { element: 'ice', bonusDamage: 4, onHitStatus: { name: 'chilled', chance: 0.15, duration: 2, speedMult: 0.7 } }, weight: 10, minRarity: 'uncommon' },
    'crackling':    { name: 'Crackling',   category: ['melee_blade', 'melee_blunt', 'archery', 'magic'], stats: { element: 'lightning', bonusDamage: 4, onHitStatus: { name: 'shocked', chance: 0.10, duration: 1, stunChance: 0.05 } }, weight: 9, minRarity: 'uncommon' },
    'venomous':     { name: 'Venomous',    category: ['melee_blade', 'archery'],    stats: { element: 'poison', onHitStatus: { name: 'poisoned', chance: 0.20, duration: 3, tickDamage: 5 } }, weight: 12, minRarity: 'uncommon' },
    'void':         { name: 'Void',        category: ['melee_blade', 'melee_blunt', 'magic'], stats: { element: 'shadow', bonusDamage: 6, drainManaChance: 0.10 }, weight: 5, minRarity: 'rare' },
    // Magic
    'arcane':       { name: 'Arcane',      category: ['magic'],                     stats: { magicDamage: { flat: 6 }, spellCostReduction: 0.08 }, weight: 14, minRarity: 'common' },
    'empowered':    { name: 'Empowered',   category: ['magic'],                     stats: { magicDamage: { pct: 0.15 }, aoeRadiusBonus: 1 }, weight: 7, minRarity: 'uncommon' },
    'channeling':   { name: 'Channeling',  category: ['magic'],                     stats: { magicDamage: { pct: 0.10 }, chargeUpDmgBonus: 0.25 }, weight: 8, minRarity: 'rare' },
    // Ranged
    'piercing':     { name: 'Piercing',    category: ['archery'],                   stats: { pierceChance: 0.20, armorPenetration: 0.10 }, weight: 11, minRarity: 'uncommon' },
    'unerring':     { name: 'Unerring',    category: ['archery'],                   stats: { critBonus: 0.06, spread: -0.10 }, weight: 10, minRarity: 'uncommon' },
    // Dual-wield synergy
    'offhand_keen': { name: 'Off-Hand Keen', category: ['melee_blade'],             stats: { dualWieldDamageBonus: 0.12, critBonus: 0.03 }, weight: 8, minRarity: 'uncommon', slot: 'off_hand' },
    'mainhand_fury':{ name: 'Main-Hand Fury', category: ['melee_blade', 'melee_blunt'], stats: { comboBuilderBonus: 0.15 }, weight: 7, minRarity: 'rare', slot: 'main_hand' },
  },
  // ── SUFFIXES (defensive/utility focus) ──
  suffixes: {
    'of_the_hawk':  { name: 'of the Hawk',     category: ['melee_blade', 'archery'],                        stats: { critBonus: 0.04, finesse: 1 }, weight: 15, minRarity: 'common' },
    'of_the_bear':  { name: 'of the Bear',     category: ['melee_blunt', 'melee_blade'],                    stats: { vigor: 2 }, weight: 18, minRarity: 'common' },
    'of_warding':   { name: 'of Warding',      category: ['melee_blade', 'melee_blunt', 'magic', 'archery'], stats: { resolve: 1, magicResist: 3 }, weight: 14, minRarity: 'common' },
    'of_alacrity':  { name: 'of Alacrity',     category: ['melee_blade', 'archery', 'magic'],               stats: { speed: 0.08 }, weight: 12, minRarity: 'uncommon' },
    'of_the_titan': { name: 'of the Titan',    category: ['melee_blunt'],                                   stats: { might: 2, damage: { flat: 3 } }, weight: 9, minRarity: 'uncommon' },
    'of_channeling':{ name: 'of Channeling',   category: ['magic'],                                         stats: { manaCostReduction: 0.10 }, weight: 10, minRarity: 'uncommon' },
    'of_vampirism': { name: 'of Vampirism',    category: ['melee_blade', 'melee_blunt'],                    stats: { lifeStealPct: 0.06 }, weight: 7, minRarity: 'rare' },
    'of_the_hunt':  { name: 'of the Hunt',     category: ['archery', 'melee_blade'],                        stats: { damageVsMovingTargets: 0.12 }, weight: 8, minRarity: 'uncommon' },
    'of_ruin':      { name: 'of Ruin',         category: ['melee_blade', 'melee_blunt', 'magic'],           stats: { armorShredOnCrit: 0.08, damage: { pct: 0.05 } }, weight: 6, minRarity: 'rare' },
    'of_focus':     { name: 'of Focus',        category: ['magic'],                                         stats: { focusGainOnCast: 3, magicDamage: { flat: 4 } }, weight: 9, minRarity: 'uncommon' },
    'of_momentum':  { name: 'of Momentum',     category: ['melee_blade', 'melee_blunt', 'archery'],         stats: { comboPointGenerationBonus: 1 }, weight: 8, minRarity: 'uncommon' },
  }
};

const ARMOR_AFFIXES = {
  prefixes: {
    'stalwart':   { name: 'Stalwart',    slot: ['head', 'chest', 'undershirt', 'arms', 'hands', 'legs', 'feet'], stats: { defense: { flat: 3 } }, weight: 20, minRarity: 'common' },
    'fortified':  { name: 'Fortified',   slot: ['chest', 'legs'],    stats: { defense: { flat: 5 }, speedPenalty: 0.01 }, weight: 14, minRarity: 'uncommon' },
    'warded':     { name: 'Warded',      slot: ['head', 'chest', 'undershirt', 'arms', 'hands', 'legs', 'feet'], stats: { magicResist: { flat: 4 } }, weight: 16, minRarity: 'common' },
    'shadowweave':{ name: 'Shadowweave', slot: ['head', 'chest', 'legs'], stats: { stealthBonus: 0.10, defense: { flat: 1 } }, weight: 10, minRarity: 'uncommon' },
    'agile':      { name: 'Agile',       slot: ['hands', 'feet', 'legs'], stats: { speedBonus: 0.04, finesse: 1 }, weight: 12, minRarity: 'uncommon' },
    'runed':      { name: 'Runed',       slot: ['head', 'chest', 'undershirt', 'arms', 'hands', 'legs', 'feet'], stats: { magicResist: { flat: 3 }, onDamageTakenManaGain: 2 }, weight: 9, minRarity: 'rare' },
    'adamantine': { name: 'Adamantine',  slot: ['chest', 'legs'],    stats: { defense: { flat: 8 }, speedPenalty: 0.02 }, weight: 5, minRarity: 'rare' },
  },
  suffixes: {
    'of_the_ox':      { name: 'of the Ox',      slot: ['chest', 'legs', 'feet'],           stats: { vigor: 2 }, weight: 18, minRarity: 'common' },
    'of_endurance':   { name: 'of Endurance',   slot: ['chest', 'undershirt'],             stats: { hpRegen: 2, resolve: 1 }, weight: 14, minRarity: 'common' },
    'of_the_wolf':    { name: 'of the Wolf',    slot: ['feet', 'legs'],                   stats: { speedBonus: 0.05 }, weight: 12, minRarity: 'uncommon' },
    'of_thorns':      { name: 'of Thorns',      slot: ['chest', 'arms', 'hands'],         stats: { reflectDmgPct: 0.05 }, weight: 8, minRarity: 'rare' },
    'of_the_mage':    { name: 'of the Mage',    slot: ['head', 'chest', 'hands'],         stats: { acumen: 1, magicResist: 2 }, weight: 11, minRarity: 'uncommon' },
    'of_resolve':     { name: 'of Resolve',     slot: ['head', 'chest', 'undershirt'],    stats: { resolve: 2, debuffDurationReduction: 0.10 }, weight: 10, minRarity: 'uncommon' },
  }
};
```

**Concrete Examples**

1. `jagged iron_dagger` becomes **Jagged Iron Dagger of the Hawk** — rolls bleed-on-hit (10%) and a crit bonus (+4%), making it a genuine rogue tool rather than a plain early weapon.
2. `empowered gold_staff` becomes **Empowered Gold Staff of Channeling** — magic damage up 15%, AoE radius +1, mana cost down 10%. This is a distinct endgame identity for AoE mage builds.
3. `stalwart mithril_armor` becomes **Stalwart Mithril Armor of the Ox** — base 28 defense, +8 flat defense from prefix, +2 Vigor from suffix. The best tank chest piece in the game before set bonuses.
4. `venomous silver_dagger of momentum` — poison-on-hit combined with bonus combo generation, directly enabling a "poison assassin who chains combos into poison stacks" build.
5. A `void mithril_scythe of ruin` — shadow element, mana drain on hit, armor shred on crit. A necromancer-adjacent build anchor weapon.

**Integration Notes**

- The affix generation function runs at item creation time, not at equip time. Items are generated with their affixes baked in.
- Prefix is rolled first (or null), suffix is rolled second (or null). Common items: 40% chance of prefix, 20% chance of suffix. Rare: 80% / 60%. Epic: guaranteed prefix, 90% suffix. Legendary: guaranteed both.
- Affix names feed the item's display name: `[prefix] [base_name] [suffix]` or `[prefix] [base_name]` or `[base_name] [suffix]`.
- Dual-wield combos should check for affix bonuses specifically — the combo system already exists with 16 combos; affixes like `offhand_keen` and `mainhand_fury` make specific weapons better in specific hand slots, giving the combo system more identity.
- Card system interaction: the existing `equipment_modifier` card type (flaming_weapon, frost_weapon) stacks on top of affixes. An affixed flaming weapon with a Flaming Weapon card equipped has two fire effects — visually distinct, and the card's proc rolls independently.

---

### 2. Material Tier Progression

**Design Principle**

Your current material progression is: wooden → copper → bronze → iron → steel → silver → gold → mithril. This is 8 tiers but the jump from gold to mithril has no intermediate step, and silver/gold are parallel rather than sequential (both at `rare` rarity). The player also has no narrative context for why silver and gold are combat materials — these are perceived as monetary metals, not forging metals, which creates a mild cognitive dissonance.

The goal is a clean progression curve where each tier is:
- Tied to a dungeon depth range (or overworld difficulty zone)
- Tied to a skill level requirement in the relevant crafting skill
- Narratively distinct (each tier should have a lore reason to exist)
- Functionally distinct in at least one way beyond raw stat numbers

**Recommended Tier Structure**

| Tier | Material | Rarity | Dungeon Floors | Crafting Skill Req | Defining Property |
|------|----------|--------|----------------|-------------------|-------------------|
| 1 | Wooden / Cloth | common | Surface / overworld | None | Starter, degrades fast |
| 2 | Copper | common | Floors 1-5 | Crafting 1 | Cheap, abundant, low durability |
| 3 | Bronze | common | Floors 3-10 | Crafting 10 | Better alloy, heat-resistant |
| 4 | Iron | uncommon | Floors 8-20 | Crafting 20 | Reliable, plate armor unlocked |
| 5 | Steel | uncommon | Floors 15-30 | Crafting 35 | Precision-forged, speed penalty reduced |
| 6 | Stormsteel | rare | Floors 25-45 | Crafting 50 | Lightning-touched iron from The Rift, inherent crackle |
| 7 | Deepsilver | rare | Floors 40-60 | Crafting 65 | Silvered deep-mine alloy, magic-resonant |
| 8 | Soulforged | ultra_rare | Floors 55-80 | Crafting 80 | Forged with dungeon essence, semi-animated |
| 9 | Voidmetal | ultra_rare | Floors 75+ | Crafting 95 | Rift-tainted, shadow elemental affinity default |

**Changes from Current State**

- Replace `silver` and `gold` as weapon materials. Silver and gold remain as monetary resources and for jewelry (rings, necklaces) only — they belong in that context.
- `Stormsteel` = narrative rename of the current silver-tier weapon slot. Made by quenching steel in rift lightning. Lore-coherent with The Rift dungeon system.
- `Deepsilver` = a mithril precursor. Deep mines near Ironhold. Dwarves control the supply. Naturally magic-resonant.
- `Soulforged` = post-mithril tier. Weapons require dungeon_essence (already in ALL_RESOURCE_TYPES) to craft. They animate slightly in hand.
- `Voidmetal` = endgame tier. Obtained only from Rift floor 75+ and boss drops. Dark Crystal (already defined) required for crafting.

**Stat Scaling Formula**

For `damage`, the current progression from copper (4) to mithril (22) across 7 tiers is roughly +2.8 per tier. This is fine for base weapons. Affixes then push individual items above or below that baseline. The recommended range per tier for one-handed swords:

| Tier | Base Damage | Base Durability | Affix Budget Multiplier |
|------|-------------|-----------------|------------------------|
| Copper | 4-5 | 75 | 0.8x (affixes weaker) |
| Bronze | 6-8 | 100 | 1.0x |
| Iron | 9-11 | 150 | 1.0x |
| Steel | 12-15 | 200 | 1.1x |
| Stormsteel | 16-19 | 225 | 1.2x |
| Deepsilver | 20-24 | 260 | 1.3x |
| Soulforged | 25-30 | 280 | 1.4x |
| Voidmetal | 32-40 | 320 | 1.6x |

**Integration Notes**

- Dungeon floor depth gates should reference the `dungeon-data.js` theme system. Floor 1-10 enemy pools should drop copper/bronze; floor 25+ should reliably drop stormsteel or better.
- The crafting handler should check `crafting` skill level against `minCraftingLevel` on the item definition. Failing the requirement gives a degraded item (75% durability, no prefix roll possible).
- Stormsteel items should inherently have a weak `crackling` elemental tag even without the crackling prefix affix, reinforcing the narrative of their origin.
- This directly integrates with the guild rank progression (Stone through Relic guild ranks in dungeon-data.js): guild rank gates should roughly match material tier access.

---

### 3. Procedural Equipment Generation

**Design Principle**

The Borderlands model proves that players stay engaged with loot when no two drops are identical. The goal is not pure chaos — it is controlled variance. Every stat has a range, and rolls within that range create items that feel personal. A sword dropped for you specifically rather than a sword that exists in a list.

The generation pipeline should be: base type selection → quality roll → affix roll → special property roll → naming. The result is stored on the item instance, not computed at equip time.

**Generation Pipeline**

```javascript
// In handlers/crafting.js or a new loot-generator.js

function generateItem(baseType, options) {
  // options: { source, depth, forcedRarity, guaranteedAffix }
  var baseDef = WEAPON_TYPES[baseType] || ARMOR_TYPES[baseType];
  if (!baseDef) return null;

  var depth = options.depth || 1;
  var rarity = options.forcedRarity || rollItemRarity(depth);

  // Quality roll: determines what percentage of the stat range this item occupies
  // Quality tiers: normal (60-79%), fine (80-89%), superior (90-94%), masterwork (95-99%), legendary_quality (100%)
  var qualityRoll = Math.random();
  var qualityTier;
  var qualityMult;
  if      (qualityRoll < 0.50) { qualityTier = 'normal';    qualityMult = 0.60 + Math.random() * 0.20; } // 60-79%
  else if (qualityRoll < 0.80) { qualityTier = 'fine';      qualityMult = 0.80 + Math.random() * 0.10; } // 80-89%
  else if (qualityRoll < 0.93) { qualityTier = 'superior';  qualityMult = 0.90 + Math.random() * 0.05; } // 90-94%
  else if (qualityRoll < 0.99) { qualityTier = 'masterwork';qualityMult = 0.95 + Math.random() * 0.05; } // 95-99%
  else                          { qualityTier = 'pristine';  qualityMult = 1.00; }                         // 100%

  // Apply quality to relevant stats
  var generatedStats = {};
  var statRange = getStatRange(baseType, rarity);  // returns { damage: [min, max], speed: [min, max], etc. }
  for (var statKey in statRange) {
    var range = statRange[statKey];
    var base = range[0] + (range[1] - range[0]) * qualityMult;
    generatedStats[statKey] = Math.round(base * 10) / 10;
  }

  // Affix rolls (probability based on rarity tier)
  var prefix = rollAffix('prefix', baseDef.category || baseDef.slot, rarity);
  var suffix = rollAffix('suffix', baseDef.category || baseDef.slot, rarity);

  // Special property roll (rare and above only, from curated per-type pools)
  var specialProperty = null;
  if (rarityOrder(rarity) >= rarityOrder('rare')) {
    specialProperty = rollSpecialProperty(baseType, rarity);
  }

  // Compose name
  var displayName = composeName(baseDef.name, prefix, suffix, specialProperty);

  return {
    id: generateInstanceId(),
    type: baseType,
    rarity: rarity,
    quality: qualityTier,
    qualityMult: qualityMult,
    stats: generatedStats,
    prefix: prefix ? prefix.id : null,
    suffix: suffix ? suffix.id : null,
    specialProperty: specialProperty,
    displayName: displayName,
    source: options.source || 'unknown',
    generatedAt: Date.now(),
    durability: null,  // set by ensureItemDurability
    maxDurability: null,
  };
}

// Stat ranges per base type — defines the floor and ceiling before quality is applied
function getStatRange(baseType, rarity) {
  var baseDef = WEAPON_TYPES[baseType];
  if (!baseDef) return {};
  var range = {};
  if (baseDef.damage !== undefined) {
    var d = baseDef.damage;
    range.damage = [Math.floor(d * 0.85), Math.ceil(d * 1.15)];
  }
  if (baseDef.speed !== undefined) {
    var s = baseDef.speed;
    range.speed = [Math.floor(s * 0.95 * 100) / 100, Math.ceil(s * 1.05 * 100) / 100];
  }
  if (baseDef.magicDamage !== undefined) {
    var m = baseDef.magicDamage;
    range.magicDamage = [Math.floor(m * 0.85), Math.ceil(m * 1.15)];
  }
  if (baseDef.critBonus !== undefined) {
    var c = baseDef.critBonus;
    range.critBonus = [Math.floor(c * 0.8 * 1000) / 1000, Math.ceil(c * 1.2 * 1000) / 1000];
  }
  return range;
}
```

**Concrete Examples**

1. Two `iron_daggers` drop from the same chest: one is a **Jagged Iron Dagger of the Hawk** (fine quality, 5.3 damage, 1.43 speed, bleed on hit, +4% crit) and the other is a plain **Iron Dagger** (normal quality, 4.7 damage, 1.38 speed, no affixes). Both are iron daggers. Neither is boring.
2. A boss on floor 30 drops a **Cruel Stormsteel Longsword of Ruin** (masterwork quality, 18.4 damage, crit mult +15%, bleed, armor shred on crit). This item has a combinatory identity that no static definition could provide.
3. A craftsman at Crafting 50 produces a **Tempered Stormsteel Axe of the Titan** — crafted items always roll at `fine` or better quality (minimum qualityMult 0.80), rewarding the skill investment over dungeon-dropped equivalents.

**Integration Notes**

- The `quality` field should be surfaced in the UI with color coding: normal = white, fine = green, superior = blue, masterwork = purple, pristine = gold.
- Quality affects repair cost: a pristine item costs 20% more to repair but lasts proportionally longer.
- The item comparison tooltip should show the quality tier as a descriptor, e.g. "[Superior] Frosted Iron Sword of the Hawk."
- Crafting always produces items at a minimum of `fine` quality. This is the mechanical advantage of crafting versus looting — you cannot get a `normal` quality item from a skilled craftsperson.
- The auction house (mmo-auction.js) should allow filtering by quality tier, as this becomes the secondary sorting axis after rarity.

---

### 4. Set Bonuses and Unique Effects

**Design Principle**

Sets create a motivation to collect matching pieces rather than simply equipping the highest stat item in each slot. They also create recognizable builds — a player in the Thornwarden set is making a statement about their playstyle that other players can read at a glance.

Unique effects (legendary/relic items) operate outside normal stat budgets entirely. They do something mechanically exceptional, described in a single line of flavor text. This is the Borderlands red-text model, adapted to your system.

**Set Item Data Structure**

```javascript
// In rpg-data.js

const ITEM_SETS = {
  thornwarden: {
    id: 'thornwarden',
    name: 'Thornwarden',
    lore: 'Worn by the forest sentinels of old Sylvaris. The thorns respond to the wearer\'s rage.',
    pieces: ['thornwarden_helm', 'thornwarden_chest', 'thornwarden_greaves', 'thornwarden_gauntlets', 'thornwarden_boots'],
    bonuses: {
      2: { description: '+10% thorns damage reflected', effects: [{ type: 'reflect_dmg_pct', value: 0.10 }] },
      3: { description: '+15% defense, +2 Resolve', effects: [{ type: 'defense_pct', value: 0.15 }, { type: 'stat_boost', stat: 'resolve', value: 2 }] },
      5: { description: 'Full set: Thornform — on taking melee damage, 20% chance to root attacker for 1 turn. +25% all defense.', effects: [{ type: 'on_take_melee_dmg_root', chance: 0.20, duration: 1 }, { type: 'defense_pct', value: 0.25 }] },
    },
    tier: 'stormsteel',   // material tier this set belongs to
    acquireMethod: 'dungeon_boss_drop',  // floors 25-40 bosses
  },

  ashveil: {
    id: 'ashveil',
    name: 'Ashveil',
    lore: 'Spun from threads of solidified smoke by gnomish engineers who studied the Rift\'s fire layers.',
    pieces: ['ashveil_hood', 'ashveil_robe', 'ashveil_pants', 'ashveil_gloves', 'ashveil_boots'],
    bonuses: {
      2: { description: '+12% fire and shadow spell damage', effects: [{ type: 'spell_damage_element', elements: ['fire', 'shadow'], value: 0.12 }] },
      3: { description: '+8% cast speed, +3 Acumen', effects: [{ type: 'speed_bonus', value: 0.08 }, { type: 'stat_boost', stat: 'acumen', value: 3 }] },
      5: { description: 'Full set: Ember Echo — fire spells leave a burning tile on impact that lasts 3 turns. Shadow spells drain 5 mana on hit.', effects: [{ type: 'fire_spell_leaves_burning_tile', duration: 3 }, { type: 'shadow_spell_mana_drain', value: 5 }] },
    },
    tier: 'deepsilver',
    acquireMethod: 'dungeon_boss_drop',
  },

  bloodfang: {
    id: 'bloodfang',
    name: 'Bloodfang',
    lore: 'The hide of a creature that should not exist. It still bleeds when hit.',
    pieces: ['bloodfang_hood', 'bloodfang_vest', 'bloodfang_pants', 'bloodfang_gloves', 'bloodfang_boots'],
    bonuses: {
      2: { description: '+15% bloodlust gain rate', effects: [{ type: 'bloodlust_gain_mult', value: 0.15 }] },
      3: { description: 'Killing blow heals for 8% of kill\'s max HP', effects: [{ type: 'on_kill_heal_pct_of_target', value: 0.08 }] },
      5: { description: 'Full set: Blood Price — at 30% or less HP, all attacks deal +40% damage and generate double bloodlust.', effects: [{ type: 'berserker_threshold', hpPct: 0.30, damageBonus: 0.40, bloodlustMult: 2.0 }] },
    },
    tier: 'soulforged',
    acquireMethod: 'crafted_with_boss_trophy',
  },
};
```

**Unique Legendary Effects (Red-Text Model)**

Each legendary/relic item has one `uniqueEffect` that operates outside the normal stat budget. The item description contains one line of flavor text that hints at the effect without explicitly explaining the number.

```javascript
// Examples of legendary unique items

const UNIQUE_ITEMS = {
  scythe_of_last_breath: {
    type: 'voidmetal_scythe',
    name: 'Last Breath',
    rarity: 'legendary',
    flavor: '"It does not kill. It unmakes."',
    uniqueEffect: {
      type: 'execute_threshold',
      threshold: 0.15,  // kills enemies below 15% HP instantly
      description: 'Kills enemies below 15% HP instantly. Does not trigger on-kill effects.',
    },
    baseStats: { damage: 36, speed: 0.7, critBonus: 0.10 },
  },

  ring_of_echoes: {
    type: 'ring',
    name: 'Ring of Echoes',
    rarity: 'legendary',
    flavor: '"The second cast is always free."',
    uniqueEffect: {
      type: 'spell_echo',
      chance: 0.20,  // 20% chance for any spell to fire twice
      description: '20% chance on spell cast to fire the spell a second time at no cost.',
    },
    baseStats: { acumen: 4 },
  },

  staff_of_stolen_seconds: {
    type: 'voidmetal_staff',
    name: 'Stolen Seconds',
    rarity: 'relic',
    flavor: '"Every turn you skip, it remembers."',
    uniqueEffect: {
      type: 'time_debt',
      description: 'Stores 1 "time charge" whenever you pass a turn without casting. Spend all charges at once to reduce next spell cooldown by (charges * 2) turns.',
      maxCharges: 5,
    },
    baseStats: { damage: 14, magicDamage: 56 },
  },

  dagger_of_coincidences: {
    type: 'deepsilver_dagger',
    name: 'Coincidences',
    rarity: 'legendary',
    flavor: '"It finds the soft spots."',
    uniqueEffect: {
      type: 'guaranteed_crit_vs_debuffed',
      description: 'Always crits against enemies with any debuff applied.',
    },
    baseStats: { damage: 20, speed: 1.5, critBonus: 0.12 },
  },
};
```

**Integration Notes**

- Set detection runs at combat load, not per-attack. The combat engine compiles a player's `activeSetBonuses` array once when entering combat and when equipment changes.
- Unique items bypass the normal affix system. They cannot roll prefixes or suffixes. Their `uniqueEffect` is a sealed property.
- Set pieces should appear in the dungeon with their set name visible in the item tooltip: "Thornwarden Helm (1/5 set equipped)." Progress toward set bonuses should be visible in the equipment screen.
- Unique items should not be auctionable in the player market — they should be tradeable only via the P2P trade system, preserving their scarcity and allowing social value negotiation.

---

### 5. Socketing and Augmentation

**Design Principle**

Socketing is a post-acquisition customization layer. The item drops, you decide what to put in it. This creates a second phase of engagement with every item find — the question shifts from "is this item good?" to "what can I do with this item?" It also creates a permanent sink for gem materials (already in ALL_RESOURCE_TYPES as `gem_rough` and `gem_cut`).

Augmentation (the tinker model from ToME4, the Invention model from RuneScape) goes further: it allows mechanical modifications that change an item's function, not just its stats. A weapon augment might add a new on-hit behavior. An armor augment might add a passive trigger.

**Socket System**

Socket count by item rarity:
- Common: 0 sockets
- Uncommon: 0-1 sockets (50% chance of 1)
- Rare: 1-2 sockets (70% chance of 1, 30% chance of 2)
- Epic/Ultra_Rare: 2-3 sockets
- Legendary: 3 sockets (always)
- Relic: 4 sockets (always)

Socket count by slot:
- Weapons: can have sockets (use weapon gems — attack-focused)
- Chest/Legs: can have sockets (use armor gems — defense-focused)
- Head/Arms/Hands/Feet: 0-1 sockets only
- Rings/Necklaces: no sockets (they are already the jewelry layer)
- Undershirt: 0-1 sockets (utility gems)

**Gem Types**

```javascript
const GEM_TYPES = {
  // Weapon gems (go in weapon sockets)
  ruby:        { name: 'Ruby',        type: 'weapon', effect: { type: 'flat_damage', value: 4 },         crafted_from: 'gem_rough', quality: 'cut' },
  emerald:     { name: 'Emerald',     type: 'weapon', effect: { type: 'poison_on_hit', chance: 0.08, tickDamage: 3, duration: 2 }, crafted_from: 'gem_rough', quality: 'cut' },
  sapphire:    { name: 'Sapphire',    type: 'weapon', effect: { type: 'flat_magic_damage', value: 6 },   crafted_from: 'gem_rough', quality: 'cut' },
  topaz:       { name: 'Topaz',       type: 'weapon', effect: { type: 'lightning_on_crit', damage: 8 },  crafted_from: 'gem_rough', quality: 'cut' },
  amethyst:    { name: 'Amethyst',    type: 'weapon', effect: { type: 'mana_drain_on_hit', value: 3 },   crafted_from: 'gem_rough', quality: 'cut' },
  // Armor gems (go in armor sockets)
  diamond:     { name: 'Diamond',     type: 'armor',  effect: { type: 'flat_defense', value: 5 },        crafted_from: 'gem_cut', quality: 'flawless' },
  onyx:        { name: 'Onyx',        type: 'armor',  effect: { type: 'debuff_resistance', value: 0.10 }, crafted_from: 'gem_rough', quality: 'cut' },
  opal:        { name: 'Opal',        type: 'armor',  effect: { type: 'hp_regen', value: 2 },             crafted_from: 'gem_rough', quality: 'cut' },
  moonstone:   { name: 'Moonstone',   type: 'armor',  effect: { type: 'magic_resist', value: 5 },         crafted_from: 'gem_rough', quality: 'cut' },
  // Utility gems (go in undershirt / any single socket)
  jade:        { name: 'Jade',        type: 'utility', effect: { type: 'xp_bonus_skill_all', value: 0.05 }, crafted_from: 'gem_rough', quality: 'cut' },
  bloodstone:  { name: 'Bloodstone',  type: 'utility', effect: { type: 'life_steal_pct', value: 0.04 },     crafted_from: 'gem_rough', quality: 'cut' },
  void_shard:  { name: 'Void Shard',  type: 'utility', effect: { type: 'shadow_damage_bonus', value: 0.08 }, crafted_from: 'dark_crystal', quality: 'raw' },
};
```

**Augmentation Slots**

Separate from gem sockets, augmentation provides one `augment_slot` per item at rare+. This requires the `cogworking` or `enchanting` skill to fill. Augments can be removed and replaced at a crafting bench.

```javascript
const AUGMENT_TYPES = {
  // Weapon augments
  coiled_spring:   { name: 'Coiled Spring',     requiredSkill: 'cogworking', minLevel: 20, effect: { type: 'speed_bonus', value: 0.10 } },
  barbed_edge:     { name: 'Barbed Edge',        requiredSkill: 'cogworking', minLevel: 30, effect: { type: 'bleed_on_hit', chance: 0.15, tickDamage: 4, duration: 2 } },
  resonant_core:   { name: 'Resonant Core',      requiredSkill: 'enchanting', minLevel: 40, effect: { type: 'spell_echo_on_weapon', chance: 0.10 } },
  clockwork_sight: { name: 'Clockwork Sight',    requiredSkill: 'cogworking', minLevel: 35, effect: { type: 'range_bonus', value: 1 }, category: 'archery' },
  // Armor augments
  reactive_plating:{ name: 'Reactive Plating',   requiredSkill: 'cogworking', minLevel: 25, effect: { type: 'counter_on_block', chance: 0.20, damage: 8 } },
  sigil_ward:      { name: 'Sigil Ward',          requiredSkill: 'enchanting', minLevel: 30, effect: { type: 'spell_absorb_chance', value: 0.08 } },
  dampening_weave: { name: 'Dampening Weave',     requiredSkill: 'enchanting', minLevel: 20, effect: { type: 'debuff_duration_reduction', value: 0.15 } },
};
```

**Integration Notes**

- Jewel crafting skill (already defined in SKILL_DEFINITIONS as `jewelcrafting`) controls gem cutting quality — a Jewelcrafting 1 cut produces standard gems, Jewelcrafting 50 produces quality gems with 15% stronger effects, Jewelcrafting 99 produces masterwork gems at 30% stronger.
- The Dwarf race's `stone_born_artisan` feat already gives +15% jewel working — this becomes mechanically significant once gems have a quality scale.
- Augments require a crafting bench interaction, not just inventory. This creates a use case for the placement/building system.
- Sockets should be visible in item tooltips as unfilled circles that fill when a gem is inserted.

---

### 6. Scrolls and Consumables

**Design Principle**

The existing resource list already defines scrolls (scroll_of_protection, scroll_of_strength, scroll_of_haste) and potions. The design problem is that one-shot consumables are universally hoarded rather than used — players stockpile them "for the right moment" which never comes, and the consumables become dead weight in inventory.

ToME4's inscription system solves this by converting consumables into reusable slot-based abilities. The player does not consume the scroll; they inscribe it — it becomes a cooldown-based ability. This inverts the psychology: instead of "I should save this," the player thinks "I should use this as often as possible."

The recommended hybrid approach: keep one-shot consumables as crafting outputs (potions, food), but add an Inscription Board UI where scrolls can be permanently inscribed into one of three inscription slots.

**Inscription System**

```javascript
// Account inscription slots (add to createAccount default)
// account.inscriptions = [null, null, null];  // 3 slots, each holds an inscribed scroll type

const INSCRIPTION_DEFS = {
  scroll_of_protection: {
    name: 'Shielding Inscription',
    cooldownTurns: 8,
    effect: { type: 'temp_defense_buff', defense: 15, duration: 3 },
    description: 'Reduces all incoming damage by 15 for 3 turns.',
    source_scroll: 'scroll_of_protection',
  },
  scroll_of_strength: {
    name: 'Strength Inscription',
    cooldownTurns: 6,
    effect: { type: 'temp_damage_buff', damagePct: 0.25, duration: 2 },
    description: '+25% physical damage for 2 turns.',
    source_scroll: 'scroll_of_strength',
  },
  scroll_of_haste: {
    name: 'Haste Inscription',
    cooldownTurns: 10,
    effect: { type: 'extra_action', count: 1 },
    description: 'Grants one additional action this turn.',
    source_scroll: 'scroll_of_haste',
  },
  rune_stone_fire: {
    name: 'Flame Rune Inscription',
    cooldownTurns: 5,
    effect: { type: 'temp_element_buff', element: 'fire', bonusDamage: 12, duration: 2 },
    description: '+12 fire damage on all attacks for 2 turns.',
    source_scroll: 'rune_stone_fire',
  },
  rune_stone_ice: {
    name: 'Frost Rune Inscription',
    cooldownTurns: 7,
    effect: { type: 'aoe_chill', radius: 2, status: { name: 'chilled', duration: 2, speedMult: 0.6 } },
    description: 'Chills all enemies within 2 tiles.',
    source_scroll: 'rune_stone_ice',
  },
  rune_stone_lightning: {
    name: 'Storm Rune Inscription',
    cooldownTurns: 6,
    effect: { type: 'chain_lightning', chains: 3, damage: 20 },
    description: 'Fires lightning that chains to 3 enemies.',
    source_scroll: 'rune_stone_lightning',
  },
};

// Inscribing: consumes one scroll of that type, unlocks the inscription permanently.
// Inscription upgrades: inscribing the same scroll type a second time upgrades the inscription
// (stronger effect, shorter cooldown by 1 turn). Max 3 upgrades per inscription.
```

**One-Shot Consumables**

Potions remain one-shot. Potions should be categorized:
- **Combat potions** (potion_health, potion_mana, potion_strength, etc.): work inside dungeons, have a per-dungeon use limit of 3 per type to prevent trivialization.
- **Utility potions** (potion_speed, elixir_vigor): work in overworld only.
- **Food** (bread, stew, cooked_fish): provides out-of-combat HP regen buffs, never usable in combat.
- **Brews** (ale, mead, battle_brew): provide short combat buffs at the cost of a minor debuff (battle_brew: +20% damage, -10% defense, lasts 4 turns).

**Integration Notes**

- The 3 inscription slots should scale to 4 at a milestone (e.g. dungeon_delving level 50), giving deep dungeon players more flexibility.
- Inscription cooldowns tick down with dungeon turns, not real time — this ensures the system is meaningful in the turn-based context.
- The camp system (already implemented in the Rift) is where re-inscribing should happen if the design allows mid-dungeon inscription changes. This creates a meaningful use for the camp interaction.
- Cards with the `scroll_boost` tag type (does not exist yet, should be added) increase inscription effect values, integrating card collection with consumable power.

---

### 7. Spell and Wand System Evolution

**Design Principle**

Currently wands and staffs are delivery vehicles for magic damage — they differ only in stat magnitude. The Noita wand system demonstrates that the weapon itself should be an active design space, not just a damage amplifier.

The goal is not to replicate Noita's infinite depth (which would be overwhelming in a gacha MMO context), but to extract its core insight: the wand has intrinsic behavior properties that interact with equipped spells (cards). The wand is the chassis; equipped spell cards are the payload.

**Wand Intrinsic Properties (Extend WEAPON_TYPES)**

Add the following optional fields to magic-category weapons:

```javascript
// These fields extend the existing wand/staff definitions in WEAPON_TYPES

// Example extended definition:
wooden_wand: {
  slot: 'weapon', category: 'magic', damage: 2, speed: 1.2, magicDamage: 8, handedness: '1h',
  name: 'Wooden Wand', rarity: 'common', icon: 'weapons/Wand.PNG',
  // NEW WAND-SPECIFIC FIELDS:
  wandProps: {
    spellSlots: 2,          // number of cards that can be "loaded" into this wand for combo effects
    castDelay: 0,           // bonus/penalty turns added to all spell cooldowns cast through this wand
    manaChargeRate: 1.0,    // multiplier on mana regen while this wand is equipped
    spreadPenalty: 0.05,    // inaccuracy added to projectile spells
    chargeCapable: false,   // can spells be charged (held) for amplified effect?
    alwaysCastSlot: false,  // has an Always Cast slot (see below)
  }
},

mithril_staff: {
  ...
  wandProps: {
    spellSlots: 4,
    castDelay: -1,          // reduces all spell cooldowns by 1 turn
    manaChargeRate: 1.3,
    spreadPenalty: 0,
    chargeCapable: true,
    chargeMultiplier: 1.5,  // charged cast deals 1.5x damage/effect
    alwaysCastSlot: true,   // one card can be designated Always Cast
  }
},
```

**Spell Interaction System**

When a player equips spell cards while wielding a wand/staff with `spellSlots > 1`, those cards interact. Define interaction rules:

```javascript
const WAND_SPELL_INTERACTIONS = {
  // Trigger/Payload: a trigger card "loads" a payload card into it
  // When the trigger fires, the payload also fires at the trigger point
  trigger_payload: [
    { trigger: 'fireball_I', payload: 'ice_shard',    result: 'steam_explosion', description: 'Fire + Ice on same tile creates AoE steam cloud' },
    { trigger: 'lightning_bolt', payload: 'fireball_I', result: 'chain_fire',    description: 'Lightning bolt that ignites targets, spreading fire' },
    { trigger: 'ice_shard', payload: 'shadow_strike',  result: 'frozen_shadow',  description: 'Ice + shadow: frozen targets take 40% more shadow damage' },
    { trigger: 'heal_self_I', payload: 'fireball_I',   result: 'heal_burst',     description: 'Healing pulse that also ignites nearby enemies' },
  ],

  // Modifier stacking: a modifier card amplifies the card in the next slot
  modifier_stacking: [
    { modifier: 'flaming_weapon_card', target: 'fireball_I', amplify: { baseDamage: 1.20, burnDuration: 1 } },
    { modifier: 'frost_weapon_card',   target: 'ice_shard',  amplify: { freezeChance: 0.30, slow: 0.50 } },
  ]
};

// Always Cast: if wandProps.alwaysCastSlot = true, one equipped card fires every turn passively
// at reduced effectiveness (50% effect values, no resource cost)
// Example: an ice_shard set as Always Cast on a staff provides a chilling aura every turn passively.
```

**Concrete Examples**

1. A `mithril_staff` with 4 spell slots loaded: Fireball I, Modifier (Empowered), Ice Shard, Lightning Bolt. On cast: Fireball fires, chain-linked to Ice Shard targeting same enemy (steam burst). Lightning Bolt fires independently. The Empowered modifier boosted Fireball's AoE by 1. The interaction is: Empowered+Fireball → trigger → Ice on same tile → steam explosion AoE.
2. A `silver_wand` (2 spell slots) with Always Cast on a mid-tier staff: one slot holds Shadow Strike, the other slot is a Frost Weapon card. The wand interaction: Shadow Strike crits apply frost slow. This is not a raw card effect — it is a wand-mediated interaction.
3. A charged `deepsilver_staff` with chargeCapable=true: hold the cast button for 2 turns, release for 1.5x damage. A Heal Burst card charged becomes an AoE heal. This creates a strategic decision — do I spend 2 turns charging for 1.5x, or fire twice for 2x damage across two turns?

**Integration Notes**

- `spellSlots` on a wand is distinct from the player's card equip slots. Wand spell slots are loaded at the equipment screen. Cards loaded into wand slots are "consumed" from the normal card equip slots — a card cannot be both in a wand spell slot and in the character's combat card hand simultaneously.
- This is a phased implementation: Phase 1 is adding `wandProps` to wand/staff definitions. Phase 2 is trigger/payload interactions. Phase 3 is the Always Cast slot.
- The wand affixes system ties in here: the `channeling` prefix (reduces spell costs by 10%) and the `empowered` prefix (AoE +1) become significantly more valuable on a multi-slot staff.

---

### 8. Ring and Jewelry Specialization

**Design Principle**

You have 6 ring slots. This is an extraordinary amount of customization space that is currently underutilized — the existing ring definitions all offer flat stat boosts to single stats. Six rings each giving +2 to one stat is ten minutes of equipping and then forgotten.

Six ring slots should create six distinct decision axes. Each ring should have a design identity that goes beyond "+stat." The model is RuneScape's imbued rings (Berserker, Archers, Seers, Warrior) combined with the combat triangle — specific rings that define and amplify specific playstyles.

**Ring Categories**

Restructure rings across 6 thematic categories, one per slot archetype:

```javascript
// Conceptual slot purposes — not hard constraints but design intent:
// ring1: Combat identity (damage style amplifier)
// ring2: Survival (defense/sustain)
// ring3: Resource management (mana/stamina/bloodlust/focus)
// ring4: Utility/exploration
// ring5: Crafting/gathering (overworld)
// ring6: Special / set completion ring

const RING_DESIGNS = {
  // ── COMBAT IDENTITY RINGS (ring1 archetype) ──
  ring_of_the_blade: {
    slot: 'ring1',
    name: 'Ring of the Blade',
    rarity: 'rare',
    effects: [{ type: 'crit_bonus', value: 0.05 }, { type: 'bleed_on_crit', chance: 1.0, tickDamage: 5, duration: 2 }],
    description: 'Every critical hit inflicts bleeding.',
  },
  ring_of_arcane_focus: {
    slot: 'ring1',
    name: 'Ring of Arcane Focus',
    rarity: 'rare',
    effects: [{ type: 'spell_damage_pct', value: 0.12 }, { type: 'mana_cost_reduction', value: 0.08 }],
    description: 'Spells cost less and hit harder.',
  },
  ring_of_the_hunt: {
    slot: 'ring1',
    name: 'Ring of the Hunt',
    rarity: 'rare',
    effects: [{ type: 'stat_boost', stat: 'finesse', value: 3 }, { type: 'ranged_damage_pct', value: 0.10 }],
    description: 'For those who strike from a distance.',
  },

  // ── SURVIVAL RINGS (ring2 archetype) ──
  ring_of_iron_will: {
    slot: 'ring2',
    name: 'Ring of Iron Will',
    rarity: 'rare',
    effects: [{ type: 'stat_boost', stat: 'vigor', value: 4 }, { type: 'hp_regen', value: 3 }],
    description: 'The body refuses to break.',
  },
  ring_of_warding: {
    slot: 'ring2',
    name: 'Ring of Warding',
    rarity: 'rare',
    effects: [{ type: 'magic_resist', value: 8 }, { type: 'debuff_duration_reduction', value: 0.15 }],
    description: 'Keeps hostile magic at arm\'s length.',
  },

  // ── RESOURCE RINGS (ring3 archetype) ──
  ring_of_the_well: {
    slot: 'ring3',
    name: 'Ring of the Well',
    rarity: 'rare',
    effects: [{ type: 'mana_max_bonus', value: 10 }, { type: 'mana_regen_bonus', value: 1 }],
  },
  ring_of_fury: {
    slot: 'ring3',
    name: 'Ring of Fury',
    rarity: 'rare',
    effects: [{ type: 'bloodlust_gain_mult', value: 0.20 }, { type: 'bloodlust_decay_reduction', value: 0.15 }],
    description: 'The rage builds faster and fades slower.',
  },
  ring_of_concentration: {
    slot: 'ring3',
    name: 'Ring of Concentration',
    rarity: 'rare',
    effects: [{ type: 'focus_max_bonus', value: 8 }, { type: 'focus_retain_on_switch', value: 0.15 }],
    description: 'Keeps your edge when the target changes.',
  },

  // ── UTILITY RINGS (ring4 archetype) ──
  ring_of_the_vault: {
    slot: 'ring4',
    name: 'Ring of the Vault',
    rarity: 'uncommon',
    effects: [{ type: 'carry_weight', value: 30 }, { type: 'extra_inventory_row', value: 1 }],
  },
  ring_of_the_guide: {
    slot: 'ring4',
    name: 'Ring of the Guide',
    rarity: 'uncommon',
    effects: [{ type: 'fog_of_war_radius_bonus', value: 1 }, { type: 'trap_detection_chance', value: 0.20 }],
  },

  // ── CRAFTING/GATHERING RINGS (ring5 archetype) ──
  ring_of_the_smith: {
    slot: 'ring5',
    name: 'Ring of the Smith',
    rarity: 'uncommon',
    effects: [{ type: 'craft_quality_bonus', value: 0.10 }, { type: 'stat_boost', stat: 'ingenuity', value: 2 }],
  },
  ring_of_the_miner: {
    slot: 'ring5',
    name: 'Ring of the Miner',
    rarity: 'uncommon',
    effects: [{ type: 'mining_yield_bonus', value: 0.15 }, { type: 'rare_ore_find_chance', value: 0.05 }],
  },

  // ── SPECIAL RINGS (ring6 archetype) ──
  // These are endgame items, acquired through specific means only
  ring_of_the_void_walker: {
    slot: 'ring6',
    name: 'Ring of the Void Walker',
    rarity: 'legendary',
    effects: [{ type: 'shadow_step_on_kill', range: 2 }, { type: 'shadow_damage_bonus', value: 0.20 }],
    flavor: '"It takes you somewhere. You never notice until you\'re already there."',
  },
};
```

**Imbuing System**

At a dedicated NPC (the Jewelcrafter, available in each racial capital), ring1 through ring4 rings of `rare` or higher rarity can be imbued. Imbuing costs a material reagent and doubles the ring's stat bonuses. A ring can only be imbued once. The imbued version is visually distinct (glowing particle effect in the UI icon).

```javascript
// Imbuing costs by ring rarity
const RING_IMBUE_COSTS = {
  rare:       { resource: 'gem_cut',       amount: 5 },
  ultra_rare: { resource: 'mana_crystal',  amount: 3 },
  legendary:  { resource: 'dark_crystal',  amount: 2 },
};

// Imbuement doubles numeric effect values (caps applied per effect type to prevent absurdity):
// crit_bonus: max 0.15 after imbue
// magic_resist: max 20 after imbue
// stat boosts: max +8 per stat after imbue
```

**Integration Notes**

- The 6-slot ring system with distinct archetypes gives players a meaningful build-composition decision. A melee DPS player knows immediately: ring1 goes to blade/damage identity, ring3 goes to bloodlust or stamina management, ring6 is endgame.
- Cat Folk's `pattern_recognition` racial feat already gives +20% card luck — consider adding that this also gives a 10% chance to find rings with one extra rolled effect (a tertiary effect that is normally not present), tying the race identity to the jewelry system.
- Set rings should exist: a 3-ring set from the same dungeon boss pool (e.g. rings of the Thornwarden set) that grants a mini set bonus when all three are equipped together.

---

### 9. Equipment Special Attacks

**Design Principle**

The RuneScape special attack system transforms weapon choice from "highest DPS" into "which special serves my strategy." A weapon's special attack is its personality. The resource cost (drawn from a shared bar or a weapon-specific resource) creates a pacing decision: do I spend my special now, or save it for a critical moment?

For a turn-based dungeon system, the "energy bar" model translates directly to a combat resource called `special_charge`, which regenerates each turn and is stored per-weapon (not shared). Each weapon category has a characteristic special attack, and specific named weapons have unique variations.

**Special Charge System**

```javascript
// Add to dungeon combat init — not stored on account, only in active combat

// special_charge: 0-100, regenerates chargeRegen per turn
// Using a special costs the weapon's specialCost
// Out of combat: charge resets to 0 each time combat starts

const WEAPON_SPECIALS = {
  // ── BY CATEGORY (all weapons of this category share the base special) ──
  'melee_blade': {
    id: 'precise_strike',
    name: 'Precise Strike',
    description: 'Your next attack is guaranteed to crit and deals 150% damage.',
    chargeRegen: 15,   // per turn
    specialCost: 50,
    effect: { type: 'guaranteed_crit_next_attack', damageMultiplier: 1.50 },
    flavor: 'Find the gap.',
  },
  'melee_blunt': {
    id: 'concussive_blow',
    name: 'Concussive Blow',
    description: 'Massive attack that stuns the target for 1 turn and ignores 30% of their armor.',
    chargeRegen: 12,
    specialCost: 60,
    effect: { type: 'attack_with_stun', stunDuration: 1, armorIgnorePct: 0.30 },
    flavor: 'Hit it until it stops.',
  },
  'archery': {
    id: 'volley_shot',
    name: 'Volley Shot',
    description: 'Fire three arrows at the same target simultaneously. Each arrow rolls independently for crits.',
    chargeRegen: 18,
    specialCost: 45,
    effect: { type: 'multi_attack', count: 3, target: 'same' },
    flavor: 'Why use one when three will suffice?',
  },
  'magic': {
    id: 'arcane_surge',
    name: 'Arcane Surge',
    description: 'Your next spell costs no mana and deals 200% of its normal effect.',
    chargeRegen: 10,
    specialCost: 70,
    effect: { type: 'next_spell_free_and_doubled' },
    flavor: 'The staff shudders with released potential.',
  },

  // ── WEAPON-SPECIFIC SPECIALS (override category special for named weapons) ──
  'last_breath': {   // the unique scythe defined in Section 4
    id: 'harvest_soul',
    name: 'Harvest Soul',
    description: 'Deals 300% damage. If this kills the target, restore 20% of your maximum HP.',
    chargeRegen: 8,
    specialCost: 80,
    effect: { type: 'high_damage_attack', damageMult: 3.0, onKillHealPctMaxHp: 0.20 },
    flavor: '"It was always going to end this way."',
  },
  'coincidences': {  // the unique dagger
    id: 'twist_the_knife',
    name: 'Twist the Knife',
    description: 'Apply all debuffs you can inflict simultaneously to the target for 1 turn. Deal 120% damage.',
    chargeRegen: 20,
    specialCost: 40,
    effect: { type: 'apply_all_available_debuffs', damageMult: 1.20 },
    flavor: '"Coincidences," it said.',
  },
  'mithril_crossbow': {  // base weapon override
    id: 'armor_piercer',
    name: 'Armor Piercer',
    description: 'Next bolt ignores all armor and defense. Deals 130% damage.',
    chargeRegen: 10,
    specialCost: 65,
    effect: { type: 'true_damage_attack', damageMult: 1.30 },
    flavor: 'The bolt finds the joint.',
  },
};
```

**Dual-Wield Special Integration**

The existing 16 dual-wield combos become the activation mechanism for higher-tier specials. When a player is dual-wielding and has their special charge at 100%, they have access to a **Combo Special** that is determined by the combination of both weapons' categories:

```javascript
const DUAL_WIELD_SPECIALS = {
  'melee_blade+melee_blade': {
    name: 'Whirlwind',
    description: 'Attack all adjacent enemies twice. Second hit deals 60% damage.',
    cost: 100,
    effect: { type: 'aoe_melee_adjacent', hits: 2, secondHitMult: 0.60 },
  },
  'melee_blade+magic': {
    name: 'Spellblade Cleave',
    description: 'Infuse your sword with your wand\'s element and attack. Deals weapon damage + 80% of current wand\'s magic damage.',
    cost: 100,
    effect: { type: 'infused_attack', elementFromOffHand: true, magicDamagePct: 0.80 },
  },
  'melee_blunt+archery': {
    name: 'Aimed Smash',
    description: 'Throw your off-hand bow as a projectile for massive impact damage, then follow up with a hammer swing at range 2.',
    cost: 100,
    effect: { type: 'thrown_weapon_then_melee', thrownDamageMult: 1.40, meleeRange: 2 },
  },
};
```

**Integration Notes**

- `special_charge` should be stored on the combat session object, not on the account. It resets at combat start.
- The charge bar is visible in the combat HUD as a secondary bar below the primary resource bar.
- Card effects can modify the special charge system: a new card type `special_charge_boost` that increases charge regen rate by 20% per turn would be an extremely desirable uncommon/rare card.
- The Bloodlust resource pool interaction: when Bloodlust is at maximum (50), special charge should regen 5 extra per turn (the berserker fantasy — more rage means more access to devastating attacks).

---

### 10. Rarity and Acquisition Tiers

**Design Principle**

Your card system has 8 rarity tiers (common through relic). Your equipment system has 4 rarity tiers effectively in use (common, uncommon, rare, ultra_rare). These should be unified and expanded to create a coherent rarity language that players can trust across all systems.

The goal is: when a player sees a rarity label, they know exactly what to expect. A `legendary` equipment drop has the same emotional weight as pulling a `legendary` card. A `relic` weapon is as extraordinary as a `relic` card.

**Unified Rarity System for Equipment**

```
Common     → Base material items, no affixes, no special properties
Uncommon   → May have 1 affix, better quality roll range
Rare       → 1-2 affixes, enhanced quality, potential special property, 1 socket possible
Epic       → 2 affixes (guaranteed), superior quality floor, special property, 1-2 sockets
Legendary  → Both affixes (guaranteed), masterwork quality floor, unique effect, 3 sockets, Always Cast eligible
Relic      → Hand-designed item with narrative identity, unique effect + narrative affix, 4 sockets, named
```

| Rarity | Affix Chance | Min Quality | Sockets | Special Property | Unique Effect |
|--------|-------------|-------------|---------|-----------------|---------------|
| Common | None | Normal (60%) | 0 | No | No |
| Uncommon | 40% prefix | Normal | 0-1 | No | No |
| Rare | 80% prefix, 60% suffix | Fine (80%) | 1-2 | 30% chance | No |
| Epic | 100% prefix, 90% suffix | Superior (90%) | 2-3 | 80% chance | No |
| Legendary | 100% both | Masterwork (95%) | 3 | Yes (always) | Yes |
| Relic | Narrative set | Pristine (100%) | 4 | Yes | Yes (signature) |

**Acquisition by Rarity**

```
Common/Uncommon:
  - Dungeon floor drops (floors 1-15 heavily)
  - Crafting (Crafting skill 1-30)
  - NPC shop purchase
  - Dungeon chest loot

Rare:
  - Dungeon floor drops (floors 10+, weighted)
  - Crafting (Crafting skill 30-60, rare base material required)
  - Boss drop (every boss has a Rare drop table)
  - Auction house

Epic:
  - Dungeon boss drops (floors 25+)
  - Crafting (Crafting skill 60+, dungeon_essence required)
  - Set piece drops (set pieces are minimum Epic)
  - Rift leaderboard rewards

Legendary:
  - Boss drops (floors 50+, low probability)
  - Gacha pull (equipment gacha — separate pull type from card gacha)
  - Crafting (Crafting skill 90+, boss_trophy required)
  - Monthly/seasonal event reward

Relic:
  - Dungeon final boss drops (floor 80+)
  - Gacha pull (equipment gacha, guaranteed at 200 pulls — separate pity from card pity)
  - Cannot be crafted
  - Extremely limited P2P trade only (no auction house)
```

**Gacha Integration**

The card gacha and the equipment gacha are separate systems with separate pity counters. Equipment gacha uses a narrower banner system:

```javascript
// Equipment gacha pull rates (separate from rpg-data.js card gacha)
const EQUIPMENT_GACHA_RATES = {
  common:    0.50,
  uncommon:  0.30,
  rare:      0.15,
  epic:      0.04,
  legendary: 0.009,
  relic:     0.001,
};

// Equipment pity:
// Soft pity at 50 pulls (Epic+ rate doubles each pull)
// Hard pity at 100 pulls (guaranteed Legendary+)
// Relic pity at 300 pulls (guaranteed Relic)

// The specific item from a rarity pull is then generated procedurally
// through the generation pipeline defined in Section 3.
// This means two Legendary pulls produce different Legendary items.
```

**Interaction Between Gacha, Crafting, and Dungeon Drops**

The three acquisition paths should be positioned distinctly in the player's mind:

- **Dungeon Drops:** Unpredictable, quantity-based. You run dungeons and things drop. The excitement is in the variance — an amazing affix roll on a Rare drop feels better than expected.
- **Crafting:** Predictable, investment-based. You spend materials and skill time. The reward is minimum quality guarantees and recipe-locked special properties (some special properties only exist on crafted items, not on drops).
- **Gacha:** Peak rarity guaranteed, random category. You cannot control what equipment type you get from a pull, but the rarity floor is higher. Equipment gacha is the path to Legendary and Relic items for players who do not have the crafting skill or dungeon depth to reach them otherwise.

This triangle means no acquisition path is strictly superior — each serves a different player behavior and motivation.

**Integration Notes**

- The existing `dungeon_dwelling` and `dungeon_delving` skills (defined but unimplemented) should scale equipment drop quality. At `dungeon_delving` level 50, Rare drops have an 80% quality floor instead of 80%. At level 99, Rare drops are always Superior quality or better.
- Equipment gacha should share the existing card gacha UI framework but be a distinct banner with distinct currency. Suggest: standard gacha uses Gems (premium currency), equipment gacha uses Dungeon Tokens (earned from dungeon leaderboard placement, boss kills, and daily quests), creating a distinct farmable track for equipment.
- The fusion system from cards does not translate to equipment. Instead, equipment upgrades use the `enchanting` skill and `enchantment_shard` materials to upgrade an item's quality tier (fine → superior → masterwork), but this process cannot change affixes. This ensures the original affix roll remains permanent and meaningful.
- Boss trophy (already in ALL_RESOURCE_TYPES) should be the binding material for top-tier crafting. Different bosses should drop different trophy types, tying boss diversity to crafting diversity: a "Rift Guardian Trophy" unlocks one crafting recipe, a "Leviathan Trophy" unlocks another.

---

## Implementation Priority Order

Given the current codebase state, the recommended implementation sequence:

**Phase 1 (High value, lower complexity):**
1. Affix definitions in `rpg-data.js` (Section 1) — data-only change
2. Item generation function with quality rolls (Section 3) — new utility function
3. Affix names in item display names — client UI change

**Phase 2 (Medium complexity, major player impact):**
4. Material tier rename (stormsteel/deepsilver/soulforged/voidmetal) in accounts.js
5. Ring specialization redesign (Section 8) — expand current 5 ring types to 20+
6. Special attack system for combat (Section 9) — combat engine integration

**Phase 3 (High complexity, deep systems):**
7. Set items and bonus detection (Section 4)
8. Socketing system with gem types (Section 5)
9. Inscription system (Section 6) — requires account field additions
10. Wand spell slot interactions (Section 7)

**Phase 4 (Endgame, post-launch):**
11. Unique legendary items (Section 4)
12. Augmentation system (Section 5)
13. Equipment gacha system (Section 10)
14. Full tier material restructure with dungeon depth gating

---

*Document generated for F:/LOVE - Gacha/MMOLite/. Cross-references: `accounts.js` (WEAPON_TYPES, equipment slots, durability), `rpg-data.js` (RARITY_TIERS, CARD_TEMPLATES, COMBAT_RESOURCES, ALL_RESOURCE_TYPES, SKILL_DEFINITIONS), `handlers/dungeon.js` (combat flow, boss structure), `handlers/crafting.js` (recipe system).*
