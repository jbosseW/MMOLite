// db.js — PostgreSQL wrapper for MMOLite account persistence
// Provides async database operations with graceful fallback.
// If PostgreSQL is unavailable, all methods return null so callers
// can fall back to file-based storage (accounts.js).

var pg = require('pg');
var fs = require('fs');
var path = require('path');

// ---------------------------------------------------------------------------
// Connection setup
// ---------------------------------------------------------------------------

var DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/mmolite';
var pool = null;
var isConnected = false;
var _schemaApplied = false;

// Fields that are stored as top-level columns (not inside JSONB `data`)
var COLUMN_FIELDS = ['username', 'chips', 'level', 'xp', 'color'];

try {
  pool = new pg.Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Suppress pool-level errors so they don't crash the process.
  // Individual query errors are caught per-call.
  pool.on('error', function(err) {
    console.error('[db] Pool background error:', err.message);
    isConnected = false;
  });
} catch (err) {
  console.error('[db] Failed to create pool:', err.message);
  pool = null;
}

// ---------------------------------------------------------------------------
// Schema bootstrap
// ---------------------------------------------------------------------------

/**
 * Apply schema.sql on first successful connection.
 * Safe to call multiple times -- no-ops after first success.
 */
function _applySchema(client) {
  if (_schemaApplied) return Promise.resolve();
  var schemaPath = path.join(__dirname, 'schema.sql');
  try {
    var sql = fs.readFileSync(schemaPath, 'utf8');
    return client.query(sql).then(function() {
      _schemaApplied = true;
      console.log('[db] Schema applied successfully');
    });
  } catch (err) {
    console.error('[db] Could not read schema.sql:', err.message);
    return Promise.resolve(); // non-fatal -- tables may already exist
  }
}

// ---------------------------------------------------------------------------
// Initial connection probe
// ---------------------------------------------------------------------------

(function _probe() {
  if (!pool) {
    console.warn('[db] PostgreSQL unavailable, using file fallback');
    return;
  }

  pool.connect()
    .then(function(client) {
      isConnected = true;
      console.log('[db] Connected to PostgreSQL');
      return _applySchema(client).then(function() {
        client.release();
      });
    })
    .catch(function(err) {
      isConnected = false;
      console.warn('[db] PostgreSQL unavailable, using file fallback (' + err.message + ')');
    });
})();

// ---------------------------------------------------------------------------
// Generic query helper
// ---------------------------------------------------------------------------

/**
 * Execute an arbitrary SQL query.  Returns the pg Result object on success,
 * or null if the database is unavailable or the query fails.
 *
 * @param {string} sql   - Parameterized SQL string
 * @param {Array}  [params] - Bind parameters
 * @returns {Promise<object|null>}
 */
function query(sql, params) {
  if (!pool || !isConnected) return Promise.resolve(null);
  return pool.query(sql, params || [])
    .catch(function(err) {
      console.error('[db] Query error:', err.message);
      // If this looks like a connection-level failure, mark disconnected
      // so subsequent callers get fast null returns until the pool recovers.
      if (_isConnectionError(err)) {
        isConnected = false;
        _scheduleReconnectCheck();
      }
      return null;
    });
}

// ---------------------------------------------------------------------------
// Connection health monitoring
// ---------------------------------------------------------------------------

var _reconnectTimer = null;
var RECONNECT_CHECK_MS = 15000; // 15 seconds

function _isConnectionError(err) {
  if (!err) return false;
  var code = err.code || '';
  var msg = (err.message || '').toLowerCase();
  // PostgreSQL error codes for connection issues
  return code === 'ECONNREFUSED' ||
         code === 'ENOTFOUND' ||
         code === 'ETIMEDOUT' ||
         code === 'ECONNRESET' ||
         code === '57P01' ||  // admin_shutdown
         code === '57P03' ||  // cannot_connect_now
         msg.indexOf('connection terminated') !== -1 ||
         msg.indexOf('connection refused') !== -1 ||
         msg.indexOf('the database system is shutting down') !== -1;
}

function _scheduleReconnectCheck() {
  if (_reconnectTimer) return; // already scheduled
  _reconnectTimer = setTimeout(function() {
    _reconnectTimer = null;
    if (isConnected || !pool) return;
    pool.query('SELECT 1')
      .then(function() {
        isConnected = true;
        console.log('[db] PostgreSQL reconnected');
        // Ensure schema is applied after reconnection
        if (!_schemaApplied) {
          return pool.connect().then(function(client) {
            return _applySchema(client).then(function() {
              client.release();
            });
          });
        }
      })
      .catch(function() {
        // Still down, try again later
        _scheduleReconnectCheck();
      });
  }, RECONNECT_CHECK_MS);
}

