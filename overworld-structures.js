// overworld-structures.js
// Manages procedural overworld structures (bandit camps, strongholds, etc.)
// Structures spawn dynamically as world events and function as dungeons.
// They appear on the overworld map and can be entered like caves/world dungeons.

'use strict';

var crypto = require('crypto');
var dungeonData = require('./dungeon-data');
var worldgen = require('./worldgen');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var MAX_ACTIVE_STRUCTURES = 30;       // max concurrent structures in world
var STRUCTURE_LIFETIME_MS = 2 * 60 * 60 * 1000;  // 2 hours default
var SPAWN_CHECK_INTERVAL_MS = 5 * 60 * 1000;     // check every 5 minutes
var MIN_DISTANCE_BETWEEN_STRUCTURES = 10;         // chunks
var MIN_DISTANCE_FROM_TOWNS = 8;                  // chunks from anchor towns
var STRUCTURE_RESPAWN_DELAY_MS = 30 * 60 * 1000;  // 30min before same area can respawn
var MAX_SPAWN_ATTEMPTS = 40;                      // max attempts per spawn try
var CHUNK_SIZE = worldgen.CHUNK_SIZE;
var WORLD_CHUNKS_X = worldgen.WORLD_CHUNKS_X;
var WORLD_CHUNKS_Y = worldgen.WORLD_CHUNKS_Y;
var WORLD_SCALE = worldgen.WORLD_SCALE;

var STRUCTURE_TYPES = dungeonData.STRUCTURE_TYPES;

// Active structures: Map<structureId, structureData>
var activeStructures = new Map();

// Cleared structures: Map<structureId, clearedAt> — prevents immediate respawn
var clearedStructures = new Map();

// Structure generation seed counter
var structureSeedCounter = 0;

// Anchor town chunk positions (populated on init from state zone definitions)
// Reference coords: chunk = (originCX + refX, originCY + refY)
var TOWN_CHUNKS = [
  { cx: WORLD_SCALE.originCX + 35, cy: WORLD_SCALE.originCY + 42 },  // Holy Dominion
  { cx: WORLD_SCALE.originCX + 40, cy: WORLD_SCALE.originCY + 38 },  // Solara
  { cx: WORLD_SCALE.originCX + 45, cy: WORLD_SCALE.originCY + 55 },  // Sylvaris
  { cx: WORLD_SCALE.originCX + 32, cy: WORLD_SCALE.originCY + 8  },  // Ironhold
  { cx: WORLD_SCALE.originCX + 18, cy: WORLD_SCALE.originCY + 25 },  // Kragmor
  { cx: WORLD_SCALE.originCX + 10, cy: WORLD_SCALE.originCY + 38 },  // BoneTrap
  { cx: WORLD_SCALE.originCX + 15, cy: WORLD_SCALE.originCY + 52 },  // Murkmire
  { cx: WORLD_SCALE.originCX + 95, cy: WORLD_SCALE.originCY + 38 },  // Mechspire
  { cx: WORLD_SCALE.originCX + 92, cy: WORLD_SCALE.originCY + 50 },  // Clockwork Harbor
  { cx: WORLD_SCALE.originCX + 35, cy: WORLD_SCALE.originCY - 8  },  // Fortune's Rest
];

// Cached list of structure type keys and total spawn weight
var _structureTypeKeys = Object.keys(STRUCTURE_TYPES);
var _totalSpawnWeight = 0;
var _weightedTypes = [];
for (var _sti = 0; _sti < _structureTypeKeys.length; _sti++) {
  var _sType = STRUCTURE_TYPES[_structureTypeKeys[_sti]];
  _totalSpawnWeight += _sType.spawnWeight;
  _weightedTypes.push({ def: _sType, weight: _sType.spawnWeight });
}

// Seeded RNG using worldgen's implementation
var seededRandom = worldgen.seededRandom;
var chunkSeed = worldgen.chunkSeed;

// Last tick timestamp
var _lastTickTime = 0;

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function generateStructureId() {
  structureSeedCounter++;
  return 'struct_' + Date.now().toString(36) + '_' + structureSeedCounter.toString(36) + '_' + crypto.randomBytes(3).toString('hex');
}

function distanceSq(x1, y1, x2, y2) {
  var dx = x1 - x2;
  var dy = y1 - y2;
  return dx * dx + dy * dy;
}

/**
 * Pick a weighted random structure type.
 * @returns {object|null} A STRUCTURE_TYPES entry
 */
function pickWeightedStructureType() {
  var roll = Math.random() * _totalSpawnWeight;
  var cumulative = 0;
  for (var i = 0; i < _weightedTypes.length; i++) {
    cumulative += _weightedTypes[i].weight;
    if (roll < cumulative) return _weightedTypes[i].def;
  }
  return _weightedTypes[_weightedTypes.length - 1].def;
}

