// redis.js — Redis wrapper with graceful in-memory fallback
// Provides identical async API whether Redis is connected or not.
// Used for: session tokens, player positions, rate limiting, pub/sub.

var REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ---------------------------------------------------------------------------
// In-memory fallback store
// ---------------------------------------------------------------------------
// When Redis is unavailable, all operations fall back to plain JS Maps.
// TTL is handled via setTimeout-based expiry tracking.

var memStore = new Map();
var memTimers = new Map();        // key -> timeoutId for TTL expiry
var memHashes = new Map();        // hash -> Map<field, value>

function memSet(key, value, ttlSeconds) {
  memStore.set(key, String(value));
  // Clear any existing TTL timer for this key
  if (memTimers.has(key)) {
    clearTimeout(memTimers.get(key));
    memTimers.delete(key);
  }
  if (ttlSeconds && ttlSeconds > 0) {
    var timer = setTimeout(function() {
      memStore.delete(key);
      memTimers.delete(key);
    }, ttlSeconds * 1000);
    // Prevent timer from keeping the process alive
    if (timer.unref) timer.unref();
    memTimers.set(key, timer);
  }
}

function memGet(key) {
  var val = memStore.get(key);
  return val !== undefined ? val : null;
}

function memDel(key) {
  memStore.delete(key);
  if (memTimers.has(key)) {
    clearTimeout(memTimers.get(key));
    memTimers.delete(key);
  }
}

function memHset(hash, field, value) {
  if (!memHashes.has(hash)) memHashes.set(hash, new Map());
  memHashes.get(hash).set(String(field), String(value));
}

function memHget(hash, field) {
  var h = memHashes.get(hash);
  if (!h) return null;
  var val = h.get(String(field));
  return val !== undefined ? val : null;
}

function memHdel(hash, field) {
  var h = memHashes.get(hash);
  if (!h) return;
  h.delete(String(field));
  if (h.size === 0) memHashes.delete(hash);
}

function memHgetall(hash) {
  var h = memHashes.get(hash);
  if (!h || h.size === 0) return null;
  var result = {};
  h.forEach(function(value, key) {
    result[key] = value;
  });
  return result;
}

// ---------------------------------------------------------------------------
// Attempt Redis connection
// ---------------------------------------------------------------------------

var client = null;
var pubClient = null;
var subClient = null;
var isConnected = false;

// Promise that resolves when Redis is fully ready (pub/sub clients connected)
// or rejects/resolves(false) if Redis is unavailable.
var _readyResolve;
var ready = new Promise(function(resolve) { _readyResolve = resolve; });