// ---------------------------------------------------------------------------
// Account operations
// ---------------------------------------------------------------------------

/**
 * Split an account object into column values and a JSONB remainder.
 *
 * Column fields (username, chips, level, xp, color) are extracted into
 * individual values.  Everything else is bundled into a `data` object
 * for the JSONB column.  The `key` field is handled separately (it is
 * the primary key and passed as its own parameter).
 *
 * @param {object} accountData - Full account object from accounts.js
 * @returns {{ username: string, chips: number, level: number, xp: number, color: string, data: object }}
 */
function _splitAccountData(accountData) {
  var username = accountData.username || 'Anon';
  var chips    = typeof accountData.chips === 'number' ? accountData.chips : 0;
  var level    = typeof accountData.level === 'number' ? accountData.level : 1;
  var xp       = typeof accountData.xp    === 'number' ? accountData.xp    : 0;
  var color    = accountData.color || '#ffffff';

  // Build the JSONB remainder — everything that is not a column or the key
  var data = {};
  var skipKeys = { key: true, username: true, chips: true, level: true, xp: true, color: true };
  var keys = Object.keys(accountData);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (!skipKeys[k]) {
      data[k] = accountData[k];
    }
  }

  return {
    username: username,
    chips:    chips,
    level:    level,
    xp:       xp,
    color:    color,
    data:     data,
  };
}

/**
 * Reassemble an account object from a database row.
 *
 * @param {object} row - A row from the accounts table
 * @returns {object} Full account object compatible with accounts.js
 */
function _rowToAccount(row) {
  if (!row) return null;

  // Start with the JSONB blob (may contain monsters, inventory, stats, etc.)
  var account = {};
  if (row.data && typeof row.data === 'object') {
    // Shallow-copy JSONB fields
    var dataKeys = Object.keys(row.data);
    for (var i = 0; i < dataKeys.length; i++) {
      account[dataKeys[i]] = row.data[dataKeys[i]];
    }
  }

  // Overlay column fields (authoritative — override anything in JSONB)
  account.key      = row.key;
  account.username = row.username;
  account.chips    = typeof row.chips === 'string' ? parseInt(row.chips, 10) : (row.chips || 0);
  account.level    = row.level || 1;
  account.xp       = typeof row.xp === 'string' ? parseInt(row.xp, 10) : (row.xp || 0);
  account.color    = row.color || '#ffffff';

  return account;
}

/**
 * Fetch an account by its primary key.
 *
 * @param {string} key - Account key (12-char alphanumeric)
 * @returns {Promise<object|null>} Account object or null
 */
function getAccount(key) {
  if (!pool || !isConnected) return Promise.resolve(null);
  if (!key || typeof key !== 'string') return Promise.resolve(null);

  return pool.query('SELECT * FROM accounts WHERE key = $1', [key])
    .then(function(result) {
      if (!result || result.rows.length === 0) return null;
      return _rowToAccount(result.rows[0]);
    })
    .catch(function(err) {
      console.error('[db] getAccount error:', err.message);
      if (_isConnectionError(err)) { isConnected = false; _scheduleReconnectCheck(); }
      return null;
    });
}

/**
 * Upsert (insert or update) an account.
 *
 * Uses INSERT ... ON CONFLICT (key) DO UPDATE to atomically create or
 * overwrite the account row.  The `data` JSONB column is fully replaced
 * on each write (not merged) to stay consistent with the file-based
 * approach where the entire JSON blob is rewritten.
 *
 * @param {string} key          - Account key
 * @param {object} accountData  - Full account object
 * @returns {Promise<boolean>}  true on success, false on failure
 */
function saveAccount(key, accountData) {
  if (!pool || !isConnected) return Promise.resolve(false);
  if (!key || typeof key !== 'string') return Promise.resolve(false);
  if (!accountData || typeof accountData !== 'object') return Promise.resolve(false);

  var split = _splitAccountData(accountData);

  var sql = [
    'INSERT INTO accounts (key, username, color, chips, level, xp, data, created_at, updated_at)',
    'VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
    'ON CONFLICT (key) DO UPDATE SET',
    '  username   = EXCLUDED.username,',
    '  color      = EXCLUDED.color,',
    '  chips      = EXCLUDED.chips,',
    '  level      = EXCLUDED.level,',
    '  xp         = EXCLUDED.xp,',
    '  data       = EXCLUDED.data,',
    '  updated_at = NOW()',
  ].join('\n');

  var params = [
    key,
    split.username,
    split.color,
    split.chips,
    split.level,
    split.xp,
    JSON.stringify(split.data),
  ];

  return pool.query(sql, params)
    .then(function() {
      return true;
    })
    .catch(function(err) {
      console.error('[db] saveAccount error:', err.message);
      if (_isConnectionError(err)) { isConnected = false; _scheduleReconnectCheck(); }
      return false;
    });
}

