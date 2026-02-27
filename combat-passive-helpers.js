// combat-passive-helpers.js
// Pure helper functions for reading combat passives, immunities, card effects,
// and on-hit affixes from a unit's equipped cards / status effects.
// Zero external dependencies — operates only on the unit object passed in.

'use strict';

/**
 * Get the first combatPassive of a given type from a unit's equipped cards.
 * Returns the combatPassive object or null.
 */
function getUnitCombatPassive(unit, passiveType) {
  if (!unit || !unit.equippedCards) return null;
  for (var i = 0; i < unit.equippedCards.length; i++) {
    var card = unit.equippedCards[i];
    if (card && card.combatPassive && card.combatPassive.type === passiveType) {
      return card.combatPassive;
    }
  }
  return null;
}

/**
 * Sum the values of ALL combatPassives of a given type from a unit's equipped cards.
 * Use for stackable passives (e.g. multiple lifesteal cards).
 * Returns 0 if none found.
 */
function getUnitCombatPassiveTotal(unit, passiveType) {
  if (!unit || !unit.equippedCards) return 0;
  var total = 0;
  for (var i = 0; i < unit.equippedCards.length; i++) {
    var card = unit.equippedCards[i];
    if (card && card.combatPassive && card.combatPassive.type === passiveType) {
      total += (card.combatPassive.value || 0);
    }
  }
  return total;
}

/**
 * Check if a unit has a specific immunity via combatPassive.
 * Returns true if the unit has an immunity passive matching the given element.
 */
function hasImmunity(unit, element) {
  if (!unit || !unit.equippedCards) return false;
  for (var i = 0; i < unit.equippedCards.length; i++) {
    var card = unit.equippedCards[i];
    if (card && card.combatPassive && card.combatPassive.type === 'immunity' && card.combatPassive.element === element) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a unit has CC immunity for a given CC effect name.
 * Matches against cc_immunity combatPassive ccType field.
 * ccType values: 'stun', 'root_slow', 'knockback'
 * effectName values: 'stunned', 'rooted', 'slowed', 'knockdown', etc.
 * Returns true if the unit is immune to the given CC.
 */
function hasCCImmunity(unit, effectName) {
  if (!unit || !unit.equippedCards) return false;
  for (var i = 0; i < unit.equippedCards.length; i++) {
    var card = unit.equippedCards[i];
    if (!card || !card.combatPassive || card.combatPassive.type !== 'cc_immunity') continue;
    var ccType = card.combatPassive.ccType;
    if (ccType === 'stun' && (effectName === 'stunned' || effectName === 'knockdown')) return true;
    if (ccType === 'root_slow' && (effectName === 'rooted' || effectName === 'slowed' || effectName === 'root' || effectName === 'slow')) return true;
    if (ccType === 'knockback' && (effectName === 'knockdown' || effectName === 'knocked' || effectName === 'knockback')) return true;
  }
  // Also check active buff-granted ccImmune
  if (unit.statusEffects) {
    for (var j = 0; j < unit.statusEffects.length; j++) {
      if (unit.statusEffects[j].ccImmune) return true;
    }
  }
  return false;
}

/**
 * Get the sum of a specific effect type from a unit's card effects (non-combatPassive).
 * Used for dodge_bonus, crit_bonus, counter_chance_bonus, etc. from card effects arrays.
 */
function getCardEffectTotal(unit, effectType) {
  if (!unit || !unit.equippedCards) return 0;
  var total = 0;
  for (var i = 0; i < unit.equippedCards.length; i++) {
    var card = unit.equippedCards[i];
    if (!card || !card.effects || !Array.isArray(card.effects)) continue;
    for (var j = 0; j < card.effects.length; j++) {
      var eff = card.effects[j];
      if (eff.type === effectType) {
        total += (eff.value || 0);
      }
    }
  }
  return total;
}

/**
 * Collect all on_hit affixes from a unit's equipped cards.
 * Returns array of affix effect objects (each has .id, .label, .tier, .cat, .effect).
 */
function getUnitOnHitAffixes(unit) {
  if (!unit || !unit.equippedCards) return [];
  var affixes = [];
  for (var i = 0; i < unit.equippedCards.length; i++) {
    var card = unit.equippedCards[i];
    if (!card || !card.affixes || !Array.isArray(card.affixes)) continue;
    for (var j = 0; j < card.affixes.length; j++) {
      var aff = card.affixes[j];
      if (aff && aff.cat === 'on_hit') {
        affixes.push(aff);
      }
    }
  }
  return affixes;
}

module.exports = {
  getUnitCombatPassive: getUnitCombatPassive,
  getUnitCombatPassiveTotal: getUnitCombatPassiveTotal,
  hasImmunity: hasImmunity,
  hasCCImmunity: hasCCImmunity,
  getCardEffectTotal: getCardEffectTotal,
  getUnitOnHitAffixes: getUnitOnHitAffixes,
};