/**
 * Check if a chunk position is too close to a town.
 */
function isTooCloseToTown(cx, cy) {
  var minDistSq = MIN_DISTANCE_FROM_TOWNS * MIN_DISTANCE_FROM_TOWNS;
  for (var i = 0; i < TOWN_CHUNKS.length; i++) {
    if (distanceSq(cx, cy, TOWN_CHUNKS[i].cx, TOWN_CHUNKS[i].cy) < minDistSq) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a chunk position is too close to an existing structure.
 */
function isTooCloseToStructure(cx, cy) {
  var minDistSq = MIN_DISTANCE_BETWEEN_STRUCTURES * MIN_DISTANCE_BETWEEN_STRUCTURES;
  for (var entry of activeStructures) {
    var struct = entry[1];
    if (distanceSq(cx, cy, struct.chunkX, struct.chunkY) < minDistSq) {
      return true;
    }
  }
  return false;
}

/**
 * Check if any recently-cleared structure was near this position.
 */
function isRecentlyClearedNearby(cx, cy) {
  var minDistSq = MIN_DISTANCE_BETWEEN_STRUCTURES * MIN_DISTANCE_BETWEEN_STRUCTURES;
  for (var entry of clearedStructures) {
    var sid = entry[0];
    // Parse chunk coords from the cleared structure data if stored
    // We store {clearedAt, chunkX, chunkY} in clearedStructures
    var data = entry[1];
    if (data && typeof data === 'object' && data.chunkX != null) {
      if (distanceSq(cx, cy, data.chunkX, data.chunkY) < minDistSq) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Find a valid chunk position for a structure with given biome requirements.
 * Searches randomly in the main continent area.
 * @param {number[]} validBiomes - Array of biome IDs this structure can spawn in
 * @returns {{cx: number, cy: number}|null}
 */
function findValidChunkPosition(validBiomes) {
  // Main continent: reference coords roughly -10 to 100 x, -20 to 70 y
  // Chunk coords: originCX + refX, originCY + refY
  // We'll search in a generous area around the main continent
  var minCX = WORLD_SCALE.originCX - 15;
  var maxCX = WORLD_SCALE.originCX + 105;
  var minCY = WORLD_SCALE.originCY - 30;
  var maxCY = WORLD_SCALE.originCY + 80;

  for (var attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++) {
    var cx = minCX + Math.floor(Math.random() * (maxCX - minCX));
    var cy = minCY + Math.floor(Math.random() * (maxCY - minCY));

    // Check biome
    var biome = worldgen.getBiome(cx, cy);
    var biomeValid = false;
    for (var bi = 0; bi < validBiomes.length; bi++) {
      if (validBiomes[bi] === biome) {
        biomeValid = true;
        break;
      }
    }
    if (!biomeValid) continue;

    // Must be walkable
    if (biome === 0) continue; // WATER

    // Distance checks
    if (isTooCloseToTown(cx, cy)) continue;
    if (isTooCloseToStructure(cx, cy)) continue;
    if (isRecentlyClearedNearby(cx, cy)) continue;

    return { cx: cx, cy: cy };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Initialize the structure system.
 * @param {object} state - game state (unused for now, but ready for future zone integration)
 */
function init(state) {
  // Initial seed for spawning structures on first tick
  _lastTickTime = Date.now() - SPAWN_CHECK_INTERVAL_MS; // force immediate first tick
  console.log('[structures] Overworld structures system initialized (' + _structureTypeKeys.length + ' structure types)');
}

/**
 * Main tick — called periodically to spawn/expire structures.
 * @param {object} state - game state
 * @param {object} io - socket.io instance
 */
function tick(state, io) {
  var now = Date.now();

  // Only tick at the configured interval
  if (now - _lastTickTime < SPAWN_CHECK_INTERVAL_MS) return;
  _lastTickTime = now;

  // 1. Expire old structures
  var expired = [];
  for (var entry of activeStructures) {
    var sid = entry[0];
    var struct = entry[1];
    if (now >= struct.expiresAt) {
      expired.push(sid);
    }
  }
  for (var ei = 0; ei < expired.length; ei++) {
    var expStruct = activeStructures.get(expired[ei]);
    activeStructures.delete(expired[ei]);
    if (io && expStruct) {
      io.emit('structure_expired', {
        structureId: expired[ei],
        name: expStruct.name,
        worldX: expStruct.worldX,
        worldY: expStruct.worldY,
      });
    }
  }

  // 2. Clean old cleared entries
  var cleanedCleared = [];
  for (var cEntry of clearedStructures) {
    var cSid = cEntry[0];
    var cData = cEntry[1];
    var clearedAt = (typeof cData === 'object') ? cData.clearedAt : cData;
    if (now - clearedAt > STRUCTURE_RESPAWN_DELAY_MS) {
      cleanedCleared.push(cSid);
    }
  }
  for (var cci = 0; cci < cleanedCleared.length; cci++) {
    clearedStructures.delete(cleanedCleared[cci]);
  }

  // 3. Try to spawn new structures up to target count
  var playerCount = state.users ? state.users.size : 0;
  var targetCount = Math.min(MAX_ACTIVE_STRUCTURES, Math.max(5, Math.floor(playerCount * 1.5) + 5));

  if (activeStructures.size < targetCount) {
    var toSpawn = Math.min(3, targetCount - activeStructures.size); // spawn up to 3 per tick
    for (var si = 0; si < toSpawn; si++) {
      spawnRandomStructure(state, io);
    }
  }
}

/**
 * Attempt to spawn a single random structure.
 * @param {object} state - game state
 * @param {object} io - socket.io instance
 * @returns {object|null} The spawned structure data, or null if spawn failed
 */
function spawnRandomStructure(state, io) {
  var structDef = pickWeightedStructureType();
  if (!structDef) return null;

  // Find a valid position
  var pos = findValidChunkPosition(structDef.biomes);
  if (!pos) return null;

  // Determine floor count
  var floorRng = Math.random();
  var totalFloors = structDef.floors.min + Math.floor(floorRng * (structDef.floors.max - structDef.floors.min + 1));

  // Generate unique ID and seed
  var structureId = generateStructureId();
  var structureSeed = structureId; // Use the ID itself as the seed for deterministic generation

  // Calculate world pixel position (center of chunk)
  var worldX = pos.cx * CHUNK_SIZE + CHUNK_SIZE / 2;
  var worldY = pos.cy * CHUNK_SIZE + CHUNK_SIZE / 2;

  // Determine lifetime — harder structures last longer
  var lifetimeMs = STRUCTURE_LIFETIME_MS;
  if (structDef.difficulty === 'medium') lifetimeMs = Math.floor(STRUCTURE_LIFETIME_MS * 1.25);
  if (structDef.difficulty === 'hard') lifetimeMs = Math.floor(STRUCTURE_LIFETIME_MS * 1.5);

  var structData = {
    structureId: structureId,
    type: structDef.id,
    name: structDef.name,
    icon: structDef.icon,
    description: structDef.description,
    difficulty: structDef.difficulty,
    minLevel: structDef.minPlayerLevel,
    lootTier: structDef.lootTier,
    xpMultiplier: structDef.xpMultiplier,
    hasBoss: !!structDef.hasBoss,
    rescueNpcs: !!structDef.rescueNpcs,
    totalFloors: totalFloors,
    seed: structureSeed,
    chunkX: pos.cx,
    chunkY: pos.cy,
    worldX: worldX,
    worldY: worldY,
    biome: worldgen.getBiome(pos.cx, pos.cy),
    spawnedAt: Date.now(),
    expiresAt: Date.now() + lifetimeMs,
    cleared: false,
    currentPlayers: new Set(),
    // Floor cache for this structure instance
    floorCache: new Map(),
  };

  activeStructures.set(structureId, structData);

  if (io) {
    io.emit('structure_spawned', {
      structureId: structureId,
      type: structDef.id,
      name: structDef.name,
      icon: structDef.icon,
      worldX: worldX,
      worldY: worldY,
      chunkX: pos.cx,
      chunkY: pos.cy,
      difficulty: structDef.difficulty,
      minLevel: structDef.minPlayerLevel,
      expiresAt: structData.expiresAt,
    });
  }

  return structData;
}

/**
 * Get the floor for a structure (cached, deterministic).
 * @param {string} structureId
 * @param {number} floorNum
 * @returns {object|null} floor object
 */
function getStructureFloor(structureId, floorNum) {
  var struct = activeStructures.get(structureId);
  if (!struct) return null;

  // Check floor cache
  if (struct.floorCache.has(floorNum)) {
    return struct.floorCache.get(floorNum);
  }

  // Look up the structure definition
  var structDef = null;
  var typeKeys = Object.keys(STRUCTURE_TYPES);
  for (var i = 0; i < typeKeys.length; i++) {
    if (STRUCTURE_TYPES[typeKeys[i]].id === struct.type) {
      structDef = STRUCTURE_TYPES[typeKeys[i]];
      break;
    }
  }
  if (!structDef) return null;

  // Generate the floor
  var floor = dungeonData.generateStructureFloor(structDef, floorNum, struct.seed, struct.totalFloors);
  if (!floor) return null;

  floor.camps = [];
  struct.floorCache.set(floorNum, floor);
  return floor;
}

/**
 * Get all active structures near a chunk position (for client rendering).
 * @param {number} cx - chunk X
 * @param {number} cy - chunk Y
 * @param {number} radius - search radius in chunks
 * @returns {Array} array of structure info objects (safe for network transmission)
 */
function getStructuresNearChunk(cx, cy, radius) {
  var radiusSq = radius * radius;
  var results = [];
  for (var entry of activeStructures) {
    var struct = entry[1];
    if (distanceSq(struct.chunkX, struct.chunkY, cx, cy) <= radiusSq) {
      results.push({
        structureId: struct.structureId,
        type: struct.type,
        name: struct.name,
        icon: struct.icon,
        worldX: struct.worldX,
        worldY: struct.worldY,
        chunkX: struct.chunkX,
        chunkY: struct.chunkY,
        difficulty: struct.difficulty,
        minLevel: struct.minLevel,
        expiresAt: struct.expiresAt,
        cleared: struct.cleared,
        playerCount: struct.currentPlayers ? struct.currentPlayers.size : 0,
        totalFloors: struct.totalFloors,
        hasBoss: struct.hasBoss,
        lootTier: struct.lootTier,
      });
    }
  }
  return results;
}

/**
 * Get structure by ID.
 * @param {string} structureId
 * @returns {object|null}
 */
function getStructure(structureId) {
  return activeStructures.get(structureId) || null;
}

/**
 * Mark structure as cleared (gives respawn delay, fades out after 5 minutes).
 * @param {string} structureId
 */
function markCleared(structureId) {
  var struct = activeStructures.get(structureId);
  if (struct) {
    struct.cleared = true;
    struct.expiresAt = Date.now() + 5 * 60 * 1000; // fade out in 5 min after clear
    clearedStructures.set(structureId, {
      clearedAt: Date.now(),
      chunkX: struct.chunkX,
      chunkY: struct.chunkY,
    });
  }
}

/**
 * Add a player to a structure's tracking set.
 * @param {string} structureId
 * @param {string} socketId
 */
function addPlayer(structureId, socketId) {
  var struct = activeStructures.get(structureId);
  if (struct && struct.currentPlayers) {
    struct.currentPlayers.add(socketId);
  }
}

/**
 * Remove a player from a structure's tracking set.
 * @param {string} structureId
 * @param {string} socketId
 */
function removePlayer(structureId, socketId) {
  var struct = activeStructures.get(structureId);
  if (struct && struct.currentPlayers) {
    struct.currentPlayers.delete(socketId);
  }
}

/**
 * Remove a player from ALL structures (used on disconnect/dungeon_exit).
 * @param {string} socketId
 */
function removePlayerFromAll(socketId) {
  for (var entry of activeStructures) {
    var struct = entry[1];
    if (struct.currentPlayers) {
      struct.currentPlayers.delete(socketId);
    }
  }
}

/**
 * Get all active structures (for admin/debug).
 * @returns {Array}
 */
function getAllStructures() {
  var results = [];
  for (var entry of activeStructures) {
    var struct = entry[1];
    results.push({
      structureId: struct.structureId,
      type: struct.type,
      name: struct.name,
      worldX: struct.worldX,
      worldY: struct.worldY,
      chunkX: struct.chunkX,
      chunkY: struct.chunkY,
      difficulty: struct.difficulty,
      minLevel: struct.minLevel,
      cleared: struct.cleared,
      totalFloors: struct.totalFloors,
      playerCount: struct.currentPlayers ? struct.currentPlayers.size : 0,
      expiresAt: struct.expiresAt,
      spawnedAt: struct.spawnedAt,
      biome: struct.biome,
    });
  }
  return results;
}

/**
 * Get structure count info (for state/health endpoint).
 * @returns {object}
 */
function getInfo() {
  return {
    active: activeStructures.size,
    cleared: clearedStructures.size,
    types: _structureTypeKeys.length,
  };
}

/**
 * Reset all structures (called on daily wipe).
 */
function reset() {
  activeStructures.clear();
  clearedStructures.clear();
  structureSeedCounter = 0;
  _lastTickTime = Date.now() - SPAWN_CHECK_INTERVAL_MS; // force spawn on next tick
  console.log('[structures] Overworld structures reset');
}

module.exports = {
  init: init,
  tick: tick,
  spawnRandomStructure: spawnRandomStructure,
  getStructureFloor: getStructureFloor,
  getStructuresNearChunk: getStructuresNearChunk,
  getStructure: getStructure,
  markCleared: markCleared,
  addPlayer: addPlayer,
  removePlayer: removePlayer,
  removePlayerFromAll: removePlayerFromAll,
  getAllStructures: getAllStructures,
  getInfo: getInfo,
  reset: reset,
  activeStructures: activeStructures,
};