/**
 * Delete an account by key.
 *
 * @param {string} key - Account key
 * @returns {Promise<boolean>} true if a row was deleted
 */
function deleteAccount(key) {
  if (!pool || !isConnected) return Promise.resolve(false);
  if (!key || typeof key !== 'string') return Promise.resolve(false);

  return pool.query('DELETE FROM accounts WHERE key = $1', [key])
    .then(function(result) {
      return result && result.rowCount > 0;
    })
    .catch(function(err) {
      console.error('[db] deleteAccount error:', err.message);
      if (_isConnectionError(err)) { isConnected = false; _scheduleReconnectCheck(); }
      return false;
    });
}

/**
 * Get the leaderboard (top accounts by chips, descending).
 *
 * @param {number} [limit] - Max entries to return (default 50)
 * @returns {Promise<Array|null>} Array of leaderboard entries or null
 */
function getLeaderboard(limit) {
  if (!pool || !isConnected) return Promise.resolve(null);
  var lim = typeof limit === 'number' && limit > 0 ? Math.min(limit, 500) : 50;

  var sql = [
    'SELECT key, username, color, chips, level, xp,',
    "  data->>'stats' AS stats_json,",
    "  data->>'tag' AS tag,",
    '  created_at, updated_at',
    'FROM accounts',
    'ORDER BY chips DESC',
    'LIMIT $1',
  ].join('\n');

  return pool.query(sql, [lim])
    .then(function(result) {
      if (!result || !result.rows) return null;
      var entries = [];
      for (var i = 0; i < result.rows.length; i++) {
        var row = result.rows[i];
        var stats = {};
        if (row.stats_json) {
          try { stats = JSON.parse(row.stats_json); } catch (_) {}
        }
        entries.push({
          username: row.username,
          color:    row.color || '#f0b232',
          chips:    typeof row.chips === 'string' ? parseInt(row.chips, 10) : (row.chips || 0),
          level:    row.level || 1,
          xp:       typeof row.xp === 'string' ? parseInt(row.xp, 10) : (row.xp || 0),
          stats:    stats,
          tag:      row.tag || '????',
        });
      }
      return entries;
    })
    .catch(function(err) {
      console.error('[db] getLeaderboard error:', err.message);
      if (_isConnectionError(err)) { isConnected = false; _scheduleReconnectCheck(); }
      return null;
    });
}

/**
 * Get all account keys in the database.
 * Useful for migration scripts (file -> DB or DB -> file).
 *
 * @returns {Promise<Array<string>|null>} Array of key strings or null
 */
function getAllAccountKeys() {
  if (!pool || !isConnected) return Promise.resolve(null);

  return pool.query('SELECT key FROM accounts ORDER BY created_at ASC')
    .then(function(result) {
      if (!result || !result.rows) return null;
      var keys = [];
      for (var i = 0; i < result.rows.length; i++) {
        keys.push(result.rows[i].key);
      }
      return keys;
    })
    .catch(function(err) {
      console.error('[db] getAllAccountKeys error:', err.message);
      if (_isConnectionError(err)) { isConnected = false; _scheduleReconnectCheck(); }
      return null;
    });
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

/**
 * Drain the connection pool.  Call this on process exit to close
 * all idle PostgreSQL connections cleanly.
 *
 * @returns {Promise<void>}
 */
function close() {
  if (!pool) return Promise.resolve();
  return pool.end()
    .then(function() {
      isConnected = false;
      console.log('[db] Connection pool closed');
    })
    .catch(function(err) {
      console.error('[db] Error closing pool:', err.message);
    });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  pool:              pool,
  get isConnected()  { return isConnected; },

  // Account operations
  getAccount:        getAccount,
  saveAccount:       saveAccount,
  deleteAccount:     deleteAccount,
  getLeaderboard:    getLeaderboard,
  getAllAccountKeys:  getAllAccountKeys,

  // Generic query
  query:             query,

  // Lifecycle
  close:             close,
};
