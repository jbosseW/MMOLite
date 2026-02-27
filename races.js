// races.js
// Race definitions, vision types, combat resources, and racial helper functions.
// Extracted from rpg-data.js — rpg-data.js re-exports all names for backward compatibility.

// ---------------------------------------------------------------------------
// Race Definitions (8 playable races, lore-verified)
// ---------------------------------------------------------------------------

var RACES = {
  human: {
    id: 'human',
    name: 'Human',
    lifespan: '70-90',
    statBumps: { presence: 1, resolve: 1 },
    baseLuck: 0.05,  // Balanced opportunists — adaptable to any situation
    racialFeat: {
      id: 'dominion_authority',
      name: 'Dominion Authority',
      description: '+15% XP all, +20% market in Holy Dominion, +10% diplomacy, coercion/deception, -25% property cost, +5% base luck',
      effects: [
        { type: 'xp_bonus_all', value: 0.15 },
        { type: 'market_bonus_homeland', biomes: ['HOLY_DOMINION'], value: 0.20 },
        { type: 'diplomacy_bonus', value: 0.10 },
        { type: 'coercion_bonus', value: 0.15 },
        { type: 'deception_bonus', value: 0.15 },
        { type: 'property_cost_reduction', value: 0.25 },
        { type: 'poison_vulnerability', value: 0.15 },
        { type: 'luck_bonus', value: 0.05 },
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
    baseLuck: 0.08,  // Magical attunement — centuries of foresight and arcane intuition
    racialFeat: {
      id: 'millennial_memory',
      name: 'Millennial Memory',
      description: '+50% magic XP, +30% faster magic unlocks, +8% arcane luck, -15% melee damage, -10% max HP (physically frail)',
      effects: [
        { type: 'xp_bonus_skill', skill: 'magic', value: 0.50 },
        { type: 'magic_unlock_speed', value: 0.30 },
        { type: 'melee_damage_penalty', value: -0.15 },
        { type: 'hp_multiplier', value: -0.10 },
        { type: 'poison_vulnerability', value: 0.25 },
        { type: 'luck_bonus', value: 0.08 },         // Arcane foresight
        { type: 'card_luck_bonus', value: 0.05 },    // Attuned to card magic
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
    baseLuck: 0.03,
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
        { type: 'luck_bonus', value: 0.03 },
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
    baseLuck: 0.05,
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
        { type: 'luck_bonus', value: 0.05 },
        { type: 'rare_resource_chance', value: 0.05 },
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
    baseLuck: 0.07,
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
        { type: 'luck_bonus', value: 0.07 },
        { type: 'mutation_chance_bonus', value: 0.05 },
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
    baseLuck: 0.10,
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
        { type: 'luck_bonus', value: 0.10 },
        { type: 'loot_bonus', value: 0.08 },
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
    baseLuck: 0.06,
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
        { type: 'luck_bonus', value: 0.06 },
        { type: 'rare_resource_chance', value: 0.05 },
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
    baseLuck: 0.20,
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
        { type: 'viral_spread_bonus', value: 0.10 },
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
var RACIAL_INNATE_TRAITS = new Set([
  'tremor_sense', 'water_breathing', 'swim_no_mount', 'ocean_dive',
  'stone_skin', 'throwing_knives', 'unarmed_proficiency',
  'ritual_magic_access', 'poison_immunity',
]);

// Vision types that are innate (darkvision, thermal cannot be given to normal-vision races)
var RACIAL_VISION_TYPES = new Set(['darkvision', 'thermal']);

// ---------------------------------------------------------------------------
// Combat Resource Types (4-pool system)
// ---------------------------------------------------------------------------

var COMBAT_RESOURCES = {
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
    onHitGain: 3,           // +3 per attack that deals damage
    onTakeDamageGain: 2,    // +2 when taking damage
    decayPerTurn: 3,
    decayStartTurns: 2,     // decay only after 2 turns of inactivity
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
    basicAttackGain: 5,        // basic attacks on same target grant 5
    onSwitchRetainBase: 0.25,  // base 25% retain on target switch
    startingFocus: 10,         // start combat with 10 focus
    outOfCombatBonus: 0,
  },
};

var RACE_PRIMARY_RESOURCE = {
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
var PRIMARY_RESOURCE_BONUS = 0.10;    // Primary: floor(50 * 1.10) = 55
var SECONDARY_RESOURCE_SCALE = 0.75;  // Secondary: floor(50 * 0.75) = 37

// ---------------------------------------------------------------------------
// Vision Types System — toggleable vision modes with gameplay effects
// ---------------------------------------------------------------------------

var VISION_TYPES = {
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
var RACE_LANGUAGES = {};
var ALL_LANGUAGES = ['common', 'elvish', 'orcish', 'dwarvish', 'gnomish', 'goblin', 'draconic', 'catfolk'];
for (var raceId in RACES) {
  RACE_LANGUAGES[raceId] = RACES[raceId].languages || ['common'];
}

var RACE_IDS = Object.keys(RACES);

module.exports = {
  RACES,
  RACIAL_INNATE_TRAITS,
  RACIAL_VISION_TYPES,
  COMBAT_RESOURCES,
  RACE_PRIMARY_RESOURCE,
  PRIMARY_RESOURCE_BONUS,
  SECONDARY_RESOURCE_SCALE,
  VISION_TYPES,
  getAvailableVisionTypes,
  visionPreventsAmbush,
  getVisionCombatBonuses,
  canTradeCardToRace,
  ALL_LANGUAGES,
  RACE_LANGUAGES,
  RACE_IDS,
};
