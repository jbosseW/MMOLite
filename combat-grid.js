// combat-grid.js
// Pure grid/pathfinding helpers for the tactical combat system.
// These functions operate on (grid, x, y, width, height, units) — no module-scope state.

'use strict';

var dungeonData = require('./dungeon-data');
var combatTiles = require('./combat-tiles');

var TILE = dungeonData.TILE;

// ---------------------------------------------------------------------------
// Walkable tile set (mirrors dungeon.js — kept in sync here for grid queries)
// ---------------------------------------------------------------------------

var WALKABLE_TILES = {};
WALKABLE_TILES[TILE.FLOOR]       = true;
WALKABLE_TILES[TILE.CORRIDOR]    = true;
WALKABLE_TILES[TILE.DOOR]        = true;
WALKABLE_TILES[TILE.STAIRS_UP]   = true;
WALKABLE_TILES[TILE.STAIRS_DOWN] = true;
WALKABLE_TILES[TILE.ENTRANCE]    = true;
WALKABLE_TILES[TILE.EXIT]        = true;
WALKABLE_TILES[TILE.CHEST]       = true;
WALKABLE_TILES[TILE.TRAP]        = true;
WALKABLE_TILES[TILE.CAMP_SPOT]   = true;
WALKABLE_TILES[TILE.SHRINE]      = true;
WALKABLE_TILES[TILE.BOSS_DOOR]   = true;
WALKABLE_TILES[TILE.SHORTCUT]    = true;

// ---------------------------------------------------------------------------
// Combat grid helpers
// ---------------------------------------------------------------------------

/**
 * Check if a tile is walkable for combat movement.
 * Uses the floor grid and the combat units map to block occupied tiles.
 */
function isWalkableCombat(grid, x, y, width, height, units) {
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  var tile = grid[y][x];
  if (!WALKABLE_TILES[tile]) return false;
  // Check if any alive unit occupies this tile
  if (units) {
    var iter = units.values();
    var entry = iter.next();
    while (!entry.done) {
      var u = entry.value;
      if (u.alive && u.x === x && u.y === y) return false;
      entry = iter.next();
    }
  }
  return true;
}

/**
 * Check if tile is walkable, excluding a specific unit (the one moving).
 */
function isWalkableExcluding(grid, x, y, width, height, units, excludeId) {
  if (x < 0 || x >= width || y < 0 || y >= height) return false;
  var tile = grid[y][x];
  if (!WALKABLE_TILES[tile]) return false;
  if (units) {
    var iter = units.values();
    var entry = iter.next();
    while (!entry.done) {
      var u = entry.value;
      if (u.alive && u.id !== excludeId && u.x === x && u.y === y) return false;
      entry = iter.next();
    }
  }
  return true;
}

/**
 * Get 4-directional adjacent tiles (cardinal only for movement).
 */
function getAdjacentTiles(x, y, width, height) {
  var result = [];
  if (x > 0)            result.push({ x: x - 1, y: y });
  if (x < width - 1)    result.push({ x: x + 1, y: y });
  if (y > 0)            result.push({ x: x, y: y - 1 });
  if (y < height - 1)   result.push({ x: x, y: y + 1 });
  return result;
}

/**
 * Get all 8-directional neighbors (for attack range / adjacency).
 */
function get8Neighbors(x, y, width, height) {
  var result = [];
  for (var dx = -1; dx <= 1; dx++) {
    for (var dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      var nx = x + dx;
      var ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        result.push({ x: nx, y: ny });
      }
    }
  }
  return result;
}

