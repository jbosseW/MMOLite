// combat-tiles.js
// Tile effect system for tactical combat.
// Handles elemental tile effects (burning, frozen, poison, etc.), chain reactions,
// movement/speed modifiers, and line-of-sight blocking.

'use strict';

// ---------------------------------------------------------------------------
// Tile effect type definitions
// ---------------------------------------------------------------------------

var TILE_EFFECTS = {
  BURNING:     { damage: 8,  duration: 3,  element: 'fire' },
  FROZEN:      { speedMod: -50, duration: 2, element: 'ice' },
  POISONED:    { damage: 5,  duration: 4,  element: 'poison' },
  ELECTRIFIED: { damage: 12, duration: 1,  element: 'lightning', chains: true },
  SMOKE:       { blocksLOS: true, duration: 3 },
  WATER:       { speedMod: -25, duration: -1, element: 'water' },   // permanent until evaporated
  OIL:         { duration: -1, element: 'oil' },                     // permanent, flammable
  BRAMBLE:     { damage: 3,  moveCost: 2, duration: 5 },            // 5 turns
  TURRET:      { damage: 6, duration: 3, element: 'mechanical', isStructure: true },
  SANCTUARY:   { healPercent: 0.05, duration: 4, element: 'holy', allySafe: true },
};

// ---------------------------------------------------------------------------
// Internal ID counter for tile effect instances
// ---------------------------------------------------------------------------

var _nextTileEffectIndex = 0;
// Wrap counter to prevent overflow (resets every 10M, IDs still unique per combat instance)
var TILE_EFFECT_INDEX_WRAP = 10000000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function manhattanDistance(x1, y1, x2, y2) {
  var dx = x1 - x2;
  var dy = y1 - y2;
  return (dx < 0 ? -dx : dx) + (dy < 0 ? -dy : dy);
}

/**
 * Find all units (players + enemies) standing at a given grid position.
 * Returns an array of objects with { id, ref } where ref is the unit object.
 * The combat object is expected to have:
 *   combat.units - a map/object of unitId -> { x, y, hp, ... }
 *     OR
 *   combat.players / combat.enemies arrays
 * We support both shapes for forward compatibility.
 */
function getUnitsAtPosition(combat, x, y) {
  var results = [];
  if (!combat) return results;

  // Shape 1: combat.units is an object/map keyed by id
  if (combat.units) {
    var keys = Object.keys(combat.units);
    for (var i = 0; i < keys.length; i++) {
      var u = combat.units[keys[i]];
      if (u && u.x === x && u.y === y && u.hp > 0 && u.alive !== false) {
        results.push({ id: keys[i], ref: u });
      }
    }
  }

  // Shape 2: separate players/enemies arrays (dungeon-style)
  if (combat.players) {
    for (var pi = 0; pi < combat.players.length; pi++) {
      var p = combat.players[pi];
      if (p && p.x === x && p.y === y && p.hp > 0 && p.alive !== false) {
        results.push({ id: p.id || p.socketId || ('player_' + pi), ref: p });
      }
    }
  }
  if (combat.enemies) {
    for (var ei = 0; ei < combat.enemies.length; ei++) {
      var e = combat.enemies[ei];
      if (e && e.x === x && e.y === y && e.hp > 0 && e.alive !== false) {
        results.push({ id: e.id || ('enemy_' + ei), ref: e });
      }
    }
  }

  return results;
}

/**
 * Collect all living units across every position in the combat.
 * Returns flat array of { id, ref }.
 */
