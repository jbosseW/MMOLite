// rpg-data.js
// All RPG constants: races, stats, card templates, rarity tables, skill definitions, resource types.
// This is the data foundation for the comprehensive RPG system.

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Race Definitions (8 playable races, lore-verified)
// ---------------------------------------------------------------------------

const RACES = {
  human: {
    id: 'human',
    name: 'Human',
    lifespan: '70-90',
    statBumps: { presence: 1, resolve: 1 },
    racialFeat: {
      id: 'dominion_authority',
      name: 'Dominion Authority',
      description: '+15% XP all, +20% market in Holy Dominion, +10% diplomacy, coercion/deception, -25% property cost',
      effects: [
        { type: 'xp_bonus_all', value: 0.15 },
        { type: 'market_bonus_homeland', biomes: ['HOLY_DOMINION'], value: 0.20 },
        { type: 'diplomacy_bonus', value: 0.10 },
        { type: 'coercion_bonus', value: 0.15 },
        { type: 'deception_bonus', value: 0.15 },
        { type: 'property_cost_reduction', value: 0.25 },
        { type: 'poison_vulnerability', value: 0.15 },
      ],
    },
    vision: 'normal',
    languages: ['common'],
    loreSource: 'Holy Dominion theocratic empire; Fortuna\'s dominant human power, built on the Helios Doctrine',
    iconPath: 'icons/characters/Human/',
    baseSpeed: 10,
  },
  elf: {
    id: 'elf',
    name: 'Elf',
    lifespan: '500-800',
    statBumps: { acumen: 2, finesse: 1, vigor: -1 },
    racialFeat: {
      id: 'millennial_memory',
      name: 'Millennial Memory',
      description: '+50% magic XP, +30% faster magic unlocks, -15% melee damage, -10% max HP (physically frail)',
      effects: [
        { type: 'xp_bonus_skill', skill: 'magic', value: 0.50 },
        { type: 'magic_unlock_speed', value: 0.30 },
        { type: 'melee_damage_penalty', value: -0.15 },
        { type: 'hp_multiplier', value: -0.10 },
        { type: 'poison_vulnerability', value: 0.25 },
      ],
    },
    vision: 'normal',
    languages: ['elvish', 'common'],
    loreSource: 'Survivors of Calidar\'s destruction; High Elves who shared the desert oasis capital with the Dark Elves, now serving as the Dominion\'s administrative caste',
    iconPath: 'icons/characters/ELF/',
    baseSpeed: 9,
  },
  orc: {
    id: 'orc',
    name: 'Orc',
    lifespan: '300-500',
    statBumps: { might: 2, vigor: 1, acumen: -1 },
    racialFeat: {
      id: 'khanate_vitality',
      name: 'Khanate Vitality',
      description: '+25% melee/archery skills, +10% mounted speed, +25% base HP, +2 HP regen/s',
      effects: [
        { type: 'xp_bonus_skill', skill: 'melee', value: 0.25 },
        { type: 'xp_bonus_skill', skill: 'melee_blade', value: 0.25 },
        { type: 'xp_bonus_skill', skill: 'melee_blunt', value: 0.25 },
        { type: 'xp_bonus_skill', skill: 'melee_martial', value: 0.25 },
        { type: 'xp_bonus_skill', skill: 'archery', value: 0.25 },
        { type: 'mount_speed_bonus', value: 0.10 },
        { type: 'hp_multiplier', value: 0.25 },
        { type: 'hp_regen', value: 2 },
      ],
    },
    vision: 'normal',
    languages: ['orcish', 'common'],
    loreSource: 'Fragmented Steppe Khanate of Fortuna; nomadic clans once unified under Great Khan Morghul, now leaderless since Year -45',
    iconPath: 'icons/characters/ORC/',
    baseSpeed: 11,
  },
  dwarf: {
    id: 'dwarf',
    name: 'Dwarf',
    lifespan: '300-500',
    statBumps: { vigor: 2, ingenuity: 1, finesse: -1 },
    racialFeat: {
      id: 'stone_born_artisan',
      name: 'Stone-Born Artisan',
      description: '+25% mining XP, +25% crafting XP, +15% jewel working, Stone Skin (+10 armor), darkvision, minor tremor sense',
      effects: [
        { type: 'xp_bonus_skill', skill: 'mining', value: 0.25 },
        { type: 'xp_bonus_skill', skill: 'crafting', value: 0.25 },
        { type: 'xp_bonus_skill', skill: 'glassworking', value: 0.15 },
        { type: 'stone_skin', armor: 10, stacksWithEquipment: true },
        { type: 'tremor_sense', range: 'short' },
        { type: 'poison_resistance', value: 0.30 },
      ],
    },
    vision: 'darkvision',
    languages: ['dwarvish', 'common'],
    loreSource: 'Free Holds of Stone in Fortuna\'s western mountains; anarcho-syndicalist federation that rejected the Helios Doctrine in Year -600',
    iconPath: 'icons/characters/Dwarves/',
    baseSpeed: 8,
  },
  gnome: {
    id: 'gnome',
    name: 'Gnome',
    lifespan: '200-350',
    statBumps: { ingenuity: 2, acumen: 1, might: -1 },
    racialFeat: {
      id: 'tinker_savant',
      name: 'Tinker Savant',
      description: '+50% cogworking XP, +25% engineering speed, baseline automaton/turret crafting',
      effects: [
        { type: 'xp_bonus_skill', skill: 'cogworking', value: 0.50 },
        { type: 'crafting_speed_bonus', value: 0.25 },
        { type: 'automaton_crafting', baseline: true, costReduction: 0.50 },
        { type: 'poison_resistance', value: 0.20 },
      ],
    },
    vision: 'normal',
    languages: ['gnomish', 'common'],
    loreSource: 'Gnomish Collective on the eastern isles of Fortuna; technocratic industrial state withdrawing from continental affairs since Year 120',
    iconPath: 'icons/characters/Gnomes/',
    baseSpeed: 9,
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    lifespan: '30-60',
    statBumps: { finesse: 2, resolve: 1, might: -1 },
    racialFeat: {
      id: 'guerrilla_instinct',
      name: 'Guerrilla Instinct',
      description: '+30% stealth, +20% stealth attack/lockpicking/thievery, +20% archery, +30% speed forest/swamp, knives, darkvision',
      effects: [
        { type: 'stealth_bonus', value: 0.30 },
        { type: 'stealth_attack_bonus', value: 0.20 },
        { type: 'lockpicking_bonus', value: 0.20 },
        { type: 'thievery_bonus', value: 0.20 },
        { type: 'xp_bonus_skill', skill: 'archery', value: 0.20 },
        { type: 'throwing_knives', value: true },
        { type: 'biome_speed_bonus', biomes: ['forest', 'swamp'], value: 0.30 },
        { type: 'prison_sentence_multiplier', value: 1.50 },
      ],
    },
    vision: 'darkvision',
    languages: ['goblin', 'common'],
    loreSource: 'Decentralized guerrilla resistance spanning all of Fortuna; five centuries of survival against Dominion suppression',
    iconPath: 'icons/characters/Goblin/',
    baseSpeed: 13,
  },
  lizardfolk: {
    id: 'lizardfolk',
    name: 'Lizard Folk',
    lifespan: '600-800',
    statBumps: { acumen: 1, resolve: 1, finesse: 1, presence: -1 },
    racialFeat: {
      id: 'aquatic_heritage',
      name: 'Aquatic Heritage',
      description: '+30% fishing XP, swim/dive freely, water breathing, thermal vision, poison immune, ritual magic',
      effects: [
        { type: 'xp_bonus_skill', skill: 'fishing', value: 0.30 },
        { type: 'water_breathing', value: true },
        { type: 'swim_no_mount', value: true },
        { type: 'ocean_dive', value: true },
        { type: 'poison_immunity', value: true },
        { type: 'ritual_magic_access', value: true },
        { type: 'xp_bonus_skill', skill: 'ritual_magic', value: 0.25 },
      ],
    },
    vision: 'thermal',
    languages: ['draconic', 'common'],
    loreSource: 'Secret sect-based civilization in Fortuna\'s southern marshlands; Astronomy Sect predicted the Atlas event; founders of the Veiled Hand',
    iconPath: 'icons/characters/Creatures/',
    baseSpeed: 10,
  },
  catfolk: {
    id: 'catfolk',
    name: 'Cat Folk',
    lifespan: '60-80',
    statBumps: { finesse: 2, presence: 1, vigor: -1 },
    racialFeat: {
      id: 'pattern_recognition',
      name: 'Pattern Recognition',
      description: '+20% card luck, +15% general luck, trade prices, +30% desert speed, unarmed, +15% stealth/lockpick',
      effects: [
        { type: 'card_luck_bonus', value: 0.20 },
        { type: 'luck_bonus', value: 0.15 },
        { type: 'trade_price_bonus', value: 0.05 },
        { type: 'biome_speed_bonus', biomes: ['scorched_sands', 'desert'], value: 0.30 },
        { type: 'unarmed_proficiency', value: 0.25 },
        { type: 'stealth_bonus', value: 0.15 },
        { type: 'lockpicking_bonus', value: 0.15 },
        { type: 'prison_sentence_multiplier', value: 1.50 },
      ],
    },
    vision: 'darkvision',
    languages: ['catfolk', 'common'],
    loreSource: 'Stateless diaspora across Fortuna\'s trade routes and desert cities; ancestral oases lost to post-Atlas mana contamination; governed by the mobile Salt Court',
    iconPath: 'icons/characters/Animals/',
    baseSpeed: 12,
  },
};

// Racial innate traits: these effect types are biological/innate and cannot be traded
// to races that don't naturally have them. Cards with these effects CAN be traded
// between same-race players for upgraded/altered versions.
const RACIAL_INNATE_TRAITS = new Set([
  'tremor_sense', 'water_breathing', 'swim_no_mount', 'ocean_dive',
  'stone_skin', 'throwing_knives', 'unarmed_proficiency',
  'ritual_magic_access', 'poison_immunity',
]);

// Vision types that are innate (darkvision, thermal cannot be given to normal-vision races)
const RACIAL_VISION_TYPES = new Set(['darkvision', 'thermal']);

// ---------------------------------------------------------------------------
// Combat Resource Types (4-pool system)
// ---------------------------------------------------------------------------

const COMBAT_RESOURCES = {
  mana: {
    id: 'mana',
    name: 'Mana',
    description: 'Arcane energy channeled through study',
    color: '#4488ff',
    baseMax: 50,
    regenPerTurn: 3,
    regenType: 'passive', // regens every turn
    outOfCombatBonus: 2, // +2 extra regen out of combat
  },
  stamina: {
    id: 'stamina',
    name: 'Stamina',
    description: 'Physical endurance spent on power moves',
    color: '#44cc44',
    baseMax: 50,
    regenPerTurn: 2,
    regenType: 'passive', // slow but steady
    outOfCombatBonus: 0,
  },
  bloodlust: {
    id: 'bloodlust',
    name: 'Bloodlust',
    description: 'Predatory energy gained from combat aggression',
    color: '#cc2222',
    baseMax: 50,
    regenPerTurn: 0,
    regenType: 'on_aggression',
    onKillGain: 15,
    onHitGain: 3,           // NEW: +3 per attack that deals damage
    onTakeDamageGain: 2,    // NEW: +2 when taking damage
    decayPerTurn: 3,        // REDUCED from 5 to 3
    decayStartTurns: 2,     // NEW: decay only after 2 turns of inactivity
    outOfCombatBonus: 0,
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    description: 'Mental concentration that deepens with sustained engagement',
    color: '#cc88ff',
    baseMax: 50,
    regenPerTurn: 0,
    regenType: 'consecutive',
    consecutiveGain: 10,
    basicAttackGain: 5,        // NEW: basic attacks on same target grant 5
    onSwitchRetainBase: 0.25,  // NEW: base 25% retain on target switch
    startingFocus: 10,         // NEW: start combat with 10 focus
    outOfCombatBonus: 0,
  },
};

const RACE_PRIMARY_RESOURCE = {
  human: 'focus',
  elf: 'mana',
  orc: 'bloodlust',
  dwarf: 'stamina',
  gnome: 'mana',
  goblin: 'bloodlust',
  lizardfolk: 'focus',
  catfolk: 'stamina',
};

// Primary resource: 100% max + 10% racial bonus
// Secondary resources: 75% max capacity
const PRIMARY_RESOURCE_BONUS = 0.10;    // Primary: floor(50 * 1.10) = 55 (was 60)
const SECONDARY_RESOURCE_SCALE = 0.75;  // Secondary: floor(50 * 0.75) = 37 (was 25)

// ---------------------------------------------------------------------------
// Vision Types System — toggleable vision modes with gameplay effects
// ---------------------------------------------------------------------------

const VISION_TYPES = {
  normal: {
    name: 'Normal Vision',
    description: 'Standard vision. Cannot see hidden or invisible entities.',
    detectsStealth: false,
    detectsInvisible: false,
    darknessPenalty: true,
    range: 'standard',
    baseRange: 7,
    darkRange: 1,
    torchRange: 4,
    lanternRange: 6,
    manaCostPerTurn: 0,
    colorFilter: 'none',
  },
  thermal: {
    name: 'Thermal Vision',
    description: 'See heat signatures through walls and in darkness. Living creatures glow, undead are cold.',
    detectsStealth: true,
    detectsInvisible: false,
    detectsLiving: true,
    detectsUndead: false,
    darknessPenalty: false,
    wallPenetration: 1,
    range: 'medium',
    baseRange: 6,
    darkRange: 6,
    torchRange: 6,
    lanternRange: 6,
    wallRange: 1,
    manaCostPerTurn: 2,
    colorFilter: 'thermal',
  },
  tremor: {
    name: 'Tremor Sense',
    description: 'Detect vibrations in the ground. Moving entities are visible, stationary ones are not.',
    detectsStealth: true,
    detectsInvisible: true,
    detectsMoving: true,
    detectsStationary: false,
    darknessPenalty: false,
    detectsTraps: true,
    range: 'large',
    baseRange: 10,
    darkRange: 10,
    torchRange: 10,
    lanternRange: 10,
    manaCostPerTurn: 1,
    colorFilter: 'tremor',
  },
  night: {
    name: 'Night Vision',
    description: 'See clearly in darkness. Enhanced visibility range in dark dungeons.',
    detectsStealth: false,
    detectsInvisible: false,
    darknessPenalty: false,
    bonusInDarkness: true,
    darknessBonus: { accuracy: 0.15, crit: 0.10 },
    range: 'extended',
    baseRange: 7,
    darkRange: 9,
    torchRange: 9,
    lanternRange: 9,
    manaCostPerTurn: 1,
    colorFilter: 'night',
  },
  echolocation: {
    name: 'Echolocation',
    description: 'Emit sonar pulses that reveal all entities. Pulses fade between emissions.',
    detectsStealth: true,
    detectsInvisible: true,
    detectsLiving: true,
    detectsUndead: true,
    detectsTraps: true,
    darknessPenalty: false,
    wallPenetration: 2,
    range: 'large',
    baseRange: 8,
    darkRange: 8,
    torchRange: 8,
    lanternRange: 8,
    betweenPulseRange: 2,
    manaCostPerTurn: 3,
    colorFilter: 'echolocation',
    pulseBased: true,
    pulseInterval: 3,
    pulseDuration: 1,
  },
  magic_sense: {
    name: 'Magic Sense',
    description: 'Perceive magical auras and essence. Detect enchantments, curses, blessings, and magical entities.',
    detectsStealth: false,
    detectsInvisible: true,
    detectsMagic: true,
    detectsCurses: true,
    detectsBlessings: true,
    detectsCorruption: true,
    detectsHaunted: true,
    darknessPenalty: true,
    range: 'medium',
    baseRange: 5,
    darkRange: 3,
    torchRange: 5,
    lanternRange: 5,
    manaCostPerTurn: 2,
    colorFilter: 'magic_sense',
  },
  true_seeing: {
    name: 'True Seeing',
    description: 'See through all illusions, disguises, and deceptions. The ultimate magical perception.',
    detectsStealth: true,
    detectsInvisible: true,
    detectsMagic: true,
    detectsCurses: true,
    detectsBlessings: true,
    detectsCorruption: true,
    detectsHaunted: true,
    detectsIllusions: true,
    detectsDisguises: true,
    darknessPenalty: false,
    range: 'medium',
    baseRange: 6,
    darkRange: 6,
    torchRange: 6,
    lanternRange: 6,
    manaCostPerTurn: 4,
    colorFilter: 'true_seeing',
  },
};

function getAvailableVisionTypes(raceId, equippedCardEffects) {
  var available = ['normal'];
  var race = RACES[raceId];
  if (race) {
    if (race.vision === 'thermal' && available.indexOf('thermal') < 0) available.push('thermal');
    if (race.vision === 'darkvision' && available.indexOf('night') < 0) available.push('night');
    if (race.racialFeat && race.racialFeat.effects) {
      for (var i = 0; i < race.racialFeat.effects.length; i++) {
        if (race.racialFeat.effects[i].type === 'tremor_sense' && available.indexOf('tremor') < 0) {
          available.push('tremor');
        }
      }
    }
  }
  if (equippedCardEffects) {
    for (var j = 0; j < equippedCardEffects.length; j++) {
      var eff = equippedCardEffects[j];
      if (eff.type === 'grants_vision') {
        if (eff.value === 'all') {
          if (available.indexOf('thermal') < 0) available.push('thermal');
          if (available.indexOf('tremor') < 0) available.push('tremor');
          if (available.indexOf('night') < 0) available.push('night');
          if (available.indexOf('echolocation') < 0) available.push('echolocation');
          if (available.indexOf('magic_sense') < 0) available.push('magic_sense');
          if (available.indexOf('true_seeing') < 0) available.push('true_seeing');
        } else if (typeof eff.value === 'string') {
          if (VISION_TYPES[eff.value] && available.indexOf(eff.value) < 0) available.push(eff.value);
        } else if (Array.isArray(eff.value)) {
          for (var k = 0; k < eff.value.length; k++) {
            if (VISION_TYPES[eff.value[k]] && available.indexOf(eff.value[k]) < 0) available.push(eff.value[k]);
          }
        }
      }
      if (eff.type === 'transform' && eff.nightVision && available.indexOf('night') < 0) available.push('night');
    }
  }
  return available;
}

function visionPreventsAmbush(visionType) {
  if (!visionType || visionType === 'normal') return false;
  var vt = VISION_TYPES[visionType];
  if (!vt) return false;
  return vt.detectsStealth || vt.detectsInvisible || false;
}

function getVisionCombatBonuses(visionType, ambientLight) {
  if (!visionType || visionType === 'normal') return null;
  var vt = VISION_TYPES[visionType];
  if (!vt) return null;
  var bonuses = { accuracy: 0, crit: 0, detectsStealth: vt.detectsStealth || false, detectsInvisible: vt.detectsInvisible || false, preventsAmbush: vt.detectsStealth || vt.detectsInvisible || false };
  if (vt.bonusInDarkness && vt.darknessBonus && ambientLight < 0.4) {
    bonuses.accuracy += vt.darknessBonus.accuracy || 0;
    bonuses.crit += vt.darknessBonus.crit || 0;
  }
  return bonuses;
}

// Check if a card can be traded to a target race
function canTradeCardToRace(card, targetRaceId) {
  if (!card || !targetRaceId) return false;
  // Race-locked cards (e.g. lizardfolk ritual) can only go to that race
  if (card.raceLocked && card.raceLocked !== targetRaceId) return false;
  // Check for racial innate effects
  var targetRace = RACES[targetRaceId];
  if (!targetRace) return false;
  var targetEffectTypes = new Set();
  if (targetRace.racialFeat && targetRace.racialFeat.effects) {
    for (var i = 0; i < targetRace.racialFeat.effects.length; i++) {
      targetEffectTypes.add(targetRace.racialFeat.effects[i].type);
    }
  }
  // Check each card effect
  for (var j = 0; j < card.effects.length; j++) {
    var effType = card.effects[j].type;
    if (RACIAL_INNATE_TRAITS.has(effType) && !targetEffectTypes.has(effType)) {
      return false; // Target race doesn't have this innate trait
    }
  }
  return true;
}

// Race languages: each race starts with their native tongue(s).
// All races can learn additional languages over time through study/immersion.
const RACE_LANGUAGES = {};
const ALL_LANGUAGES = ['common', 'elvish', 'orcish', 'dwarvish', 'gnomish', 'goblin', 'draconic', 'catfolk'];
for (var raceId in RACES) {
  RACE_LANGUAGES[raceId] = RACES[raceId].languages || ['common'];
}

const RACE_IDS = Object.keys(RACES);

// ---------------------------------------------------------------------------
// Status Effect Categories (physical/mental/magical)
// Used for category-specific cleansing and resistance
// ---------------------------------------------------------------------------

const STATUS_EFFECT_CATEGORIES = {
  // Physical effects
  bleeding: 'physical',
  burning: 'physical',
  poisoned: 'physical',
  constricted: 'physical',
  corroded: 'physical',
  frozen: 'physical',
  chilled: 'physical',
  rooted: 'physical',
  knocked: 'physical',
  knockdown: 'physical',
  exhausted: 'physical',
  vulnerability_exposed: 'physical',
  wounded: 'physical',

  // Mental effects
  stunned: 'mental',
  feared: 'mental',
  confused: 'mental',
  slowed: 'mental',
  taunted: 'mental',
  charmed: 'mental',
  blinded: 'mental',
  silenced: 'mental',
  predators_mark: 'mental',

  // Magical effects
  cursed: 'magical',
  hexed: 'magical',
  mana_burned: 'magical',
  runic_mark: 'magical',
  shocked: 'magical',
  weakened: 'magical',
  drained: 'magical',
  petrified: 'magical',
};

/**
 * Get the category of a status effect by name.
 * Returns 'physical', 'mental', or 'magical'. Defaults to 'physical' for unknown effects.
 */
function getStatusEffectCategory(effectName) {
  return STATUS_EFFECT_CATEGORIES[effectName] || 'physical';
}

// ---------------------------------------------------------------------------
// RPG Stats System (7 primary stats)
// ---------------------------------------------------------------------------

const STAT_NAMES = {
  vigor: { abbr: 'VIG', name: 'Vigor', description: 'HP, stamina, poison resist, carry weight' },
  might: { abbr: 'MGT', name: 'Might', description: 'Melee damage, mining yield, harvest speed' },
  finesse: { abbr: 'FIN', name: 'Finesse', description: 'Crit chance, dodge, movement speed, fishing' },
  acumen: { abbr: 'ACU', name: 'Acumen', description: 'Magic power, XP gain bonus, crafting quality' },
  resolve: { abbr: 'RES', name: 'Resolve', description: 'Magic resist, debuff reduction, HP regen' },
  presence: { abbr: 'PRE', name: 'Presence', description: 'Trade prices, NPC favor, party buff radius' },
  ingenuity: { abbr: 'ING', name: 'Ingenuity', description: 'Crafting speed, cogworking yield, repair' },
};

const STAT_KEYS = Object.keys(STAT_NAMES);
const BASE_STAT_VALUE = 5;
const FREE_POINTS_AT_CREATION = 5;
const STAT_POINTS_PER_LEVELS = 3; // 1 stat point every 3 levels

function getDefaultStats() {
  return {
    vigor: BASE_STAT_VALUE,
    might: BASE_STAT_VALUE,
    finesse: BASE_STAT_VALUE,
    acumen: BASE_STAT_VALUE,
    resolve: BASE_STAT_VALUE,
    presence: BASE_STAT_VALUE,
    ingenuity: BASE_STAT_VALUE,
    freePoints: FREE_POINTS_AT_CREATION,
  };
}

function applyRaceBumps(stats, raceId) {
  var race = RACES[raceId];
  if (!race) return stats;
  var bumps = race.statBumps;
  for (var stat in bumps) {
    if (stats.hasOwnProperty(stat)) {
      stats[stat] = Math.max(1, stats[stat] + bumps[stat]);
    }
  }
  return stats;
}

// Stat effect formulas (race-aware: applies racial feat bonuses)
function computeStats(rpgStats, level, raceId) {
  var s = rpgStats || getDefaultStats();
  var lvl = level || 1;
  var race = raceId ? RACES[raceId] : null;
  var racialEffects = (race && race.racialFeat) ? race.racialFeat.effects : [];

  // Collect racial modifiers
  var hpMultiplier = 0;
  var bonusHpRegen = 0;
  var baseArmor = 0;
  var bonusStealth = 0;
  var stealthAttackBonus = 0;
  var lockpickingBonus = 0;
  var thieveryBonus = 0;
  var diplomaticBonus = 0;
  var automatonCrafting = false;
  var swimNoMount = false;
  var oceanDive = false;
  var waterBreathing = false;
  var throwingKnives = false;
  var tremorSense = null;
  var poisonImmunity = false;
  var poisonVulnerability = 0;
  var poisonResistance = 0;
  var coercionBonus = 0;
  var deceptionBonus = 0;
  var propertyCostReduction = 0;
  for (var i = 0; i < racialEffects.length; i++) {
    var eff = racialEffects[i];
    if (eff.type === 'hp_multiplier') hpMultiplier += eff.value;
    if (eff.type === 'hp_regen') bonusHpRegen += eff.value;
    if (eff.type === 'stone_skin') baseArmor += eff.armor;
    if (eff.type === 'stealth_bonus') bonusStealth += eff.value;
    if (eff.type === 'stealth_attack_bonus') stealthAttackBonus += eff.value;
    if (eff.type === 'lockpicking_bonus') lockpickingBonus += eff.value;
    if (eff.type === 'thievery_bonus') thieveryBonus += eff.value;
    if (eff.type === 'diplomacy_bonus') diplomaticBonus += eff.value;
    if (eff.type === 'automaton_crafting') automatonCrafting = true;
    if (eff.type === 'swim_no_mount') swimNoMount = true;
    if (eff.type === 'ocean_dive') oceanDive = true;
    if (eff.type === 'water_breathing') waterBreathing = true;
    if (eff.type === 'throwing_knives') throwingKnives = true;
    if (eff.type === 'tremor_sense') tremorSense = eff.range;
    if (eff.type === 'poison_immunity') poisonImmunity = true;
    if (eff.type === 'poison_vulnerability') poisonVulnerability += eff.value;
    if (eff.type === 'poison_resistance') poisonResistance += eff.value;
    if (eff.type === 'coercion_bonus') coercionBonus += eff.value;
    if (eff.type === 'deception_bonus') deceptionBonus += eff.value;
    if (eff.type === 'property_cost_reduction') propertyCostReduction += eff.value;
  }

  var baseHp = 50 + (s.vigor * 10) + (lvl * 5);

  return {
    hp: Math.round(baseHp * (1 + hpMultiplier)),
    meleeDamageMultiplier: 1 + s.might * 0.05,
    critChance: 0.02 + (s.finesse * 0.008),
    dodgeChance: 0.01 + (s.finesse * 0.005),
    magicPowerMultiplier: 1 + s.acumen * 0.06,
    xpBonus: 1 + (s.acumen * 0.01),
    magicResist: s.resolve * 0.03,
    tradePriceBonus: s.presence * 0.02 + diplomaticBonus,
    craftSpeedBonus: 1 + (s.ingenuity * 0.03),
    movementSpeedBonus: 1 + (s.finesse * 0.005),
    harvestSpeedBonus: 1 + (s.might * 0.02),
    miningYieldBonus: 1 + (s.might * 0.01),
    hpRegen: s.resolve * 0.5 + bonusHpRegen,
    baseArmor: baseArmor,
    stealth: bonusStealth,
    stealthAttackBonus: stealthAttackBonus,
    lockpickingBonus: lockpickingBonus,
    thieveryBonus: thieveryBonus,
    swimNoMount: swimNoMount,
    oceanDive: oceanDive,
    waterBreathing: waterBreathing,
    automatonCrafting: automatonCrafting,
    throwingKnives: throwingKnives,
    vision: race ? race.vision : 'normal',
    tremorSense: tremorSense,
    poisonImmunity: poisonImmunity,
    poisonVulnerability: poisonVulnerability,
    poisonResistance: poisonResistance,
    coercionBonus: coercionBonus,
    deceptionBonus: deceptionBonus,
    propertyCostReduction: propertyCostReduction,
  };
}

// ---------------------------------------------------------------------------
// Skills (extends existing mining, woodcutting)
// ---------------------------------------------------------------------------

const SKILL_DEFINITIONS = {
  mining: { name: 'Mining', icon: 'skills/Blacksmith/', category: 'gathering' },
  woodcutting: { name: 'Woodcutting', icon: 'skills/Blacksmith/', category: 'gathering' },
  farming: { name: 'Farming', icon: 'skills/Herbalism/', category: 'gathering' },
  fishing: { name: 'Fishing', icon: 'skills/Cooking_fishing/', category: 'gathering' },
  cooking: { name: 'Cooking', icon: 'skills/Cooking_fishing/', category: 'crafting' },
  glassworking: { name: 'Glassworking', icon: 'skills/Alchemy/', category: 'crafting' },
  crafting: { name: 'Crafting', icon: 'skills/Blacksmith/', category: 'crafting' },
  sewing: { name: 'Sewing', icon: 'skills/Blacksmith/', category: 'crafting' },
  cogworking: { name: 'Cogworking', icon: 'skills/Engineering/', category: 'crafting' },
  magic: { name: 'Magic', icon: 'skills/Enchantment/', category: 'combat' },
  magic_elemental: { name: 'Elemental Magic', icon: 'skills/Enchantment/', category: 'combat' },
  magic_arcane: { name: 'Arcane Magic', icon: 'skills/Enchantment/', category: 'combat' },
  magic_divine: { name: 'Divine Magic', icon: 'skills/Enchantment/', category: 'combat' },
  magic_shadow: { name: 'Shadow Magic', icon: 'skills/Enchantment/', category: 'combat' },
  melee: { name: 'Melee', icon: 'skills/Skill_SwordAttack.PNG', category: 'combat' },
  melee_blade: { name: 'Blade', icon: 'skills/Skill_SwordAttack.PNG', category: 'combat' },
  melee_blunt: { name: 'Blunt', icon: 'skills/Skill_SwordAttack.PNG', category: 'combat' },
  melee_martial: { name: 'Martial Arts', icon: 'skills/Skill_SwordAttack.PNG', category: 'combat' },
  archery: { name: 'Archery', icon: 'skills/Skill_SwordAttack.PNG', category: 'combat' },
  lockpicking: { name: 'Lockpicking', icon: 'skills/Enchantment/', category: 'rogue' },
  thievery: { name: 'Thievery', icon: 'skills/Enchantment/', category: 'rogue' },
  coercion: { name: 'Coercion', icon: 'skills/Enchantment/', category: 'social' },
  deception: { name: 'Deception', icon: 'skills/Enchantment/', category: 'social' },
  // Dungeon exploration skills
  dungeon_dwelling: { name: 'Dungeon Dwelling', icon: 'skills/Enchantment/', category: 'exploration' },
  dungeon_delving: { name: 'Dungeon Delving', icon: 'skills/Enchantment/', category: 'exploration' },
  ritual_magic: { name: 'Ritual Magic', icon: 'skills/Enchantment/', category: 'combat', raceLocked: 'lizardfolk' },
  ritual_water: { name: 'Water Rituals', icon: 'skills/Enchantment/', category: 'combat', raceLocked: 'lizardfolk' },
  ritual_blood: { name: 'Blood Rituals', icon: 'skills/Enchantment/', category: 'combat', raceLocked: 'lizardfolk' },
  // Death/Life magic tree
  necromancy: { name: 'Necromancy', icon: 'skills/Enchantment/', category: 'combat' },
  life_magic: { name: 'Life Magic', icon: 'skills/Skill_Heal.PNG', category: 'combat' },
  // Crafting expansions
  alchemy: { name: 'Alchemy', icon: 'skills/Alchemy/', category: 'crafting' },
  enchanting: { name: 'Enchanting', icon: 'skills/Enchantment/', category: 'crafting' },
  leatherworking: { name: 'Leatherworking', icon: 'skills/Blacksmith/', category: 'crafting' },
  brewing: { name: 'Brewing', icon: 'skills/Cooking_fishing/', category: 'crafting' },
  carpentry: { name: 'Carpentry', icon: 'skills/Blacksmith/', category: 'crafting' },
  jewelcrafting: { name: 'Jewelcrafting', icon: 'skills/Blacksmith/', category: 'crafting' },
  // Gathering expansions
  skinning: { name: 'Skinning', icon: 'skills/Blacksmith/', category: 'gathering' },
  herbalism: { name: 'Herbalism', icon: 'skills/Herbalism/', category: 'gathering' },
  foraging: { name: 'Foraging', icon: 'skills/Herbalism/', category: 'gathering' },
  // Unique/interesting PG-inspired
  animal_handling: { name: 'Animal Handling', icon: 'skills/Herbalism/', category: 'combat' },
  psychology: { name: 'Psychology & Bardic', icon: 'skills/Enchantment/', category: 'combat' },
  weather_magic: { name: 'Weather Magic', icon: 'skills/Enchantment/', category: 'combat' },
  transmutation: { name: 'Transmutation', icon: 'skills/Alchemy/', category: 'crafting' },
  sigil_scripting: { name: 'Sigil Scripting', icon: 'skills/Enchantment/', category: 'crafting' },
  survival: { name: 'Survival', icon: 'skills/Blacksmith/', category: 'exploration' },
  gourmand: { name: 'Gourmand', icon: 'skills/Cooking_fishing/', category: 'social' },
  anatomy: { name: 'Anatomy', icon: 'skills/Herbalism/', category: 'exploration' },
};

function getDefaultSkills() {
  var skills = {};
  for (var key in SKILL_DEFINITIONS) {
    if (!SKILL_DEFINITIONS[key].raceLocked) {
      skills[key] = { level: 1, xp: 0 };
    }
  }
  return skills;
}

function getSkillsForRace(raceId) {
  var skills = getDefaultSkills();
  for (var key in SKILL_DEFINITIONS) {
    if (SKILL_DEFINITIONS[key].raceLocked === raceId) {
      skills[key] = { level: 1, xp: 0 };
    }
  }
  return skills;
}

// ---------------------------------------------------------------------------
// Resource Types (extends existing wood, stone, iron_ore, iron_bar)
// ---------------------------------------------------------------------------

const ALL_RESOURCE_TYPES = [
  'wood', 'stone', 'iron_ore', 'iron_bar',
  'bronze_ore', 'bronze_bar',
  'copper_ore', 'copper_bar',
  'silver_ore', 'silver_bar',
  'gold_ore', 'gold_bar',
  'steel_bar',
  'mithril_ore', 'mithril_bar',
  'fish', 'cooked_fish', 'shellfish', 'seaweed',
  'wheat', 'herbs', 'vegetables', 'mushroom',
  'bread', 'stew',
  'glass_sand', 'glass', 'glass_lens', 'glass_vial',
  'cogs', 'gears', 'springs', 'clockwork_core',
  'mana_crystal',
  'gem_rough', 'gem_cut',
  'potion_health', 'potion_mana',
  // Dungeon resources
  'dungeon_essence', 'dark_crystal', 'boss_trophy',
  // Light sources
  'torch', 'lantern', 'oil',
  // Leviathan resources
  'leviathan_scale', 'leviathan_shell', 'leviathan_heart', 'leviathan_fang',
  'kraken_ink', 'kraken_beak', 'serpent_fang', 'storm_scale',
  'ancient_coral', 'coral_trophy', 'lightning_essence', 'sea_mount_egg',
  // Sewing / tailoring resources
  'hide', 'leather', 'wool', 'thread', 'cloth', 'silk', 'silk_cloth',
  // Alchemy products
  'potion_strength', 'potion_agility', 'potion_intellect', 'potion_resistance', 'potion_speed',
  'elixir_vigor', 'elixir_fortitude',
  'poison_vial', 'antidote',
  'flask_of_fire', 'flask_of_frost',
  'transmutation_dust', 'philosophers_stone_shard',
  // Enchanting products
  'scroll_of_protection', 'scroll_of_strength', 'scroll_of_haste',
  'rune_stone_fire', 'rune_stone_ice', 'rune_stone_lightning',
  'enchantment_shard', 'arcane_essence', 'sigil_ink',
  // Brewing products
  'ale', 'mead', 'wine', 'spirits', 'fortified_ale', 'battle_brew',
  // Corruption cleansing
  'purification_crystal',
  // Advanced materials (loot-generator)
  'stormsteel_ore', 'stormsteel_bar',
  'deepsilver_ore', 'deepsilver_bar',
  'soulforged_bar',
  'voidmetal_ore', 'voidmetal_bar',
  // Gem resources (cut gems for socketing)
  'ruby', 'emerald', 'sapphire', 'topaz', 'amethyst',
  'diamond', 'onyx', 'opal', 'moonstone',
  'jade', 'bloodstone', 'void_shard',
  // Augment resources
  'coiled_spring', 'barbed_edge', 'resonant_core', 'clockwork_sight',
  'venom_reservoir', 'mana_conduit',
  'reactive_plating', 'sigil_ward', 'dampening_weave', 'thorned_plates', 'vitality_mesh',
];

// ---------------------------------------------------------------------------
// Card Rarity Tiers
// ---------------------------------------------------------------------------

const RARITY_TIERS = [
  { id: 'common',      name: 'Common',      weight: 4500, color: '#888888', order: 0 },
  { id: 'uncommon',    name: 'Uncommon',     weight: 2500, color: '#22cc22', order: 1 },
  { id: 'rare',        name: 'Rare',         weight: 1500, color: '#3388ff', order: 2 },
  { id: 'ultra_rare',  name: 'Ultra Rare',   weight: 800,  color: '#aa44ff', order: 3 },
  { id: 'mythic_rare', name: 'Mythic Rare',  weight: 400,  color: '#ffaa00', order: 4 },
  { id: 'legendary',   name: 'Legendary',    weight: 200,  color: '#ff6600', order: 5 },
  { id: 'godly',       name: 'Godly',        weight: 80,   color: '#ff0000', order: 6 },
  { id: 'relic',       name: 'Relic',        weight: 20,   color: '#ffffff', order: 7 },
];

const RARITY_BY_ID = {};
for (var ri = 0; ri < RARITY_TIERS.length; ri++) {
  RARITY_BY_ID[RARITY_TIERS[ri].id] = RARITY_TIERS[ri];
}

var TOTAL_RARITY_WEIGHT = 0;
for (var rw = 0; rw < RARITY_TIERS.length; rw++) {
  TOTAL_RARITY_WEIGHT += RARITY_TIERS[rw].weight;
}

// Pity counter constants
var SOFT_PITY_START = 80;   // Start increasing Legendary+ rates at 80 pulls
var HARD_PITY = 120;        // Guaranteed Legendary at 120 pulls
var SOFT_PITY_RATE = 0.02;  // +2% Legendary chance per pull beyond soft pity

function rollRarity(isCatFolk, pity) {
  pity.pullsSinceLegendary++;

  // Hard pity: guaranteed Legendary at 120 pulls
  if (pity.pullsSinceLegendary >= HARD_PITY) {
    pity.pullsSinceLegendary = 0;
    return RARITY_TIERS[5]; // legendary
  }

  var roll = Math.random() * TOTAL_RARITY_WEIGHT;
  var cumulative = 0;
  var result = RARITY_TIERS[0];

  // Soft pity: boost Legendary+ chance after 80 pulls
  var pityBoost = 0;
  if (pity.pullsSinceLegendary > SOFT_PITY_START) {
    pityBoost = (pity.pullsSinceLegendary - SOFT_PITY_START) * SOFT_PITY_RATE;
  }

  for (var i = 0; i < RARITY_TIERS.length; i++) {
    cumulative += RARITY_TIERS[i].weight;
    if (roll < cumulative) {
      result = RARITY_TIERS[i];
      break;
    }
  }

  // Apply soft pity: chance to bump to Legendary
  if (pityBoost > 0 && result.order < 5) {
    if (Math.random() < pityBoost) {
      result = RARITY_TIERS[5]; // legendary
    }
  }

  // Cat Folk bonus: 12% chance to bump rarity up one tier (reduced from 20%)
  if (isCatFolk && result.order < RARITY_TIERS.length - 1) {
    if (Math.random() < 0.12) {
      result = RARITY_TIERS[result.order + 1];
    }
  }

  // Reset pity on Legendary or higher
  if (result.order >= 5) {
    pity.pullsSinceLegendary = 0;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Card Types
// ---------------------------------------------------------------------------

const CARD_TYPES = {
  stat_boost: 'stat_boost',
  skill_boost: 'skill_boost',
  passive_perk: 'passive_perk',
  active_ability: 'active_ability',
  racial_feat: 'racial_feat',
  gathering_boost: 'gathering_boost',
  equipment_modifier: 'equipment_modifier',
  reactive: 'reactive',
};

// ---------------------------------------------------------------------------
// Card Template Database (~50 initial cards)
// ---------------------------------------------------------------------------

const CARD_TEMPLATES = [
  // ── Stat Boost Cards (Common-Rare) ──
  { cardId: 'vigor_I', name: '+1 Vigor', type: 'stat_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'vigor', value: 1 }], icon: 'skills/Enchantment/' },
  { cardId: 'vigor_II', name: '+2 Vigor', type: 'stat_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'vigor', value: 2 }], icon: 'skills/Enchantment/' },
  { cardId: 'vigor_III', name: '+3 Vigor', type: 'stat_boost', rarity: 'rare', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'vigor', value: 3 }], icon: 'skills/Enchantment/' },
  { cardId: 'might_I', name: '+1 Might', type: 'stat_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'might', value: 1 }], icon: 'skills/Enchantment/' },
  { cardId: 'might_II', name: '+2 Might', type: 'stat_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'might', value: 2 }], icon: 'skills/Enchantment/' },
  { cardId: 'might_III', name: '+3 Might', type: 'stat_boost', rarity: 'rare', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'might', value: 3 }], icon: 'skills/Enchantment/' },
  { cardId: 'finesse_I', name: '+1 Finesse', type: 'stat_boost', rarity: 'common', archetype: 'utility', tags: ['stealth'], effects: [{ type: 'stat_boost', stat: 'finesse', value: 1 }], icon: 'skills/Enchantment/' },
  { cardId: 'finesse_II', name: '+2 Finesse', type: 'stat_boost', rarity: 'uncommon', archetype: 'utility', tags: ['stealth'], effects: [{ type: 'stat_boost', stat: 'finesse', value: 2 }], icon: 'skills/Enchantment/' },
  { cardId: 'finesse_III', name: '+3 Finesse', type: 'stat_boost', rarity: 'rare', archetype: 'utility', tags: ['stealth'], effects: [{ type: 'stat_boost', stat: 'finesse', value: 3 }], icon: 'skills/Enchantment/' },
  { cardId: 'acumen_I', name: '+1 Acumen', type: 'stat_boost', rarity: 'common', archetype: 'utility', tags: ['magic'], effects: [{ type: 'stat_boost', stat: 'acumen', value: 1 }], icon: 'skills/Enchantment/' },
  { cardId: 'acumen_II', name: '+2 Acumen', type: 'stat_boost', rarity: 'uncommon', archetype: 'utility', tags: ['magic'], effects: [{ type: 'stat_boost', stat: 'acumen', value: 2 }], icon: 'skills/Enchantment/' },
  { cardId: 'acumen_III', name: '+3 Acumen', type: 'stat_boost', rarity: 'rare', archetype: 'utility', tags: ['magic'], effects: [{ type: 'stat_boost', stat: 'acumen', value: 3 }], icon: 'skills/Enchantment/' },
  { cardId: 'resolve_I', name: '+1 Resolve', type: 'stat_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'resolve', value: 1 }], icon: 'skills/Enchantment/' },
  { cardId: 'resolve_II', name: '+2 Resolve', type: 'stat_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'resolve', value: 2 }], icon: 'skills/Enchantment/' },
  { cardId: 'presence_I', name: '+1 Presence', type: 'stat_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'presence', value: 1 }], icon: 'skills/Enchantment/' },
  { cardId: 'presence_II', name: '+2 Presence', type: 'stat_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'presence', value: 2 }], icon: 'skills/Enchantment/' },
  { cardId: 'ingenuity_I', name: '+1 Ingenuity', type: 'stat_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'ingenuity', value: 1 }], icon: 'skills/Enchantment/' },
  { cardId: 'ingenuity_II', name: '+2 Ingenuity', type: 'stat_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'stat_boost', stat: 'ingenuity', value: 2 }], icon: 'skills/Enchantment/' },

  // ── Skill Boost Cards ──
  { cardId: 'mining_xp_I', name: '+10% Mining XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'mining', value: 0.10 }], icon: 'skills/Blacksmith/' },
  { cardId: 'mining_xp_II', name: '+20% Mining XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'mining', value: 0.20 }], icon: 'skills/Blacksmith/' },
  { cardId: 'woodcutting_xp_I', name: '+10% Woodcutting XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'woodcutting', value: 0.10 }], icon: 'skills/Blacksmith/' },
  { cardId: 'farming_xp_I', name: '+10% Farming XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'farming', value: 0.10 }], icon: 'skills/Herbalism/' },
  { cardId: 'fishing_xp_I', name: '+10% Fishing XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'fishing', value: 0.10 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'magic_xp_I', name: '+10% Magic XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', tags: ['magic'], effects: [{ type: 'xp_bonus_skill', skill: 'magic', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'melee_xp_I', name: '+10% Melee XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'melee', value: 0.10 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'cooking_xp_I', name: '+10% Cooking XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'cooking', value: 0.10 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'cogworking_xp_I', name: '+10% Cogworking XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'cogworking', value: 0.10 }], icon: 'skills/Engineering/' },

  // ── Passive Perk Cards ──
  { cardId: 'hp_regen_I', name: 'HP Regen +1/s', type: 'passive_perk', rarity: 'uncommon', archetype: 'pure_defense', effects: [{ type: 'hp_regen', value: 3 }], icon: 'skills/Enchantment/', combatPassive: { type: 'hp_regen', value: 3 } },
  { cardId: 'hp_regen_II', name: 'HP Regen +2/s', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense', effects: [{ type: 'hp_regen', value: 5 }], icon: 'skills/Enchantment/', combatPassive: { type: 'hp_regen', value: 5 } },
  { cardId: 'poison_immune', name: 'Poison Immunity', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'pure_defense', effects: [{ type: 'immunity', element: 'poison' }], icon: 'skills/Enchantment/', combatPassive: { type: 'immunity', element: 'poison' } },
  { cardId: 'speed_boost_I', name: '+5% Movement Speed', type: 'passive_perk', rarity: 'common', archetype: 'scout', tags: ['stealth'], effects: [{ type: 'speed_bonus', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'speed_boost_II', name: '+10% Movement Speed', type: 'passive_perk', rarity: 'uncommon', archetype: 'scout', tags: ['stealth'], effects: [{ type: 'speed_bonus', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'crit_boost_I', name: '+3% Crit Chance', type: 'passive_perk', rarity: 'uncommon', archetype: 'melee_dps', tags: ['stealth', 'luck'], effects: [{ type: 'crit_bonus', value: 0.03 }], icon: 'skills/Enchantment/' },
  { cardId: 'crit_boost_II', name: '+6% Crit Chance', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps', tags: ['stealth', 'luck'], effects: [{ type: 'crit_bonus', value: 0.06 }], icon: 'skills/Enchantment/' },
  { cardId: 'dodge_boost_I', name: '+3% Dodge', type: 'passive_perk', rarity: 'uncommon', archetype: 'scout', tags: ['stealth', 'luck'], effects: [{ type: 'dodge_bonus', value: 0.03 }], icon: 'skills/Enchantment/' },
  { cardId: 'magic_resist_I', name: '+5% Magic Resist', type: 'passive_perk', rarity: 'uncommon', archetype: 'pure_defense', tags: ['magic'], effects: [{ type: 'magic_resist', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'carry_weight_I', name: '+20 Carry Weight', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'carry_weight', value: 20 }], icon: 'skills/Blacksmith/' },

  // ── Active Ability Cards ──
  { cardId: 'fireball_I', name: 'Fireball I', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], tags: ['magic'], effects: [{ type: 'damage', element: 'fire', base: 25, scaling: 'acumen', factor: 0.5, cooldown: 30 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'fire', baseDamage: 25, range: 5, manaCost: 15, aoeRadius: 1, cooldown: 3, scalingStat: 'acumen', scalingFactor: 0.5, onHitTile: 'BURNING', targetType: 'enemy' },
  { cardId: 'fireball_II', name: 'Fireball II', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], tags: ['magic'], effects: [{ type: 'damage', element: 'fire', base: 50, scaling: 'acumen', factor: 0.7, cooldown: 25 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'fire', baseDamage: 50, range: 5, manaCost: 25, aoeRadius: 2, cooldown: 4, scalingStat: 'acumen', scalingFactor: 0.7, onHitTile: 'BURNING', targetType: 'enemy' },
  { cardId: 'heal_self_I', name: 'Heal Self I', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'heal', base: 20, scaling: 'resolve', factor: 0.3, cooldown: 20 }], icon: 'skills/Enchantment/', combatType: 'healing', baseHeal: 20, range: 0, manaCost: 10, aoeRadius: 0, cooldown: 3, scalingStat: 'resolve', scalingFactor: 0.3, targetType: 'self' },
  { cardId: 'heal_self_II', name: 'Heal Self II', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'heal', base: 40, scaling: 'resolve', factor: 0.5, cooldown: 18 }], icon: 'skills/Enchantment/', combatType: 'healing', baseHeal: 40, range: 0, manaCost: 14, aoeRadius: 0, cooldown: 3, scalingStat: 'resolve', scalingFactor: 0.5, targetType: 'self' },
  { cardId: 'lightning_bolt', name: 'Lightning Bolt', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', tags: ['magic'], effects: [{ type: 'damage', element: 'lightning', base: 35, scaling: 'acumen', factor: 0.6, cooldown: 25 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'lightning', baseDamage: 35, range: 6, manaCost: 20, aoeRadius: 0, cooldown: 3, scalingStat: 'acumen', scalingFactor: 0.6, onHitTile: 'ELECTRIFIED', targetType: 'enemy' },
  { cardId: 'ice_shard', name: 'Ice Shard', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'glass_cannon', tags: ['magic'], effects: [{ type: 'damage', element: 'ice', base: 15, scaling: 'acumen', factor: 0.4, cooldown: 15 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'ice', baseDamage: 15, range: 4, manaCost: 8, aoeRadius: 0, cooldown: 2, scalingStat: 'acumen', scalingFactor: 0.4, onHitTile: 'FROZEN', targetType: 'enemy' },
  { cardId: 'shadow_strike', name: 'Shadow Strike', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['glass_cannon'], tags: ['magic'], effects: [{ type: 'damage', element: 'shadow', base: 30, scaling: 'finesse', factor: 0.5, cooldown: 20 }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'dark', baseDamage: 30, range: 1, manaCost: 12, aoeRadius: 0, cooldown: 2, scalingStat: 'finesse', scalingFactor: 0.5, targetType: 'enemy' },

  // ── Racial Feat Cards (any race can use, bonus if matching) ──
  { cardId: 'elven_grace', name: 'Elven Grace', type: 'racial_feat', rarity: 'ultra_rare', archetype: 'glass_cannon', raceBonus: 'elf', tags: ['magic'], effects: [{ type: 'xp_bonus_skill', skill: 'magic', value: 0.20, raceValue: 0.30 }], icon: 'skills/Enchantment/' },
  { cardId: 'orcish_fury', name: 'Orcish Fury', type: 'racial_feat', rarity: 'ultra_rare', archetype: 'melee_dps', raceBonus: 'orc', effects: [{ type: 'melee_damage_bonus', value: 0.15, raceValue: 0.25 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'dwarven_endurance', name: 'Dwarven Endurance', type: 'racial_feat', rarity: 'ultra_rare', archetype: 'tank', raceBonus: 'dwarf', effects: [{ type: 'hp_bonus', value: 30, raceValue: 50 }], icon: 'skills/Blacksmith/' },

  // ── Gathering Boost Cards ──
  { cardId: 'double_ore', name: 'Double Ore', type: 'gathering_boost', rarity: 'rare', archetype: 'utility', tags: ['luck'], effects: [{ type: 'double_gather', skill: 'mining', chance: 0.05 }], icon: 'skills/Blacksmith/' },
  { cardId: 'double_wood', name: 'Double Wood', type: 'gathering_boost', rarity: 'rare', archetype: 'utility', tags: ['luck'], effects: [{ type: 'double_gather', skill: 'woodcutting', chance: 0.05 }], icon: 'skills/Blacksmith/' },
  { cardId: 'bountiful_harvest', name: 'Bountiful Harvest', type: 'gathering_boost', rarity: 'uncommon', archetype: 'utility', tags: ['luck'], effects: [{ type: 'gather_bonus', value: 0.10 }], icon: 'skills/Herbalism/' },

  // ── Equipment Modifier Cards ──
  { cardId: 'flaming_weapon', name: 'Flaming Weapon', type: 'equipment_modifier', rarity: 'rare', archetype: 'melee_dps', effects: [{ type: 'weapon_element', element: 'fire', bonusDamage: 5 }], icon: 'skills/Skill_Explosion.PNG', combatWeapon: { bonusDamage: 5, element: 'fire', onHitTileChance: 0.10, onHitTile: 'BURNING', onHitStatusChance: 0.15, onHitStatus: { name: 'burning', duration: 2, tickDamage: 3, type: 'debuff' } } },
  { cardId: 'frost_weapon', name: 'Frost Weapon', type: 'equipment_modifier', rarity: 'rare', archetype: 'melee_dps', effects: [{ type: 'weapon_element', element: 'ice', bonusDamage: 4, slowChance: 0.10 }], icon: 'skills/Enchantment/', combatWeapon: { bonusDamage: 4, element: 'ice', onHitTileChance: 0.10, onHitTile: 'FROZEN', onHitStatusChance: 0.15, onHitStatus: { name: 'chilled', duration: 2, speedMult: 0.7, type: 'debuff' } } },

  // ── Stealth / Rogue Cards ──
  { cardId: 'backstab_I', name: 'Backstab I', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['melee_dps'], tags: ['stealth'], effects: [{ type: 'damage', element: 'physical', base: 20, scaling: 'finesse', factor: 0.6, cooldown: 15, requiresStealth: true }], icon: 'skills/Enchantment/', combatType: 'damage', baseDamage: 20, range: 1, manaCost: 5, aoeRadius: 0, cooldown: 2, scalingStat: 'finesse', scalingFactor: 0.6, targetType: 'enemy' },
  { cardId: 'backstab_II', name: 'Backstab II', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['melee_dps'], tags: ['stealth'], effects: [{ type: 'damage', element: 'physical', base: 40, scaling: 'finesse', factor: 0.8, cooldown: 12, requiresStealth: true }], icon: 'skills/Enchantment/', combatType: 'damage', baseDamage: 40, range: 1, manaCost: 8, aoeRadius: 0, cooldown: 2, scalingStat: 'finesse', scalingFactor: 0.8, targetType: 'enemy' },
  { cardId: 'smoke_bomb', name: 'Smoke Bomb', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['scout'], tags: ['stealth'], effects: [{ type: 'stealth_enter', duration: 8, cooldown: 30 }], icon: 'skills/Enchantment/', combatType: 'tile_effect', tileEffect: 'SMOKE', range: 4, manaCost: 15, aoeRadius: 1, cooldown: 4, targetType: 'any' },
  { cardId: 'poison_blade', name: 'Poison Blade', type: 'equipment_modifier', rarity: 'rare', archetype: 'assassin', archetypeSecondary: ['cc_dot'], tags: ['stealth'], effects: [{ type: 'weapon_element', element: 'poison', bonusDamage: 5, dotDamage: 4, dotDuration: 5 }], icon: 'skills/Enchantment/', combatWeapon: { bonusDamage: 5, element: 'poison', onHitStatusChance: 0.20, onHitStatus: { name: 'poisoned', duration: 3, tickDamage: 4, type: 'debuff' } } },
  { cardId: 'shadow_cloak', name: 'Shadow Cloak', type: 'passive_perk', rarity: 'uncommon', archetype: 'assassin', archetypeSecondary: ['scout'], tags: ['stealth'], effects: [{ type: 'stealth_bonus', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'lockmaster', name: 'Lockmaster', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', tags: ['stealth'], effects: [{ type: 'lockpicking_bonus', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'pickpocket', name: 'Pickpocket', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['stealth'], effects: [{ type: 'thievery_bonus', value: 0.15 }, { type: 'steal_chance', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'evasion_master', name: 'Evasion Master', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'scout', archetypeSecondary: ['assassin'], tags: ['stealth'], effects: [{ type: 'dodge_bonus', value: 0.08 }, { type: 'speed_bonus', value: 0.05 }], icon: 'skills/Enchantment/' },

  // === CRIME / UNDERWORLD ACTIVE ABILITIES ===
  { cardId: 'pickpocket_strike', name: 'Pickpocket Strike', type: 'active_ability', rarity: 'uncommon', archetype: 'assassin',
    tags: ['stealth', 'crime'],
    description: 'A deft strike that steals coins from the target while dealing light damage',
    resourceType: 'focus',
    combatType: 'damage', baseDamage: 10, range: 1, manaCost: 8, aoeRadius: 0, cooldown: 2,
    scalingStat: 'finesse', scalingFactor: 0.3, stealGold: true, stealGoldPercent: 0.15, targetType: 'enemy',
    effects: [{ type: 'gold_steal_chance', value: 0.15, description: '+15% gold steal on hit' }],
    icon: 'skills/Enchantment/' },
  { cardId: 'dirty_tricks', name: 'Dirty Tricks', type: 'active_ability', rarity: 'uncommon', archetype: 'assassin',
    tags: ['stealth', 'crime'],
    description: 'Throw sand, flash powder, or caltrops — blinding and slowing the target',
    resourceType: 'focus',
    combatType: 'debuff', range: 3, manaCost: 10, aoeRadius: 0, cooldown: 3,
    statusEffect: 'blinded', statusDuration: 2, secondaryStatus: { name: 'slowed', duration: 2, speedMult: 0.5 }, targetType: 'enemy',
    effects: [{ type: 'debuff_duration_bonus', value: 0.1, description: '+10% debuff duration' }],
    icon: 'skills/Enchantment/' },
  { cardId: 'garrote', name: 'Garrote', type: 'active_ability', rarity: 'rare', archetype: 'assassin',
    tags: ['stealth', 'crime'],
    description: 'Silently choke the target from behind, dealing heavy damage and silencing them. Requires stealth.',
    resourceType: 'focus',
    combatType: 'damage', baseDamage: 35, range: 1, manaCost: 14, aoeRadius: 0, cooldown: 4,
    scalingStat: 'finesse', scalingFactor: 0.6, requiresStealth: true, bonusFromStealth: 1.5,
    onHitStatus: { name: 'silenced', duration: 2, type: 'debuff' }, targetType: 'enemy',
    effects: [{ type: 'stealth_damage_bonus', value: 0.15, description: '+15% damage from stealth' }],
    icon: 'skills/Enchantment/' },
  { cardId: 'shakedown', name: 'Shakedown', type: 'active_ability', rarity: 'rare', archetype: 'assassin',
    tags: ['stealth', 'crime'],
    description: 'Intimidate a weakened enemy into dropping extra loot. Deals moderate damage and increases gold drop.',
    resourceType: 'focus',
    combatType: 'damage', baseDamage: 20, range: 1, manaCost: 12, aoeRadius: 0, cooldown: 3,
    scalingStat: 'presence', scalingFactor: 0.5, bonusGoldOnKill: 0.50, targetType: 'enemy',
    effects: [{ type: 'gold_drop_bonus', value: 0.10, description: '+10% gold drops' }],
    icon: 'skills/Enchantment/' },
  { cardId: 'marked_for_death', name: 'Marked for Death', type: 'active_ability', rarity: 'ultra_rare', archetype: 'assassin',
    tags: ['stealth', 'crime'],
    description: 'Place a death mark on the target. All damage against the marked target is increased by 25% for 3 turns.',
    resourceType: 'focus',
    combatType: 'debuff', range: 5, manaCost: 18, aoeRadius: 0, cooldown: 5,
    statusEffect: 'marked_for_death', statusDuration: 3, damageAmplify: 0.25, targetType: 'enemy',
    effects: [{ type: 'damage_amplify', value: 0.05, description: '+5% damage vs debuffed enemies' }],
    icon: 'skills/Enchantment/' },
  { cardId: 'escape_route', name: 'Escape Route', type: 'active_ability', rarity: 'rare', archetype: 'scout',
    tags: ['stealth', 'crime'],
    description: 'Break free from all movement-impairing effects and dash 3 tiles away, gaining brief stealth',
    resourceType: 'focus',
    combatType: 'movement', range: 0, manaCost: 12, aoeRadius: 0, cooldown: 4,
    cleansesRoots: true, dashDistance: 3, grantsStealthDuration: 1, targetType: 'self',
    effects: [{ type: 'movement_speed_bonus', value: 0.05, description: '+5% movement speed' }],
    icon: 'skills/Enchantment/' },
  { cardId: 'knife_fan', name: 'Knife Fan', type: 'active_ability', rarity: 'rare', archetype: 'assassin',
    tags: ['stealth', 'crime'],
    description: 'Fling a spread of throwing knives in a cone, dealing physical damage to all enemies hit',
    resourceType: 'focus',
    combatType: 'damage', element: 'physical', baseDamage: 18, range: 3, manaCost: 14, aoeRadius: 0, cooldown: 3,
    scalingStat: 'finesse', scalingFactor: 0.5, coneAttack: true, coneWidth: 3, targetType: 'enemy',
    effects: [{ type: 'aoe_damage_bonus', value: 0.08, description: '+8% AoE damage' }],
    icon: 'skills/Enchantment/' },
  { cardId: 'blackmail', name: 'Blackmail', type: 'active_ability', rarity: 'ultra_rare', archetype: 'assassin',
    tags: ['crime'],
    description: 'Use leverage to turn an enemy against their allies for 2 turns. The target attacks its nearest ally instead.',
    resourceType: 'focus',
    combatType: 'debuff', range: 4, manaCost: 22, aoeRadius: 0, cooldown: 6,
    statusEffect: 'charmed', statusDuration: 2, targetType: 'enemy',
    effects: [{ type: 'charm_duration_bonus', value: 0.15, description: '+15% charm/control duration' }],
    icon: 'skills/Enchantment/' },

  // === CRIME / UNDERWORLD PASSIVE PERKS ===
  { cardId: 'underworld_connections', name: 'Underworld Connections', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['crime'],
    description: '+20% gold from all dungeon sources. Stolen goods sell for 15% more at NPC shops.',
    effects: [{ type: 'dungeon_gold_bonus', value: 0.20 }, { type: 'stolen_goods_bonus', value: 0.15 }],
    icon: 'skills/Enchantment/' },
  { cardId: 'sleight_of_hand', name: 'Sleight of Hand', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility',
    tags: ['crime', 'stealth'],
    description: '+10% steal chance on hit and +15% lockpicking bonus',
    effects: [{ type: 'steal_chance', value: 0.10 }, { type: 'lockpicking_bonus', value: 0.15 }],
    icon: 'skills/Enchantment/' },
  { cardId: 'cat_burglar', name: 'Cat Burglar', type: 'passive_perk', rarity: 'rare', archetype: 'scout',
    tags: ['crime', 'stealth'],
    description: 'Chests you open have a 20% chance to upgrade one tier. Traps deal 50% less damage to you.',
    effects: [{ type: 'chest_upgrade_chance', value: 0.20 }, { type: 'trap_damage_reduction', value: 0.50 }],
    icon: 'skills/Enchantment/' },
  { cardId: 'fence_network', name: 'Fence Network', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility',
    tags: ['crime'],
    description: '+30% sell price for all items. Card vendor buyback rate increased by 15%.',
    effects: [{ type: 'sell_price_bonus', value: 0.30 }, { type: 'card_buyback_bonus', value: 0.15 }],
    icon: 'skills/Enchantment/' },
  { cardId: 'criminal_mastermind', name: 'Criminal Mastermind', type: 'passive_perk', rarity: 'legendary', archetype: 'utility',
    tags: ['crime', 'stealth'],
    description: '+15% to all rogue skills. Crime cards cost 20% less focus. Gold stolen is doubled.',
    effects: [{ type: 'lockpicking_bonus', value: 0.15 }, { type: 'thievery_bonus', value: 0.15 }, { type: 'stealth_bonus', value: 0.15 }, { type: 'crime_resource_reduction', value: 0.20 }, { type: 'steal_gold_multiplier', value: 2.0 }],
    icon: 'skills/Enchantment/' },

  // ── Luck / Fortune Cards ──
  { cardId: 'lucky_coin', name: 'Lucky Coin', type: 'passive_perk', rarity: 'common', archetype: 'utility', tags: ['luck'], effects: [{ type: 'luck_bonus', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'fortune_favor', name: "Fortune's Favor", type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', tags: ['luck'], effects: [{ type: 'luck_bonus', value: 0.10 }, { type: 'crit_bonus', value: 0.02 }], icon: 'skills/Enchantment/' },
  { cardId: 'jackpot', name: 'Jackpot', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['luck'], effects: [{ type: 'luck_bonus', value: 0.15 }, { type: 'loot_bonus', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'cats_grace', name: "Cat's Grace", type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['luck'], effects: [{ type: 'dodge_bonus', value: 0.05 }, { type: 'crit_bonus', value: 0.04 }, { type: 'luck_bonus', value: 0.08 }], icon: 'skills/Enchantment/' },
  { cardId: 'loaded_dice', name: 'Loaded Dice', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', tags: ['luck'], effects: [{ type: 'luck_bonus', value: 0.20 }, { type: 'card_luck_bonus', value: 0.05 }, { type: 'double_gather_all', chance: 0.08 }], icon: 'skills/Enchantment/' },
  { cardId: 'miracle_worker', name: 'Miracle Worker', type: 'passive_perk', rarity: 'legendary', archetype: 'utility', tags: ['luck'], effects: [{ type: 'luck_bonus', value: 0.25 }, { type: 'crit_bonus', value: 0.08 }, { type: 'loot_bonus', value: 0.20 }, { type: 'card_luck_bonus', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'nine_lives', name: 'Nine Lives', type: 'passive_perk', rarity: 'mythic_rare', archetype: 'utility', archetypeSecondary: ['pure_defense'], tags: ['luck'], effects: [{ type: 'revive_on_death', cooldown: 300 }, { type: 'dodge_bonus', value: 0.10 }, { type: 'luck_bonus', value: 0.15 }], icon: 'skills/Enchantment/', combatPassive: { type: 'revive_on_death', hpPercent: 0.25 } },
  { cardId: 'treasure_sense', name: 'Treasure Sense', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', tags: ['luck'], effects: [{ type: 'loot_bonus', value: 0.10 }, { type: 'rare_resource_chance', value: 0.05 }], icon: 'skills/Enchantment/' },

  // ── Lizard Folk Ritual Magic (race-locked: lizardfolk only) ──
  { cardId: 'tidal_invocation', name: 'Tidal Invocation', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'aquatic', archetypeSecondary: ['cc_dot'], tags: ['magic', 'ritual'], raceLocked: 'lizardfolk', effects: [{ type: 'damage', element: 'water', base: 30, scaling: 'acumen', factor: 0.6, cooldown: 20 }, { type: 'slow', value: 0.30, duration: 4 }], icon: 'skills/Enchantment/', combatType: 'damage', baseDamage: 30, range: 5, manaCost: 18, aoeRadius: 1, cooldown: 3, scalingStat: 'acumen', scalingFactor: 0.6, onHitTile: 'WATER', onHitStatus: { name: 'slow', duration: 2, speedMult: 0.7, type: 'debuff' }, targetType: 'enemy' },
  { cardId: 'serpent_ward', name: 'Serpent Ward', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'aquatic', archetypeSecondary: ['support'], tags: ['magic', 'ritual'], raceLocked: 'lizardfolk', effects: [{ type: 'summon_ward', hp: 50, duration: 30, damageReflect: 0.15, cooldown: 60 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 1, manaCost: 25, aoeRadius: 0, cooldown: 5, statusEffect: 'serpent_ward', statusDuration: 5, targetType: 'ally' },
  { cardId: 'deep_communion', name: 'Deep Communion', type: 'passive_perk', rarity: 'rare', archetype: 'aquatic', tags: ['magic', 'ritual'], raceLocked: 'lizardfolk', effects: [{ type: 'xp_bonus_skill', skill: 'magic', value: 0.20 }, { type: 'water_magic_bonus', value: 0.30 }], icon: 'skills/Enchantment/' },
  { cardId: 'primordial_sight', name: 'Primordial Sight', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'aquatic', tags: ['magic', 'ritual'], raceLocked: 'lizardfolk', effects: [{ type: 'tremor_sense_enhanced', range: 'extreme' }, { type: 'hidden_detection', value: true }], icon: 'skills/Enchantment/' },
  { cardId: 'leviathan_pact', name: 'Leviathan Pact', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'aquatic', archetypeSecondary: ['tank'], tags: ['magic', 'ritual'], raceLocked: 'lizardfolk', effects: [{ type: 'transform', form: 'leviathan', duration: 30, hpBonus: 100, waterSpeedBonus: 1.0, cooldown: 300 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 40, aoeRadius: 0, cooldown: 6, statusEffect: 'leviathan_form', statusDuration: 5, statBoost: { vigor: 10, might: 5 }, targetType: 'self' },
  { cardId: 'blood_tide_ritual', name: 'Blood Tide Ritual', type: 'active_ability', rarity: 'mythic_rare', resourceType: 'mana', archetype: 'aquatic', archetypeSecondary: ['support'], tags: ['magic', 'ritual'], raceLocked: 'lizardfolk', effects: [{ type: 'aoe_damage', element: 'water', base: 60, radius: 256, scaling: 'acumen', factor: 0.8, cooldown: 90 }, { type: 'heal', base: 30, scaling: 'resolve', factor: 0.3 }], icon: 'skills/Enchantment/', combatType: 'damage', baseDamage: 60, range: 4, manaCost: 40, aoeRadius: 2, cooldown: 5, scalingStat: 'acumen', scalingFactor: 0.8, onHitTile: 'WATER', targetType: 'enemy' },

  // ── Dungeon Cards (boss pack rewards) ──
  { cardId: 'dungeon_fortitude', name: 'Dungeon Fortitude', type: 'passive_perk', rarity: 'rare', archetype: 'tank', archetypeSecondary: ['utility'], tags: ['dungeon'], effects: [{ type: 'hp_bonus', value: 20 }, { type: 'dungeon_def_bonus', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'delvers_instinct', name: "Delver's Instinct", type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['dungeon'], effects: [{ type: 'trap_detect_bonus', value: 0.15 }, { type: 'loot_bonus', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'rift_walker', name: 'Rift Walker', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'melee_dps', archetypeSecondary: ['utility'], tags: ['dungeon'], effects: [{ type: 'dungeon_damage_bonus', value: 0.15 }, { type: 'dungeon_xp_bonus', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'boss_slayer', name: 'Boss Slayer', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'melee_dps', archetypeSecondary: ['utility'], tags: ['dungeon'], effects: [{ type: 'boss_damage_bonus', value: 0.25 }, { type: 'boss_loot_bonus', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'abyssal_strike', name: 'Abyssal Strike', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'melee_dps', tags: ['dungeon'], effects: [{ type: 'damage', element: 'shadow', base: 35, scaling: 'might', factor: 0.6, cooldown: 20 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'dark', baseDamage: 35, range: 2, manaCost: 15, aoeRadius: 0, cooldown: 3, scalingStat: 'might', scalingFactor: 0.6, targetType: 'enemy' },
  { cardId: 'depths_ward', name: 'Depths Ward', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'pure_defense', tags: ['dungeon', 'magic'], effects: [{ type: 'shield', base: 40, scaling: 'resolve', factor: 0.4, duration: 15, cooldown: 30 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 1, manaCost: 20, aoeRadius: 0, cooldown: 4, statusEffect: 'depths_ward', statusDuration: 3, armorBoost: 10, targetType: 'ally' },
  { cardId: 'dungeon_master', name: 'Dungeon Master', type: 'passive_perk', rarity: 'legendary', archetype: 'utility', tags: ['dungeon'], effects: [{ type: 'dungeon_damage_bonus', value: 0.20 }, { type: 'dungeon_xp_bonus', value: 0.20 }, { type: 'trap_detect_bonus', value: 0.25 }], icon: 'skills/Enchantment/' },
  { cardId: 'rift_sovereign', name: 'Rift Sovereign', type: 'passive_perk', rarity: 'mythic_rare', archetype: 'melee_dps', archetypeSecondary: ['tank'], tags: ['dungeon'], effects: [{ type: 'dungeon_damage_bonus', value: 0.30 }, { type: 'boss_damage_bonus', value: 0.20 }, { type: 'dungeon_def_bonus', value: 0.15 }, { type: 'loot_bonus', value: 0.20 }], icon: 'skills/Enchantment/' },

  // ── Vision Equipment Cards ──
  { cardId: 'thermal_goggles', name: 'Thermal Goggles', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['dungeon', 'vision'], effects: [{ type: 'grants_vision', value: 'thermal' }], icon: 'skills/Enchantment/', description: 'Enchanted lenses that reveal heat signatures. Grants Thermal Vision toggle.' },
  { cardId: 'tremor_boots', name: 'Tremor Boots', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['dungeon', 'vision'], effects: [{ type: 'grants_vision', value: 'tremor' }], icon: 'skills/Enchantment/', description: 'Stone-infused boots that sense vibrations through the ground. Grants Tremor Sense toggle.' },
  { cardId: 'night_eye_elixir', name: 'Night Eye Elixir', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', tags: ['dungeon', 'vision'], effects: [{ type: 'grants_vision', value: 'night' }], icon: 'skills/Enchantment/', description: 'A permanent alchemical enhancement to the eyes. Grants Night Vision toggle.' },
  { cardId: 'all_seeing_eye', name: 'All-Seeing Eye', type: 'passive_perk', rarity: 'legendary', archetype: 'utility', tags: ['dungeon', 'vision', 'magic'], effects: [{ type: 'grants_vision', value: 'all' }, { type: 'hidden_detection', value: true }], icon: 'skills/Enchantment/', description: 'An ancient artifact that pierces all forms of concealment. Grants ALL vision types.' },
  { cardId: 'hunters_visor', name: "Hunter's Visor", type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', tags: ['dungeon', 'vision', 'stealth'], effects: [{ type: 'grants_vision', value: ['thermal', 'night'] }, { type: 'stealth_attack_bonus', value: 0.10 }], icon: 'skills/Enchantment/', description: 'A predator\'s helmet that combines heat-sight with night-adapted lenses. Grants Thermal + Night Vision.' },

  // ── Mythic+ Cards ──
  { cardId: 'all_stats_V', name: '+5 All Stats', type: 'stat_boost', rarity: 'mythic_rare', archetype: 'utility', effects: [{ type: 'stat_boost_all', value: 5 }], icon: 'skills/Enchantment/' },
  { cardId: 'xp_master', name: 'XP Master', type: 'skill_boost', rarity: 'mythic_rare', archetype: 'utility', effects: [{ type: 'xp_bonus_all', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'phoenix_rebirth', name: 'Phoenix Rebirth', type: 'passive_perk', rarity: 'legendary', archetype: 'pure_defense', effects: [{ type: 'revive_on_death', cooldown: 600 }], icon: 'skills/Enchantment/', combatPassive: { type: 'revive_on_death', hpPercent: 0.30 } },
  { cardId: 'time_warp', name: 'Time Warp', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'support', effects: [{ type: 'cooldown_reset', cooldown: 300 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 30, aoeRadius: 0, cooldown: 6, statusEffect: 'time_warp', statusDuration: 1, targetType: 'self' },
  { cardId: 'divine_blessing', name: 'Divine Blessing', type: 'passive_perk', rarity: 'godly', archetype: 'utility', tags: ['magic'], effects: [{ type: 'stat_boost_all', value: 8 }, { type: 'xp_bonus_all', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'world_shaper', name: 'World Shaper', type: 'passive_perk', rarity: 'godly', archetype: 'utility', effects: [{ type: 'gather_bonus', value: 0.25 }, { type: 'craft_bonus', value: 0.25 }], icon: 'skills/Enchantment/' },
  { cardId: 'relic_of_creation', name: 'Relic of Creation', type: 'passive_perk', rarity: 'relic', archetype: 'utility', effects: [{ type: 'stat_boost_all', value: 10 }, { type: 'xp_bonus_all', value: 0.20 }, { type: 'hp_bonus', value: 100 }], icon: 'skills/Enchantment/' },
  { cardId: 'relic_of_time', name: 'Relic of Time', type: 'active_ability', rarity: 'relic', resourceType: 'mana', archetype: 'utility', effects: [{ type: 'all_cooldown_reduction', value: 0.30 }, { type: 'speed_bonus', value: 0.15 }], icon: 'skills/Enchantment/' },

  // ── Reactive Cards (combat reactions, cost RP) ──
  { cardId: 'evasion_card', name: 'Evasion Mastery', type: 'reactive', rarity: 'rare', archetype: 'scout', tags: ['stealth'], combatReaction: 'dodge_roll', effects: [{ type: 'dodge_bonus', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'magic_resist_card', name: 'Arcane Barrier', type: 'reactive', rarity: 'rare', archetype: 'pure_defense', tags: ['magic'], combatReaction: 'magic_shield', effects: [{ type: 'magic_resist', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'riposte_card', name: 'Riposte', type: 'reactive', rarity: 'uncommon', archetype: 'night_hunter', archetypeSecondary: ['melee_dps'], combatReaction: 'counter_strike', effects: [{ type: 'counter_chance_bonus', value: 0.15 }], icon: 'skills/Skill_SwordAttack.PNG' },

  // ── Defensive Active Abilities ──
  { cardId: 'stone_skin', name: 'Stone Skin', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'pure_defense', tags: ['magic'], effects: [{ type: 'shield', base: 30, scaling: 'resolve', factor: 0.4, cooldown: 20 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 15, aoeRadius: 0, cooldown: 3, statusEffect: 'stone_skin', statusDuration: 3, armorBoost: 8, targetType: 'self' },
  { cardId: 'war_cry', name: 'War Cry', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'support', archetypeSecondary: ['tank'], effects: [{ type: 'buff', duration: 10, cooldown: 25 }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'buff', range: 0, manaCost: 20, aoeRadius: 3, cooldown: 4, statusEffect: 'war_cry', statusDuration: 3, armorBoost: 5, damageBoost: 3, targetType: 'all_allies' },
  { cardId: 'divine_shield', name: 'Divine Shield', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'pure_defense', archetypeSecondary: ['tank'], tags: ['magic'], effects: [{ type: 'shield_all', base: 50, cooldown: 60 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 35, aoeRadius: 0, cooldown: 6, statusEffect: 'divine_shield', statusDuration: 2, armorBoost: 15, targetType: 'all_allies' },
  { cardId: 'taunt', name: 'Taunt', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'tank', archetypeSecondary: ['cc_dot'], effects: [{ type: 'aggro', cooldown: 15 }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'debuff', range: 3, manaCost: 0, aoeRadius: 0, cooldown: 3, statusEffect: 'taunted', statusDuration: 2, targetType: 'enemy' },

  // ── Support Active Abilities ──
  { cardId: 'heal_ally', name: 'Heal Ally', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'heal', base: 35, scaling: 'resolve', factor: 0.5, cooldown: 18 }], icon: 'skills/Skill_Heal.PNG', combatType: 'healing', baseHeal: 35, range: 5, manaCost: 15, aoeRadius: 0, cooldown: 3, scalingStat: 'resolve', scalingFactor: 0.5, targetType: 'ally' },
  { cardId: 'circle_of_healing', name: 'Circle of Healing', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'heal_aoe', base: 30, scaling: 'resolve', factor: 0.4, cooldown: 25 }], icon: 'skills/Skill_Heal.PNG', combatType: 'healing', baseHeal: 30, range: 4, manaCost: 22, aoeRadius: 2, cooldown: 4, scalingStat: 'resolve', scalingFactor: 0.4, targetType: 'ally' },
  { cardId: 'mass_haste', name: 'Mass Haste', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'buff_all', cooldown: 45 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 35, aoeRadius: 0, cooldown: 5, statusEffect: 'haste', statusDuration: 3, speedMult: 1.5, targetType: 'all_allies' },
  { cardId: 'cleanse', name: 'Cleanse', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'cleanse', cooldown: 15 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 4, manaCost: 10, aoeRadius: 0, cooldown: 2, statusEffect: 'cleanse', statusDuration: 0, targetType: 'ally' },

  // ── Offensive Active Abilities (AoE/Room-wide) ──
  { cardId: 'chain_lightning', name: 'Chain Lightning', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], tags: ['magic'], effects: [{ type: 'damage', element: 'lightning', base: 35, scaling: 'acumen', factor: 0.5, cooldown: 25 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'lightning', baseDamage: 35, range: 6, manaCost: 22, aoeRadius: 2, cooldown: 4, scalingStat: 'acumen', scalingFactor: 0.5, onHitTile: 'ELECTRIFIED', targetType: 'enemy' },
  { cardId: 'meteor', name: 'Meteor', type: 'active_ability', rarity: 'mythic_rare', resourceType: 'mana', archetype: 'glass_cannon', tags: ['magic'], effects: [{ type: 'damage', element: 'fire', base: 80, scaling: 'acumen', factor: 1.0, cooldown: 60 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'fire', baseDamage: 80, range: 6, manaCost: 45, aoeRadius: 3, cooldown: 6, scalingStat: 'acumen', scalingFactor: 1.0, onHitTile: 'BURNING', targetType: 'all_enemies' },
  { cardId: 'poison_cloud', name: 'Poison Cloud', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'], tags: ['magic'], effects: [{ type: 'damage', element: 'poison', base: 10, scaling: 'acumen', factor: 0.3, cooldown: 20 }], icon: 'skills/Enchantment/', combatType: 'tile_effect', tileEffect: 'POISONED', range: 5, manaCost: 12, aoeRadius: 2, cooldown: 3, targetType: 'any' },
  { cardId: 'oil_slick', name: 'Oil Slick', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'cc_dot', effects: [{ type: 'tile', element: 'oil', cooldown: 15 }], icon: 'skills/Enchantment/', combatType: 'tile_effect', tileEffect: 'OIL', range: 4, manaCost: 8, aoeRadius: 1, cooldown: 2, targetType: 'any' },
  { cardId: 'bramble_trap', name: 'Bramble Trap', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'cc_dot', effects: [{ type: 'tile', element: 'bramble', cooldown: 15 }], icon: 'skills/Herbalism/', combatType: 'tile_effect', tileEffect: 'BRAMBLE', range: 4, manaCost: 8, aoeRadius: 1, cooldown: 2, targetType: 'any' },
  { cardId: 'ice_wall', name: 'Ice Wall', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot', archetypeSecondary: ['pure_defense'], tags: ['magic'], effects: [{ type: 'tile', element: 'ice', cooldown: 20 }], icon: 'skills/Enchantment/', combatType: 'tile_effect', tileEffect: 'FROZEN', range: 5, manaCost: 15, aoeRadius: 1, cooldown: 3, targetType: 'any' },
  { cardId: 'whirlwind', name: 'Whirlwind', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'melee_dps', archetypeSecondary: ['cc_dot'], effects: [{ type: 'damage', element: 'physical', base: 20, scaling: 'might', factor: 0.6, cooldown: 15 }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'damage', baseDamage: 20, range: 1, manaCost: 6, aoeRadius: 1, cooldown: 3, scalingStat: 'might', scalingFactor: 0.6, targetType: 'enemy' },
  { cardId: 'life_drain', name: 'Life Drain', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'glass_cannon', archetypeSecondary: ['support'], tags: ['magic'], effects: [{ type: 'damage', element: 'shadow', base: 28, scaling: 'acumen', factor: 0.4, cooldown: 20 }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'dark', baseDamage: 28, range: 3, manaCost: 15, aoeRadius: 0, cooldown: 3, scalingStat: 'acumen', scalingFactor: 0.4, targetType: 'enemy', lifesteal: 0.60 },

  // ── Passive Combat Cards (new) ──
  { cardId: 'life_steal_passive', name: 'Vampiric Touch', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps', effects: [{ type: 'lifesteal', value: 0.20 }], icon: 'skills/Enchantment/', combatPassive: { type: 'lifesteal', value: 0.20 } },
  // [REMOVED: thorns - superseded by thorns_I/II/III tiered cards below]
  { cardId: 'iron_will', name: 'Iron Will', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense', effects: [{ type: 'debuff_resist', value: 0.30 }], icon: 'skills/Enchantment/', combatPassive: { type: 'debuff_resist', value: 0.30 } },
  { cardId: 'second_wind', name: 'Second Wind', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps', effects: [{ type: 'heal_on_kill', value: 15 }], icon: 'skills/Enchantment/', combatPassive: { type: 'heal_on_kill', value: 15 } },

  // ── Mana Economy Cards ──
  { cardId: 'arcane_font', name: 'Arcane Font', type: 'passive_perk', rarity: 'rare', archetype: 'glass_cannon', tags: ['magic'], effects: [{ type: 'mana_regen', value: 2 }], icon: 'skills/Enchantment/', combatPassive: { type: 'mana_regen', value: 2 } },

  // ── Additional Passive Combat Cards ──
  { cardId: 'poison_aura', name: 'Toxic Presence', type: 'passive_perk', rarity: 'rare', archetype: 'cc_dot', tags: ['stealth'], effects: [{ type: 'poison_aura', value: 3 }], icon: 'skills/Enchantment/', combatPassive: { type: 'poison_aura', value: 3 } },
  { cardId: 'poison_aura_II', name: 'Noxious Miasma', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'cc_dot', tags: ['stealth'], effects: [{ type: 'poison_aura', value: 5 }], icon: 'skills/Enchantment/', combatPassive: { type: 'poison_aura', value: 5 } },
  { cardId: 'mana_shield', name: 'Mana Shield', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense', tags: ['magic'], effects: [{ type: 'mana_shield', value: 0.50 }], icon: 'skills/Enchantment/', combatPassive: { type: 'mana_shield', value: 0.50 } },
  { cardId: 'mana_shield_II', name: 'Arcane Bulwark', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'pure_defense', tags: ['magic'], effects: [{ type: 'mana_shield', value: 0.70 }], icon: 'skills/Enchantment/', combatPassive: { type: 'mana_shield', value: 0.70 } },

  // ── Tank / Positioning Cards ──
  { cardId: 'shield_wall', name: 'Shield Wall', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'tank', effects: [{ type: 'shield', base: 50, scaling: 'vigor', factor: 0.6, cooldown: 20 }], icon: 'skills/Skill_Defence.PNG', combatType: 'buff', range: 0, manaCost: 8, aoeRadius: 0, cooldown: 3, statusEffect: 'shield_wall', statusDuration: 2, armorBoost: 12, targetType: 'self' },
  { cardId: 'guardian_stance', name: 'Guardian Stance', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'stamina', archetype: 'tank', archetypeSecondary: ['cc_dot'], effects: [{ type: 'taunt_aoe', cooldown: 25 }], icon: 'skills/Skill_Defence.PNG', combatType: 'buff', range: 0, manaCost: 10, aoeRadius: 2, cooldown: 4, statusEffect: 'guardian_stance', statusDuration: 2, armorBoost: 8, tauntAoe: true, targetType: 'self' },
  { cardId: 'blink', name: 'Blink', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'scout', tags: ['magic'], effects: [{ type: 'teleport', range: 4, cooldown: 20 }], icon: 'skills/Enchantment/', combatType: 'movement', range: 4, manaCost: 12, aoeRadius: 0, cooldown: 3, targetType: 'any' },
  { cardId: 'shield_bash', name: 'Shield Bash', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'tank', archetypeSecondary: ['cc_dot'], effects: [{ type: 'damage', element: 'physical', base: 12, scaling: 'vigor', factor: 0.4, cooldown: 12 }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'damage', baseDamage: 12, range: 1, manaCost: 0, aoeRadius: 0, cooldown: 2, scalingStat: 'vigor', scalingFactor: 0.4, targetType: 'enemy', knockback: 1, onHitStatus: { name: 'stunned', duration: 1, type: 'debuff' } },

  // ── Additional Weapon Modifiers ──
  { cardId: 'lightning_weapon', name: 'Lightning Weapon', type: 'equipment_modifier', rarity: 'rare', archetype: 'melee_dps', effects: [{ type: 'weapon_element', element: 'lightning', bonusDamage: 4 }], icon: 'skills/Skill_Explosion.PNG', combatWeapon: { bonusDamage: 4, element: 'lightning', onHitTileChance: 0.08, onHitTile: 'ELECTRIFIED', onHitStatusChance: 0.12, onHitStatus: { name: 'shocked', duration: 1, speedMult: 0.6, type: 'debuff' } } },
  { cardId: 'shadow_weapon', name: 'Shadow Weapon', type: 'equipment_modifier', rarity: 'rare', archetype: 'melee_dps', tags: ['stealth'], effects: [{ type: 'weapon_element', element: 'shadow', bonusDamage: 3 }], icon: 'skills/Enchantment/', combatWeapon: { bonusDamage: 3, element: 'shadow', onHitStatusChance: 0.18, onHitStatus: { name: 'weakened', duration: 2, damageReduction: 0.20, type: 'debuff' } } },
  { cardId: 'holy_weapon', name: 'Holy Weapon', type: 'equipment_modifier', rarity: 'rare', archetype: 'melee_dps', tags: ['magic'], effects: [{ type: 'weapon_element', element: 'holy', bonusDamage: 4 }], icon: 'skills/Enchantment/', combatWeapon: { bonusDamage: 4, element: 'holy', onHitStatusChance: 0.12, onHitStatus: { name: 'smited', duration: 2, tickDamage: 4, type: 'debuff' }, bonusVsUndead: 8 } },

  // ── Racial Combat Cards (filling gaps) ──
  { cardId: 'rallying_cry', name: 'Rallying Cry', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support', archetypeSecondary: ['tank'], raceBonus: 'human', effects: [{ type: 'buff_all', duration: 10, cooldown: 25 }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'buff', range: 0, manaCost: 15, aoeRadius: 0, cooldown: 4, statusEffect: 'rallying_cry', statusDuration: 3, damageBoost: 4, armorBoost: 3, targetType: 'all_allies' },
  { cardId: 'arcane_surge', name: 'Arcane Surge', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['support'], raceBonus: 'elf', tags: ['magic'], effects: [{ type: 'damage', element: 'arcane', base: 30, scaling: 'acumen', factor: 0.7, cooldown: 18 }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'arcane', baseDamage: 30, range: 6, manaCost: 14, aoeRadius: 0, cooldown: 2, scalingStat: 'acumen', scalingFactor: 0.7, targetType: 'enemy' },
  { cardId: 'berserker_rage', name: 'Berserker Rage', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['tank'], raceBonus: 'orc', effects: [{ type: 'buff', duration: 8, cooldown: 20 }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'buff', range: 0, manaCost: 0, aoeRadius: 0, cooldown: 4, statusEffect: 'berserker_rage', statusDuration: 3, damageBoost: 6, armorReduction: 3, targetType: 'self' },
  { cardId: 'stone_fortress', name: 'Stone Fortress', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'tank', raceBonus: 'dwarf', effects: [{ type: 'shield', base: 40, scaling: 'vigor', factor: 0.5, cooldown: 20 }], icon: 'skills/Skill_Defence.PNG', combatType: 'buff', range: 0, manaCost: 8, aoeRadius: 0, cooldown: 4, statusEffect: 'stone_fortress', statusDuration: 3, armorBoost: 15, targetType: 'self' },
  { cardId: 'turret_deploy', name: 'Turret Deploy', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'utility', raceBonus: 'gnome', effects: [{ type: 'summon', cooldown: 30 }], icon: 'skills/Engineering/', combatType: 'tile_effect', tileEffect: 'TURRET', range: 3, manaCost: 18, aoeRadius: 0, cooldown: 5, targetType: 'any' },
  { cardId: 'pounce', name: 'Pounce', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['scout'], raceBonus: 'catfolk', tags: ['stealth'], effects: [{ type: 'damage', element: 'physical', base: 22, scaling: 'finesse', factor: 0.6, cooldown: 15 }], icon: 'skills/Enchantment/', combatType: 'damage', baseDamage: 22, range: 3, manaCost: 5, aoeRadius: 0, cooldown: 2, scalingStat: 'finesse', scalingFactor: 0.6, targetType: 'enemy', leapToTarget: true },

  // --- Alchemy & Potion Crafting ---
  { cardId: 'alchemy_xp_I', name: '+10% Alchemy XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'alchemy', value: 0.10 }], icon: 'skills/Herbalism/' },
  { cardId: 'alchemy_xp_II', name: '+20% Alchemy XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'alchemy', value: 0.20 }], icon: 'skills/Herbalism/' },
  { cardId: 'potion_potency', name: 'Potion Potency', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'potion_effectiveness', value: 0.25 }], icon: 'skills/Herbalism/' },
  { cardId: 'potion_potency_II', name: 'Master Brewer', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'potion_effectiveness', value: 0.50 }, { type: 'potion_duration_bonus', value: 0.30 }], icon: 'skills/Herbalism/' },
  { cardId: 'transmutation', name: 'Transmutation', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'transmute_chance', value: 0.10 }], icon: 'skills/Herbalism/' },
  { cardId: 'ingredient_finder', name: 'Ingredient Finder', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'rare_resource_chance', value: 0.08 }, { type: 'gather_bonus', value: 0.05 }], icon: 'skills/Herbalism/' },
  { cardId: 'alchemist_fire', name: "Alchemist's Fire", type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], effects: [{ type: 'damage', element: 'fire', base: 20, scaling: 'ingenuity', factor: 0.5 }], icon: 'skills/Herbalism/', combatType: 'damage', element: 'fire', baseDamage: 20, range: 4, manaCost: 10, aoeRadius: 1, cooldown: 3, scalingStat: 'ingenuity', scalingFactor: 0.5, onHitTile: 'BURNING', targetType: 'enemy' },
  { cardId: 'acid_flask', name: 'Acid Flask', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'], effects: [{ type: 'damage', element: 'poison', base: 15, scaling: 'ingenuity', factor: 0.4 }], icon: 'skills/Herbalism/', combatType: 'damage', element: 'poison', baseDamage: 15, range: 3, manaCost: 8, aoeRadius: 0, cooldown: 2, scalingStat: 'ingenuity', scalingFactor: 0.4, onHitStatus: { name: 'corroded', duration: 3, armorReduction: 5, type: 'debuff' }, targetType: 'enemy' },
  { cardId: 'healing_salve', name: 'Healing Salve', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'support', effects: [{ type: 'heal', base: 25, scaling: 'ingenuity', factor: 0.3 }], icon: 'skills/Herbalism/', combatType: 'healing', baseHeal: 25, range: 1, manaCost: 5, aoeRadius: 0, cooldown: 2, scalingStat: 'ingenuity', scalingFactor: 0.3, targetType: 'ally' },
  { cardId: 'elixir_of_fortitude', name: 'Elixir of Fortitude', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'tank', archetypeSecondary: ['support'], effects: [{ type: 'buff', duration: 15 }], icon: 'skills/Herbalism/', combatType: 'buff', range: 0, manaCost: 15, aoeRadius: 0, cooldown: 5, statusEffect: 'fortified', statusDuration: 4, armorBoost: 10, statBoost: { vigor: 3 }, targetType: 'self' },

  // --- Blacksmithing & Crafting Quality ---
  { cardId: 'crafting_xp_I', name: '+10% Crafting XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'crafting', value: 0.10 }], icon: 'skills/Blacksmith/' },
  { cardId: 'crafting_xp_II', name: '+20% Crafting XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'crafting', value: 0.20 }], icon: 'skills/Blacksmith/' },
  { cardId: 'master_smith', name: 'Master Smith', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'craft_quality_bonus', value: 0.15 }, { type: 'craft_bonus', value: 0.10 }], icon: 'skills/Blacksmith/' },
  { cardId: 'forge_mastery', name: 'Forge Mastery', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'craft_quality_bonus', value: 0.25 }, { type: 'craft_bonus', value: 0.20 }, { type: 'ingredientSaveChance', value: 0.10 }], icon: 'skills/Blacksmith/' },
  { cardId: 'efficient_smelter', name: 'Efficient Smelter', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'ingredientSaveChance', value: 0.15 }], icon: 'skills/Blacksmith/' },
  { cardId: 'alloy_expert', name: 'Alloy Expert', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'craft_bonus', value: 0.15 }, { type: 'xp_bonus_skill', skill: 'crafting', value: 0.10 }], icon: 'skills/Blacksmith/' },
  { cardId: 'weapon_sharpener', name: 'Weapon Sharpener', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'crafted_weapon_damage_bonus', value: 2 }], icon: 'skills/Blacksmith/' },
  { cardId: 'armor_hardener', name: 'Armor Hardener', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'crafted_armor_bonus', value: 2 }], icon: 'skills/Blacksmith/' },
  { cardId: 'legendary_smith', name: 'Legendary Artisan', type: 'passive_perk', rarity: 'legendary', archetype: 'utility', effects: [{ type: 'craft_quality_bonus', value: 0.35 }, { type: 'craft_bonus', value: 0.30 }, { type: 'ingredientSaveChance', value: 0.20 }, { type: 'crafted_weapon_damage_bonus', value: 4 }], icon: 'skills/Blacksmith/' },

  // --- Cooking Enhancement ---
  { cardId: 'cooking_xp_II', name: '+20% Cooking XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'cooking', value: 0.20 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'hearty_chef', name: 'Hearty Chef', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'food_heal_bonus', value: 0.20 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'gourmet', name: 'Gourmet', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'food_heal_bonus', value: 0.35 }, { type: 'food_buff_duration', value: 0.25 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'master_chef', name: 'Master Chef', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'food_heal_bonus', value: 0.50 }, { type: 'food_buff_duration', value: 0.50 }, { type: 'feast_chance', value: 0.10 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'recipe_intuition', name: 'Recipe Intuition', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'recipe_discovery_bonus', value: 0.20 }, { type: 'xp_bonus_skill', skill: 'cooking', value: 0.15 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'spice_master', name: 'Spice Master', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'food_buff_potency', value: 0.15 }], icon: 'skills/Cooking_fishing/' },

  // --- Spell Crafting & Enchanting ---
  { cardId: 'enchanting_xp_I', name: '+10% Enchanting XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', tags: ['magic'], effects: [{ type: 'xp_bonus_skill', skill: 'enchanting', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'arcane_infusion', name: 'Arcane Infusion', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['magic'], effects: [{ type: 'enchant_power_bonus', value: 0.20 }, { type: 'mana_efficiency', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'spell_weaver', name: 'Spell Weaver', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'glass_cannon', archetypeSecondary: ['utility'], tags: ['magic'], effects: [{ type: 'spell_damage_bonus', value: 0.15 }, { type: 'mana_efficiency', value: 0.20 }, { type: 'cooldown_reduction', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'rune_scribe', name: 'Rune Scribe', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['magic'], effects: [{ type: 'enchant_power_bonus', value: 0.15 }, { type: 'xp_bonus_skill', skill: 'magic', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'mana_well', name: 'Mana Well', type: 'passive_perk', rarity: 'rare', archetype: 'glass_cannon', archetypeSecondary: ['support'], tags: ['magic'], effects: [{ type: 'max_mana_bonus', value: 30 }, { type: 'mana_regen', value: 1 }], icon: 'skills/Enchantment/', combatPassive: { type: 'mana_regen', value: 1 } },
  { cardId: 'elemental_mastery', name: 'Elemental Mastery', type: 'passive_perk', rarity: 'legendary', archetype: 'glass_cannon', archetypeSecondary: ['utility'], tags: ['magic'], effects: [{ type: 'spell_damage_bonus', value: 0.25 }, { type: 'elemental_resist_all', value: 0.10 }, { type: 'mana_efficiency', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'scroll_of_power', name: 'Scroll of Power', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['support'], tags: ['magic'], effects: [{ type: 'buff', duration: 15 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 20, aoeRadius: 0, cooldown: 5, statusEffect: 'empowered', statusDuration: 4, damageBoost: 5, statBoost: { acumen: 3 }, targetType: 'self' },

  // --- Support & Healing Expansion ---
  { cardId: 'rejuvenation', name: 'Rejuvenation', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'heal_over_time', base: 8, ticks: 5, scaling: 'resolve', factor: 0.2 }], icon: 'skills/Skill_Heal.PNG', combatType: 'healing', baseHeal: 8, range: 4, manaCost: 12, aoeRadius: 0, cooldown: 3, scalingStat: 'resolve', scalingFactor: 0.2, targetType: 'ally', isHoT: true, hotTicks: 5 },
  { cardId: 'group_rejuvenation', name: 'Group Rejuvenation', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'heal_over_time', base: 6, ticks: 4, scaling: 'resolve', factor: 0.15 }], icon: 'skills/Skill_Heal.PNG', combatType: 'healing', baseHeal: 6, range: 3, manaCost: 20, aoeRadius: 2, cooldown: 4, scalingStat: 'resolve', scalingFactor: 0.15, targetType: 'all_allies', isHoT: true, hotTicks: 4 },
  { cardId: 'damage_ward', name: 'Damage Ward', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'shield', base: 35, scaling: 'resolve', factor: 0.4 }], icon: 'skills/Skill_Heal.PNG', combatType: 'buff', range: 4, manaCost: 15, aoeRadius: 0, cooldown: 3, statusEffect: 'damage_ward', statusDuration: 3, armorBoost: 8, targetType: 'ally' },
  { cardId: 'resurrection', name: 'Resurrection', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'revive_ally', hpPercent: 0.50, cooldown: 120 }], icon: 'skills/Skill_Heal.PNG', combatType: 'healing', baseHeal: 0, range: 3, manaCost: 40, aoeRadius: 0, cooldown: 8, scalingStat: 'resolve', scalingFactor: 0, targetType: 'dead_ally', reviveHpPercent: 0.50 },
  { cardId: 'sanctuary', name: 'Sanctuary', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'shield_all', base: 30, scaling: 'resolve', factor: 0.3 }], icon: 'skills/Skill_Heal.PNG', combatType: 'buff', range: 0, manaCost: 30, aoeRadius: 0, cooldown: 5, statusEffect: 'sanctuary', statusDuration: 3, armorBoost: 10, healPerTurn: 5, targetType: 'all_allies' },
  { cardId: 'purify', name: 'Purify', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'support', tags: ['magic'], effects: [{ type: 'cleanse', cooldown: 12 }], icon: 'skills/Skill_Heal.PNG', combatType: 'buff', range: 5, manaCost: 8, aoeRadius: 2, cooldown: 3, statusEffect: 'cleanse', statusDuration: 0, targetType: 'all_allies' },
  { cardId: 'inspiration', name: 'Inspiration', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support', effects: [{ type: 'buff_all', duration: 10 }], icon: 'skills/Skill_Heal.PNG', combatType: 'buff', range: 0, manaCost: 12, aoeRadius: 0, cooldown: 4, statusEffect: 'inspired', statusDuration: 3, statBoost: { might: 2, acumen: 2, finesse: 2 }, targetType: 'all_allies' },

  // --- Field Medic / Out-of-Combat ---
  { cardId: 'field_medic', name: 'Field Medic', type: 'passive_perk', rarity: 'rare', archetype: 'support', effects: [{ type: 'out_of_combat_heal', value: 5 }, { type: 'food_heal_bonus', value: 0.15 }], icon: 'skills/Skill_Heal.PNG' },
  { cardId: 'first_aid', name: 'First Aid', type: 'passive_perk', rarity: 'uncommon', archetype: 'support', effects: [{ type: 'out_of_combat_heal', value: 3 }, { type: 'potion_effectiveness', value: 0.15 }], icon: 'skills/Skill_Heal.PNG' },
  { cardId: 'combat_medic', name: 'Combat Medic', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support', archetypeSecondary: ['utility'], effects: [{ type: 'heal_on_kill', value: 10 }, { type: 'out_of_combat_heal', value: 8 }, { type: 'food_heal_bonus', value: 0.25 }], icon: 'skills/Skill_Heal.PNG', combatPassive: { type: 'heal_on_kill', value: 10 } },
  { cardId: 'triage', name: 'Triage', type: 'passive_perk', rarity: 'rare', archetype: 'support', effects: [{ type: 'healing_power_bonus', value: 0.20 }, { type: 'out_of_combat_heal', value: 4 }], icon: 'skills/Skill_Heal.PNG' },
  { cardId: 'survivors_instinct', name: "Survivor's Instinct", type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense', effects: [{ type: 'low_hp_damage_reduction', value: 0.25, threshold: 0.30 }, { type: 'hp_regen', value: 2 }], icon: 'skills/Skill_Heal.PNG', combatPassive: { type: 'hp_regen', value: 2 } },

  // --- Farming Enhancement ---
  { cardId: 'farming_xp_II', name: '+20% Farming XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'farming', value: 0.20 }], icon: 'skills/Herbalism/' },
  { cardId: 'green_thumb', name: 'Green Thumb', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'crop_growth_speed', value: 0.20 }, { type: 'crop_yield_bonus', value: 0.10 }], icon: 'skills/Herbalism/' },
  { cardId: 'master_farmer', name: 'Master Farmer', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'crop_growth_speed', value: 0.35 }, { type: 'crop_yield_bonus', value: 0.25 }, { type: 'rare_seed_chance', value: 0.10 }], icon: 'skills/Herbalism/' },
  { cardId: 'natures_blessing', name: "Nature's Blessing", type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'crop_growth_speed', value: 0.50 }, { type: 'crop_yield_bonus', value: 0.40 }, { type: 'gather_bonus', value: 0.15 }], icon: 'skills/Herbalism/' },

  // --- Missing Skill XP Cards ---
  { cardId: 'archery_xp_I', name: '+10% Archery XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'archery', value: 0.10 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'archery_xp_II', name: '+20% Archery XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'archery', value: 0.20 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'glassworking_xp_I', name: '+10% Glassworking XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'glassworking', value: 0.10 }], icon: 'skills/Engineering/' },
  { cardId: 'fishing_xp_II', name: '+20% Fishing XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'fishing', value: 0.20 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'melee_xp_II', name: '+20% Melee XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'melee', value: 0.20 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'magic_xp_II', name: '+20% Magic XP', type: 'skill_boost', rarity: 'rare', archetype: 'utility', tags: ['magic'], effects: [{ type: 'xp_bonus_skill', skill: 'magic', value: 0.20 }], icon: 'skills/Enchantment/' },

  // --- Missing Element Abilities ---
  { cardId: 'earth_spike', name: 'Earth Spike', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'glass_cannon', tags: ['magic'], effects: [{ type: 'damage', element: 'earth', base: 18, scaling: 'acumen', factor: 0.4 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'earth', baseDamage: 18, range: 4, manaCost: 10, aoeRadius: 0, cooldown: 2, scalingStat: 'acumen', scalingFactor: 0.4, targetType: 'enemy' },
  { cardId: 'earthquake', name: 'Earthquake', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], tags: ['magic'], effects: [{ type: 'damage', element: 'earth', base: 40, scaling: 'acumen', factor: 0.6 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'earth', baseDamage: 40, range: 4, manaCost: 25, aoeRadius: 2, cooldown: 4, scalingStat: 'acumen', scalingFactor: 0.6, targetType: 'all_enemies', onHitStatus: { name: 'stunned', duration: 1, type: 'debuff' } },
  { cardId: 'gust', name: 'Gust', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'glass_cannon', tags: ['magic'], effects: [{ type: 'damage', element: 'wind', base: 12, scaling: 'acumen', factor: 0.3 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'wind', baseDamage: 12, range: 5, manaCost: 6, aoeRadius: 0, cooldown: 2, scalingStat: 'acumen', scalingFactor: 0.3, targetType: 'enemy', knockback: 2 },
  { cardId: 'tornado', name: 'Tornado', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', tags: ['magic'], effects: [{ type: 'damage', element: 'wind', base: 30, scaling: 'acumen', factor: 0.5 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'wind', baseDamage: 30, range: 5, manaCost: 20, aoeRadius: 1, cooldown: 4, scalingStat: 'acumen', scalingFactor: 0.5, targetType: 'enemy', knockback: 1 },
  { cardId: 'holy_smite', name: 'Holy Smite', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', tags: ['magic'], effects: [{ type: 'damage', element: 'holy', base: 30, scaling: 'resolve', factor: 0.5 }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'holy', baseDamage: 30, range: 4, manaCost: 15, aoeRadius: 0, cooldown: 3, scalingStat: 'resolve', scalingFactor: 0.5, targetType: 'enemy', bonusVsUndead: 15 },
  { cardId: 'divine_wrath', name: 'Divine Wrath', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], tags: ['magic'], effects: [{ type: 'damage', element: 'holy', base: 60, scaling: 'resolve', factor: 0.8 }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'holy', baseDamage: 60, range: 5, manaCost: 35, aoeRadius: 2, cooldown: 5, scalingStat: 'resolve', scalingFactor: 0.8, targetType: 'all_enemies', bonusVsUndead: 25 },
  { cardId: 'poison_nova', name: 'Poison Nova', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'], tags: ['magic'], effects: [{ type: 'damage', element: 'poison', base: 15, scaling: 'acumen', factor: 0.3 }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'poison', baseDamage: 15, range: 0, manaCost: 18, aoeRadius: 2, cooldown: 4, scalingStat: 'acumen', scalingFactor: 0.3, targetType: 'all_enemies', onHitTile: 'POISONED', onHitStatus: { name: 'poisoned', duration: 4, tickDamage: 4, type: 'debuff' } },

  // --- Stealth Expansion ---
  { cardId: 'ambush', name: 'Ambush', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['melee_dps'], tags: ['stealth'], effects: [{ type: 'damage', element: 'physical', base: 35, scaling: 'finesse', factor: 0.7 }], icon: 'skills/Enchantment/', combatType: 'damage', baseDamage: 35, range: 1, manaCost: 10, aoeRadius: 0, cooldown: 3, scalingStat: 'finesse', scalingFactor: 0.7, targetType: 'enemy', bonusFromStealth: 1.5 },
  { cardId: 'shadow_step', name: 'Shadow Step', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['scout'], tags: ['stealth'], effects: [{ type: 'teleport', range: 3 }], icon: 'skills/Enchantment/', combatType: 'movement', range: 3, manaCost: 8, aoeRadius: 0, cooldown: 3, targetType: 'any', grantsStealth: 1 },
  { cardId: 'assassinate', name: 'Assassinate', type: 'active_ability', rarity: 'legendary', resourceType: 'focus', archetype: 'assassin', tags: ['stealth'], effects: [{ type: 'damage', element: 'physical', base: 60, scaling: 'finesse', factor: 1.0, requiresStealth: true }], icon: 'skills/Enchantment/', combatType: 'damage', baseDamage: 60, range: 1, manaCost: 20, aoeRadius: 0, cooldown: 5, scalingStat: 'finesse', scalingFactor: 1.0, targetType: 'enemy', bonusFromStealth: 2.0 },
  { cardId: 'vanish', name: 'Vanish', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['scout'], tags: ['stealth'], effects: [{ type: 'stealth_enter', duration: 10 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 15, aoeRadius: 0, cooldown: 5, statusEffect: 'vanished', statusDuration: 3, grantsStealth: true, targetType: 'self' },
  { cardId: 'crippling_strike', name: 'Crippling Strike', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['cc_dot'], tags: ['stealth'], effects: [{ type: 'damage', element: 'physical', base: 15, scaling: 'finesse', factor: 0.4 }], icon: 'skills/Enchantment/', combatType: 'damage', baseDamage: 15, range: 1, manaCost: 5, aoeRadius: 0, cooldown: 2, scalingStat: 'finesse', scalingFactor: 0.4, targetType: 'enemy', onHitStatus: { name: 'crippled', duration: 3, speedMult: 0.5, type: 'debuff' } },

  // --- Archery Abilities ---
  { cardId: 'power_shot', name: 'Power Shot', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'melee_dps', effects: [{ type: 'damage', element: 'physical', base: 25, scaling: 'finesse', factor: 0.5 }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'damage', baseDamage: 25, range: 7, manaCost: 5, aoeRadius: 0, cooldown: 2, scalingStat: 'finesse', scalingFactor: 0.5, targetType: 'enemy' },
  { cardId: 'multi_shot', name: 'Multi Shot', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'melee_dps', effects: [{ type: 'damage', element: 'physical', base: 15, scaling: 'finesse', factor: 0.3 }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'damage', baseDamage: 15, range: 6, manaCost: 12, aoeRadius: 2, cooldown: 3, scalingStat: 'finesse', scalingFactor: 0.3, targetType: 'all_enemies' },
  { cardId: 'sniper_shot', name: 'Sniper Shot', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'melee_dps', effects: [{ type: 'damage', element: 'physical', base: 50, scaling: 'finesse', factor: 0.8, requiresRange: 5 }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'damage', baseDamage: 50, range: 8, manaCost: 15, aoeRadius: 0, cooldown: 4, scalingStat: 'finesse', scalingFactor: 0.8, targetType: 'enemy' },
  { cardId: 'rain_of_arrows', name: 'Rain of Arrows', type: 'active_ability', rarity: 'legendary', resourceType: 'focus', archetype: 'melee_dps', effects: [{ type: 'damage', element: 'physical', base: 30, scaling: 'finesse', factor: 0.5 }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'damage', baseDamage: 30, range: 7, manaCost: 25, aoeRadius: 3, cooldown: 5, scalingStat: 'finesse', scalingFactor: 0.5, targetType: 'all_enemies' },

  // --- Ritual Magic & Runes ---
  { cardId: 'rune_of_power', name: 'Rune of Power', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', tags: ['magic', 'ritual'], effects: [{ type: 'buff', duration: 15 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 20, aoeRadius: 0, cooldown: 4, statusEffect: 'runic_power', statusDuration: 4, damageBoost: 6, targetType: 'self' },
  { cardId: 'rune_of_warding', name: 'Rune of Warding', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'pure_defense', tags: ['magic', 'ritual'], effects: [{ type: 'tile', element: 'holy' }], icon: 'skills/Enchantment/', combatType: 'tile_effect', tileEffect: 'WARD', range: 3, manaCost: 15, aoeRadius: 1, cooldown: 4, targetType: 'any' },
  { cardId: 'rune_of_binding', name: 'Rune of Binding', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'cc_dot', tags: ['magic', 'ritual'], effects: [{ type: 'debuff', duration: 8 }], icon: 'skills/Enchantment/', combatType: 'debuff', range: 4, manaCost: 18, aoeRadius: 0, cooldown: 4, statusEffect: 'bound', statusDuration: 2, speedMult: 0, targetType: 'enemy' },
  { cardId: 'runic_inscription', name: 'Runic Inscription', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['magic', 'ritual'], effects: [{ type: 'enchant_power_bonus', value: 0.20 }, { type: 'rune_duration_bonus', value: 0.30 }], icon: 'skills/Enchantment/' },
  { cardId: 'ritual_mastery', name: 'Ritual Mastery', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'glass_cannon', tags: ['magic', 'ritual'], effects: [{ type: 'spell_damage_bonus', value: 0.15 }, { type: 'mana_efficiency', value: 0.20 }, { type: 'rune_duration_bonus', value: 0.50 }], icon: 'skills/Enchantment/' },
  { cardId: 'blood_ritual', name: 'Blood Ritual', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'bloodlust', archetype: 'glass_cannon', tags: ['magic', 'ritual'], effects: [{ type: 'damage', element: 'dark', base: 45, scaling: 'resolve', factor: 0.6 }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'dark', baseDamage: 45, range: 3, manaCost: 0, aoeRadius: 1, cooldown: 4, scalingStat: 'resolve', scalingFactor: 0.6, targetType: 'enemy', hpCost: 25 },
  { cardId: 'water_ritual', name: 'Water Ritual', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', tags: ['magic', 'ritual'], raceLocked: 'lizardfolk', effects: [{ type: 'heal', base: 40, scaling: 'resolve', factor: 0.5 }], icon: 'skills/Enchantment/', combatType: 'healing', baseHeal: 40, range: 0, manaCost: 15, aoeRadius: 2, cooldown: 4, scalingStat: 'resolve', scalingFactor: 0.5, targetType: 'all_allies' },
  { cardId: 'rune_trap', name: 'Rune Trap', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'cc_dot', tags: ['magic', 'ritual'], effects: [{ type: 'tile', element: 'arcane' }], icon: 'skills/Enchantment/', combatType: 'tile_effect', tileEffect: 'RUNE_TRAP', range: 4, manaCost: 10, aoeRadius: 0, cooldown: 3, targetType: 'any' },
  { cardId: 'runic_weapon', name: 'Runic Weapon', type: 'equipment_modifier', rarity: 'ultra_rare', archetype: 'melee_dps', tags: ['magic', 'ritual'], effects: [{ type: 'weapon_element', element: 'arcane', bonusDamage: 6 }], icon: 'skills/Enchantment/', combatWeapon: { bonusDamage: 6, element: 'arcane', onHitStatusChance: 0.10, onHitStatus: { name: 'runic_mark', duration: 2, damageAmplify: 0.15, type: 'debuff' } } },
  { cardId: 'ancient_glyph', name: 'Ancient Glyph', type: 'passive_perk', rarity: 'legendary', archetype: 'glass_cannon', tags: ['magic', 'ritual'], effects: [{ type: 'spell_damage_bonus', value: 0.20 }, { type: 'enchant_power_bonus', value: 0.30 }, { type: 'mana_regen', value: 2 }], icon: 'skills/Enchantment/', combatPassive: { type: 'mana_regen', value: 2 } },

  // --- Enchanting Expansion ---
  { cardId: 'disenchant', name: 'Disenchant', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', tags: ['magic'], effects: [{ type: 'disenchant_yield', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'enchant_transfer', name: 'Enchant Transfer', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['magic'], effects: [{ type: 'enchant_transfer_chance', value: 0.20 }], icon: 'skills/Enchantment/' },
  { cardId: 'glyph_crafter', name: 'Glyph Crafter', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['magic'], effects: [{ type: 'glyph_power', value: 0.20 }, { type: 'enchant_power_bonus', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'double_enchant', name: 'Double Enchant', type: 'passive_perk', rarity: 'legendary', archetype: 'utility', tags: ['magic'], effects: [{ type: 'double_enchant_chance', value: 0.10 }, { type: 'enchant_power_bonus', value: 0.25 }], icon: 'skills/Enchantment/' },
  { cardId: 'mana_forge', name: 'Mana Forge', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', tags: ['magic'], effects: [{ type: 'enchant_power_bonus', value: 0.30 }, { type: 'ingredientSaveChance', value: 0.15 }, { type: 'xp_bonus_skill', skill: 'magic', value: 0.10 }], icon: 'skills/Enchantment/' },

  // --- Gardening (distinct from Farming) ---
  { cardId: 'gardening_xp_I', name: '+10% Gardening XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'farming', value: 0.10 }], icon: 'skills/Herbalism/' },
  { cardId: 'herb_garden', name: 'Herb Garden', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'herb_yield_bonus', value: 0.25 }, { type: 'crop_growth_speed', value: 0.15 }], icon: 'skills/Herbalism/' },
  { cardId: 'botanical_knowledge', name: 'Botanical Knowledge', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'rare_seed_chance', value: 0.15 }, { type: 'herb_yield_bonus', value: 0.20 }, { type: 'xp_bonus_skill', skill: 'farming', value: 0.15 }], icon: 'skills/Herbalism/' },
  { cardId: 'companion_planting', name: 'Companion Planting', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'crop_yield_bonus', value: 0.30 }, { type: 'crop_growth_speed', value: 0.20 }], icon: 'skills/Herbalism/' },
  { cardId: 'master_gardener', name: 'Master Gardener', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'crop_yield_bonus', value: 0.50 }, { type: 'crop_growth_speed', value: 0.40 }, { type: 'herb_yield_bonus', value: 0.40 }, { type: 'rare_seed_chance', value: 0.20 }], icon: 'skills/Herbalism/' },
  { cardId: 'natures_harmony', name: "Nature's Harmony", type: 'passive_perk', rarity: 'legendary', archetype: 'utility', effects: [{ type: 'crop_yield_bonus', value: 0.60 }, { type: 'herb_yield_bonus', value: 0.50 }, { type: 'food_heal_bonus', value: 0.20 }, { type: 'potion_effectiveness', value: 0.15 }], icon: 'skills/Herbalism/' },

  // --- Cross-System Synergy Cards ---
  { cardId: 'garden_chef', name: 'Garden Chef', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'food_heal_bonus', value: 0.25 }, { type: 'crop_yield_bonus', value: 0.15 }, { type: 'food_buff_duration', value: 0.20 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'herbalist_alchemist', name: 'Herbalist Alchemist', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'potion_effectiveness', value: 0.20 }, { type: 'herb_yield_bonus', value: 0.20 }, { type: 'rare_resource_chance', value: 0.08 }], icon: 'skills/Herbalism/' },
  { cardId: 'enchanted_forge', name: 'Enchanted Forge', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'craft_quality_bonus', value: 0.20 }, { type: 'enchant_power_bonus', value: 0.15 }, { type: 'crafted_weapon_damage_bonus', value: 3 }], icon: 'skills/Blacksmith/' },
  { cardId: 'feast_healer', name: 'Feast Healer', type: 'passive_perk', rarity: 'rare', archetype: 'utility', archetypeSecondary: ['support'], effects: [{ type: 'food_heal_bonus', value: 0.30 }, { type: 'healing_power_bonus', value: 0.15 }, { type: 'feast_chance', value: 0.08 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'crop_transmuter', name: 'Crop Transmuter', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'transmute_chance', value: 0.12 }, { type: 'crop_yield_bonus', value: 0.20 }], icon: 'skills/Herbalism/' },
  { cardId: 'poison_brewer', name: 'Poison Brewer', type: 'passive_perk', rarity: 'rare', archetype: 'utility', archetypeSecondary: ['cc_dot'], tags: ['stealth'], effects: [{ type: 'potion_effectiveness', value: 0.15 }, { type: 'poison_damage_bonus', value: 0.20 }, { type: 'herb_yield_bonus', value: 0.10 }], icon: 'skills/Herbalism/' },
  { cardId: 'self_sufficient', name: 'Self-Sufficient', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'gather_bonus', value: 0.10 }, { type: 'food_heal_bonus', value: 0.15 }, { type: 'craft_bonus', value: 0.10 }, { type: 'crop_yield_bonus', value: 0.15 }], icon: 'skills/Herbalism/' },
  { cardId: 'battle_cook', name: 'Battle Cook', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'food_buff_potency', value: 0.25 }, { type: 'food_buff_duration', value: 0.30 }, { type: 'out_of_combat_heal', value: 3 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'runic_smith', name: 'Runic Smith', type: 'passive_perk', rarity: 'legendary', archetype: 'utility', tags: ['magic'], effects: [{ type: 'craft_quality_bonus', value: 0.25 }, { type: 'enchant_power_bonus', value: 0.25 }, { type: 'rune_duration_bonus', value: 0.30 }, { type: 'crafted_weapon_damage_bonus', value: 5 }], icon: 'skills/Blacksmith/' },
  { cardId: 'naturalist', name: 'Naturalist', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'crop_growth_speed', value: 0.30 }, { type: 'gather_bonus', value: 0.15 }, { type: 'potion_effectiveness', value: 0.15 }, { type: 'food_heal_bonus', value: 0.20 }], icon: 'skills/Herbalism/' },

  // --- Per-Skill XP Cards (all skills that grant XP) ---
  { cardId: 'woodcutting_xp_II', name: '+20% Woodcutting XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'woodcutting', value: 0.20 }], icon: 'skills/Blacksmith/' },
  { cardId: 'mining_xp_III', name: '+30% Mining XP', type: 'skill_boost', rarity: 'rare', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'mining', value: 0.30 }], icon: 'skills/Blacksmith/' },
  { cardId: 'lockpicking_xp_I', name: '+10% Lockpicking XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', tags: ['stealth'], effects: [{ type: 'xp_bonus_skill', skill: 'lockpicking', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'thievery_xp_I', name: '+10% Thievery XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', tags: ['stealth'], effects: [{ type: 'xp_bonus_skill', skill: 'thievery', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'dungeon_delving_xp_I', name: '+10% Dungeon XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', tags: ['dungeon'], effects: [{ type: 'xp_bonus_skill', skill: 'dungeon_delving', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'dungeon_dwelling_xp_I', name: '+10% Dwelling XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', tags: ['dungeon'], effects: [{ type: 'xp_bonus_skill', skill: 'dungeon_dwelling', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'harvesting_xp_I', name: '+10% Harvesting XP', type: 'skill_boost', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_all_gathering', value: 0.10 }], icon: 'skills/Herbalism/' },
  { cardId: 'harvesting_xp_II', name: '+20% Harvesting XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_all_gathering', value: 0.20 }], icon: 'skills/Herbalism/' },
  { cardId: 'combat_xp_I', name: '+10% All Combat XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'melee', value: 0.10 }, { type: 'xp_bonus_skill', skill: 'archery', value: 0.10 }, { type: 'xp_bonus_skill', skill: 'magic', value: 0.10 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'crafting_xp_all_I', name: '+10% All Crafting XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'crafting', value: 0.10 }, { type: 'xp_bonus_skill', skill: 'cooking', value: 0.10 }, { type: 'xp_bonus_skill', skill: 'glassworking', value: 0.10 }, { type: 'xp_bonus_skill', skill: 'cogworking', value: 0.10 }], icon: 'skills/Blacksmith/' },

  // --- Cogworking & Automatons ---
  { cardId: 'cogworking_xp_II', name: '+20% Cogworking XP', type: 'skill_boost', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'cogworking', value: 0.20 }], icon: 'skills/Engineering/' },
  { cardId: 'automaton_deploy', name: 'Automaton Deploy', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'utility', raceBonus: 'gnome', effects: [{ type: 'summon', duration: 30 }], icon: 'skills/Engineering/', combatType: 'summon', range: 2, manaCost: 20, aoeRadius: 0, cooldown: 5, summonType: 'automaton', summonHp: 40, summonDamage: 8, summonDuration: 4, targetType: 'any' },
  { cardId: 'clockwork_sentinel', name: 'Clockwork Sentinel', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'utility', raceBonus: 'gnome', effects: [{ type: 'summon', duration: 45 }], icon: 'skills/Engineering/', combatType: 'summon', range: 2, manaCost: 25, aoeRadius: 0, cooldown: 6, summonType: 'sentinel', summonHp: 70, summonDamage: 12, summonDuration: 5, summonArmor: 10, targetType: 'any' },
  { cardId: 'overclock', name: 'Overclock', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support', archetypeSecondary: ['melee_dps'], effects: [{ type: 'buff', duration: 10 }], icon: 'skills/Engineering/', combatType: 'buff', range: 3, manaCost: 12, aoeRadius: 0, cooldown: 4, statusEffect: 'overclocked', statusDuration: 3, speedMult: 1.5, damageBoost: 4, targetType: 'ally' },
  { cardId: 'spring_loaded_trap', name: 'Spring-Loaded Trap', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'cc_dot', effects: [{ type: 'tile', element: 'physical' }], icon: 'skills/Engineering/', combatType: 'tile_effect', tileEffect: 'SPRING_TRAP', range: 4, manaCost: 8, aoeRadius: 0, cooldown: 2, targetType: 'any' },
  { cardId: 'explosive_charge', name: 'Explosive Charge', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], effects: [{ type: 'damage', element: 'fire', base: 35, scaling: 'ingenuity', factor: 0.6 }], icon: 'skills/Engineering/', combatType: 'damage', element: 'fire', baseDamage: 35, range: 3, manaCost: 15, aoeRadius: 2, cooldown: 4, scalingStat: 'ingenuity', scalingFactor: 0.6, onHitTile: 'BURNING', targetType: 'enemy' },
  { cardId: 'repair_bot', name: 'Repair Bot', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support', raceBonus: 'gnome', effects: [{ type: 'heal', base: 20, scaling: 'ingenuity', factor: 0.4 }], icon: 'skills/Engineering/', combatType: 'healing', baseHeal: 20, range: 3, manaCost: 10, aoeRadius: 0, cooldown: 3, scalingStat: 'ingenuity', scalingFactor: 0.4, targetType: 'ally' },
  { cardId: 'gear_grinder', name: 'Gear Grinder', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'craft_bonus', value: 0.15 }, { type: 'xp_bonus_skill', skill: 'cogworking', value: 0.15 }], icon: 'skills/Engineering/' },
  { cardId: 'tinker_mastery', name: 'Tinker Mastery', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'craft_bonus', value: 0.25 }, { type: 'ingredientSaveChance', value: 0.15 }, { type: 'xp_bonus_skill', skill: 'cogworking', value: 0.20 }], icon: 'skills/Engineering/' },
  { cardId: 'master_engineer', name: 'Master Engineer', type: 'passive_perk', rarity: 'legendary', archetype: 'utility', effects: [{ type: 'craft_bonus', value: 0.35 }, { type: 'craft_quality_bonus', value: 0.25 }, { type: 'summon_damage_bonus', value: 0.30 }, { type: 'summon_hp_bonus', value: 0.30 }], icon: 'skills/Engineering/' },
  { cardId: 'tesla_coil', name: 'Tesla Coil', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], raceBonus: 'gnome', effects: [{ type: 'damage', element: 'lightning', base: 25, scaling: 'ingenuity', factor: 0.5 }], icon: 'skills/Engineering/', combatType: 'damage', element: 'lightning', baseDamage: 25, range: 4, manaCost: 18, aoeRadius: 1, cooldown: 3, scalingStat: 'ingenuity', scalingFactor: 0.5, onHitTile: 'ELECTRIFIED', targetType: 'enemy' },
  { cardId: 'smoke_screen', name: 'Smoke Screen', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'scout', effects: [{ type: 'tile', element: 'smoke' }], icon: 'skills/Engineering/', combatType: 'tile_effect', tileEffect: 'SMOKE', range: 3, manaCost: 6, aoeRadius: 2, cooldown: 3, targetType: 'any' },
  { cardId: 'turret_upgrade', name: 'Turret Upgrade', type: 'passive_perk', rarity: 'rare', archetype: 'utility', raceBonus: 'gnome', effects: [{ type: 'summon_damage_bonus', value: 0.25 }, { type: 'summon_hp_bonus', value: 0.20 }], icon: 'skills/Engineering/' },

  // --- Sewing / Tailoring Cards ---
  { cardId: 'sewing_xp_I', name: 'Nimble Fingers I', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'sewing', value: 0.15 }], icon: 'skills/Blacksmith/' },
  { cardId: 'sewing_xp_II', name: 'Nimble Fingers II', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'sewing', value: 0.25 }], icon: 'skills/Blacksmith/' },
  { cardId: 'master_tailor', name: 'Master Tailor', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'craft_quality_bonus', value: 0.20 }, { type: 'sewing_armor_bonus', value: 3 }], icon: 'skills/Blacksmith/' },
  { cardId: 'silk_weaver', name: 'Silk Weaver', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'sewing_magic_resist_bonus', value: 3 }, { type: 'ingredientSaveChance', value: 0.10 }], icon: 'skills/Blacksmith/' },
  { cardId: 'leather_worker', name: 'Leather Worker', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'crafted_armor_bonus', value: 2 }, { type: 'ingredientSaveChance', value: 0.05 }], icon: 'skills/Blacksmith/' },
  { cardId: 'battle_seamstress', name: 'Battle Seamstress', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['crafting'], effects: [{ type: 'crafted_armor_bonus', value: 3 }, { type: 'craft_quality_bonus', value: 0.10 }], icon: 'skills/Blacksmith/' },
  { cardId: 'enchanted_thread', name: 'Enchanted Thread', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['magic', 'crafting'], effects: [{ type: 'sewing_magic_resist_bonus', value: 5 }, { type: 'sewing_armor_bonus', value: 2 }], icon: 'skills/Enchantment/' },
  { cardId: 'weavers_blessing', name: "Weaver's Blessing", type: 'passive_perk', rarity: 'legendary', archetype: 'utility', effects: [{ type: 'craft_quality_bonus', value: 0.25 }, { type: 'sewing_armor_bonus', value: 5 }, { type: 'sewing_magic_resist_bonus', value: 5 }, { type: 'ingredientSaveChance', value: 0.15 }], icon: 'skills/Blacksmith/' },

  // === NECROMANCY CARDS ===
  { cardId: 'necromancy_xp_I', name: 'Dark Apprentice', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'necromancy', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'raise_skeleton', name: 'Raise Skeleton', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], tags: ['necromancy', 'shadow', 'magic'], effects: [{ type: 'summon', summonType: 'skeleton', count: 1, duration: 30 }], icon: 'skills/Enchantment/', combatType: 'summon', range: 3, manaCost: 20, aoeRadius: 0, cooldown: 5, scalingStat: 'acumen', scalingFactor: 0.3, summonType: 'skeleton', summonHp: 40, summonDamage: 10, summonDuration: 30, targetType: 'empty' },
  { cardId: 'necro_life_drain', name: 'Life Drain', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'glass_cannon', archetypeSecondary: ['support'], tags: ['necromancy', 'shadow', 'magic'], effects: [{ type: 'damage', element: 'dark', base: 20, scaling: 'acumen', factor: 0.5, lifesteal: 0.50 }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'dark', baseDamage: 20, range: 3, manaCost: 15, aoeRadius: 0, cooldown: 3, scalingStat: 'acumen', scalingFactor: 0.5, lifesteal: 0.50, targetType: 'enemy' },
  { cardId: 'soul_drain', name: 'Soul Drain', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['support'], tags: ['necromancy', 'shadow', 'magic'], description: 'Rip the soul from an enemy, dealing shadow damage and restoring your health', effects: [{ type: 'damage', element: 'shadow', base: 14, scaling: 'acumen', factor: 0.4, description: 'Shadow damage with lifesteal' }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'shadow', damageType: 'shadow', baseDamage: 14, range: 4, manaCost: 12, aoeRadius: 0, cooldown: 2, scalingStat: 'acumen', scalingFactor: 0.4, lifesteal: 0.40, targetType: 'enemy' },
  { cardId: 'corpse_explosion', name: 'Corpse Explosion', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', tags: ['necromancy', 'shadow', 'magic'], effects: [{ type: 'damage', element: 'dark', base: 35, scaling: 'acumen', factor: 0.6 }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'dark', baseDamage: 35, range: 4, manaCost: 25, aoeRadius: 2, cooldown: 4, scalingStat: 'acumen', scalingFactor: 0.6, targetType: 'enemy' },
  { cardId: 'death_grip', name: 'Death Grip', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot', archetypeSecondary: ['grappler'], tags: ['necromancy', 'shadow', 'magic'], description: 'Grip an enemy with necrotic tendrils, rooting them and dealing shadow damage over time', effects: [{ type: 'damage', element: 'shadow', base: 12, scaling: 'acumen', factor: 0.3, description: 'Shadow damage + root' }, { type: 'crowd_control', ccType: 'root', duration: 2, description: 'Roots target in place' }], icon: 'skills/Enchantment/', combatType: 'debuff', element: 'shadow', damageType: 'shadow', baseDamage: 12, range: 4, manaCost: 18, aoeRadius: 0, cooldown: 4, scalingStat: 'acumen', scalingFactor: 0.3, statusEffect: 'death_grip', statusDuration: 2, targetType: 'enemy', onHitStatus: { name: 'rooted', duration: 2, speedMult: 0, tickDamage: 6, tickElement: 'shadow', type: 'debuff' } },
  { cardId: 'bone_armor', name: 'Bone Armor', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'pure_defense', archetypeSecondary: ['tank'], tags: ['necromancy', 'shadow', 'magic'], description: 'Encase yourself in bones of the fallen, gaining shadow-element armor', effects: [{ type: 'shield', base: 40, scaling: 'acumen', factor: 0.4, description: 'Shadow defense shield' }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 14, aoeRadius: 0, cooldown: 4, statusEffect: 'bone_armor', statusDuration: 3, armorBoost: 10, targetType: 'self' },
  { cardId: 'death_aura', name: 'Death Aura', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'], tags: ['necromancy', 'shadow', 'magic'], description: 'Enemies near you take shadow damage each turn', effects: [{ type: 'shadow_aura', value: 8, description: 'Shadow damage to nearby enemies per turn' }], icon: 'skills/Enchantment/', combatPassive: { type: 'poison_aura', damage: 8, element: 'shadow', range: 1, value: 8 } },
  { cardId: 'death_pact', name: 'Death Pact', type: 'passive_perk', rarity: 'legendary', archetype: 'glass_cannon', tags: ['necromancy', 'shadow', 'magic'], effects: [{ type: 'on_kill_heal', value: 0.15 }, { type: 'xp_bonus_skill', skill: 'necromancy', value: 0.30 }], icon: 'skills/Enchantment/', combatPassive: { type: 'heal_on_kill', value: 20 } },

  // === LIFE MAGIC CARDS ===
  { cardId: 'life_magic_xp_I', name: 'Healer Initiate', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'life_magic', value: 0.15 }], icon: 'skills/Skill_Heal.PNG' },
  { cardId: 'healing_light', name: 'Healing Light', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'support', tags: ['life_magic', 'holy', 'magic'], description: 'Channel holy light to mend wounds of a single target', effects: [{ type: 'heal', base: 22, scaling: 'acumen', factor: 0.4, description: 'Single target heal' }], icon: 'skills/Skill_Heal.PNG', combatType: 'healing', element: 'holy', baseHeal: 22, range: 5, manaCost: 10, aoeRadius: 0, cooldown: 2, scalingStat: 'acumen', scalingFactor: 0.4, targetType: 'ally' },
  { cardId: 'greater_heal', name: 'Greater Heal', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', tags: ['life_magic', 'holy', 'magic'], effects: [{ type: 'heal', base: 40, scaling: 'resolve', factor: 0.6 }], icon: 'skills/Skill_Heal.PNG', combatType: 'healing', element: 'holy', baseHeal: 40, range: 4, manaCost: 20, aoeRadius: 0, cooldown: 3, scalingStat: 'resolve', scalingFactor: 0.6, targetType: 'ally' },
  { cardId: 'life_regeneration', name: 'Regeneration', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', tags: ['life_magic', 'holy', 'magic'], description: 'Imbue a target with regenerative holy energy, healing over time', effects: [{ type: 'heal_over_time', base: 8, ticks: 5, scaling: 'acumen', factor: 0.3, description: 'HP regeneration buff' }], icon: 'skills/Skill_Heal.PNG', combatType: 'buff', element: 'holy', range: 4, manaCost: 16, aoeRadius: 0, cooldown: 3, scalingStat: 'acumen', scalingFactor: 0.3, statusEffect: 'regeneration', statusDuration: 5, healPerTurn: 8, targetType: 'ally', isHoT: true, hotTicks: 5 },
  { cardId: 'life_purify', name: 'Purify', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'support', tags: ['life_magic', 'holy', 'magic'], description: 'Remove all debuffs from a target with purifying light', effects: [{ type: 'cleanse', removeDebuffs: 'all', description: 'Remove all debuffs' }], icon: 'skills/Skill_Heal.PNG', combatType: 'buff', element: 'holy', range: 4, manaCost: 12, aoeRadius: 0, cooldown: 3, statusEffect: 'cleanse', statusDuration: 0, targetType: 'ally' },
  { cardId: 'barrier_of_light', name: 'Barrier of Light', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', archetypeSecondary: ['pure_defense'], tags: ['life_magic', 'holy', 'magic'], description: 'Surround a target with a holy damage shield that absorbs hits and reflects damage', effects: [{ type: 'shield', base: 35, scaling: 'acumen', factor: 0.5, description: 'Holy shield that absorbs and reflects' }, { type: 'damage_reflect', value: 0.15, description: 'Reflects 15% of absorbed damage' }], icon: 'skills/Skill_Heal.PNG', combatType: 'buff', element: 'holy', range: 4, manaCost: 18, aoeRadius: 0, cooldown: 4, scalingStat: 'acumen', scalingFactor: 0.5, statusEffect: 'barrier_of_light', statusDuration: 3, armorBoost: 8, damageReflect: 0.15, targetType: 'ally' },
  { cardId: 'mass_heal', name: 'Mass Heal', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'support', archetypeSecondary: ['pure_defense'], tags: ['life_magic', 'holy', 'magic'], description: 'Unleash a wave of healing light that restores health to all allies', effects: [{ type: 'heal_all', base: 25, scaling: 'resolve', factor: 0.4 }], icon: 'skills/Skill_Heal.PNG', combatType: 'healing', element: 'holy', baseHeal: 25, range: 0, manaCost: 35, aoeRadius: 0, cooldown: 5, scalingStat: 'resolve', scalingFactor: 0.4, targetType: 'all_allies' },
  // [REMOVED: life_resurrection - duplicate of resurrection card at line 831]
  { cardId: 'divine_grace', name: 'Divine Grace', type: 'passive_perk', rarity: 'legendary', archetype: 'support', tags: ['life_magic', 'holy', 'magic'], effects: [{ type: 'heal_power_bonus', value: 0.25 }, { type: 'xp_bonus_skill', skill: 'life_magic', value: 0.20 }], icon: 'skills/Skill_Heal.PNG', combatPassive: { type: 'hp_regen', value: 4 } },

  // === CLERIC / PURIFIER CARDS (support archetype — corruption cleansing role) ===
  { cardId: 'purifying_light', name: 'Purifying Light', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', tags: ['holy', 'magic', 'cleanse'], description: 'A burst of holy light that cleanses corruption from allies and damages undead.',
    effects: [{ type: 'cleanse_debuff', targets: 'all_allies' }, { type: 'damage', element: 'holy', base: 20, scaling: 'resolve', factor: 0.4 }],
    icon: 'skills/Skill_Heal.PNG', combatType: 'healing', element: 'holy', baseHeal: 0, baseDamage: 20, range: 3, manaCost: 18, aoeRadius: 2, cooldown: 4, scalingStat: 'resolve', scalingFactor: 0.4, targetType: 'all_allies',
    statusCleanse: ['corruption', 'slow', 'bleed', 'doom'] },
  { cardId: 'sanctified_ward', name: 'Sanctified Ward', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'support', archetypeSecondary: ['pure_defense'], tags: ['holy', 'magic', 'cleanse'], description: 'Places a holy ward that reduces corruption damage by 50% and heals allies within.',
    effects: [{ type: 'ground_zone', zoneType: 'sanctified_ward', radius: 2, duration: 4, healPerTurn: 15, corruptionResist: 0.5 }],
    icon: 'skills/Skill_Heal.PNG', combatType: 'buff', range: 3, manaCost: 25, aoeRadius: 2, cooldown: 6, scalingStat: 'resolve', scalingFactor: 0.3, targetType: 'ground' },
  { cardId: 'corruption_resistance', name: 'Corruption Resistance', type: 'passive_perk', rarity: 'uncommon', archetype: 'support', tags: ['holy', 'cleanse'], description: 'Reduces corruption damage taken by 30%.',
    effects: [{ type: 'corruption_resist', value: 0.30 }], icon: 'skills/Skill_Heal.PNG', combatPassive: { type: 'corruption_resist', value: 0.30 } },
  { cardId: 'holy_bulwark', name: 'Holy Bulwark', type: 'passive_perk', rarity: 'rare', archetype: 'support', archetypeSecondary: ['pure_defense'], tags: ['holy', 'magic', 'cleanse'], description: 'Grants +15% healing power and immunity to corruption slow effects.',
    effects: [{ type: 'heal_power_bonus', value: 0.15 }, { type: 'corruption_slow_immunity', value: true }],
    icon: 'skills/Skill_Heal.PNG', combatPassive: { type: 'hp_regen', value: 2 } },
  { cardId: 'radiant_cleanse', name: 'Radiant Cleanse', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', tags: ['holy', 'magic', 'cleanse'], description: 'Removes all negative status effects from target ally and grants a brief shield.',
    effects: [{ type: 'cleanse_all_debuffs', targets: 'ally' }, { type: 'shield', value: 25, duration: 3 }],
    icon: 'skills/Skill_Heal.PNG', combatType: 'buff', range: 5, manaCost: 15, aoeRadius: 0, cooldown: 4, scalingStat: 'resolve', scalingFactor: 0.2, targetType: 'ally',
    statusCleanse: ['all'] },
  { cardId: 'beacon_of_hope', name: 'Beacon of Hope', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'support', archetypeSecondary: ['pure_defense'], tags: ['holy', 'magic', 'cleanse', 'life_magic'], description: 'Massive AoE heal that cleanses all debuffs, grants corruption immunity for 3 turns, and damages all undead enemies.',
    effects: [{ type: 'heal_all', base: 40, scaling: 'resolve', factor: 0.6 }, { type: 'cleanse_all_debuffs', targets: 'all_allies' }, { type: 'corruption_immunity', duration: 3 }, { type: 'damage_undead', base: 50, scaling: 'resolve', factor: 0.5 }],
    icon: 'skills/Skill_Heal.PNG', combatType: 'healing', element: 'holy', baseHeal: 40, baseDamage: 50, range: 0, manaCost: 40, aoeRadius: 0, cooldown: 8, scalingStat: 'resolve', scalingFactor: 0.6, targetType: 'all_allies',
    statusCleanse: ['all'] },
  { cardId: 'clerics_devotion', name: "Cleric's Devotion", type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support', tags: ['holy', 'magic', 'cleanse'], description: 'Healing spells also cleanse 1 random debuff. +20% healing power in corrupted areas.',
    effects: [{ type: 'heal_cleanse_random', value: 1 }, { type: 'corruption_area_heal_bonus', value: 0.20 }],
    icon: 'skills/Skill_Heal.PNG', combatPassive: { type: 'hp_regen', value: 3 } },
  { cardId: 'purifiers_oath', name: "Purifier's Oath", type: 'passive_perk', rarity: 'legendary', archetype: 'support', archetypeSecondary: ['pure_defense'], tags: ['holy', 'magic', 'cleanse'], description: 'Grants +25% damage to undead, +50% corruption resistance, and purification crystals are 50% more effective.',
    effects: [{ type: 'damage_bonus_undead', value: 0.25 }, { type: 'corruption_resist', value: 0.50 }, { type: 'purification_crystal_bonus', value: 0.50 }],
    icon: 'skills/Skill_Heal.PNG', combatPassive: { type: 'hp_regen', value: 2 } },

  // === ACTIVE OVERWORLD CORRUPTION CLEANSING CARDS ===
  // These cards let players push back corruption without purification crystals,
  // but drain HP and mana — leaving the player vulnerable afterward.
  { cardId: 'minor_purification', name: 'Minor Purification', type: 'active_overworld', rarity: 'rare', archetype: 'support', tags: ['holy', 'cleanse', 'overworld'],
    description: 'Channel holy energy to cleanse a small area of corruption. Drains 15% of your life force and 20 mana.',
    effects: [{ type: 'overworld_cleanse', radius: 1, cleanseAmount: 30, hpCostPct: 0.15, manaCost: 20, cooldown: 30 }],
    icon: 'skills/Skill_Heal.PNG' },
  { cardId: 'rite_of_cleansing', name: 'Rite of Cleansing', type: 'active_overworld', rarity: 'ultra_rare', archetype: 'support', tags: ['holy', 'cleanse', 'overworld'],
    description: 'Perform a purification rite that cleanses corruption in a moderate radius. Drains 25% of your life force and 40 mana.',
    effects: [{ type: 'overworld_cleanse', radius: 2, cleanseAmount: 45, hpCostPct: 0.25, manaCost: 40, cooldown: 60 }],
    icon: 'skills/Skill_Heal.PNG' },
  { cardId: 'divine_exorcism', name: 'Divine Exorcism', type: 'active_overworld', rarity: 'legendary', archetype: 'support', tags: ['holy', 'cleanse', 'overworld'],
    description: 'Unleash a devastating wave of divine power that purges corruption across a wide area. Costs 40% life force and 60 mana.',
    effects: [{ type: 'overworld_cleanse', radius: 4, cleanseAmount: 60, hpCostPct: 0.40, manaCost: 60, cooldown: 120 }],
    icon: 'skills/Skill_Heal.PNG' },
  { cardId: 'martyrs_sacrifice', name: "Martyr's Sacrifice", type: 'active_overworld', rarity: 'mythic_rare', archetype: 'support', archetypeSecondary: ['pure_defense'], tags: ['holy', 'cleanse', 'overworld', 'life_magic'],
    description: 'Sacrifice nearly all life force to unleash a massive holy purge. Cleanses a huge radius but leaves you near death and spiritually drained for 60 seconds.',
    effects: [{ type: 'overworld_cleanse', radius: 6, cleanseAmount: 80, hpCostPct: 0.70, manaCost: 999, cooldown: 300, debuff: 'spiritually_drained', debuffDuration: 60 }],
    icon: 'skills/Skill_Heal.PNG' },

  // === ALCHEMY CARDS ===
  { cardId: 'alchemist_apprentice', name: 'Alchemist Apprentice', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'alchemy', value: 0.15 }], icon: 'skills/Alchemy/' },
  { cardId: 'journeyman_alchemist', name: 'Journeyman Alchemist', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'alchemy', value: 0.25 }], icon: 'skills/Alchemy/' },
  { cardId: 'potion_mastery', name: 'Potion Mastery', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'potion_potency_bonus', value: 0.15 }, { type: 'ingredientSaveChance', value: 0.10 }], icon: 'skills/Alchemy/' },
  { cardId: 'transmutation_adept', name: 'Transmutation Adept', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'transmutation_bonus', value: 0.20 }, { type: 'xp_bonus_skill', skill: 'transmutation', value: 0.20 }], icon: 'skills/Alchemy/' },
  { cardId: 'philosophers_wisdom', name: "Philosopher's Wisdom", type: 'passive_perk', rarity: 'legendary', archetype: 'utility', effects: [{ type: 'potion_potency_bonus', value: 0.25 }, { type: 'ingredientSaveChance', value: 0.15 }, { type: 'doublePotionChance', value: 0.12 }], icon: 'skills/Alchemy/' },

  // === ENCHANTING CARDS ===
  { cardId: 'enchanter_novice', name: 'Enchanter Novice', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'enchanting', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'enchanter_adept', name: 'Enchanter Adept', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'enchanting', value: 0.25 }], icon: 'skills/Enchantment/' },
  { cardId: 'arcane_infusion_craft', name: 'Arcane Infusion', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'enchant_power_bonus', value: 0.15 }, { type: 'ingredientSaveChance', value: 0.08 }], icon: 'skills/Enchantment/' },
  { cardId: 'master_enchanter_card', name: 'Master Enchanter', type: 'passive_perk', rarity: 'legendary', archetype: 'utility', effects: [{ type: 'enchant_power_bonus', value: 0.30 }, { type: 'doubleEnchantChance', value: 0.10 }], icon: 'skills/Enchantment/' },

  // === ANIMAL HANDLING CARDS ===
  { cardId: 'animal_handling_xp_I', name: 'Beast Friend', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'animal_handling', value: 0.15 }], icon: 'skills/Herbalism/' },
  { cardId: 'tame_beast', name: 'Tame Beast', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'utility', effects: [{ type: 'tame', successChance: 0.30 }], icon: 'skills/Herbalism/', combatType: 'utility', range: 3, manaCost: 15, aoeRadius: 0, cooldown: 10, targetType: 'enemy' },
  { cardId: 'pack_leader', name: 'Pack Leader', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'pet_damage_bonus', value: 0.20 }, { type: 'pet_health_bonus', value: 0.15 }], icon: 'skills/Herbalism/' },
  { cardId: 'beast_master', name: 'Beast Master', type: 'passive_perk', rarity: 'legendary', archetype: 'utility', effects: [{ type: 'pet_damage_bonus', value: 0.35 }, { type: 'pet_health_bonus', value: 0.25 }, { type: 'extra_pet_slot', value: 1 }], icon: 'skills/Herbalism/' },

  // === PSYCHOLOGY & BARDIC CARDS (merged skill: debuffs, crowd control, buffs, performance) ===
  { cardId: 'psychology_xp_I', name: 'Mind Reader', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'psychology', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'psych_war_cry', name: 'War Cry', type: 'active_ability', rarity: 'uncommon', resourceType: 'bloodlust', archetype: 'support', archetypeSecondary: ['melee_dps'], tags: ['psychology', 'bardic'], description: 'Let out a ferocious war cry, boosting damage for all nearby allies', effects: [{ type: 'buff_all', stat: 'damage', value: 0.20, duration: 12, description: '+20% damage for all allies' }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'buff', range: 0, manaCost: 14, aoeRadius: 3, cooldown: 4, statusEffect: 'war_cry_psych', statusDuration: 3, damageBoost: 5, targetType: 'all_allies' },
  { cardId: 'terrifying_shout', name: 'Terrifying Shout', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'cc_dot', archetypeSecondary: ['support'], tags: ['psychology', 'bardic'], description: 'Unleash a terrifying shout that causes enemies to deal less damage and may flee', effects: [{ type: 'debuff_aoe', stat: 'damage', value: -0.30, duration: 8, description: 'Enemies deal -30% damage, chance to flee' }, { type: 'crowd_control', ccType: 'fear', chance: 0.30, duration: 1 }], icon: 'skills/Enchantment/', combatType: 'debuff', range: 0, manaCost: 20, aoeRadius: 3, cooldown: 4, statusEffect: 'terrified_shout', statusDuration: 3, targetType: 'all_enemies', onHitStatus: { name: 'terrified', duration: 2, damageReduction: 0.30, fleeChance: 0.30, type: 'debuff' } },
  { cardId: 'demoralize', name: 'Demoralize', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'cc_dot', tags: ['psychology'], effects: [{ type: 'debuff', stat: 'damage', value: -0.15, duration: 10 }], icon: 'skills/Enchantment/', combatType: 'debuff', range: 4, manaCost: 10, aoeRadius: 0, cooldown: 3, statusEffect: 'demoralized', statusDuration: 3, targetType: 'enemy' },
  { cardId: 'terrify', name: 'Terrify', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'cc_dot', tags: ['psychology'], effects: [{ type: 'crowd_control', ccType: 'fear', duration: 2 }], icon: 'skills/Enchantment/', combatType: 'debuff', range: 3, manaCost: 18, aoeRadius: 0, cooldown: 4, statusEffect: 'terrified', statusDuration: 2, targetType: 'enemy' },
  { cardId: 'psych_inspire', name: 'Inspire', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'support', tags: ['psychology', 'bardic'], description: 'Inspire a single ally, boosting all their stats temporarily', effects: [{ type: 'buff', stat: 'all', value: 0.15, duration: 15, description: '+15% all stats for one ally' }], icon: 'skills/Enchantment/', combatType: 'buff', range: 4, manaCost: 12, aoeRadius: 0, cooldown: 3, statusEffect: 'inspired_psych', statusDuration: 5, statBoost: { might: 2, acumen: 2, finesse: 2, vigor: 2, resolve: 2 }, targetType: 'ally' },
  { cardId: 'mind_break', name: 'Mind Break', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot', tags: ['psychology', 'arcane', 'magic'], description: 'Assault an enemy mind with psychic force, dealing arcane damage with a chance to stun', effects: [{ type: 'damage', element: 'arcane', base: 28, scaling: 'acumen', factor: 0.5, description: 'Arcane psychic damage' }, { type: 'crowd_control', ccType: 'stun', chance: 0.35, duration: 1, description: '35% chance to stun' }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'arcane', damageType: 'arcane', baseDamage: 28, range: 4, manaCost: 18, aoeRadius: 0, cooldown: 3, scalingStat: 'acumen', scalingFactor: 0.5, targetType: 'enemy', onHitStatus: { name: 'stunned', duration: 1, chance: 0.35, type: 'debuff' } },
  { cardId: 'inspiring_song', name: 'Inspiring Song', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'support', tags: ['psychology', 'bardic'], effects: [{ type: 'buff_all', stat: 'damage', value: 0.10, duration: 15 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 12, aoeRadius: 0, cooldown: 4, statusEffect: 'inspired', statusDuration: 3, damageBoost: 3, targetType: 'all_allies' },
  { cardId: 'bardic_melody', name: 'Bardic Melody', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support', archetypeSecondary: ['glass_cannon'], tags: ['psychology', 'bardic', 'magic'], description: 'Play an enchanting melody that regenerates HP and mana for all allies', effects: [{ type: 'heal_over_time', base: 6, ticks: 4, description: 'HP regen to all allies' }, { type: 'mana_regen_buff', value: 3, duration: 12, description: 'Mana regen to all allies' }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 22, aoeRadius: 0, cooldown: 5, statusEffect: 'bardic_melody', statusDuration: 4, healPerTurn: 6, manaPerTurn: 3, targetType: 'all_allies' },
  { cardId: 'demotivate', name: 'Demotivate', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'cc_dot', tags: ['psychology'], description: 'Crush an enemy spirit, reducing their defense and movement speed', effects: [{ type: 'debuff', stat: 'defense', value: -0.20, duration: 10, description: 'Reduce defense and speed' }], icon: 'skills/Enchantment/', combatType: 'debuff', range: 4, manaCost: 10, aoeRadius: 0, cooldown: 3, statusEffect: 'demotivated', statusDuration: 3, targetType: 'enemy', onHitStatus: { name: 'demotivated', duration: 3, armorReduction: 5, speedMult: 0.7, type: 'debuff' } },
  { cardId: 'lullaby', name: 'Lullaby', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'cc_dot', tags: ['psychology', 'bardic'], effects: [{ type: 'crowd_control', ccType: 'sleep', duration: 2 }], icon: 'skills/Enchantment/', combatType: 'debuff', range: 4, manaCost: 20, aoeRadius: 2, cooldown: 5, statusEffect: 'asleep', statusDuration: 2, targetType: 'enemy' },
  { cardId: 'battle_hymn', name: 'Battle Hymn', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'support', archetypeSecondary: ['tank'], tags: ['psychology', 'bardic'], effects: [{ type: 'buff_all', stat: 'all', value: 0.10, duration: 20 }], icon: 'skills/Enchantment/', combatType: 'buff', range: 0, manaCost: 25, aoeRadius: 0, cooldown: 6, statusEffect: 'battle_hymn', statusDuration: 4, damageBoost: 4, armorBoost: 4, targetType: 'all_allies' },

  // === WEATHER MAGIC CARDS ===
  { cardId: 'weather_magic_xp_I', name: 'Storm Caller', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'weather_magic', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'weather_gust', name: 'Gust', type: 'active_ability', rarity: 'common', resourceType: 'mana', archetype: 'glass_cannon', tags: ['weather_magic', 'magic'], effects: [{ type: 'damage', element: 'wind', base: 12, scaling: 'acumen', factor: 0.3 }], icon: 'skills/Enchantment/', combatType: 'damage', element: 'wind', baseDamage: 12, range: 3, manaCost: 8, aoeRadius: 0, cooldown: 2, scalingStat: 'acumen', scalingFactor: 0.3, targetType: 'enemy' },
  { cardId: 'lightning_strike', name: 'Lightning Strike', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', tags: ['weather_magic', 'magic'], description: 'Call down a focused bolt of lightning on a single target for high damage', effects: [{ type: 'damage', element: 'lightning', base: 38, scaling: 'acumen', factor: 0.65, description: 'High single-target lightning damage' }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'lightning', damageType: 'lightning', baseDamage: 38, range: 6, manaCost: 18, aoeRadius: 0, cooldown: 3, scalingStat: 'acumen', scalingFactor: 0.65, onHitTile: 'ELECTRIFIED', targetType: 'enemy' },
  { cardId: 'call_lightning', name: 'Call Lightning', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', tags: ['weather_magic', 'magic'], effects: [{ type: 'damage', element: 'lightning', base: 30, scaling: 'acumen', factor: 0.6 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'lightning', baseDamage: 30, range: 5, manaCost: 22, aoeRadius: 1, cooldown: 4, scalingStat: 'acumen', scalingFactor: 0.6, targetType: 'enemy' },
  { cardId: 'blizzard', name: 'Blizzard', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], tags: ['weather_magic', 'magic'], description: 'Summon a howling blizzard that freezes the ground and deals ice damage to all in the area', effects: [{ type: 'damage', element: 'ice', base: 30, scaling: 'acumen', factor: 0.5, description: 'AoE ice damage' }, { type: 'slow', value: 0.40, duration: 3, description: 'Slows enemies by 40%' }], icon: 'skills/Skill_Explosion.PNG', combatType: 'tile_effect', tileEffect: 'FROZEN', element: 'ice', damageType: 'ice', baseDamage: 30, range: 5, manaCost: 28, aoeRadius: 2, cooldown: 5, scalingStat: 'acumen', scalingFactor: 0.5, targetType: 'any', onHitStatus: { name: 'chilled', duration: 3, speedMult: 0.6, tickDamage: 5, type: 'debuff' } },
  { cardId: 'weather_tornado', name: 'Tornado', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], tags: ['weather_magic', 'magic'], description: 'Conjure a violent tornado that deals wind damage and knocks enemies back', effects: [{ type: 'damage', element: 'wind', base: 30, scaling: 'acumen', factor: 0.5, description: 'AoE wind damage with knockback' }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'wind', damageType: 'wind', baseDamage: 30, range: 5, manaCost: 20, aoeRadius: 1, cooldown: 4, scalingStat: 'acumen', scalingFactor: 0.5, targetType: 'enemy', knockback: 2 },
  { cardId: 'weather_earthquake', name: 'Earthquake', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'], tags: ['weather_magic', 'magic'], description: 'Shake the earth violently, dealing massive damage to all enemies with a chance to stun', effects: [{ type: 'damage', element: 'earth', base: 42, scaling: 'acumen', factor: 0.6, description: 'AoE earth damage with stun chance' }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'earth', damageType: 'earth', baseDamage: 42, range: 4, manaCost: 28, aoeRadius: 2, cooldown: 5, scalingStat: 'acumen', scalingFactor: 0.6, targetType: 'all_enemies', onHitStatus: { name: 'stunned', duration: 1, chance: 0.40, type: 'debuff' } },
  { cardId: 'fog_bank', name: 'Fog Bank', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'support', archetypeSecondary: ['scout'], tags: ['weather_magic', 'magic'], description: 'Create a thick fog bank that grants allies increased dodge chance', effects: [{ type: 'buff_all', stat: 'dodge', value: 0.30, duration: 12, description: '+30% dodge for allies in fog' }], icon: 'skills/Enchantment/', combatType: 'buff', element: 'wind', range: 0, manaCost: 14, aoeRadius: 2, cooldown: 4, statusEffect: 'fog_bank', statusDuration: 3, dodgeBoost: 0.30, targetType: 'all_allies' },
  { cardId: 'sunfire', name: 'Sunfire', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', tags: ['weather_magic', 'magic'], description: 'Focus the searing power of the sun on an enemy, dealing fire damage and applying a burning DoT', effects: [{ type: 'damage', element: 'fire', base: 25, scaling: 'acumen', factor: 0.5, description: 'Fire damage with burning DoT' }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'fire', damageType: 'fire', baseDamage: 25, range: 5, manaCost: 16, aoeRadius: 0, cooldown: 3, scalingStat: 'acumen', scalingFactor: 0.5, onHitTile: 'BURNING', targetType: 'enemy', onHitStatus: { name: 'burning', duration: 3, tickDamage: 6, type: 'debuff' } },
  { cardId: 'tempest', name: 'Tempest', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'glass_cannon', tags: ['weather_magic', 'magic'], effects: [{ type: 'damage', element: 'lightning', base: 50, scaling: 'acumen', factor: 0.8 }], icon: 'skills/Skill_Explosion.PNG', combatType: 'damage', element: 'lightning', baseDamage: 50, range: 5, manaCost: 40, aoeRadius: 3, cooldown: 6, scalingStat: 'acumen', scalingFactor: 0.8, targetType: 'enemy' },

  // === BREWING CARDS ===
  { cardId: 'brewing_xp_I', name: 'Brewmaster Novice', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'brewing', value: 0.15 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'master_brewer_card', name: 'Master Brewer', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'brew_potency_bonus', value: 0.15 }, { type: 'ingredientSaveChance', value: 0.10 }], icon: 'skills/Cooking_fishing/' },

  // === JEWELCRAFTING CARDS ===
  { cardId: 'jewelcrafting_xp_I', name: 'Gem Cutter', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'jewelcrafting', value: 0.15 }], icon: 'skills/Blacksmith/' },
  { cardId: 'master_jeweler_card', name: 'Master Jeweler', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'craft_quality_bonus', value: 0.15 }, { type: 'gem_yield_bonus', value: 0.20 }], icon: 'skills/Blacksmith/' },

  // === SKINNING / HERBALISM / FORAGING / MISC CARDS ===
  { cardId: 'skinning_xp_I', name: 'Skinner', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'skinning', value: 0.15 }], icon: 'skills/Blacksmith/' },
  { cardId: 'herbalism_xp_I', name: 'Herbalist', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'herbalism', value: 0.15 }], icon: 'skills/Herbalism/' },
  { cardId: 'foraging_xp_I', name: 'Forager', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'foraging', value: 0.15 }], icon: 'skills/Herbalism/' },
  { cardId: 'survival_xp_I', name: 'Survivalist', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'survival', value: 0.15 }], icon: 'skills/Blacksmith/' },
  // === ANATOMY CARDS ===
  { cardId: 'anatomy_xp_I', name: 'Anatomist', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'anatomy', value: 0.15 }], icon: 'skills/Herbalism/' },
  { cardId: 'weak_point_strike', name: 'Weak Point Strike', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'assassin', archetypeSecondary: ['melee_dps'], tags: ['anatomy', 'melee'], description: 'Strike a known weak point for greatly increased critical hit chance', effects: [{ type: 'damage', element: 'physical', base: 16, scaling: 'finesse', factor: 0.5, description: 'Physical damage with +50% crit chance' }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'damage', baseDamage: 16, range: 1, manaCost: 8, aoeRadius: 0, cooldown: 2, scalingStat: 'finesse', scalingFactor: 0.5, targetType: 'enemy', critBonus: 0.50 },
  { cardId: 'crippling_blow', name: 'Crippling Blow', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'cc_dot', tags: ['anatomy', 'melee'], description: 'Target a joint or tendon, dealing damage and reducing enemy speed and attack power', effects: [{ type: 'damage', element: 'physical', base: 22, scaling: 'finesse', factor: 0.5, description: 'Physical damage + cripple' }, { type: 'debuff', stat: 'speed', value: -0.30, duration: 8, description: 'Reduce speed and damage' }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'damage', baseDamage: 22, range: 1, manaCost: 14, aoeRadius: 0, cooldown: 3, scalingStat: 'finesse', scalingFactor: 0.5, targetType: 'enemy', onHitStatus: { name: 'crippled', duration: 3, speedMult: 0.5, damageReduction: 0.20, type: 'debuff' } },
  { cardId: 'vital_strike', name: 'Vital Strike', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'bloodlust', archetype: 'assassin', archetypeSecondary: ['melee_dps'], tags: ['anatomy', 'melee'], description: 'Target a vital organ for massive damage against wounded enemies below 30% HP', effects: [{ type: 'damage', element: 'physical', base: 45, scaling: 'finesse', factor: 0.7, description: 'Execute: massive damage to targets below 30% HP' }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'damage', baseDamage: 45, range: 1, manaCost: 20, aoeRadius: 0, cooldown: 4, scalingStat: 'finesse', scalingFactor: 0.7, targetType: 'enemy', executeThreshold: 0.30, executeBonusDamage: 1.0 },
  { cardId: 'pressure_points', name: 'Pressure Points', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'cc_dot', archetypeSecondary: ['grappler'], tags: ['anatomy', 'melee'], description: 'Strike precise nerve clusters to stun the target for 2 turns', effects: [{ type: 'crowd_control', ccType: 'stun', duration: 2, description: 'Stun target for 2 turns' }], icon: 'skills/Skill_SwordAttack.PNG', combatType: 'debuff', baseDamage: 8, range: 1, manaCost: 16, aoeRadius: 0, cooldown: 4, scalingStat: 'finesse', scalingFactor: 0.3, statusEffect: 'stunned', statusDuration: 2, targetType: 'enemy', onHitStatus: { name: 'stunned', duration: 2, type: 'debuff' } },
  { cardId: 'field_surgery', name: 'Field Surgery', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support', archetypeSecondary: ['utility'], tags: ['anatomy', 'healing'], description: 'Use anatomical knowledge to heal an ally and remove one debuff', effects: [{ type: 'heal', base: 30, scaling: 'finesse', factor: 0.4, description: 'Heal ally' }, { type: 'cleanse', removeDebuffs: 1, description: 'Remove one debuff' }], icon: 'skills/Skill_Heal.PNG', combatType: 'healing', baseHeal: 30, range: 1, manaCost: 14, aoeRadius: 0, cooldown: 3, scalingStat: 'finesse', scalingFactor: 0.4, targetType: 'ally' },
  { cardId: 'gourmand_I', name: 'Gourmand', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'food_duration_bonus', value: 0.20 }, { type: 'xp_bonus_skill', skill: 'gourmand', value: 0.15 }], icon: 'skills/Cooking_fishing/' },
  { cardId: 'carpentry_xp_I', name: 'Carpenter', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'carpentry', value: 0.15 }], icon: 'skills/Blacksmith/' },
  { cardId: 'leatherworking_xp_I', name: 'Leatherworker', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'leatherworking', value: 0.15 }], icon: 'skills/Blacksmith/' },
  { cardId: 'sigil_scripting_xp_I', name: 'Scribe Initiate', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'sigil_scripting', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'transmutation_xp_I', name: 'Transmuter', type: 'passive_perk', rarity: 'common', archetype: 'utility', effects: [{ type: 'xp_bonus_skill', skill: 'transmutation', value: 0.15 }], icon: 'skills/Alchemy/' },

  // === DURABILITY & REPAIR CARDS (Blacksmithing) ===
  { cardId: 'master_mender', name: 'Master Mender', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'repair_cost_reduction', value: 0.25 }], icon: 'skills/Blacksmith/', description: '-25% repair resource cost' },
  { cardId: 'durable_craft', name: 'Durable Craft', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'crafted_durability_bonus', value: 0.15 }], icon: 'skills/Blacksmith/', description: '+15% max durability on crafted items' },
  { cardId: 'emergency_patch', name: 'Emergency Patch', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'utility', effects: [{ type: 'field_repair', percent: 0.10, cooldown: 600 }], icon: 'skills/Blacksmith/', description: 'Repair 10% durability without station (10 min cooldown)' },
  { cardId: 'indestructible', name: 'Indestructible', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility', effects: [{ type: 'indestructible_chance', value: 0.05 }], icon: 'skills/Blacksmith/', description: '5% chance to not lose durability' },
  { cardId: 'salvage_expert', name: 'Salvage Expert', type: 'passive_perk', rarity: 'rare', archetype: 'utility', effects: [{ type: 'salvage_return', value: 0.50 }], icon: 'skills/Blacksmith/', description: 'Broken items can be salvaged for 50% materials' },
  { cardId: 'whetstone', name: 'Whetstone', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'weapon_durability_bonus', value: 0.10 }], icon: 'skills/Blacksmith/', description: '+10% weapon durability (reduces loss rate)' },
  { cardId: 'armorsmith', name: 'Armorsmith', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'armor_durability_bonus', value: 0.10 }], icon: 'skills/Blacksmith/', description: '+10% armor durability (reduces loss rate)' },
  { cardId: 'quick_fix', name: 'Quick Fix', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', effects: [{ type: 'repair_speed_bonus', value: 0.50 }, { type: 'repair_cost_reduction', value: 0.10 }], icon: 'skills/Blacksmith/', description: '50% faster repair, 10% cheaper repairs' },

  // ========================================================================
  // BATCH 2: Crafting/Gathering/Utility Active Abilities & Impactful Passives
  // ========================================================================

  // === ALCHEMY ACTIVE ABILITIES ===
  { cardId: 'poison_bomb', name: 'Poison Bomb', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'],
    tags: ['alchemy', 'poison', 'crafting'],
    description: 'Throw a vial of concentrated poison, creating a toxic cloud that damages enemies over time',
    effects: [{ type: 'tile', description: 'Creates poison cloud', value: 3 }],
    icon: 'skills/Alchemy/',
    combatType: 'tile_effect', tileEffect: 'POISONED', tileDuration: 3,
    element: 'poison', damageType: 'poison',
    range: 4, manaCost: 20, aoeRadius: 2, cooldown: 4,
    scalingStat: 'ingenuity', scalingFactor: 0.4,
    targetType: 'any' },

  { cardId: 'healing_elixir', name: 'Healing Elixir', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'support',
    tags: ['alchemy', 'crafting'],
    description: 'Quickly administer a potent healing elixir brewed from rare reagents',
    effects: [{ type: 'heal', base: 30, scaling: 'ingenuity', factor: 0.4 }],
    icon: 'skills/Alchemy/',
    combatType: 'healing', baseHeal: 30,
    range: 1, manaCost: 10, aoeRadius: 0, cooldown: 3,
    scalingStat: 'ingenuity', scalingFactor: 0.4,
    targetType: 'ally' },

  { cardId: 'explosive_flask', name: 'Explosive Flask', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'glass_cannon',
    tags: ['alchemy', 'crafting'],
    description: 'Hurl a volatile flask that detonates on impact, engulfing the area in alchemical fire',
    effects: [{ type: 'damage', element: 'fire', base: 28, scaling: 'ingenuity', factor: 0.5 }],
    icon: 'skills/Alchemy/',
    combatType: 'damage', element: 'fire', baseDamage: 28,
    range: 4, manaCost: 15, aoeRadius: 1, cooldown: 3,
    scalingStat: 'ingenuity', scalingFactor: 0.5,
    onHitTile: 'BURNING',
    targetType: 'enemy' },

  { cardId: 'transmute_shield', name: 'Transmute Shield', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'pure_defense',
    tags: ['alchemy', 'crafting'],
    description: 'Transmute ambient matter into a shimmering alchemical barrier that absorbs incoming damage',
    effects: [{ type: 'shield', base: 30, scaling: 'ingenuity', factor: 0.4 }],
    icon: 'skills/Alchemy/',
    combatType: 'buff',
    range: 0, manaCost: 12, aoeRadius: 0, cooldown: 3,
    statusEffect: 'transmute_shield', statusDuration: 3, armorBoost: 6,
    targetType: 'self' },

  { cardId: 'acid_splash', name: 'Acid Splash', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'],
    tags: ['alchemy', 'poison', 'crafting'],
    description: 'Splash concentrated acid that eats through armor and leaves a lingering poison burn',
    effects: [{ type: 'damage', element: 'poison', base: 14, scaling: 'ingenuity', factor: 0.35 }],
    icon: 'skills/Alchemy/',
    combatType: 'damage', element: 'poison', baseDamage: 14,
    range: 3, manaCost: 8, aoeRadius: 0, cooldown: 2,
    scalingStat: 'ingenuity', scalingFactor: 0.35,
    onHitStatus: { name: 'acid_burn', duration: 3, armorReduction: 6, tickDamage: 3, type: 'debuff' },
    targetType: 'enemy' },

  { cardId: 'philosophers_boost', name: "Philosopher's Boost", type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'support',
    tags: ['alchemy', 'crafting'],
    description: 'Consume a dose of the legendary philosopher\'s elixir, temporarily amplifying all attributes',
    effects: [{ type: 'buff', stat: 'all', value: 0.30, duration: 20 }],
    icon: 'skills/Alchemy/',
    combatType: 'buff',
    range: 0, manaCost: 30, aoeRadius: 0, cooldown: 6,
    statusEffect: 'philosophers_boost', statusDuration: 5,
    statBoost: { vigor: 4, might: 4, finesse: 4, acumen: 4, resolve: 4, ingenuity: 4 },
    targetType: 'self' },

  // === ENCHANTING ACTIVE ABILITIES ===
  { cardId: 'mana_surge', name: 'Mana Surge', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support',
    tags: ['enchanting', 'magic'],
    description: 'Channel enchanting expertise to violently restore mana from ambient arcane energy',
    effects: [{ type: 'mana_restore', percent: 0.30 }],
    icon: 'skills/Enchantment/',
    combatType: 'buff',
    range: 0, manaCost: 0, aoeRadius: 0, cooldown: 5,
    statusEffect: 'mana_surge', statusDuration: 1,
    manaRestore: 0.30,
    targetType: 'self' },

  { cardId: 'arcane_disruption', name: 'Arcane Disruption', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon',
    tags: ['enchanting', 'magic'],
    description: 'Unleash a pulse of raw arcane energy that damages and strips away enemy magical protections',
    effects: [{ type: 'damage', element: 'arcane', base: 22, scaling: 'acumen', factor: 0.5 }, { type: 'dispel', removeBuffs: 2 }],
    icon: 'skills/Enchantment/',
    combatType: 'damage', element: 'arcane', baseDamage: 22,
    range: 4, manaCost: 18, aoeRadius: 0, cooldown: 3,
    scalingStat: 'acumen', scalingFactor: 0.5,
    dispelBuffs: 2,
    targetType: 'enemy' },

  { cardId: 'enchant_weapon', name: 'Enchant Weapon', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'support',
    tags: ['enchanting', 'magic'],
    description: 'Temporarily infuse an ally\'s weapon with crackling arcane energy, adding bonus elemental damage',
    effects: [{ type: 'buff', duration: 15 }],
    icon: 'skills/Enchantment/',
    combatType: 'buff',
    range: 3, manaCost: 14, aoeRadius: 0, cooldown: 4,
    statusEffect: 'enchanted_weapon', statusDuration: 4,
    damageBoost: 5, bonusElement: 'arcane',
    targetType: 'ally' },

  { cardId: 'spell_reflection', name: 'Spell Reflection', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'pure_defense',
    tags: ['enchanting', 'magic'],
    description: 'Weave a reflective enchantment that bounces the next hostile spell back at its caster',
    effects: [{ type: 'reflect_magic', charges: 1, duration: 10 }],
    icon: 'skills/Enchantment/',
    combatType: 'buff',
    range: 0, manaCost: 22, aoeRadius: 0, cooldown: 5,
    statusEffect: 'spell_reflection', statusDuration: 3,
    reflectMagic: true, reflectCharges: 1,
    targetType: 'self' },

  { cardId: 'nullify_magic', name: 'Nullify Magic', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['enchanting', 'magic'],
    description: 'Sever an enemy\'s connection to the arcane, silencing their ability to cast spells',
    effects: [{ type: 'crowd_control', ccType: 'silence', duration: 6 }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff',
    range: 4, manaCost: 16, aoeRadius: 0, cooldown: 4,
    statusEffect: 'silenced', statusDuration: 2,
    targetType: 'enemy' },

  // === BREWING ACTIVE ABILITIES ===
  { cardId: 'berserker_brew', name: "Berserker's Brew", type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['tank'],
    tags: ['brewing', 'crafting'],
    description: 'Quaff a potent war brew that sends you into a frenzy, greatly boosting damage at the cost of defense',
    effects: [{ type: 'buff', duration: 15 }],
    icon: 'skills/Cooking_fishing/',
    combatType: 'buff',
    range: 0, manaCost: 10, aoeRadius: 0, cooldown: 5,
    statusEffect: 'berserker_brew', statusDuration: 4,
    damageBoost: 8, armorReduction: 4,
    targetType: 'self' },

  { cardId: 'fortifying_tonic', name: 'Fortifying Tonic', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'tank', archetypeSecondary: ['pure_defense'],
    tags: ['brewing', 'crafting'],
    description: 'Drink a thick fortifying tonic that hardens your body against incoming blows',
    effects: [{ type: 'buff', duration: 15 }],
    icon: 'skills/Cooking_fishing/',
    combatType: 'buff',
    range: 0, manaCost: 8, aoeRadius: 0, cooldown: 3,
    statusEffect: 'fortified_tonic', statusDuration: 5,
    armorBoost: 10,
    targetType: 'self' },

  { cardId: 'liquid_courage', name: 'Liquid Courage', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'support',
    tags: ['brewing', 'crafting'],
    description: 'A stiff drink that steadies the nerves, removing fear and debuff effects while bolstering resolve',
    effects: [{ type: 'cleanse', removeDebuffs: 3 }, { type: 'buff', duration: 10 }],
    icon: 'skills/Cooking_fishing/',
    combatType: 'buff',
    range: 0, manaCost: 6, aoeRadius: 0, cooldown: 4,
    statusEffect: 'liquid_courage', statusDuration: 3,
    damageBoost: 3, cleansesDebuffs: true,
    targetType: 'self' },

  { cardId: 'volatile_cocktail', name: 'Volatile Cocktail', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'],
    tags: ['brewing', 'crafting'],
    description: 'Lob a violently unstable cocktail that explodes into a shower of caustic liquid',
    effects: [{ type: 'damage', element: 'fire', base: 22, scaling: 'ingenuity', factor: 0.4 }],
    icon: 'skills/Cooking_fishing/',
    combatType: 'damage', element: 'fire', baseDamage: 22,
    range: 4, manaCost: 12, aoeRadius: 1, cooldown: 3,
    scalingStat: 'ingenuity', scalingFactor: 0.4,
    onHitTile: 'BURNING',
    targetType: 'enemy' },

  // === ANIMAL HANDLING ACTIVE ABILITIES ===
  { cardId: 'call_beast', name: 'Call Beast', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'utility',
    tags: ['animal_handling'],
    description: 'Whistle sharply to summon a wild beast ally from the surrounding terrain to fight at your side',
    effects: [{ type: 'summon', summonType: 'beast', duration: 30 }],
    icon: 'skills/Herbalism/',
    combatType: 'summon',
    range: 2, manaCost: 18, aoeRadius: 0, cooldown: 5,
    summonType: 'wild_beast', summonHp: 45, summonDamage: 10, summonDuration: 4,
    targetType: 'any' },

  { cardId: 'sic_em', name: "Sic 'Em", type: 'active_ability', rarity: 'uncommon', resourceType: 'bloodlust', archetype: 'melee_dps',
    tags: ['animal_handling'],
    description: 'Command your beast companion to lunge and attack with savage ferocity',
    effects: [{ type: 'damage', element: 'physical', base: 20, scaling: 'presence', factor: 0.4 }],
    icon: 'skills/Herbalism/',
    combatType: 'damage', baseDamage: 20,
    range: 3, manaCost: 6, aoeRadius: 0, cooldown: 2,
    scalingStat: 'presence', scalingFactor: 0.4,
    requiresPet: true,
    targetType: 'enemy' },

  { cardId: 'pack_tactics', name: 'Pack Tactics', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support', archetypeSecondary: ['melee_dps'],
    tags: ['animal_handling'],
    description: 'Coordinate with nearby beast companions, granting a damage bonus to all allies in range',
    effects: [{ type: 'buff_all', duration: 15 }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 14, aoeRadius: 3, cooldown: 4,
    statusEffect: 'pack_tactics', statusDuration: 3,
    damageBoost: 4,
    requiresPet: true,
    targetType: 'all_allies' },

  { cardId: 'beast_form', name: 'Beast Form', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['tank'],
    tags: ['animal_handling'],
    description: 'Channel primal energy to transform into a ferocious beast, gaining devastating melee power but losing spellcasting',
    effects: [{ type: 'transform', form: 'beast', duration: 20 }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 25, aoeRadius: 0, cooldown: 6,
    statusEffect: 'beast_form', statusDuration: 4,
    statBoost: { might: 6, finesse: 3 }, damageBoost: 8,
    silencesSelf: true,
    targetType: 'self' },

  { cardId: 'tame_command', name: 'Tame', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'utility',
    tags: ['animal_handling'],
    description: 'Attempt to tame an enemy beast, calming its rage and converting it to fight alongside you',
    effects: [{ type: 'tame', successChance: 0.40, requiresBeast: true }],
    icon: 'skills/Herbalism/',
    combatType: 'utility',
    range: 3, manaCost: 20, aoeRadius: 0, cooldown: 6,
    tameChance: 0.40,
    targetType: 'enemy' },

  // === HERBALISM ACTIVE ABILITIES ===
  { cardId: 'natures_embrace', name: "Nature's Embrace", type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'support',
    tags: ['herbalism', 'crafting'],
    description: 'Apply a carefully prepared herbal poultice that mends wounds steadily over time',
    effects: [{ type: 'heal_over_time', base: 6, ticks: 5, scaling: 'ingenuity', factor: 0.2 }],
    icon: 'skills/Herbalism/',
    combatType: 'healing', baseHeal: 6,
    range: 3, manaCost: 8, aoeRadius: 0, cooldown: 3,
    scalingStat: 'ingenuity', scalingFactor: 0.2,
    isHoT: true, hotTicks: 5,
    targetType: 'ally' },

  { cardId: 'poison_resistance_herb', name: 'Poison Resistance', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support',
    tags: ['herbalism', 'crafting'],
    description: 'Administer a potent herbal antidote that grants temporary immunity to all poison effects',
    effects: [{ type: 'buff', duration: 30 }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 1, manaCost: 10, aoeRadius: 0, cooldown: 5,
    statusEffect: 'poison_immune', statusDuration: 5,
    immunities: ['poison'],
    targetType: 'ally' },

  { cardId: 'entangle', name: 'Entangle', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'cc_dot', archetypeSecondary: ['pure_defense'],
    tags: ['herbalism', 'crafting'],
    description: 'Scatter enchanted seeds that erupt into grasping vines, rooting enemies in the area',
    effects: [{ type: 'tile', element: 'nature' }],
    icon: 'skills/Herbalism/',
    combatType: 'tile_effect', tileEffect: 'BRAMBLE',
    range: 4, manaCost: 14, aoeRadius: 2, cooldown: 4,
    onHitStatus: { name: 'rooted', duration: 2, speedMult: 0, type: 'debuff' },
    targetType: 'any' },

  { cardId: 'herbal_stimulant', name: 'Herbal Stimulant', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'support',
    tags: ['herbalism', 'crafting'],
    description: 'Chew a handful of stimulating herbs that sharpen reflexes and restore mental clarity',
    effects: [{ type: 'buff', duration: 15 }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 6, aoeRadius: 0, cooldown: 3,
    statusEffect: 'herbal_stimulant', statusDuration: 4,
    speedMult: 1.2, manaRegenBoost: 2,
    targetType: 'self' },

  // === SURVIVAL ACTIVE ABILITIES ===
  { cardId: 'campfire', name: 'Campfire', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'support',
    tags: ['survival'],
    description: 'Build a warming campfire that heals nearby allies over time and removes cold-based debuffs',
    effects: [{ type: 'heal_over_time', base: 4, ticks: 5 }, { type: 'cleanse', element: 'cold' }],
    icon: 'skills/Blacksmith/',
    combatType: 'tile_effect', tileEffect: 'CAMPFIRE',
    range: 1, manaCost: 8, aoeRadius: 2, cooldown: 5,
    healPerTurn: 4, cleansesElement: 'cold',
    targetType: 'any' },

  { cardId: 'trap_setting', name: 'Trap Setting', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'cc_dot',
    tags: ['survival'],
    description: 'Set a concealed trap that stuns and damages the first enemy to step on it',
    effects: [{ type: 'tile', element: 'physical' }],
    icon: 'skills/Blacksmith/',
    combatType: 'tile_effect', tileEffect: 'SPRING_TRAP',
    range: 3, manaCost: 10, aoeRadius: 0, cooldown: 3,
    trapDamage: 15, trapStunDuration: 1,
    targetType: 'any' },

  { cardId: 'second_wind_active', name: 'Second Wind', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'pure_defense', archetypeSecondary: ['tank'],
    tags: ['survival'],
    description: 'Dig deep and rally your body in a moment of crisis, rapidly healing when near death',
    effects: [{ type: 'heal', base: 40, scaling: 'vigor', factor: 0.5, requiresLowHp: true }],
    icon: 'skills/Blacksmith/',
    combatType: 'healing', baseHeal: 40,
    range: 0, manaCost: 0, aoeRadius: 0, cooldown: 6,
    scalingStat: 'vigor', scalingFactor: 0.5,
    requiresLowHp: 0.25,
    targetType: 'self' },

  { cardId: 'endure', name: 'Endure', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'pure_defense',
    tags: ['survival'],
    description: 'Steel yourself against the onslaught, drastically reducing all incoming damage for a short time',
    effects: [{ type: 'buff', duration: 6 }],
    icon: 'skills/Blacksmith/',
    combatType: 'buff',
    range: 0, manaCost: 5, aoeRadius: 0, cooldown: 4,
    statusEffect: 'endure', statusDuration: 2,
    damageReduction: 0.50,
    targetType: 'self' },

  // === SKINNING ACTIVE ABILITIES ===
  { cardId: 'flaying_strike', name: 'Flaying Strike', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'melee_dps',
    tags: ['skinning'],
    description: 'A precise slashing technique honed from skinning, dealing devastating bonus damage against beasts',
    effects: [{ type: 'damage', element: 'physical', base: 18, scaling: 'finesse', factor: 0.4 }],
    icon: 'skills/Blacksmith/',
    combatType: 'damage', baseDamage: 18,
    range: 1, manaCost: 5, aoeRadius: 0, cooldown: 2,
    scalingStat: 'finesse', scalingFactor: 0.4,
    bonusVsBeast: 0.50,
    targetType: 'enemy' },

  { cardId: 'thick_hide', name: 'Thick Hide', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'tank',
    tags: ['skinning', 'crafting'],
    description: 'Don a hastily prepared layer of thick beast hide, boosting physical damage resistance',
    effects: [{ type: 'buff', duration: 15 }],
    icon: 'skills/Blacksmith/',
    combatType: 'buff',
    range: 0, manaCost: 8, aoeRadius: 0, cooldown: 4,
    statusEffect: 'thick_hide', statusDuration: 4,
    armorBoost: 8, physicalResist: 0.25,
    targetType: 'self' },

  { cardId: 'predators_mark', name: "Predator's Mark", type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'cc_dot', archetypeSecondary: ['melee_dps'],
    tags: ['skinning'],
    description: 'Mark a target as prey, causing all subsequent attacks against it to deal increased damage',
    effects: [{ type: 'debuff', duration: 15 }],
    icon: 'skills/Blacksmith/',
    combatType: 'debuff',
    range: 5, manaCost: 10, aoeRadius: 0, cooldown: 4,
    statusEffect: 'predators_mark', statusDuration: 4,
    damageAmplify: 0.20,
    targetType: 'enemy' },

  // === FORAGING ACTIVE ABILITIES ===
  { cardId: 'mushroom_cloud', name: 'Mushroom Cloud', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'],
    tags: ['foraging', 'poison'],
    description: 'Throw a cluster of toxic spore-laden mushrooms that burst into a disorienting, poisonous cloud',
    effects: [{ type: 'tile', element: 'poison' }, { type: 'debuff', ccType: 'confusion', duration: 6 }],
    icon: 'skills/Herbalism/',
    combatType: 'tile_effect', tileEffect: 'POISONED',
    range: 4, manaCost: 14, aoeRadius: 2, cooldown: 4,
    onHitStatus: { name: 'confused', duration: 2, type: 'debuff' },
    targetType: 'any' },

  { cardId: 'berry_burst', name: 'Berry Burst', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'support',
    tags: ['foraging'],
    description: 'Quickly consume a handful of healing berries gathered from the wild for an immediate small heal',
    effects: [{ type: 'heal', base: 18, scaling: 'vigor', factor: 0.2 }],
    icon: 'skills/Herbalism/',
    combatType: 'healing', baseHeal: 18,
    range: 0, manaCost: 0, aoeRadius: 0, cooldown: 2,
    scalingStat: 'vigor', scalingFactor: 0.2,
    targetType: 'self' },

  { cardId: 'natures_camouflage', name: "Nature's Camouflage", type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'scout', archetypeSecondary: ['assassin'],
    tags: ['foraging', 'stealth'],
    description: 'Blend into the surrounding foliage using gathered natural materials, gaining stealth and dodge',
    effects: [{ type: 'stealth_enter', duration: 10 }, { type: 'dodge_bonus', value: 0.10 }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 10, aoeRadius: 0, cooldown: 5,
    statusEffect: 'natures_camouflage', statusDuration: 3,
    grantsStealth: true, dodgeBoost: 0.10,
    biomeBonus: ['forest', 'swamp'],
    targetType: 'self' },

  // === SIGIL SCRIPTING ACTIVE ABILITIES ===
  { cardId: 'explosive_sigil', name: 'Explosive Sigil', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon',
    tags: ['sigil_scripting', 'magic'],
    description: 'Inscribe a volatile sigil on the ground that detonates with arcane force when enemies approach',
    effects: [{ type: 'damage', element: 'arcane', base: 30, scaling: 'acumen', factor: 0.5 }],
    icon: 'skills/Enchantment/',
    combatType: 'tile_effect', tileEffect: 'RUNE_TRAP', element: 'arcane',
    range: 4, manaCost: 16, aoeRadius: 1, cooldown: 3,
    scalingStat: 'acumen', scalingFactor: 0.5,
    trapDamage: 30,
    targetType: 'any' },

  { cardId: 'ward_of_protection', name: 'Ward of Protection', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'pure_defense',
    tags: ['sigil_scripting', 'magic'],
    description: 'Trace a protective sigil that creates a warded area, reducing damage taken by allies within',
    effects: [{ type: 'tile', element: 'holy' }],
    icon: 'skills/Enchantment/',
    combatType: 'tile_effect', tileEffect: 'WARD',
    range: 3, manaCost: 12, aoeRadius: 2, cooldown: 4,
    wardDamageReduction: 0.20,
    targetType: 'any' },

  { cardId: 'binding_sigil', name: 'Binding Sigil', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot', archetypeSecondary: ['pure_defense'],
    tags: ['sigil_scripting', 'magic'],
    description: 'Etch a binding sigil beneath an enemy\'s feet, locking them in place with arcane chains',
    effects: [{ type: 'crowd_control', ccType: 'root', duration: 9 }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff',
    range: 4, manaCost: 16, aoeRadius: 0, cooldown: 4,
    statusEffect: 'bound', statusDuration: 3, speedMult: 0,
    targetType: 'enemy' },

  { cardId: 'power_sigil', name: 'Power Sigil', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'support',
    tags: ['sigil_scripting', 'magic'],
    description: 'Inscribe a sigil of empowerment that radiates energy, boosting ally damage in its radius',
    effects: [{ type: 'buff_all', duration: 15 }],
    icon: 'skills/Enchantment/',
    combatType: 'tile_effect', tileEffect: 'POWER_SIGIL',
    range: 3, manaCost: 22, aoeRadius: 2, cooldown: 5,
    sigilDamageBoost: 0.20, tileDuration: 4,
    targetType: 'any' },

  // === CATEGORY-SPECIFIC CLEANSE ABILITIES ===
  { cardId: 'tourniquet', name: 'Tourniquet', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'support',
    tags: ['sigil_scripting', 'magic'],
    description: 'Apply emergency first aid to remove all physical debuffs (bleeding, burning, poisoned, frozen, etc.)',
    effects: [{ type: 'cleanse', category: 'physical', cooldown: 3 }],
    combatType: 'cleanse', cleanseCategory: 'physical', range: 1, manaCost: 8, aoeRadius: 0, cooldown: 3, targetType: 'ally',
    icon: 'skills/Enchantment/' },
  { cardId: 'rally_cry', name: 'Rally Cry', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'support',
    tags: ['sigil_scripting'],
    description: 'Shout a battle cry that dispels all mental debuffs from a nearby ally (stun, fear, confusion, etc.)',
    effects: [{ type: 'cleanse', category: 'mental', cooldown: 3 }],
    combatType: 'cleanse', cleanseCategory: 'mental', range: 3, manaCost: 10, aoeRadius: 0, cooldown: 3, targetType: 'ally',
    icon: 'skills/Enchantment/' },
  { cardId: 'purify_sigil', name: 'Purify Sigil', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support',
    tags: ['sigil_scripting', 'magic'],
    description: 'Channel purifying light to remove all magical debuffs from target (curses, hexes, mana burn, etc.)',
    effects: [{ type: 'cleanse', category: 'magical', cooldown: 4 }],
    combatType: 'cleanse', cleanseCategory: 'magical', range: 2, manaCost: 15, aoeRadius: 0, cooldown: 4, targetType: 'ally',
    icon: 'skills/Enchantment/' },

  // === EXPANDED SIGIL ACTIVE ABILITIES ===
  { cardId: 'healing_sigil', name: 'Healing Sigil', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support',
    tags: ['sigil_scripting', 'magic'],
    description: 'Inscribe a restorative sigil that pulses healing energy to allies standing within its radius',
    effects: [{ type: 'tile_effect', tileEffect: 'HEALING_SIGIL', baseHeal: 15, duration: 3 }],
    combatType: 'tile_effect', tileEffect: 'HEALING_SIGIL', range: 4, manaCost: 18, aoeRadius: 1, cooldown: 4,
    scalingStat: 'resolve', scalingFactor: 0.4, baseHeal: 15, tileDuration: 3, targetType: 'ground',
    icon: 'skills/Enchantment/' },
  { cardId: 'teleport_sigil', name: 'Teleport Sigil', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'utility',
    tags: ['sigil_scripting', 'magic'],
    description: 'Etch a dimensional sigil that instantly teleports you to its location when activated',
    effects: [{ type: 'teleport', range: 6 }],
    combatType: 'teleport', range: 6, manaCost: 20, aoeRadius: 0, cooldown: 5, targetType: 'ground',
    icon: 'skills/Enchantment/' },
  { cardId: 'siphon_sigil', name: 'Siphon Sigil', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['sigil_scripting', 'magic'],
    description: 'Place a parasitic sigil that drains life from enemies and transfers it to nearby allies',
    effects: [{ type: 'tile_effect', tileEffect: 'SIPHON_SIGIL', baseDamage: 8, baseHeal: 6, duration: 3 }],
    combatType: 'tile_effect', tileEffect: 'SIPHON_SIGIL', range: 4, manaCost: 16, aoeRadius: 1, cooldown: 4,
    scalingStat: 'acumen', scalingFactor: 0.3, baseDamage: 8, baseHeal: 6, tileDuration: 3, targetType: 'ground',
    icon: 'skills/Enchantment/' },
  { cardId: 'detonation_sigil', name: 'Detonation Sigil', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'glass_cannon',
    tags: ['sigil_scripting', 'magic'],
    description: 'Inscribe a volatile sigil with a delayed detonation — explodes after 2 turns for massive damage',
    effects: [{ type: 'tile_effect', tileEffect: 'DETONATION_SIGIL', baseDamage: 60, duration: 2, detonateOnExpire: true }],
    combatType: 'tile_effect', tileEffect: 'DETONATION_SIGIL', range: 5, manaCost: 25, aoeRadius: 2, cooldown: 5,
    scalingStat: 'acumen', scalingFactor: 0.8, baseDamage: 60, tileDuration: 2, detonateOnExpire: true, targetType: 'ground',
    icon: 'skills/Skill_Explosion.PNG' },

  // === TRANSMUTATION ACTIVE ABILITIES ===
  { cardId: 'matter_conversion', name: 'Matter Conversion', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'],
    tags: ['transmutation', 'magic'],
    description: 'Transmute an enemy\'s armor into raw energy that damages them from within',
    effects: [{ type: 'damage', element: 'arcane', base: 20, scaling: 'ingenuity', factor: 0.5 }, { type: 'debuff', armorShred: true }],
    icon: 'skills/Alchemy/',
    combatType: 'damage', element: 'arcane', baseDamage: 20,
    range: 4, manaCost: 16, aoeRadius: 0, cooldown: 3,
    scalingStat: 'ingenuity', scalingFactor: 0.5,
    onHitStatus: { name: 'armor_shredded', duration: 3, armorReduction: 8, type: 'debuff' },
    targetType: 'enemy' },

  { cardId: 'elemental_shift', name: 'Elemental Shift', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'glass_cannon',
    tags: ['transmutation', 'magic'],
    description: 'Transmute the elemental nature of your attacks to exploit an enemy\'s elemental weakness',
    effects: [{ type: 'buff', duration: 15 }],
    icon: 'skills/Alchemy/',
    combatType: 'buff',
    range: 0, manaCost: 10, aoeRadius: 0, cooldown: 3,
    statusEffect: 'elemental_shift', statusDuration: 4,
    adaptiveElement: true,
    targetType: 'self' },

  { cardId: 'dissolution', name: 'Dissolution', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'glass_cannon',
    tags: ['transmutation', 'magic'],
    description: 'Disassemble an enemy\'s very substance at the molecular level, ignoring all defensive protections',
    effects: [{ type: 'damage', element: 'arcane', base: 55, scaling: 'ingenuity', factor: 0.8 }],
    icon: 'skills/Alchemy/',
    combatType: 'damage', element: 'arcane', baseDamage: 55,
    range: 3, manaCost: 30, aoeRadius: 0, cooldown: 5,
    scalingStat: 'ingenuity', scalingFactor: 0.8,
    ignoresArmor: true,
    targetType: 'enemy' },

  // === LEATHERWORKING ACTIVE ABILITIES ===
  { cardId: 'reinforced_hide', name: 'Reinforced Hide', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'tank',
    tags: ['leatherworking', 'crafting'],
    description: 'Quickly reinforce your armor with treated leather strips, boosting your defense temporarily',
    effects: [{ type: 'buff', duration: 15 }],
    icon: 'skills/Blacksmith/',
    combatType: 'buff',
    range: 0, manaCost: 6, aoeRadius: 0, cooldown: 3,
    statusEffect: 'reinforced_hide', statusDuration: 5,
    armorBoost: 7,
    targetType: 'self' },

  { cardId: 'leather_lash', name: 'Leather Lash', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'cc_dot', archetypeSecondary: ['melee_dps'],
    tags: ['leatherworking', 'crafting'],
    description: 'Snap a hardened leather whip at the enemy, dealing damage with a chance to knock their weapon loose',
    effects: [{ type: 'damage', element: 'physical', base: 14, scaling: 'finesse', factor: 0.35 }],
    icon: 'skills/Blacksmith/',
    combatType: 'damage', baseDamage: 14,
    range: 2, manaCost: 5, aoeRadius: 0, cooldown: 2,
    scalingStat: 'finesse', scalingFactor: 0.35,
    onHitStatus: { name: 'disarmed', duration: 1, type: 'debuff' },
    disarmChance: 0.25,
    targetType: 'enemy' },

  // === CARPENTRY ACTIVE ABILITIES ===
  { cardId: 'wooden_barricade', name: 'Wooden Barricade', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'pure_defense',
    tags: ['carpentry', 'crafting'],
    description: 'Rapidly construct a sturdy wooden barricade that blocks enemy movement through the area',
    effects: [{ type: 'tile', element: 'physical' }],
    icon: 'skills/Blacksmith/',
    combatType: 'tile_effect', tileEffect: 'BARRICADE',
    range: 3, manaCost: 10, aoeRadius: 0, cooldown: 4,
    blocksMovement: true, barricadeHp: 50, tileDuration: 5,
    targetType: 'any' },

  { cardId: 'splinter_shot', name: 'Splinter Shot', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'melee_dps',
    tags: ['carpentry', 'crafting'],
    description: 'Launch a sharpened wooden spike that pierces the target and causes lingering bleeding',
    effects: [{ type: 'damage', element: 'physical', base: 16, scaling: 'finesse', factor: 0.35 }],
    icon: 'skills/Blacksmith/',
    combatType: 'damage', baseDamage: 16,
    range: 5, manaCost: 5, aoeRadius: 0, cooldown: 2,
    scalingStat: 'finesse', scalingFactor: 0.35,
    onHitStatus: { name: 'bleeding', duration: 3, tickDamage: 3, type: 'debuff' },
    targetType: 'enemy' },

  // === JEWELCRAFTING ACTIVE ABILITIES ===
  { cardId: 'gem_shatter', name: 'Gem Shatter', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'glass_cannon',
    tags: ['jewelcrafting', 'crafting'],
    description: 'Shatter a charged gemstone to release a burst of arcane shrapnel that damages all nearby enemies',
    effects: [{ type: 'damage', element: 'arcane', base: 28, scaling: 'ingenuity', factor: 0.5 }],
    icon: 'skills/Blacksmith/',
    combatType: 'damage', element: 'arcane', baseDamage: 28,
    range: 4, manaCost: 16, aoeRadius: 2, cooldown: 3,
    scalingStat: 'ingenuity', scalingFactor: 0.5,
    targetType: 'enemy' },

  { cardId: 'crystal_focus', name: 'Crystal Focus', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'glass_cannon',
    tags: ['jewelcrafting', 'magic', 'crafting'],
    description: 'Channel energy through a perfectly cut crystal to amplify your magical damage output',
    effects: [{ type: 'buff', duration: 15 }],
    icon: 'skills/Blacksmith/',
    combatType: 'buff',
    range: 0, manaCost: 10, aoeRadius: 0, cooldown: 4,
    statusEffect: 'crystal_focus', statusDuration: 4,
    spellDamageBoost: 0.25,
    targetType: 'self' },

  { cardId: 'prismatic_shield', name: 'Prismatic Shield', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'pure_defense',
    tags: ['jewelcrafting', 'magic', 'crafting'],
    description: 'Conjure a dazzling prismatic barrier from gem dust that resists all elemental damage types',
    effects: [{ type: 'buff', duration: 15 }],
    icon: 'skills/Blacksmith/',
    combatType: 'buff',
    range: 0, manaCost: 22, aoeRadius: 0, cooldown: 5,
    statusEffect: 'prismatic_shield', statusDuration: 4,
    elementalResistAll: 0.30,
    targetType: 'self' },

  // === SEWING ACTIVE ABILITIES ===
  { cardId: 'thread_bind', name: 'Thread Bind', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'cc_dot', archetypeSecondary: ['grappler'],
    tags: ['sewing', 'crafting'],
    description: 'Fling enchanted thread that wraps around an enemy, slowing and eventually rooting them in place',
    effects: [{ type: 'debuff', duration: 8 }],
    icon: 'skills/Blacksmith/',
    combatType: 'debuff',
    range: 4, manaCost: 8, aoeRadius: 0, cooldown: 3,
    statusEffect: 'thread_bound', statusDuration: 3,
    speedMult: 0.3,
    targetType: 'enemy' },

  { cardId: 'patchwork_golem', name: 'Patchwork Golem', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'utility', archetypeSecondary: ['tank'],
    tags: ['sewing', 'magic', 'crafting'],
    description: 'Animate scraps of enchanted cloth into a shambling golem that absorbs damage and fights for you',
    effects: [{ type: 'summon', summonType: 'golem', duration: 25 }],
    icon: 'skills/Blacksmith/',
    combatType: 'summon',
    range: 2, manaCost: 20, aoeRadius: 0, cooldown: 5,
    summonType: 'patchwork_golem', summonHp: 55, summonDamage: 6, summonDuration: 4, summonArmor: 8,
    targetType: 'any' },

  // === BATCH 2: IMPACTFUL PASSIVE CARDS FOR CRAFTING/UTILITY SKILLS ===

  // -- Alchemy impactful passives --
  { cardId: 'volatile_reagents', name: 'Volatile Reagents', type: 'passive_perk', rarity: 'rare', archetype: 'glass_cannon',
    tags: ['alchemy', 'crafting'],
    description: 'Your alchemical attacks have a chance to trigger a secondary explosion',
    effects: [{ type: 'proc_explosion_chance', value: 0.15, element: 'fire', baseDamage: 10 }],
    icon: 'skills/Alchemy/',
    combatPassive: { type: 'proc_explosion', chance: 0.15, damage: 10, element: 'fire' } },

  { cardId: 'alchemical_resistance', name: 'Alchemical Resistance', type: 'passive_perk', rarity: 'uncommon', archetype: 'pure_defense',
    tags: ['alchemy', 'crafting'],
    description: 'Prolonged exposure to chemicals has hardened your body against poison and fire',
    effects: [{ type: 'poison_resistance', value: 0.20 }, { type: 'fire_resistance', value: 0.15 }],
    icon: 'skills/Alchemy/',
    combatPassive: { type: 'elemental_resist', elements: ['poison', 'fire'], value: 0.15 } },

  // -- Enchanting impactful passives --
  { cardId: 'arcane_feedback', name: 'Arcane Feedback', type: 'passive_perk', rarity: 'rare', archetype: 'glass_cannon',
    tags: ['enchanting', 'magic'],
    description: 'When you take magic damage, recover a portion of the damage as mana',
    effects: [{ type: 'mana_on_magic_hit', value: 0.15 }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'mana_on_magic_hit', value: 0.15 } },

  { cardId: 'runic_fortification', name: 'Runic Fortification', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'pure_defense',
    tags: ['enchanting', 'magic'],
    description: 'Permanently inscribed protective runes reduce all magic damage taken',
    effects: [{ type: 'magic_resist', value: 0.12 }, { type: 'enchant_power_bonus', value: 0.10 }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'magic_resist', value: 0.12 } },

  // -- Brewing impactful passives --
  { cardId: 'brewed_resilience', name: 'Brewed Resilience', type: 'passive_perk', rarity: 'uncommon', archetype: 'tank',
    tags: ['brewing', 'crafting'],
    description: 'Regular consumption of your own tonics has permanently increased your constitution',
    effects: [{ type: 'hp_bonus', value: 20 }, { type: 'debuff_resist', value: 0.10 }],
    icon: 'skills/Cooking_fishing/',
    combatPassive: { type: 'debuff_resist', value: 0.10 } },

  { cardId: 'brewmasters_endurance', name: "Brewmaster's Endurance", type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['brewing', 'crafting'],
    description: 'Your brews last longer and buff effects on you have extended duration',
    effects: [{ type: 'buff_duration_bonus', value: 0.25 }, { type: 'brew_potency_bonus', value: 0.15 }],
    icon: 'skills/Cooking_fishing/' },

  // -- Animal Handling impactful passives --
  { cardId: 'beast_bond', name: 'Beast Bond', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['animal_handling'],
    description: 'Your deep connection with beasts allows your pet to share a portion of healing you receive',
    effects: [{ type: 'pet_heal_share', value: 0.30 }, { type: 'pet_damage_bonus', value: 0.10 }],
    icon: 'skills/Herbalism/',
    combatPassive: { type: 'pet_heal_share', value: 0.30 } },

  { cardId: 'primal_instinct', name: 'Primal Instinct', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility',
    tags: ['animal_handling'],
    description: 'Heightened animal instincts grant you dodge and critical hit bonuses when near your beast',
    effects: [{ type: 'dodge_bonus', value: 0.06 }, { type: 'crit_bonus', value: 0.05 }, { type: 'pet_damage_bonus', value: 0.15 }],
    icon: 'skills/Herbalism/',
    combatPassive: { type: 'dodge_bonus', value: 0.06, requiresPet: true } },

  // -- Herbalism impactful passives --
  { cardId: 'natural_remedy', name: 'Natural Remedy', type: 'passive_perk', rarity: 'uncommon', archetype: 'support',
    tags: ['herbalism', 'crafting'],
    description: 'Your healing-over-time effects are more potent and tick for additional health',
    effects: [{ type: 'hot_potency_bonus', value: 0.25 }, { type: 'herb_yield_bonus', value: 0.10 }],
    icon: 'skills/Herbalism/',
    combatPassive: { type: 'hot_potency_bonus', value: 0.25 } },

  { cardId: 'toxicologist', name: 'Toxicologist', type: 'passive_perk', rarity: 'rare', archetype: 'cc_dot',
    tags: ['herbalism', 'poison'],
    description: 'Your knowledge of plants makes your poison effects last longer and deal more damage',
    effects: [{ type: 'poison_damage_bonus', value: 0.25 }, { type: 'poison_duration_bonus', value: 0.30 }],
    icon: 'skills/Herbalism/',
    combatPassive: { type: 'poison_damage_bonus', value: 0.25 } },

  // -- Survival impactful passives --
  { cardId: 'wilderness_hardened', name: 'Wilderness Hardened', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense',
    tags: ['survival'],
    description: 'Years of harsh living have toughened your body, reducing all damage when below half health',
    effects: [{ type: 'low_hp_damage_reduction', value: 0.20, threshold: 0.50 }, { type: 'hp_regen', value: 1 }],
    icon: 'skills/Blacksmith/',
    combatPassive: { type: 'low_hp_damage_reduction', value: 0.20, threshold: 0.50 } },

  { cardId: 'resourceful_survivor', name: 'Resourceful Survivor', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility',
    tags: ['survival'],
    description: 'Consumables and food items are more effective and have a chance to not be consumed on use',
    effects: [{ type: 'food_heal_bonus', value: 0.20 }, { type: 'consumable_save_chance', value: 0.10 }],
    icon: 'skills/Blacksmith/' },

  // -- Skinning impactful passives --
  { cardId: 'anatomical_knowledge', name: 'Anatomical Knowledge', type: 'passive_perk', rarity: 'uncommon', archetype: 'melee_dps',
    tags: ['skinning'],
    description: 'Understanding creature anatomy lets you find weak points, boosting critical damage vs beasts',
    effects: [{ type: 'crit_damage_bonus_beast', value: 0.30 }, { type: 'skinning_yield_bonus', value: 0.15 }],
    icon: 'skills/Blacksmith/',
    combatPassive: { type: 'crit_damage_bonus', value: 0.15, vsBeast: true } },

  // -- Foraging impactful passives --
  { cardId: 'keen_eye_forager', name: 'Keen Eye', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility',
    tags: ['foraging'],
    description: 'Your trained eye spots hidden resources and dangers, boosting gathering yield and trap detection',
    effects: [{ type: 'gather_bonus', value: 0.15 }, { type: 'trap_detect_bonus', value: 0.10 }],
    icon: 'skills/Herbalism/' },

  // -- Sigil Scripting impactful passives --
  { cardId: 'persistent_sigils', name: 'Persistent Sigils', type: 'passive_perk', rarity: 'rare', archetype: 'cc_dot',
    tags: ['sigil_scripting', 'magic'],
    description: 'Your inscribed sigils and tile effects last significantly longer before fading',
    effects: [{ type: 'tile_duration_bonus', value: 0.40 }, { type: 'rune_duration_bonus', value: 0.30 }],
    icon: 'skills/Enchantment/' },

  { cardId: 'sigil_mastery', name: 'Sigil Mastery', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support',
    tags: ['sigil_scripting', 'magic'],
    description: 'Master the art of sigil inscription. Reduces Saturation buildup by 50% and sigil cooldowns by 1 turn',
    effects: [{ type: 'sigil_saturation_reduction', value: 0.50 }, { type: 'sigil_cooldown_reduction', value: 1 }],
    icon: 'skills/Enchantment/' },

  // -- Transmutation impactful passives --
  { cardId: 'molecular_insight', name: 'Molecular Insight', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['transmutation', 'magic'],
    description: 'Your understanding of matter lets you ignore a portion of enemy armor with every attack',
    effects: [{ type: 'armor_penetration', value: 0.15 }, { type: 'transmutation_bonus', value: 0.10 }],
    icon: 'skills/Alchemy/',
    combatPassive: { type: 'armor_penetration', value: 0.15 } },

  // -- Leatherworking impactful passives --
  { cardId: 'master_leatherworker', name: 'Master Leatherworker', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['leatherworking', 'crafting'],
    description: 'Your crafted leather armor provides superior protection and lasts longer',
    effects: [{ type: 'crafted_armor_bonus', value: 4 }, { type: 'crafted_durability_bonus', value: 0.20 }, { type: 'ingredientSaveChance', value: 0.10 }],
    icon: 'skills/Blacksmith/' },

  // -- Carpentry impactful passives --
  { cardId: 'master_carpenter', name: 'Master Carpenter', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['carpentry', 'crafting'],
    description: 'Your wooden constructions are sturdier and your crafting produces higher quality items',
    effects: [{ type: 'structure_hp_bonus', value: 0.30 }, { type: 'craft_quality_bonus', value: 0.15 }, { type: 'woodcutting_yield_bonus', value: 0.15 }],
    icon: 'skills/Blacksmith/' },

  // -- Jewelcrafting impactful passives --
  { cardId: 'gem_attunement', name: 'Gem Attunement', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['jewelcrafting', 'crafting'],
    description: 'Your deep connection to gemstones amplifies both your crafting quality and magic resistance',
    effects: [{ type: 'craft_quality_bonus', value: 0.15 }, { type: 'magic_resist', value: 0.08 }, { type: 'gem_yield_bonus', value: 0.20 }],
    icon: 'skills/Blacksmith/',
    combatPassive: { type: 'magic_resist', value: 0.08 } },

  // -- Sewing impactful passives --
  { cardId: 'enchanted_stitching', name: 'Enchanted Stitching', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['sewing', 'crafting'],
    description: 'Your needlework carries subtle enchantments, boosting the magic resistance of crafted cloth gear',
    effects: [{ type: 'sewing_magic_resist_bonus', value: 4 }, { type: 'sewing_armor_bonus', value: 3 }, { type: 'craft_quality_bonus', value: 0.10 }],
    icon: 'skills/Blacksmith/' },

  // ========================================================================
  // BATCH 3: Combat Passive Cards (Defensive, Offensive, Healing, Utility)
  // ========================================================================

  // --- Defensive Combat Passives ---
  { cardId: 'stone_skin_I', name: 'Stone Skin I', type: 'passive_perk', rarity: 'common', archetype: 'pure_defense',
    tags: ['defense', 'melee', 'passive'],
    description: 'Your skin hardens like rock, reducing all physical damage taken by a flat 3',
    effects: [{ type: 'flat_damage_reduction', value: 3, element: 'physical', description: '-3 physical damage taken' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'flat_damage_reduction', value: 3, element: 'physical' } },

  { cardId: 'stone_skin_II', name: 'Stone Skin II', type: 'passive_perk', rarity: 'uncommon', archetype: 'pure_defense',
    tags: ['defense', 'melee', 'passive'],
    description: 'Thickened dermal layers reduce all physical damage taken by a flat 6',
    effects: [{ type: 'flat_damage_reduction', value: 6, element: 'physical', description: '-6 physical damage taken' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'flat_damage_reduction', value: 6, element: 'physical' } },

  { cardId: 'stone_skin_III', name: 'Stone Skin III', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense',
    tags: ['defense', 'melee', 'passive'],
    description: 'Impervious stone-like hide reduces all physical damage taken by a flat 10',
    effects: [{ type: 'flat_damage_reduction', value: 10, element: 'physical', description: '-10 physical damage taken' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'flat_damage_reduction', value: 10, element: 'physical' } },

  { cardId: 'magic_ward_I', name: 'Magic Ward I', type: 'passive_perk', rarity: 'uncommon', archetype: 'pure_defense',
    tags: ['defense', 'magic', 'passive'],
    description: 'A latent magical ward reduces all magic damage taken by a flat 5',
    effects: [{ type: 'flat_damage_reduction', value: 5, element: 'magic', description: '-5 magic damage taken' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'flat_damage_reduction', value: 5, element: 'magic' } },

  { cardId: 'magic_ward_II', name: 'Magic Ward II', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense',
    tags: ['defense', 'magic', 'passive'],
    description: 'A powerful arcane barrier reduces all magic damage taken by a flat 10',
    effects: [{ type: 'flat_damage_reduction', value: 10, element: 'magic', description: '-10 magic damage taken' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'flat_damage_reduction', value: 10, element: 'magic' } },

  { cardId: 'elemental_attunement', name: 'Elemental Attunement', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense',
    tags: ['defense', 'magic', 'passive'],
    description: 'After being hit by an element, gain 20% resistance to that element until hit by a different one',
    effects: [{ type: 'adaptive_resist', value: 0.20, description: '20% resist to last element that hit you' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'adaptive_resist', value: 0.20 } },

  { cardId: 'adamantine_will', name: 'Adamantine Will', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense',
    tags: ['defense', 'passive'],
    description: 'Your willpower is unbreakable, granting full immunity to stun effects',
    effects: [{ type: 'cc_immunity', ccType: 'stun', description: 'Immune to stun' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'cc_immunity', ccType: 'stun' } },

  { cardId: 'slippery', name: 'Slippery', type: 'passive_perk', rarity: 'rare', archetype: 'scout',
    tags: ['defense', 'stealth', 'passive'],
    description: 'You cannot be rooted or slowed by any effect',
    effects: [{ type: 'cc_immunity', ccType: 'root', description: 'Immune to root and slow' }, { type: 'cc_immunity', ccType: 'slow' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'cc_immunity', ccType: 'root_slow' } },

  { cardId: 'fortified_body', name: 'Fortified', type: 'passive_perk', rarity: 'uncommon', archetype: 'tank',
    tags: ['defense', 'passive'],
    description: 'Trade mobility for durability: +15% max HP but -10% movement speed',
    effects: [{ type: 'hp_multiplier', value: 0.15, description: '+15% max HP' }, { type: 'speed_bonus', value: -0.10, description: '-10% speed' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'hp_multiplier', value: 0.15, speedPenalty: 0.10 } },

  { cardId: 'evasive_fighter_I', name: 'Evasive Fighter I', type: 'passive_perk', rarity: 'uncommon', archetype: 'scout',
    tags: ['defense', 'stealth', 'passive'],
    description: 'Your fluid combat stance grants +5% dodge chance against all attacks',
    effects: [{ type: 'dodge_bonus', value: 0.05, description: '+5% dodge chance' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'dodge_bonus', value: 0.05 } },

  { cardId: 'evasive_fighter_II', name: 'Evasive Fighter II', type: 'passive_perk', rarity: 'rare', archetype: 'scout',
    tags: ['defense', 'stealth', 'passive'],
    description: 'Masterful footwork grants +10% dodge chance against all attacks',
    effects: [{ type: 'dodge_bonus', value: 0.10, description: '+10% dodge chance' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'dodge_bonus', value: 0.10 } },

  { cardId: 'parry_master', name: 'Parry Master', type: 'passive_perk', rarity: 'rare', archetype: 'tank',
    tags: ['defense', 'melee', 'passive'],
    description: '15% chance to completely negate incoming melee attacks with a perfect parry',
    effects: [{ type: 'parry_chance', value: 0.15, description: '15% melee attack negation' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'parry_chance', value: 0.15 } },

  { cardId: 'shield_wall_passive', name: 'Shield Wall Mastery', type: 'passive_perk', rarity: 'rare', archetype: 'tank',
    tags: ['defense', 'passive'],
    description: 'When actively blocking, incoming damage is reduced by an additional 30%',
    effects: [{ type: 'block_damage_reduction', value: 0.30, description: '+30% block effectiveness' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'block_damage_reduction', value: 0.30 } },

  { cardId: 'last_stand', name: 'Last Stand', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'pure_defense',
    tags: ['defense', 'passive'],
    description: 'When below 20% HP, gain +50% defense as survival instincts kick in',
    effects: [{ type: 'low_hp_defense_bonus', value: 0.50, threshold: 0.20, description: '+50% defense below 20% HP' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'low_hp_damage_reduction', value: 0.50, threshold: 0.20 } },

  { cardId: 'bulwark', name: 'Bulwark', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense',
    tags: ['defense', 'passive'],
    description: 'Take 40% reduced damage from all area-of-effect attacks',
    effects: [{ type: 'aoe_damage_reduction', value: 0.40, description: '-40% AoE damage taken' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'aoe_damage_reduction', value: 0.40 } },

  { cardId: 'spell_absorption', name: 'Spell Absorption', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'pure_defense',
    tags: ['defense', 'magic', 'passive'],
    description: '10% chance to absorb an enemy spell, restoring mana equal to the damage it would have dealt',
    effects: [{ type: 'spell_absorb_chance', value: 0.10, description: '10% spell absorption for mana' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'spell_absorb', chance: 0.10 } },

  { cardId: 'unstoppable', name: 'Unstoppable', type: 'passive_perk', rarity: 'rare', archetype: 'tank',
    tags: ['defense', 'melee', 'passive'],
    description: 'Your mass and resolve make you immune to all knockback effects',
    effects: [{ type: 'cc_immunity', ccType: 'knockback', description: 'Immune to knockback' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'cc_immunity', ccType: 'knockback' } },

  { cardId: 'adaptive_armor', name: 'Adaptive Armor', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'pure_defense',
    tags: ['defense', 'passive'],
    description: 'After being hit by the same element 3 times, gain 50% resistance to it for the rest of combat',
    effects: [{ type: 'adaptive_armor', stacksRequired: 3, resistValue: 0.50, description: '50% resist after 3 hits of same element' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'adaptive_armor', stacksRequired: 3, resistValue: 0.50 } },

  { cardId: 'thorns_I', name: 'Thorns I', type: 'passive_perk', rarity: 'common', archetype: 'pure_defense',
    tags: ['defense', 'passive'],
    description: 'Reflect 5% of all damage taken back to the attacker',
    effects: [{ type: 'damage_reflect', value: 0.05, description: '5% damage reflection' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'damage_reflect', value: 0.05 } },

  { cardId: 'thorns_II', name: 'Thorns II', type: 'passive_perk', rarity: 'uncommon', archetype: 'pure_defense',
    tags: ['defense', 'passive'],
    description: 'Reflect 10% of all damage taken back to the attacker',
    effects: [{ type: 'damage_reflect', value: 0.10, description: '10% damage reflection' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'damage_reflect', value: 0.10 } },

  { cardId: 'thorns_III', name: 'Thorns III', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense',
    tags: ['defense', 'passive'],
    description: 'Reflect 20% of all damage taken back to the attacker',
    effects: [{ type: 'damage_reflect', value: 0.20, description: '20% damage reflection' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'damage_reflect', value: 0.20 } },

  // --- Offensive Combat Passives ---
  { cardId: 'bloodthirst_I', name: 'Bloodthirst I', type: 'passive_perk', rarity: 'uncommon', archetype: 'melee_dps',
    tags: ['offense', 'melee', 'passive'],
    description: 'Drain 5% of all attack damage dealt as health',
    effects: [{ type: 'lifesteal', value: 0.05, description: '5% lifesteal on all attacks' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'lifesteal', value: 0.05 } },

  { cardId: 'bloodthirst_II', name: 'Bloodthirst II', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'melee', 'passive'],
    description: 'Drain 10% of all attack damage dealt as health',
    effects: [{ type: 'lifesteal', value: 0.10, description: '10% lifesteal on all attacks' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'lifesteal', value: 0.10 } },

  { cardId: 'critical_mastery_I', name: 'Critical Mastery I', type: 'passive_perk', rarity: 'uncommon', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'Honed precision grants +5% critical hit chance on all attacks',
    effects: [{ type: 'crit_bonus', value: 0.05, description: '+5% crit chance' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'crit_bonus', value: 0.05 } },

  { cardId: 'critical_mastery_II', name: 'Critical Mastery II', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'Deadly precision grants +10% critical hit chance on all attacks',
    effects: [{ type: 'crit_bonus', value: 0.10, description: '+10% crit chance' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'crit_bonus', value: 0.10 } },

  { cardId: 'critical_mastery_III', name: 'Critical Mastery III', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'Lethal precision grants +15% critical hit chance on all attacks',
    effects: [{ type: 'crit_bonus', value: 0.15, description: '+15% crit chance' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'crit_bonus', value: 0.15 } },

  { cardId: 'brutal_strikes', name: 'Brutal Strikes', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'melee', 'passive'],
    description: 'Critical hits deal 50% more bonus damage, raising the crit multiplier from 1.5x to 2.0x',
    effects: [{ type: 'crit_damage_bonus', value: 0.50, description: '+50% crit damage multiplier' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'crit_damage_bonus', value: 0.50 } },

  { cardId: 'executioner', name: 'Executioner', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'Deal +100% damage to targets below 25% HP, finishing off wounded enemies with lethal efficiency',
    effects: [{ type: 'execute_bonus', threshold: 0.25, value: 1.00, description: '+100% damage to targets below 25% HP' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'execute_bonus', threshold: 0.25, value: 1.00 } },

  { cardId: 'chain_strike', name: 'Chain Strike', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: '20% chance that your attack cleaves to a second nearby enemy for full damage',
    effects: [{ type: 'chain_attack_chance', value: 0.20, description: '20% chance to hit a second enemy' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'chain_attack', chance: 0.20, targets: 1 } },

  { cardId: 'overwhelm', name: 'Overwhelm', type: 'passive_perk', rarity: 'uncommon', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'Deal +15% damage to enemies affected by stun, root, or other crowd control effects',
    effects: [{ type: 'damage_vs_cc', value: 0.15, description: '+15% damage to CC-affected enemies' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'damage_vs_cc', value: 0.15 } },

  { cardId: 'piercing_strikes', name: 'Piercing Strikes', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'Your attacks ignore 20% of the target armor, punching through defenses',
    effects: [{ type: 'armor_penetration', value: 0.20, description: '20% armor penetration' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'armor_penetration', value: 0.20 } },

  { cardId: 'elemental_infusion', name: 'Elemental Infusion', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'magic', 'passive'],
    description: 'Basic attacks deal bonus damage matching your equipped weapon element',
    effects: [{ type: 'elemental_infusion', value: true, description: 'Basic attacks gain weapon element bonus damage' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'elemental_infusion', value: true } },

  { cardId: 'relentless', name: 'Relentless', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'On kill, your next ability cooldown is halved, allowing rapid follow-up',
    effects: [{ type: 'on_kill_cooldown_reduction', value: 0.50, description: 'Next ability cooldown halved on kill' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'on_kill_cooldown_reduction', value: 0.50 } },

  { cardId: 'frenzy', name: 'Frenzy', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'melee', 'passive'],
    description: 'Each consecutive hit on the same target adds +5% damage, stacking up to 25%',
    effects: [{ type: 'consecutive_hit_bonus', perStack: 0.05, maxStacks: 5, description: '+5% damage per consecutive hit, max 25%' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'consecutive_hit_bonus', perStack: 0.05, maxStacks: 5 } },

  { cardId: 'predator', name: 'Predator', type: 'passive_perk', rarity: 'uncommon', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'Deal +20% damage to targets with less than half their maximum HP',
    effects: [{ type: 'execute_bonus', threshold: 0.50, value: 0.20, description: '+20% damage to targets below 50% HP' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'execute_bonus', threshold: 0.50, value: 0.20 } },

  { cardId: 'overkill', name: 'Overkill', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'When a killing blow deals excess damage, 30% of it splashes to the nearest enemy',
    effects: [{ type: 'overkill_splash', value: 0.30, description: '30% excess kill damage splashes' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'overkill_splash', value: 0.30 } },

  { cardId: 'double_strike', name: 'Double Strike', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'melee', 'passive'],
    description: '10% chance on each attack to immediately strike again for full damage',
    effects: [{ type: 'double_attack_chance', value: 0.10, description: '10% chance to attack twice' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'double_attack', chance: 0.10 } },

  { cardId: 'venomous', name: 'Venomous', type: 'passive_perk', rarity: 'uncommon', archetype: 'assassin',
    tags: ['offense', 'stealth', 'passive'],
    description: 'All physical attacks have 15% chance to poison the target for 3 damage per tick over 3 turns',
    effects: [{ type: 'on_hit_poison', chance: 0.15, tickDamage: 3, duration: 3, description: '15% chance to poison on hit' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'on_hit_poison', chance: 0.15, tickDamage: 3, duration: 3 } },

  { cardId: 'arcane_amplification', name: 'Arcane Amplification', type: 'passive_perk', rarity: 'rare', archetype: 'glass_cannon',
    tags: ['offense', 'magic', 'passive'],
    description: 'Spell damage scales with 10% of your maximum mana pool as bonus damage',
    effects: [{ type: 'mana_scaling_damage', value: 0.10, description: 'Spell damage +10% of max mana' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'mana_scaling_damage', value: 0.10 } },

  { cardId: 'savage_blows', name: 'Savage Blows', type: 'passive_perk', rarity: 'uncommon', archetype: 'melee_dps',
    tags: ['offense', 'melee', 'passive'],
    description: 'Melee attacks have a 10% chance to inflict bleed, dealing 4 damage per turn for 3 turns',
    effects: [{ type: 'on_hit_bleed', chance: 0.10, tickDamage: 4, duration: 3, description: '10% bleed on melee hit' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'on_hit_bleed', chance: 0.10, tickDamage: 4, duration: 3 } },

  { cardId: 'berserkers_fury', name: "Berserker's Fury", type: 'passive_perk', rarity: 'ultra_rare', archetype: 'melee_dps',
    tags: ['offense', 'melee', 'passive'],
    description: 'Gain +3% damage for each 10% of HP missing, up to +30% at 0% HP',
    effects: [{ type: 'missing_hp_damage', perTenPercent: 0.03, description: '+3% damage per 10% HP missing' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'missing_hp_damage', perTenPercent: 0.03 } },

  { cardId: 'precision_aim', name: 'Precision Aim', type: 'passive_perk', rarity: 'uncommon', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: '+10% accuracy on all attacks, reducing enemy dodge effectiveness',
    effects: [{ type: 'accuracy_bonus', value: 0.10, description: '+10% accuracy' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'accuracy_bonus', value: 0.10 } },

  { cardId: 'headhunter', name: 'Headhunter', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'Killing an enemy grants +10% damage for 2 turns, stacking up to 3 times',
    effects: [{ type: 'on_kill_damage_buff', value: 0.10, duration: 2, maxStacks: 3, description: '+10% damage on kill, stacks 3x' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'on_kill_damage_buff', value: 0.10, duration: 2, maxStacks: 3 } },

  // --- Healing / Support Combat Passives ---
  { cardId: 'combat_medic_aura', name: 'Medic Aura', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['healing', 'passive'],
    description: 'Healing spells also grant the target +3 armor for 2 turns',
    effects: [{ type: 'heal_grants_armor', armorValue: 3, duration: 2, description: 'Heals grant +3 armor for 2 turns' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'heal_grants_armor', armorValue: 3, duration: 2 } },

  { cardId: 'overheal', name: 'Overheal', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['healing', 'passive'],
    description: 'Excess healing becomes a temporary damage shield up to 20% of max HP',
    effects: [{ type: 'overheal_shield', maxPercent: 0.20, description: 'Overheal becomes shield (max 20% HP)' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'overheal_shield', maxPercent: 0.20 } },

  { cardId: 'empathic_bond', name: 'Empathic Bond', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support',
    tags: ['healing', 'passive'],
    description: 'When an ally within range takes damage, automatically heal them for 5% of your max HP',
    effects: [{ type: 'empathic_heal', value: 0.05, range: 2, description: 'Auto-heal nearby allies for 5% of your max HP' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'empathic_heal', value: 0.05, range: 2 } },

  { cardId: 'mana_font_I', name: 'Mana Font I', type: 'passive_perk', rarity: 'uncommon', archetype: 'glass_cannon',
    tags: ['magic', 'passive'],
    description: 'Regenerate 3 additional mana per turn from ambient arcane energy',
    effects: [{ type: 'mana_regen', value: 3, description: '+3 mana regen per turn' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'mana_regen', value: 3 } },

  { cardId: 'mana_font_II', name: 'Mana Font II', type: 'passive_perk', rarity: 'rare', archetype: 'glass_cannon',
    tags: ['magic', 'passive'],
    description: 'Regenerate 6 additional mana per turn from deep arcane reserves',
    effects: [{ type: 'mana_regen', value: 6, description: '+6 mana regen per turn' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'mana_regen', value: 6 } },

  { cardId: 'spirit_link', name: 'Spirit Link', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['healing', 'passive'],
    description: 'Share 20% of damage you take with your summoned pet or companion',
    effects: [{ type: 'damage_share_pet', value: 0.20, description: '20% damage shared with pet' }],
    icon: 'skills/Herbalism/',
    combatPassive: { type: 'damage_share_pet', value: 0.20 } },

  { cardId: 'martyr', name: 'Martyr', type: 'passive_perk', rarity: 'legendary', archetype: 'support', archetypeSecondary: ['tank'],
    tags: ['healing', 'passive'],
    description: 'Once per combat, intercept a killing blow aimed at an ally in range, taking the damage yourself',
    effects: [{ type: 'martyr_intercept', uses: 1, description: 'Intercept one killing blow for an ally' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'martyr_intercept', uses: 1 } },

  { cardId: 'cleansing_aura', name: 'Cleansing Aura', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['healing', 'passive'],
    description: 'Allies within range 2 have a 25% chance to resist debuffs when they are applied',
    effects: [{ type: 'aura_debuff_resist', value: 0.25, range: 2, description: '25% debuff resistance aura' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'aura_debuff_resist', value: 0.25, range: 2 } },

  { cardId: 'energizer', name: 'Energizer', type: 'passive_perk', rarity: 'uncommon', archetype: 'support',
    tags: ['healing', 'passive'],
    description: 'Buffs you apply to allies last 2 additional turns',
    effects: [{ type: 'buff_duration_extend', value: 2, description: '+2 turns buff duration on allies' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'buff_duration_extend', value: 2 } },

  { cardId: 'peaceful_presence', name: 'Peaceful Presence', type: 'passive_perk', rarity: 'uncommon', archetype: 'support',
    tags: ['healing', 'passive'],
    description: 'Out of combat, allies within range 2 regenerate 3 HP per turn from your calming aura',
    effects: [{ type: 'out_of_combat_aura_heal', value: 3, range: 2, description: 'Out of combat: allies regen 3 HP/turn' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'out_of_combat_aura_heal', value: 3, range: 2 } },

  { cardId: 'bloodpact', name: 'Bloodpact', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['healing', 'passive'],
    description: 'Healing received is increased by 30%, but you take 10% more damage from all sources',
    effects: [{ type: 'healing_received_bonus', value: 0.30, description: '+30% healing received' }, { type: 'damage_taken_increase', value: 0.10, description: '+10% damage taken' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'bloodpact', healBonus: 0.30, damageIncrease: 0.10 } },

  { cardId: 'sacred_ground', name: 'Sacred Ground', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support',
    tags: ['healing', 'magic', 'passive'],
    description: 'Standing still for 1 turn consecrates the ground beneath you, healing 5 HP/turn to all allies in range 1',
    effects: [{ type: 'sacred_ground_heal', value: 5, range: 1, description: 'Consecrate ground: 5 HP/turn to nearby allies' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'sacred_ground_heal', value: 5, range: 1 } },

  // --- Utility / CC Combat Passives ---
  { cardId: 'quickfoot', name: 'Quickfoot', type: 'passive_perk', rarity: 'uncommon', archetype: 'scout',
    tags: ['utility', 'passive'],
    description: 'Gain +1 movement range per turn, allowing you to reposition more freely in combat',
    effects: [{ type: 'movement_bonus', value: 1, description: '+1 movement range per turn' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'movement_bonus', value: 1 } },

  { cardId: 'iron_grip', name: 'Iron Grip', type: 'passive_perk', rarity: 'uncommon', archetype: 'tank',
    tags: ['defense', 'utility', 'passive'],
    description: 'Knockback effects on you are halved, keeping you firmly planted',
    effects: [{ type: 'knockback_resist', value: 0.50, description: '50% knockback reduction' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'knockback_resist', value: 0.50 } },

  { cardId: 'taunt_aura', name: 'Taunt Aura', type: 'passive_perk', rarity: 'rare', archetype: 'tank',
    tags: ['defense', 'utility', 'passive'],
    description: 'Enemies in melee range prefer to attack you, drawing aggro away from allies',
    effects: [{ type: 'passive_taunt', range: 1, description: 'Melee-range passive taunt' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'passive_taunt', range: 1 } },

  { cardId: 'shadow_step_passive', name: 'Shadow Stalker', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'assassin',
    tags: ['stealth', 'utility', 'passive'],
    description: 'After killing an enemy, teleport to another enemy within range 3',
    effects: [{ type: 'on_kill_teleport', range: 3, description: 'Teleport to nearby enemy on kill' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'on_kill_teleport', range: 3 } },

  { cardId: 'ambush_passive', name: 'Ambush Instinct', type: 'passive_perk', rarity: 'rare', archetype: 'assassin',
    tags: ['stealth', 'offense', 'passive'],
    description: 'First attack from stealth deals +75% bonus damage',
    effects: [{ type: 'stealth_damage_bonus', value: 0.75, description: '+75% damage from stealth' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'stealth_damage_bonus', value: 0.75 } },

  { cardId: 'vengeful_spirit', name: 'Vengeful Spirit', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'glass_cannon',
    tags: ['offense', 'passive'],
    description: 'On death, explode for 50% of your max HP as shadow damage to all enemies within range 2',
    effects: [{ type: 'death_explosion', hpPercent: 0.50, element: 'shadow', range: 2, description: 'Explode on death for 50% max HP shadow damage' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'death_explosion', hpPercent: 0.50, element: 'shadow', range: 2 } },

  { cardId: 'phoenix_feather', name: 'Phoenix Feather', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense',
    tags: ['utility', 'passive'],
    description: 'Once per dungeon, revive at 25% HP when you would otherwise die',
    effects: [{ type: 'revive_on_death', hpPercent: 0.25, uses: 1, description: 'Revive once per dungeon at 25% HP' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'revive_on_death', hpPercent: 0.25, usesPerDungeon: 1 } },

  { cardId: 'momentum', name: 'Momentum', type: 'passive_perk', rarity: 'uncommon', archetype: 'melee_dps',
    tags: ['offense', 'utility', 'passive'],
    description: 'After moving 3 or more tiles in a turn, your next attack deals +20% damage',
    effects: [{ type: 'momentum_damage', movementThreshold: 3, value: 0.20, description: '+20% damage after moving 3+ tiles' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'momentum_damage', movementThreshold: 3, value: 0.20 } },

  { cardId: 'aura_of_weakness', name: 'Aura of Weakness', type: 'passive_perk', rarity: 'rare', archetype: 'tank',
    tags: ['defense', 'utility', 'passive'],
    description: 'Enemies within melee range deal 10% less damage, weakened by your oppressive presence',
    effects: [{ type: 'damage_reduction_aura', value: 0.10, range: 1, description: 'Enemies in range 1 deal -10% damage' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'damage_reduction_aura', value: 0.10, range: 1 } },

  { cardId: 'opportunist', name: 'Opportunist', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'utility', 'passive'],
    description: 'Attacks against enemies who are moving or have moved this turn deal +15% damage',
    effects: [{ type: 'damage_vs_moving', value: 0.15, description: '+15% damage to moving enemies' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'damage_vs_moving', value: 0.15 } },

  { cardId: 'steadfast', name: 'Steadfast', type: 'passive_perk', rarity: 'uncommon', archetype: 'tank',
    tags: ['defense', 'passive'],
    description: 'If you did not move this turn, gain +5 armor until your next turn',
    effects: [{ type: 'stationary_armor', value: 5, description: '+5 armor when standing still' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'stationary_armor', value: 5 } },

  { cardId: 'battle_hardened', name: 'Battle Hardened', type: 'passive_perk', rarity: 'rare', archetype: 'tank',
    tags: ['defense', 'passive'],
    description: 'Each time you are hit in combat, gain +1 armor permanently for this encounter, up to +10',
    effects: [{ type: 'stacking_armor', perHit: 1, maxStacks: 10, description: '+1 armor per hit taken, max +10' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'stacking_armor', perHit: 1, maxStacks: 10 } },

  { cardId: 'vitality_surge', name: 'Vitality Surge', type: 'passive_perk', rarity: 'uncommon', archetype: 'pure_defense',
    tags: ['defense', 'passive'],
    description: 'At the start of each combat encounter, gain a shield equal to 10% of your max HP',
    effects: [{ type: 'combat_start_shield', value: 0.10, description: '10% max HP shield at combat start' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'combat_start_shield', hpPercent: 0.10 } },

  { cardId: 'adrenaline_rush', name: 'Adrenaline Rush', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'passive'],
    description: 'When you drop below 30% HP, gain +25% attack speed and +15% damage for 3 turns',
    effects: [{ type: 'low_hp_damage_bonus', threshold: 0.30, damageBonus: 0.15, speedBonus: 0.25, duration: 3, description: 'Adrenaline at low HP: +25% speed, +15% damage' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'low_hp_offense_boost', threshold: 0.30, damageBonus: 0.15, speedBonus: 0.25, duration: 3 } },

  { cardId: 'spell_echo', name: 'Spell Echo', type: 'passive_perk', rarity: 'legendary', archetype: 'glass_cannon',
    tags: ['magic', 'offense', 'passive'],
    description: '15% chance to cast the same spell again immediately at no additional mana cost',
    effects: [{ type: 'spell_echo_chance', value: 0.15, description: '15% chance to double-cast spells' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'spell_echo', chance: 0.15 } },

  { cardId: 'soul_siphon', name: 'Soul Siphon', type: 'passive_perk', rarity: 'rare', archetype: 'glass_cannon',
    tags: ['offense', 'magic', 'passive'],
    description: 'Killing an enemy restores 10% of your maximum mana',
    effects: [{ type: 'on_kill_mana_restore', value: 0.10, description: 'Restore 10% max mana on kill' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'on_kill_mana_restore', value: 0.10 } },

  { cardId: 'shield_breaker', name: 'Shield Breaker', type: 'passive_perk', rarity: 'rare', archetype: 'melee_dps',
    tags: ['offense', 'melee', 'passive'],
    description: 'Your attacks deal double damage to enemy shields and damage absorption barriers',
    effects: [{ type: 'shield_damage_bonus', value: 1.00, description: '2x damage to shields' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'shield_damage_bonus', value: 1.00 } },

  { cardId: 'tactical_retreat', name: 'Tactical Retreat', type: 'passive_perk', rarity: 'uncommon', archetype: 'scout',
    tags: ['utility', 'passive'],
    description: 'When you drop below 25% HP, gain +2 movement for 1 turn to escape',
    effects: [{ type: 'low_hp_movement', threshold: 0.25, value: 2, duration: 1, description: '+2 movement when low HP' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'low_hp_movement', threshold: 0.25, value: 2, duration: 1 } },

  // ========================================================================
  // BATCH 3: Crowd Control & Movement Active Cards (CC, Knockback, Chain, AoE)
  // ========================================================================

  // --- Knockback / Push / Pull ---
  { cardId: 'gale_force', name: 'Gale Force', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Unleash a powerful wind blast that pushes all enemies 3 tiles away from you',
    effects: [{ type: 'damage', element: 'wind', base: 15, scaling: 'acumen', factor: 0.3, description: 'Wind AoE + knockback 3' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'damage', element: 'wind', baseDamage: 15,
    range: 0, manaCost: 18, aoeRadius: 2, cooldown: 4,
    scalingStat: 'acumen', scalingFactor: 0.3,
    knockback: 3,
    targetType: 'all_enemies' },

  { cardId: 'gravity_well', name: 'Gravity Well', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'cc_dot', archetypeSecondary: ['grappler'],
    tags: ['magic', 'cc'],
    description: 'Create a singularity of arcane force that pulls all enemies within range 3 toward the center',
    effects: [{ type: 'damage', element: 'arcane', base: 20, scaling: 'acumen', factor: 0.4, description: 'Arcane AoE + pull' }],
    icon: 'skills/Enchantment/',
    combatType: 'damage', element: 'arcane', baseDamage: 20,
    range: 5, manaCost: 25, aoeRadius: 3, cooldown: 5,
    scalingStat: 'acumen', scalingFactor: 0.4,
    pullToCenter: true,
    targetType: 'all_enemies' },

  { cardId: 'repulsion_wave', name: 'Repulsion Wave', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'cc_dot',
    tags: ['cc'],
    description: 'Emit a concussive wave centered on yourself, dealing 15 damage and knocking back all enemies 2 tiles',
    effects: [{ type: 'damage', element: 'physical', base: 15, scaling: 'vigor', factor: 0.3, description: 'AoE knockback 2 + damage' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'damage', baseDamage: 15,
    range: 0, manaCost: 12, aoeRadius: 2, cooldown: 3,
    scalingStat: 'vigor', scalingFactor: 0.3,
    knockback: 2,
    targetType: 'all_enemies' },

  { cardId: 'hook_shot', name: 'Hook Shot', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'grappler', archetypeSecondary: ['cc_dot'],
    tags: ['cc'],
    description: 'Launch a grappling hook that pulls a single enemy to melee range',
    effects: [{ type: 'damage', element: 'physical', base: 8, scaling: 'might', factor: 0.3, description: 'Pull enemy to melee range' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 8,
    range: 5, manaCost: 5, aoeRadius: 0, cooldown: 3,
    scalingStat: 'might', scalingFactor: 0.3,
    pullToSelf: true,
    targetType: 'enemy' },

  { cardId: 'tidal_wave', name: 'Tidal Wave', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'aquatic', archetypeSecondary: ['cc_dot'],
    tags: ['magic', 'cc'],
    description: 'Summon a crashing wave of water that damages enemies and pushes them 2 tiles in the wave direction',
    effects: [{ type: 'damage', element: 'water', base: 25, scaling: 'acumen', factor: 0.5, description: 'Water AoE + push 2' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'damage', element: 'water', baseDamage: 25,
    range: 5, manaCost: 20, aoeRadius: 2, cooldown: 4,
    scalingStat: 'acumen', scalingFactor: 0.5,
    knockback: 2, directionalPush: true,
    onHitTile: 'WATER',
    targetType: 'enemy' },

  { cardId: 'seismic_slam', name: 'Seismic Slam', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'cc_dot', archetypeSecondary: ['melee_dps'],
    tags: ['melee', 'cc'],
    description: 'Slam the ground with tremendous force, dealing earth damage with knockback and a stun chance',
    effects: [{ type: 'damage', element: 'earth', base: 22, scaling: 'might', factor: 0.5, description: 'Earth melee + knockback 1 + stun chance' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', element: 'earth', baseDamage: 22,
    range: 1, manaCost: 10, aoeRadius: 1, cooldown: 3,
    scalingStat: 'might', scalingFactor: 0.5,
    knockback: 1,
    onHitStatus: { name: 'stunned', duration: 1, chance: 0.35, type: 'debuff' },
    targetType: 'enemy' },

  // --- Chain / Bounce Effects ---
  { cardId: 'chain_lightning_cc', name: 'Forked Lightning', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'],
    tags: ['magic', 'cc'],
    description: 'Lightning strikes a target then bounces to 3 nearby enemies, each bounce dealing 50% less damage',
    effects: [{ type: 'damage', element: 'lightning', base: 40, scaling: 'acumen', factor: 0.6, description: 'Chain lightning: bounces to 3 enemies' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'damage', element: 'lightning', baseDamage: 40,
    range: 6, manaCost: 25, aoeRadius: 0, cooldown: 4,
    scalingStat: 'acumen', scalingFactor: 0.6,
    chainBounces: 3, chainDamageFalloff: 0.50,
    onHitTile: 'ELECTRIFIED',
    targetType: 'enemy' },

  { cardId: 'ricochet_shot', name: 'Ricochet Shot', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'melee_dps',
    tags: ['cc'],
    description: 'Fire a projectile that ricochets between 3 enemies, dealing full physical damage to each',
    effects: [{ type: 'damage', element: 'physical', base: 20, scaling: 'finesse', factor: 0.4, description: 'Bouncing shot: 3 targets' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 20,
    range: 6, manaCost: 12, aoeRadius: 0, cooldown: 3,
    scalingStat: 'finesse', scalingFactor: 0.4,
    chainBounces: 2, chainDamageFalloff: 0.0,
    targetType: 'enemy' },

  { cardId: 'plague_spread', name: 'Plague Spread', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Infect a target with virulent plague that spreads poison to 2 adjacent enemies',
    effects: [{ type: 'damage', element: 'poison', base: 12, scaling: 'acumen', factor: 0.3, description: 'Poison spread to 2 adjacent enemies' }],
    icon: 'skills/Enchantment/',
    combatType: 'damage', element: 'poison', baseDamage: 12,
    range: 4, manaCost: 15, aoeRadius: 0, cooldown: 3,
    scalingStat: 'acumen', scalingFactor: 0.3,
    chainBounces: 2, chainDamageFalloff: 0.0,
    onHitStatus: { name: 'poisoned', duration: 3, tickDamage: 5, type: 'debuff' },
    targetType: 'enemy' },

  { cardId: 'arcane_missiles', name: 'Arcane Missiles', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon',
    tags: ['magic', 'cc'],
    description: 'Launch 5 small arcane projectiles that automatically target the nearest enemies',
    effects: [{ type: 'damage', element: 'arcane', base: 8, scaling: 'acumen', factor: 0.2, description: '5 auto-targeting missiles (8 damage each)' }],
    icon: 'skills/Enchantment/',
    combatType: 'damage', element: 'arcane', baseDamage: 8,
    range: 5, manaCost: 14, aoeRadius: 0, cooldown: 3,
    scalingStat: 'acumen', scalingFactor: 0.2,
    projectileCount: 5, autoTarget: true,
    targetType: 'enemy' },

  // --- AoE Status Effects ---
  { cardId: 'howling_blizzard', name: 'Howling Blizzard', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'],
    tags: ['magic', 'cc'],
    description: 'Summon a massive blizzard that deals ice damage and freezes all enemies for 1 turn',
    effects: [{ type: 'damage', element: 'ice', base: 35, scaling: 'acumen', factor: 0.5, description: 'Large AoE ice + freeze 1 turn' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'damage', element: 'ice', baseDamage: 35,
    range: 5, manaCost: 30, aoeRadius: 3, cooldown: 5,
    scalingStat: 'acumen', scalingFactor: 0.5,
    onHitTile: 'FROZEN',
    onHitStatus: { name: 'frozen', duration: 1, speedMult: 0, type: 'debuff' },
    targetType: 'all_enemies' },

  { cardId: 'tremor_cc', name: 'Tremor', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Shake the earth violently, stunning all enemies within radius 3 for 1 turn',
    effects: [{ type: 'crowd_control', ccType: 'stun', duration: 1, description: 'AoE stun for 1 turn' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'debuff', element: 'earth',
    range: 0, manaCost: 22, aoeRadius: 3, cooldown: 5,
    statusEffect: 'stunned', statusDuration: 1,
    targetType: 'all_enemies',
    onHitStatus: { name: 'stunned', duration: 1, type: 'debuff' } },

  { cardId: 'mass_silence', name: 'Mass Silence', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Sever the arcane connection of all nearby enemies, silencing them for 2 turns',
    effects: [{ type: 'crowd_control', ccType: 'silence', duration: 2, description: 'AoE silence for 2 turns' }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff', element: 'arcane',
    range: 0, manaCost: 28, aoeRadius: 3, cooldown: 5,
    statusEffect: 'silenced', statusDuration: 2,
    targetType: 'all_enemies',
    onHitStatus: { name: 'silenced', duration: 2, type: 'debuff' } },

  { cardId: 'flash_freeze', name: 'Flash Freeze', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Instantly drop the temperature, slowing all enemies by 80% for 3 turns',
    effects: [{ type: 'crowd_control', ccType: 'slow', value: 0.80, duration: 3, description: 'AoE 80% slow for 3 turns' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'debuff', element: 'ice',
    range: 0, manaCost: 20, aoeRadius: 3, cooldown: 4,
    statusEffect: 'flash_frozen', statusDuration: 3,
    targetType: 'all_enemies',
    onHitStatus: { name: 'chilled', duration: 3, speedMult: 0.20, type: 'debuff' } },

  { cardId: 'sandstorm_cc', name: 'Sandstorm', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Whip up a blinding sandstorm that reduces all enemy accuracy by 50% for 3 turns',
    effects: [{ type: 'debuff_aoe', stat: 'accuracy', value: -0.50, duration: 3, description: '-50% accuracy to all enemies' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'debuff', element: 'earth',
    range: 0, manaCost: 18, aoeRadius: 3, cooldown: 4,
    statusEffect: 'sandstorm_blind', statusDuration: 3,
    targetType: 'all_enemies',
    onHitStatus: { name: 'blinded', duration: 3, accuracyMult: 0.50, type: 'debuff' } },

  { cardId: 'mass_root', name: 'Mass Root', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Vines erupt from the earth, rooting all enemies in place for 2 turns',
    effects: [{ type: 'crowd_control', ccType: 'root', duration: 2, description: 'AoE root for 2 turns' }],
    icon: 'skills/Herbalism/',
    combatType: 'debuff', element: 'nature',
    range: 5, manaCost: 25, aoeRadius: 3, cooldown: 5,
    statusEffect: 'rooted', statusDuration: 2,
    targetType: 'all_enemies',
    onHitStatus: { name: 'rooted', duration: 2, speedMult: 0, type: 'debuff' } },

  { cardId: 'confusion_gas', name: 'Confusion Gas', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'cc_dot',
    tags: ['cc'],
    description: 'Release a cloud of hallucinogenic gas: 30% chance enemies attack their own allies for 2 turns',
    effects: [{ type: 'crowd_control', ccType: 'confuse', chance: 0.30, duration: 2, description: '30% chance to confuse enemies' }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff', element: 'poison',
    range: 4, manaCost: 20, aoeRadius: 2, cooldown: 5,
    statusEffect: 'confused', statusDuration: 2,
    targetType: 'all_enemies',
    onHitStatus: { name: 'confused', duration: 2, friendlyFireChance: 0.30, type: 'debuff' } },

  { cardId: 'war_horn', name: 'War Horn', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support',
    tags: ['cc'],
    description: 'Sound a thunderous war horn: all allies gain +5 damage and +10% speed for 3 turns',
    effects: [{ type: 'buff_all', description: 'AoE buff: +5 damage, +10% speed for 3 turns' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'buff',
    range: 0, manaCost: 15, aoeRadius: 0, cooldown: 4,
    statusEffect: 'war_horn', statusDuration: 3,
    damageBoost: 5, speedMult: 1.10,
    targetType: 'all_allies' },

  // --- Stun / Disable ---
  { cardId: 'concussive_blow', name: 'Concussive Blow', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'cc_dot', archetypeSecondary: ['melee_dps'],
    tags: ['melee', 'cc'],
    description: 'Deliver a devastating blow to the skull, guaranteeing a 2-turn stun',
    effects: [{ type: 'damage', element: 'physical', base: 18, scaling: 'might', factor: 0.4, description: 'Melee + guaranteed 2-turn stun' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 18,
    range: 1, manaCost: 12, aoeRadius: 0, cooldown: 4,
    scalingStat: 'might', scalingFactor: 0.4,
    onHitStatus: { name: 'stunned', duration: 2, type: 'debuff' },
    targetType: 'enemy' },

  { cardId: 'petrify', name: 'Petrify', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Turn an enemy to stone: cannot act but takes 50% less damage for 3 turns',
    effects: [{ type: 'crowd_control', ccType: 'petrify', duration: 3, description: 'Petrify: no actions, 50% damage reduction' }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff', element: 'earth',
    range: 4, manaCost: 25, aoeRadius: 0, cooldown: 5,
    statusEffect: 'petrified', statusDuration: 3,
    targetType: 'enemy',
    onHitStatus: { name: 'petrified', duration: 3, speedMult: 0, damageReduction: 0.50, type: 'debuff' } },

  { cardId: 'sleep_cc', name: 'Sleep', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Lull an enemy into magical slumber for 3 turns; any damage wakes them',
    effects: [{ type: 'crowd_control', ccType: 'sleep', duration: 3, description: 'Sleep for 3 turns (breaks on damage)' }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff', element: 'arcane',
    range: 5, manaCost: 18, aoeRadius: 0, cooldown: 4,
    statusEffect: 'asleep', statusDuration: 3,
    targetType: 'enemy',
    onHitStatus: { name: 'asleep', duration: 3, breaksOnDamage: true, type: 'debuff' } },

  { cardId: 'blind_cc', name: 'Blinding Light', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Flash a searing burst of light, reducing target accuracy by 75% for 2 turns',
    effects: [{ type: 'crowd_control', ccType: 'blind', duration: 2, description: '-75% accuracy for 2 turns' }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff', element: 'holy',
    range: 4, manaCost: 10, aoeRadius: 0, cooldown: 3,
    statusEffect: 'blinded', statusDuration: 2,
    targetType: 'enemy',
    onHitStatus: { name: 'blinded', duration: 2, accuracyMult: 0.25, type: 'debuff' } },

  { cardId: 'disarm_cc', name: 'Disarm', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'cc_dot',
    tags: ['melee', 'cc'],
    description: 'Knock the weapon from an enemy grip, disabling weapon abilities for 2 turns',
    effects: [{ type: 'crowd_control', ccType: 'disarm', duration: 2, description: 'Disarm: no weapon abilities for 2 turns' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'debuff',
    range: 1, manaCost: 8, aoeRadius: 0, cooldown: 3,
    statusEffect: 'disarmed', statusDuration: 2,
    targetType: 'enemy',
    onHitStatus: { name: 'disarmed', duration: 2, type: 'debuff' } },

  // --- Defensive CC ---
  { cardId: 'counter_stance', name: 'Counter Stance', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'night_hunter', archetypeSecondary: ['melee_dps'],
    tags: ['melee', 'defense', 'cc'],
    description: 'Enter a counter stance for 2 turns: automatically counter the next melee attack for 150% damage',
    effects: [{ type: 'counter', duration: 2, damageMultiplier: 1.50, description: 'Counter next melee attack at 150% damage' }],
    icon: 'skills/Skill_Defence.PNG',
    combatType: 'buff',
    range: 0, manaCost: 10, aoeRadius: 0, cooldown: 4,
    statusEffect: 'counter_stance', statusDuration: 2,
    counterDamage: 1.50,
    targetType: 'self' },

  { cardId: 'thorn_wall', name: 'Thorn Wall', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'defense', 'cc'],
    description: 'Create a wall of thorns that damages enemies who pass through it (10 damage per tile)',
    effects: [{ type: 'tile', element: 'nature', description: 'Creates thorn wall: 10 damage to passing enemies' }],
    icon: 'skills/Herbalism/',
    combatType: 'tile_effect', tileEffect: 'THORN_WALL',
    range: 4, manaCost: 15, aoeRadius: 1, cooldown: 4,
    tileDamage: 10,
    targetType: 'any' },

  { cardId: 'ice_prison', name: 'Ice Prison', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Encase an enemy in solid ice: cannot act or be damaged for 2 turns, completely frozen in place',
    effects: [{ type: 'crowd_control', ccType: 'ice_prison', duration: 2, description: 'Frozen: no actions, no damage, 2 turns' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'debuff', element: 'ice',
    range: 4, manaCost: 22, aoeRadius: 0, cooldown: 5,
    statusEffect: 'ice_prison', statusDuration: 2,
    targetType: 'enemy',
    onHitStatus: { name: 'ice_prison', duration: 2, speedMult: 0, invulnerable: true, cantAct: true, type: 'debuff' } },

  // --- Additional CC Actives ---
  { cardId: 'thunderclap', name: 'Thunderclap', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot', archetypeSecondary: ['melee_dps'],
    tags: ['melee', 'cc'],
    description: 'Clap your hands with supernatural force, dealing lightning damage and stunning nearby enemies',
    effects: [{ type: 'damage', element: 'lightning', base: 18, scaling: 'might', factor: 0.4, description: 'AoE lightning + stun' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'damage', element: 'lightning', baseDamage: 18,
    range: 0, manaCost: 14, aoeRadius: 1, cooldown: 3,
    scalingStat: 'might', scalingFactor: 0.4,
    onHitTile: 'ELECTRIFIED',
    onHitStatus: { name: 'stunned', duration: 1, type: 'debuff' },
    targetType: 'all_enemies' },

  { cardId: 'entangling_vines', name: 'Entangling Vines', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Summon grasping vines that root a single enemy in place for 2 turns',
    effects: [{ type: 'crowd_control', ccType: 'root', duration: 2, description: 'Root single target for 2 turns' }],
    icon: 'skills/Herbalism/',
    combatType: 'debuff', element: 'nature',
    range: 4, manaCost: 10, aoeRadius: 0, cooldown: 3,
    statusEffect: 'rooted', statusDuration: 2,
    targetType: 'enemy',
    onHitStatus: { name: 'rooted', duration: 2, speedMult: 0, type: 'debuff' } },

  { cardId: 'frost_nova', name: 'Frost Nova', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Explode with frost energy, freezing all enemies in melee range for 1 turn and dealing ice damage',
    effects: [{ type: 'damage', element: 'ice', base: 20, scaling: 'acumen', factor: 0.4, description: 'AoE ice damage + freeze 1 turn' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'damage', element: 'ice', baseDamage: 20,
    range: 0, manaCost: 15, aoeRadius: 1, cooldown: 3,
    scalingStat: 'acumen', scalingFactor: 0.4,
    onHitTile: 'FROZEN',
    onHitStatus: { name: 'frozen', duration: 1, speedMult: 0, type: 'debuff' },
    targetType: 'all_enemies' },

  { cardId: 'hamstring', name: 'Hamstring', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'cc_dot', archetypeSecondary: ['melee_dps'],
    tags: ['melee', 'cc'],
    description: 'Slash at an enemy leg, dealing damage and reducing movement speed by 60% for 3 turns',
    effects: [{ type: 'damage', element: 'physical', base: 14, scaling: 'finesse', factor: 0.4, description: 'Physical + 60% slow for 3 turns' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 14,
    range: 1, manaCost: 5, aoeRadius: 0, cooldown: 2,
    scalingStat: 'finesse', scalingFactor: 0.4,
    onHitStatus: { name: 'hamstrung', duration: 3, speedMult: 0.40, type: 'debuff' },
    targetType: 'enemy' },

  { cardId: 'shockwave', name: 'Shockwave', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'cc_dot', archetypeSecondary: ['melee_dps'],
    tags: ['melee', 'cc'],
    description: 'Strike the ground to send a shockwave forward, dealing damage and knocking enemies back 2 tiles',
    effects: [{ type: 'damage', element: 'physical', base: 20, scaling: 'might', factor: 0.5, description: 'Line AoE + knockback 2' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 20,
    range: 4, manaCost: 10, aoeRadius: 1, cooldown: 3,
    scalingStat: 'might', scalingFactor: 0.5,
    knockback: 2, lineAoe: true,
    targetType: 'enemy' },

  { cardId: 'mind_fog', name: 'Mind Fog', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Cloud the minds of enemies in an area, reducing their damage output by 30% for 3 turns',
    effects: [{ type: 'debuff_aoe', stat: 'damage', value: -0.30, duration: 3, description: '-30% enemy damage for 3 turns' }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff', element: 'arcane',
    range: 4, manaCost: 16, aoeRadius: 2, cooldown: 4,
    statusEffect: 'mind_fog', statusDuration: 3,
    targetType: 'all_enemies',
    onHitStatus: { name: 'mind_fog', duration: 3, damageReduction: 0.30, type: 'debuff' } },

  { cardId: 'vortex', name: 'Vortex', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot',
    tags: ['magic', 'cc'],
    description: 'Create a swirling wind vortex that pulls enemies in and deals ongoing wind damage',
    effects: [{ type: 'damage', element: 'wind', base: 10, scaling: 'acumen', factor: 0.3, description: 'Persistent vortex: pull + damage per turn' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'tile_effect', tileEffect: 'VORTEX', element: 'wind', baseDamage: 10,
    range: 5, manaCost: 20, aoeRadius: 2, cooldown: 5,
    scalingStat: 'acumen', scalingFactor: 0.3,
    tileDuration: 3, pullToCenter: true,
    targetType: 'any' },

  { cardId: 'leg_sweep', name: 'Leg Sweep', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'cc_dot',
    tags: ['melee', 'cc'],
    description: 'Sweep the legs of a nearby enemy, knocking them down for 1 turn',
    effects: [{ type: 'damage', element: 'physical', base: 10, scaling: 'finesse', factor: 0.3, description: 'Melee + knockdown 1 turn' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 10,
    range: 1, manaCost: 4, aoeRadius: 0, cooldown: 2,
    scalingStat: 'finesse', scalingFactor: 0.3,
    onHitStatus: { name: 'knocked_down', duration: 1, speedMult: 0, type: 'debuff' },
    targetType: 'enemy' },

  // ========================================================================
  // BATCH 4: Support / Healer / Tank / CC-Controller Class Archetype Cards
  // Designed for class-fluid mix-and-match: players build archetypes by
  // combining these cards freely — no locked classes.
  // ========================================================================

  // --- Healing Passives ---

  { cardId: 'heal_virus', name: 'Heal Virus', type: 'passive_perk', rarity: 'legendary', archetype: 'support',
    tags: ['healing', 'life_magic', 'support', 'passive'],
    description: 'When you heal an ally, the healing spreads like a virus to nearby allies at 50% effectiveness',
    effects: [{ type: 'heal_virus', spreadPercent: 0.50, range: 2, description: 'Healing spreads to nearby allies at 50%' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'heal_virus', spreadPercent: 0.50, range: 2 } },

  { cardId: 'healing_resonance', name: 'Healing Resonance', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support',
    tags: ['healing', 'life_magic', 'support', 'passive'],
    description: 'Allies you heal gain a heal-over-time effect, restoring additional HP over 5 seconds',
    effects: [{ type: 'heal_resonance', hotValue: 3, hotDuration: 5, description: 'Heals apply a HoT for 5 turns' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'heal_resonance', hotValue: 3, hotDuration: 5 } },

  { cardId: 'overhealing_shield', name: 'Overhealing Shield', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['healing', 'support', 'passive'],
    description: 'Excess healing you apply becomes a temporary shield on the target, up to 20% of their max HP',
    effects: [{ type: 'overhealing_shield', maxPercent: 0.20, description: 'Overheal converts to shield (max 20% HP)' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'overhealing_shield', maxPercent: 0.20 } },

  { cardId: 'sympathetic_healing', name: 'Sympathetic Healing', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['healing', 'support', 'passive'],
    description: 'When you heal yourself, nearby allies within range 2 are healed for 30% of the amount',
    effects: [{ type: 'sympathetic_healing', value: 0.30, range: 2, description: 'Self-heals share 30% to nearby allies' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'sympathetic_healing', value: 0.30, range: 2 } },

  { cardId: 'critical_healing', name: 'Critical Healing', type: 'passive_perk', rarity: 'uncommon', archetype: 'support',
    tags: ['healing', 'support', 'passive'],
    description: '15% chance for your healing abilities to critically heal for double effectiveness',
    effects: [{ type: 'critical_healing', chance: 0.15, multiplier: 2.0, description: '15% chance for 2x healing' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'critical_healing', chance: 0.15, multiplier: 2.0 } },

  { cardId: 'lifeline', name: 'Lifeline', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support',
    tags: ['healing', 'support', 'passive'],
    description: 'When an ally drops below 25% HP, automatically heal them for 15% of their max HP (60s cooldown)',
    effects: [{ type: 'lifeline', hpThreshold: 0.25, healPercent: 0.15, cooldown: 60, description: 'Auto-heal allies below 25% HP for 15% max HP' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'lifeline', hpThreshold: 0.25, healPercent: 0.15, cooldown: 60 } },

  { cardId: 'healing_aura', name: 'Healing Aura', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['healing', 'support', 'passive'],
    description: 'Emit a passive regeneration aura — nearby allies within range 2 regen 1% max HP per turn',
    effects: [{ type: 'healing_aura', hpPercent: 0.01, range: 2, description: 'Allies in range regen 1% max HP/turn' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'healing_aura', hpPercent: 0.01, range: 2 } },

  { cardId: 'triage_mastery', name: 'Triage Mastery', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['healing', 'support', 'passive'],
    description: 'Your healing is 25% more effective on targets below 50% HP',
    effects: [{ type: 'triage_mastery', healBonus: 0.25, hpThreshold: 0.50, description: '+25% healing on targets below 50% HP' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'triage_mastery', healBonus: 0.25, hpThreshold: 0.50 } },

  { cardId: 'purifying_touch', name: 'Purifying Touch', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['healing', 'life_magic', 'support', 'passive'],
    description: 'Your healing abilities also remove one debuff from the target',
    effects: [{ type: 'purifying_touch', removeDebuffs: 1, description: 'Heals remove one debuff' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'purifying_touch', removeDebuffs: 1 } },

  { cardId: 'shared_vitality', name: 'Shared Vitality', type: 'passive_perk', rarity: 'uncommon', archetype: 'support',
    tags: ['healing', 'support', 'passive'],
    description: '10% of healing you receive is shared with all party members within range 3',
    effects: [{ type: 'shared_vitality', sharePercent: 0.10, range: 3, description: 'Share 10% of received healing with party' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'shared_vitality', sharePercent: 0.10, range: 3 } },

  // --- Support / Buff Passives ---

  { cardId: 'battle_commander', name: 'Battle Commander', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support',
    tags: ['support', 'psychology', 'passive'],
    description: 'While you are alive, all party members within range 3 gain a 5% damage bonus',
    effects: [{ type: 'battle_commander', damageBonus: 0.05, range: 3, description: '+5% party damage while alive' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'battle_commander', damageBonus: 0.05, range: 3 } },

  { cardId: 'inspiring_presence', name: 'Inspiring Presence', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['support', 'psychology', 'passive'],
    description: 'Party members within range 3 regenerate mana 10% faster from your encouraging aura',
    effects: [{ type: 'inspiring_presence', manaRegenBonus: 0.10, range: 3, description: '+10% mana regen for nearby allies' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'inspiring_presence', manaRegenBonus: 0.10, range: 3 } },

  { cardId: 'shield_of_faith', name: 'Shield of Faith', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['support', 'life_magic', 'passive'],
    description: 'When you apply a buff to an ally, they gain 5% damage reduction for 3 turns',
    effects: [{ type: 'shield_of_faith', damageReduction: 0.05, duration: 3, description: 'Buffs grant +5% DR for 3 turns' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'shield_of_faith', damageReduction: 0.05, duration: 3 } },

  { cardId: 'buff_amplifier', name: 'Buff Amplifier', type: 'passive_perk', rarity: 'uncommon', archetype: 'support',
    tags: ['support', 'passive'],
    description: 'Buffs you apply to allies last 25% longer',
    effects: [{ type: 'buff_amplifier', durationBonus: 0.25, description: '+25% buff duration on applied buffs' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'buff_amplifier', durationBonus: 0.25 } },

  { cardId: 'synergy', name: 'Synergy', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support',
    tags: ['support', 'passive'],
    description: 'When an ally has 2 or more active buffs, each buff is 3% more effective',
    effects: [{ type: 'synergy', bonusPerBuff: 0.03, minBuffs: 2, description: '+3% buff potency when 2+ buffs active' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'synergy', bonusPerBuff: 0.03, minBuffs: 2 } },

  { cardId: 'war_drums', name: 'War Drums', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['support', 'psychology', 'passive'],
    description: 'After killing an enemy, your party gains 10% attack speed for 2 turns',
    effects: [{ type: 'war_drums', speedBonus: 0.10, duration: 2, range: 3, description: '+10% party attack speed on kill' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'war_drums', speedBonus: 0.10, duration: 2, range: 3 } },

  { cardId: 'empowerment', name: 'Empowerment', type: 'passive_perk', rarity: 'rare', archetype: 'support',
    tags: ['support', 'passive'],
    description: 'Damage buffs you apply on allies are 15% more effective',
    effects: [{ type: 'empowerment', buffBonus: 0.15, description: '+15% potency on damage buffs applied to allies' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'empowerment', buffBonus: 0.15 } },

  { cardId: 'spirit_link_party', name: 'Spirit Link', type: 'passive_perk', rarity: 'legendary', archetype: 'support', archetypeSecondary: ['tank'],
    tags: ['support', 'healing', 'passive'],
    description: '15% of damage taken by nearby allies is redirected to you instead',
    effects: [{ type: 'spirit_link_party', redirectPercent: 0.15, range: 2, description: 'Redirect 15% of ally damage to yourself' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'spirit_link_party', redirectPercent: 0.15, range: 2 } },

  { cardId: 'guardian_angel', name: 'Guardian Angel', type: 'passive_perk', rarity: 'mythic_rare', archetype: 'support',
    tags: ['support', 'healing', 'passive'],
    description: 'Revive allies 30% faster and revived allies return with 20% more HP',
    effects: [{ type: 'guardian_angel', reviveSpeedBonus: 0.30, reviveHpBonus: 0.20, description: '+30% revive speed, +20% revive HP' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'guardian_angel', reviveSpeedBonus: 0.30, reviveHpBonus: 0.20, range: 4 } },

  // --- Debuff / Control Support Passives ---

  { cardId: 'contagion', name: 'Contagion', type: 'passive_perk', rarity: 'rare', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'],
    tags: ['cc', 'support', 'passive'],
    description: 'Debuffs you apply have a 30% chance to spread to a nearby enemy within range 2',
    effects: [{ type: 'contagion', spreadChance: 0.30, range: 2, description: '30% chance debuffs spread to nearby enemies' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'contagion', spreadChance: 0.30, range: 2 } },

  { cardId: 'weakening_aura', name: 'Weakening Aura', type: 'passive_perk', rarity: 'rare', archetype: 'cc_dot',
    tags: ['cc', 'support', 'passive'],
    description: 'Enemies within range 1 deal 5% less damage, sapped by your oppressive presence',
    effects: [{ type: 'weakening_aura', damageReduction: 0.05, range: 1, description: 'Nearby enemies deal -5% damage' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'weakening_aura', damageReduction: 0.05, range: 1 } },

  { cardId: 'curse_amplifier', name: 'Curse Amplifier', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'cc_dot',
    tags: ['cc', 'support', 'passive'],
    description: 'Enemies afflicted by your debuffs take 10% more damage from all sources',
    effects: [{ type: 'curse_amplifier', damageAmplify: 0.10, description: '+10% damage to enemies with your debuffs' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'curse_amplifier', damageAmplify: 0.10 } },

  { cardId: 'hex_master', name: 'Hex Master', type: 'passive_perk', rarity: 'uncommon', archetype: 'cc_dot',
    tags: ['cc', 'support', 'passive'],
    description: 'Debuff durations you apply are increased by 20%',
    effects: [{ type: 'hex_master', durationBonus: 0.20, description: '+20% debuff duration' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'hex_master', durationBonus: 0.20 } },

  { cardId: 'mass_dispel', name: 'Mass Dispel', type: 'passive_perk', rarity: 'legendary', archetype: 'cc_dot',
    tags: ['cc', 'magic', 'support', 'passive'],
    description: 'When you remove a buff from an enemy, all enemies within range 2 also lose their buffs (30s CD)',
    effects: [{ type: 'mass_dispel', range: 2, cooldown: 30, description: 'Dispel spreads to nearby enemies' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'mass_dispel', range: 2, cooldown: 30 } },

  { cardId: 'enfeebling_strike', name: 'Enfeebling Strike', type: 'passive_perk', rarity: 'uncommon', archetype: 'cc_dot',
    tags: ['cc', 'support', 'passive'],
    description: 'Your attacks have a 10% chance to reduce the target\'s damage by 15% for 2 turns',
    effects: [{ type: 'enfeebling_strike', chance: 0.10, damageReduction: 0.15, duration: 2, description: '10% chance to weaken enemy damage by 15%' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'enfeebling_strike', chance: 0.10, damageReduction: 0.15, duration: 2 } },

  { cardId: 'vulnerability', name: 'Vulnerability', type: 'passive_perk', rarity: 'rare', archetype: 'cc_dot',
    tags: ['cc', 'support', 'passive'],
    description: 'Enemies you CC take 15% more damage for 2 turns after the CC ends',
    effects: [{ type: 'vulnerability', damageAmplify: 0.15, duration: 2, description: '+15% damage to recently CC\'d enemies' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'vulnerability', damageAmplify: 0.15, duration: 2 } },

  { cardId: 'dissonance', name: 'Dissonance', type: 'passive_perk', rarity: 'uncommon', archetype: 'cc_dot',
    tags: ['cc', 'support', 'passive'],
    description: 'Enemies within range 1 have 10% reduced healing effectiveness',
    effects: [{ type: 'dissonance', healReduction: 0.10, range: 1, description: 'Nearby enemies receive -10% healing' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'dissonance', healReduction: 0.10, range: 1 } },

  // --- Tank / Protector Passives ---

  { cardId: 'last_stand_tank', name: 'Last Stand (Tank)', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'tank',
    tags: ['defense', 'tank', 'passive'],
    description: 'Below 20% HP, you gain 30% damage reduction from all sources',
    effects: [{ type: 'last_stand', damageReduction: 0.30, hpThreshold: 0.20, description: '+30% DR below 20% HP' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'last_stand', damageReduction: 0.30, hpThreshold: 0.20 } },

  { cardId: 'fortress', name: 'Fortress', type: 'passive_perk', rarity: 'rare', archetype: 'tank',
    tags: ['defense', 'tank', 'passive'],
    description: 'While standing still (no movement this turn), gain 15% armor bonus',
    effects: [{ type: 'fortress', armorBonus: 0.15, description: '+15% armor when stationary' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'fortress', armorBonus: 0.15 } },

  { cardId: 'taunt_aura_tank', name: 'Taunt Aura', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'tank',
    tags: ['defense', 'tank', 'passive'],
    description: 'Enemies within range 2 are compelled to attack you over your allies',
    effects: [{ type: 'taunt_aura_tank', range: 2, description: 'Enemies prioritize attacking you' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'passive_taunt', range: 2 } },

  { cardId: 'aegis', name: 'Aegis', type: 'passive_perk', rarity: 'rare', archetype: 'tank',
    tags: ['defense', 'tank', 'passive'],
    description: 'When you block an attack, gain a 5% damage bonus for 2 turns',
    effects: [{ type: 'aegis', damageBonus: 0.05, duration: 2, description: '+5% damage on block for 2 turns' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'aegis', damageBonus: 0.05, duration: 2 } },

  { cardId: 'ironclad', name: 'Ironclad', type: 'passive_perk', rarity: 'rare', archetype: 'tank', archetypeSecondary: ['pure_defense'],
    tags: ['defense', 'tank', 'passive'],
    description: 'Stun, knockback, and knockdown durations on you are reduced by 40%',
    effects: [{ type: 'ironclad', ccReduction: 0.40, description: '-40% CC duration' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'ironclad', ccReduction: 0.40 } },

  { cardId: 'rallying_defense', name: 'Rallying Defense', type: 'passive_perk', rarity: 'uncommon', archetype: 'tank',
    tags: ['defense', 'tank', 'support', 'passive'],
    description: 'When you block an attack, nearby allies within range 2 gain +3 armor for 2 turns',
    effects: [{ type: 'rallying_defense', armorValue: 3, duration: 2, range: 2, description: 'Block grants +3 armor to nearby allies' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'rallying_defense', armorValue: 3, duration: 2, range: 2 } },

  { cardId: 'bulwark_tank', name: 'Bulwark (Tank)', type: 'passive_perk', rarity: 'rare', archetype: 'tank',
    tags: ['defense', 'tank', 'passive'],
    description: 'Shield effectiveness (block damage reduction and shield abilities) increased by 25%',
    effects: [{ type: 'bulwark', shieldBonus: 0.25, description: '+25% shield effectiveness' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'bulwark', shieldBonus: 0.25 } },

  { cardId: 'undying_will', name: 'Undying Will', type: 'passive_perk', rarity: 'legendary', archetype: 'tank',
    tags: ['defense', 'tank', 'passive'],
    description: 'Once per dungeon floor, survive a killing blow with 1 HP instead of dying',
    effects: [{ type: 'undying_will', uses: 1, description: 'Survive killing blow once per floor' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'undying_will', usesPerFloor: 1 } },

  // --- Class-Fluid Support Active Abilities ---

  { cardId: 'chain_heal', name: 'Chain Heal', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'support',
    tags: ['healing', 'life_magic', 'support', 'magic'],
    description: 'Heal a target, then the healing bounces to 2 nearby allies at 60% effectiveness each bounce',
    effects: [{ type: 'heal', base: 30, scaling: 'resolve', factor: 0.5, description: 'Bouncing heal: 2 additional targets at 60%' }],
    icon: 'skills/Skill_Heal.PNG',
    combatType: 'healing', element: 'holy', baseHeal: 30,
    range: 5, manaCost: 22, aoeRadius: 0, cooldown: 3,
    scalingStat: 'resolve', scalingFactor: 0.5,
    targetType: 'ally',
    chainBounces: 2, chainHealFalloff: 0.40 },

  { cardId: 'mass_barrier', name: 'Mass Barrier', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'support', archetypeSecondary: ['pure_defense'],
    tags: ['support', 'life_magic', 'magic'],
    description: 'Grant all nearby allies a shield equal to 20% of your max HP for 3 turns',
    effects: [{ type: 'shield_all', hpPercent: 0.20, duration: 3, description: 'Party shield: 20% of your max HP' }],
    icon: 'skills/Skill_Defence.PNG',
    combatType: 'buff',
    range: 0, manaCost: 28, aoeRadius: 0, cooldown: 5,
    statusEffect: 'mass_barrier', statusDuration: 3, armorBoost: 6,
    targetType: 'all_allies' },

  { cardId: 'cleansing_wave', name: 'Cleansing Wave', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support',
    tags: ['healing', 'support', 'life_magic', 'magic'],
    description: 'Unleash a wave of purifying energy that removes all debuffs from all party members',
    effects: [{ type: 'cleanse_all', removeDebuffs: 'all', description: 'Remove all debuffs from entire party' }],
    icon: 'skills/Skill_Heal.PNG',
    combatType: 'buff', element: 'holy',
    range: 0, manaCost: 25, aoeRadius: 0, cooldown: 5,
    statusEffect: 'cleanse', statusDuration: 0,
    targetType: 'all_allies' },

  { cardId: 'battle_shout', name: 'Battle Shout', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support',
    tags: ['support', 'psychology'],
    description: 'Shout a battle cry that grants +15% damage and +10% defense to all party members for 3 turns',
    effects: [{ type: 'buff_all', stat: 'damage', value: 0.15, duration: 8, description: '+15% damage and +10% defense for party' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'buff',
    range: 0, manaCost: 20, aoeRadius: 0, cooldown: 6,
    statusEffect: 'battle_shout', statusDuration: 3,
    damageBoost: 5, armorBoost: 4,
    targetType: 'all_allies' },

  { cardId: 'mana_tide', name: 'Mana Tide', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'support',
    tags: ['support', 'magic'],
    description: 'Channel tidal mana energy to restore 20% of max mana to all nearby allies',
    effects: [{ type: 'mana_restore_all', percent: 0.20, description: 'Restore 20% max mana to all allies' }],
    icon: 'skills/Enchantment/',
    combatType: 'buff',
    range: 0, manaCost: 10, aoeRadius: 0, cooldown: 8,
    statusEffect: 'mana_tide', statusDuration: 1,
    manaRestorePercent: 0.20,
    targetType: 'all_allies' },

  { cardId: 'sanctuary_zone', name: 'Sanctuary', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'support',
    tags: ['healing', 'support', 'life_magic', 'magic'],
    description: 'Create a holy sanctuary zone on your tile — allies standing in it regen 5% HP per turn for 4 turns',
    effects: [{ type: 'tile', element: 'holy', description: 'Healing zone: allies regen 5% HP/turn for 4 turns' }],
    icon: 'skills/Skill_Heal.PNG',
    combatType: 'tile_effect', tileEffect: 'SANCTUARY',
    element: 'holy',
    range: 0, manaCost: 35, aoeRadius: 2, cooldown: 8,
    tileDuration: 4, tileHealPercent: 0.05,
    targetType: 'any' },

  // ========================================================================
  // BATCH 5: MMO-Inspired Archetype Cards
  // Iconic mechanics from WoW, FFXIV, ESO, GW2, Lost Ark class systems.
  // Each card creates a UNIQUE gameplay pattern, not a stat stick.
  // ========================================================================

  // --- A. Atonement / Heal-Through-Aggression (WoW Disc Priest / FFXIV Sage) ---

  { cardId: 'atonement', name: 'Atonement', type: 'passive_perk', rarity: 'legendary', archetype: 'support', archetypeSecondary: ['glass_cannon'],
    tags: ['healing', 'offense', 'life_magic', 'passive'],
    description: 'When you deal damage, the lowest-HP ally within range 3 is healed for 20% of the damage dealt. Turns every attack into triage.',
    effects: [{ type: 'damage_to_heal', healPercent: 0.20, targetLowestHp: true, range: 3, description: '20% of damage dealt heals lowest-HP ally' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'damage_to_heal', healPercent: 0.20, targetLowestHp: true, range: 3 } },

  { cardId: 'kardia_link', name: 'Kardia Link', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support',
    tags: ['healing', 'support', 'passive'],
    description: 'Designate one ally at combat start as your Kardia partner. Every ability you use heals them for 8 flat HP. A constant stream of passive healing.',
    effects: [{ type: 'kardia_link', flatHeal: 8, description: 'Every ability use heals bonded ally for 8 HP' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'kardia_link', flatHeal: 8 } },

  { cardId: 'siphoning_strikes', name: 'Siphoning Strikes', type: 'passive_perk', rarity: 'uncommon', archetype: 'melee_dps', archetypeSecondary: ['support'],
    tags: ['offense', 'healing', 'passive'],
    description: 'Basic attacks restore 3% of your max HP. Sustain through aggression.',
    effects: [{ type: 'attack_self_heal', hpPercent: 0.03, description: 'Basic attacks restore 3% max HP' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'attack_self_heal', hpPercent: 0.03 } },

  // --- B. Stagger / Damage Conversion (WoW Brewmaster) ---

  { cardId: 'stagger', name: 'Stagger', type: 'passive_perk', rarity: 'legendary', archetype: 'tank', archetypeSecondary: ['pure_defense'],
    tags: ['defense', 'tank', 'passive'],
    description: '40% of damage taken is converted into a damage-over-time on yourself over 5 turns instead of hitting instantly. Smooths spike damage into manageable ticks.',
    effects: [{ type: 'stagger', convertPercent: 0.40, dotTurns: 5, description: '40% of damage taken becomes a 5-turn self-DoT' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'stagger', convertPercent: 0.40, dotTurns: 5 } },

  { cardId: 'ironskin', name: 'Ironskin', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'tank',
    tags: ['defense', 'tank', 'passive'],
    description: 'While you did not move this turn, gain 15% damage reduction from all sources. Rewards holding the line.',
    effects: [{ type: 'stationary_damage_reduction', value: 0.15, description: '+15% DR when stationary' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'stationary_damage_reduction', value: 0.15 } },

  // --- C. Hot Streak / Crit Chains (WoW Fire Mage) ---

  { cardId: 'hot_streak', name: 'Hot Streak', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'glass_cannon', archetypeSecondary: ['melee_dps'],
    tags: ['offense', 'magic', 'passive'],
    description: 'Two consecutive critical hits grant your next ability +50% damage and zero cooldown. Rewards crit-stacking builds.',
    effects: [{ type: 'hot_streak', requiredCrits: 2, damageBonus: 0.50, freeCast: true, description: '2 consecutive crits = free +50% damage ability' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatPassive: { type: 'hot_streak', requiredCrits: 2, damageBonus: 0.50, freeCast: true } },

  { cardId: 'shatter', name: 'Shatter', type: 'passive_perk', rarity: 'rare', archetype: 'glass_cannon', archetypeSecondary: ['cc_dot'],
    tags: ['offense', 'magic', 'cc', 'passive'],
    description: 'Frozen or stunned enemies take 30% more critical damage from your attacks. Punishes crowd-controlled targets.',
    effects: [{ type: 'crit_damage_vs_cc', value: 0.30, ccTypes: ['frozen', 'stunned'], description: '+30% crit damage vs frozen/stunned enemies' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatPassive: { type: 'crit_damage_vs_cc', value: 0.30, ccTypes: ['frozen', 'stunned'] } },

  // --- D. Transformation / Stance Cards (WoW DH, Lost Ark Berserker) ---

  { cardId: 'metamorphosis', name: 'Metamorphosis', type: 'active_ability', rarity: 'legendary', resourceType: 'stamina', archetype: 'melee_dps', archetypeSecondary: ['glass_cannon'],
    tags: ['offense', 'magic'],
    description: 'Transform into a demonic form for 3 turns: +25% damage, +15% speed, all attacks deal AoE splash. Long cooldown.',
    effects: [{ type: 'transform', form: 'demon', duration: 3, damageBonus: 0.25, speedBonus: 0.15, aoeOnAttack: true }],
    icon: 'skills/Enchantment/',
    combatType: 'buff',
    range: 0, manaCost: 35, aoeRadius: 0, cooldown: 8,
    statusEffect: 'metamorphosis', statusDuration: 3,
    damageBoost: 8, speedMult: 1.15, aoeOnAttack: true,
    targetType: 'self' },

  { cardId: 'berserker_fury_transform', name: 'Berserker Fury', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['tank'],
    tags: ['offense', 'melee'],
    description: 'Enter a berserker fury for 3 turns: immune to fear and stun, remove all CC on activation, but take 10% more damage.',
    effects: [{ type: 'transform', form: 'berserker', duration: 3, ccImmune: true, cleansesOnActivation: true, damageTakenIncrease: 0.10 }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'buff',
    range: 0, manaCost: 15, aoeRadius: 0, cooldown: 6,
    statusEffect: 'berserker_fury', statusDuration: 3,
    cleansesDebuffs: true, ccImmune: ['fear', 'stun'],
    damageBoost: 5, damageTakenIncrease: 0.10,
    targetType: 'self' },

  { cardId: 'death_shroud', name: 'Death Shroud', type: 'passive_perk', rarity: 'legendary', archetype: 'tank', archetypeSecondary: ['pure_defense'],
    tags: ['defense', 'necromancy', 'passive'],
    description: 'You have a second HP pool equal to 30% of max HP. When main HP depletes, enter Shroud mode using the second pool. When Shroud depletes, you die.',
    effects: [{ type: 'death_shroud', secondPoolPercent: 0.30, description: '30% max HP second life bar (Shroud mode)' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'death_shroud', secondPoolPercent: 0.30 } },

  // --- E. Execute Mechanics (WoW Warrior / Hunter) ---

  { cardId: 'kill_shot', name: 'Kill Shot', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['assassin'],
    tags: ['offense'],
    description: 'A lethal ranged shot that deals 3x damage to targets below 25% HP. Useless against healthy enemies.',
    effects: [{ type: 'damage', element: 'physical', base: 20, scaling: 'finesse', factor: 0.5, description: '3x damage to targets below 25% HP' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 20,
    range: 7, manaCost: 10, aoeRadius: 0, cooldown: 3,
    scalingStat: 'finesse', scalingFactor: 0.5,
    executeThreshold: 0.25, executeBonusDamage: 2.0,
    targetType: 'enemy' },

  { cardId: 'mortal_strike', name: 'Mortal Strike', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['cc_dot'],
    tags: ['offense', 'melee'],
    description: 'A vicious melee strike that applies 25% healing reduction to the target for 3 turns. Shuts down enemy healing.',
    effects: [{ type: 'damage', element: 'physical', base: 25, scaling: 'might', factor: 0.5, description: 'Physical damage + healing reduction' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 25,
    range: 1, manaCost: 8, aoeRadius: 0, cooldown: 3,
    scalingStat: 'might', scalingFactor: 0.5,
    onHitStatus: { name: 'mortal_wound', duration: 3, healReduction: 0.25, type: 'debuff' },
    targetType: 'enemy' },

  { cardId: 'execute_strike', name: 'Execute', type: 'active_ability', rarity: 'uncommon', resourceType: 'bloodlust', archetype: 'melee_dps',
    tags: ['offense', 'melee'],
    description: 'A brutal finishing blow that deals double damage to targets below 30% HP.',
    effects: [{ type: 'damage', element: 'physical', base: 18, scaling: 'might', factor: 0.4, description: 'Double damage to targets below 30% HP' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 18,
    range: 1, manaCost: 5, aoeRadius: 0, cooldown: 2,
    scalingStat: 'might', scalingFactor: 0.4,
    executeThreshold: 0.30, executeBonusDamage: 1.0,
    targetType: 'enemy' },

  // --- F. Combo Chains (FFXIV melee combos) ---

  { cardId: 'combo_rising_edge', name: 'Combo: Rising Edge', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'melee_dps',
    tags: ['melee', 'combo'],
    description: 'A rising slash that opens a combo chain. If it hits, unlocks Savage Blow for your next turn.',
    effects: [{ type: 'damage', element: 'physical', base: 14, scaling: 'might', factor: 0.4, description: 'Opener: unlocks Savage Blow on hit' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 14,
    range: 1, manaCost: 3, aoeRadius: 0, cooldown: 1,
    scalingStat: 'might', scalingFactor: 0.4,
    comboUnlocks: 'combo_savage_blow', comboWindowTurns: 2,
    targetType: 'enemy' },

  { cardId: 'combo_savage_blow', name: 'Combo: Savage Blow', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'melee_dps',
    tags: ['melee', 'combo'],
    description: 'A savage follow-up strike. Can only be used after Rising Edge. Unlocks Full Thrust on hit.',
    effects: [{ type: 'damage', element: 'physical', base: 25, scaling: 'might', factor: 0.5, description: 'Combo 2: unlocks Full Thrust on hit' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 25,
    range: 1, manaCost: 5, aoeRadius: 0, cooldown: 1,
    scalingStat: 'might', scalingFactor: 0.5,
    comboRequires: 'combo_rising_edge', comboUnlocks: 'combo_full_thrust', comboWindowTurns: 2,
    targetType: 'enemy' },

  { cardId: 'combo_full_thrust', name: 'Combo: Full Thrust', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'bloodlust', archetype: 'melee_dps',
    tags: ['melee', 'combo'],
    description: 'A devastating finisher. Can only be used after Savage Blow. Deals 3x damage as the combo payoff.',
    effects: [{ type: 'damage', element: 'physical', base: 45, scaling: 'might', factor: 0.7, description: 'Combo finisher: 3x damage' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 45,
    range: 1, manaCost: 8, aoeRadius: 0, cooldown: 1,
    scalingStat: 'might', scalingFactor: 0.7,
    comboRequires: 'combo_savage_blow', comboFinisher: true,
    targetType: 'enemy' },

  // --- G. Clone / Illusion System (GW2 Mesmer) ---

  { cardId: 'mirror_image', name: 'Mirror Image', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', archetypeSecondary: ['scout'],
    tags: ['magic', 'illusion'],
    description: 'Create 2 illusion clones that each absorb one hit and deal minor damage per turn. Clones last 4 turns or until destroyed.',
    effects: [{ type: 'summon', summonType: 'illusion_clone', count: 2, duration: 4, description: 'Summon 2 mirror clones (1 HP each, deal minor damage)' }],
    icon: 'skills/Enchantment/',
    combatType: 'summon',
    range: 1, manaCost: 15, aoeRadius: 0, cooldown: 4,
    summonType: 'illusion_clone', summonCount: 2, summonHp: 1, summonDamage: 5, summonDuration: 4,
    targetType: 'any' },

  { cardId: 'shatter_mind', name: 'Shatter Mind', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'glass_cannon',
    tags: ['magic', 'illusion'],
    description: 'Destroy all active clones. Each destroyed clone deals 20 burst damage to the target. More clones = more damage.',
    effects: [{ type: 'shatter', damagePerClone: 20, scaling: 'acumen', factor: 0.3, description: 'Destroy clones: 20 damage per clone to target' }],
    icon: 'skills/Enchantment/',
    combatType: 'damage', element: 'arcane', baseDamage: 0,
    range: 5, manaCost: 12, aoeRadius: 0, cooldown: 3,
    scalingStat: 'acumen', scalingFactor: 0.3,
    shattersClones: true, damagePerClone: 20,
    targetType: 'enemy' },

  { cardId: 'distortion', name: 'Distortion', type: 'passive_perk', rarity: 'rare', archetype: 'scout', archetypeSecondary: ['pure_defense'],
    tags: ['magic', 'illusion', 'defense', 'passive'],
    description: 'When an illusion or clone is destroyed, you gain evasion for 1 turn (100% dodge). Rewards clone-based play.',
    effects: [{ type: 'on_clone_death_evasion', dodgeTurns: 1, description: 'Clone death grants 1 turn evasion' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'on_clone_death_evasion', dodgeTurns: 1 } },

  // --- H. Ground Zone / Totem Cards (WoW Shaman, FFXIV) ---

  { cardId: 'healing_totem', name: 'Healing Totem', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support',
    tags: ['support', 'healing'],
    description: 'Place a healing totem that restores 3% max HP per turn to all allies within range 2 for 4 turns.',
    effects: [{ type: 'tile', element: 'holy', description: 'Healing totem: 3% HP/turn to nearby allies for 4 turns' }],
    icon: 'skills/Skill_Heal.PNG',
    combatType: 'tile_effect', tileEffect: 'HEALING_TOTEM',
    element: 'holy',
    range: 3, manaCost: 18, aoeRadius: 2, cooldown: 5,
    tileDuration: 4, tileHealPercent: 0.03,
    targetType: 'any' },

  { cardId: 'fire_totem', name: 'Fire Totem', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'glass_cannon',
    tags: ['offense', 'magic'],
    description: 'Place a fire totem that deals 12 fire damage per turn to all enemies within range 2 for 4 turns.',
    effects: [{ type: 'tile', element: 'fire', description: 'Fire totem: 12 fire damage/turn to nearby enemies for 4 turns' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'tile_effect', tileEffect: 'FIRE_TOTEM',
    element: 'fire',
    range: 3, manaCost: 16, aoeRadius: 2, cooldown: 5,
    tileDuration: 4, tileDamage: 12,
    targetType: 'any' },

  { cardId: 'earthen_ward_totem', name: 'Earthen Ward Totem', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'pure_defense',
    tags: ['support', 'defense'],
    description: 'Place a warding totem that grants 10% damage reduction to all allies within range 2 for 4 turns.',
    effects: [{ type: 'tile', element: 'earth', description: 'Ward totem: 10% DR to allies in range for 4 turns' }],
    icon: 'skills/Skill_Defence.PNG',
    combatType: 'tile_effect', tileEffect: 'EARTHEN_TOTEM',
    element: 'earth',
    range: 3, manaCost: 20, aoeRadius: 2, cooldown: 5,
    tileDuration: 4, wardDamageReduction: 0.10,
    targetType: 'any' },

  { cardId: 'salted_earth', name: 'Salted Earth', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'],
    tags: ['offense', 'magic', 'necromancy'],
    description: 'Desecrate the ground with dark energy. Enemies standing in the zone take 8 shadow damage per turn for 4 turns.',
    effects: [{ type: 'tile', element: 'shadow', description: 'Shadow zone: 8 shadow DoT to enemies standing in it' }],
    icon: 'skills/Enchantment/',
    combatType: 'tile_effect', tileEffect: 'SALTED_EARTH',
    element: 'shadow',
    range: 4, manaCost: 14, aoeRadius: 2, cooldown: 4,
    tileDuration: 4, tileDamage: 8,
    onHitStatus: { name: 'shadow_burn', duration: 2, tickDamage: 4, type: 'debuff' },
    targetType: 'any' },

  // --- I. Resource Accumulation (FFXIV WHM Lilies, Sage Addersgall) ---

  { cardId: 'lily_of_the_field', name: 'Lily of the Field', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support',
    tags: ['healing', 'life_magic', 'passive'],
    description: 'Gain 1 Lily token at the start of each turn. At 3 Lilies, your next heal is instant and +50% effective. Tokens consumed on use.',
    effects: [{ type: 'lily_accumulation', tokensPerTurn: 1, tokensRequired: 3, healBonus: 0.50, description: 'Accumulate Lilies: 3 = next heal +50% and instant' }],
    icon: 'skills/Skill_Heal.PNG',
    combatPassive: { type: 'lily_accumulation', tokensPerTurn: 1, tokensRequired: 3, healBonus: 0.50 } },

  { cardId: 'soul_shards', name: 'Soul Shards', type: 'passive_perk', rarity: 'rare', archetype: 'glass_cannon',
    tags: ['offense', 'necromancy', 'passive'],
    description: 'Enemy kills generate 1 Soul Shard. At 5 shards, your next dark/shadow ability deals +75% damage. Shards consumed on use.',
    effects: [{ type: 'soul_shards', shardsPerKill: 1, shardsRequired: 5, damageBonus: 0.75, elements: ['dark', 'shadow'], description: 'Kill enemies for Shards: 5 = next dark ability +75% damage' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'soul_shards', shardsPerKill: 1, shardsRequired: 5, damageBonus: 0.75, elements: ['dark', 'shadow'] } },

  // --- J. Unique Utility/CC from MMOs ---

  { cardId: 'death_grip_pull', name: 'Death Grip', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'grappler', archetypeSecondary: ['cc_dot'],
    tags: ['cc', 'melee', 'necromancy'],
    description: 'Yank a distant enemy to melee range with necrotic chains, stunning them for 1 turn on arrival.',
    effects: [{ type: 'damage', element: 'shadow', base: 10, scaling: 'might', factor: 0.3, description: 'Pull enemy to you + stun 1 turn' }],
    icon: 'skills/Enchantment/',
    combatType: 'damage', element: 'shadow', baseDamage: 10,
    range: 5, manaCost: 12, aoeRadius: 0, cooldown: 4,
    scalingStat: 'might', scalingFactor: 0.3,
    pullToSelf: true,
    onHitStatus: { name: 'stunned', duration: 1, type: 'debuff' },
    targetType: 'enemy' },

  { cardId: 'polymorph', name: 'Polymorph', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'],
    tags: ['magic', 'cc'],
    description: 'Transform the target into a harmless creature for 2 turns. Any damage breaks the effect. A powerful but fragile CC.',
    effects: [{ type: 'crowd_control', ccType: 'polymorph', duration: 2, breaksOnDamage: true, description: 'Polymorph: no actions for 2 turns, breaks on damage' }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff', element: 'arcane',
    range: 5, manaCost: 20, aoeRadius: 0, cooldown: 5,
    statusEffect: 'polymorphed', statusDuration: 2,
    targetType: 'enemy',
    onHitStatus: { name: 'polymorphed', duration: 2, speedMult: 0.3, cantAct: true, breaksOnDamage: true, type: 'debuff' } },

  { cardId: 'bloodlust', name: 'Bloodlust', type: 'active_ability', rarity: 'legendary', resourceType: 'bloodlust', archetype: 'support', archetypeSecondary: ['melee_dps'],
    tags: ['support', 'psychology'],
    description: 'All party members gain 30% haste (attack speed and cooldown reduction) for 3 turns. Extremely long cooldown.',
    effects: [{ type: 'buff_all', stat: 'haste', value: 0.30, duration: 3, description: 'Party-wide 30% haste for 3 turns' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'buff',
    range: 0, manaCost: 40, aoeRadius: 0, cooldown: 10,
    statusEffect: 'bloodlust', statusDuration: 3,
    hasteMult: 1.30, cooldownReduction: 0.30,
    targetType: 'all_allies' },

  { cardId: 'divine_invulnerability', name: 'Divine Shield', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'pure_defense', archetypeSecondary: ['support'],
    tags: ['defense', 'life_magic'],
    description: 'Full invulnerability for 2 turns. You cannot attack during this time. Very long cooldown.',
    effects: [{ type: 'invulnerability', duration: 2, description: 'Immune to all damage for 2 turns; cannot attack' }],
    icon: 'skills/Skill_Defence.PNG',
    combatType: 'buff',
    range: 0, manaCost: 30, aoeRadius: 0, cooldown: 10,
    statusEffect: 'divine_invulnerability', statusDuration: 2,
    invulnerable: true, cantAttack: true,
    targetType: 'self' },

  { cardId: 'binding_blade', name: 'Binding Blade', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'grappler', archetypeSecondary: ['cc_dot'],
    tags: ['melee', 'cc'],
    description: 'Throw spectral blades at up to 3 enemies, then pull them all to your position. Groups enemies for AoE follow-up.',
    effects: [{ type: 'damage', element: 'physical', base: 12, scaling: 'might', factor: 0.3, description: 'Hit 3 enemies then pull all to you' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 12,
    range: 4, manaCost: 15, aoeRadius: 0, cooldown: 4,
    scalingStat: 'might', scalingFactor: 0.3,
    multiTarget: 3, pullToSelf: true,
    targetType: 'enemy' },

  // --- K. Partner / Bond System (FFXIV Dancer) ---

  { cardId: 'dance_partner', name: 'Dance Partner', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'support',
    tags: ['support', 'passive'],
    description: 'Bond with one ally per encounter. All buff cards you apply also affect your dance partner at 50% effectiveness.',
    effects: [{ type: 'dance_partner', buffShare: 0.50, description: 'Buffs also apply to bonded partner at 50%' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'dance_partner', buffShare: 0.50 } },

  { cardId: 'ebon_might', name: 'Ebon Might', type: 'passive_perk', rarity: 'legendary', archetype: 'support',
    tags: ['support', 'passive'],
    description: '10% of your highest primary stat is added to up to 3 nearby allies. The ultimate force multiplier for organized parties.',
    effects: [{ type: 'ebon_might', statSharePercent: 0.10, maxTargets: 3, range: 3, description: '10% of your highest stat shared with 3 allies' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'ebon_might', statSharePercent: 0.10, maxTargets: 3, range: 3 } },

  // --- L. Reflect / Counter Mechanics ---

  { cardId: 'dragonfire_scale', name: 'Dragonfire Scale', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense', archetypeSecondary: ['night_hunter'],
    tags: ['defense', 'passive'],
    description: '20% chance to reflect projectile and ranged attacks back at the attacker for full damage.',
    effects: [{ type: 'projectile_reflect', chance: 0.20, description: '20% chance to reflect ranged attacks' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'projectile_reflect', chance: 0.20 } },

  { cardId: 'riposte_passive', name: 'Riposte', type: 'passive_perk', rarity: 'uncommon', archetype: 'night_hunter', archetypeSecondary: ['melee_dps'],
    tags: ['defense', 'offense', 'melee', 'passive'],
    description: 'After blocking or dodging an attack, your next attack deals +25% damage. Rewards defensive play with offensive payoff.',
    effects: [{ type: 'riposte', damageBonus: 0.25, description: '+25% damage on next attack after block/dodge' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'riposte', damageBonus: 0.25 } },

  { cardId: 'thorns_aura', name: 'Thorns Aura', type: 'passive_perk', rarity: 'rare', archetype: 'pure_defense',
    tags: ['defense', 'passive'],
    description: 'Melee attackers take 10% of the damage they deal to you as reflected physical damage. Punishes sustained melee assault.',
    effects: [{ type: 'melee_damage_reflect', value: 0.10, description: 'Melee attackers take 10% of dealt damage' }],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'melee_damage_reflect', value: 0.10 } },

  // --- M. Additional Iconic MMO Mechanics ---

  { cardId: 'mark_of_the_wild', name: 'Mark of the Wild', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support', archetypeSecondary: ['tank'],
    tags: ['support', 'magic'],
    description: 'Bless all party members with nature energy: +3 to all stats and +5% damage reduction for 5 turns.',
    effects: [{ type: 'buff_all', stat: 'all', value: 3, duration: 5 }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 20, aoeRadius: 0, cooldown: 6,
    statusEffect: 'mark_of_wild', statusDuration: 5,
    statBoost: { vigor: 3, might: 3, finesse: 3, acumen: 3, resolve: 3, ingenuity: 3 },
    damageReduction: 0.05,
    targetType: 'all_allies' },

  { cardId: 'power_word_shield', name: 'Power Word: Shield', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'support', archetypeSecondary: ['pure_defense'],
    tags: ['healing', 'support', 'life_magic', 'magic'],
    description: 'Instantly shield an ally for 40 + resolve scaling damage absorption. Prevents damage rather than healing after the fact.',
    effects: [{ type: 'shield', base: 40, scaling: 'resolve', factor: 0.5 }],
    icon: 'skills/Skill_Heal.PNG',
    combatType: 'buff', element: 'holy',
    range: 5, manaCost: 15, aoeRadius: 0, cooldown: 3,
    scalingStat: 'resolve', scalingFactor: 0.5,
    statusEffect: 'power_word_shield', statusDuration: 4, armorBoost: 5,
    targetType: 'ally' },

  { cardId: 'lay_on_hands', name: 'Lay on Hands', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'support', archetypeSecondary: ['pure_defense'],
    tags: ['healing', 'life_magic', 'magic'],
    description: 'Fully restore one ally to 100% HP. Extremely long cooldown. The ultimate emergency heal.',
    effects: [{ type: 'heal_full', description: 'Heal target to 100% HP' }],
    icon: 'skills/Skill_Heal.PNG',
    combatType: 'healing', element: 'holy', baseHeal: 9999,
    range: 1, manaCost: 50, aoeRadius: 0, cooldown: 10,
    scalingStat: 'resolve', scalingFactor: 0,
    fullHeal: true,
    targetType: 'ally' },

  { cardId: 'intercept', name: 'Intercept', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'tank', archetypeSecondary: ['support'],
    tags: ['defense', 'tank', 'melee'],
    description: 'Charge to an ally within range 4. For 2 turns, redirect all damage they would take to you instead.',
    effects: [{ type: 'intercept', duration: 2, description: 'Charge to ally and absorb their damage for 2 turns' }],
    icon: 'skills/Skill_Defence.PNG',
    combatType: 'buff',
    range: 4, manaCost: 10, aoeRadius: 0, cooldown: 5,
    statusEffect: 'intercepting', statusDuration: 2,
    redirectDamage: true, leapToTarget: true,
    targetType: 'ally' },

  { cardId: 'intervene', name: 'Intervene', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'tank', archetypeSecondary: ['pure_defense'],
    tags: ['defense', 'tank', 'passive'],
    description: 'When a nearby ally within range 2 would take a hit exceeding 30% of their max HP, you automatically step in and take 50% of that damage instead.',
    effects: [{ type: 'intervene', damageShare: 0.50, hpThreshold: 0.30, range: 2, description: 'Auto-intercept big hits on nearby allies' }],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'intervene', damageShare: 0.50, hpThreshold: 0.30, range: 2 } },

  { cardId: 'challenge_shout', name: 'Challenge Shout', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'tank', archetypeSecondary: ['cc_dot'],
    tags: ['defense', 'tank', 'cc'],
    description: 'Force all enemies within range 3 to attack you for 2 turns. Gain 10% damage reduction while active.',
    effects: [{ type: 'taunt_aoe', range: 3, duration: 2, damageReduction: 0.10, description: 'AoE taunt + 10% DR for 2 turns' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'debuff',
    range: 0, manaCost: 8, aoeRadius: 3, cooldown: 4,
    statusEffect: 'challenged', statusDuration: 2,
    tauntAoe: true, selfDamageReduction: 0.10,
    targetType: 'all_enemies' },

  { cardId: 'avatar_of_war', name: 'Avatar of War', type: 'active_ability', rarity: 'mythic_rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['tank'],
    tags: ['offense', 'melee'],
    description: 'Become an unstoppable avatar for 4 turns: +30% damage, +20% size (can not be knocked back), immune to CC. Costs 20% of current HP to activate.',
    effects: [{ type: 'transform', form: 'avatar', duration: 4, damageBonus: 0.30, ccImmune: true, knockbackImmune: true }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'buff',
    range: 0, manaCost: 20, aoeRadius: 0, cooldown: 8,
    statusEffect: 'avatar_of_war', statusDuration: 4,
    damageBoost: 10, ccImmune: true, knockbackImmune: true,
    hpCost: 0.20,
    targetType: 'self' },

  { cardId: 'fade', name: 'Fade', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'support',
    tags: ['healing', 'support'],
    description: 'Instantly drop all threat/aggro, causing enemies to temporarily ignore you for 2 turns. Emergency healer survival tool.',
    effects: [{ type: 'threat_drop', duration: 2, description: 'Drop all aggro for 2 turns' }],
    icon: 'skills/Enchantment/',
    combatType: 'buff',
    range: 0, manaCost: 8, aoeRadius: 0, cooldown: 4,
    statusEffect: 'faded', statusDuration: 2,
    threatDrop: true,
    targetType: 'self' },

  { cardId: 'soulstone', name: 'Soulstone', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'support', archetypeSecondary: ['pure_defense'],
    tags: ['necromancy', 'support', 'magic'],
    description: 'Pre-cast on an ally. If they die within 5 turns, they auto-revive at 30% HP. Can only be active on one target.',
    effects: [{ type: 'pre_revive', hpPercent: 0.30, duration: 5, description: 'Target auto-revives at 30% HP if killed within 5 turns' }],
    icon: 'skills/Enchantment/',
    combatType: 'buff', element: 'shadow',
    range: 4, manaCost: 25, aoeRadius: 0, cooldown: 8,
    statusEffect: 'soulstoned', statusDuration: 5,
    reviveHpPercent: 0.30,
    targetType: 'ally' },

  { cardId: 'innervate', name: 'Innervate', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'support',
    tags: ['support', 'magic'],
    description: 'Grant an ally 5 mana regeneration per turn for 4 turns. Keeps casters in the fight.',
    effects: [{ type: 'mana_regen_buff', value: 5, duration: 4, description: '+5 mana/turn to target for 4 turns' }],
    icon: 'skills/Enchantment/',
    combatType: 'buff',
    range: 4, manaCost: 5, aoeRadius: 0, cooldown: 5,
    statusEffect: 'innervate', statusDuration: 4,
    manaPerTurn: 5,
    targetType: 'ally' },

  // === ANIMAL MORPHING CARDS (Druid-style shapeshifting) ===

  { cardId: 'rat_form', name: 'Rat Form', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'scout',
    tags: ['animal_handling'],
    description: 'Transform into a rat for 4 turns. +50% movement speed, +30% evasion, can access small passages. -60% damage dealt, -40% HP. Ideal for scouting and escape.',
    effects: [{ type: 'transform', form: 'rat', duration: 4, animalForm: true, speedBonus: 0.50, dodgeBonus: 0.30, damageDealt: -0.60, hpMult: -0.40 }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 8, aoeRadius: 0, cooldown: 4,
    statusEffect: 'animal_form_rat', statusDuration: 4,
    animalForm: 'rat',
    speedMult: 1.50,
    damageBoost: -6,
    maxHpPercent: -0.40,
    dodgeBonus: 0.30,
    stealthBonus: 0.30,
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canFitSmallHoles: true,
      canCrawlUnderDoors: true,
      canAccessVents: true,
      canScavenge: true,
    } },

  { cardId: 'bat_form', name: 'Bat Form', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'night_hunter', archetypeSecondary: ['scout'],
    tags: ['animal_handling'],
    description: 'Transform into a bat for 3 turns. Echolocation reveals hidden enemies/traps in a large radius. +20% dodge, attacks apply Sonic Screech (-15% accuracy). Can fly over ground hazards.',
    effects: [{ type: 'transform', form: 'bat', duration: 3, animalForm: true, dodgeBonus: 0.20, echolocation: true, onHitDebuff: 'sonic_screech' }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 15, aoeRadius: 0, cooldown: 5,
    statusEffect: 'animal_form_bat', statusDuration: 3,
    animalForm: 'bat',
    dodgeBonus: 0.20,
    revealHidden: true, revealRadius: 6,
    flyOver: true,
    onHitStatus: { name: 'sonic_screech', duration: 2, type: 'debuff', accuracyReduction: 0.15 },
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canFly: true,
      canFlyOverWater: true,
      canAccessHighLedges: true,
      canEcholocate: true,
      canHangFromCeiling: true,
    } },

  { cardId: 'wolf_form', name: 'Wolf Form', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['cc_dot'],
    tags: ['animal_handling'],
    description: 'Transform into a wolf for 4 turns. +20% damage, +25% speed. Pack Hunter: +10% damage per nearby ally (max +30%). Attacks apply Hamstring slow and Bite bleed DoT.',
    effects: [{ type: 'transform', form: 'wolf', duration: 4, animalForm: true, damageBonus: 0.20, speedBonus: 0.25, packHunter: true, hamstring: true, bleedOnHit: true }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 14, aoeRadius: 0, cooldown: 5,
    statusEffect: 'animal_form_wolf', statusDuration: 4,
    animalForm: 'wolf',
    damageBoost: 5, speedMult: 1.25,
    packHunterBonus: 0.10, packHunterMax: 0.30,
    onHitStatus: { name: 'hamstring', duration: 2, type: 'debuff', speedMult: 0.75 },
    bleedOnHit: { tickDamage: 3, duration: 2, name: 'bite_bleed' },
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canTrackScent: true,
      canDig: true,
      canHowl: true,
      canAnimalSpeak: ['wolf', 'dog', 'hound'],
    } },

  { cardId: 'bear_form', name: 'Bear Form', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'stamina', archetype: 'tank', archetypeSecondary: ['pure_defense'],
    tags: ['animal_handling'],
    description: 'Transform into a bear for 5 turns. +50% max HP, +30% armor, -20% speed. Maul: powerful AoE swipe. Thick Hide: -30% crit damage taken. Taunts nearby enemies on transform.',
    effects: [{ type: 'transform', form: 'bear', duration: 5, animalForm: true, hpBonus: 0.50, armorBonus: 0.30, speedPenalty: -0.20, maulAoe: true, thickHide: true, tauntOnTransform: true }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 20, aoeRadius: 0, cooldown: 7,
    statusEffect: 'animal_form_bear', statusDuration: 5,
    animalForm: 'bear',
    maxHpPercent: 0.50,
    armorBoost: 8,
    speedMult: 0.80,
    critDamageReduction: 0.30,
    tauntAoe: true,
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canBreakWalls: true,
      canForceOpenDoors: true,
      canPushBoulders: true,
      canSwim: true,
      canAnimalSpeak: ['bear'],
    } },

  { cardId: 'cat_form', name: 'Cat Form', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['melee_dps'],
    tags: ['animal_handling'],
    description: 'Transform into a cat for 4 turns. +30% crit chance, +20% speed, -15% max HP. Pounce: first attack stuns 1 turn. Attacks apply Rake bleed. Prowl: 50% stealth on kill.',
    effects: [{ type: 'transform', form: 'cat', duration: 4, animalForm: true, critBonus: 0.30, speedBonus: 0.20, hpPenalty: -0.15, pounce: true, rakeBleed: true, prowlOnKill: true }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 14, aoeRadius: 0, cooldown: 5,
    statusEffect: 'animal_form_cat', statusDuration: 4,
    animalForm: 'cat',
    critBonus: 0.30,
    speedMult: 1.20,
    maxHpPercent: -0.15,
    pounceStun: 1,
    bleedOnHit: { tickDamage: 4, duration: 3, name: 'rake_bleed' },
    prowlOnKill: 0.50,
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canFitSmallHoles: true,
      canClimbWalls: true,
      canLandSafely: true,
      canSneakPast: true,
      canAnimalSpeak: ['cat', 'lion', 'panther'],
    } },

  { cardId: 'hound_form', name: 'Hound Form', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'support', archetypeSecondary: ['tank'],
    tags: ['animal_handling'],
    description: 'Transform into a loyal hound for 4 turns. Loyal Companion: nearby allies gain +5% damage and +10% HP regen. Track Prey: reveal hidden enemies. Guard: 20% chance to intercept attacks on allies.',
    effects: [{ type: 'transform', form: 'hound', duration: 4, animalForm: true, loyalCompanion: true, trackPrey: true, guardAlly: true }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 10, aoeRadius: 0, cooldown: 4,
    statusEffect: 'animal_form_hound', statusDuration: 4,
    animalForm: 'hound',
    allyDamageAura: 0.05,
    allyHpRegenAura: 0.10,
    revealHidden: true,
    guardIntercept: 0.20,
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canTrackScent: true,
      canDig: true,
      canFetchItems: true,
      canAnimalSpeak: ['dog', 'wolf', 'hound'],
    } },

  { cardId: 'fish_form', name: 'Fish Form', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'aquatic', archetypeSecondary: ['scout'],
    tags: ['animal_handling'],
    description: 'Transform into a fish for 3 turns. Move through water tiles freely, +80% water speed. Slippery: +40% dodge in water, -50% damage on land. Water Breathing: immune to drowning.',
    effects: [{ type: 'transform', form: 'fish', duration: 3, animalForm: true, waterSpeed: 0.80, waterDodge: 0.40, landPenalty: -0.50, waterBreathing: true }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 8, aoeRadius: 0, cooldown: 4,
    statusEffect: 'animal_form_fish', statusDuration: 3,
    animalForm: 'fish',
    speedMult: 1.80,
    dodgeBonus: 0.40,
    waterBreathing: true,
    landDamagePenalty: -0.50,
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canSwimDeep: true,
      canBreathUnderwater: true,
      canAccessUnderwaterPaths: true,
      canAnimalSpeak: ['fish', 'aquatic'],
    } },

  { cardId: 'eagle_form', name: 'Eagle Form', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'focus', archetype: 'scout', archetypeSecondary: ['glass_cannon'],
    tags: ['animal_handling'],
    description: 'Transform into an eagle for 3 turns. Skyview: reveal entire map. Dive Bomb: +50% damage single-target with 1 turn stun. +30% speed, immune to ground hazards. Cannot be hit by melee (range <2).',
    effects: [{ type: 'transform', form: 'eagle', duration: 3, animalForm: true, skyview: true, diveBomb: true, speedBonus: 0.30, meleeImmune: true }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 22, aoeRadius: 0, cooldown: 7,
    statusEffect: 'animal_form_eagle', statusDuration: 3,
    animalForm: 'eagle',
    speedMult: 1.30,
    flyOver: true,
    revealAll: true,
    diveBombDamage: 0.50, diveBombStun: 1,
    meleeImmune: true,
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canFly: true,
      canFlyOverWater: true,
      canAccessHighLedges: true,
      canScoutAhead: true,
      canAnimalSpeak: ['bird', 'eagle', 'hawk'],
    } },

  { cardId: 'spider_form', name: 'Spider Form', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'assassin', archetypeSecondary: ['cc_dot'],
    tags: ['animal_handling'],
    description: 'Transform into a spider for 4 turns. Web Trap: place webs that root enemies 2 turns. Attacks apply Venom poison DoT. Wall Climb: ignore terrain. +20% attack speed, -10% HP.',
    effects: [{ type: 'transform', form: 'spider', duration: 4, animalForm: true, webTrap: true, venomOnHit: true, wallClimb: true, attackSpeedBonus: 0.20, hpPenalty: -0.10 }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 14, aoeRadius: 0, cooldown: 5,
    statusEffect: 'animal_form_spider', statusDuration: 4,
    animalForm: 'spider',
    speedMult: 1.20,
    maxHpPercent: -0.10,
    wallClimb: true,
    onHitStatus: { name: 'venom', duration: 3, type: 'debuff', tickDamage: 4 },
    webTrapRoot: 2,
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canCrawlUnderDoors: true,
      canClimbWalls: true,
      canAccessVents: true,
      canWebBridge: true,
      canAnimalSpeak: ['spider', 'insect'],
    } },

  { cardId: 'serpent_form', name: 'Serpent Form', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana', archetype: 'grappler', archetypeSecondary: ['assassin', 'cc_dot'],
    tags: ['animal_handling'],
    description: 'Transform into a serpent for 4 turns. Constrict: grapple enemy for 3 turns (immobile, takes damage). Venomous Bite: stacking poison DoT. +25% dodge, +15% speed. Shed Skin: cleanse all debuffs once.',
    effects: [{ type: 'transform', form: 'serpent', duration: 4, animalForm: true, constrict: true, stackingVenom: true, dodgeBonus: 0.25, speedBonus: 0.15, shedSkin: true }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 20, aoeRadius: 0, cooldown: 6,
    statusEffect: 'animal_form_serpent', statusDuration: 4,
    animalForm: 'serpent',
    dodgeBonus: 0.25,
    speedMult: 1.15,
    onHitStatus: { name: 'serpent_venom', duration: 3, type: 'debuff', tickDamage: 5, stacks: true },
    constrictDuration: 3, constrictDamage: 6,
    shedSkin: true,
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canFitSmallHoles: true,
      canSwim: true,
      canBurrow: true,
      canSenseHeat: true,
      canAnimalSpeak: ['snake', 'serpent', 'reptile'],
    } },

  { cardId: 'owl_form', name: 'Owl Form', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'night_hunter', archetypeSecondary: ['assassin'],
    tags: ['animal_handling'],
    description: 'Transform into an owl for 3 turns. Night Vision: see in darkness, reveal hidden. Silent Hunter: +40% damage from stealth. Wisdom: +20% XP while in form. +15% magic damage.',
    effects: [{ type: 'transform', form: 'owl', duration: 3, animalForm: true, nightVision: true, silentHunter: true, wisdomXp: 0.20, magicBonus: 0.15 }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 14, aoeRadius: 0, cooldown: 5,
    statusEffect: 'animal_form_owl', statusDuration: 3,
    animalForm: 'owl',
    revealHidden: true,
    nightVision: true,
    stealthDamageBonus: 0.40,
    xpBonus: 0.20,
    damageBoost: 3,
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canFly: true,
      canFlyOverWater: true,
      canSeeInDark: true,
      canScoutAhead: true,
      canAnimalSpeak: ['bird', 'owl'],
    } },

  { cardId: 'turtle_form', name: 'Turtle Form', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'pure_defense', archetypeSecondary: ['tank'],
    tags: ['animal_handling'],
    description: 'Transform into a turtle for 5 turns. Shell: +60% damage reduction but CANNOT attack or move. Withdraw: become nearly invulnerable (90% DR) for 1 turn. +5% HP regen per turn.',
    effects: [{ type: 'transform', form: 'turtle', duration: 5, animalForm: true, shellDR: 0.60, withdrawDR: 0.90, cantAttack: true, cantMove: true, hpRegenPercent: 0.05 }],
    icon: 'skills/Herbalism/',
    combatType: 'buff',
    range: 0, manaCost: 10, aoeRadius: 0, cooldown: 6,
    statusEffect: 'animal_form_turtle', statusDuration: 5,
    animalForm: 'turtle',
    damageReduction: 12,
    shellDR: 0.60,
    withdrawDR: 0.90,
    cantAttack: true, cantMove: true,
    hpRegenPercent: 0.05,
    damageType: 'nature',
    targetType: 'self',
    explorationAbilities: {
      canSwimDeep: true,
      canBreathUnderwater: true,
      canBlockPassage: true,
      canShellProtect: true,
      canAnimalSpeak: ['turtle', 'tortoise', 'reptile'],
    } },

  // === ANIMAL MORPHING PASSIVE CARDS ===

  { cardId: 'shapeshifters_mastery', name: "Shapeshifter's Mastery", type: 'passive_perk', rarity: 'legendary', archetype: 'utility',
    tags: ['animal_handling'],
    description: 'All animal form transformations last 2 extra turns. +10% to all form bonuses. Switching forms costs 50% less mana.',
    effects: [
      { type: 'animal_form_duration_bonus', value: 2, description: '+2 turns to all animal forms' },
      { type: 'animal_form_bonus_multiplier', value: 0.10, description: '+10% to all form stat bonuses' },
      { type: 'animal_form_mana_reduction', value: 0.50, description: '50% less mana to switch forms' },
    ],
    icon: 'skills/Herbalism/',
    combatPassive: { type: 'shapeshifters_mastery', formDurationBonus: 2, formBonusMult: 0.10, formManaReduction: 0.50 } },

  { cardId: 'primal_surge', name: 'Primal Surge', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility',
    tags: ['animal_handling'],
    description: 'When exiting any animal form, gain Primal Surge: +15% all stats for 2 turns. Reduces animal form cooldowns by 20%.',
    effects: [
      { type: 'on_form_expire_buff', statBonus: 0.15, duration: 2, description: '+15% all stats for 2 turns on form expiry' },
      { type: 'animal_form_cooldown_reduction', value: 0.20, description: '-20% cooldown on animal forms' },
    ],
    icon: 'skills/Herbalism/',
    combatPassive: { type: 'primal_surge', onFormExpireBuff: 0.15, onFormExpireDuration: 2, formCooldownReduction: 0.20 } },

  { cardId: 'natural_attunement', name: 'Natural Attunement', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['animal_handling'],
    description: 'While in any animal form, regenerate 2% HP per turn. Animal form abilities cost 15% less mana.',
    effects: [
      { type: 'animal_form_hp_regen', value: 0.02, description: '+2% HP regen/turn in animal form' },
      { type: 'animal_form_mana_reduction', value: 0.15, description: '-15% mana cost for animal forms' },
    ],
    icon: 'skills/Herbalism/',
    combatPassive: { type: 'natural_attunement', formHpRegen: 0.02, formManaReduction: 0.15 } },

  // ========================================================================
  // GRAPPLER ARCHETYPE (Wrestling / Martial Arts Grappling)
  // ========================================================================

  { cardId: 'grappler_iron_grip', name: 'Iron Grip', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina',
    tags: ['melee', 'cc', 'grappler'],
    archetype: 'grappler', skill: 'melee',
    description: 'Grab an enemy, preventing them from moving or attacking for 2 turns. You also cannot move during the hold. Melee range only.',
    effects: [{ type: 'crowd_control', ccType: 'grapple', duration: 2, selfImmobilize: true, description: 'Grapple: target and self immobilized for 2 turns' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'debuff',
    range: 1, manaCost: 6, aoeRadius: 0, cooldown: 4,
    scalingStat: 'might', scalingFactor: 0.0,
    statusEffect: 'grappled', statusDuration: 2,
    selfImmobilize: true, selfCantAttack: false,
    targetType: 'enemy' },

  { cardId: 'suplex', name: 'Suplex', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'utility',
    tags: ['melee', 'cc', 'grappler'],
    archetype: 'grappler', skill: 'melee',
    description: 'Grab and slam an adjacent enemy into the ground, dealing heavy physical damage and stunning them for 1 turn. Requires adjacent target.',
    effects: [{ type: 'damage', element: 'physical', base: 35, scaling: 'might', factor: 0.7, description: 'Slam for heavy damage + 1 turn stun' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 35,
    range: 1, manaCost: 10, aoeRadius: 0, cooldown: 4,
    scalingStat: 'might', scalingFactor: 0.7,
    onHitStatus: { name: 'stunned', duration: 1, type: 'debuff' },
    damageType: 'physical',
    targetType: 'enemy' },

  { cardId: 'submission_hold', name: 'Submission Hold', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'cc_dot',
    tags: ['melee', 'cc', 'grappler'],
    archetype: 'grappler', skill: 'melee',
    description: 'Lock an enemy in a crushing hold for 3 turns, dealing damage each turn. Neither you nor the enemy can act. Breaks if you take external damage.',
    effects: [{ type: 'crowd_control', ccType: 'submission', duration: 3, tickDamage: 12, selfImmobilize: true, breaksOnDamageToSelf: true, description: 'Submission: 12 damage/turn for 3 turns, both immobilized, breaks if you take damage' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'debuff',
    range: 1, manaCost: 12, aoeRadius: 0, cooldown: 5,
    scalingStat: 'might', scalingFactor: 0.4,
    statusEffect: 'submission_hold', statusDuration: 3,
    tickDamage: 12, selfImmobilize: true, selfCantAttack: true,
    breaksOnDamageToSelf: true,
    damageType: 'physical',
    targetType: 'enemy' },

  { cardId: 'body_slam', name: 'Body Slam', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'utility',
    tags: ['melee', 'grappler', 'tank'],
    archetype: 'grappler', skill: 'melee',
    description: 'Leap onto an adjacent enemy, dealing physical damage that scales with YOUR max HP. Small AoE shockwave on impact. Tank grappler synergy.',
    effects: [{ type: 'damage', element: 'physical', base: 10, scaling: 'vigor', factor: 0.8, description: 'Damage scales with max HP + small AoE' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 10,
    range: 1, manaCost: 8, aoeRadius: 1, cooldown: 3,
    scalingStat: 'vigor', scalingFactor: 0.8,
    hpScaling: true, hpScalingPercent: 0.08,
    damageType: 'physical',
    targetType: 'enemy' },

  { cardId: 'hip_toss', name: 'Hip Toss', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'utility',
    tags: ['melee', 'cc', 'grappler'],
    archetype: 'grappler', skill: 'melee',
    description: 'Throw an adjacent enemy 3 tiles away, dealing damage on landing. If they collide with a wall, deal bonus damage and stun for 1 turn.',
    effects: [{ type: 'damage', element: 'physical', base: 18, scaling: 'might', factor: 0.5, description: 'Throw 3 tiles; wall collision: +50% damage + stun' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 18,
    range: 1, manaCost: 6, aoeRadius: 0, cooldown: 3,
    scalingStat: 'might', scalingFactor: 0.5,
    throwDistance: 3, wallCollisionBonusDamage: 0.50,
    wallCollisionStatus: { name: 'stunned', duration: 1, type: 'debuff' },
    damageType: 'physical',
    targetType: 'enemy' },

  { cardId: 'german_suplex', name: 'German Suplex', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'stamina', archetype: 'utility',
    tags: ['melee', 'cc', 'grappler'],
    archetype: 'grappler', skill: 'melee',
    description: 'Devastating grab, flip, and slam. Massive single-target physical damage with a 2 turn stun. Long cooldown.',
    effects: [{ type: 'damage', element: 'physical', base: 55, scaling: 'might', factor: 0.9, description: 'Devastating slam: huge damage + 2 turn stun' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 55,
    range: 1, manaCost: 18, aoeRadius: 0, cooldown: 6,
    scalingStat: 'might', scalingFactor: 0.9,
    onHitStatus: { name: 'stunned', duration: 2, type: 'debuff' },
    damageType: 'physical',
    targetType: 'enemy' },

  { cardId: 'chokehold', name: 'Chokehold', type: 'active_ability', rarity: 'rare', resourceType: 'stamina', archetype: 'cc_dot',
    tags: ['melee', 'cc', 'grappler'],
    archetype: 'grappler', skill: 'melee',
    description: 'Lock an enemy in a chokehold, silencing them and dealing damage over 3 turns. Enemy cannot cast spells or use abilities but can still basic attack.',
    effects: [{ type: 'crowd_control', ccType: 'silence', duration: 3, tickDamage: 8, description: 'Silence + 8 damage/turn for 3 turns' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'debuff',
    range: 1, manaCost: 10, aoeRadius: 0, cooldown: 4,
    scalingStat: 'might', scalingFactor: 0.3,
    statusEffect: 'chokeholded', statusDuration: 3,
    tickDamage: 8,
    onHitStatus: { name: 'silenced', duration: 3, type: 'debuff' },
    damageType: 'physical',
    targetType: 'enemy' },

  { cardId: 'pile_driver', name: 'Pile Driver', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'stamina', archetype: 'utility',
    tags: ['melee', 'grappler'],
    archetype: 'grappler', skill: 'melee',
    description: 'Grab an enemy, leap into the air, and slam them headfirst into the ground. Highest grappler damage. AoE shockwave on landing damages nearby enemies.',
    effects: [{ type: 'damage', element: 'physical', base: 65, scaling: 'might', factor: 1.0, description: 'Massive slam + AoE shockwave to nearby enemies' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'damage', baseDamage: 65,
    range: 1, manaCost: 22, aoeRadius: 1, cooldown: 7,
    scalingStat: 'might', scalingFactor: 1.0,
    primaryTargetBonusDamage: 0.50,
    damageType: 'physical',
    targetType: 'enemy' },

  { cardId: 'bear_hug', name: 'Bear Hug', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility',
    tags: ['melee', 'grappler', 'tank'],
    archetype: 'grappler', skill: 'melee',
    description: 'When you grapple an enemy, deal 5% of your max HP as bonus physical damage each turn the grapple is held.',
    effects: [
      { type: 'grapple_tick_damage_hp_percent', value: 0.05, description: '+5% max HP as damage per turn while grappling' },
    ],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatPassive: { type: 'bear_hug', grappleTickDamageHpPercent: 0.05 } },

  { cardId: 'wrestlers_resilience', name: "Wrestler's Resilience", type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['melee', 'grappler', 'defense'],
    archetype: 'grappler', skill: 'melee',
    description: '+20% resistance to stuns and knockbacks. When grappled yourself, break free 30% faster.',
    effects: [
      { type: 'stun_resist', value: 0.20, description: '+20% stun resistance' },
      { type: 'knockback_resist', value: 0.20, description: '+20% knockback resistance' },
      { type: 'grapple_break_speed', value: 0.30, description: 'Break free from grapples 30% faster' },
    ],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'wrestlers_resilience', stunResist: 0.20, knockbackResist: 0.20, grappleBreakSpeed: 0.30 } },

  // ========================================================================
  // NIGHT HUNTER ARCHETYPE (Dark / Stealth Detection / Counter-Attack / Nocturnal Predator)
  // ========================================================================

  { cardId: 'night_hunter_mark', name: "Predator's Mark", type: 'active_ability', rarity: 'rare', resourceType: 'focus',
    tags: ['stealth', 'night_hunter', 'debuff'],
    archetype: 'night_hunter', skill: 'none',
    description: 'Mark a target for 5 turns. Marked targets cannot stealth, take 15% more damage from you, and you always know their position.',
    effects: [{ type: 'mark', duration: 5, antiStealth: true, damageAmp: 0.15, reveal: true, description: 'Mark: no stealth, +15% damage from you, position revealed for 5 turns' }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff',
    range: 6, manaCost: 10, aoeRadius: 0, cooldown: 4,
    statusEffect: 'predators_mark', statusDuration: 5,
    antiStealth: true, damageAmpFromCaster: 0.15, revealPosition: true,
    targetType: 'enemy' },

  { cardId: 'nocturnal_strike', name: 'Nocturnal Strike', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'utility',
    tags: ['melee', 'night_hunter'],
    archetype: 'night_hunter', skill: 'melee',
    description: 'A vicious attack that deals +40% bonus damage in darkness or at night. Applies the "exposed" debuff, reducing target armor.',
    effects: [{ type: 'damage', element: 'physical', base: 28, scaling: 'finesse', factor: 0.6, description: '+40% damage in darkness/night; applies exposed' }],
    icon: 'skills/Enchantment/',
    combatType: 'damage', baseDamage: 28,
    range: 1, manaCost: 8, aoeRadius: 0, cooldown: 3,
    scalingStat: 'finesse', scalingFactor: 0.6,
    nightDamageBonus: 0.40,
    onHitStatus: { name: 'exposed', duration: 3, armorReduction: 6, type: 'debuff' },
    damageType: 'physical',
    targetType: 'enemy' },

  { cardId: 'hunters_instinct', name: "Hunter's Instinct", type: 'passive_perk', rarity: 'uncommon', archetype: 'utility',
    tags: ['night_hunter', 'offense'],
    archetype: 'night_hunter', skill: 'none',
    description: '+15% damage against enemies that are debuffed. +10% crit chance against marked targets.',
    effects: [
      { type: 'damage_vs_debuffed', value: 0.15, description: '+15% damage vs debuffed enemies' },
      { type: 'crit_vs_marked', value: 0.10, description: '+10% crit vs marked targets' },
    ],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'hunters_instinct', damageVsDebuffed: 0.15, critVsMarked: 0.10 } },

  { cardId: 'moonlight_slash', name: 'Moonlight Slash', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'utility',
    tags: ['melee', 'night_hunter', 'holy'],
    archetype: 'night_hunter', skill: 'melee',
    description: 'A silver-element melee strike. Deals bonus damage against undead, werewolves, and shadow creatures. Reveals hidden enemies on hit.',
    effects: [{ type: 'damage', element: 'silver', base: 30, scaling: 'might', factor: 0.6, description: 'Silver strike; bonus vs undead/shadow; reveals hidden' }],
    icon: 'skills/Enchantment/',
    combatType: 'damage', element: 'silver', baseDamage: 30,
    range: 1, manaCost: 12, aoeRadius: 0, cooldown: 3,
    scalingStat: 'might', scalingFactor: 0.6,
    bonusVsUndead: 15, bonusVsShadow: 15,
    revealHidden: true,
    damageType: 'physical',
    targetType: 'enemy' },

  { cardId: 'trap_layer', name: 'Trap Layer', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'utility',
    tags: ['night_hunter', 'cc', 'utility'],
    archetype: 'night_hunter', skill: 'none',
    description: 'Place an invisible trap on a tile. When an enemy walks over it: root for 2 turns and reveal hidden/stealthed status.',
    effects: [{ type: 'tile', description: 'Invisible trap: root 2 turns + reveal on trigger' }],
    icon: 'skills/Enchantment/',
    combatType: 'tile_effect', tileEffect: 'HIDDEN_TRAP',
    range: 3, manaCost: 8, aoeRadius: 0, cooldown: 3,
    trapTriggerStatus: { name: 'rooted', duration: 2, type: 'debuff' },
    trapRevealsHidden: true, trapInvisible: true,
    targetType: 'any' },

  { cardId: 'shadow_sight', name: 'Shadow Sight', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['night_hunter', 'utility'],
    archetype: 'night_hunter', skill: 'none',
    description: 'See all hidden, invisible, and stealthed enemies at all times. Immune to blindness effects. +10% accuracy.',
    effects: [
      { type: 'true_sight', value: true, description: 'See all hidden/invisible/stealthed enemies' },
      { type: 'immunity', element: 'blindness', description: 'Immune to blindness' },
      { type: 'accuracy_bonus', value: 0.10, description: '+10% accuracy' },
    ],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'shadow_sight', trueSight: true, blindImmune: true, accuracyBonus: 0.10 } },

  { cardId: 'counterstrike_stance', name: 'Counterstrike Stance', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'stamina', archetype: 'utility',
    tags: ['night_hunter', 'melee', 'defense'],
    archetype: 'night_hunter', skill: 'melee',
    description: 'Enter a counter stance for 3 turns. When attacked in melee, automatically counter-attack for 50% of your normal damage.',
    effects: [{ type: 'buff', duration: 3, description: 'Counter stance: auto-counter melee attacks for 50% damage for 3 turns' }],
    icon: 'skills/Skill_SwordAttack.PNG',
    combatType: 'buff',
    range: 0, manaCost: 14, aoeRadius: 0, cooldown: 5,
    statusEffect: 'counterstrike_stance', statusDuration: 3,
    counterAttackPercent: 0.50, counterOnMelee: true,
    targetType: 'self' },

  { cardId: 'relentless_pursuit', name: 'Relentless Pursuit', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility',
    tags: ['night_hunter', 'offense'],
    archetype: 'night_hunter', skill: 'none',
    description: 'When an enemy tries to flee or disengage from you, gain a free attack of opportunity. +15% movement speed when chasing marked targets.',
    effects: [
      { type: 'attack_of_opportunity', onFlee: true, description: 'Free attack when enemy disengages' },
      { type: 'speed_bonus_vs_marked', value: 0.15, description: '+15% speed chasing marked targets' },
    ],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'relentless_pursuit', attackOnFlee: true, chaseSpeedVsMarked: 0.15 } },

  // ========================================================================
  // AQUATIC ARCHETYPE EXPANSION (Water / Ocean / Tidal Combat)
  // ========================================================================

  { cardId: 'depth_charge', name: 'Depth Charge', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon',
    tags: ['aquatic', 'magic'],
    archetype: 'aquatic', skill: 'none',
    description: 'Explosive water blast that deals AoE damage. Deals +100% bonus damage if the target is standing in water.',
    effects: [{ type: 'damage', element: 'water', base: 25, scaling: 'acumen', factor: 0.5, description: 'Water blast AoE; +100% damage vs targets in water' }],
    icon: 'skills/Skill_Explosion.PNG',
    combatType: 'damage', element: 'water', baseDamage: 25,
    range: 5, manaCost: 15, aoeRadius: 1, cooldown: 3,
    scalingStat: 'acumen', scalingFactor: 0.5,
    waterTileBonusDamage: 1.00,
    damageType: 'water',
    targetType: 'enemy' },

  { cardId: 'riptide', name: 'Riptide', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'cc_dot',
    tags: ['aquatic', 'cc'],
    archetype: 'aquatic', skill: 'none',
    description: 'Pull an enemy 2 tiles toward you through a surging water current. Applies slow for 2 turns.',
    effects: [{ type: 'crowd_control', ccType: 'pull', distance: 2, description: 'Pull 2 tiles + slow 2 turns' }],
    icon: 'skills/Enchantment/',
    combatType: 'debuff', element: 'water',
    range: 4, manaCost: 8, aoeRadius: 0, cooldown: 3,
    pullDistance: 2, pullToSelf: true,
    onHitStatus: { name: 'slowed', duration: 2, speedMult: 0.70, type: 'debuff' },
    targetType: 'enemy' },

  { cardId: 'aquatic_adaptation', name: 'Aquatic Adaptation', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['aquatic', 'utility'],
    archetype: 'aquatic', skill: 'none',
    description: '+30% to all stats while standing on water tiles. Can breathe underwater. +20% swim speed.',
    effects: [
      { type: 'water_tile_stat_bonus', value: 0.30, description: '+30% all stats on water tiles' },
      { type: 'water_breathing', value: true, description: 'Can breathe underwater' },
      { type: 'swim_speed_bonus', value: 0.20, description: '+20% swim speed' },
    ],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'aquatic_adaptation', waterTileStatBonus: 0.30, waterBreathing: true, swimSpeedBonus: 0.20 } },

  { cardId: 'kraken_tentacle', name: 'Kraken Tentacle', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'mana',
    tags: ['aquatic', 'cc', 'grappler'],
    archetype: 'aquatic', skill: 'none',
    description: 'Summon a massive tentacle that grabs an enemy from range, pulling them adjacent to you and dealing damage. Functions as a ranged grapple.',
    effects: [{ type: 'damage', element: 'water', base: 30, scaling: 'acumen', factor: 0.6, description: 'Ranged grab: pull to melee + damage' }],
    icon: 'skills/Enchantment/',
    combatType: 'damage', element: 'water', baseDamage: 30,
    range: 5, manaCost: 18, aoeRadius: 0, cooldown: 5,
    scalingStat: 'acumen', scalingFactor: 0.6,
    pullToSelf: true,
    onHitStatus: { name: 'grappled', duration: 1, type: 'debuff' },
    damageType: 'water',
    targetType: 'enemy' },

  { cardId: 'tidal_shield', name: 'Tidal Shield', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'tank',
    tags: ['aquatic', 'defense'],
    archetype: 'aquatic', skill: 'none',
    description: 'Conjure a swirling water barrier that absorbs damage. If you are standing in water, the shield absorbs twice as much.',
    effects: [{ type: 'shield', base: 30, scaling: 'resolve', factor: 0.4, description: 'Water shield; 2x absorption on water tiles' }],
    icon: 'skills/Skill_Defence.PNG',
    combatType: 'buff',
    range: 0, manaCost: 10, aoeRadius: 0, cooldown: 3,
    statusEffect: 'tidal_shield', statusDuration: 3,
    armorBoost: 6, shieldBase: 30,
    waterTileShieldMultiplier: 2.0,
    targetType: 'self' },

  // ========================================================================
  // PURE DEFENSE ARCHETYPE EXPANSION (Tank / Damage Mitigation / Sustain)
  // ========================================================================

  { cardId: 'absolute_guard', name: 'Absolute Guard', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'stamina',
    tags: ['defense', 'pure_defense'],
    archetype: 'pure_defense', skill: 'none',
    description: 'Block ALL incoming damage for 1 turn, but you cannot move or attack during it. Shorter cooldown than divine shield.',
    effects: [{ type: 'invulnerability', duration: 1, description: 'Block all damage for 1 turn; cannot move or attack' }],
    icon: 'skills/Skill_Defence.PNG',
    combatType: 'buff',
    range: 0, manaCost: 15, aoeRadius: 0, cooldown: 5,
    statusEffect: 'absolute_guard', statusDuration: 1,
    invulnerable: true, cantAttack: true, cantMove: true,
    targetType: 'self' },

  { cardId: 'fortify', name: 'Fortify', type: 'active_ability', rarity: 'uncommon', resourceType: 'stamina', archetype: 'utility',
    tags: ['defense', 'pure_defense'],
    archetype: 'pure_defense', skill: 'none',
    description: '+30% armor for 4 turns. If you do not move during the buff, the bonus increases to +50% instead.',
    effects: [{ type: 'buff', duration: 4, description: '+30% armor (50% if stationary) for 4 turns' }],
    icon: 'skills/Skill_Defence.PNG',
    combatType: 'buff',
    range: 0, manaCost: 8, aoeRadius: 0, cooldown: 4,
    statusEffect: 'fortified', statusDuration: 4,
    armorBoostPercent: 0.30, stationaryArmorBoostPercent: 0.50,
    targetType: 'self' },

  { cardId: 'damage_sponge', name: 'Damage Sponge', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    tags: ['defense', 'pure_defense', 'tank'],
    archetype: 'pure_defense', skill: 'none',
    description: '+15% max HP. Damage you take is reduced by 1% for each 10% of max HP you are missing.',
    effects: [
      { type: 'hp_bonus_percent', value: 0.15, description: '+15% max HP' },
      { type: 'low_hp_damage_reduction', perTenPercent: 0.01, description: '-1% damage taken per 10% HP missing' },
    ],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'damage_sponge', hpBonusPercent: 0.15, lowHpDamageReduction: 0.01 } },

  { cardId: 'resilient_body', name: 'Resilient Body', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility',
    tags: ['defense', 'pure_defense'],
    archetype: 'pure_defense', skill: 'none',
    description: 'Regenerate 2% of max HP per turn. Regeneration is doubled when below 30% HP.',
    effects: [
      { type: 'hp_regen_percent', value: 0.02, description: '+2% max HP regen per turn' },
      { type: 'low_hp_regen_multiplier', threshold: 0.30, multiplier: 2.0, description: '2x regen below 30% HP' },
    ],
    icon: 'skills/Skill_Defence.PNG',
    combatPassive: { type: 'resilient_body', hpRegenPercent: 0.02, lowHpThreshold: 0.30, lowHpRegenMult: 2.0 } },

  // ========================================================================
  // SCOUT ARCHETYPE EXPANSION (Mobility / Escape / Stealth)
  // ========================================================================

  { cardId: 'shadow_dash', name: 'Shadow Dash', type: 'active_ability', rarity: 'uncommon', resourceType: 'focus', archetype: 'scout',
    tags: ['stealth', 'scout', 'movement'],
    archetype: 'scout', skill: 'none',
    description: 'Dash 4 tiles in any direction, passing through enemies. Become stealthed for 1 turn after the dash.',
    effects: [{ type: 'movement', distance: 4, passThroughEnemies: true, description: 'Dash 4 tiles through enemies + 1 turn stealth' }],
    icon: 'skills/Enchantment/',
    combatType: 'movement',
    range: 4, manaCost: 6, aoeRadius: 0, cooldown: 3,
    dashDistance: 4, passThroughEnemies: true,
    onUseStatus: { name: 'stealthed', duration: 1, type: 'buff' },
    targetType: 'any' },

  { cardId: 'escape_artist', name: 'Escape Artist', type: 'passive_perk', rarity: 'rare', archetype: 'assassin',
    tags: ['stealth', 'scout', 'defense'],
    archetype: 'scout', skill: 'none',
    description: 'Automatically break free from roots, grabs, and grapples after 1 turn instead of full duration. +20% dodge while fleeing.',
    effects: [
      { type: 'cc_break_early', ccTypes: ['root', 'grapple', 'grab'], maxDuration: 1, description: 'Break roots/grabs/grapples after 1 turn' },
      { type: 'dodge_bonus_fleeing', value: 0.20, description: '+20% dodge while fleeing' },
    ],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'escape_artist', ccBreakMaxDuration: 1, ccBreakTypes: ['root', 'grapple', 'grab'], dodgeBonusFleeing: 0.20 } },

  { cardId: 'smoke_and_mirrors', name: 'Smoke and Mirrors', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'scout',
    tags: ['stealth', 'scout', 'utility'],
    archetype: 'scout', skill: 'none',
    description: 'Leave a decoy at your current position, then teleport 5 tiles away and enter stealth. The decoy has 1 HP and draws enemy aggro.',
    effects: [{ type: 'teleport', range: 5, description: 'Teleport 5 tiles + leave 1 HP decoy + enter stealth' }],
    icon: 'skills/Enchantment/',
    combatType: 'movement',
    range: 5, manaCost: 14, aoeRadius: 0, cooldown: 5,
    teleportDistance: 5,
    summonDecoy: true, decoyHp: 1, decoyDrawsAggro: true,
    onUseStatus: { name: 'stealthed', duration: 2, type: 'buff' },
    targetType: 'any' },

  // ── Vision Cards (unique only — thermal_goggles, tremor_boots, night_eye_elixir, all_seeing_eye, hunters_visor defined at line ~1027) ──
  { cardId: 'echolocation_charm', name: 'Echolocation Charm', type: 'passive_perk', rarity: 'rare', archetype: 'night_hunter', skill: 'none',
    description: 'A charm pulsing with sonic energy. Emit sonar waves that reveal everything — living, dead, and hidden.',
    effects: [{ type: 'grants_vision', value: 'echolocation' }],
    tags: ['vision', 'equipment'],
    icon: 'skills/Enchantment/' },

  { cardId: 'sonar_pulse', name: 'Sonar Pulse', type: 'active_ability', rarity: 'rare', resourceType: 'focus', archetype: 'night_hunter',
    description: 'Emit a powerful sonar blast. Reveals all hidden entities in a large radius and briefly stuns detected invisible enemies.',
    effects: [{ type: 'reveal_all', value: 8 }, { type: 'stun_invisible', value: 1 }],
    tags: ['vision', 'active', 'sonic'],
    icon: 'skills/Enchantment/',
    combatType: 'buff', targetType: 'self', manaCost: 15, cooldown: 20, damageType: 'sonic' },

  { cardId: 'echolocation_passive', name: 'Echolocation Mastery', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'night_hunter',
    description: 'Your senses are permanently attuned to sound waves. Automatically detect all entities within 3 tiles, even through walls.',
    effects: [{ type: 'grants_vision', value: 'echolocation' }, { type: 'passive_tremor_range', value: 3 }],
    tags: ['vision', 'passive'],
    icon: 'skills/Enchantment/',
    combatPassive: { type: 'echolocation_mastery', tremorRange: 3, grantsVision: 'echolocation' } },

  // ── Magic Sight Cards ──
  { cardId: 'arcane_monocle', name: 'Arcane Monocle', type: 'passive_perk', rarity: 'rare', archetype: 'utility', skill: 'enchanting',
    description: 'An enchanted lens that reveals magical auras, curses, and hidden enchantments.',
    effects: [{ type: 'grants_vision', value: 'magic_sense' }],
    tags: ['vision', 'magic', 'equipment'],
    icon: 'skills/Enchantment/' },

  { cardId: 'true_seeing_eye', name: 'True Seeing Eye', type: 'passive_perk', rarity: 'legendary', archetype: 'utility', skill: 'enchanting',
    description: 'The Third Eye of Verithas. Pierces all illusions and reveals the true nature of all things.',
    effects: [{ type: 'grants_vision', value: 'true_seeing' }],
    tags: ['vision', 'magic', 'artifact'],
    icon: 'skills/Enchantment/' },

  { cardId: 'detect_magic', name: 'Detect Magic', type: 'active_ability', rarity: 'uncommon', resourceType: 'mana', archetype: 'utility', skill: 'enchanting',
    description: 'Channel arcane energy to sense nearby magical objects and auras for a short duration.',
    effects: [{ type: 'grants_vision', value: 'magic_sense' }, { type: 'buff_duration', value: 5 }],
    tags: ['vision', 'magic', 'active'],
    icon: 'skills/Enchantment/',
    combatType: 'buff', targetType: 'self', manaCost: 10, cooldown: 15 },

  { cardId: 'dispel_sight', name: 'Dispel Sight', type: 'active_ability', rarity: 'rare', resourceType: 'mana', archetype: 'glass_cannon', skill: 'enchanting',
    description: 'A focused magical perception that not only reveals but disrupts magical concealment.',
    effects: [{ type: 'reveal_magic', value: true }, { type: 'remove_buffs', value: 2 }],
    tags: ['vision', 'magic', 'active'],
    icon: 'skills/Enchantment/',
    combatType: 'debuff_aoe', targetType: 'all_enemies', manaCost: 20, cooldown: 25 },

  // ── Resource Attunement Cards (rare drops, expand secondary resource pools) ──
  { cardId: 'mana_attunement', name: 'Mana Attunement', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['magic'],
    description: 'Attune to arcane energies. +25% mana pool, +1 mana regen, -10% mana ability costs',
    effects: [{ type: 'resource_attunement', resource: 'mana', value: 0.25 }, { type: 'resource_regen_bonus', resource: 'mana', value: 1 }, { type: 'resource_cost_reduction', resource: 'mana', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'stamina_attunement', name: 'Stamina Attunement', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    description: 'Condition your body for greater endurance. +25% stamina pool, +1 stamina regen, -10% stamina ability costs',
    effects: [{ type: 'resource_attunement', resource: 'stamina', value: 0.25 }, { type: 'resource_regen_bonus', resource: 'stamina', value: 1 }, { type: 'resource_cost_reduction', resource: 'stamina', value: 0.10 }], icon: 'skills/Enchantment/' },
  { cardId: 'bloodlust_attunement', name: 'Bloodlust Attunement', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['stealth'],
    description: 'Embrace predatory instincts. +25% bloodlust pool, +1 bloodlust on hit, halved decay',
    effects: [{ type: 'resource_attunement', resource: 'bloodlust', value: 0.25 }, { type: 'resource_on_hit_bonus', resource: 'bloodlust', value: 1 }, { type: 'resource_decay_reduction', resource: 'bloodlust', value: 0.50 }], icon: 'skills/Enchantment/' },
  { cardId: 'focus_attunement', name: 'Focus Attunement', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    description: 'Sharpen your concentration. +25% focus pool, +3 focus per consecutive action, retain 15% more on switch',
    effects: [{ type: 'resource_attunement', resource: 'focus', value: 0.25 }, { type: 'resource_consecutive_bonus', resource: 'focus', value: 3 }, { type: 'resource_retain_bonus', resource: 'focus', value: 0.15 }], icon: 'skills/Enchantment/' },

  // ── Resource Pool Enhancement Passives ──
  // Mana pool passives
  { cardId: 'arcane_reservoir', name: 'Arcane Reservoir', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', tags: ['magic'],
    description: '+10 max mana and +1 mana regen per turn',
    effects: [{ type: 'resource_max_bonus', resource: 'mana', value: 10 }, { type: 'resource_regen_bonus', resource: 'mana', value: 1 }],
    icon: 'skills/Enchantment/' },
  { cardId: 'deep_mana_well', name: 'Deep Mana Well', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['magic'],
    description: '+20 max mana. Start combat with full mana',
    effects: [{ type: 'resource_max_bonus', resource: 'mana', value: 20 }, { type: 'resource_start_full', resource: 'mana', value: true }],
    icon: 'skills/Enchantment/' },

  // Stamina pool passives
  { cardId: 'iron_lungs', name: 'Iron Lungs', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility',
    description: '+10 max stamina and +1 stamina regen per turn',
    effects: [{ type: 'resource_max_bonus', resource: 'stamina', value: 10 }, { type: 'resource_regen_bonus', resource: 'stamina', value: 1 }],
    icon: 'skills/Blacksmith/' },
  { cardId: 'tireless', name: 'Tireless', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    description: '+20 max stamina. Stamina regen doubled when below 25%',
    effects: [{ type: 'resource_max_bonus', resource: 'stamina', value: 20 }, { type: 'resource_low_regen_mult', resource: 'stamina', threshold: 0.25, value: 2.0 }],
    icon: 'skills/Blacksmith/' },

  // Bloodlust pool passives
  { cardId: 'blood_frenzy', name: 'Blood Frenzy', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility', tags: ['stealth'],
    description: '+10 max bloodlust and +5 bloodlust on kill (stacks with base)',
    effects: [{ type: 'resource_max_bonus', resource: 'bloodlust', value: 10 }, { type: 'resource_on_kill_bonus', resource: 'bloodlust', value: 5 }],
    icon: 'skills/Enchantment/' },
  { cardId: 'predatory_surge', name: 'Predatory Surge', type: 'passive_perk', rarity: 'rare', archetype: 'utility', tags: ['stealth'],
    description: '+20 max bloodlust. Bloodlust decay reduced by 50%',
    effects: [{ type: 'resource_max_bonus', resource: 'bloodlust', value: 20 }, { type: 'resource_decay_reduction', resource: 'bloodlust', value: 0.50 }],
    icon: 'skills/Enchantment/' },

  // Focus pool passives
  { cardId: 'deep_concentration', name: 'Deep Concentration', type: 'passive_perk', rarity: 'uncommon', archetype: 'utility',
    description: '+10 max focus and +3 focus per consecutive action (stacks with base)',
    effects: [{ type: 'resource_max_bonus', resource: 'focus', value: 10 }, { type: 'resource_consecutive_bonus', resource: 'focus', value: 3 }],
    icon: 'skills/Enchantment/' },
  { cardId: 'unwavering_mind', name: 'Unwavering Mind', type: 'passive_perk', rarity: 'rare', archetype: 'utility',
    description: '+20 max focus. Focus does not reset when switching targets (retains 50%)',
    effects: [{ type: 'resource_max_bonus', resource: 'focus', value: 20 }, { type: 'resource_retain_on_switch', resource: 'focus', value: 0.50 }],
    icon: 'skills/Enchantment/' },

  // Cross-resource passive
  { cardId: 'resource_harmony', name: 'Resource Harmony', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'utility',
    description: '+10 max to ALL resource pools. When any resource is depleted, gain +2 regen to lowest resource for 3 turns',
    effects: [{ type: 'resource_max_bonus_all', value: 10 }, { type: 'resource_harmony_regen', value: 2, duration: 3 }],
    icon: 'skills/Enchantment/' },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARCHETYPE GAP FILL — Common through Relic for all 12 archetypes
  // ═══════════════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────────────────────
  // SUPPORT — was missing all commons
  // ──────────────────────────────────────────────────────────────────────────
  { cardId: 'bandage_wrap', name: 'Bandage Wrap', type: 'passive_perk', rarity: 'common', archetype: 'support', tags: ['magic'],
    description: '+5% healing done to allies',
    effects: [{ type: 'heal_power_bonus', value: 0.05 }], icon: 'skills/Skill_Heal.PNG' },
  { cardId: 'encouraging_word', name: 'Encouraging Word', type: 'passive_perk', rarity: 'common', archetype: 'support',
    description: '+3% buff duration you apply to allies',
    effects: [{ type: 'buff_duration_bonus', value: 0.03 }], icon: 'skills/Skill_Heal.PNG' },
  { cardId: 'herbal_poultice', name: 'Herbal Poultice', type: 'passive_perk', rarity: 'common', archetype: 'support', tags: ['magic'],
    description: '+2 HP regen to nearby allies in combat',
    effects: [{ type: 'aura_hp_regen', value: 2, range: 2 }], icon: 'skills/Skill_Heal.PNG' },
  { cardId: 'menders_touch', name: "Mender's Touch", type: 'passive_perk', rarity: 'common', archetype: 'support', tags: ['magic'],
    description: '+10% Healing XP',
    effects: [{ type: 'xp_bonus_skill', skill: 'life_magic', value: 0.10 }], icon: 'skills/Skill_Heal.PNG' },
  // support godly
  { cardId: 'avatar_of_mercy', name: 'Avatar of Mercy', type: 'passive_perk', rarity: 'godly', archetype: 'support', archetypeSecondary: ['pure_defense'], tags: ['magic'],
    description: 'Healing spells are 40% stronger. When an ally would die, automatically heal them for 25% max HP once per floor',
    effects: [{ type: 'heal_power_bonus', value: 0.40 }, { type: 'death_save_ally', hpPercent: 0.25, cooldownFloor: 1 }], icon: 'skills/Skill_Heal.PNG' },
  // support relic
  { cardId: 'tear_of_the_goddess', name: 'Tear of the Goddess', type: 'passive_perk', rarity: 'relic', archetype: 'support', tags: ['magic'],
    description: 'All healing is doubled. Overhealing becomes a shield (up to 30% max HP). Revive allies at 75% HP instead of 50%',
    effects: [{ type: 'heal_power_bonus', value: 1.00 }, { type: 'overheal_shield', maxPercent: 0.30 }, { type: 'revive_hp_bonus', value: 0.75 }], icon: 'skills/Skill_Heal.PNG' },

  // ──────────────────────────────────────────────────────────────────────────
  // TANK — was missing commons, mythic_rare, godly, relic
  // ──────────────────────────────────────────────────────────────────────────
  { cardId: 'iron_skin', name: 'Iron Skin', type: 'passive_perk', rarity: 'common', archetype: 'tank',
    description: '+3 armor',
    effects: [{ type: 'armor_bonus', value: 3 }], icon: 'skills/Blacksmith/' },
  { cardId: 'sturdy_constitution', name: 'Sturdy Constitution', type: 'passive_perk', rarity: 'common', archetype: 'tank',
    description: '+15 max HP',
    effects: [{ type: 'hp_bonus', value: 15 }], icon: 'skills/Blacksmith/' },
  { cardId: 'shield_bearers_stance', name: "Shield Bearer's Stance", type: 'passive_perk', rarity: 'common', archetype: 'tank',
    description: '+5% block chance',
    effects: [{ type: 'block_chance', value: 0.05 }], icon: 'skills/Blacksmith/' },
  { cardId: 'defenders_resolve', name: "Defender's Resolve", type: 'passive_perk', rarity: 'common', archetype: 'tank',
    description: '+3% damage reduction',
    effects: [{ type: 'damage_reduction', value: 0.03 }], icon: 'skills/Blacksmith/' },
  // tank mythic_rare
  { cardId: 'fortress_incarnate', name: 'Fortress Incarnate', type: 'passive_perk', rarity: 'mythic_rare', archetype: 'tank', archetypeSecondary: ['pure_defense'], tags: ['combat'],
    description: '+50 armor. +30% max HP. Taunt all enemies within 3 tiles at combat start. Block chance +15%',
    effects: [{ type: 'armor_bonus', value: 50 }, { type: 'hp_bonus_percent', value: 0.30 }, { type: 'auto_taunt', range: 3 }, { type: 'block_chance', value: 0.15 }], icon: 'skills/Blacksmith/' },
  // tank godly
  { cardId: 'wall_of_the_ancients', name: 'Wall of the Ancients', type: 'passive_perk', rarity: 'godly', archetype: 'tank', tags: ['combat'],
    description: 'Absorb 25% of all damage dealt to allies within 3 tiles. +60 armor. Immune to stun and knockback',
    effects: [{ type: 'redirect_ally_damage', percent: 0.25, range: 3 }, { type: 'armor_bonus', value: 60 }, { type: 'immunity', conditions: ['stun', 'knockback'] }], icon: 'skills/Blacksmith/' },
  // tank relic
  { cardId: 'aegis_of_eternity', name: 'Aegis of Eternity', type: 'passive_perk', rarity: 'relic', archetype: 'tank', tags: ['combat'],
    description: 'Cannot be reduced below 1 HP more than once per 30s. Reflect 20% of blocked damage. +100 armor. All allies in range gain +10 armor',
    effects: [{ type: 'undying', cooldown: 30 }, { type: 'block_reflect', value: 0.20 }, { type: 'armor_bonus', value: 100 }, { type: 'aura_armor', value: 10, range: 3 }], icon: 'skills/Blacksmith/' },

  // ──────────────────────────────────────────────────────────────────────────
  // MELEE_DPS — was missing commons, godly, relic
  // ──────────────────────────────────────────────────────────────────────────
  { cardId: 'sharp_edge', name: 'Sharp Edge', type: 'passive_perk', rarity: 'common', archetype: 'melee_dps', tags: ['combat'],
    description: '+3% melee damage',
    effects: [{ type: 'melee_damage_bonus', value: 0.03 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'quick_reflexes', name: 'Quick Reflexes', type: 'passive_perk', rarity: 'common', archetype: 'melee_dps', tags: ['combat'],
    description: '+2% attack speed',
    effects: [{ type: 'attack_speed_bonus', value: 0.02 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'warriors_grit', name: "Warrior's Grit", type: 'passive_perk', rarity: 'common', archetype: 'melee_dps', tags: ['combat'],
    description: '+2% crit chance',
    effects: [{ type: 'crit_chance_bonus', value: 0.02 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'combat_training', name: 'Combat Training', type: 'passive_perk', rarity: 'common', archetype: 'melee_dps',
    description: '+10% Melee XP',
    effects: [{ type: 'xp_bonus_skill', skill: 'melee', value: 0.10 }], icon: 'skills/Skill_SwordAttack.PNG' },
  // melee_dps godly
  { cardId: 'warbringer', name: 'Warbringer', type: 'passive_perk', rarity: 'godly', archetype: 'melee_dps', archetypeSecondary: ['tank'], tags: ['combat'],
    description: '+35% melee damage. +20% attack speed. Kills extend all buffs by 1 turn. +15% lifesteal on critical hits',
    effects: [{ type: 'melee_damage_bonus', value: 0.35 }, { type: 'attack_speed_bonus', value: 0.20 }, { type: 'kill_extends_buffs', value: 1 }, { type: 'crit_lifesteal', value: 0.15 }], icon: 'skills/Skill_SwordAttack.PNG' },
  // melee_dps relic
  { cardId: 'blade_of_the_conqueror', name: 'Blade of the Conqueror', type: 'passive_perk', rarity: 'relic', archetype: 'melee_dps', tags: ['combat'],
    description: '+50% melee damage. +25% crit chance. Critical hits deal triple damage instead of double. +10% of damage dealt heals you',
    effects: [{ type: 'melee_damage_bonus', value: 0.50 }, { type: 'crit_chance_bonus', value: 0.25 }, { type: 'crit_multiplier_bonus', value: 1.0 }, { type: 'lifesteal', value: 0.10 }], icon: 'skills/Skill_SwordAttack.PNG' },

  // ──────────────────────────────────────────────────────────────────────────
  // GLASS_CANNON — was missing mythic+ (only had meteor), missing godly/relic
  // ──────────────────────────────────────────────────────────────────────────
  // glass_cannon additional commons (had only 1)
  { cardId: 'spark_of_power', name: 'Spark of Power', type: 'passive_perk', rarity: 'common', archetype: 'glass_cannon', tags: ['magic'],
    description: '+3% spell damage',
    effects: [{ type: 'spell_damage_bonus', value: 0.03 }], icon: 'skills/Enchantment/' },
  { cardId: 'volatile_mana', name: 'Volatile Mana', type: 'passive_perk', rarity: 'common', archetype: 'glass_cannon', tags: ['magic'],
    description: '+5 max mana',
    effects: [{ type: 'resource_max_bonus', resource: 'mana', value: 5 }], icon: 'skills/Enchantment/' },
  // glass_cannon godly
  { cardId: 'archmages_ascension', name: "Archmage's Ascension", type: 'passive_perk', rarity: 'godly', archetype: 'glass_cannon', tags: ['magic'],
    description: '+45% spell damage. Spells have 15% chance to cost no mana. +20% crit chance on spells. Spell kills restore 10% max mana',
    effects: [{ type: 'spell_damage_bonus', value: 0.45 }, { type: 'free_cast_chance', value: 0.15 }, { type: 'spell_crit_bonus', value: 0.20 }, { type: 'kill_mana_restore', value: 0.10 }], icon: 'skills/Enchantment/' },
  // glass_cannon relic
  { cardId: 'staff_of_annihilation', name: 'Staff of Annihilation', type: 'passive_perk', rarity: 'relic', archetype: 'glass_cannon', tags: ['magic', 'combat'],
    description: '+60% spell damage. All spells pierce magic resistance by 50%. AoE spells hit +1 radius. 10% chance spells cast twice',
    effects: [{ type: 'spell_damage_bonus', value: 0.60 }, { type: 'magic_pen', value: 0.50 }, { type: 'aoe_radius_bonus', value: 1 }, { type: 'spell_echo_chance', value: 0.10 }], icon: 'skills/Enchantment/' },

  // ──────────────────────────────────────────────────────────────────────────
  // CC_DOT — was missing commons, had only 1 legendary, nothing above
  // ──────────────────────────────────────────────────────────────────────────
  { cardId: 'stinging_touch', name: 'Stinging Touch', type: 'passive_perk', rarity: 'common', archetype: 'cc_dot', tags: ['magic'],
    description: '+3% DoT damage',
    effects: [{ type: 'dot_damage_bonus', value: 0.03 }], icon: 'skills/Enchantment/' },
  { cardId: 'numbing_agent', name: 'Numbing Agent', type: 'passive_perk', rarity: 'common', archetype: 'cc_dot', tags: ['magic'],
    description: '+5% slow potency on crowd control effects',
    effects: [{ type: 'cc_potency_bonus', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'lingering_pain', name: 'Lingering Pain', type: 'passive_perk', rarity: 'common', archetype: 'cc_dot',
    description: 'DoT effects last 1 extra tick',
    effects: [{ type: 'dot_duration_bonus', value: 1 }], icon: 'skills/Enchantment/' },
  { cardId: 'weakening_strikes', name: 'Weakening Strikes', type: 'passive_perk', rarity: 'common', archetype: 'cc_dot', tags: ['combat'],
    description: 'Attacks have 5% chance to apply a minor slow',
    effects: [{ type: 'on_hit_slow_chance', value: 0.05, duration: 2 }], icon: 'skills/Enchantment/' },
  // cc_dot legendary (supplement the lone mass_dispel)
  { cardId: 'plague_bearer', name: 'Plague Bearer', type: 'passive_perk', rarity: 'legendary', archetype: 'cc_dot', tags: ['magic', 'combat'],
    description: 'DoT effects spread to nearby enemies on tick (25% damage). +30% DoT damage. Enemies that die to DoT explode for 15% max HP AoE',
    effects: [{ type: 'dot_spread', spreadDamage: 0.25, range: 2 }, { type: 'dot_damage_bonus', value: 0.30 }, { type: 'dot_kill_explode', value: 0.15 }], icon: 'skills/Enchantment/' },
  { cardId: 'temporal_chains', name: 'Temporal Chains', type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'cc_dot', tags: ['magic', 'combat'],
    description: 'Bind enemies in temporal energy. All enemies in AoE are slowed 50% and take 15 arcane damage per turn for 4 turns',
    effects: [{ type: 'damage', element: 'arcane', base: 15, dot: true, duration: 4 }, { type: 'slow', value: 0.50, duration: 4 }],
    combatType: 'damage', targetType: 'all_enemies', manaCost: 30, cooldown: 6, aoeRadius: 2, scalingStat: 'acumen', scalingFactor: 0.6, icon: 'skills/Enchantment/' },
  // cc_dot mythic_rare
  { cardId: 'entropy_weaver', name: 'Entropy Weaver', type: 'passive_perk', rarity: 'mythic_rare', archetype: 'cc_dot', archetypeSecondary: ['glass_cannon'], tags: ['magic', 'combat'],
    description: '+40% DoT damage. CC effects last 50% longer. Enemies under 3+ debuffs take 20% more damage from all sources',
    effects: [{ type: 'dot_damage_bonus', value: 0.40 }, { type: 'cc_duration_bonus', value: 0.50 }, { type: 'debuff_vulnerability', threshold: 3, bonus: 0.20 }], icon: 'skills/Enchantment/' },
  // cc_dot godly
  { cardId: 'hand_of_decay', name: 'Hand of Decay', type: 'passive_perk', rarity: 'godly', archetype: 'cc_dot', tags: ['magic', 'combat'],
    description: 'All damage you deal applies a stacking decay (2% max HP/turn, stacks 10x). CC-ed enemies cannot heal. +50% DoT damage',
    effects: [{ type: 'on_hit_decay', damagePercent: 0.02, maxStacks: 10 }, { type: 'cc_anti_heal', value: true }, { type: 'dot_damage_bonus', value: 0.50 }], icon: 'skills/Enchantment/' },
  // cc_dot relic
  { cardId: 'pandoras_blight', name: "Pandora's Blight", type: 'passive_perk', rarity: 'relic', archetype: 'cc_dot', tags: ['magic', 'combat'],
    description: 'All DoTs deal 75% more damage. Enemies that die to your effects cannot be revived. On kill, all your DoTs refresh duration. Immune to your own DoT effects',
    effects: [{ type: 'dot_damage_bonus', value: 0.75 }, { type: 'kill_prevents_revive', value: true }, { type: 'kill_refreshes_dots', value: true }, { type: 'self_dot_immunity', value: true }], icon: 'skills/Enchantment/' },

  // ──────────────────────────────────────────────────────────────────────────
  // PURE_DEFENSE — was missing commons (had 2), mythic_rare, godly, relic
  // ──────────────────────────────────────────────────────────────────────────
  // pure_defense additional commons
  { cardId: 'padded_armor', name: 'Padded Armor', type: 'passive_perk', rarity: 'common', archetype: 'pure_defense',
    description: '+5% physical damage reduction',
    effects: [{ type: 'physical_damage_reduction', value: 0.05 }], icon: 'skills/Blacksmith/' },
  { cardId: 'resilient_spirit', name: 'Resilient Spirit', type: 'passive_perk', rarity: 'common', archetype: 'pure_defense', tags: ['magic'],
    description: '+3% magic resistance',
    effects: [{ type: 'magic_resist_bonus', value: 0.03 }], icon: 'skills/Enchantment/' },
  // pure_defense mythic_rare
  { cardId: 'unbreakable', name: 'Unbreakable', type: 'passive_perk', rarity: 'mythic_rare', archetype: 'pure_defense', archetypeSecondary: ['tank'], tags: ['combat'],
    description: 'Damage reduction capped at 75% instead of 50%. +40 armor. Cannot be one-shot (damage capped at 80% current HP)',
    effects: [{ type: 'damage_reduction_cap', value: 0.75 }, { type: 'armor_bonus', value: 40 }, { type: 'one_shot_protection', maxPercent: 0.80 }], icon: 'skills/Blacksmith/' },
  // pure_defense godly
  { cardId: 'divine_bulwark', name: 'Divine Bulwark', type: 'passive_perk', rarity: 'godly', archetype: 'pure_defense', archetypeSecondary: ['support'], tags: ['combat'],
    description: '30% of damage taken is converted to healing over 5s. +50 armor. Allies within 2 tiles gain 15% of your armor. Immune to armor-shred effects',
    effects: [{ type: 'damage_to_heal', value: 0.30, duration: 5 }, { type: 'armor_bonus', value: 50 }, { type: 'aura_armor_percent', value: 0.15, range: 2 }, { type: 'immunity', conditions: ['armor_shred'] }], icon: 'skills/Blacksmith/' },
  // pure_defense relic
  { cardId: 'mantle_of_the_mountain', name: 'Mantle of the Mountain', type: 'passive_perk', rarity: 'relic', archetype: 'pure_defense', tags: ['combat'],
    description: '+100 armor. +50% max HP. Every 10th hit against you is fully absorbed. When shielded, reflect 30% of damage back to attacker',
    effects: [{ type: 'armor_bonus', value: 100 }, { type: 'hp_bonus_percent', value: 0.50 }, { type: 'nth_hit_absorb', n: 10 }, { type: 'shield_reflect', value: 0.30 }], icon: 'skills/Blacksmith/' },

  // ──────────────────────────────────────────────────────────────────────────
  // ASSASSIN — was missing commons, mythic_rare, godly, relic
  // ──────────────────────────────────────────────────────────────────────────
  { cardId: 'subtle_blade', name: 'Subtle Blade', type: 'passive_perk', rarity: 'common', archetype: 'assassin', tags: ['stealth', 'combat'],
    description: '+3% stealth attack damage',
    effects: [{ type: 'stealth_attack_bonus', value: 0.03 }], icon: 'skills/Enchantment/' },
  { cardId: 'shadow_step_training', name: 'Shadow Step Training', type: 'passive_perk', rarity: 'common', archetype: 'assassin', tags: ['stealth'],
    description: '+5% stealth movement speed',
    effects: [{ type: 'stealth_speed_bonus', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'poisoned_tip', name: 'Poisoned Tip', type: 'passive_perk', rarity: 'common', archetype: 'assassin', tags: ['stealth', 'combat'],
    description: 'Attacks have 5% chance to apply minor poison (3 dmg/tick, 3 ticks)',
    effects: [{ type: 'on_hit_poison_chance', value: 0.05, damage: 3, ticks: 3 }], icon: 'skills/Enchantment/' },
  { cardId: 'cutpurse', name: 'Cutpurse', type: 'passive_perk', rarity: 'common', archetype: 'assassin', tags: ['stealth'],
    description: '+10% Thievery XP',
    effects: [{ type: 'xp_bonus_skill', skill: 'thievery', value: 0.10 }], icon: 'skills/Enchantment/' },
  // assassin legendary (supplement existing 2)
  { cardId: 'death_mark', name: 'Death Mark', type: 'active_ability', rarity: 'legendary', resourceType: 'focus', archetype: 'assassin', tags: ['stealth', 'combat'],
    description: 'Mark a target for death. After 3 turns, if below 30% HP, instant kill. Otherwise deal 80 true damage. Only usable from stealth',
    effects: [{ type: 'mark_for_death', executeThreshold: 0.30, trueDamage: 80, delay: 3 }],
    combatType: 'damage', targetType: 'single_enemy', focusCost: 25, cooldown: 8, requiresStealth: true, icon: 'skills/Enchantment/' },
  // assassin mythic_rare
  { cardId: 'phantom_assassin', name: 'Phantom Assassin', type: 'passive_perk', rarity: 'mythic_rare', archetype: 'assassin', tags: ['stealth', 'combat'],
    description: 'Stealth attacks deal 60% more damage. After killing from stealth, automatically re-enter stealth. +25% crit chance from stealth',
    effects: [{ type: 'stealth_attack_bonus', value: 0.60 }, { type: 'kill_restealth', value: true }, { type: 'stealth_crit_bonus', value: 0.25 }], icon: 'skills/Enchantment/' },
  // assassin godly
  { cardId: 'veil_of_shadows', name: 'Veil of Shadows', type: 'passive_perk', rarity: 'godly', archetype: 'assassin', tags: ['stealth', 'combat'],
    description: 'Stealth attacks deal double damage. 20% chance to dodge any attack. Kills from stealth reduce all cooldowns by 2 turns. Cannot be revealed by magic',
    effects: [{ type: 'stealth_attack_bonus', value: 1.00 }, { type: 'dodge_chance_bonus', value: 0.20 }, { type: 'stealth_kill_cdr', value: 2 }, { type: 'immunity', conditions: ['reveal'] }], icon: 'skills/Enchantment/' },
  // assassin relic
  { cardId: 'deaths_whisper', name: "Death's Whisper", type: 'passive_perk', rarity: 'relic', archetype: 'assassin', tags: ['stealth', 'combat'],
    description: 'First attack from stealth is always a critical hit dealing 3x damage. Execute enemies below 25% HP instantly. Permanent 15% dodge. Poison damage tripled',
    effects: [{ type: 'stealth_guaranteed_crit', multiplier: 3.0 }, { type: 'execute_threshold', value: 0.25 }, { type: 'dodge_chance_bonus', value: 0.15 }, { type: 'poison_damage_multiplier', value: 3.0 }], icon: 'skills/Enchantment/' },

  // ──────────────────────────────────────────────────────────────────────────
  // SCOUT — was missing legendary through relic entirely
  // ──────────────────────────────────────────────────────────────────────────
  // scout additional commons
  { cardId: 'keen_eyes', name: 'Keen Eyes', type: 'passive_perk', rarity: 'common', archetype: 'scout',
    description: '+5% trap detection range',
    effects: [{ type: 'trap_detection_bonus', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'light_step', name: 'Light Step', type: 'passive_perk', rarity: 'common', archetype: 'scout', tags: ['stealth'],
    description: '+3% dodge chance',
    effects: [{ type: 'dodge_chance_bonus', value: 0.03 }], icon: 'skills/Enchantment/' },
  // scout legendary
  { cardId: 'eagle_eye', name: 'Eagle Eye', type: 'passive_perk', rarity: 'legendary', archetype: 'scout', archetypeSecondary: ['melee_dps'], tags: ['combat'],
    description: '+30% ranged damage. +40% vision range. First attack on unaware enemy deals double damage. Reveal hidden enemies within 5 tiles',
    effects: [{ type: 'ranged_damage_bonus', value: 0.30 }, { type: 'vision_range_bonus', value: 0.40 }, { type: 'ambush_damage_bonus', value: 1.00 }, { type: 'reveal_hidden', range: 5 }], icon: 'skills/Enchantment/' },
  { cardId: 'pathfinder_supreme', name: 'Pathfinder Supreme', type: 'passive_perk', rarity: 'legendary', archetype: 'scout', tags: ['stealth'],
    description: '+25% movement speed. Immune to all terrain penalties. Reveal all traps on the floor. +20% loot from dungeon chests',
    effects: [{ type: 'speed_bonus', value: 0.25 }, { type: 'terrain_immunity', value: true }, { type: 'reveal_all_traps', value: true }, { type: 'chest_loot_bonus', value: 0.20 }], icon: 'skills/Enchantment/' },
  // scout mythic_rare
  { cardId: 'horizon_walker', name: 'Horizon Walker', type: 'passive_perk', rarity: 'mythic_rare', archetype: 'scout', archetypeSecondary: ['assassin'], tags: ['stealth', 'combat'],
    description: '+35% movement speed. +30% ranged damage. Track enemies through walls (tremor vision). After not attacking for 2 turns, next attack deals 80% bonus damage',
    effects: [{ type: 'speed_bonus', value: 0.35 }, { type: 'ranged_damage_bonus', value: 0.30 }, { type: 'grants_vision', value: 'tremor' }, { type: 'patience_damage_bonus', chargeTime: 2, bonus: 0.80 }], icon: 'skills/Enchantment/' },
  // scout godly
  { cardId: 'omniscient_scout', name: 'Omniscient Scout', type: 'passive_perk', rarity: 'godly', archetype: 'scout', tags: ['stealth', 'combat'],
    description: 'Permanent map awareness (all enemies visible). +40% ranged damage. +30% dodge. Gain stealth after standing still for 1 turn',
    effects: [{ type: 'full_map_vision', value: true }, { type: 'ranged_damage_bonus', value: 0.40 }, { type: 'dodge_chance_bonus', value: 0.30 }, { type: 'idle_stealth', turns: 1 }], icon: 'skills/Enchantment/' },
  // scout relic
  { cardId: 'eye_of_the_hawk', name: 'Eye of the Hawk', type: 'passive_perk', rarity: 'relic', archetype: 'scout', tags: ['stealth', 'combat'],
    description: 'See everything on the floor. +50% ranged damage. Arrows pierce through enemies. First hit from outside vision range is an auto-crit for 3x damage',
    effects: [{ type: 'full_map_vision', value: true }, { type: 'ranged_damage_bonus', value: 0.50 }, { type: 'projectile_pierce', value: true }, { type: 'snipe_crit', multiplier: 3.0 }], icon: 'skills/Enchantment/' },

  // ──────────────────────────────────────────────────────────────────────────
  // NIGHT_HUNTER — was missing commons, legendary through relic
  // ──────────────────────────────────────────────────────────────────────────
  { cardId: 'dark_adapted', name: 'Dark Adapted', type: 'passive_perk', rarity: 'common', archetype: 'night_hunter', tags: ['stealth'],
    description: '+5% damage in dark/underground areas',
    effects: [{ type: 'dark_damage_bonus', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'predator_instinct', name: 'Predator Instinct', type: 'passive_perk', rarity: 'common', archetype: 'night_hunter', tags: ['stealth', 'combat'],
    description: '+3% damage to enemies below 50% HP',
    effects: [{ type: 'low_hp_damage_bonus', threshold: 0.50, value: 0.03 }], icon: 'skills/Enchantment/' },
  { cardId: 'night_stalker_training', name: 'Night Stalker Training', type: 'passive_perk', rarity: 'common', archetype: 'night_hunter', tags: ['stealth'],
    description: '+5% stealth effectiveness',
    effects: [{ type: 'stealth_bonus', value: 0.05 }], icon: 'skills/Enchantment/' },
  // night_hunter legendary
  { cardId: 'nightfall', name: 'Nightfall', type: 'active_ability', rarity: 'legendary', resourceType: 'focus', archetype: 'night_hunter', archetypeSecondary: ['cc_dot'], tags: ['stealth', 'combat'],
    description: 'Plunge the area into magical darkness for 4 turns. You gain thermal vision and +40% damage. Enemies are blinded (-50% accuracy)',
    effects: [{ type: 'darkness_zone', duration: 4 }, { type: 'self_buff_in_dark', damage: 0.40, vision: 'thermal' }, { type: 'enemy_blind', accuracy_reduction: 0.50 }],
    combatType: 'debuff_aoe', targetType: 'all_enemies', focusCost: 25, cooldown: 7, icon: 'skills/Enchantment/' },
  { cardId: 'apex_predator', name: 'Apex Predator', type: 'passive_perk', rarity: 'legendary', archetype: 'night_hunter', archetypeSecondary: ['assassin'], tags: ['stealth', 'combat'],
    description: '+30% damage to enemies below 40% HP. Killing blows restore 10% max HP. Gain thermal vision permanently. +20% crit damage',
    effects: [{ type: 'low_hp_damage_bonus', threshold: 0.40, value: 0.30 }, { type: 'kill_heal', value: 0.10 }, { type: 'grants_vision', value: 'thermal' }, { type: 'crit_damage_bonus', value: 0.20 }], icon: 'skills/Enchantment/' },
  // night_hunter mythic_rare
  { cardId: 'terror_of_the_deep', name: 'Terror of the Deep', type: 'passive_perk', rarity: 'mythic_rare', archetype: 'night_hunter', archetypeSecondary: ['assassin'], tags: ['stealth', 'combat'],
    description: '+50% damage in darkness/underground. Enemies you damage have 15% miss chance for 2 turns. +30% crit chance against blinded enemies',
    effects: [{ type: 'dark_damage_bonus', value: 0.50 }, { type: 'on_hit_blind', missChance: 0.15, duration: 2 }, { type: 'blind_crit_bonus', value: 0.30 }], icon: 'skills/Enchantment/' },
  // night_hunter godly
  { cardId: 'lord_of_night', name: 'Lord of Night', type: 'passive_perk', rarity: 'godly', archetype: 'night_hunter', tags: ['stealth', 'combat'],
    description: 'All vision types active permanently. +60% damage in dark areas. Enemies cannot see you until you attack. First strike from darkness stuns for 1 turn',
    effects: [{ type: 'grants_vision', value: 'all' }, { type: 'dark_damage_bonus', value: 0.60 }, { type: 'dark_invisibility', value: true }, { type: 'dark_strike_stun', duration: 1 }], icon: 'skills/Enchantment/' },
  // night_hunter relic
  { cardId: 'crown_of_eternal_night', name: 'Crown of Eternal Night', type: 'passive_perk', rarity: 'relic', archetype: 'night_hunter', tags: ['stealth', 'combat'],
    description: 'You are always considered in darkness. +80% damage from stealth. Kills generate a darkness zone around the corpse (3 tiles, 3 turns). All vision types. Immune to blind',
    effects: [{ type: 'permanent_darkness', value: true }, { type: 'stealth_attack_bonus', value: 0.80 }, { type: 'kill_darkness_zone', radius: 3, duration: 3 }, { type: 'grants_vision', value: 'all' }, { type: 'immunity', conditions: ['blind'] }], icon: 'skills/Enchantment/' },

  // ──────────────────────────────────────────────────────────────────────────
  // GRAPPLER — was missing commons, legendary through relic
  // ──────────────────────────────────────────────────────────────────────────
  { cardId: 'vice_grip', name: 'Vice Grip', type: 'passive_perk', rarity: 'common', archetype: 'grappler', tags: ['combat'],
    description: '+3% grapple damage',
    effects: [{ type: 'grapple_damage_bonus', value: 0.03 }], icon: 'skills/Blacksmith/' },
  { cardId: 'wrestlers_stance', name: "Wrestler's Stance", type: 'passive_perk', rarity: 'common', archetype: 'grappler', tags: ['combat'],
    description: '+5% knockback resistance',
    effects: [{ type: 'knockback_resist', value: 0.05 }], icon: 'skills/Blacksmith/' },
  { cardId: 'chokehold_basics', name: 'Chokehold Basics', type: 'passive_perk', rarity: 'common', archetype: 'grappler', tags: ['combat'],
    description: '+1 turn stun duration on grapple abilities',
    effects: [{ type: 'grapple_stun_bonus', value: 1 }], icon: 'skills/Blacksmith/' },
  // grappler legendary
  { cardId: 'devastating_suplex', name: 'Devastating Suplex', type: 'active_ability', rarity: 'legendary', resourceType: 'stamina', archetype: 'grappler', tags: ['combat'],
    description: 'Grab an enemy and slam them into the ground. Deals 70 physical damage, stuns for 2 turns, and reduces their armor by 20 for 3 turns',
    effects: [{ type: 'damage', element: 'physical', base: 70 }, { type: 'stun', duration: 2 }, { type: 'armor_shred', value: 20, duration: 3 }],
    combatType: 'damage', targetType: 'single_enemy', staminaCost: 30, cooldown: 6, range: 1, icon: 'skills/Blacksmith/' },
  { cardId: 'iron_maiden_hold', name: 'Iron Maiden Hold', type: 'passive_perk', rarity: 'legendary', archetype: 'grappler', archetypeSecondary: ['tank'], tags: ['combat'],
    description: 'While grappling an enemy, take 30% less damage. +25% grapple damage. Grappled enemies cannot cast spells',
    effects: [{ type: 'grapple_damage_reduction', value: 0.30 }, { type: 'grapple_damage_bonus', value: 0.25 }, { type: 'grapple_silence', value: true }], icon: 'skills/Blacksmith/' },
  // grappler mythic_rare
  { cardId: 'titan_wrestler', name: 'Titan Wrestler', type: 'passive_perk', rarity: 'mythic_rare', archetype: 'grappler', archetypeSecondary: ['tank'], tags: ['combat'],
    description: 'Can grapple enemies up to 3x your size. +50% grapple damage. Throwing grappled enemies damages nearby foes. Immune to grapple/knockback',
    effects: [{ type: 'grapple_size_bonus', multiplier: 3 }, { type: 'grapple_damage_bonus', value: 0.50 }, { type: 'throw_aoe_damage', value: true }, { type: 'immunity', conditions: ['grapple', 'knockback'] }], icon: 'skills/Blacksmith/' },
  // grappler godly
  { cardId: 'master_of_holds', name: 'Master of Holds', type: 'passive_perk', rarity: 'godly', archetype: 'grappler', tags: ['combat'],
    description: 'Grapple deals 75% more damage. Successful grapples steal 10% of enemy max HP. Cannot be grappled. +30 armor while grappling',
    effects: [{ type: 'grapple_damage_bonus', value: 0.75 }, { type: 'grapple_hp_steal', value: 0.10 }, { type: 'immunity', conditions: ['grapple'] }, { type: 'grapple_armor_bonus', value: 30 }], icon: 'skills/Blacksmith/' },
  // grappler relic
  { cardId: 'worldbreaker_grip', name: 'Worldbreaker Grip', type: 'passive_perk', rarity: 'relic', archetype: 'grappler', tags: ['combat'],
    description: 'Grapple deals double damage. Instantly break any enemy shield/barrier on grab. Throwing enemies creates a shockwave (AoE stun 1 turn). +100% grapple range',
    effects: [{ type: 'grapple_damage_bonus', value: 1.00 }, { type: 'grapple_break_shields', value: true }, { type: 'throw_shockwave_stun', duration: 1 }, { type: 'grapple_range_bonus', value: 1.00 }], icon: 'skills/Blacksmith/' },

  // ──────────────────────────────────────────────────────────────────────────
  // AQUATIC — was missing commons, godly, relic
  // ──────────────────────────────────────────────────────────────────────────
  { cardId: 'water_affinity', name: 'Water Affinity', type: 'passive_perk', rarity: 'common', archetype: 'aquatic', tags: ['ritual'],
    description: '+5% water damage',
    effects: [{ type: 'elemental_damage_bonus', element: 'water', value: 0.05 }], icon: 'skills/Enchantment/' },
  { cardId: 'gill_breathing', name: 'Gill Breathing', type: 'passive_perk', rarity: 'common', archetype: 'aquatic', tags: ['ritual'],
    description: '+10% swim speed. Breathe underwater',
    effects: [{ type: 'swim_speed_bonus', value: 0.10 }, { type: 'water_breathing', value: true }], icon: 'skills/Enchantment/' },
  { cardId: 'coral_skin', name: 'Coral Skin', type: 'passive_perk', rarity: 'common', archetype: 'aquatic',
    description: '+3 armor. +5% water resistance',
    effects: [{ type: 'armor_bonus', value: 3 }, { type: 'elemental_resist', element: 'water', value: 0.05 }], icon: 'skills/Enchantment/' },
  // aquatic legendary (supplement existing)
  { cardId: 'tsunamis_embrace', name: "Tsunami's Embrace", type: 'active_ability', rarity: 'legendary', resourceType: 'mana', archetype: 'aquatic', archetypeSecondary: ['cc_dot'], tags: ['ritual', 'combat'],
    description: 'Summon a massive wave dealing 55 water damage to all enemies. Knocks back 2 tiles and applies soaked (25% more lightning damage for 3 turns)',
    effects: [{ type: 'damage', element: 'water', base: 55 }, { type: 'knockback', distance: 2 }, { type: 'debuff', status: 'soaked', duration: 3, lightningVuln: 0.25 }],
    combatType: 'damage', targetType: 'all_enemies', manaCost: 30, cooldown: 6, scalingStat: 'acumen', scalingFactor: 0.7, icon: 'skills/Enchantment/' },
  // aquatic godly
  { cardId: 'avatar_of_the_deep', name: 'Avatar of the Deep', type: 'passive_perk', rarity: 'godly', archetype: 'aquatic', archetypeSecondary: ['tank'], tags: ['ritual', 'combat'],
    description: '+50% water damage. Immune to drowning/water hazards. +40 armor in water. Regenerate 5% HP per turn in water. Water spells cost 30% less mana',
    effects: [{ type: 'elemental_damage_bonus', element: 'water', value: 0.50 }, { type: 'water_immunity', value: true }, { type: 'water_armor_bonus', value: 40 }, { type: 'water_hp_regen', value: 0.05 }, { type: 'water_spell_cost_reduction', value: 0.30 }], icon: 'skills/Enchantment/' },
  // aquatic relic
  { cardId: 'trident_of_the_abyss', name: 'Trident of the Abyss', type: 'passive_perk', rarity: 'relic', archetype: 'aquatic', tags: ['ritual', 'combat'],
    description: '+80% water damage. All attacks apply soaked. Summon water elementals on kill (max 2). Water terrain heals you 10% max HP/turn. Command sea creatures in overworld',
    effects: [{ type: 'elemental_damage_bonus', element: 'water', value: 0.80 }, { type: 'on_hit_soak', value: true }, { type: 'kill_summon', unit: 'water_elemental', max: 2 }, { type: 'water_terrain_heal', value: 0.10 }, { type: 'sea_creature_command', value: true }], icon: 'skills/Enchantment/' },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOODLUST RESOURCE POOL — New cards for berserker/rage/aggressive DPS
  // Resource earned through kills, spent on burst abilities
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Bloodlust Commons ──
  { cardId: 'taste_of_blood', name: 'Taste of Blood', type: 'passive_perk', rarity: 'common', archetype: 'melee_dps', tags: ['combat'],
    description: 'Gain 1 bloodlust on melee kill',
    effects: [{ type: 'bloodlust_on_kill', value: 1 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'savage_instinct', name: 'Savage Instinct', type: 'passive_perk', rarity: 'common', archetype: 'melee_dps', tags: ['combat'],
    description: '+3% damage when bloodlust is above 50%',
    effects: [{ type: 'bloodlust_threshold_damage', threshold: 0.50, value: 0.03 }], icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'feral_swipe', name: 'Feral Swipe', type: 'active_ability', rarity: 'common', resourceType: 'bloodlust', archetype: 'melee_dps', tags: ['combat'],
    description: 'A vicious swipe that deals 12 physical damage. Low cost, fast cooldown',
    effects: [{ type: 'damage', element: 'physical', base: 12 }],
    combatType: 'damage', targetType: 'single_enemy', bloodlustCost: 5, cooldown: 2, range: 1, icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'bloodthirst', name: 'Bloodthirst', type: 'passive_perk', rarity: 'common', archetype: 'assassin', tags: ['combat', 'stealth'],
    description: '+2% lifesteal on all attacks',
    effects: [{ type: 'lifesteal', value: 0.02 }], icon: 'skills/Enchantment/' },

  // ── Bloodlust Uncommons ──
  { cardId: 'berserker_frenzy', name: 'Berserker Frenzy', type: 'active_ability', rarity: 'uncommon', resourceType: 'bloodlust', archetype: 'melee_dps', tags: ['combat'],
    description: 'Enter a frenzy for 3 turns. +20% attack speed, +10% damage, but -10% defense',
    effects: [{ type: 'self_buff', attackSpeed: 0.20, damage: 0.10, defense: -0.10, duration: 3 }],
    combatType: 'buff', targetType: 'self', bloodlustCost: 15, cooldown: 5, icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'rending_strike', name: 'Rending Strike', type: 'active_ability', rarity: 'uncommon', resourceType: 'bloodlust', archetype: 'melee_dps', tags: ['combat'],
    description: 'Tear into the enemy for 18 physical damage + 6 bleed damage per turn for 3 turns',
    effects: [{ type: 'damage', element: 'physical', base: 18 }, { type: 'bleed', damage: 6, duration: 3 }],
    combatType: 'damage', targetType: 'single_enemy', bloodlustCost: 12, cooldown: 3, range: 1, icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'savage_leap', name: 'Savage Leap', type: 'active_ability', rarity: 'uncommon', resourceType: 'bloodlust', archetype: 'grappler', tags: ['combat'],
    description: 'Leap to an enemy up to 3 tiles away, dealing 15 damage and stunning for 1 turn on landing',
    effects: [{ type: 'damage', element: 'physical', base: 15 }, { type: 'stun', duration: 1 }, { type: 'dash', range: 3 }],
    combatType: 'damage', targetType: 'single_enemy', bloodlustCost: 10, cooldown: 4, range: 3, icon: 'skills/Blacksmith/' },

  // ── Bloodlust Rares ──
  { cardId: 'rampage', name: 'Rampage', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['grappler'], tags: ['combat'],
    description: 'Attack all adjacent enemies for 25 physical damage each. Each kill during Rampage refunds 5 bloodlust',
    effects: [{ type: 'damage', element: 'physical', base: 25, aoe: true }, { type: 'kill_refund_resource', resource: 'bloodlust', value: 5 }],
    combatType: 'damage', targetType: 'all_adjacent', bloodlustCost: 20, cooldown: 4, range: 1, icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'crimson_frenzy', name: 'Crimson Frenzy', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'melee_dps', tags: ['combat'],
    description: 'Sacrifice 15% HP to gain +30% damage and +20% attack speed for 4 turns. Kills heal 5% max HP',
    effects: [{ type: 'hp_sacrifice', percent: 0.15 }, { type: 'self_buff', damage: 0.30, attackSpeed: 0.20, duration: 4 }, { type: 'kill_heal', value: 0.05 }],
    combatType: 'buff', targetType: 'self', bloodlustCost: 18, cooldown: 6, icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'primal_roar', name: 'Primal Roar', type: 'active_ability', rarity: 'rare', resourceType: 'bloodlust', archetype: 'grappler', archetypeSecondary: ['tank'], tags: ['combat'],
    description: 'Unleash a terrifying roar. All enemies in 2 tiles take 10 damage, are feared for 2 turns, and lose 5 armor for 3 turns',
    effects: [{ type: 'damage', element: 'physical', base: 10 }, { type: 'fear', duration: 2 }, { type: 'armor_shred', value: 5, duration: 3 }],
    combatType: 'debuff_aoe', targetType: 'all_enemies', bloodlustCost: 15, cooldown: 5, aoeRadius: 2, icon: 'skills/Blacksmith/' },
  { cardId: 'feeding_frenzy', name: 'Feeding Frenzy', type: 'passive_perk', rarity: 'rare', archetype: 'night_hunter', tags: ['combat', 'stealth'],
    description: 'Each kill in combat grants +5% damage (stacks up to 5x). At max stacks, gain 10% lifesteal',
    effects: [{ type: 'kill_stack_damage', perStack: 0.05, maxStacks: 5 }, { type: 'max_stack_lifesteal', value: 0.10 }], icon: 'skills/Enchantment/' },

  // ── Bloodlust Ultra Rares ──
  { cardId: 'blood_rage', name: 'Blood Rage', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['tank'], tags: ['combat'],
    description: 'Enter Blood Rage for 5 turns. +40% damage, +20% lifesteal, immune to fear/stun. Take 5% max HP damage per turn',
    effects: [{ type: 'self_buff', damage: 0.40, lifesteal: 0.20, duration: 5 }, { type: 'immunity', conditions: ['fear', 'stun'] }, { type: 'self_dot', hpPercent: 0.05 }],
    combatType: 'buff', targetType: 'self', bloodlustCost: 30, cooldown: 8, icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'carnage', name: 'Carnage', type: 'active_ability', rarity: 'ultra_rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['glass_cannon'], tags: ['combat'],
    description: 'Devastating strike dealing 50 physical damage. If this kills the target, immediately gain a free attack on the nearest enemy',
    effects: [{ type: 'damage', element: 'physical', base: 50 }, { type: 'kill_chain_attack', value: true }],
    combatType: 'damage', targetType: 'single_enemy', bloodlustCost: 25, cooldown: 5, range: 1, icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'bloodbath', name: 'Bloodbath', type: 'passive_perk', rarity: 'ultra_rare', archetype: 'melee_dps', tags: ['combat'],
    description: 'All bloodlust abilities cost 20% less. Gain 2 extra bloodlust per kill. +10% damage while bloodlust is above 75%',
    effects: [{ type: 'bloodlust_cost_reduction', value: 0.20 }, { type: 'bloodlust_on_kill_bonus', value: 2 }, { type: 'bloodlust_threshold_damage', threshold: 0.75, value: 0.10 }], icon: 'skills/Skill_SwordAttack.PNG' },

  // ── Bloodlust Legendaries ──
  { cardId: 'warlords_fury', name: "Warlord's Fury", type: 'active_ability', rarity: 'legendary', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['tank'], tags: ['combat'],
    description: 'Consume all bloodlust. Deal physical damage equal to 2x bloodlust consumed to all enemies in 2 tiles. Heal 50% of damage dealt',
    effects: [{ type: 'consume_all_resource', resource: 'bloodlust' }, { type: 'damage_from_consumed', multiplier: 2.0, aoe: true }, { type: 'damage_heal', percent: 0.50 }],
    combatType: 'damage', targetType: 'all_enemies', bloodlustCost: 0, consumeAll: true, cooldown: 8, aoeRadius: 2, icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'apex_fury', name: 'Apex Fury', type: 'passive_perk', rarity: 'legendary', archetype: 'grappler', archetypeSecondary: ['melee_dps'], tags: ['combat'],
    description: 'When bloodlust is full, next attack deals 50% bonus damage and applies a 3-turn bleed. Grapple kills generate double bloodlust',
    effects: [{ type: 'bloodlust_full_burst', bonusDamage: 0.50, bleedDuration: 3 }, { type: 'grapple_kill_bloodlust_bonus', multiplier: 2.0 }], icon: 'skills/Blacksmith/' },

  // ── Bloodlust Mythic Rare ──
  { cardId: 'avatar_of_carnage', name: 'Avatar of Carnage', type: 'active_ability', rarity: 'mythic_rare', resourceType: 'bloodlust', archetype: 'melee_dps', archetypeSecondary: ['grappler'], tags: ['combat'],
    description: 'Transform into a blood-fueled avatar for 6 turns. +50% damage, +30% lifesteal, immune to CC. Each kill extends duration by 1 turn. Cannot be healed by allies',
    effects: [{ type: 'transform', name: 'Avatar of Carnage', duration: 6, damage: 0.50, lifesteal: 0.30 }, { type: 'immunity', conditions: ['stun', 'fear', 'slow', 'root'] }, { type: 'kill_extend_transform', value: 1 }, { type: 'ally_heal_immune', value: true }],
    combatType: 'buff', targetType: 'self', bloodlustCost: 40, cooldown: 10, icon: 'skills/Skill_SwordAttack.PNG' },

  // ── Resource Conversion ──
  { cardId: 'resource_channel', name: 'Resource Channel', type: 'active_ability', rarity: 'rare', archetype: 'utility',
    description: 'Convert 15 of your primary resource into 10 of a chosen secondary resource',
    resourceType: 'primary',
    combatType: 'utility', range: 0, manaCost: 15, aoeRadius: 0, cooldown: 3, targetType: 'self',
    convertResource: true, convertRatio: 0.67,
    icon: 'skills/Enchantment/' },

  // ── Hybrid Archetype Cards (reward multi-resource builds) ──
  { cardId: 'elemental_rage', name: 'Elemental Rage', type: 'active_ability', rarity: 'ultra_rare', archetype: 'glass_cannon',
    tags: ['magic'],
    description: 'Channel bloodlust into arcane fury. Costs 10 bloodlust + 10 mana. Deals fire damage scaling with both resources.',
    resourceType: 'dual', dualCost: { bloodlust: 10, mana: 10 },
    combatType: 'damage', element: 'fire', baseDamage: 30, range: 4, manaCost: 0, aoeRadius: 1, cooldown: 4,
    scalingStat: 'acumen', scalingFactor: 1.0, bonusDamageFromResource: { resource: 'bloodlust', factor: 0.5 },
    targetType: 'enemy', icon: 'skills/Skill_Explosion.PNG' },
  { cardId: 'focused_fury', name: 'Focused Fury', type: 'active_ability', rarity: 'ultra_rare', archetype: 'melee_dps',
    description: 'Channel deep focus into a devastating physical strike. Costs 10 focus + 10 stamina. Damage increases with focus level.',
    resourceType: 'dual', dualCost: { focus: 10, stamina: 10 },
    combatType: 'damage', element: 'physical', baseDamage: 35, range: 1, manaCost: 0, aoeRadius: 0, cooldown: 4,
    scalingStat: 'finesse', scalingFactor: 0.8, bonusDamageFromResource: { resource: 'focus', factor: 0.6 },
    targetType: 'enemy', icon: 'skills/Skill_SwordAttack.PNG' },
  { cardId: 'battle_meditation', name: 'Battle Meditation', type: 'active_ability', rarity: 'ultra_rare', archetype: 'support',
    tags: ['magic'],
    description: 'Enter a meditative combat trance. Costs 15 focus + 15 mana. Heals all allies in radius and grants +2 regen to all resources for 3 turns.',
    resourceType: 'dual', dualCost: { focus: 15, mana: 15 },
    combatType: 'healing', baseHeal: 25, range: 0, manaCost: 0, aoeRadius: 2, cooldown: 5,
    scalingStat: 'resolve', scalingFactor: 0.5, grantsBuff: { name: 'meditative_trance', duration: 3, allResourceRegen: 2 },
    targetType: 'ally', icon: 'skills/Enchantment/' },
];

// ---------------------------------------------------------------------------
// Rift Scars — Random modifiers applied to card drops from Rift dungeons
// Lore: The Rift warps everything it touches, leaving "scars" on items.
// Prefix Scars: offensive/elemental. Suffix Scars: defensive/utility.
// Rarity controls number of scars: Common=0, Uncommon=0, Rare=1, Ultra Rare=1, Mythic+=2
// ---------------------------------------------------------------------------

const RIFT_SCAR_PREFIXES = [
  { id: 'scorching', name: 'Scorching', weight: 10, effects: [{ type: 'bonus_damage', element: 'fire', value: 5 }], description: '+5 fire damage' },
  { id: 'freezing', name: 'Freezing', weight: 10, effects: [{ type: 'bonus_damage', element: 'ice', value: 5 }], description: '+5 ice damage' },
  { id: 'venomous', name: 'Venomous', weight: 10, effects: [{ type: 'bonus_damage', element: 'poison', value: 4 }, { type: 'dot_chance', element: 'poison', value: 0.15 }], description: '+4 poison damage, 15% poison DoT' },
  { id: 'thundering', name: 'Thundering', weight: 8, effects: [{ type: 'bonus_damage', element: 'lightning', value: 6 }], description: '+6 lightning damage' },
  { id: 'brutal', name: 'Brutal', weight: 12, effects: [{ type: 'crit_bonus', value: 0.05 }], description: '+5% crit chance' },
  { id: 'precise', name: 'Precise', weight: 12, effects: [{ type: 'accuracy_bonus', value: 0.10 }], description: '+10% accuracy' },
  { id: 'furious', name: 'Furious', weight: 8, effects: [{ type: 'damage_mult', value: 0.10 }], description: '+10% damage' },
  { id: 'corrupted', name: 'Corrupted', weight: 6, effects: [{ type: 'bonus_damage', element: 'dark', value: 7 }], description: '+7 dark damage' },
  { id: 'radiant', name: 'Radiant', weight: 6, effects: [{ type: 'bonus_damage', element: 'holy', value: 7 }], description: '+7 holy damage' },
  { id: 'siphoning', name: 'Siphoning', weight: 5, effects: [{ type: 'lifesteal', value: 0.08 }], description: '8% lifesteal on hit' },
];

const RIFT_SCAR_SUFFIXES = [
  { id: 'of_the_bulwark', name: 'of the Bulwark', weight: 10, effects: [{ type: 'armor_bonus', value: 5 }], description: '+5 armor' },
  { id: 'of_haste', name: 'of Haste', weight: 10, effects: [{ type: 'speed_bonus', value: 0.08 }], description: '+8% speed' },
  { id: 'of_draining', name: 'of Draining', weight: 8, effects: [{ type: 'mana_on_hit', value: 3 }], description: '+3 mana on hit' },
  { id: 'of_endurance', name: 'of Endurance', weight: 10, effects: [{ type: 'hp_bonus', value: 15 }], description: '+15 max HP' },
  { id: 'of_resilience', name: 'of Resilience', weight: 8, effects: [{ type: 'magic_resist_bonus', value: 0.05 }], description: '+5% magic resist' },
  { id: 'of_evasion', name: 'of Evasion', weight: 8, effects: [{ type: 'dodge_bonus', value: 0.04 }], description: '+4% dodge' },
  { id: 'of_fortitude', name: 'of Fortitude', weight: 6, effects: [{ type: 'cc_resist', value: 0.10 }], description: '+10% CC resist' },
  { id: 'of_regeneration', name: 'of Regeneration', weight: 6, effects: [{ type: 'hp_regen', value: 2 }], description: '+2 HP regen/turn' },
  { id: 'of_thorns', name: 'of Thorns', weight: 5, effects: [{ type: 'damage_reflect', value: 0.05 }], description: '5% damage reflect' },
  { id: 'of_the_void', name: 'of the Void', weight: 4, effects: [{ type: 'cooldown_reduction', value: 0.10 }], description: '-10% ability cooldowns' },
];

const RIFT_SCAR_TOTAL_PREFIX_WEIGHT = RIFT_SCAR_PREFIXES.reduce(function(sum, s) { return sum + s.weight; }, 0);
const RIFT_SCAR_TOTAL_SUFFIX_WEIGHT = RIFT_SCAR_SUFFIXES.reduce(function(sum, s) { return sum + s.weight; }, 0);

/**
 * Determine how many Rift Scars a card should receive based on its rarity.
 * @param {string} rarity - Card rarity id
 * @returns {number} Number of scars (0, 1, or 2)
 */
function getRiftScarCount(rarity) {
  if (rarity === 'mythic_rare' || rarity === 'legendary' || rarity === 'godly' || rarity === 'relic') return 2;
  if (rarity === 'rare' || rarity === 'ultra_rare') return 1;
  return 0;
}

/**
 * Roll a random Rift Scar prefix based on weights.
 * @returns {object} A scar prefix object
 */
function rollRiftScarPrefix() {
  var roll = Math.random() * RIFT_SCAR_TOTAL_PREFIX_WEIGHT;
  var cumulative = 0;
  for (var i = 0; i < RIFT_SCAR_PREFIXES.length; i++) {
    cumulative += RIFT_SCAR_PREFIXES[i].weight;
    if (roll < cumulative) return RIFT_SCAR_PREFIXES[i];
  }
  return RIFT_SCAR_PREFIXES[RIFT_SCAR_PREFIXES.length - 1];
}

/**
 * Roll a random Rift Scar suffix based on weights.
 * @returns {object} A scar suffix object
 */
function rollRiftScarSuffix() {
  var roll = Math.random() * RIFT_SCAR_TOTAL_SUFFIX_WEIGHT;
  var cumulative = 0;
  for (var i = 0; i < RIFT_SCAR_SUFFIXES.length; i++) {
    cumulative += RIFT_SCAR_SUFFIXES[i].weight;
    if (roll < cumulative) return RIFT_SCAR_SUFFIXES[i];
  }
  return RIFT_SCAR_SUFFIXES[RIFT_SCAR_SUFFIXES.length - 1];
}

/**
 * Apply Rift Scars to a card instance. Modifies the card in-place.
 * @param {object} card - A card instance (from generateCardInstance)
 * @param {number} dungeonDepth - Current dungeon floor (higher = slightly better scars)
 * @returns {object} The modified card
 */
function applyRiftScars(card, dungeonDepth) {
  var scarCount = getRiftScarCount(card.rarity);
  if (scarCount <= 0) return card;

  card.riftScars = [];

  // First scar is always a prefix
  if (scarCount >= 1) {
    var prefix = rollRiftScarPrefix();
    card.riftScars.push({ type: 'prefix', id: prefix.id, name: prefix.name, effects: prefix.effects, description: prefix.description });
    // Modify card name: "Scorching Fireball I"
    card.name = prefix.name + ' ' + card.name;
  }

  // Second scar is always a suffix
  if (scarCount >= 2) {
    var suffix = rollRiftScarSuffix();
    card.riftScars.push({ type: 'suffix', id: suffix.id, name: suffix.name, effects: suffix.effects, description: suffix.description });
    // Modify card name: "Scorching Fireball I of the Bulwark"
    card.name = card.name + ' ' + suffix.name;
  }

  // Depth bonus: +1% to all numeric scar effect values per 10 floors (subtle scaling)
  if (dungeonDepth && dungeonDepth > 10) {
    var depthBonus = 1 + (Math.floor(dungeonDepth / 10) * 0.01);
    for (var si = 0; si < card.riftScars.length; si++) {
      var scar = card.riftScars[si];
      for (var ei = 0; ei < scar.effects.length; ei++) {
        if (typeof scar.effects[ei].value === 'number') {
          scar.effects[ei].value = parseFloat((scar.effects[ei].value * depthBonus).toFixed(4));
        }
      }
    }
  }

  return card;
}

// ---------------------------------------------------------------------------
// Awakenings — Transformative milestone abilities at level 25 and 50
// Lore: Prolonged exposure to Rift energy awakens latent potential.
// Requires 40+ in a specific stat to qualify. Choices are mutually exclusive per tier.
// ---------------------------------------------------------------------------

const AWAKENINGS = {
  tier1: {
    level: 25,
    statThreshold: 40,
    choices: [
      {
        id: 'rift_surge',
        name: 'Rift Surge',
        requiredStat: 'acumen',
        description: 'Channel raw Rift energy through your spells. Spell damage +30%, but mana costs increase by 15%.',
        effects: [
          { type: 'spell_damage_mult', value: 0.30 },
          { type: 'mana_cost_mult', value: 0.15 },
        ],
        icon: 'skills/Enchantment/',
        lore: 'The Rift whispers through your incantations, each spell crackling with unstable power.',
      },
      {
        id: 'iron_constitution',
        name: 'Iron Constitution',
        requiredStat: 'vigor',
        description: 'Your body hardens from countless battles. Max HP +25%, regenerate 2% HP per turn.',
        effects: [
          { type: 'hp_mult', value: 0.25 },
          { type: 'hp_regen_percent', value: 0.02 },
        ],
        icon: 'skills/Blacksmith/',
        lore: 'Scar tissue layered upon scar tissue — you have become nearly indestructible.',
      },
      {
        id: 'killers_instinct',
        name: "Killer's Instinct",
        requiredStat: 'finesse',
        description: 'Your strikes find vital points with preternatural accuracy. Crit chance +15%, crit damage +50%.',
        effects: [
          { type: 'crit_chance_bonus', value: 0.15 },
          { type: 'crit_damage_mult', value: 0.50 },
        ],
        icon: 'skills/Enchantment/',
        lore: 'Every movement leaves an opening. You see them all now.',
      },
    ],
  },
  tier2: {
    level: 50,
    statThreshold: 40,
    choices: [
      {
        id: 'rift_conduit',
        name: 'Rift Conduit',
        requiredStat: 'acumen',
        description: 'Become a living conduit for Rift energy. All ability cooldowns -25%, resource costs -20%.',
        effects: [
          { type: 'cooldown_reduction', value: 0.25 },
          { type: 'resource_cost_reduction', value: 0.20 },
        ],
        icon: 'skills/Enchantment/',
        lore: 'The boundary between you and the Rift has dissolved. Energy flows through you like a river.',
      },
      {
        id: 'undying_bastion',
        name: 'Undying Bastion',
        requiredStat: 'vigor',
        description: 'Once per combat, survive a killing blow with 1 HP and gain 50% damage reduction for 3 turns.',
        effects: [
          { type: 'cheat_death', uses: 1 },
          { type: 'on_cheat_death_dr', value: 0.50, duration: 3 },
        ],
        icon: 'skills/Blacksmith/',
        lore: 'Death reached for you, but you simply refused.',
      },
      {
        id: 'shadow_sovereign',
        name: 'Shadow Sovereign',
        requiredStat: 'finesse',
        description: 'Gain permanent stealth in dim light. First attack from stealth deals 100% bonus damage.',
        effects: [
          { type: 'dim_light_stealth', value: true },
          { type: 'stealth_break_damage_mult', value: 1.00 },
        ],
        icon: 'skills/Enchantment/',
        lore: 'You do not walk in shadow — shadow walks with you.',
      },
    ],
  },
};

/**
 * Get available Awakening choices for a player at their current level and stats.
 * @param {number} level - Player level
 * @param {object} rpgStats - Player RPG stats object (vigor, might, finesse, acumen, etc.)
 * @param {Array} existingAwakenings - Array of already-chosen awakening IDs
 * @returns {Array} Array of available awakening choices (empty if none qualify)
 */
function getAvailableAwakenings(level, rpgStats, existingAwakenings) {
  var available = [];
  var chosen = existingAwakenings || [];

  var tiers = [AWAKENINGS.tier1, AWAKENINGS.tier2];
  for (var ti = 0; ti < tiers.length; ti++) {
    var tier = tiers[ti];
    if (level < tier.level) continue;

    // Check if player already chose from this tier
    var alreadyChosen = false;
    for (var ci = 0; ci < tier.choices.length; ci++) {
      if (chosen.indexOf(tier.choices[ci].id) !== -1) {
        alreadyChosen = true;
        break;
      }
    }
    if (alreadyChosen) continue;

    // Filter choices by stat threshold
    for (var cj = 0; cj < tier.choices.length; cj++) {
      var choice = tier.choices[cj];
      var statValue = (rpgStats && rpgStats[choice.requiredStat]) ? rpgStats[choice.requiredStat] : 0;
      if (statValue >= tier.statThreshold) {
        available.push({
          tier: ti + 1,
          id: choice.id,
          name: choice.name,
          requiredStat: choice.requiredStat,
          requiredValue: tier.statThreshold,
          currentValue: statValue,
          description: choice.description,
          lore: choice.lore,
          icon: choice.icon,
        });
      }
    }
  }

  return available;
}

// Index card templates by rarity for efficient pack rolling
const CARDS_BY_RARITY = {};
for (var ci = 0; ci < CARD_TEMPLATES.length; ci++) {
  var card = CARD_TEMPLATES[ci];
  if (!CARDS_BY_RARITY[card.rarity]) CARDS_BY_RARITY[card.rarity] = [];
  CARDS_BY_RARITY[card.rarity].push(card);
}

// Index card templates by cardId
const CARD_BY_ID = {};
for (var cii = 0; cii < CARD_TEMPLATES.length; cii++) {
  CARD_BY_ID[CARD_TEMPLATES[cii].cardId] = CARD_TEMPLATES[cii];
}

// ---------------------------------------------------------------------------
// Card Pack Generation
// ---------------------------------------------------------------------------

const CARDS_PER_PACK_MIN = 6;
const CARDS_PER_PACK_MAX = 6;
const MAX_ACTIVE_CARD_SLOTS = 4;
const MAX_PASSIVE_CARD_SLOTS = 3;
const MAX_EQUIPPED_CARDS = MAX_ACTIVE_CARD_SLOTS + MAX_PASSIVE_CARD_SLOTS; // 7
const MAX_CARD_COLLECTION = 1000;
const MAX_FUSION_COUNT = 2;

// Card visual styles (holographic, special editions)
const CARD_STYLES = {
  normal: { id: 'normal', name: 'Normal', chance: 0.80, borderEffect: null },
  holographic: { id: 'holographic', name: 'Holographic', chance: 0.12, borderEffect: 'rainbow_shimmer' },
  golden: { id: 'golden', name: 'Golden', chance: 0.05, borderEffect: 'gold_glow' },
  prismatic: { id: 'prismatic', name: 'Prismatic', chance: 0.025, borderEffect: 'prismatic_shift' },
  void: { id: 'void', name: 'Void Edition', chance: 0.005, borderEffect: 'void_particles' },
};

// Special serial numbers for first-pulled and milestone cards
var _globalSerialCounter = 0;
function generateSerial() {
  _globalSerialCounter++;
  return 'SN-' + String(_globalSerialCounter).padStart(6, '0');
}

function rollCardStyle() {
  var roll = Math.random();
  var cumulative = 0;
  var styles = Object.values(CARD_STYLES);
  for (var i = 0; i < styles.length; i++) {
    cumulative += styles[i].chance;
    if (roll < cumulative) return styles[i];
  }
  return CARD_STYLES.normal;
}

// Biome XP bonus multiplier: skills work everywhere but listed biomes give bonus
const SKILL_BIOME_BONUS = {
  farming: { preferred: ['PLAINS', 'HOLY_DOMINION', 'ELVEN_SOUTH'], bonus: 0.25 },
  fishing: { preferred: ['BEACH', 'SWAMP'], bonus: 0.25, nearWater: true },
  glassworking: { preferred: ['SCORCHED_SANDS', 'WASTES'], bonus: 0.25 },
  cogworking: { preferred: ['CLOCKWORK_HARBOR', 'GNOMISH_ISLES', 'MECHSPIRE'], bonus: 0.25 },
  magic: { preferred: ['ELVEN_SOUTH', 'HOLY_DOMINION', 'SWAMP'], bonus: 0.20 },
  mining: { preferred: ['MOUNTAIN', 'WASTES'], bonus: 0.15 },
  woodcutting: { preferred: ['FOREST', 'ELVEN_SOUTH'], bonus: 0.15 },
};

// Mount types that can traverse water
const WATER_MOUNTS = new Set(['raft', 'boat', 'ship', 'sea_mount', 'airship', 'flying_mount']);

function generateCardInstance(template, source) {
  var style = rollCardStyle();
  var card = {
    instanceId: crypto.randomBytes(8).toString('hex'),
    cardId: template.cardId,
    name: template.name,
    type: template.type,
    rarity: template.rarity,
    effects: JSON.parse(JSON.stringify(template.effects)),
    icon: template.icon,
    fusionCount: 0,
    fusionLineage: [],
    obtainedAt: Date.now(),
    source: source || 'level_pack',
    style: style.id,
    borderEffect: style.borderEffect,
    serial: generateSerial(),
  };
  // Void edition cards get +10% to all effects
  if (style.id === 'void') {
    for (var i = 0; i < card.effects.length; i++) {
      if (typeof card.effects[i].value === 'number') {
        card.effects[i].value = Math.round(card.effects[i].value * 1.10 * 100) / 100;
      }
      if (typeof card.effects[i].base === 'number') {
        card.effects[i].base = Math.round(card.effects[i].base * 1.10);
      }
    }
  }
  return card;
}

function openCardPack(raceId, pityPullsSinceLegendary, luckBonus) {
  var isCatFolk = (raceId === 'catfolk');
  var totalLuck = (typeof luckBonus === 'number' && luckBonus > 0) ? luckBonus : 0;
  var pity = { pullsSinceLegendary: (typeof pityPullsSinceLegendary === 'number' ? pityPullsSinceLegendary : 0) };
  var cardCount = CARDS_PER_PACK_MIN + Math.floor(Math.random() * (CARDS_PER_PACK_MAX - CARDS_PER_PACK_MIN + 1));
  var cards = [];
  for (var i = 0; i < cardCount; i++) {
    var rarity = rollRarity(isCatFolk, pity);

    // Apply luck bonus: chance to bump rarity up one tier
    if (totalLuck > 0 && rarity.order < RARITY_TIERS.length - 1) {
      if (Math.random() < totalLuck) {
        rarity = RARITY_TIERS[rarity.order + 1];
      }
    }

    var pool = CARDS_BY_RARITY[rarity.id];
    if (!pool || pool.length === 0) pool = CARDS_BY_RARITY['common'];

    // Filter out race-locked cards that don't match player's race
    var filteredPool = [];
    for (var j = 0; j < pool.length; j++) {
      if (!pool[j].raceLocked || pool[j].raceLocked === raceId) {
        filteredPool.push(pool[j]);
      }
    }
    if (filteredPool.length === 0) filteredPool = pool;

    // Race-based tag weighting
    var selectedPool = filteredPool;
    if (raceId === 'elf' && Math.random() < 0.40) {
      var magicPool = filteredPool.filter(function(c) { return c.tags && c.tags.indexOf('magic') >= 0; });
      if (magicPool.length > 0) selectedPool = magicPool;
    } else if (raceId === 'goblin' && Math.random() < 0.35) {
      var stealthPool = filteredPool.filter(function(c) { return c.tags && c.tags.indexOf('stealth') >= 0; });
      if (stealthPool.length > 0) selectedPool = stealthPool;
    } else if (raceId === 'catfolk' && Math.random() < 0.40) {
      var luckPool = filteredPool.filter(function(c) { return c.tags && c.tags.indexOf('luck') >= 0; });
      if (luckPool.length > 0) selectedPool = luckPool;
    } else if (raceId === 'lizardfolk' && Math.random() < 0.25) {
      var ritualPool = filteredPool.filter(function(c) { return c.tags && c.tags.indexOf('ritual') >= 0; });
      if (ritualPool.length > 0) selectedPool = ritualPool;
    }

    var template = selectedPool[Math.floor(Math.random() * selectedPool.length)];
    cards.push(generateCardInstance(template, 'level_pack'));
  }
  return { cards: cards, pityPullsSinceLegendary: pity.pullsSinceLegendary };
}

// ---------------------------------------------------------------------------
// Gacha Rate Disclosure: compute effective rates for a given player state
// ---------------------------------------------------------------------------

// Race-based pool biases (mirrors the logic in openCardPack)
var RACE_POOL_BIAS = {
  elf:        { pool: 'magic',   chance: 0.40 },
  goblin:     { pool: 'stealth', chance: 0.35 },
  catfolk:    { pool: 'luck',    chance: 0.40 },
  lizardfolk: { pool: 'ritual',  chance: 0.25 },
};

var CATFOLK_RARITY_BUMP = 0.12; // 12% chance to bump up one tier

/**
 * Compute the effective gacha rarity rates for a specific player.
 *
 * Takes into account:
 *   - Base rarity weights from RARITY_TIERS
 *   - Soft pity (pullsSinceLegendary > 80 = +2% per pull toward Legendary)
 *   - Hard pity (pullsSinceLegendary >= 120 = guaranteed Legendary)
 *   - Cat Folk rarity bump (12% chance to advance one tier)
 *   - Equipped card luck bonus (chance to advance one tier)
 *
 * Returns an object with:
 *   baseRates      - unmodified rates { common: 0.45, ... }
 *   effectiveRates - rates after all modifiers { common: 0.42, ... }
 *   raceModifiers  - { poolBias: {pool, chance} | null, rarityBump: number }
 *   cardModifiers  - array of { cardName, effect } for equipped cards affecting rates
 *   pityInfo       - { pullsSinceLegendary, softPityStart, hardPity, softPityActive, currentBoost }
 *   packInfo       - { cardsPerPack, guarantees }
 */
function computeEffectiveGachaRates(raceId, pullsSinceLegendary, luckBonus) {
  var isCatFolk = (raceId === 'catfolk');
  var totalLuck = (typeof luckBonus === 'number' && luckBonus > 0) ? luckBonus : 0;
  var pity = typeof pullsSinceLegendary === 'number' ? pullsSinceLegendary : 0;

  var tierCount = RARITY_TIERS.length;

  // Step 0: Build base probability distribution from weights
  var baseProbs = [];
  for (var i = 0; i < tierCount; i++) {
    baseProbs[i] = RARITY_TIERS[i].weight / TOTAL_RARITY_WEIGHT;
  }

  // Copy base for the "base rates" output (before any modifiers)
  var baseRatesOut = {};
  for (var b = 0; b < tierCount; b++) {
    baseRatesOut[RARITY_TIERS[b].id] = baseProbs[b];
  }

  // Working copy of probabilities that we mutate through each modifier stage
  var probs = [];
  for (var c = 0; c < tierCount; c++) {
    probs[c] = baseProbs[c];
  }

  // Step 1: Hard pity check — if at or beyond 120, next pull is guaranteed Legendary
  var hardPityActive = (pity >= HARD_PITY);
  if (hardPityActive) {
    for (var h = 0; h < tierCount; h++) {
      probs[h] = 0;
    }
    probs[5] = 1.0; // Legendary (order 5)
  }

  // Step 2: Soft pity — chance to override to Legendary for sub-Legendary rolls
  // Only applies if we haven't hit hard pity
  var softPityBoost = 0;
  if (!hardPityActive && pity > SOFT_PITY_START) {
    // The next pull will be at pullsSinceLegendary + 1 (since rollRarity increments first)
    softPityBoost = (pity + 1 - SOFT_PITY_START) * SOFT_PITY_RATE;
    if (softPityBoost > 1) softPityBoost = 1;

    // For tiers 0-4 (below Legendary), a fraction softPityBoost gets redirected to Legendary
    var massRedirected = 0;
    for (var s = 0; s < 5; s++) {
      var redirected = probs[s] * softPityBoost;
      probs[s] -= redirected;
      massRedirected += redirected;
    }
    probs[5] += massRedirected;
  }

  // Step 3: Cat Folk rarity bump — 12% chance per card to bump up one tier
  // For each tier i (except the highest), 12% of its probability migrates to tier i+1
  if (isCatFolk && !hardPityActive) {
    var afterCatfolk = [];
    for (var cf = 0; cf < tierCount; cf++) {
      afterCatfolk[cf] = 0;
    }
    for (var t = 0; t < tierCount; t++) {
      if (t < tierCount - 1) {
        afterCatfolk[t] += probs[t] * (1 - CATFOLK_RARITY_BUMP);
        afterCatfolk[t + 1] += probs[t] * CATFOLK_RARITY_BUMP;
      } else {
        afterCatfolk[t] += probs[t]; // Highest tier stays
      }
    }
    probs = afterCatfolk;
  }

  // Step 4: Luck bonus — additional chance to bump rarity up one tier
  // Applied independently per card in openCardPack after rarity roll
  if (totalLuck > 0 && !hardPityActive) {
    var cappedLuck = totalLuck > 1 ? 1 : totalLuck;
    var afterLuck = [];
    for (var al = 0; al < tierCount; al++) {
      afterLuck[al] = 0;
    }
    for (var l = 0; l < tierCount; l++) {
      if (l < tierCount - 1) {
        afterLuck[l] += probs[l] * (1 - cappedLuck);
        afterLuck[l + 1] += probs[l] * cappedLuck;
      } else {
        afterLuck[l] += probs[l];
      }
    }
    probs = afterLuck;
  }

  // Build effective rates output
  var effectiveRates = {};
  for (var e = 0; e < tierCount; e++) {
    // Round to 6 decimal places to avoid floating point noise
    effectiveRates[RARITY_TIERS[e].id] = Math.round(probs[e] * 1000000) / 1000000;
  }

  // Race modifiers output
  var raceModifiers = {
    poolBias: RACE_POOL_BIAS[raceId] || null,
    rarityBump: isCatFolk ? CATFOLK_RARITY_BUMP : 0,
  };

  // Pity info output
  var pityInfo = {
    pullsSinceLegendary: pity,
    softPityStart: SOFT_PITY_START,
    hardPity: HARD_PITY,
    softPityRate: SOFT_PITY_RATE,
    softPityActive: pity > SOFT_PITY_START,
    hardPityActive: hardPityActive,
    currentBoost: softPityBoost,
  };

  // Pack info
  var packInfo = {
    cardsPerPack: CARDS_PER_PACK_MIN === CARDS_PER_PACK_MAX
      ? String(CARDS_PER_PACK_MIN)
      : (CARDS_PER_PACK_MIN + '-' + CARDS_PER_PACK_MAX),
    guarantees: 'Guaranteed Legendary at ' + HARD_PITY + ' pulls without one',
  };

  return {
    baseRates: baseRatesOut,
    effectiveRates: effectiveRates,
    raceModifiers: raceModifiers,
    pityInfo: pityInfo,
    packInfo: packInfo,
  };
}

// ---------------------------------------------------------------------------
// Card Fusion Logic
// ---------------------------------------------------------------------------

function canFuseCards(card1, card2) {
  if (!card1 || !card2) return { ok: false, error: 'Invalid cards' };
  if (card1.instanceId === card2.instanceId) return { ok: false, error: 'Cannot fuse a card with itself' };
  if (card1.rarity !== card2.rarity) return { ok: false, error: 'Cards must be the same rarity' };
  if (card1.rarity === 'relic') return { ok: false, error: 'Relic cards cannot be fused' };
  if (card1.fusionCount >= MAX_FUSION_COUNT) return { ok: false, error: 'Card 1 has reached max fusion count' };
  if (card2.fusionCount >= MAX_FUSION_COUNT) return { ok: false, error: 'Card 2 has reached max fusion count' };
  return { ok: true };
}

function fuseCards(card1, card2) {
  var check = canFuseCards(card1, card2);
  if (!check.ok) return { error: check.error };

  var currentRarity = RARITY_BY_ID[card1.rarity];
  if (!currentRarity || currentRarity.order >= RARITY_TIERS.length - 1) {
    return { error: 'Cannot fuse to higher rarity' };
  }
  var nextRarity = RARITY_TIERS[currentRarity.order + 1];
  var newFusionCount = Math.max(card1.fusionCount, card2.fusionCount) + 1;

  // Merge effects: if same card type, stack numeric effects
  var mergedEffects;
  if (card1.type === card2.type && card1.cardId === card2.cardId) {
    mergedEffects = JSON.parse(JSON.stringify(card1.effects));
    for (var i = 0; i < mergedEffects.length; i++) {
      if (typeof mergedEffects[i].value === 'number') {
        var card2Val = (card2.effects[i] && typeof card2.effects[i].value === 'number') ? card2.effects[i].value : 0;
        mergedEffects[i].value = Math.round(Math.max(mergedEffects[i].value, card2Val) * 1.05 * 100) / 100;
      }
      if (typeof mergedEffects[i].base === 'number') {
        var card2Base = (card2.effects[i] && typeof card2.effects[i].base === 'number') ? card2.effects[i].base : 0;
        mergedEffects[i].base = Math.round(Math.max(mergedEffects[i].base, card2Base) * 1.05);
      }
    }
  } else {
    // Different types: keep card1's effects with 10% bonus
    mergedEffects = JSON.parse(JSON.stringify(card1.effects));
    for (var j = 0; j < mergedEffects.length; j++) {
      if (typeof mergedEffects[j].value === 'number') {
        mergedEffects[j].value = Math.round(mergedEffects[j].value * 1.10 * 100) / 100;
      }
      if (typeof mergedEffects[j].base === 'number') {
        mergedEffects[j].base = Math.round(mergedEffects[j].base * 1.10);
      }
    }
  }

  // Apply fusion level bonus (+5% per fusion level)
  var fusionBonus = 1 + (newFusionCount * 0.05);
  for (var k = 0; k < mergedEffects.length; k++) {
    if (typeof mergedEffects[k].value === 'number') {
      mergedEffects[k].value = Math.round(mergedEffects[k].value * fusionBonus * 100) / 100;
    }
    if (typeof mergedEffects[k].base === 'number') {
      mergedEffects[k].base = Math.round(mergedEffects[k].base * fusionBonus);
    }
  }

  // Inherit best style from either card
  var STYLE_ORDER = ['normal', 'holographic', 'golden', 'prismatic', 'void'];
  var styleIdx1 = STYLE_ORDER.indexOf(card1.style || 'normal');
  var styleIdx2 = STYLE_ORDER.indexOf(card2.style || 'normal');
  var fusedStyle = STYLE_ORDER[Math.max(styleIdx1, styleIdx2)];
  var fusedBorderEffect = CARD_STYLES[fusedStyle] ? CARD_STYLES[fusedStyle].borderEffect : null;

  var fusedCard = {
    instanceId: crypto.randomBytes(8).toString('hex'),
    cardId: card1.cardId,
    name: card1.name + ' +' + newFusionCount,
    type: card1.type,
    rarity: nextRarity.id,
    effects: mergedEffects,
    icon: card1.icon,
    fusionCount: newFusionCount,
    fusionLineage: [card1.instanceId, card2.instanceId],
    obtainedAt: Date.now(),
    source: 'fusion',
    style: fusedStyle,
    borderEffect: fusedBorderEffect,
    serial: generateSerial(),
  };

  return { card: fusedCard };
}

// ---------------------------------------------------------------------------
// Overall Level XP
// ---------------------------------------------------------------------------

const MAX_OVERALL_LEVEL = Infinity;
const XP_SPILLOVER_RATE = 0.10; // 10% of skill XP spills to overall

function overallXpForLevel(n) {
  return Math.floor(200 * Math.pow(n, 1.6));
}

// Active card slot unlocks: levels 1, 10, 20, 30
function getActiveCardSlotCount(level) {
  if (level >= 30) return 4;
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  return 1;
}

// Passive card slot unlocks: levels 5, 15, 25
function getPassiveCardSlotCount(level) {
  if (level >= 25) return 3;
  if (level >= 15) return 2;
  if (level >= 5) return 1;
  return 0;
}

// Total card slots (backward compat)
function getCardSlotCount(level) {
  return getActiveCardSlotCount(level) + getPassiveCardSlotCount(level);
}

// Check if a card type belongs in an active slot
function isActiveCardType(type) {
  return type === 'active_ability';
}

// Stat points: 1 every 3 levels (starting at level 3)
function getStatPointsForLevel(level) {
  return Math.floor(level / STAT_POINTS_PER_LEVELS);
}

// ---------------------------------------------------------------------------
// New Biome Resource Tables (additive to existing worldgen tables)
// ---------------------------------------------------------------------------

const NEW_BIOME_RESOURCES = {
  PLAINS: [
    { type: 'wheat', name: 'Wheat Field', skill: 'farming', minLevel: 1, xp: 12, weight: 4 },
    { type: 'herbs', name: 'Wild Herbs', skill: 'farming', minLevel: 1, xp: 10, weight: 3 },
    { type: 'vegetables', name: 'Vegetable Patch', skill: 'farming', minLevel: 1, xp: 10, weight: 3 },
    { type: 'copper_ore', name: 'Copper Vein', skill: 'mining', minLevel: 1, xp: 10, weight: 3 },
  ],
  BEACH: [
    { type: 'fish_spot', name: 'Fishing Spot', skill: 'fishing', minLevel: 1, xp: 12, weight: 5 },
    { type: 'shellfish_spot', name: 'Shellfish Bed', skill: 'fishing', minLevel: 2, xp: 15, weight: 3 },
    { type: 'seaweed_spot', name: 'Seaweed Patch', skill: 'fishing', minLevel: 1, xp: 8, weight: 2 },
  ],
  SWAMP: [
    { type: 'herbs', name: 'Swamp Herbs', skill: 'farming', minLevel: 2, xp: 15, weight: 4 },
    { type: 'fish_spot', name: 'Muddy Pool', skill: 'fishing', minLevel: 1, xp: 12, weight: 3 },
    { type: 'mushroom', name: 'Mushroom Cluster', skill: 'farming', minLevel: 1, xp: 10, weight: 3 },
  ],
  SCORCHED_SANDS: [
    { type: 'glass_sand', name: 'Glass Sand Deposit', skill: 'glassworking', minLevel: 1, xp: 15, weight: 6 },
    { type: 'gem_rough', name: 'Rough Gem Vein', skill: 'mining', minLevel: 5, xp: 30, weight: 4 },
  ],
  CLOCKWORK_HARBOR: [
    { type: 'cogs', name: 'Scattered Cogs', skill: 'cogworking', minLevel: 1, xp: 12, weight: 5 },
    { type: 'springs', name: 'Broken Springs', skill: 'cogworking', minLevel: 2, xp: 15, weight: 3 },
    { type: 'gears', name: 'Gear Assembly', skill: 'cogworking', minLevel: 3, xp: 20, weight: 2 },
  ],
  ELVEN_SOUTH: [
    { type: 'herbs', name: 'Ancient Herbs', skill: 'farming', minLevel: 3, xp: 20, weight: 3 },
    { type: 'mana_crystal_node', name: 'Mana Crystal', skill: 'magic', minLevel: 5, xp: 30, weight: 2 },
  ],
  HOLY_DOMINION: [
    { type: 'wheat', name: 'Dominion Wheat', skill: 'farming', minLevel: 1, xp: 10, weight: 3 },
    { type: 'herbs', name: 'Temple Herbs', skill: 'farming', minLevel: 2, xp: 12, weight: 2 },
  ],
  MOUNTAIN: [
    { type: 'copper_ore', name: 'Copper Vein', skill: 'mining', minLevel: 1, xp: 10, weight: 5 },
    { type: 'silver_ore', name: 'Silver Vein', skill: 'mining', minLevel: 8, xp: 35, weight: 2 },
  ],
  SNOW_MOUNTAINS: [
    { type: 'silver_ore', name: 'Frozen Silver Vein', skill: 'mining', minLevel: 8, xp: 35, weight: 3 },
    { type: 'mithril_ore', name: 'Mithril Deposit', skill: 'mining', minLevel: 15, xp: 60, weight: 1 },
  ],
  VOLCANIC: [
    { type: 'gold_ore', name: 'Gold Vein', skill: 'mining', minLevel: 10, xp: 45, weight: 2 },
    { type: 'iron_ore', name: 'Volcanic Iron', skill: 'mining', minLevel: 3, xp: 18, weight: 4 },
  ],
  DARK_FOREST: [
    { type: 'copper_ore', name: 'Hidden Copper Vein', skill: 'mining', minLevel: 1, xp: 12, weight: 3 },
    { type: 'bronze_ore', name: 'Forest Bronze Deposit', skill: 'mining', minLevel: 3, xp: 18, weight: 2 },
  ],
  DESERT: [
    { type: 'gold_ore', name: 'Desert Gold Vein', skill: 'mining', minLevel: 10, xp: 45, weight: 2 },
    { type: 'copper_ore', name: 'Sandstone Copper', skill: 'mining', minLevel: 2, xp: 12, weight: 3 },
  ],
};

// ---------------------------------------------------------------------------
// New Crafting Recipes
// ---------------------------------------------------------------------------

const NEW_RECIPES = {
  bronze_bar: {
    station: 'forge',
    cost: { bronze_ore: 2 },
    output: { type: 'bronze_bar', name: 'Bronze Bar' },
    resource: 'bronze_bar',
    skillReq: { crafting: 3 },
  },
  copper_bar: {
    station: 'forge',
    cost: { copper_ore: 2 },
    output: { type: 'copper_bar', name: 'Copper Bar' },
    resource: 'copper_bar',
    skillReq: { crafting: 1 },
  },
  silver_bar: {
    station: 'forge',
    cost: { silver_ore: 2 },
    output: { type: 'silver_bar', name: 'Silver Bar' },
    resource: 'silver_bar',
    skillReq: { crafting: 8 },
  },
  gold_bar: {
    station: 'forge',
    cost: { gold_ore: 2 },
    output: { type: 'gold_bar', name: 'Gold Bar' },
    resource: 'gold_bar',
    skillReq: { crafting: 12 },
  },
  steel_bar: {
    station: 'forge',
    cost: { iron_bar: 2, bronze_bar: 1 },
    output: { type: 'steel_bar', name: 'Steel Bar' },
    resource: 'steel_bar',
    skillReq: { crafting: 10 },
  },
  mithril_bar: {
    station: 'forge',
    cost: { mithril_ore: 3, mana_crystal: 1 },
    output: { type: 'mithril_bar', name: 'Mithril Bar' },
    resource: 'mithril_bar',
    skillReq: { crafting: 18 },
  },
  cooked_fish: {
    station: 'forge',
    cost: { fish: 1 },
    output: { type: 'cooked_fish', name: 'Cooked Fish' },
    resource: 'cooked_fish',
    skillReq: { cooking: 1 },
  },
  bread: {
    station: 'forge',
    cost: { wheat: 3 },
    output: { type: 'bread', name: 'Bread' },
    resource: 'bread',
    skillReq: { cooking: 2 },
  },
  stew: {
    station: 'forge',
    cost: { cooked_fish: 1, vegetables: 2, herbs: 1 },
    output: { type: 'stew', name: 'Hearty Stew' },
    resource: 'stew',
    skillReq: { cooking: 5 },
  },
  glass: {
    station: 'forge',
    cost: { glass_sand: 3 },
    output: { type: 'glass', name: 'Glass' },
    resource: 'glass',
    skillReq: { glassworking: 1 },
  },
  glass_lens: {
    station: 'forge',
    cost: { glass: 2 },
    output: { type: 'glass_lens', name: 'Glass Lens' },
    resource: 'glass_lens',
    skillReq: { glassworking: 5 },
  },
  glass_vial: {
    station: 'forge',
    cost: { glass: 1 },
    output: { type: 'glass_vial', name: 'Glass Vial' },
    resource: 'glass_vial',
    skillReq: { glassworking: 3 },
  },
  clockwork_core: {
    station: 'anvil',
    cost: { cogs: 5, gears: 3, springs: 2 },
    output: { type: 'clockwork_core', name: 'Clockwork Core' },
    resource: 'clockwork_core',
    skillReq: { cogworking: 10 },
  },
  potion_health: {
    station: 'none',
    cost: { herbs: 3, glass_vial: 1 },
    output: { type: 'potion_health', name: 'Health Potion' },
    resource: 'potion_health',
    skillReq: { cooking: 5 },
  },
  potion_mana: {
    station: 'none',
    cost: { mana_crystal: 1, glass_vial: 1 },
    output: { type: 'potion_mana', name: 'Mana Potion' },
    resource: 'potion_mana',
    skillReq: { magic: 5 },
  },
  gem_cut: {
    station: 'anvil',
    cost: { gem_rough: 1 },
    output: { type: 'gem_cut', name: 'Cut Gem' },
    resource: 'gem_cut',
    skillReq: { crafting: 8 },
  },
  torch: {
    station: 'none',
    cost: { wood: 2, herbs: 1 },
    output: { type: 'torch', name: 'Torch', count: 3 },
    resource: 'torch',
    skillReq: { crafting: 1 },
  },
  lantern: {
    station: 'forge',
    cost: { iron_bar: 2, glass: 1, oil: 1 },
    output: { type: 'lantern', name: 'Lantern' },
    resource: 'lantern',
    skillReq: { crafting: 8 },
  },
  oil: {
    station: 'none',
    cost: { herbs: 2, mushroom: 1 },
    output: { type: 'oil', name: 'Oil Flask', count: 2 },
    resource: 'oil',
    skillReq: { cooking: 3 },
  },

  // ===== CORRUPTION CLEANSING =====
  purification_crystal: {
    station: 'none',
    cost: { mana_crystal: 5, gem_cut: 3, herbs: 1 },
    output: { type: 'purification_crystal', name: 'Purification Crystal' },
    resource: 'purification_crystal',
    skillReq: { magic: 15 },
  },

  // ===== SEWING MATERIAL PROCESSING (loom station) =====
  leather: {
    station: 'loom',
    cost: { hide: 2 },
    output: { type: 'leather', name: 'Leather' },
    resource: 'leather',
    skillReq: { sewing: 1 },
  },
  thread: {
    station: 'loom',
    cost: { wool: 2 },
    output: { type: 'thread', name: 'Thread' },
    resource: 'thread',
    skillReq: { sewing: 1 },
  },
  cloth: {
    station: 'loom',
    cost: { thread: 3 },
    output: { type: 'cloth', name: 'Cloth' },
    resource: 'cloth',
    skillReq: { sewing: 2 },
  },
  silk_cloth: {
    station: 'loom',
    cost: { silk: 2, thread: 1 },
    output: { type: 'silk_cloth', name: 'Silk Cloth' },
    resource: 'silk_cloth',
    skillReq: { sewing: 12 },
  },
};

// ---------------------------------------------------------------------------
// NPC Card Vendor Prices
// ---------------------------------------------------------------------------

const CARD_VENDOR_PRICES = {
  common: 50,
  uncommon: 200,
};

const CARD_BUYBACK_RATE = 0.25; // 25% of base value

const RARITY_BASE_VALUE = {
  common: 50,
  uncommon: 200,
  rare: 500,
  ultra_rare: 1500,
  mythic_rare: 5000,
  legendary: 15000,
  godly: 50000,
  relic: 200000,
};

// ---------------------------------------------------------------------------
// Auction House Defaults
// ---------------------------------------------------------------------------

const AUCTION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const AUCTION_MIN_PRICE = 10;
const AUCTION_MAX_LISTINGS_PER_PLAYER = 10;

// ---------------------------------------------------------------------------
// Icon Registry - maps item/resource types to icon paths
// ---------------------------------------------------------------------------

const ICON_REGISTRY = {
  // Resources
  wood: 'resourcesandfood/Logs.PNG',
  stone: 'resourcesandfood/Stones.PNG',
  iron_ore: 'resourcesandfood/Mineral.PNG',
  iron_bar: 'resourcesandfood/Res_07_ironbar.PNG',
  copper_ore: 'resourcesandfood/Res_02_cooperbar.PNG',
  copper_bar: 'resourcesandfood/CopperBar.PNG',
  bronze_ore: 'resourcesandfood/Res_02_cooperbar.PNG',
  bronze_bar: 'resourcesandfood/CopperBar.PNG',
  silver_ore: 'resourcesandfood/Res_01_silverbar.PNG',
  silver_bar: 'resourcesandfood/SilverBar.PNG',
  gold_ore: 'resourcesandfood/MineralGold.PNG',
  gold_bar: 'resourcesandfood/Res_03_goldenbar.PNG',
  steel_bar: 'resourcesandfood/Res_07_ironbar.PNG',
  mithril_ore: 'resourcesandfood/Res_05_magicbar.PNG',
  mithril_bar: 'resourcesandfood/Res_06_magicbar.PNG',
  mana_crystal: 'resourcesandfood/Res_25_crystal.PNG',
  gem_rough: 'resourcesandfood/Res_75_crystalS.PNG',
  gem_cut: 'resourcesandfood/Res_76_crystalRed.PNG',
  dungeon_essence: 'resourcesandfood/Res_167_MageCrystal.PNG',
  dark_crystal: 'resourcesandfood/Res_109_brokenCrystal.PNG',
  boss_trophy: 'loot/Loot_34_necklace.PNG',
  fish: 'resourcesandfood/FishRed.PNG',
  cooked_fish: 'resourcesandfood/FishRedFried.PNG',
  shellfish: 'resourcesandfood/Shell.PNG',
  seaweed: 'resourcesandfood/Res_59_seaweed.PNG',
  wheat: 'resourcesandfood/Spikelets.PNG',
  herbs: 'resourcesandfood/Res_52_leaves.PNG',
  vegetables: 'resourcesandfood/Vegetables.PNG',
  mushroom: 'resourcesandfood/Mushrooms.PNG',
  bread: 'resourcesandfood/Bread.PNG',
  stew: 'resourcesandfood/BowlMeat.PNG',
  glass_sand: 'resourcesandfood/Res_08_stones.PNG',
  glass: 'resourcesandfood/Res_104_colb.PNG',
  glass_lens: 'resourcesandfood/Res_105_colbEmpty.PNG',
  glass_vial: 'resourcesandfood/Res_105_colbEmpty.PNG',
  cogs: 'loot/Loot_52_metal.PNG',
  gears: 'loot/Loot_52_metal.PNG',
  springs: 'loot/Loot_52_metal.PNG',
  clockwork_core: 'loot/Loot_53_sphere.PNG',
  // Potions
  potion_health: 'items/Alchemy_13_heal_potion.PNG',
  potion_mana: 'items/Alchemy_17_blue_potion.PNG',
  potion_stamina: 'items/Alchemy_25_stamina_potion.PNG',
  potion_strength: 'items/Alchemy_24_energy_potion.PNG',
  potion_defense: 'items/Alchemy_26_immortal_potion.PNG',
  potion_speed: 'items/Alchemy_35_invisibility_flask.PNG',
  // Coins and currency
  coins: 'resourcesandfood/GoldCoin.PNG',
  // Building materials
  forge: 'buildingmaterialicons/Forge.PNG',
  iron_anvil: 'buildingmaterialicons/Anvil.PNG',
  storage_chest: 'buildingmaterialicons/MetalChest.PNG',
  wall: 'buildingmaterialicons/StoneWall.PNG',
  door: 'buildingmaterialicons/Gates.PNG',
  bridge: 'buildingmaterialicons/PlatformWithWood.PNG',
  plot_stake: 'buildingmaterialicons/Stakes.PNG',
  // Tools
  iron_axe: 'buildingmaterialicons/BasicAxe.PNG',
  iron_pickaxe: 'buildingmaterialicons/BasicPick.PNG',
  // Loot
  iron_lock: 'quest/Quest_112_lock.PNG',
  key: 'loot/Loot_54_key.PNG',
  // Quest items
  quest_scroll: 'quest/Quest_17_scroll.PNG',
  quest_map: 'loot/Loot_153_map.PNG',
  // Skills
  skill_attack: 'skills/Skill_Attack.PNG',
  skill_defense: 'skills/Skill_Defence.PNG',
  skill_mining: 'skills/Skill_Mining.PNG',
  skill_logging: 'skills/Skill_Logging.PNG',
  skill_heal: 'skills/Skill_Heal.PNG',
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

// Compute combat speed for turn-based initiative (CT system)
// Base from race, modified by finesse stat and equipped card effects
function computeCombatSpeed(raceId, finesse, equippedCards) {
  var race = raceId ? RACES[raceId] : null;
  var base = (race && race.baseSpeed) ? race.baseSpeed : 10;
  // Finesse adds 0.5 speed per point above base (5)
  var finesseBonus = Math.max(0, ((finesse || 5) - 5) * 0.5);
  var cardBonus = 0;
  if (equippedCards && Array.isArray(equippedCards)) {
    for (var i = 0; i < equippedCards.length; i++) {
      var card = equippedCards[i];
      if (!card || !card.effects) continue;
      for (var j = 0; j < card.effects.length; j++) {
        var eff = card.effects[j];
        if (eff.type === 'speed_bonus') cardBonus += (eff.value || 0);
      }
    }
  }
  return Math.max(1, Math.floor((base + finesseBonus + cardBonus) * 10) / 10);
}

// ---------------------------------------------------------------------------
// Elemental Weakness/Resistance Table (Fix 2)
// ---------------------------------------------------------------------------

var ELEMENTAL_TABLE = {
  fire:      { weak: ['ice', 'wind'],       resist: ['fire'],                absorb: [] },
  ice:       { weak: ['fire', 'lightning'],  resist: ['ice'],                absorb: [] },
  lightning: { weak: ['earth'],              resist: ['lightning', 'wind'],   absorb: [] },
  earth:     { weak: ['wind', 'ice'],        resist: ['earth', 'lightning'], absorb: [] },
  holy:      { weak: ['dark'],               resist: ['holy'],               absorb: [] },
  dark:      { weak: ['holy'],               resist: ['dark'],               absorb: [] },
  poison:    { weak: ['holy', 'fire'],       resist: ['poison', 'dark'],     absorb: [] },
  wind:      { weak: ['lightning', 'earth'], resist: ['wind'],               absorb: [] },
  arcane:    { weak: [],                     resist: [],                      absorb: [] },
};

function getElementalMultiplier(attackElement, defenderElement) {
  if (!attackElement || !defenderElement) return 1.0;
  // Look up defender's elemental properties
  var defEntry = ELEMENTAL_TABLE[defenderElement];
  if (!defEntry) return 1.0;
  // Defender absorbs this element: negative damage (heals)
  if (defEntry.absorb.indexOf(attackElement) >= 0) return -0.5;
  // Defender is weak to this element: super effective
  if (defEntry.weak.indexOf(attackElement) >= 0) return 1.5;
  // Defender resists this element: reduced damage
  if (defEntry.resist.indexOf(attackElement) >= 0) return 0.7;
  return 1.0;
}

// ---------------------------------------------------------------------------
// Weapon Damage Types & Armor Physical Resistance (Fix 3)
// ---------------------------------------------------------------------------

var WEAPON_DAMAGE_TYPES = {
  // Category-based keys (matching accounts.js WEAPON_TYPES categories)
  melee_blade: 'slash', melee_blunt: 'blunt', archery: 'pierce', magic: 'blunt',
  // Individual weapon name keys (fallback for fine-grained lookup)
  sword: 'slash', dagger: 'pierce', axe: 'slash', mace: 'blunt',
  spear: 'pierce', staff: 'blunt', bow: 'pierce', crossbow: 'pierce',
  hammer: 'blunt', fist: 'blunt', whip: 'slash', thrown: 'pierce',
};

var ARMOR_PHYS_RESIST = {
  plate:   { slash: 0.8, pierce: 0.6, blunt: 0.4 },
  chain:   { slash: 0.7, pierce: 0.5, blunt: 0.6 },
  leather: { slash: 0.5, pierce: 0.4, blunt: 0.7 },
  cloth:   { slash: 0.3, pierce: 0.3, blunt: 0.3 },
  none:    { slash: 0, pierce: 0, blunt: 0 },
};

// ---------------------------------------------------------------------------
// Full Damage Type System (Task 2 — larger than OSRS combat triangle)
// ---------------------------------------------------------------------------

var DAMAGE_TYPES = {
  // Physical subtypes
  slashing:  { id: 'slashing',  name: 'Slashing',  category: 'physical' },
  piercing:  { id: 'piercing',  name: 'Piercing',  category: 'physical' },
  blunt:     { id: 'blunt',     name: 'Blunt',     category: 'physical' },
  ranged:    { id: 'ranged',    name: 'Ranged',    category: 'physical' },
  // Elemental
  fire:      { id: 'fire',      name: 'Fire',      category: 'elemental' },
  ice:       { id: 'ice',       name: 'Ice',       category: 'elemental' },
  lightning: { id: 'lightning', name: 'Lightning', category: 'elemental' },
  earth:     { id: 'earth',     name: 'Earth',     category: 'elemental' },
  wind:      { id: 'wind',      name: 'Wind',      category: 'elemental' },
  water:     { id: 'water',     name: 'Water',     category: 'elemental' },
  // Magical
  arcane:    { id: 'arcane',    name: 'Arcane',    category: 'magical' },
  holy:      { id: 'holy',      name: 'Holy',      category: 'magical' },
  shadow:    { id: 'shadow',    name: 'Shadow',    category: 'magical' },
  nature:    { id: 'nature',    name: 'Nature',    category: 'magical' },
  poison:    { id: 'poison',    name: 'Poison',    category: 'magical' },
  // Special
  true:      { id: 'true',      name: 'True',      category: 'special' },
};

// Effectiveness multiplier matrix.
// Key = attacking damage type, value = { targetType: multiplier }.
// Only non-1.0 entries are stored. 1.0 (neutral) is the default.
// 1.5 = strong against, 0.5 = weak against.
var DAMAGE_TYPE_EFFECTIVENESS = {
  // Physical interactions
  slashing:  { nature: 1.5, lightning: 0.5, chain: 1.5 },
  piercing:  { wind: 1.5, earth: 0.5, plate: 1.5 },
  blunt:     { earth: 1.5, fire: 0.5, ice: 1.5 },
  ranged:    { fire: 1.5, wind: 0.5, lightning: 1.5 },

  // Elemental cycle: fire > ice > wind > earth > lightning > water > fire
  fire:      { ice: 1.5, water: 0.5, nature: 1.5 },
  ice:       { wind: 1.5, fire: 0.5, water: 1.5 },
  wind:      { earth: 1.5, ice: 0.5, ranged: 1.5 },
  earth:     { lightning: 1.5, wind: 0.5, blunt: 1.5 },
  lightning: { water: 1.5, earth: 0.5, piercing: 1.5 },
  water:     { fire: 1.5, lightning: 0.5, earth: 1.5 },

  // Holy <> Shadow mutual weakness
  holy:      { shadow: 1.5, holy: 0.5 },
  shadow:    { holy: 1.5, shadow: 0.5 },

  // Arcane is neutral to everything (no entries = all 1.0)
  arcane:    {},

  // Nature and Poison
  nature:    { water: 1.5, fire: 0.5, earth: 1.5 },
  poison:    { nature: 1.5, holy: 0.5, earth: 0.5 },

  // True damage ignores all — handled specially in calculateDamageMultiplier
  true:      {},
};

// Armor material resistance types.
// Each material has resistances (>1.0 = takes more damage) and strengths (<1.0 = takes less).
// Values represent the damage multiplier applied when this armor type is hit by the given damage type.
var ARMOR_RESISTANCE_TYPES = {
  cloth:      { resist: { arcane: 0.7 },     weak: { slashing: 1.5 } },
  leather:    { resist: { nature: 0.7 },      weak: { fire: 1.5 } },
  chain:      { resist: { slashing: 0.7 },    weak: { blunt: 1.5 } },
  plate:      { resist: { piercing: 0.7 },     weak: { lightning: 1.5 } },
  enchanted:  { resist: { shadow: 0.7 },       weak: { holy: 1.5 } },
  mithril:    { resist: { slashing: 0.9, piercing: 0.9, blunt: 0.9, ranged: 0.9 }, weak: { arcane: 1.5 } },
  none:       { resist: {}, weak: {} },
};

// Map weapon ability damage types by weapon family.
// Each family has a default and per-ability overrides.
var WEAPON_ABILITY_DAMAGE_TYPES = {
  sword:   { default: 'slashing',  overrides: { execute: 'slashing' } },
  axe:     { default: 'slashing',  overrides: { decapitate: 'slashing' } },
  bow:     { default: 'ranged',    overrides: { quick_shot: 'piercing', power_shot: 'piercing', snipe: 'piercing', rain_of_arrows: 'ranged', evasive_roll: null } },
  staff:   { default: 'arcane',    overrides: { magic_bolt: 'arcane', fireball_ab: 'fire', ice_wall_ab: 'ice', meteor_ab: 'fire', mana_shield_ab: null } },
  wand:    { default: 'arcane',    overrides: { spark: 'lightning', chain_lightning_ab: 'lightning', hex: 'shadow', arcane_barrage: 'arcane', barrier: null } },
  dagger:  { default: 'piercing',  overrides: { poison_blade_ab: 'poison', smoke_bomb_ab: null } },
  mace:    { default: 'blunt',     overrides: { smite: 'holy', holy_light_ab: 'holy', judgement: 'holy' } },
  spear:   { default: 'piercing',  overrides: { javelin_throw: 'piercing', phalanx: null } },
  hammer:  { default: 'blunt',     overrides: { ground_pound: 'earth', earthquake: 'earth', shatter: 'blunt' } },
  unarmed: { default: 'blunt',     overrides: { dragon_fist: 'blunt' } },
};

// Get the damage type for a specific weapon ability.
// Returns a string from DAMAGE_TYPES, or null for non-damaging abilities.
function getAbilityDamageType(abilityId, weaponFamily) {
  var familyEntry = WEAPON_ABILITY_DAMAGE_TYPES[weaponFamily];
  if (!familyEntry) return 'blunt'; // fallback for unknown weapons
  if (familyEntry.overrides && familyEntry.overrides.hasOwnProperty(abilityId)) {
    return familyEntry.overrides[abilityId]; // may be null for defensive/utility
  }
  return familyEntry.default;
}

// Calculate the damage multiplier given an attacking damage type and the target's resistances.
// targetResistances: { damageType: string|null (from DAMAGE_TYPE_EFFECTIVENESS lookup),
//                      armorType: string|null (from ARMOR_RESISTANCE_TYPES lookup),
//                      elementalType: string|null (creature element for ELEMENTAL_TABLE),
//                      resistances: { element: mult } | null (per-element damage reduction),
//                      weaknesses:  { element: mult } | null (per-element damage increase) }
// Returns a multiplier >= 0.25 (floor to prevent near-zero damage).
function calculateDamageMultiplier(damageType, targetResistances) {
  if (!damageType) return 1.0;

  // True damage ignores all resistances
  if (damageType === 'true') return 1.0;

  var multiplier = 1.0;
  var res = targetResistances || {};

  // 1. Check DAMAGE_TYPE_EFFECTIVENESS matrix
  var effEntry = DAMAGE_TYPE_EFFECTIVENESS[damageType];
  if (effEntry) {
    // Check against target's elemental type (e.g., a fire monster)
    if (res.elementalType && effEntry[res.elementalType]) {
      multiplier *= effEntry[res.elementalType];
    }
    // Check against target's damage type alignment (e.g., creature with slashing attacks = slashing alignment)
    if (res.damageAlignment && effEntry[res.damageAlignment]) {
      multiplier *= effEntry[res.damageAlignment];
    }
  }

  // 2. Check armor material resistance
  if (res.armorType) {
    var armorEntry = ARMOR_RESISTANCE_TYPES[res.armorType];
    if (armorEntry) {
      // Armor resists (reduces damage)
      if (armorEntry.resist && armorEntry.resist[damageType]) {
        multiplier *= armorEntry.resist[damageType];
      }
      // Armor weaknesses (increases damage)
      if (armorEntry.weak && armorEntry.weak[damageType]) {
        multiplier *= armorEntry.weak[damageType];
      }
    }
  }

  // 3. Check per-element resistances map (from dungeon enemy templates)
  // resistances: { fire: 0.5 } means takes 50% fire damage (multiplier applied directly)
  if (res.resistances && res.resistances[damageType] != null) {
    multiplier *= res.resistances[damageType];
  }

  // 4. Check per-element weaknesses map (from dungeon enemy templates)
  // weaknesses: { ice: 1.5 } means takes 150% ice damage (multiplier applied directly)
  if (res.weaknesses && res.weaknesses[damageType] != null) {
    multiplier *= res.weaknesses[damageType];
  }

  // Floor at 0.25 to prevent near-zero damage, cap at 3.0 to prevent one-shots
  return Math.max(0.25, Math.min(3.0, multiplier));
}

// Convenience: build target resistance object from a monster definition.
// Returns the standard resistance object used by calculateDamageMultiplier,
// plus optional per-element resistances/weaknesses maps from dungeon-data.
function getMonsterResistances(monster) {
  if (!monster) return { elementalType: null, armorType: 'none', damageAlignment: null, resistances: null, weaknesses: null, damageType: null };
  return {
    elementalType:   monster.element        || null,
    armorType:       monster.armorType      || 'none',
    damageAlignment: monster.damageAlignment || null,
    resistances:     monster.resistances    || null,
    weaknesses:      monster.weaknesses     || null,
    damageType:      monster.damageType     || null,
  };
}

// Card active ability cooldowns by rarity (default cooldowns in seconds)
var CARD_ABILITY_COOLDOWNS = {
  common: 5,
  uncommon: 8,
  rare: 12,
  ultra_rare: 15,
  mythic_rare: 20,
  legendary: 25,
  godly: 30,
  relic: 30,
};

// Get effective cooldown for a card ability, applying card modifier reductions
function getCardAbilityCooldown(cardTemplate, cardMods) {
  if (!cardTemplate) return 0;
  // Use card-specific cooldown if defined, else use rarity-based default
  var baseCd = cardTemplate.cooldown || CARD_ABILITY_COOLDOWNS[cardTemplate.rarity] || 12;
  // Apply global cooldown reduction from ability modifier cards
  var reduction = cardMods ? (cardMods.globalCooldownReduction || 0) : 0;
  reduction = Math.min(reduction, 0.50);
  return Math.max(1, Math.round(baseCd * (1 - reduction)));
}

// Get effective mana cost for a card ability, applying card modifier reductions
function getCardAbilityManaCost(cardTemplate, cardMods) {
  if (!cardTemplate) return 0;
  var cost = cardTemplate.manaCost || 0;
  if (cost <= 0) return 0;
  var reduction = cardMods ? (cardMods.manaReduction || 0) : 0;
  reduction = Math.min(reduction, 0.50);
  return Math.max(1, Math.round(cost * (1 - reduction)));
}

// ---------------------------------------------------------------------------
// Skill Level Combat Bonuses (Fix 4)
// ---------------------------------------------------------------------------

function getCombatSkillBonuses(skills, weaponCategory) {
  skills = skills || {};
  var cat = weaponCategory || '';
  var primary = 'melee';
  // Match actual weapon categories from accounts.js WEAPON_TYPES
  if (cat === 'archery' || cat === 'bow' || cat === 'crossbow' || cat === 'thrown') primary = 'archery';
  else if (cat === 'magic' || cat === 'staff' || cat === 'wand') primary = 'magic';
  // melee_blade, melee_blunt, and anything else defaults to 'melee'
  var level = (skills[primary] && skills[primary].level) || 1;
  return {
    damageBonus: level * 0.01,                       // +1% per level
    critBonus: Math.floor(level / 5) * 0.003,        // +0.3% per 5 levels
    accuracyBonus: level * 0.005,                     // +0.5% per level
  };
}

// ---------------------------------------------------------------------------
// Food Effects (healing + buffs when consumed)
// ---------------------------------------------------------------------------

var FOOD_EFFECTS = {
  // Cooked food
  cooked_fish:   { hpRestore: 20, buff: null },
  bread:         { hpRestore: 15, buff: null },
  stew:          { hpRestore: 40, buff: { stat: 'vigor', value: 2, duration: 120 } },
  mushroom:      { hpRestore: 10, buff: null },
  shellfish:     { hpRestore: 12, buff: null },
  seaweed:       { hpRestore: 8,  buff: { stat: 'resolve', value: 1, duration: 60 } },
  herb_tea:      { hpRestore: 25, buff: { stat: 'focus', value: 2, duration: 90 } },
  grilled_meat:  { hpRestore: 35, buff: { stat: 'might', value: 1, duration: 60 } },
  berry_jam:     { hpRestore: 15, buff: { stat: 'finesse', value: 1, duration: 60 } },

  // Alchemy potions
  potion_health:     { hpRestore: 50, buff: null },
  potion_mana:       { hpRestore: 0,  buff: { stat: 'acumen', value: 2, duration: 60 } },
  potion_strength:   { hpRestore: 0,  buff: { stat: 'might', value: 3, duration: 120 } },
  potion_agility:    { hpRestore: 0,  buff: { stat: 'finesse', value: 3, duration: 120 } },
  potion_intellect:  { hpRestore: 0,  buff: { stat: 'acumen', value: 3, duration: 120 } },
  potion_resistance: { hpRestore: 0,  buff: { stat: 'resolve', value: 3, duration: 120 } },
  potion_speed:      { hpRestore: 0,  buff: { stat: 'finesse', value: 2, duration: 60 } },
  elixir_vigor:      { hpRestore: 50, buff: { stat: 'vigor', value: 5, duration: 180 } },
  elixir_fortitude:  { hpRestore: 30, buff: { stat: 'resolve', value: 5, duration: 180 } },
  antidote:          { hpRestore: 10, buff: { stat: 'resolve', value: 1, duration: 30 } },

  // Brewing drinks
  ale:            { hpRestore: 5,  buff: { stat: 'might', value: 1, duration: 60 } },
  mead:           { hpRestore: 10, buff: { stat: 'vigor', value: 2, duration: 90 } },
  wine:           { hpRestore: 8,  buff: { stat: 'presence', value: 3, duration: 120 } },
  spirits:        { hpRestore: 5,  buff: { stat: 'might', value: 3, duration: 60 } },
  fortified_ale:  { hpRestore: 15, buff: { stat: 'vigor', value: 3, duration: 120 } },
  battle_brew:    { hpRestore: 20, buff: { stat: 'might', value: 4, duration: 180 } },

  // Scrolls (instant buff effects)
  scroll_of_protection: { hpRestore: 0, buff: { stat: 'resolve', value: 5, duration: 180 } },
  scroll_of_strength:   { hpRestore: 0, buff: { stat: 'might', value: 5, duration: 180 } },
  scroll_of_haste:      { hpRestore: 0, buff: { stat: 'finesse', value: 5, duration: 180 } },
};

// ---------------------------------------------------------------------------
// Crafting Skill Perks (unlocked at milestone skill levels)
// ---------------------------------------------------------------------------

var CRAFTING_SKILL_PERKS = {
  crafting: [
    { level: 5,  id: 'efficient_crafter', ingredientSaveChance: 0.10 },
    { level: 10, id: 'quality_work', qualityBonus: 1 },
    { level: 15, id: 'master_smith', flatItemStatBonus: 1 },
    { level: 20, id: 'batch_craft', batchCraftChance: 0.50 },
    { level: 30, id: 'grandmaster', enhancedItemChance: 0.15 },
  ],
  cooking: [
    { level: 3,  id: 'hearty_meals', foodHealMult: 1.25 },
    { level: 7,  id: 'gourmet', foodXpBuff: true },
    { level: 10, id: 'master_cook', foodHealMult: 1.50 },
    { level: 15, id: 'nutritional_expert', foodBuffDurationMult: 1.50 },
    { level: 20, id: 'legendary_chef', feastChance: 0.15 },
  ],
  sewing: [
    { level: 5,  id: 'thrifty_tailor', ingredientSaveChance: 0.05 },
    { level: 10, id: 'fine_stitching', qualityBonus: 0.05 },
    { level: 15, id: 'efficient_weaver', doubleOutputChance: 0.08, ingredientSaveChance: 0.10 },
    { level: 20, id: 'arcane_thread', qualityBonus: 0.15, magicResistBonus: 0.05 },
    { level: 25, id: 'master_tailor', masterTailorChance: 0.10, ingredientSaveChance: 0.15 },
  ],
  alchemy: [
    { level: 5,  id: 'herb_saver', ingredientSaveChance: 0.05 },
    { level: 10, id: 'potent_brews', potionPotencyBonus: 0.10 },
    { level: 15, id: 'double_distill', ingredientSaveChance: 0.10, doublePotionChance: 0.08 },
    { level: 20, id: 'alchemical_mastery', potionPotencyBonus: 0.20, potionDurationBonus: 0.15 },
    { level: 25, id: 'master_alchemist', masterAlchemistChance: 0.12, ingredientSaveChance: 0.15 },
  ],
  enchanting: [
    { level: 5,  id: 'mana_efficiency', enchantPowerBonus: 0.05 },
    { level: 10, id: 'crystal_focus', ingredientSaveChance: 0.05, enchantPowerBonus: 0.10 },
    { level: 15, id: 'double_enchant', doubleEnchantChance: 0.08 },
    { level: 20, id: 'arcane_mastery', enchantPowerBonus: 0.20, preserveBaseChance: 0.10 },
    { level: 25, id: 'master_enchanter', masterEnchantChance: 0.10, ingredientSaveChance: 0.10 },
  ],
  brewing: [
    { level: 5,  id: 'grain_saver', ingredientSaveChance: 0.05 },
    { level: 10, id: 'strong_brew', brewPotencyBonus: 0.10 },
    { level: 15, id: 'double_batch', doubleBatchChance: 0.10, ingredientSaveChance: 0.10 },
    { level: 20, id: 'aged_perfection', brewDurationBonus: 0.20 },
    { level: 25, id: 'master_brewer', masterBrewerChance: 0.12, ingredientSaveChance: 0.15 },
  ],
  leatherworking: [
    { level: 5,  id: 'hide_saver', ingredientSaveChance: 0.05 },
    { level: 10, id: 'quality_tanning', qualityBonus: 0.05 },
    { level: 15, id: 'efficient_tanner', ingredientSaveChance: 0.10, qualityBonus: 0.10 },
    { level: 20, id: 'hardened_leather', craftedArmorBonus: 2, qualityBonus: 0.15 },
    { level: 25, id: 'master_leatherworker', masterLeatherworkerChance: 0.10, ingredientSaveChance: 0.15 },
  ],
  jewelcrafting: [
    { level: 5,  id: 'gem_saver', ingredientSaveChance: 0.05 },
    { level: 10, id: 'gem_yield', qualityBonus: 0.05, gemYieldBonus: 0.10 },
    { level: 15, id: 'precision_cut', ingredientSaveChance: 0.10, qualityBonus: 0.10 },
    { level: 20, id: 'stat_imbue', statBonusOnCraft: 1, qualityBonus: 0.15 },
    { level: 25, id: 'master_jeweler', masterJewelerChance: 0.10, ingredientSaveChance: 0.15 },
  ],
};

function getCraftingSkillBonuses(account) {
  var bonuses = {};
  var skills = account.skills || {};
  var perkKeys = Object.keys(CRAFTING_SKILL_PERKS);
  for (var i = 0; i < perkKeys.length; i++) {
    var skillName = perkKeys[i];
    var skillLevel = (skills[skillName] && skills[skillName].level) ? skills[skillName].level : 1;
    var perks = CRAFTING_SKILL_PERKS[skillName];
    for (var p = 0; p < perks.length; p++) {
      var perk = perks[p];
      if (skillLevel >= perk.level) {
        var perkFields = Object.keys(perk);
        for (var f = 0; f < perkFields.length; f++) {
          var field = perkFields[f];
          // Skip metadata fields
          if (field === 'level' || field === 'id') continue;
          // Accumulate numeric bonuses, assign non-numeric directly
          if (typeof perk[field] === 'number') {
            bonuses[field] = (bonuses[field] || 0) + perk[field];
          } else {
            bonuses[field] = perk[field];
          }
        }
      }
    }
  }
  return bonuses;
}

// ---------------------------------------------------------------------------
// Weapon Abilities -- FFXIV/WoW-style cooldown abilities per weapon family
// ---------------------------------------------------------------------------

function getWeaponFamily(itemType) {
  if (!itemType || typeof itemType !== 'string') return 'unarmed';
  var t = itemType.toLowerCase();
  if (t.indexOf('crossbow') >= 0) return 'bow';
  if (t.indexOf('scythe') >= 0) return 'axe';
  if (t.indexOf('sword') >= 0) return 'sword';
  if (t.indexOf('axe_weapon') >= 0 || t.indexOf('battle_axe') >= 0 || t.indexOf('battleaxe') >= 0) return 'axe';
  if (t.indexOf('bow') >= 0) return 'bow';
  if (t.indexOf('dagger') >= 0) return 'dagger';
  if (t.indexOf('hammer') >= 0) return 'hammer';
  if (t.indexOf('mace') >= 0) return 'mace';
  if (t.indexOf('spear') >= 0) return 'spear';
  if (t.indexOf('staff') >= 0) return 'staff';
  if (t.indexOf('wand') >= 0) return 'wand';
  if (t.indexOf('axe') >= 0) return 'axe';
  return 'unarmed';
}

function getWeaponFamilyFromCategory(category, itemType) {
  if (itemType) return getWeaponFamily(itemType);
  if (!category) return 'unarmed';
  if (category === 'archery') return 'bow';
  if (category === 'magic') return 'staff';
  if (category === 'melee_blunt') return 'mace';
  if (category === 'melee_blade') return 'sword';
  return 'unarmed';
}

var WEAPON_ABILITIES = {
  sword: [
    { id: 'slash', name: 'Slash', cooldown: 0, damage: 1.0, type: 'physical', damageType: 'slashing', description: 'Basic sword attack', manaCost: 0 },
    { id: 'power_strike', name: 'Power Strike', cooldown: 8, damage: 2.5, type: 'physical', damageType: 'slashing', description: 'A powerful overhead strike', manaCost: 5 },
    { id: 'whirlwind_ab', name: 'Whirlwind', cooldown: 15, damage: 1.5, type: 'physical', damageType: 'slashing', aoe: true, description: 'Spin attack hitting all nearby enemies', manaCost: 10 },
    { id: 'parry', name: 'Parry', cooldown: 12, damage: 0, type: 'defensive', effect: 'block_next', duration: 3, description: 'Block the next incoming attack', manaCost: 5 },
    { id: 'execute', name: 'Execute', cooldown: 20, damage: 4.0, type: 'physical', damageType: 'slashing', condition: 'target_below_30hp', description: 'Massive damage to low HP targets', manaCost: 15 },
  ],
  axe: [
    { id: 'chop', name: 'Chop', cooldown: 0, damage: 1.1, type: 'physical', damageType: 'slashing', description: 'Basic axe chop', manaCost: 0 },
    { id: 'cleave', name: 'Cleave', cooldown: 8, damage: 1.8, type: 'physical', damageType: 'slashing', aoe: true, description: 'Wide cleaving strike hitting multiple foes', manaCost: 5 },
    { id: 'rend', name: 'Rend', cooldown: 10, damage: 1.2, type: 'physical', damageType: 'slashing', dot: { tickDamage: 0.3, duration: 4, name: 'bleeding' }, description: 'Inflict a bleeding wound over time', manaCost: 8 },
    { id: 'enrage', name: 'Enrage', cooldown: 20, damage: 0, type: 'buff', effect: 'enrage', duration: 8, buffMultiplier: 1.4, description: 'Enter a rage, boosting damage by 40%', manaCost: 10 },
    { id: 'decapitate', name: 'Decapitate', cooldown: 25, damage: 5.0, type: 'physical', damageType: 'slashing', condition: 'target_below_20hp', description: 'Devastating finishing blow to weakened foes', manaCost: 20 },
  ],
  bow: [
    { id: 'quick_shot', name: 'Quick Shot', cooldown: 0, damage: 0.9, type: 'physical', damageType: 'piercing', description: 'Rapid arrow shot', manaCost: 0 },
    { id: 'power_shot', name: 'Power Shot', cooldown: 8, damage: 2.2, type: 'physical', damageType: 'piercing', description: 'Fully drawn powerful shot', manaCost: 5 },
    { id: 'rain_of_arrows', name: 'Rain of Arrows', cooldown: 18, damage: 1.3, type: 'physical', damageType: 'ranged', aoe: true, description: 'Rain arrows on an area hitting all enemies', manaCost: 15 },
    { id: 'evasive_roll', name: 'Evasive Roll', cooldown: 12, damage: 0, type: 'defensive', effect: 'dodge_buff', duration: 3, dodgeBonus: 0.30, description: 'Roll away greatly increasing dodge for 3s', manaCost: 5 },
    { id: 'snipe', name: 'Snipe', cooldown: 22, damage: 4.5, type: 'physical', damageType: 'piercing', critBonus: 0.25, description: 'Carefully aimed shot with high crit chance', manaCost: 15 },
  ],
  staff: [
    { id: 'magic_bolt', name: 'Magic Bolt', cooldown: 0, damage: 1.0, type: 'magic', element: 'arcane', damageType: 'arcane', description: 'Basic magical bolt', manaCost: 3 },
    { id: 'fireball_ab', name: 'Fireball', cooldown: 10, damage: 2.5, type: 'magic', element: 'fire', damageType: 'fire', aoe: true, description: 'Hurl a ball of fire at enemies', manaCost: 15 },
    { id: 'ice_wall_ab', name: 'Ice Wall', cooldown: 15, damage: 0.8, type: 'magic', element: 'ice', damageType: 'ice', effect: 'slow', slowAmount: 0.5, duration: 4, description: 'Create an ice barrier that slows enemies', manaCost: 12 },
    { id: 'mana_shield_ab', name: 'Mana Shield', cooldown: 20, damage: 0, type: 'defensive', effect: 'mana_shield', duration: 6, absorbPercent: 0.5, description: 'Convert mana into a protective barrier', manaCost: 20 },
    { id: 'meteor_ab', name: 'Meteor', cooldown: 30, damage: 5.0, type: 'magic', element: 'fire', damageType: 'fire', aoe: true, description: 'Call down a devastating meteor', manaCost: 35 },
  ],
  wand: [
    { id: 'spark', name: 'Spark', cooldown: 0, damage: 0.9, type: 'magic', element: 'lightning', damageType: 'lightning', description: 'Quick spark of lightning', manaCost: 2 },
    { id: 'chain_lightning_ab', name: 'Chain Lightning', cooldown: 10, damage: 1.8, type: 'magic', element: 'lightning', damageType: 'lightning', aoe: true, bounces: 3, description: 'Lightning bounces between enemies', manaCost: 12 },
    { id: 'hex', name: 'Hex', cooldown: 14, damage: 0.5, type: 'magic', element: 'dark', damageType: 'shadow', effect: 'weaken', weakenAmount: 0.25, duration: 5, description: 'Curse an enemy weakening their attacks', manaCost: 10 },
    { id: 'barrier', name: 'Barrier', cooldown: 18, damage: 0, type: 'defensive', effect: 'magic_barrier', duration: 5, absorbFlat: 50, description: 'Erect an arcane barrier absorbing damage', manaCost: 15 },
    { id: 'arcane_barrage', name: 'Arcane Barrage', cooldown: 25, damage: 3.5, type: 'magic', element: 'arcane', damageType: 'arcane', aoe: true, description: 'Unleash a barrage of arcane missiles', manaCost: 25 },
  ],
  dagger: [
    { id: 'stab', name: 'Stab', cooldown: 0, damage: 0.8, type: 'physical', damageType: 'piercing', description: 'Quick dagger stab', manaCost: 0 },
    { id: 'backstab_ab', name: 'Backstab', cooldown: 8, damage: 3.0, type: 'physical', damageType: 'piercing', critBonus: 0.15, description: 'Strike from behind for critical damage', manaCost: 5 },
    { id: 'poison_blade_ab', name: 'Poison Blade', cooldown: 12, damage: 1.0, type: 'physical', damageType: 'poison', dot: { tickDamage: 0.4, duration: 5, name: 'poisoned' }, description: 'Coat blade in poison dealing damage over time', manaCost: 8 },
    { id: 'smoke_bomb_ab', name: 'Smoke Bomb', cooldown: 18, damage: 0, type: 'defensive', effect: 'dodge_buff', duration: 4, dodgeBonus: 0.40, description: 'Vanish in smoke greatly increasing evasion', manaCost: 10 },
    { id: 'assassinate', name: 'Assassination', cooldown: 25, damage: 5.5, type: 'physical', damageType: 'piercing', condition: 'target_below_30hp', critBonus: 0.20, description: 'Execute a lethal assassination on weakened foes', manaCost: 20 },
  ],
  mace: [
    { id: 'bash_ab', name: 'Bash', cooldown: 0, damage: 1.0, type: 'physical', damageType: 'blunt', description: 'Basic mace bash', manaCost: 0 },
    { id: 'smite', name: 'Smite', cooldown: 8, damage: 2.0, type: 'magic', element: 'holy', damageType: 'holy', description: 'Channel holy power into a smiting blow', manaCost: 8 },
    { id: 'stun_strike', name: 'Stun Strike', cooldown: 14, damage: 1.5, type: 'physical', damageType: 'blunt', effect: 'stun', duration: 2, description: 'Heavy blow that stuns the target', manaCost: 10 },
    { id: 'holy_light_ab', name: 'Holy Light', cooldown: 16, damage: 0, type: 'heal', healMultiplier: 2.0, description: 'Heal yourself with divine light', manaCost: 15 },
    { id: 'judgement', name: 'Judgement', cooldown: 22, damage: 3.5, type: 'magic', element: 'holy', damageType: 'holy', aoe: true, description: 'Pass divine judgement on all nearby foes', manaCost: 20 },
  ],
  spear: [
    { id: 'thrust', name: 'Thrust', cooldown: 0, damage: 1.0, type: 'physical', damageType: 'piercing', description: 'Basic spear thrust', manaCost: 0 },
    { id: 'impale', name: 'Impale', cooldown: 8, damage: 2.5, type: 'physical', damageType: 'piercing', dot: { tickDamage: 0.2, duration: 3, name: 'impaled' }, description: 'Drive the spear deep causing bleeding', manaCost: 5 },
    { id: 'sweep_ab', name: 'Sweep', cooldown: 12, damage: 1.4, type: 'physical', damageType: 'piercing', aoe: true, description: 'Sweep the spear in a wide arc', manaCost: 8 },
    { id: 'javelin_throw', name: 'Javelin Throw', cooldown: 15, damage: 2.8, type: 'physical', damageType: 'piercing', description: 'Hurl the spear as a javelin at range', manaCost: 10 },
    { id: 'phalanx', name: 'Phalanx', cooldown: 22, damage: 0, type: 'defensive', effect: 'armor_buff', duration: 6, armorBonus: 15, description: 'Brace into defensive stance boosting armor', manaCost: 12 },
  ],
  hammer: [
    { id: 'slam', name: 'Slam', cooldown: 0, damage: 1.1, type: 'physical', damageType: 'blunt', description: 'Heavy hammer slam', manaCost: 0 },
    { id: 'ground_pound', name: 'Ground Pound', cooldown: 10, damage: 1.8, type: 'physical', damageType: 'earth', aoe: true, description: 'Smash the ground damaging nearby foes', manaCost: 8 },
    { id: 'shatter', name: 'Shatter', cooldown: 14, damage: 2.2, type: 'physical', damageType: 'blunt', effect: 'armor_break', armorReduction: 10, duration: 5, description: 'Shatter enemy armor reducing their defense', manaCost: 10 },
    { id: 'fortify_ab', name: 'Fortify', cooldown: 18, damage: 0, type: 'defensive', effect: 'armor_buff', duration: 8, armorBonus: 20, description: 'Fortify your defenses greatly boosting armor', manaCost: 12 },
    { id: 'earthquake', name: 'Earthquake', cooldown: 28, damage: 3.5, type: 'physical', damageType: 'earth', aoe: true, effect: 'stun', duration: 1, description: 'Cause an earthquake stunning and damaging all enemies', manaCost: 25 },
  ],
  unarmed: [
    { id: 'punch', name: 'Punch', cooldown: 0, damage: 0.8, type: 'physical', damageType: 'blunt', description: 'Quick punch', manaCost: 0 },
    { id: 'kick', name: 'Kick', cooldown: 6, damage: 1.8, type: 'physical', damageType: 'blunt', description: 'Powerful kick', manaCost: 3 },
    { id: 'palm_strike', name: 'Palm Strike', cooldown: 10, damage: 2.0, type: 'physical', damageType: 'blunt', effect: 'stun', duration: 1, description: 'Focused palm strike that stuns briefly', manaCost: 8 },
    { id: 'counter_ab', name: 'Counter', cooldown: 14, damage: 0, type: 'defensive', effect: 'counter', duration: 3, counterMultiplier: 2.0, description: 'Enter counter stance retaliating against next attack', manaCost: 5 },
    { id: 'dragon_fist', name: 'Dragon Fist', cooldown: 22, damage: 4.0, type: 'physical', damageType: 'blunt', aoe: true, description: 'Unleash a devastating chi-powered fist', manaCost: 18 },
  ],
};

// Build flat lookup: abilityId -> { ability, weaponFamily }
var ABILITY_BY_ID = {};
var _weaponFamilies = Object.keys(WEAPON_ABILITIES);
for (var _wfi = 0; _wfi < _weaponFamilies.length; _wfi++) {
  var _family = _weaponFamilies[_wfi];
  var _abilities = WEAPON_ABILITIES[_family];
  for (var _abi = 0; _abi < _abilities.length; _abi++) {
    ABILITY_BY_ID[_abilities[_abi].id] = { ability: _abilities[_abi], weaponFamily: _family };
  }
}

// ---------------------------------------------------------------------------
// Card-Based Ability Modifier Cards
// ---------------------------------------------------------------------------

var ABILITY_MODIFIER_CARDS = [
  { cardId: 'swift_strikes', name: 'Swift Strikes', type: 'ability_modifier', rarity: 'rare', archetype: 'melee_dps', tags: ['combat'], effects: [{ type: 'ability_cooldown_reduction', weaponFamily: 'sword', value: 0.20 }], icon: 'skills/Skill_SwordAttack.PNG', description: '-20% cooldown on sword abilities' },
  { cardId: 'rapid_fire', name: 'Rapid Fire', type: 'ability_modifier', rarity: 'rare', archetype: 'melee_dps', tags: ['combat'], effects: [{ type: 'ability_cooldown_reduction', weaponFamily: 'bow', value: 0.20 }], icon: 'skills/Skill_SwordAttack.PNG', description: '-20% cooldown on bow abilities' },
  { cardId: 'arcane_haste', name: 'Arcane Haste', type: 'ability_modifier', rarity: 'rare', archetype: 'glass_cannon', archetypeSecondary: ['support'], tags: ['magic', 'combat'], effects: [{ type: 'ability_cooldown_reduction', weaponFamily: 'staff', value: 0.15 }, { type: 'ability_cooldown_reduction', weaponFamily: 'wand', value: 0.15 }], icon: 'skills/Enchantment/', description: '-15% cooldown on staff and wand abilities' },
  { cardId: 'pyromaniac', name: 'Pyromaniac', type: 'ability_modifier', rarity: 'ultra_rare', archetype: 'glass_cannon', tags: ['magic', 'combat'], effects: [{ type: 'ability_element_damage', element: 'fire', value: 0.30 }], icon: 'skills/Skill_Explosion.PNG', description: '+30% fire ability damage' },
  { cardId: 'frost_mastery', name: 'Frost Mastery', type: 'ability_modifier', rarity: 'ultra_rare', archetype: 'glass_cannon', tags: ['magic', 'combat'], effects: [{ type: 'ability_element_damage', element: 'ice', value: 0.30 }], icon: 'skills/Enchantment/', description: '+30% ice ability damage' },
  { cardId: 'storm_caller', name: 'Storm Caller', type: 'ability_modifier', rarity: 'ultra_rare', archetype: 'glass_cannon', tags: ['magic', 'combat'], effects: [{ type: 'ability_element_damage', element: 'lightning', value: 0.25 }], icon: 'skills/Skill_Explosion.PNG', description: '+25% lightning ability damage' },
  { cardId: 'brutal_force', name: 'Brutal Force', type: 'ability_modifier', rarity: 'rare', archetype: 'melee_dps', tags: ['combat'], effects: [{ type: 'ability_type_damage', abilityType: 'physical', value: 0.15 }], icon: 'skills/Skill_SwordAttack.PNG', description: '+15% physical ability damage' },
  { cardId: 'venomous_edge', name: 'Venomous Edge', type: 'ability_modifier', rarity: 'ultra_rare', archetype: 'assassin', archetypeSecondary: ['cc_dot'], tags: ['stealth', 'combat'], effects: [{ type: 'ability_enhance', abilityId: 'backstab_ab', addDot: { tickDamage: 0.3, duration: 4, name: 'venomous_wound' } }], icon: 'skills/Enchantment/', description: 'Backstab now applies a poison DoT' },
  { cardId: 'stunning_bash', name: 'Stunning Bash', type: 'ability_modifier', rarity: 'rare', archetype: 'cc_dot', archetypeSecondary: ['melee_dps'], tags: ['combat'], effects: [{ type: 'ability_enhance', abilityId: 'bash_ab', addEffect: 'stun', addDuration: 1 }], icon: 'skills/Skill_SwordAttack.PNG', description: 'Bash now has a chance to stun for 1s' },
  { cardId: 'empowered_execute', name: 'Empowered Execute', type: 'ability_modifier', rarity: 'ultra_rare', archetype: 'melee_dps', tags: ['combat'], effects: [{ type: 'ability_enhance', abilityId: 'execute', damageBonus: 0.50 }], icon: 'skills/Skill_SwordAttack.PNG', description: 'Execute deals 50% more damage' },
  { cardId: 'bladedancer', name: 'Bladedancer', type: 'ability_modifier', rarity: 'legendary', archetype: 'melee_dps', archetypeSecondary: ['cc_dot'], tags: ['combat'], effects: [{ type: 'ability_unlock', weaponFamily: 'sword', ability: { id: 'blade_dance', name: 'Blade Dance', cooldown: 18, damage: 2.0, type: 'physical', aoe: true, hits: 3, description: 'Rapid multi-hit blade dance striking 3 times', manaCost: 15 } }], icon: 'skills/Skill_SwordAttack.PNG', description: 'Unlocks Blade Dance for swords' },
  { cardId: 'shadow_step_card', name: 'Shadow Step', type: 'ability_modifier', rarity: 'legendary', archetype: 'assassin', tags: ['stealth', 'combat'], effects: [{ type: 'ability_unlock', weaponFamily: 'dagger', ability: { id: 'shadow_step_ab', name: 'Shadow Step', cooldown: 16, damage: 2.5, type: 'physical', effect: 'stealth', duration: 2, description: 'Teleport behind target and strike from stealth', manaCost: 12 } }], icon: 'skills/Enchantment/', description: 'Unlocks Shadow Step for daggers' },
  { cardId: 'meteor_shower_card', name: 'Meteor Shower', type: 'ability_modifier', rarity: 'legendary', archetype: 'glass_cannon', tags: ['magic', 'combat'], effects: [{ type: 'ability_unlock', weaponFamily: 'staff', ability: { id: 'meteor_shower_ab', name: 'Meteor Shower', cooldown: 40, damage: 3.0, type: 'magic', element: 'fire', aoe: true, hits: 5, description: 'Call down a devastating rain of meteors', manaCost: 50 } }], icon: 'skills/Skill_Explosion.PNG', description: 'Unlocks Meteor Shower for staffs' },
  { cardId: 'combat_focus', name: 'Combat Focus', type: 'ability_modifier', rarity: 'rare', archetype: 'melee_dps', tags: ['combat'], effects: [{ type: 'ability_cooldown_reduction_all', value: 0.10 }], icon: 'skills/Skill_SwordAttack.PNG', description: '-10% cooldown on all abilities' },
  { cardId: 'mana_efficiency_card', name: 'Mana Efficiency', type: 'ability_modifier', rarity: 'rare', archetype: 'glass_cannon', archetypeSecondary: ['support'], tags: ['magic', 'combat'], effects: [{ type: 'ability_mana_reduction', value: 0.20 }], icon: 'skills/Enchantment/', description: '-20% mana cost on all abilities' },
];

// Append ability modifier cards to CARD_TEMPLATES and indexes
for (var _amci = 0; _amci < ABILITY_MODIFIER_CARDS.length; _amci++) {
  CARD_TEMPLATES.push(ABILITY_MODIFIER_CARDS[_amci]);
  var _amc = ABILITY_MODIFIER_CARDS[_amci];
  if (!CARDS_BY_RARITY[_amc.rarity]) CARDS_BY_RARITY[_amc.rarity] = [];
  CARDS_BY_RARITY[_amc.rarity].push(_amc);
  CARD_BY_ID[_amc.cardId] = _amc;
}

// ---------------------------------------------------------------------------
// Ability modifier computation from equipped cards
// ---------------------------------------------------------------------------

function computeAbilityModifiers(equippedCards) {
  var mods = { cooldownReductions: {}, elementDamage: {}, typeDamage: {}, enhancements: {}, unlockedAbilities: {}, globalCooldownReduction: 0, manaReduction: 0 };
  if (!equippedCards || !Array.isArray(equippedCards)) return mods;
  for (var i = 0; i < equippedCards.length; i++) {
    var card = equippedCards[i];
    if (!card || !card.effects) continue;
    for (var j = 0; j < card.effects.length; j++) {
      var eff = card.effects[j];
      if (eff.type === 'ability_cooldown_reduction' && eff.weaponFamily) mods.cooldownReductions[eff.weaponFamily] = (mods.cooldownReductions[eff.weaponFamily] || 0) + (eff.value || 0);
      if (eff.type === 'ability_cooldown_reduction_all') mods.globalCooldownReduction += (eff.value || 0);
      if (eff.type === 'ability_element_damage' && eff.element) mods.elementDamage[eff.element] = (mods.elementDamage[eff.element] || 0) + (eff.value || 0);
      if (eff.type === 'ability_type_damage' && eff.abilityType) mods.typeDamage[eff.abilityType] = (mods.typeDamage[eff.abilityType] || 0) + (eff.value || 0);
      if (eff.type === 'ability_enhance' && eff.abilityId) {
        if (!mods.enhancements[eff.abilityId]) mods.enhancements[eff.abilityId] = {};
        var enh = mods.enhancements[eff.abilityId];
        if (eff.addDot) enh.addDot = eff.addDot;
        if (eff.addEffect) enh.addEffect = eff.addEffect;
        if (eff.addDuration) enh.addDuration = (enh.addDuration || 0) + eff.addDuration;
        if (eff.damageBonus) enh.damageBonus = (enh.damageBonus || 0) + eff.damageBonus;
      }
      if (eff.type === 'ability_unlock' && eff.weaponFamily && eff.ability) {
        if (!mods.unlockedAbilities[eff.weaponFamily]) mods.unlockedAbilities[eff.weaponFamily] = [];
        mods.unlockedAbilities[eff.weaponFamily].push(eff.ability);
      }
      if (eff.type === 'ability_mana_reduction') mods.manaReduction += (eff.value || 0);
    }
  }
  return mods;
}

function getEffectiveCooldown(ability, weaponFamily, cardMods) {
  if (!ability || ability.cooldown <= 0) return 0;
  var cd = ability.cooldown;
  var reduction = 0;
  if (cardMods) {
    reduction += (cardMods.globalCooldownReduction || 0);
    if (cardMods.cooldownReductions && cardMods.cooldownReductions[weaponFamily]) reduction += cardMods.cooldownReductions[weaponFamily];
  }
  reduction = Math.min(reduction, 0.50);
  return Math.max(1, Math.round(cd * (1 - reduction)));
}

function getEffectiveManaCost(ability, cardMods) {
  if (!ability) return 0;
  var cost = ability.manaCost || 0;
  if (cost <= 0) return 0;
  var reduction = cardMods ? (cardMods.manaReduction || 0) : 0;
  reduction = Math.min(reduction, 0.50);
  return Math.max(1, Math.round(cost * (1 - reduction)));
}

function getPlayerAbilities(weaponFamily, equippedCards) {
  var family = weaponFamily || 'unarmed';
  var baseAbilities = WEAPON_ABILITIES[family] || WEAPON_ABILITIES.unarmed;
  var abilities = [];
  for (var i = 0; i < baseAbilities.length; i++) abilities.push(baseAbilities[i]);
  var cardMods = computeAbilityModifiers(equippedCards);
  if (cardMods.unlockedAbilities && cardMods.unlockedAbilities[family]) {
    var unlocked = cardMods.unlockedAbilities[family];
    for (var j = 0; j < unlocked.length; j++) abilities.push(unlocked[j]);
  }
  return abilities;
}

/**
 * Compute the max resource pool for a given resource type and race.
 * Primary resource gets 100% base + 20% racial bonus.
 * Secondary resources get 50% base capacity.
 * Resource Attunement cards increase secondary resource max by +25% each (stackable to 100%).
 */
function computeResourceMax(resourceId, race, attunementStacks) {
  var resource = COMBAT_RESOURCES[resourceId];
  if (!resource) return 0;
  var base = resource.baseMax;
  var primaryRes = RACE_PRIMARY_RESOURCE[race] || 'mana';
  if (resourceId === primaryRes) {
    return Math.floor(base * (1 + PRIMARY_RESOURCE_BONUS));
  }
  // Secondary: 50% base, +25% per attunement stack (max 2 stacks = 100%)
  var attunement = Math.min(attunementStacks || 0, 2);
  var scale = SECONDARY_RESOURCE_SCALE + (attunement * 0.25);
  scale = Math.min(scale, 1.0); // cap at 100%
  return Math.floor(base * scale);
}

// ---------------------------------------------------------------------------
// Dual-Wield Skills — unlocked by specific hand combinations
// ---------------------------------------------------------------------------

var DUAL_WIELD_SKILLS = {
  // Twin Fangs (dagger+dagger)
  flurry_of_blades: { name: 'Flurry of Blades', type: 'active', cost: { stamina: 20 }, cooldown: 3,
    effect: { type: 'multi_hit', hits: 4, damagePercent: 0.40, canCrit: true },
    description: 'Unleash 4 rapid strikes at 40% damage each.' },
  twin_backstab: { name: 'Twin Backstab', type: 'active', cost: { stamina: 25 }, cooldown: 5,
    effect: { type: 'stealth_attack', damagePercent: 2.0, appliesDebuff: 'bleed' },
    description: 'Strike from stealth with both daggers. 200% damage + bleed.' },

  // Blade Storm (sword+sword)
  whirlwind_slash: { name: 'Whirlwind Slash', type: 'active', cost: { stamina: 30 }, cooldown: 4,
    effect: { type: 'aoe_melee', radius: 1, damagePercent: 0.80 },
    description: 'Spin attack hitting all adjacent enemies at 80% damage.' },
  riposte: { name: 'Riposte', type: 'passive',
    effect: { type: 'counter_attack', triggerChance: 0.15, damagePercent: 1.2 },
    description: '15% chance to counter-attack after blocking for 120% damage.' },

  // Swordbreaker (sword+dagger)
  feint_strike: { name: 'Feint Strike', type: 'active', cost: { stamina: 15 }, cooldown: 2,
    effect: { type: 'guaranteed_crit', damagePercent: 1.5 },
    description: 'Feint with main hand, strike with dagger. Guaranteed crit at 150% damage.' },
  disarm: { name: 'Disarm', type: 'active', cost: { stamina: 20 }, cooldown: 6,
    effect: { type: 'debuff', debuffName: 'disarmed', duration: 2, enemyDmgReduction: 0.40 },
    description: 'Disarm target, reducing their damage by 40% for 2 turns.' },

  // Berserker Fury (axe+axe)
  cleave: { name: 'Cleave', type: 'active', cost: { stamina: 25 }, cooldown: 3,
    effect: { type: 'aoe_cone', damagePercent: 1.0, tilesForward: 2 },
    description: 'Cleave forward hitting up to 3 enemies for full damage.' },
  raging_blow: { name: 'Raging Blow', type: 'active', cost: { stamina: 35, hp: 10 }, cooldown: 4,
    effect: { type: 'single_hit', damagePercent: 2.5, selfDamage: 10 },
    description: 'Devastating blow at 250% damage. Costs 10 HP.' },

  // Skull Crusher (mace+mace)
  ground_pound: { name: 'Ground Pound', type: 'active', cost: { stamina: 30 }, cooldown: 5,
    effect: { type: 'aoe_melee', radius: 1, damagePercent: 0.60, appliesDebuff: 'stun', stunDuration: 1 },
    description: 'Slam ground stunning adjacent enemies for 1 turn.' },
  concussive_blow: { name: 'Concussive Blow', type: 'active', cost: { stamina: 20 }, cooldown: 3,
    effect: { type: 'single_hit', damagePercent: 1.3, armorPen: 0.20 },
    description: 'Crushing strike ignoring 20% armor. 130% damage.' },

  // Sword & Board (weapon+shield)
  shield_bash: { name: 'Shield Bash', type: 'active', cost: { stamina: 15 }, cooldown: 2,
    effect: { type: 'single_hit', damagePercent: 0.5, appliesDebuff: 'stun', stunDuration: 1, usesDefense: true },
    description: 'Bash with shield for 50% damage + stun. Scales with shield defense.' },
  defensive_stance: { name: 'Defensive Stance', type: 'active', cost: { stamina: 10 }, cooldown: 6,
    effect: { type: 'self_buff', buffName: 'fortified', duration: 3, blockBonus: 0.20, defenseBonus: 10 },
    description: '+20% block and +10 defense for 3 turns.' },

  // Iron Fortress (shield+shield)
  shield_wall: { name: 'Shield Wall', type: 'active', cost: { stamina: 25 }, cooldown: 5,
    effect: { type: 'self_buff', buffName: 'shield_wall', duration: 3, damageReduction: 0.50, immobilize: true },
    description: 'Brace shields: 50% damage reduction for 3 turns. Cannot move.' },
  reflecting_guard: { name: 'Reflecting Guard', type: 'active', cost: { stamina: 20 }, cooldown: 4,
    effect: { type: 'reflect', reflectPercent: 0.30, duration: 2 },
    description: 'Reflect 30% of incoming damage back to attackers for 2 turns.' },
  taunt: { name: 'Taunt', type: 'active', cost: { stamina: 10 }, cooldown: 3,
    effect: { type: 'taunt', duration: 2, radius: 3 },
    description: 'Force nearby enemies to attack you for 2 turns.' },

  // Arcane Conduit (wand+wand)
  arcane_barrage: { name: 'Arcane Barrage', type: 'active', cost: { mana: 30 }, cooldown: 3,
    effect: { type: 'multi_hit', hits: 3, damagePercent: 0.60, usesMagic: true },
    description: 'Fire 3 arcane bolts at 60% magic damage each.' },
  mana_shield: { name: 'Mana Shield', type: 'active', cost: { mana: 20 }, cooldown: 8,
    effect: { type: 'self_buff', buffName: 'mana_shield', duration: 4, absorbDamage: true, manaPerDamage: 2 },
    description: 'Absorb damage using mana (2 mana per damage) for 4 turns.' },

  // Grand Magister (staff+staff)
  meteor_strike: { name: 'Meteor Strike', type: 'active', cost: { mana: 50 }, cooldown: 8,
    effect: { type: 'aoe_ranged', radius: 2, damagePercent: 2.0, usesMagic: true },
    description: 'Call down a meteor. 200% magic damage in a 2-tile radius.' },
  arcane_ward: { name: 'Arcane Ward', type: 'active', cost: { mana: 25 }, cooldown: 6,
    effect: { type: 'self_buff', buffName: 'arcane_ward', duration: 3, magicResistBonus: 15, reflectMagic: 0.15 },
    description: '+15 magic resist, reflect 15% magic damage for 3 turns.' },

  // Battlemage (wand+staff)
  spell_weave: { name: 'Spell Weave', type: 'active', cost: { mana: 20 }, cooldown: 3,
    effect: { type: 'single_hit', damagePercent: 1.5, usesMagic: true, appliesDebuff: 'spell_vulnerability', duration: 2 },
    description: '150% magic damage. Target takes 15% more magic damage for 2 turns.' },
  counterspell: { name: 'Counterspell', type: 'active', cost: { mana: 15 }, cooldown: 4,
    effect: { type: 'interrupt', silenceDuration: 2 },
    description: 'Interrupt enemy cast and silence for 2 turns.' },

  // Spellblade (sword+wand)
  enchanted_strike: { name: 'Enchanted Strike', type: 'active', cost: { mana: 15, stamina: 10 }, cooldown: 2,
    effect: { type: 'single_hit', damagePercent: 1.2, bonusMagicDamagePercent: 0.80 },
    description: 'Strike with enchanted blade: 120% melee + 80% magic damage.' },
  spell_parry: { name: 'Spell Parry', type: 'active', cost: { mana: 10 }, cooldown: 3,
    effect: { type: 'counter_magic', absorbNextSpell: true, counterDamagePercent: 0.50 },
    description: 'Absorb next magic attack and counter for 50% damage.' },

  // Battle Priest (mace+wand)
  smite: { name: 'Smite', type: 'active', cost: { mana: 20, stamina: 10 }, cooldown: 3,
    effect: { type: 'single_hit', damagePercent: 1.5, bonusVsUndead: 1.0, usesMagic: true },
    description: 'Holy strike: 150% damage, double vs undead.' },
  healing_light: { name: 'Healing Light', type: 'active', cost: { mana: 25 }, cooldown: 4,
    effect: { type: 'heal', healPercent: 0.25 },
    description: 'Heal for 25% of max HP.' },

  // Titan Grip (2h+2h)
  titan_slam: { name: 'Titan Slam', type: 'active', cost: { stamina: 40 }, cooldown: 5,
    effect: { type: 'aoe_melee', radius: 1, damagePercent: 1.5, knockback: 2 },
    description: 'Massive slam: 150% damage to all adjacent, knockback 2 tiles.' },
  earthquake: { name: 'Earthquake', type: 'active', cost: { stamina: 50 }, cooldown: 8,
    effect: { type: 'aoe_melee', radius: 2, damagePercent: 1.0, appliesDebuff: 'stun', stunDuration: 1, selfStun: 1 },
    description: 'Ground-shaking blow: AoE 2 radius, stun everything including self.' },

  // Shieldbearer Archer (bow+shield)
  shield_cover: { name: 'Shield Cover', type: 'active', cost: { stamina: 15 }, cooldown: 3,
    effect: { type: 'self_buff', buffName: 'shield_cover', duration: 2, rangedDmgReduction: 0.40 },
    description: 'Hunker behind shield: -40% ranged damage taken for 2 turns.' },
  aimed_shot: { name: 'Aimed Shot', type: 'active', cost: { stamina: 20 }, cooldown: 3,
    effect: { type: 'single_hit', damagePercent: 2.0, range: 6 },
    description: 'Carefully aimed shot for 200% damage.' },

  // Scout (bow+dagger)
  quick_draw: { name: 'Quick Draw', type: 'active', cost: { stamina: 10 }, cooldown: 2,
    effect: { type: 'single_hit', damagePercent: 0.80, instantCast: true },
    description: 'Snap shot that doesn\'t consume your turn.' },
  knife_throw: { name: 'Knife Throw', type: 'active', cost: { stamina: 15 }, cooldown: 2,
    effect: { type: 'single_hit', damagePercent: 1.0, range: 3, appliesDebuff: 'bleed' },
    description: 'Throw off-hand dagger: 100% damage at range 3 + bleed.' },
};

module.exports = {
  // Status Effect Categories
  STATUS_EFFECT_CATEGORIES,
  getStatusEffectCategory,

  // Races
  RACES,
  RACE_IDS,
  RACE_LANGUAGES,
  ALL_LANGUAGES,
  RACIAL_INNATE_TRAITS,
  RACIAL_VISION_TYPES,
  canTradeCardToRace,

  // Vision Types
  VISION_TYPES,
  getAvailableVisionTypes,
  visionPreventsAmbush,
  getVisionCombatBonuses,

  // Stats
  STAT_NAMES,
  STAT_KEYS,
  BASE_STAT_VALUE,
  FREE_POINTS_AT_CREATION,
  STAT_POINTS_PER_LEVELS,
  getDefaultStats,
  applyRaceBumps,
  computeStats,
  computeCombatSpeed,

  // Combat Resources (4-pool system)
  COMBAT_RESOURCES,
  RACE_PRIMARY_RESOURCE,
  PRIMARY_RESOURCE_BONUS,
  SECONDARY_RESOURCE_SCALE,
  computeResourceMax,

  // Skills
  SKILL_DEFINITIONS,
  getDefaultSkills,
  getSkillsForRace,

  // Resources
  ALL_RESOURCE_TYPES,

  // Cards - Rarity
  RARITY_TIERS,
  RARITY_BY_ID,
  TOTAL_RARITY_WEIGHT,
  rollRarity,

  // Pity system constants
  SOFT_PITY_START,
  HARD_PITY,
  SOFT_PITY_RATE,

  // Rate disclosure
  RACE_POOL_BIAS,
  CATFOLK_RARITY_BUMP,
  computeEffectiveGachaRates,

  // Cards - Types & Templates
  CARD_TYPES,
  CARD_TEMPLATES,
  CARDS_BY_RARITY,
  CARD_BY_ID,
  CARDS_PER_PACK_MIN,
  CARDS_PER_PACK_MAX,
  MAX_ACTIVE_CARD_SLOTS,
  MAX_PASSIVE_CARD_SLOTS,
  MAX_EQUIPPED_CARDS,
  MAX_CARD_COLLECTION,
  MAX_FUSION_COUNT,

  // Card Operations
  generateCardInstance,
  openCardPack,
  canFuseCards,
  fuseCards,
  rollCardStyle,
  generateSerial,

  // Card Styles
  CARD_STYLES,

  // Biome Skill Bonuses
  SKILL_BIOME_BONUS,

  // Water traversal
  WATER_MOUNTS,

  // Leveling
  MAX_OVERALL_LEVEL,
  XP_SPILLOVER_RATE,
  overallXpForLevel,
  getActiveCardSlotCount,
  getPassiveCardSlotCount,
  getCardSlotCount,
  isActiveCardType,
  getStatPointsForLevel,

  // New Resources & Recipes
  NEW_BIOME_RESOURCES,
  NEW_RECIPES,

  // Economy
  CARD_VENDOR_PRICES,
  CARD_BUYBACK_RATE,
  RARITY_BASE_VALUE,
  AUCTION_DURATION_MS,
  AUCTION_MIN_PRICE,
  AUCTION_MAX_LISTINGS_PER_PLAYER,

  // Icon Registry
  ICON_REGISTRY,

  // Elemental system (Fix 2)
  ELEMENTAL_TABLE,
  getElementalMultiplier,

  // Weapon damage types (Fix 3)
  WEAPON_DAMAGE_TYPES,
  ARMOR_PHYS_RESIST,

  // Skill combat bonuses (Fix 4)
  getCombatSkillBonuses,

  // Food effects
  FOOD_EFFECTS,

  // Crafting skill perks
  CRAFTING_SKILL_PERKS,
  getCraftingSkillBonuses,

  // Weapon abilities (cooldown combat system)
  WEAPON_ABILITIES,
  ABILITY_BY_ID,
  ABILITY_MODIFIER_CARDS,
  getWeaponFamily,
  getWeaponFamilyFromCategory,
  computeAbilityModifiers,
  getEffectiveCooldown,
  getEffectiveManaCost,
  getPlayerAbilities,

  // Full damage type system
  DAMAGE_TYPES,
  DAMAGE_TYPE_EFFECTIVENESS,
  ARMOR_RESISTANCE_TYPES,
  WEAPON_ABILITY_DAMAGE_TYPES,
  getAbilityDamageType,
  calculateDamageMultiplier,
  getMonsterResistances,

  // Card ability cooldowns
  CARD_ABILITY_COOLDOWNS,
  getCardAbilityCooldown,
  getCardAbilityManaCost,

  // Rift Scars
  RIFT_SCAR_PREFIXES,
  RIFT_SCAR_SUFFIXES,
  getRiftScarCount,
  rollRiftScarPrefix,
  rollRiftScarSuffix,
  applyRiftScars,

  // Awakenings
  AWAKENINGS,
  getAvailableAwakenings,

  // Dual-Wield Skills
  DUAL_WIELD_SKILLS,
};