function manhattanDist(x1, y1, x2, y2) {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Chebyshev distance — for diagonal adjacency (melee range).
 * Two tiles are adjacent if chebyshev distance <= 1.
 */
function chebyshevDist(x1, y1, x2, y2) {
  return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
}

/**
 * Check if two positions are adjacent (including diagonals).
 */
function isAdjacent(x1, y1, x2, y2) {
  return chebyshevDist(x1, y1, x2, y2) === 1;
}

/**
 * Euclidean distance (for ranged weapon range checks).
 */
function euclideanDist(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---------------------------------------------------------------------------
// BFS movement range calculation
// ---------------------------------------------------------------------------

/**
 * BFS flood fill from a starting position, limited by maxMP movement points.
 * Movement is 4-directional (cardinal). Walls and occupied tiles block movement.
 *
 * @param {Object} combat   - combat instance (for tile effect cost modifiers)
 * @param {Array} grid      - floor.grid[y][x] tile values
 * @param {number} startX   - unit's current X
 * @param {number} startY   - unit's current Y
 * @param {number} maxMP    - maximum movement points
 * @param {Map} units       - combat units map (for occupied tile checks)
 * @param {number} width    - floor width
 * @param {number} height   - floor height
 * @param {string} unitId   - the moving unit's ID (excluded from occupancy checks)
 * @returns {Object} costMap - { "x,y": cost } for all reachable tiles
 */
function bfsMovementRange(combat, grid, startX, startY, maxMP, units, width, height, unitId) {
  var costMap = {};
  var startKey = startX + ',' + startY;
  costMap[startKey] = 0;

  // BFS queue: each entry is { x, y, cost }
  var queue = [{ x: startX, y: startY, cost: 0 }];
  var head = 0;

  while (head < queue.length) {
    var curr = queue[head++];
    if (curr.cost >= maxMP) continue;

    var neighbors = getAdjacentTiles(curr.x, curr.y, width, height);
    for (var i = 0; i < neighbors.length; i++) {
      var n = neighbors[i];
      var nKey = n.x + ',' + n.y;

      // Calculate movement cost including tile effect modifier
      var extraCost = combatTiles.getMoveCostModifier(combat, n.x, n.y);
      var newCost = curr.cost + 1 + extraCost;

      // Skip if already visited with equal or lower cost
      if (costMap[nKey] !== undefined && costMap[nKey] <= newCost) continue;

      // Check walkability (exclude the moving unit from occupancy)
      if (!isWalkableExcluding(grid, n.x, n.y, width, height, units, unitId)) continue;

      costMap[nKey] = newCost;
      queue.push({ x: n.x, y: n.y, cost: newCost });
    }
  }

  return costMap;
}

/**
 * Reconstruct a BFS shortest path from the costMap.
 * Traces back from target to start by following decreasing costs.
 *
 * @returns {Array|null} path as [{x,y}, ...] from start to target (inclusive), or null if unreachable
 */
function bfsPath(combat, grid, startX, startY, targetX, targetY, maxMP, units, width, height, unitId) {
  // Run BFS to get cost map
  var costMap = bfsMovementRange(combat, grid, startX, startY, maxMP, units, width, height, unitId);
  var targetKey = targetX + ',' + targetY;
  if (costMap[targetKey] === undefined) return null;

  // Trace back from target to start
  var path = [];
  var cx = targetX;
  var cy = targetY;
  var currentCost = costMap[targetKey];

  while (cx !== startX || cy !== startY) {
    path.push({ x: cx, y: cy });
    var neighbors = getAdjacentTiles(cx, cy, width, height);
    var foundPrev = false;
    var bestNeighborCost = currentCost;
    var bestNx = cx;
    var bestNy = cy;
    for (var i = 0; i < neighbors.length; i++) {
      var n = neighbors[i];
      var nKey = n.x + ',' + n.y;
      if (costMap[nKey] !== undefined && costMap[nKey] < bestNeighborCost) {
        bestNeighborCost = costMap[nKey];
        bestNx = n.x;
        bestNy = n.y;
        foundPrev = true;
      }
    }
    if (!foundPrev) return null; // Should never happen with valid costMap
    cx = bestNx;
    cy = bestNy;
    currentCost = bestNeighborCost;
  }

  path.push({ x: startX, y: startY });
  path.reverse();
  return path;
}

// ---------------------------------------------------------------------------
// Calculate movement range (public API)
// ---------------------------------------------------------------------------

/**
 * Calculate all tiles a unit can move to.
 * Returns an array of {x, y, cost} entries.
 */
function calculateMoveRange(combat, unitId) {
  var unit = combat.units.get(unitId);
  if (!unit || !unit.alive) return [];

  var floor = combat.floor;
  var costMap = bfsMovementRange(
    combat, floor.grid, unit.x, unit.y, unit.mp,
    combat.units, floor.width, floor.height, unitId
  );

  var result = [];
  var keys = Object.keys(costMap);
  for (var i = 0; i < keys.length; i++) {
    var parts = keys[i].split(',');
    var tx = parseInt(parts[0], 10);
    var ty = parseInt(parts[1], 10);
    // Exclude the unit's current position from the move range
    if (tx === unit.x && ty === unit.y) continue;
    result.push({ x: tx, y: ty, cost: costMap[keys[i]] });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Validate movement
// ---------------------------------------------------------------------------

/**
 * Validate a proposed move for a unit.
 * Returns { valid, path, cost } or { valid: false, reason }.
 */
function validateMove(combat, unitId, targetX, targetY) {
  var unit = combat.units.get(unitId);
  if (!unit || !unit.alive) {
    return { valid: false, reason: 'Unit is dead or does not exist' };
  }
  if (unit.mp <= 0) {
    return { valid: false, reason: 'No movement points remaining' };
  }
  if (targetX === unit.x && targetY === unit.y) {
    return { valid: false, reason: 'Already at target position' };
  }

  var floor = combat.floor;

  // Check bounds
  if (targetX < 0 || targetX >= floor.width || targetY < 0 || targetY >= floor.height) {
    return { valid: false, reason: 'Target out of bounds' };
  }

  // Run BFS to find shortest path
  var path = bfsPath(
    combat, floor.grid, unit.x, unit.y, targetX, targetY,
    unit.mp, combat.units, floor.width, floor.height, unitId
  );

  if (!path) {
    return { valid: false, reason: 'No valid path to target' };
  }

  // Path includes start tile; cost is path length minus 1
  var cost = path.length - 1;
  if (cost > unit.mp) {
    return { valid: false, reason: 'Not enough MP to reach target' };
  }

  return { valid: true, path: path, cost: cost };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  WALKABLE_TILES: WALKABLE_TILES,
  isWalkableCombat: isWalkableCombat,
  isWalkableExcluding: isWalkableExcluding,
  getAdjacentTiles: getAdjacentTiles,
  get8Neighbors: get8Neighbors,
  manhattanDist: manhattanDist,
  chebyshevDist: chebyshevDist,
  isAdjacent: isAdjacent,
  euclideanDist: euclideanDist,
  bfsMovementRange: bfsMovementRange,
  bfsPath: bfsPath,
  calculateMoveRange: calculateMoveRange,
  validateMove: validateMove,
};
