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
  TURRET:        { damage: 6, duration: 3, element: 'mechanical', isStructure: true, range: 4, hp: 20 },
  HEAL_TURRET:   { heal: 8, healPercent: 0.05, duration: 3, element: 'holy', isStructure: true, range: 4, hp: 15 },
  SHIELD_TURRET: { shield: 12, duration: 3, element: 'mechanical', isStructure: true, range: 3, hp: 18 },
  SANCTUARY:     { healPercent: 0.05, duration: 4, element: 'holy', allySafe: true },
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

  // Structure types: track HP per instance and type-specific stats
  if (def.isStructure) {
    effect.currentHp = def.hp || 20;
    effect.maxHp     = def.hp || 20;
    if (type === 'TURRET') {
      effect.damage  = def.damage || 6;
      effect.range   = def.range  || 4;
      effect.targets = 1;        // how many enemies to shoot (affix can increase)
      effect.lifedrain = 0;      // fraction of damage that heals deployer (affix)
    } else if (type === 'HEAL_TURRET') {
      effect.heal        = def.heal        || 8;
      effect.healPercent = def.healPercent || 0.05;
      effect.range       = def.range       || 4;
    } else if (type === 'SHIELD_TURRET') {
      effect.shield = def.shield || 12;
      effect.range  = def.range  || 3;
    }
  }

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

    // TURRET: shoot up to te.targets nearest enemies within range each turn
    if (te.type === 'TURRET') {
      var turrRange   = te.range   || TILE_EFFECTS.TURRET.range;
      var turrDmg     = te.damage  || TILE_EFFECTS.TURRET.damage;
      var turrTargets = te.targets || 1;
      var turrDrain   = te.lifedrain || 0;
      var allTUs      = getAllUnits(combat);
      // Collect enemies in range sorted by distance
      var inRange = [];
      for (var tu = 0; tu < allTUs.length; tu++) {
        var tUnit = allTUs[tu];
        if (tUnit.ref.type === 'player') continue;
        var tDist = manhattanDistance(te.x, te.y, tUnit.ref.x, tUnit.ref.y);
        if (tDist <= turrRange) inRange.push({ unit: tUnit, dist: tDist });
      }
      inRange.sort(function(a, b) { return a.dist - b.dist; });
      // Element -> tile-effect map for DOT placement
      var _dotTileMap = { poison: 'POISONED', fire: 'BURNING', ice: 'FROZEN', lightning: 'ELECTRIFIED' };

      var shotsLeft = turrTargets;
      for (var tsi = 0; tsi < inRange.length && shotsLeft > 0; tsi++) {
        var target = inRange[tsi].unit;

        // Crit check
        var _isCrit    = (te.critChance > 0) && (Math.random() < te.critChance);
        var _shotDmg   = _isCrit ? Math.round(turrDmg * 2) : turrDmg;
        // Element override (random_element_convert): change reported element of base shot
        var _baseElem  = te.elementOverride || 'mechanical';

        target.ref.hp = Math.max(0, (target.ref.hp || 0) - _shotDmg);
        result.damages.push({
          unitId:   target.id,
          damage:   _shotDmg,
          type:     'TURRET',
          element:  _baseElem,
          isCrit:   _isCrit,
          sourceId: te.id,
          turretX:  te.x,
          turretY:  te.y,
        });

        // Elemental bonuses from affixes / mutations
        if (te.elementBonuses && te.elementBonuses.length > 0) {
          for (var ebi = 0; ebi < te.elementBonuses.length; ebi++) {
            var _eb = te.elementBonuses[ebi];

            if (_eb.bonusType === 'flat') {
              // Undead multiplier (holy affix: undead_mult: 2.0)
              var _elemMult = (_eb.undeadMult && _eb.undeadMult > 1 && target.ref.isUndead) ? _eb.undeadMult : 1;
              var _elemDmg  = Math.round(_eb.value * _elemMult);
              target.ref.hp = Math.max(0, target.ref.hp - _elemDmg);
              result.damages.push({
                unitId:   target.id,
                damage:   _elemDmg,
                type:     'TURRET_ELEMENTAL',
                element:  _eb.element,
                sourceId: te.id,
                turretX:  te.x,
                turretY:  te.y,
              });
              // Ice slow chance: set a slow flag on the enemy unit (dungeon-combat reads this)
              if (_eb.slowChance > 0 && Math.random() < _eb.slowChance) {
                target.ref.slowed = (target.ref.slowed || 0) + 2; // slow for 2 turns
              }

            } else if (_eb.bonusType === 'dot') {
              // Place a tile effect at the enemy's current position
              var _dotTile = _dotTileMap[_eb.element];
              if (_dotTile && target.ref.x !== undefined && target.ref.y !== undefined) {
                createTileEffect(combat, target.ref.x, target.ref.y, _dotTile, te.sourceUnitId);
                result.damages.push({
                  unitId:   target.id,
                  damage:   0,
                  type:     'TURRET_DOT_PLACED',
                  element:  _eb.element,
                  dotType:  _dotTile,
                  sourceId: te.id,
                  turretX:  te.x,
                  turretY:  te.y,
                });
              }
            }
          }
        }

        // --- On-hit effects (status, movement) ---
        if (te.onHitEffects && te.onHitEffects.length > 0 && target.ref.alive) {
          for (var ohi = 0; ohi < te.onHitEffects.length; ohi++) {
            var _oh = te.onHitEffects[ohi];
            if (!_oh) continue;

            if (_oh.type === 'bleed') {
              if (Math.random() < (_oh.chance || 0.25)) {
                if (!target.ref.statusEffects) target.ref.statusEffects = [];
                target.ref.statusEffects.push({ name: 'bleeding', type: 'debuff', duration: _oh.duration || 2, tickDamage: _oh.tickDamage || 4, sourceId: te.sourceUnitId });
                result.damages.push({ unitId: target.id, damage: 0, type: 'TURRET_STATUS', status: 'bleeding', sourceId: te.id });
              }
            } else if (_oh.type === 'burn') {
              if (Math.random() < (_oh.chance || 0.25)) {
                createTileEffect(combat, target.ref.x, target.ref.y, 'BURNING', te.sourceUnitId);
                result.damages.push({ unitId: target.id, damage: 0, type: 'TURRET_STATUS', status: 'burning', sourceId: te.id });
              }
            } else if (_oh.type === 'slow') {
              if (Math.random() < (_oh.chance || 0.25)) {
                target.ref.slowed = (target.ref.slowed || 0) + 2;
                result.damages.push({ unitId: target.id, damage: 0, type: 'TURRET_STATUS', status: 'slowed', sourceId: te.id });
              }
            } else if (_oh.type === 'poison') {
              if (Math.random() < (_oh.chance || 0.20)) {
                createTileEffect(combat, target.ref.x, target.ref.y, 'POISONED', te.sourceUnitId);
                result.damages.push({ unitId: target.id, damage: 0, type: 'TURRET_STATUS', status: 'poisoned', sourceId: te.id });
              }
            } else if (_oh.type === 'stun') {
              if (Math.random() < (_oh.chance || 0.15)) {
                if (!target.ref.statusEffects) target.ref.statusEffects = [];
                target.ref.statusEffects.push({ name: 'stunned', type: 'debuff', duration: _oh.duration || 1, skipTurn: true, sourceId: te.sourceUnitId });
                result.damages.push({ unitId: target.id, damage: 0, type: 'TURRET_STATUS', status: 'stunned', sourceId: te.id });
              }
            } else if (_oh.type === 'mark') {
              if (Math.random() < (_oh.chance || 0.20)) {
                if (!target.ref.statusEffects) target.ref.statusEffects = [];
                target.ref.statusEffects.push({ name: 'marked', type: 'debuff', duration: 3, damageTakenBonus: _oh.damageTakenBonus || 0.10, sourceId: te.sourceUnitId });
                result.damages.push({ unitId: target.id, damage: 0, type: 'TURRET_STATUS', status: 'marked', sourceId: te.id });
              }
            } else if (_oh.type === 'mana_drain') {
              var _mdAmt = _oh.value || 4;
              target.ref.mana = Math.max(0, (target.ref.mana || 0) - _mdAmt);
              result.damages.push({ unitId: target.id, damage: 0, type: 'TURRET_STATUS', status: 'mana_drained', value: _mdAmt, sourceId: te.id });
            } else if (_oh.type === 'wound') {
              if (!target.ref.statusEffects) target.ref.statusEffects = [];
              target.ref.statusEffects.push({ name: 'wounded', type: 'debuff', duration: 3, healingReduction: _oh.healing_reduction || 0.30, sourceId: te.sourceUnitId });
              result.damages.push({ unitId: target.id, damage: 0, type: 'TURRET_STATUS', status: 'wounded', sourceId: te.id });
            } else if (_oh.type === 'knockback' || _oh.type === 'push_on_hit' || _oh.type === 'push') {
              // Push away from turret
              var _kbTiles = _oh.tiles || 1;
              var _kbDx = target.ref.x - te.x;
              var _kbDy = target.ref.y - te.y;
              var _kbLen = Math.sqrt(_kbDx * _kbDx + _kbDy * _kbDy) || 1;
              var _kbNx = _kbDx / _kbLen;
              var _kbNy = _kbDy / _kbLen;
              var _kbFromX = target.ref.x;
              var _kbFromY = target.ref.y;
              for (var _kbi = 0; _kbi < _kbTiles; _kbi++) {
                var _kbNextX = target.ref.x + (_kbNx > 0.5 ? 1 : _kbNx < -0.5 ? -1 : 0);
                var _kbNextY = target.ref.y + (_kbNy > 0.5 ? 1 : _kbNy < -0.5 ? -1 : 0);
                if (_kbNextX === target.ref.x && _kbNextY === target.ref.y) break; // no movement
                target.ref.x = _kbNextX;
                target.ref.y = _kbNextY;
              }
              if (target.ref.x !== _kbFromX || target.ref.y !== _kbFromY) {
                result.damages.push({ unitId: target.id, damage: 0, type: 'TURRET_KNOCKBACK', fromX: _kbFromX, fromY: _kbFromY, toX: target.ref.x, toY: target.ref.y, sourceId: te.id });
              }
            } else if (_oh.type === 'pull') {
              // Pull toward turret
              var _plTiles = _oh.tiles || 1;
              var _plDx = te.x - target.ref.x;
              var _plDy = te.y - target.ref.y;
              var _plLen = Math.sqrt(_plDx * _plDx + _plDy * _plDy) || 1;
              var _plNx = _plDx / _plLen;
              var _plNy = _plDy / _plLen;
              var _plFromX = target.ref.x;
              var _plFromY = target.ref.y;
              for (var _pli = 0; _pli < _plTiles; _pli++) {
                var _plNextX = target.ref.x + (_plNx > 0.5 ? 1 : _plNx < -0.5 ? -1 : 0);
                var _plNextY = target.ref.y + (_plNy > 0.5 ? 1 : _plNy < -0.5 ? -1 : 0);
                if (_plNextX === target.ref.x && _plNextY === target.ref.y) break;
                // Stop before reaching the turret's own tile
                if (_plNextX === te.x && _plNextY === te.y) break;
                target.ref.x = _plNextX;
                target.ref.y = _plNextY;
              }
              if (target.ref.x !== _plFromX || target.ref.y !== _plFromY) {
                result.damages.push({ unitId: target.id, damage: 0, type: 'TURRET_PULL', fromX: _plFromX, fromY: _plFromY, toX: target.ref.x, toY: target.ref.y, sourceId: te.id });
              }
            }
          }
        }

        // --- Pierce: hit additional enemies in the same direction ---
        if (te.pierceTargets > 0 && target.ref.alive !== false) {
          var _pierceDx = target.ref.x - te.x;
          var _pierceDy = target.ref.y - te.y;
          var _pierceLen = Math.sqrt(_pierceDx * _pierceDx + _pierceDy * _pierceDy) || 1;
          var _pierceNx = _pierceDx / _pierceLen > 0.5 ? 1 : _pierceDx / _pierceLen < -0.5 ? -1 : 0;
          var _pierceNy = _pierceDy / _pierceLen > 0.5 ? 1 : _pierceDy / _pierceLen < -0.5 ? -1 : 0;
          var _pierceRemain = te.pierceTargets;
          var _allPU = getAllUnits(combat);
          // Sort by distance from turret along the pierce direction
          for (var _pi2 = 0; _pi2 < _allPU.length && _pierceRemain > 0; _pi2++) {
            var _pu = _allPU[_pi2];
            if (_pu.ref.type === 'player') continue;
            if (_pu.id === target.id) continue;
            // Must be further along the same axis from the primary target
            var _puDx = _pu.ref.x - te.x;
            var _puDy = _pu.ref.y - te.y;
            var _puDist = manhattanDistance(te.x, te.y, _pu.ref.x, _pu.ref.y);
            var _tDist  = manhattanDistance(te.x, te.y, target.ref.x, target.ref.y);
            // Same direction check: dot product of pierce direction with unit offset should be positive and further
            var _dot = _puDx * _pierceNx + _puDy * _pierceNy;
            if (_dot <= 0 || _puDist <= _tDist) continue;
            if (_puDist > turrRange + 1) continue; // within one tile beyond normal range
            _pu.ref.hp = Math.max(0, (_pu.ref.hp || 0) - turrDmg);
            result.damages.push({
              unitId:   _pu.id,
              damage:   turrDmg,
              type:     'TURRET_PIERCE',
              element:  _baseElem,
              sourceId: te.id,
              turretX:  te.x,
              turretY:  te.y,
            });
            _pierceRemain--;
          }
        }

        // --- Chain shot: bounce to nearest OTHER enemy ---
        if (te.chainBounces > 0) {
          var _chainDmg      = Math.round(_shotDmg * (te.chainFalloff || 0.6));
          var _chainBounces  = te.chainBounces;
          var _chainLastId   = target.id;
          var _chainLastX    = target.ref.x;
          var _chainLastY    = target.ref.y;
          var _chainHit      = [target.id];
          for (var _ci = 0; _ci < _chainBounces && _chainDmg > 0; _ci++) {
            var _allCU      = getAllUnits(combat);
            var _chainNext  = null;
            var _chainDist  = Infinity;
            for (var _cj = 0; _cj < _allCU.length; _cj++) {
              var _cu = _allCU[_cj];
              if (_cu.ref.type === 'player') continue;
              var _alreadyHit = false;
              for (var _ck = 0; _ck < _chainHit.length; _ck++) { if (_chainHit[_ck] === _cu.id) { _alreadyHit = true; break; } }
              if (_alreadyHit) continue;
              var _cd = manhattanDistance(_chainLastX, _chainLastY, _cu.ref.x, _cu.ref.y);
              if (_cd < _chainDist) { _chainDist = _cd; _chainNext = _cu; }
            }
            if (!_chainNext || _chainDist > turrRange + 2) break;
            _chainNext.ref.hp = Math.max(0, (_chainNext.ref.hp || 0) - _chainDmg);
            result.damages.push({
              unitId:   _chainNext.id,
              damage:   _chainDmg,
              type:     'TURRET_CHAIN',
              element:  _baseElem,
              chainIdx: _ci + 1,
              sourceId: te.id,
              turretX:  te.x,
              turretY:  te.y,
            });
            _chainHit.push(_chainNext.id);
            _chainLastX = _chainNext.ref.x;
            _chainLastY = _chainNext.ref.y;
            _chainDmg   = Math.round(_chainDmg * (te.chainFalloff || 0.6));
          }
        }

        // Lifedrain: heal the source unit based on total shot damage (base + elemental)
        if (turrDrain > 0 && te.sourceUnitId) {
          var drainHeal = Math.max(1, Math.round(_shotDmg * turrDrain));
          var srcUnit = null;
          if (combat.units) {
            if (typeof combat.units.get === 'function') {
              srcUnit = combat.units.get(te.sourceUnitId);
            } else {
              srcUnit = combat.units[te.sourceUnitId];
            }
          }
          if (srcUnit && srcUnit.alive !== false && (srcUnit.hp || 0) > 0) {
            srcUnit.hp = Math.min(srcUnit.maxHp || srcUnit.hp, (srcUnit.hp || 0) + drainHeal);
            result.damages.push({
              unitId:   te.sourceUnitId,
              damage:   -drainHeal,
              type:     'TURRET_LIFEDRAIN',
              isHeal:   true,
              sourceId: te.id,
            });
          }
        }
        shotsLeft--;
      }
    }

    // HEAL_TURRET: heal up to te.targets lowest-HP allies within range each turn
    if (te.type === 'HEAL_TURRET') {
      var hTurrRange   = te.range   || TILE_EFFECTS.HEAL_TURRET.range;
      var hTurrHealBase = te.heal   || TILE_EFFECTS.HEAL_TURRET.heal;
      var hTurrTargets  = te.targets || 1;
      var allHTUs       = getAllUnits(combat);
      // Collect all allies in range, sorted by HP ascending (lowest first)
      var hInRange = [];
      for (var htu = 0; htu < allHTUs.length; htu++) {
        var htUnit = allHTUs[htu];
        if (htUnit.ref.type !== 'player') continue;
        var htDist = manhattanDistance(te.x, te.y, htUnit.ref.x, htUnit.ref.y);
        if (htDist <= hTurrRange && (htUnit.ref.hp || 0) < (htUnit.ref.maxHp || Infinity)) {
          hInRange.push(htUnit);
        }
      }
      hInRange.sort(function(a, b) { return (a.ref.hp || 0) - (b.ref.hp || 0); });
      var hHealed = 0;
      for (var hhi = 0; hhi < hInRange.length && hHealed < hTurrTargets; hhi++) {
        var hAlly    = hInRange[hhi];
        var _hMaxHp  = hAlly.ref.maxHp || 100;
        var hTurrHeal = Math.max(hTurrHealBase, Math.round(_hMaxHp * (te.healPercent || 0.05)));
        var actualHeal = Math.min(hTurrHeal, _hMaxHp - hAlly.ref.hp);
        if (actualHeal <= 0) continue;
        hAlly.ref.hp += actualHeal;
        result.damages.push({
          unitId:   hAlly.id,
          damage:   -actualHeal,
          type:     'HEAL_TURRET',
          isHeal:   true,
          sourceId: te.id,
          turretX:  te.x,
          turretY:  te.y,
        });
        hHealed++;
      }
    }

    // SHIELD_TURRET: apply a shield buffer to all allies within range each turn
    if (te.type === 'SHIELD_TURRET') {
      var sTurrRange  = te.range  || TILE_EFFECTS.SHIELD_TURRET.range;
      var sTurrShield = te.shield || TILE_EFFECTS.SHIELD_TURRET.shield;
      var allSTUs     = getAllUnits(combat);
      for (var stu = 0; stu < allSTUs.length; stu++) {
        var stUnit = allSTUs[stu];
        if (stUnit.ref.type !== 'player') continue;
        var stDist = manhattanDistance(te.x, te.y, stUnit.ref.x, stUnit.ref.y);
        if (stDist <= sTurrRange) {
          // Shield absorbs damage before HP; accumulates, decays at start of turn in dungeon-combat
          stUnit.ref.shieldHp = Math.min(
            (stUnit.ref.shieldHp || 0) + sTurrShield,
            sTurrShield * 3   // cap at 3x pulse to prevent runaway stacking
          );
          result.damages.push({
            unitId:    stUnit.id,
            damage:    0,
            type:      'SHIELD_TURRET',
            shieldAmt: sTurrShield,
            isShield:  true,
            sourceId:  te.id,
            turretX:   te.x,
            turretY:   te.y,
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
// Turret structure helpers
// ---------------------------------------------------------------------------

/**
 * Apply damage to a turret structure (TURRET tile effect).
 * Removes the turret if its HP drops to 0.
 * Returns { destroyed, id, currentHp } or null if not found.
 */
function damageTurret(combat, turretId, damage) {
  if (!combat || !combat.tileEffects) return null;
  for (var i = 0; i < combat.tileEffects.length; i++) {
    var te = combat.tileEffects[i];
    var _isStructureType = te.type === 'TURRET' || te.type === 'HEAL_TURRET' || te.type === 'SHIELD_TURRET';
    if (_isStructureType && te.id === turretId) {
      te.currentHp = Math.max(0, (te.currentHp || 0) - damage);
      if (te.currentHp <= 0) {
        combat.tileEffects.splice(i, 1);
        return { destroyed: true, id: turretId, type: te.type, x: te.x, y: te.y };
      }
      return { destroyed: false, id: turretId, currentHp: te.currentHp, maxHp: te.maxHp };
    }
  }
  return null;
}

/**
 * Return the structure tile effect (TURRET, HEAL_TURRET, or SHIELD_TURRET) at (x, y) if one exists, else null.
 */
function getTurretAt(combat, x, y) {
  if (!combat || !combat.tileEffects) return null;
  for (var i = 0; i < combat.tileEffects.length; i++) {
    var te = combat.tileEffects[i];
    var _isStruct = te.type === 'TURRET' || te.type === 'HEAL_TURRET' || te.type === 'SHIELD_TURRET';
    if (_isStruct && te.x === x && te.y === y) return te;
  }
  return null;
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
  damageTurret: damageTurret,
  getTurretAt: getTurretAt,
};
