// overworld-rifts.js
// Manages secondary spatial tears ("mini-rifts") that spawn across the overworld.
// Each rift is a finite dungeon (5-20 floors) themed around The Hollow —
// beings that bleed through from the Primary Rift. When the final boss is
// killed the rift is destroyed and nearby corruption is cleansed.
//
// Lore: The Soldier (trapped in the Primary Rift for 500 years) is
// desperately trying to reach Helios. Secondary rifts are his consciousness
// bleeding through reality — not malice, but desperation.

'use strict';

var crypto = require('crypto');
var dungeonData = require('./dungeon-data');
var worldgen = require('./worldgen');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var MAX_ACTIVE_RIFTS = 12;
var SPAWN_CHECK_INTERVAL_MS = 3 * 60 * 1000;       // 3 minutes
var MIN_DISTANCE_BETWEEN_RIFTS = 15;                 // chunks
var MIN_DISTANCE_FROM_PRIMARY_RIFT = 20;             // chunks (Solara area)
var MIN_DISTANCE_FROM_TOWNS = 6;                     // chunks
var RESPAWN_DELAY_MS = 45 * 60 * 1000;              // 45 minutes
var MAX_SPAWN_ATTEMPTS = 50;

var CHUNK_SIZE = worldgen.CHUNK_SIZE;
var WORLD_SCALE = worldgen.WORLD_SCALE;

// Rift name pool
var RIFT_NAMES = [
  'Hollow Breach',
  'Void Tear',
  'Shattered Veil',
  'Reality Wound',
  'Desperation Fracture',
];

// Anchor town chunk positions (same as overworld-structures.js)
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

// Primary Rift location (Solara Cathedral District)
var PRIMARY_RIFT_CHUNK = {
  cx: WORLD_SCALE.originCX + 40,
  cy: WORLD_SCALE.originCY + 38,
};

// Active rifts: Map<riftId, riftData>
var activeRifts = new Map();

// Destroyed rifts: Map<riftId, {destroyedAt, chunkX, chunkY}>
var destroyedRifts = new Map();

// Generation counter
var riftSeedCounter = 0;

// Last tick timestamp
var _lastTickTime = 0;

// Cached reference to io for force-exit broadcasts
var _io = null;

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function generateRiftId() {
  riftSeedCounter++;
  return 'rift_' + Date.now().toString(36) + '_' + riftSeedCounter.toString(36) + '_' + crypto.randomBytes(3).toString('hex');
}

function distanceSq(x1, y1, x2, y2) {
  var dx = x1 - x2;
  var dy = y1 - y2;
  return dx * dx + dy * dy;
}

function isTooCloseToTown(cx, cy) {
  var minDistSq = MIN_DISTANCE_FROM_TOWNS * MIN_DISTANCE_FROM_TOWNS;
  for (var i = 0; i < TOWN_CHUNKS.length; i++) {
    if (distanceSq(cx, cy, TOWN_CHUNKS[i].cx, TOWN_CHUNKS[i].cy) < minDistSq) {
      return true;
    }
  }
  return false;
}

function isTooCloseToPrimaryRift(cx, cy) {
  return distanceSq(cx, cy, PRIMARY_RIFT_CHUNK.cx, PRIMARY_RIFT_CHUNK.cy) <
    MIN_DISTANCE_FROM_PRIMARY_RIFT * MIN_DISTANCE_FROM_PRIMARY_RIFT;
}

function isTooCloseToRift(cx, cy) {
  var minDistSq = MIN_DISTANCE_BETWEEN_RIFTS * MIN_DISTANCE_BETWEEN_RIFTS;
  for (var entry of activeRifts) {
    var rift = entry[1];
    if (distanceSq(cx, cy, rift.chunkX, rift.chunkY) < minDistSq) {
      return true;
    }
  }
  return false;
}

