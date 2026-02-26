// state-sync.js — Redis pub/sub state synchronization for multi-process PM2
// Keeps local Maps as the fast read cache. Publishes changes to Redis so
// other PM2 worker processes can update their local copies.
//
// Read path: local Map lookup (0ms) — identical to single-process
// Write path: local Map update + async Redis PUBLISH (~0ms visible)
// Cross-process sync: Redis pub/sub delivers updates in ~0.5-1ms
//
// Each message includes the originating process PID so the sender
// can ignore its own echoed messages.

var PID = process.pid;
var CHANNEL_POS = 'mmolite:pos';
var CHANNEL_ZONE = 'mmolite:zone';
var CHANNEL_USER = 'mmolite:user';

// Redis hash keys for bootstrap (cold start state loading)
var HASH_POSITIONS = 'mmolite:positions';
var HASH_USERS = 'mmolite:users';
var HASH_PLAYER_ZONES = 'mmolite:playerzones';
var SET_PREFIX = 'mmolite:zone:';  // mmolite:zone:{zoneId}:members

var redis = null;
var state = null;
var pubClient = null;   // dedicated publish client
var subClient = null;   // dedicated subscribe client
var _enabled = false;

// ---------------------------------------------------------------------------
// Publish helpers (fire-and-forget, non-blocking)
// ---------------------------------------------------------------------------

function _pub(channel, data) {
  if (!_enabled || !pubClient) return;
  data.pid = PID;
  try {
    pubClient.publish(channel, JSON.stringify(data));
  } catch (_) {}
}

function publishPosition(socketId, x, y, facing) {
  // Also persist to Redis hash for cold-start bootstrap
  if (_enabled && redis) {
    redis.hset(HASH_POSITIONS, socketId, JSON.stringify({ x: x, y: y, facing: facing }));
  }
  _pub(CHANNEL_POS, { id: socketId, x: x, y: y, facing: facing });
}

function publishZoneJoin(socketId, zoneId, x, y) {
  if (_enabled && redis) {
    redis.hset(HASH_PLAYER_ZONES, socketId, zoneId);
    redis.hset(HASH_POSITIONS, socketId, JSON.stringify({ x: x, y: y, facing: 'down' }));
    // Add to zone member set
    if (pubClient) {
      try { pubClient.sadd(SET_PREFIX + zoneId + ':members', socketId); } catch (_) {}
    }
  }
  _pub(CHANNEL_ZONE, { type: 'join', id: socketId, zoneId: zoneId, x: x, y: y });
}

function publishZoneLeave(socketId, zoneId) {
  if (_enabled && redis) {
    redis.hdel(HASH_PLAYER_ZONES, socketId);
    redis.hdel(HASH_POSITIONS, socketId);
    if (pubClient) {
      try { pubClient.srem(SET_PREFIX + zoneId + ':members', socketId); } catch (_) {}
    }
  }
  _pub(CHANNEL_ZONE, { type: 'leave', id: socketId, zoneId: zoneId });
}

function publishUserAdd(socketId, userData) {
  if (_enabled && redis) {
    redis.hset(HASH_USERS, socketId, JSON.stringify(userData));
  }
  _pub(CHANNEL_USER, { type: 'add', id: socketId, user: userData });
}

function publishUserRemove(socketId) {
  if (_enabled && redis) {
    redis.hdel(HASH_USERS, socketId);
    redis.hdel(HASH_POSITIONS, socketId);
    redis.hdel(HASH_PLAYER_ZONES, socketId);
  }
  _pub(CHANNEL_USER, { type: 'remove', id: socketId });
}

// ---------------------------------------------------------------------------
// Subscribe handler — receives messages from other processes
// ---------------------------------------------------------------------------

