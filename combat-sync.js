// combat-sync.js
// Sync attacks (Metal Slug Tactics inspired) and reaction system (BG3-style)
// for tactical dungeon combat. Server-side module.

'use strict';

// ---------------------------------------------------------------------------
// Reaction type definitions
// ---------------------------------------------------------------------------

var REACTIONS = {
  opportunity_attack: {
    trigger: 'enemy_leaves_melee',
    damagePercent: 0.75,
    description: 'Strike an enemy that moves away from you',
  },
  counter_strike: {
    trigger: 'melee_attacked',
    chance: 0.50,
    damagePercent: 0.75,
    description: 'Chance to counter-attack when hit in melee',
  },
  dodge_roll: {
    trigger: 'attacked',
    effect: 'halve_damage',
    requiresCard: 'evasion_card',
    description: 'Halve incoming damage by dodging',
  },
  magic_shield: {
    trigger: 'magic_attacked',
    absorbFormula: 'acumen * 3',
    requiresCard: 'magic_resist_card',
    description: 'Absorb magic damage with a temporary shield',
  },
};

// ---------------------------------------------------------------------------
// Distance helpers
// ---------------------------------------------------------------------------

function manhattanDist(x1, y1, x2, y2) {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

function isAdjacent(x1, y1, x2, y2) {
  // Chebyshev distance <= 1 (includes diagonals)
  return Math.abs(x2 - x1) <= 1 && Math.abs(y2 - y1) <= 1 && !(x1 === x2 && y1 === y2);
}

// ---------------------------------------------------------------------------
// Line of Sight (Bresenham raycast on tile grid)
// ---------------------------------------------------------------------------

function hasLineOfSight(grid, x0, y0, x1, y1, width, height) {
  // Bresenham's line algorithm - checks all tiles between start and end.
  // grid[y][x] === 1 means wall (blocks LOS).
  // Start and end tiles are skipped (units standing there don't block).
  var dx = Math.abs(x1 - x0);
  var dy = Math.abs(y1 - y0);
  var sx = x0 < x1 ? 1 : -1;
  var sy = y0 < y1 ? 1 : -1;
  var err = dx - dy;
  var cx = x0;
  var cy = y0;

  while (cx !== x1 || cy !== y1) {
    var e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx)  { err += dx; cy += sy; }

    // Reached end tile — skip it
    if (cx === x1 && cy === y1) break;

    // Out of bounds blocks LOS
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) return false;

    // Wall check
    if (grid[cy] && grid[cy][cx] === 1) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Basic attack damage calculator (shared by sync and reaction systems)
// ---------------------------------------------------------------------------

function calcBasicAttackDamage(unit, targetDef, damagePercent, halfCrit, targetUnit) {
  var combat = unit.combat || {};
  var might = (unit.rpgStats && unit.rpgStats.might) ? unit.rpgStats.might : 5;
  var level = unit.level || 1;
  var weaponDamage = combat.weaponDamage || 0;
  var meleeDmgMult = combat.meleeDmgMult || 1;
  var critChance = combat.critChance || 0.02;

  // Check if this attack has an elemental component (weapon element from equipped cards)
  var attackElement = null;
  if (unit.equippedCards && Array.isArray(unit.equippedCards)) {
    for (var wei = 0; wei < unit.equippedCards.length; wei++) {
      var wCard = unit.equippedCards[wei];
      if (wCard && wCard.combatWeapon && wCard.combatWeapon.element) {
        attackElement = wCard.combatWeapon.element;
        break;
      }
    }
  }

  // If attack has an element, apply magic resist instead of physical armor (Fix 1)
  var effectiveDef = targetDef;
  if (attackElement && targetUnit && targetUnit.combat && targetUnit.combat.magicResist) {
    effectiveDef = targetUnit.combat.magicResist;
  }

  var baseAtk = (might * 2) + (level * 1.5) + weaponDamage;
  var armorReduction = effectiveDef / (effectiveDef + 50);
  var rawDamage = Math.max(1, Math.floor(baseAtk * meleeDmgMult * damagePercent * (1 - armorReduction)));

  var effectiveCritChance = halfCrit ? critChance * 0.5 : critChance;
  var isCrit = Math.random() < effectiveCritChance;
  if (isCrit) {
    rawDamage = Math.floor(rawDamage * 1.5);
  }

  return { damage: Math.max(1, rawDamage), isCrit: isCrit };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var MAX_SYNC_HELPERS = 3; // Max allies that can sync per attack (prevents 15-player abuse)

// ---------------------------------------------------------------------------
// Sync Attacks — Metal Slug Tactics inspired
// ---------------------------------------------------------------------------

function checkSyncAttacks(combat, attackerId, targetId) {
  var results = [];

  if (!combat || !combat.units) return results;

  var attacker = combat.units.get ? combat.units.get(attackerId) : combat.units[attackerId];
  var target = combat.units.get ? combat.units.get(targetId) : combat.units[targetId];

  if (!attacker || !target) return results;
  if (!target.alive && target.alive !== undefined) return results;

  // Determine grid dimensions for LOS checks
  var grid = combat.grid || null;
  var width = combat.width || 0;
  var height = combat.height || 0;

  // Iterate all units, find qualifying allies
  var unitEntries;
  if (combat.units.forEach) {
    unitEntries = [];
    combat.units.forEach(function(unit, id) {
      unitEntries.push({ id: id, unit: unit });
    });
  } else {
    unitEntries = [];
    var keys = Object.keys(combat.units);
    for (var k = 0; k < keys.length; k++) {
      unitEntries.push({ id: keys[k], unit: combat.units[keys[k]] });
    }
  }

  // Collect all qualifying allies with their distance to target
  var candidates = [];

  for (var i = 0; i < unitEntries.length; i++) {
    var entry = unitEntries[i];
    var ally = entry.unit;
    var allyId = entry.id;

    // Must be a different player unit, alive, with sync not used
    if (allyId === attackerId) continue;
    if (ally.type !== 'player') continue;
    if (ally.alive === false) continue;
    if (ally.syncUsedThisRound) continue;

    var distToTarget = manhattanDist(ally.x, ally.y, target.x, target.y);

    // Must be within 4 manhattan distance of the TARGET
    if (distToTarget > 4) continue;

    // Must have line of sight to the target
    if (grid && width > 0 && height > 0) {
      if (!hasLineOfSight(grid, ally.x, ally.y, target.x, target.y, width, height)) continue;
    }

    candidates.push({ id: allyId, unit: ally, distToTarget: distToTarget });
  }

  // Sort by closest to target first (closer allies sync first)
  candidates.sort(function(a, b) { return a.distToTarget - b.distToTarget; });

  // Cap at MAX_SYNC_HELPERS
  var syncCount = Math.min(candidates.length, MAX_SYNC_HELPERS);

  for (var ci = 0; ci < syncCount; ci++) {
    var candidate = candidates[ci];
    var syncAlly = candidate.unit;

    // Calculate sync damage at 50% with half crit chance
    var targetDef = (target.combat && target.combat.baseArmor) ? target.combat.baseArmor : (target.def || 0);
    var hit = calcBasicAttackDamage(syncAlly, targetDef, 0.5, true, target);

    syncAlly.syncUsedThisRound = true;

    results.push({
      unitId: candidate.id,
      unitName: syncAlly.name || syncAlly.username || candidate.id,
      damage: hit.damage,
      isCrit: hit.isCrit,
      distToTarget: candidate.distToTarget,
    });
  }

  return results;
}

function resetSyncFlags(combat) {
  if (!combat || !combat.units) return;

  var resetUnit = function(unit) {
    if (unit.type === 'player') {
      unit.syncUsedThisRound = false;
    }
  };

  if (combat.units.forEach) {
    combat.units.forEach(resetUnit);
  } else {
    var keys = Object.keys(combat.units);
    for (var i = 0; i < keys.length; i++) {
      resetUnit(combat.units[keys[i]]);
    }
  }
}

// ---------------------------------------------------------------------------
// Reaction System — BG3-style
// ---------------------------------------------------------------------------

function hasCard(unit, cardId) {
  if (!unit.equippedCards || !Array.isArray(unit.equippedCards)) return false;
  for (var i = 0; i < unit.equippedCards.length; i++) {
    var card = unit.equippedCards[i];
    if (card && (card.id === cardId || card.templateId === cardId)) return true;
  }
  return false;
}

function checkReactionAvailable(combat, defenderId, attackerId, attackType) {
  var available = [];

  if (!combat || !combat.units) return available;

  var defender = combat.units.get ? combat.units.get(defenderId) : combat.units[defenderId];
  if (!defender) return available;
  if (defender.alive === false) return available;
  if (!defender.rp || defender.rp <= 0) return available;

  // counter_strike: triggered when hit by melee
  if (attackType === 'melee') {
    available.push('counter_strike');
  }

  // dodge_roll: triggered by any attack, requires evasion_card
  if (hasCard(defender, 'evasion_card')) {
    available.push('dodge_roll');
  }

  // magic_shield: triggered by magic attack, requires magic_resist_card
  if (attackType === 'magic' && hasCard(defender, 'magic_resist_card')) {
    available.push('magic_shield');
  }

  return available;
}

function checkOpportunityAttack(combat, movingUnitId, fromX, fromY, toX, toY) {
  var results = [];

  if (!combat || !combat.units) return results;

  var movingUnit = combat.units.get ? combat.units.get(movingUnitId) : combat.units[movingUnitId];
  if (!movingUnit) return results;

  var movingType = movingUnit.type; // 'player' or 'enemy'

  var unitEntries;
  if (combat.units.forEach) {
    unitEntries = [];
    combat.units.forEach(function(unit, id) {
      unitEntries.push({ id: id, unit: unit });
    });
  } else {
    unitEntries = [];
    var keys = Object.keys(combat.units);
    for (var k = 0; k < keys.length; k++) {
      unitEntries.push({ id: keys[k], unit: combat.units[keys[k]] });
    }
  }

  for (var i = 0; i < unitEntries.length; i++) {
    var entry = unitEntries[i];
    var unit = entry.unit;
    var unitId = entry.id;

    // Must be hostile to the moving unit
    if (movingType === 'player' && unit.type !== 'enemy') continue;
    if (movingType === 'enemy' && unit.type !== 'player') continue;

    if (unit.alive === false) continue;
    if (!unit.rp || unit.rp <= 0) continue;

    // Must have been adjacent to old position
    if (!isAdjacent(unit.x, unit.y, fromX, fromY)) continue;

    // Must NOT be adjacent to new position (still in melee = no opportunity)
    if (isAdjacent(unit.x, unit.y, toX, toY)) continue;

    // Calculate opportunity attack at 75% damage
    var movingDef = (movingUnit.combat && movingUnit.combat.baseArmor) ? movingUnit.combat.baseArmor : (movingUnit.def || 0);
    var hit = calcBasicAttackDamage(unit, movingDef, REACTIONS.opportunity_attack.damagePercent, false, movingUnit);

    unit.rp -= 1;

    results.push({
      unitId: unitId,
      damage: hit.damage,
      isCrit: hit.isCrit,
    });
  }

  return results;
}

function executeReaction(combat, defenderId, reactionType, attackData) {
  var result = {
    reactionType: reactionType,
    success: false,
    modifiedDamage: attackData.damage,
    counterDamage: 0,
    shieldAbsorbed: 0,
  };

  if (!combat || !combat.units) return result;

  var defender = combat.units.get ? combat.units.get(defenderId) : combat.units[defenderId];
  if (!defender) return result;

  // Deduct 1 RP
  if (defender.rp && defender.rp > 0) {
    defender.rp -= 1;
  }

  if (reactionType === 'pass') {
    // No reaction — take full damage
    return result;
  }

  if (reactionType === 'counter_strike') {
    // Base 50% chance to deal 75% basic attack damage back to attacker
    // --- 3D: Riposte / Counter Chance Bonus ---
    // Add counter_chance_bonus from equipped cards (e.g. Riposte card adds +0.15)
    var counterChance = REACTIONS.counter_strike.chance;
    if (defender.equippedCards && Array.isArray(defender.equippedCards)) {
      for (var cci = 0; cci < defender.equippedCards.length; cci++) {
        var ccCard = defender.equippedCards[cci];
        if (!ccCard || !ccCard.effects) continue;
        for (var cej = 0; cej < ccCard.effects.length; cej++) {
          var ccEff = ccCard.effects[cej];
          if (ccEff.type === 'counter_chance_bonus') {
            counterChance += (ccEff.value || 0);
          }
        }
      }
    }
    // Cap counter chance at 85%
    counterChance = Math.min(0.85, counterChance);

    var roll = Math.random();
    if (roll < counterChance) {
      var attacker = combat.units.get ? combat.units.get(attackData.attackerId) : combat.units[attackData.attackerId];
      var attackerDef = 0;
      if (attacker) {
        attackerDef = (attacker.combat && attacker.combat.baseArmor) ? attacker.combat.baseArmor : (attacker.def || 0);
      }
      var hit = calcBasicAttackDamage(defender, attackerDef, REACTIONS.counter_strike.damagePercent, false, attacker);
      result.success = true;
      result.counterDamage = hit.damage;
    }
    // Incoming damage unchanged regardless of success
    return result;
  }

  if (reactionType === 'dodge_roll') {
    // Halve incoming damage
    result.success = true;
    result.modifiedDamage = Math.max(1, Math.floor(attackData.damage * 0.5));
    return result;
  }

  if (reactionType === 'magic_shield') {
    // Absorb acumen * 3 damage before HP
    var acumen = (defender.rpgStats && defender.rpgStats.acumen) ? defender.rpgStats.acumen : 5;
    var shieldAmount = acumen * 3;
    var remaining = attackData.damage - shieldAmount;

    result.success = true;
    result.shieldAbsorbed = Math.min(shieldAmount, attackData.damage);
    result.modifiedDamage = Math.max(0, remaining);
    return result;
  }

  // Unknown reaction type — treat as pass
  return result;
}

function resetReactionPoints(combat) {
  if (!combat || !combat.units) return;

  var resetUnit = function(unit) {
    if (unit.alive !== false) {
      unit.rp = 1;
    }
  };

  if (combat.units.forEach) {
    combat.units.forEach(resetUnit);
  } else {
    var keys = Object.keys(combat.units);
    for (var i = 0; i < keys.length; i++) {
      resetUnit(combat.units[keys[i]]);
    }
  }
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

module.exports = {
  REACTIONS: REACTIONS,
  checkSyncAttacks: checkSyncAttacks,
  resetSyncFlags: resetSyncFlags,
  checkReactionAvailable: checkReactionAvailable,
  checkOpportunityAttack: checkOpportunityAttack,
  executeReaction: executeReaction,
  resetReactionPoints: resetReactionPoints,
  hasLineOfSight: hasLineOfSight,
};