function isRecentlyDestroyedNearby(cx, cy) {
  var minDistSq = MIN_DISTANCE_BETWEEN_RIFTS * MIN_DISTANCE_BETWEEN_RIFTS;
  for (var entry of destroyedRifts) {
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
 * Find a valid chunk position for a rift. Any non-water biome.
 */
function findValidRiftPosition() {
  var minCX = WORLD_SCALE.originCX - 15;
  var maxCX = WORLD_SCALE.originCX + 105;
  var minCY = WORLD_SCALE.originCY - 30;
  var maxCY = WORLD_SCALE.originCY + 80;

  for (var attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++) {
    var cx = minCX + Math.floor(Math.random() * (maxCX - minCX));
    var cy = minCY + Math.floor(Math.random() * (maxCY - minCY));

    var biome = worldgen.getBiome(cx, cy);
    if (biome === 0) continue; // WATER

    if (isTooCloseToTown(cx, cy)) continue;
    if (isTooCloseToPrimaryRift(cx, cy)) continue;
    if (isTooCloseToRift(cx, cy)) continue;
    if (isRecentlyDestroyedNearby(cx, cy)) continue;

    return { cx: cx, cy: cy };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

function init(state) {
  _lastTickTime = Date.now() - SPAWN_CHECK_INTERVAL_MS; // force immediate first tick
  console.log('[mini-rifts] Overworld rift system initialized');
}

function tick(state, io) {
  var now = Date.now();
  _io = io;

  if (now - _lastTickTime < SPAWN_CHECK_INTERVAL_MS) return;
  _lastTickTime = now;

  // 1. Expire old rifts & force-eject players
  var expired = [];
  for (var entry of activeRifts) {
    var rift = entry[1];
    if (now >= rift.expiresAt && !rift.cleared && !rift.destroyed) {
      expired.push(entry[0]);
    }
  }
  for (var ei = 0; ei < expired.length; ei++) {
    var expRift = activeRifts.get(expired[ei]);
    if (expRift && expRift.currentPlayers && expRift.currentPlayers.size > 0) {
      // Force-eject all players inside
      for (var socketId of expRift.currentPlayers) {
        if (io) {
          io.to(socketId).emit('dungeon_force_exit', {
            message: 'The rift collapses around you! You are expelled to the surface.',
            destX: expRift.worldX,
            destY: expRift.worldY,
          });
        }
      }
    }
    activeRifts.delete(expired[ei]);
    if (io) {
      io.emit('rift_destroyed', {
        riftId: expired[ei],
        name: expRift ? expRift.name : 'Unknown Rift',
        worldX: expRift ? expRift.worldX : 0,
        worldY: expRift ? expRift.worldY : 0,
        reason: 'expired',
      });
    }
  }

  // 2. Clean old destroyed entries (after RESPAWN_DELAY)
  var cleanedDestroyed = [];
  for (var dEntry of destroyedRifts) {
    var dData = dEntry[1];
    if (now - dData.destroyedAt > RESPAWN_DELAY_MS) {
      cleanedDestroyed.push(dEntry[0]);
    }
  }
  for (var di = 0; di < cleanedDestroyed.length; di++) {
    destroyedRifts.delete(cleanedDestroyed[di]);
  }

  // 3. Spawn new rifts up to dynamic target count
  var playerCount = state.users ? state.users.size : 0;
  var targetCount = Math.min(MAX_ACTIVE_RIFTS, Math.max(3, Math.floor(playerCount * 0.8) + 3));

  if (activeRifts.size < targetCount) {
    var toSpawn = Math.min(2, targetCount - activeRifts.size);
    for (var si = 0; si < toSpawn; si++) {
      spawnRandomRift(state, io);
    }
  }
}

function spawnRandomRift(state, io) {
  var pos = findValidRiftPosition();
  if (!pos) return null;

  // Roll floor count (5-20)
  var totalFloors = 5 + Math.floor(Math.random() * 16);
  var tierInfo = dungeonData.getMiniRiftTier(totalFloors);

  var riftId = generateRiftId();
  var worldX = pos.cx * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);
  var worldY = pos.cy * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);
  var biome = worldgen.getBiome(pos.cx, pos.cy);

  var lifetimeMs = tierInfo.lifetimeH * 60 * 60 * 1000;
  var name = RIFT_NAMES[Math.floor(Math.random() * RIFT_NAMES.length)];

  var riftData = {
    riftId: riftId,
    tier: tierInfo.tier,
    name: name,
    totalFloors: totalFloors,
    difficulty: tierInfo.difficulty,
    lootTier: tierInfo.lootTier,
    xpMultiplier: tierInfo.xpMult,
    minPlayerLevel: tierInfo.minLevel,
    corruptionRadius: tierInfo.corruptionRadius,
    chunkX: pos.cx,
    chunkY: pos.cy,
    worldX: worldX,
    worldY: worldY,
    biome: biome,
    spawnedAt: Date.now(),
    expiresAt: Date.now() + lifetimeMs,
    cleared: false,
    destroyed: false,
    currentPlayers: new Set(),
    floorCache: new Map(),
    seed: riftId,
  };

  activeRifts.set(riftId, riftData);

  if (io) {
    io.emit('rift_spawned', {
      riftId: riftId,
      tier: tierInfo.tier,
      name: name,
      totalFloors: totalFloors,
      difficulty: tierInfo.difficulty,
      minPlayerLevel: tierInfo.minLevel,
      worldX: worldX,
      worldY: worldY,
      chunkX: pos.cx,
      chunkY: pos.cy,
      expiresAt: riftData.expiresAt,
      corruptionRadius: tierInfo.corruptionRadius,
    });
  }

  console.log('[mini-rifts] Mini-rift spawned: ' + name + ' (tier ' + tierInfo.tier + ', ' +
    totalFloors + ' floors) at chunk (' + pos.cx + ',' + pos.cy + ')');

  return riftData;
}

/**
 * Get or generate a floor for a mini-rift.
 */
function getRiftFloor(riftId, floorNum) {
  var rift = activeRifts.get(riftId);
  if (!rift) return null;

  if (rift.floorCache.has(floorNum)) {
    return rift.floorCache.get(floorNum);
  }

  var floor = dungeonData.generateMiniRiftFloor(rift, floorNum, rift.seed, rift.totalFloors);
  if (!floor) return null;

  floor.camps = [];
  rift.floorCache.set(floorNum, floor);
  return floor;
}

/**
 * Get all rifts near a chunk position.
 */
function getRiftsNearChunk(cx, cy, radius) {
  var radiusSq = radius * radius;
  var results = [];
  for (var entry of activeRifts) {
    var rift = entry[1];
    if (rift.destroyed) continue;
    if (distanceSq(rift.chunkX, rift.chunkY, cx, cy) <= radiusSq) {
      results.push({
        riftId: rift.riftId,
        tier: rift.tier,
        name: rift.name,
        worldX: rift.worldX,
        worldY: rift.worldY,
        chunkX: rift.chunkX,
        chunkY: rift.chunkY,
        difficulty: rift.difficulty,
        minPlayerLevel: rift.minPlayerLevel,
        totalFloors: rift.totalFloors,
        expiresAt: rift.expiresAt,
        cleared: rift.cleared,
        playerCount: rift.currentPlayers ? rift.currentPlayers.size : 0,
        corruptionRadius: rift.corruptionRadius,
      });
    }
  }
  return results;
}

function getRift(riftId) {
  return activeRifts.get(riftId) || null;
}

function getAllRifts() {
  var results = [];
  for (var entry of activeRifts) {
    var rift = entry[1];
    results.push({
      riftId: rift.riftId,
      tier: rift.tier,
      name: rift.name,
      worldX: rift.worldX,
      worldY: rift.worldY,
      chunkX: rift.chunkX,
      chunkY: rift.chunkY,
      difficulty: rift.difficulty,
      minPlayerLevel: rift.minPlayerLevel,
      totalFloors: rift.totalFloors,
      cleared: rift.cleared,
      destroyed: rift.destroyed,
      playerCount: rift.currentPlayers ? rift.currentPlayers.size : 0,
      expiresAt: rift.expiresAt,
      spawnedAt: rift.spawnedAt,
      biome: rift.biome,
      corruptionRadius: rift.corruptionRadius,
    });
  }
  return results;
}

function destroyRift(riftId, clearedBy) {
  var rift = activeRifts.get(riftId);
  if (!rift) return false;

  rift.cleared = true;
  rift.destroyed = true;
  // Keep in map briefly for cleanup, then remove
  rift.expiresAt = Date.now() + 5 * 60 * 1000; // fade out in 5 min

  destroyedRifts.set(riftId, {
    destroyedAt: Date.now(),
    chunkX: rift.chunkX,
    chunkY: rift.chunkY,
    clearedBy: clearedBy || 'unknown',
  });

  console.log('[mini-rifts] Rift destroyed: ' + rift.name + ' (tier ' + rift.tier + ') cleared by ' + (clearedBy || 'unknown'));
  return true;
}

function addPlayer(riftId, socketId) {
  var rift = activeRifts.get(riftId);
  if (rift && rift.currentPlayers) {
    rift.currentPlayers.add(socketId);
  }
}

function removePlayer(riftId, socketId) {
  var rift = activeRifts.get(riftId);
  if (rift && rift.currentPlayers) {
    rift.currentPlayers.delete(socketId);
  }
}

function removePlayerFromAll(socketId) {
  for (var entry of activeRifts) {
    var rift = entry[1];
    if (rift.currentPlayers) {
      rift.currentPlayers.delete(socketId);
    }
  }
}

function getInfo() {
  return {
    active: activeRifts.size,
    destroyed: destroyedRifts.size,
  };
}

function getState() {
  var rifts = [];
  for (var entry of activeRifts) {
    var rift = entry[1];
    rifts.push({
      riftId: rift.riftId,
      tier: rift.tier,
      name: rift.name,
      totalFloors: rift.totalFloors,
      difficulty: rift.difficulty,
      lootTier: rift.lootTier,
      xpMultiplier: rift.xpMultiplier,
      minPlayerLevel: rift.minPlayerLevel,
      corruptionRadius: rift.corruptionRadius,
      chunkX: rift.chunkX,
      chunkY: rift.chunkY,
      worldX: rift.worldX,
      worldY: rift.worldY,
      biome: rift.biome,
      spawnedAt: rift.spawnedAt,
      expiresAt: rift.expiresAt,
      cleared: rift.cleared,
      destroyed: rift.destroyed,
      seed: rift.seed,
    });
  }
  return { rifts: rifts };
}

function loadState(savedState) {
  if (!savedState || !savedState.rifts) return;
  activeRifts.clear();
  var now = Date.now();
  for (var i = 0; i < savedState.rifts.length; i++) {
    var r = savedState.rifts[i];
    if (r.expiresAt <= now) continue; // skip expired
    if (r.destroyed) continue;
    r.currentPlayers = new Set();
    r.floorCache = new Map();
    activeRifts.set(r.riftId, r);
  }
  console.log('[mini-rifts] Loaded ' + activeRifts.size + ' active rifts from saved state');
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  init: init,
  tick: tick,
  spawnRandomRift: spawnRandomRift,
  getRiftFloor: getRiftFloor,
  getRiftsNearChunk: getRiftsNearChunk,
  getRift: getRift,
  getAllRifts: getAllRifts,
  destroyRift: destroyRift,
  addPlayer: addPlayer,
  removePlayer: removePlayer,
  removePlayerFromAll: removePlayerFromAll,
  getInfo: getInfo,
  getState: getState,
  loadState: loadState,
  activeRifts: activeRifts,
};