function getAllUnits(combat) {
  var results = [];
  if (!combat) return results;

  if (combat.units) {
    var keys = Object.keys(combat.units);
    for (var i = 0; i < keys.length; i++) {
      var u = combat.units[keys[i]];
      if (u && u.hp > 0 && u.alive !== false) {
        results.push({ id: keys[i], ref: u });
      }
    }
  }
  if (combat.players) {
    for (var pi = 0; pi < combat.players.length; pi++) {
      var p = combat.players[pi];
      if (p && p.hp > 0 && p.alive !== false) {
        results.push({ id: p.id || p.socketId || ('player_' + pi), ref: p });
      }
    }
  }
  if (combat.enemies) {
    for (var ei = 0; ei < combat.enemies.length; ei++) {
      var e = combat.enemies[ei];
      if (e && e.hp > 0 && e.alive !== false) {
        results.push({ id: e.id || ('enemy_' + ei), ref: e });
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Core: find effects at position
// ---------------------------------------------------------------------------

/**
 * Return the tile effect(s) at a given position.
 * If one effect: returns that object. If multiple: returns array. If none: null.
 */
function getTileEffectAt(combat, x, y) {
  if (!combat || !combat.tileEffects) return null;
  var found = [];
  for (var i = 0; i < combat.tileEffects.length; i++) {
    var te = combat.tileEffects[i];
    if (te.x === x && te.y === y) {
      found.push(te);
    }
  }
  if (found.length === 0) return null;
  if (found.length === 1) return found[0];
  return found;
}

/**
 * Return all tile effects within manhattan distance `radius` of (centerX, centerY).
 */
function getTileEffectsInArea(combat, centerX, centerY, radius) {
  if (!combat || !combat.tileEffects) return [];
  var results = [];
  for (var i = 0; i < combat.tileEffects.length; i++) {
    var te = combat.tileEffects[i];
    if (manhattanDistance(te.x, te.y, centerX, centerY) <= radius) {
      results.push(te);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Core: remove effects
// ---------------------------------------------------------------------------

/**
 * Remove a specific tile effect by position and type.
 * If type is null/undefined, remove ALL effects at that position.
 * Returns array of removed effects.
 */
function removeTileEffect(combat, x, y, type) {
  if (!combat || !combat.tileEffects) return [];
  var removed = [];
  var kept = [];
  for (var i = 0; i < combat.tileEffects.length; i++) {
    var te = combat.tileEffects[i];
    if (te.x === x && te.y === y && (type == null || te.type === type)) {
      removed.push(te);
    } else {
      kept.push(te);
    }
  }
  combat.tileEffects = kept;
  return removed;
}

// ---------------------------------------------------------------------------
// Internal: place a raw tile effect (no chain reaction check)
// ---------------------------------------------------------------------------

function _placeEffect(combat, x, y, type, sourceUnitId) {
  var def = TILE_EFFECTS[type];
  if (!def) return null;

  var effect = {
    id: 'te_' + (_nextTileEffectIndex++ % TILE_EFFECT_INDEX_WRAP),
    type: type,
    x: x,
    y: y,
    duration: def.duration,
    sourceUnitId: sourceUnitId || null,
    turnCreated: combat.turn || 0,
  };

  if (!combat.tileEffects) combat.tileEffects = [];
  combat.tileEffects.push(effect);
  return effect;
}

// ---------------------------------------------------------------------------
// Chain reactions
// ---------------------------------------------------------------------------

/**
 * Check if the newly placed effect at (x,y) interacts with existing effects.
 * Execute chain reaction logic and recursively check further reactions.
 * Returns array of all changes:
 *   [{ action: 'created'|'removed'|'transformed', x, y, type, ... }, ...]
 */
function checkChainReaction(combat, x, y, newType, _depth) {
  if (!combat || !combat.tileEffects) return [];
  // Prevent runaway recursive chain reactions (max 8 deep)
  _depth = _depth || 0;
  if (_depth >= 8) return [];

  var changes = [];
  var newElement = TILE_EFFECTS[newType] ? TILE_EFFECTS[newType].element : null;

  // Gather existing effects at the target position (excluding the one just placed)
  var existing = [];
  for (var i = 0; i < combat.tileEffects.length; i++) {
    var te = combat.tileEffects[i];
    if (te.x === x && te.y === y && te.type !== newType) {
      existing.push(te);
    }
  }

  for (var ei = 0; ei < existing.length; ei++) {
    var other = existing[ei];
    var otherElement = TILE_EFFECTS[other.type] ? TILE_EFFECTS[other.type].element : null;

    // --- Fire + Oil -> Explosion: 3x3 area becomes BURNING, remove OIL ---
    if ((newElement === 'fire' && otherElement === 'oil') ||
        (newElement === 'oil' && otherElement === 'fire')) {
      // Remove the OIL at this tile
      removeTileEffect(combat, x, y, 'OIL');
      changes.push({ action: 'removed', x: x, y: y, type: 'OIL' });

      // Also remove the BURNING at this tile if fire was the existing one
      if (otherElement === 'fire') {
        removeTileEffect(combat, x, y, 'BURNING');
        changes.push({ action: 'removed', x: x, y: y, type: 'BURNING' });
      }

      // 3x3 area explosion
      for (var ox = x - 1; ox <= x + 1; ox++) {
        for (var oy = y - 1; oy <= y + 1; oy++) {
          // Remove any OIL in the explosion area
          var oilRemoved = removeTileEffect(combat, ox, oy, 'OIL');
          if (oilRemoved.length > 0) {
            changes.push({ action: 'removed', x: ox, y: oy, type: 'OIL' });
          }
          // Place BURNING if not already burning here
          var hasBurning = false;
          for (var bi = 0; bi < combat.tileEffects.length; bi++) {
            if (combat.tileEffects[bi].x === ox && combat.tileEffects[bi].y === oy &&
                combat.tileEffects[bi].type === 'BURNING') {
              hasBurning = true;
              break;
            }
          }
          if (!hasBurning) {
            var bEff = _placeEffect(combat, ox, oy, 'BURNING', null);
            if (bEff) {
              changes.push({ action: 'created', x: ox, y: oy, type: 'BURNING', id: bEff.id });
              // Recursively check chain reactions for each new BURNING tile (skip center)
              if (ox !== x || oy !== y) {
                var sub = checkChainReaction(combat, ox, oy, 'BURNING', _depth + 1);
                for (var si = 0; si < sub.length; si++) changes.push(sub[si]);
              }
            }
          }
        }
      }
      continue;
    }

    // --- Fire + Water -> SMOKE, remove both ---
    if ((newElement === 'fire' && otherElement === 'water') ||
        (newElement === 'water' && otherElement === 'fire')) {
      removeTileEffect(combat, x, y, 'BURNING');
      changes.push({ action: 'removed', x: x, y: y, type: 'BURNING' });
      removeTileEffect(combat, x, y, 'WATER');
      changes.push({ action: 'removed', x: x, y: y, type: 'WATER' });

      // Place SMOKE if not already present
      var hasSmoke = false;
      for (var smi = 0; smi < combat.tileEffects.length; smi++) {
        if (combat.tileEffects[smi].x === x && combat.tileEffects[smi].y === y &&
            combat.tileEffects[smi].type === 'SMOKE') {
          hasSmoke = true;
          break;
        }
      }
      if (!hasSmoke) {
        var sEff = _placeEffect(combat, x, y, 'SMOKE', null);
        if (sEff) {
          changes.push({ action: 'created', x: x, y: y, type: 'SMOKE', id: sEff.id });
        }
      }
      continue;
    }

    // --- Ice + Fire -> WATER, remove both ---
    if ((newElement === 'ice' && otherElement === 'fire') ||
        (newElement === 'fire' && otherElement === 'ice')) {
      removeTileEffect(combat, x, y, 'BURNING');
      changes.push({ action: 'removed', x: x, y: y, type: 'BURNING' });
      removeTileEffect(combat, x, y, 'FROZEN');
      changes.push({ action: 'removed', x: x, y: y, type: 'FROZEN' });

      var hasWater = false;
      for (var wi = 0; wi < combat.tileEffects.length; wi++) {
        if (combat.tileEffects[wi].x === x && combat.tileEffects[wi].y === y &&
            combat.tileEffects[wi].type === 'WATER') {
          hasWater = true;
          break;
        }
      }
      if (!hasWater) {
        var wEff = _placeEffect(combat, x, y, 'WATER', null);
        if (wEff) {
          changes.push({ action: 'created', x: x, y: y, type: 'WATER', id: wEff.id });
          // WATER placement could trigger further reactions (e.g. if lightning is here)
          var wSub = checkChainReaction(combat, x, y, 'WATER', _depth + 1);
          for (var wsi = 0; wsi < wSub.length; wsi++) changes.push(wSub[wsi]);
        }
      }
      continue;
    }

    // --- Water + Lightning -> chain electrocute all units on WATER tiles ---
    if ((newElement === 'lightning' && otherElement === 'water') ||
        (newElement === 'water' && otherElement === 'lightning')) {
      // Find all WATER tiles in the entire combat
      var waterTiles = [];
      for (var wti = 0; wti < combat.tileEffects.length; wti++) {
        if (combat.tileEffects[wti].type === 'WATER') {
          waterTiles.push(combat.tileEffects[wti]);
        }
      }
      // Also include the current tile in case the water is being newly placed
      var allUnits = getAllUnits(combat);
      for (var ui = 0; ui < allUnits.length; ui++) {
        var unit = allUnits[ui];
        var onWater = false;
        for (var twi = 0; twi < waterTiles.length; twi++) {
          if (waterTiles[twi].x === unit.ref.x && waterTiles[twi].y === unit.ref.y) {
            onWater = true;
            break;
          }
        }
        if (onWater) {
          var eDmg = TILE_EFFECTS.ELECTRIFIED.damage;
          unit.ref.hp = Math.max(0, (unit.ref.hp || 0) - eDmg);
          changes.push({
            action: 'chain_damage',
            x: unit.ref.x,
            y: unit.ref.y,
            type: 'ELECTRIFIED',
            unitId: unit.id,
            damage: eDmg,
          });
        }
      }
      continue;
    }

    // --- Fire + BRAMBLE -> 3x3 area becomes BURNING, remove BRAMBLE in area ---
    if ((newElement === 'fire' && other.type === 'BRAMBLE') ||
        (newType === 'BRAMBLE' && otherElement === 'fire')) {
      // Determine the fire source position (always the current x,y)
      for (var bx = x - 1; bx <= x + 1; bx++) {
        for (var by = y - 1; by <= y + 1; by++) {
          // Remove BRAMBLE in the area
          var brambleRemoved = removeTileEffect(combat, bx, by, 'BRAMBLE');
          if (brambleRemoved.length > 0) {
            changes.push({ action: 'removed', x: bx, y: by, type: 'BRAMBLE' });
          }
          // Place BURNING if not already present
          var hasBurn = false;
          for (var bci = 0; bci < combat.tileEffects.length; bci++) {
            if (combat.tileEffects[bci].x === bx && combat.tileEffects[bci].y === by &&
                combat.tileEffects[bci].type === 'BURNING') {
              hasBurn = true;
              break;
            }
          }
          if (!hasBurn) {
            var brEff = _placeEffect(combat, bx, by, 'BURNING', null);
            if (brEff) {
              changes.push({ action: 'created', x: bx, y: by, type: 'BURNING', id: brEff.id });
              // Recursive check for new burning tiles (skip center to avoid infinite loop)
              if (bx !== x || by !== y) {
                var brSub = checkChainReaction(combat, bx, by, 'BURNING', _depth + 1);
                for (var bsi = 0; bsi < brSub.length; bsi++) changes.push(brSub[bsi]);
              }
            }
          }
        }
      }
      continue;
    }
  }

  return changes;
}

// ---------------------------------------------------------------------------
// Core: create a tile effect (public API)
// ---------------------------------------------------------------------------

/**
 * Create a tile effect instance at (x, y).
 * Triggers chain reactions. Returns array of all new/modified effects for broadcasting.
 */
function createTileEffect(combat, x, y, type, sourceUnitId) {
  if (!combat) return [];
  if (!TILE_EFFECTS[type]) return [];

  // Initialize tileEffects array if absent
  if (!combat.tileEffects) combat.tileEffects = [];

  var results = [];

  // Place the effect
  var effect = _placeEffect(combat, x, y, type, sourceUnitId);
  if (!effect) return [];
  results.push(effect);

  // Check chain reactions
  var reactions = checkChainReaction(combat, x, y, type);
  for (var i = 0; i < reactions.length; i++) {
    results.push(reactions[i]);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Core: process tile effects at round end
// ---------------------------------------------------------------------------

/**
 * Called at round/turn end. Applies damage, decrements durations, removes expired.
 * Returns { damages: [...], expired: [...], remaining: [...] }
 */
function processTileEffects(combat) {
  var result = { damages: [], expired: [], remaining: [] };
  if (!combat || !combat.tileEffects) return result;

  // Track which water tiles have already been chain-electrocuted this round
  var electrifiedChainDone = false;

  // First pass: apply effects to units standing on affected tiles
  for (var i = 0; i < combat.tileEffects.length; i++) {
    var te = combat.tileEffects[i];
    var def = TILE_EFFECTS[te.type];
    if (!def) continue;

    // Damage-dealing effects: BURNING, POISONED, BRAMBLE
    if (def.damage && (te.type === 'BURNING' || te.type === 'POISONED' || te.type === 'BRAMBLE')) {
      var unitsHere = getUnitsAtPosition(combat, te.x, te.y);
      for (var u = 0; u < unitsHere.length; u++) {
        var unit = unitsHere[u];
        unit.ref.hp = Math.max(0, (unit.ref.hp || 0) - def.damage);
        result.damages.push({
          unitId: unit.id,
          damage: def.damage,
          type: te.type,
        });
      }
    }

    // SANCTUARY: heal ally units standing on the tile
    if (te.type === 'SANCTUARY' && def.healPercent) {
      var sanctUnits = getUnitsAtPosition(combat, te.x, te.y);
      for (var su = 0; su < sanctUnits.length; su++) {
        var sUnit = sanctUnits[su];
        // allySafe: only heal allies of the caster
        if (def.allySafe && te.sourceUnitId) {
          // Determine if this unit is on the same team as the caster
          // If we have the unit reference with a type field, compare types
          var sourceUnit = null;
          if (combat.units) {
            if (typeof combat.units.get === 'function') {
              sourceUnit = combat.units.get(te.sourceUnitId);
            } else {
              sourceUnit = combat.units[te.sourceUnitId];
            }
          }
          if (sourceUnit && sUnit.ref.type && sourceUnit.type && sUnit.ref.type !== sourceUnit.type) {
            continue; // Skip enemies — only heal allies of the caster
          }
        }
        var sMaxHp = sUnit.ref.maxHp || 100;
        var sHealAmt = Math.max(1, Math.floor(sMaxHp * def.healPercent));
        var sOldHp = sUnit.ref.hp || 0;
        sUnit.ref.hp = Math.min(sMaxHp, sOldHp + sHealAmt);
        var sActualHeal = sUnit.ref.hp - sOldHp;
        if (sActualHeal > 0) {
          result.damages.push({
            unitId: sUnit.id,
            damage: -sActualHeal, // Negative damage = healing
            type: 'SANCTUARY',
            isHeal: true,
          });
        }
      }
    }

    // ELECTRIFIED with chains: damage all units on WATER tiles (once per round)
    if (te.type === 'ELECTRIFIED' && def.chains && !electrifiedChainDone) {
      electrifiedChainDone = true;
      var allUnits = getAllUnits(combat);
      for (var eu = 0; eu < allUnits.length; eu++) {
        var eUnit = allUnits[eu];
        // Check if this unit is standing on a WATER tile
        var onWater = false;
        for (var wi = 0; wi < combat.tileEffects.length; wi++) {
          var wte = combat.tileEffects[wi];
          if (wte.type === 'WATER' && wte.x === eUnit.ref.x && wte.y === eUnit.ref.y) {
            onWater = true;
            break;
          }
        }
        if (onWater) {
          eUnit.ref.hp = Math.max(0, (eUnit.ref.hp || 0) - def.damage);
          result.damages.push({
            unitId: eUnit.id,
            damage: def.damage,
            type: 'ELECTRIFIED',
          });
        }
      }
    }
  }

  // Second pass: decrement durations and collect expired/remaining
  var kept = [];
  for (var di = 0; di < combat.tileEffects.length; di++) {
    var dte = combat.tileEffects[di];

    if (dte.duration > 0) {
      dte.duration--;
      if (dte.duration <= 0) {
        result.expired.push({ x: dte.x, y: dte.y, type: dte.type });
        continue; // do not keep
      }
    }
    // duration === -1 means permanent, always keep
    // duration > 0 after decrement means still active
    kept.push(dte);
    result.remaining.push(dte);
  }

  combat.tileEffects = kept;
  return result;
}

// ---------------------------------------------------------------------------
// Movement cost modifier
// ---------------------------------------------------------------------------

/**
 * Return extra movement cost for a tile.
 * BRAMBLE adds +1 extra MP cost (moveCost is 2, base is 1, so extra = moveCost - 1).
 * Return 0 if no movement-affecting effect on tile.
 */
function getMoveCostModifier(combat, x, y) {
  if (!combat || !combat.tileEffects) return 0;
  var extraCost = 0;
  for (var i = 0; i < combat.tileEffects.length; i++) {
    var te = combat.tileEffects[i];
    if (te.x === x && te.y === y) {
      var def = TILE_EFFECTS[te.type];
      if (def && def.moveCost && def.moveCost > 1) {
        var thisExtra = def.moveCost - 1;
        if (thisExtra > extraCost) {
          extraCost = thisExtra;
        }
      }
    }
  }
  return extraCost;
}

// ---------------------------------------------------------------------------
// Speed modifier
// ---------------------------------------------------------------------------

/**
 * Return total speed modification percentage for a unit standing on this tile.
 * FROZEN: -50, WATER: -25. Multiple effects stack (summed).
 * Return 0 if no speed-affecting effect.
 */
function getSpeedModifier(combat, x, y) {
  if (!combat || !combat.tileEffects) return 0;
  var totalMod = 0;
  for (var i = 0; i < combat.tileEffects.length; i++) {
    var te = combat.tileEffects[i];
    if (te.x === x && te.y === y) {
      var def = TILE_EFFECTS[te.type];
      if (def && def.speedMod) {
        totalMod += def.speedMod;
      }
    }
  }
  return totalMod;
}

// ---------------------------------------------------------------------------
// Line-of-sight blocking
// ---------------------------------------------------------------------------

/**
 * Return true if any effect on this tile blocks line of sight (SMOKE).
 */
function doesBlockLOS(combat, x, y) {
  if (!combat || !combat.tileEffects) return false;
  for (var i = 0; i < combat.tileEffects.length; i++) {
    var te = combat.tileEffects[i];
    if (te.x === x && te.y === y) {
      var def = TILE_EFFECTS[te.type];
      if (def && def.blocksLOS) {
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

module.exports = {
  TILE_EFFECTS: TILE_EFFECTS,
  createTileEffect: createTileEffect,
  processTileEffects: processTileEffects,
  checkChainReaction: checkChainReaction,
  getTileEffectAt: getTileEffectAt,
  getTileEffectsInArea: getTileEffectsInArea,
  removeTileEffect: removeTileEffect,
  getMoveCostModifier: getMoveCostModifier,
  getSpeedModifier: getSpeedModifier,
  doesBlockLOS: doesBlockLOS,
};
