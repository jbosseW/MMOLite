// combat-data.js
// Status effect categories, RPG stat system, and stat computation formulas.
// Extracted from rpg-data.js — rpg-data.js re-exports all names for backward compatibility.

var raceData = require('./races');
var RACES = raceData.RACES;

// ---------------------------------------------------------------------------
// Status Effect Categories (physical/mental/magical)
// Used for category-specific cleansing and resistance
// ---------------------------------------------------------------------------

var STATUS_EFFECT_CATEGORIES = {
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

function getStatusEffectCategory(effectName) {
  return STATUS_EFFECT_CATEGORIES[effectName] || 'physical';
}

// ---------------------------------------------------------------------------
// RPG Stats System (7 primary stats)
// ---------------------------------------------------------------------------

var STAT_NAMES = {
  vigor: { abbr: 'VIG', name: 'Vigor', description: 'HP, stamina, poison resist, carry weight' },
  might: { abbr: 'MGT', name: 'Might', description: 'Melee damage, mining yield, harvest speed' },
  finesse: { abbr: 'FIN', name: 'Finesse', description: 'Crit chance, dodge, movement speed, fishing' },
  acumen: { abbr: 'ACU', name: 'Acumen', description: 'Magic power, XP gain bonus, crafting quality' },
  resolve: { abbr: 'RES', name: 'Resolve', description: 'Magic resist, debuff reduction, HP regen' },
  presence: { abbr: 'PRE', name: 'Presence', description: 'Trade prices, NPC favor, party buff radius' },
  ingenuity: { abbr: 'ING', name: 'Ingenuity', description: 'Crafting speed, cogworking yield, repair' },
};

var STAT_KEYS = Object.keys(STAT_NAMES);
var BASE_STAT_VALUE = 5;
var FREE_POINTS_AT_CREATION = 5;
var STAT_POINTS_PER_LEVELS = 3; // 1 stat point every 3 levels

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

module.exports = {
  STATUS_EFFECT_CATEGORIES,
  getStatusEffectCategory,
  STAT_NAMES,
  STAT_KEYS,
  BASE_STAT_VALUE,
  FREE_POINTS_AT_CREATION,
  STAT_POINTS_PER_LEVELS,
  getDefaultStats,
  applyRaceBumps,
  computeStats,
};