try {
  var Redis = require('ioredis');

  // Shared connection options: fail fast, don't retry forever
  var connOpts = {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: function(times) {
      // Only retry 3 times on initial connect, then give up
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
    enableOfflineQueue: false,
  };

  client = new Redis(REDIS_URL, connOpts);

  // Suppress noisy error output during connection attempt
  client.on('error', function() {});

  // Synchronous-ish startup probe: we flag connected in the 'ready' handler
  // and use a connect() promise below to gate it.
  client.on('ready', function() {
    isConnected = true;
  });

  // We wrap the async connect in an IIFE so the module can still be
  // required synchronously (Node caches module.exports immediately).
  (function tryConnect() {
    client.connect()
      .then(function() {
        isConnected = true;
        console.log('[redis] Connected to Redis');

        // Now create pub/sub clients (only useful if Redis is up)
        pubClient = new Redis(REDIS_URL, connOpts);
        subClient = new Redis(REDIS_URL, connOpts);

        pubClient.on('error', function(err) {
          console.warn('[redis] pubClient error:', err.message);
        });
        subClient.on('error', function(err) {
          console.warn('[redis] subClient error:', err.message);
        });

        return Promise.all([pubClient.connect(), subClient.connect()]);
      })
      .then(function() {
        // pub/sub clients ready — resolve the ready promise
        _readyResolve(true);
      })
      .catch(function(err) {
        console.warn('[redis] Redis unavailable, using in-memory fallback');
        isConnected = false;
        // Clean up failed clients
        try { if (client) client.disconnect(); } catch(e) {}
        try { if (pubClient) pubClient.disconnect(); } catch(e) {}
        try { if (subClient) subClient.disconnect(); } catch(e) {}
        client = null;
        pubClient = null;
        subClient = null;
        _readyResolve(false);
      });
  })();

} catch(e) {
  // ioredis not loadable (shouldn't happen since it's in package.json)
  console.warn('[redis] Redis unavailable, using in-memory fallback');
  client = null;
  pubClient = null;
  subClient = null;
  isConnected = false;
  _readyResolve(false);
}

// ---------------------------------------------------------------------------
// Unified async API
// ---------------------------------------------------------------------------
// Every function returns a Promise so callers can always use await/then
// regardless of whether Redis or the in-memory fallback is active.

/**
 * Get a string value by key.
 * @param {string} key
 * @returns {Promise<string|null>}
 */
function get(key) {
  if (isConnected && client) {
    return client.get(key);
  }
  return Promise.resolve(memGet(key));
}

/**
 * Set a string value, with optional TTL in seconds.
 * @param {string} key
 * @param {string|number} value
 * @param {number} [ttlSeconds] - If provided and > 0, key expires after this many seconds
 * @returns {Promise<string>} 'OK'
 */
function set(key, value, ttlSeconds) {
  if (isConnected && client) {
    if (ttlSeconds && ttlSeconds > 0) {
      return client.set(key, value, 'EX', ttlSeconds);
    }
    return client.set(key, value);
  }
  memSet(key, value, ttlSeconds);
  return Promise.resolve('OK');
}

/**
 * Delete one or more keys.
 * @param {string} key
 * @returns {Promise<number>} Number of keys deleted
 */
function del(key) {
  if (isConnected && client) {
    return client.del(key);
  }
  var existed = memStore.has(key) ? 1 : 0;
  memDel(key);
  return Promise.resolve(existed);
}

/**
 * Set a field in a hash.
 * @param {string} hash
 * @param {string} field
 * @param {string|number} value
 * @returns {Promise<number>} 1 if new field, 0 if updated
 */
function hset(hash, field, value) {
  if (isConnected && client) {
    return client.hset(hash, field, value);
  }
  var h = memHashes.get(hash);
  var isNew = (!h || !h.has(String(field))) ? 1 : 0;
  memHset(hash, field, value);
  return Promise.resolve(isNew);
}

/**
 * Get a single field from a hash.
 * @param {string} hash
 * @param {string} field
 * @returns {Promise<string|null>}
 */
function hget(hash, field) {
  if (isConnected && client) {
    return client.hget(hash, field);
  }
  return Promise.resolve(memHget(hash, field));
}

/**
 * Delete a field from a hash.
 * @param {string} hash
 * @param {string} field
 * @returns {Promise<number>} 1 if field existed, 0 otherwise
 */
function hdel(hash, field) {
  if (isConnected && client) {
    return client.hdel(hash, field);
  }
  var h = memHashes.get(hash);
  var existed = (h && h.has(String(field))) ? 1 : 0;
  memHdel(hash, field);
  return Promise.resolve(existed);
}

/**
 * Get all fields and values from a hash.
 * @param {string} hash
 * @returns {Promise<object|null>} { field: value, ... } or null if hash doesn't exist
 */
function hgetall(hash) {
  if (isConnected && client) {
    return client.hgetall(hash).then(function(result) {
      // ioredis returns {} for non-existent hashes; normalize to null
      if (!result || Object.keys(result).length === 0) return null;
      return result;
    });
  }
  return Promise.resolve(memHgetall(hash));
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Raw clients (null when using fallback)
  get client() { return client; },
  get pubClient() { return pubClient; },
  get subClient() { return subClient; },
  get isConnected() { return isConnected; },

  // Promise: resolves true when Redis + pub/sub ready, false if unavailable
  ready: ready,

  // Key-value operations
  get: get,
  set: set,
  del: del,

  // Hash operations
  hset: hset,
  hget: hget,
  hdel: hdel,
  hgetall: hgetall,
};