function _onMessage(channel, message) {
  var data;
  try { data = JSON.parse(message); } catch (_) { return; }

  // Ignore our own messages
  if (data.pid === PID) return;

  switch (channel) {
    case CHANNEL_POS: {
      // Another process updated a player position
      var pos = state.playerPositions.get(data.id);
      if (pos) {
        pos.x = data.x;
        pos.y = data.y;
        if (data.facing) pos.facing = data.facing;
      } else {
        // Player exists in another process but not ours — add them
        state.playerPositions.set(data.id, { x: data.x, y: data.y, facing: data.facing || 'down' });
      }
      break;
    }

    case CHANNEL_ZONE: {
      if (data.type === 'join') {
        var zone = state.zones.get(data.zoneId);
        if (zone) {
          zone.members.add(data.id);
          state.playerZones.set(data.id, data.zoneId);
          if (!state.playerPositions.has(data.id)) {
            state.playerPositions.set(data.id, { x: data.x || 0, y: data.y || 0, facing: 'down' });
          }
        }
      } else if (data.type === 'leave') {
        var lZone = state.zones.get(data.zoneId);
        if (lZone) lZone.members.delete(data.id);
        state.playerZones.delete(data.id);
        state.playerPositions.delete(data.id);
      }
      break;
    }

    case CHANNEL_USER: {
      if (data.type === 'add' && data.user) {
        if (!state.users.has(data.id)) {
          state.users.set(data.id, data.user);
        }
      } else if (data.type === 'remove') {
        state.users.delete(data.id);
        state.playerPositions.delete(data.id);
        var rZoneId = state.playerZones.get(data.id);
        if (rZoneId) {
          var rZone = state.zones.get(rZoneId);
          if (rZone) rZone.members.delete(data.id);
          state.playerZones.delete(data.id);
        }
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Cold start bootstrap — load existing state from Redis hashes
// ---------------------------------------------------------------------------

function _bootstrap() {
  if (!_enabled || !redis) return Promise.resolve();

  // On startup, flush stale player data from Redis.
  // All sockets from the previous process are dead — bootstrapping them
  // creates ghost players that never disconnect and inflate player counts.
  return Promise.all([
    redis.del(HASH_USERS),
    redis.del(HASH_POSITIONS),
    redis.del(HASH_PLAYER_ZONES),
  ]).then(function() {
    console.log('[state-sync] Cleared stale Redis player data on startup (pid=' + PID + ')');
  }).catch(function(err) {
    console.warn('[state-sync] Bootstrap cleanup error:', err.message);
  });
}

// ---------------------------------------------------------------------------
// Wipe — clear all shared state from Redis (called during daily wipe)
// ---------------------------------------------------------------------------

function wipeSharedState() {
  if (!_enabled || !redis) return;
  redis.del(HASH_USERS);
  redis.del(HASH_POSITIONS);
  redis.del(HASH_PLAYER_ZONES);
  // Zone member sets are cleaned by the zone operations
}

// ---------------------------------------------------------------------------
// Init — called from server.js after Redis is ready
// ---------------------------------------------------------------------------

function init(redisModule, stateModule) {
  redis = redisModule;
  state = stateModule;

  if (!redis || !redis.isConnected || !redis.pubClient || !redis.subClient) {
    console.log('[state-sync] Redis not available, running single-process mode');
    _enabled = false;
    return Promise.resolve();
  }

  pubClient = redis.pubClient;
  subClient = redis.subClient;
  _enabled = true;

  // Subscribe to sync channels
  subClient.subscribe(CHANNEL_POS, CHANNEL_ZONE, CHANNEL_USER);
  subClient.on('message', _onMessage);

  console.log('[state-sync] Cross-process sync enabled (pid=' + PID + ')');

  // Bootstrap existing state from Redis
  return _bootstrap();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  init: init,
  get enabled() { return _enabled; },

  // Publish hooks (called from state.js)
  publishPosition: publishPosition,
  publishZoneJoin: publishZoneJoin,
  publishZoneLeave: publishZoneLeave,
  publishUserAdd: publishUserAdd,
  publishUserRemove: publishUserRemove,
  wipeSharedState: wipeSharedState,
};
