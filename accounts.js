// accounts.js — Optional persistent account system for MMOLite
// File-per-account storage in data/accounts/{key}.json
// Accounts survive daily wipes.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

var db = null;
try { db = require('./db'); } catch (_) {}

const ACCOUNTS_DIR = path.join(__dirname, 'data', 'accounts');
const KEY_LENGTH = 12;
const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; // no ambiguous chars

// ─── Multi-key encryption with rotation support ───
// Supports versioned encryption keys via /etc/mmolite/account_secrets.json
// Falls back to single ACCOUNT_SECRET env var for backward compatibility.
var ENCRYPTION_KEYS = []; // Array of { version: number, key: Buffer(32) }
var CURRENT_VERSION = 0;
var KEYS_FILE = process.env.MMOLITE_KEYS_FILE || '/etc/mmolite/account_secrets.json';

try {
  if (fs.existsSync(KEYS_FILE)) {
    var _keysConfig = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    if (_keysConfig.keys && Array.isArray(_keysConfig.keys) && _keysConfig.keys.length > 0) {
      CURRENT_VERSION = typeof _keysConfig.current === 'number' ? _keysConfig.current : 0;
      for (var _ki = 0; _ki < _keysConfig.keys.length; _ki++) {
        var _entry = _keysConfig.keys[_ki];
        if (typeof _entry.version === 'number' && typeof _entry.secret === 'string') {
          ENCRYPTION_KEYS.push({
            version: _entry.version,
            key: crypto.createHash('sha256').update(_entry.secret).digest()
          });
        }
      }
      console.log('[accounts] Loaded ' + ENCRYPTION_KEYS.length + ' encryption keys, current version: ' + CURRENT_VERSION);
    }
  }
} catch (_keysErr) {
  console.error('[accounts] Failed to load ' + KEYS_FILE + ':', _keysErr.message);
}

// Fallback: single ACCOUNT_SECRET env var (version 0)
if (ENCRYPTION_KEYS.length === 0) {
  var _ACCOUNT_SECRET = process.env.ACCOUNT_SECRET || null;
  if (!_ACCOUNT_SECRET) {
    console.error('[accounts] FATAL: No ACCOUNT_SECRET environment variable set and no keys file found at ' + KEYS_FILE + '.');
    console.error('[accounts] Set the ACCOUNT_SECRET env var before starting the server.');
    console.error('[accounts] Example: ACCOUNT_SECRET=your-random-secret-here node server.js');
    process.exit(1);
  }
  ENCRYPTION_KEYS.push({
    version: 0,
    key: crypto.createHash('sha256').update(_ACCOUNT_SECRET).digest()
  });
  CURRENT_VERSION = 0;
}

function _getCurrentKey() {
  for (var i = 0; i < ENCRYPTION_KEYS.length; i++) {
    if (ENCRYPTION_KEYS[i].version === CURRENT_VERSION) return ENCRYPTION_KEYS[i];
  }
  return ENCRYPTION_KEYS[ENCRYPTION_KEYS.length - 1]; // fallback to last
}

function _getKeyByVersion(version) {
  for (var i = 0; i < ENCRYPTION_KEYS.length; i++) {
    if (ENCRYPTION_KEYS[i].version === version) return ENCRYPTION_KEYS[i];
  }
  return null;
}

// ─── Zero-knowledge key storage ───
// Runtime map: keyHash -> rawKey (populated when users log in, cleared on disconnect)
const keyHashMap = new Map();

function _keyHash(key) {
  return crypto.createHash('sha256').update(key.replace(/[^a-zA-Z0-9]/g, '')).digest('hex');
}

// ─── PIN hashing (scrypt, Node built-in) ───
const PIN_SALT_LEN = 16;
const PIN_KEY_LEN = 32;

function hashPin(pin) {
  return new Promise(function(resolve, reject) {
    var salt = crypto.randomBytes(PIN_SALT_LEN);
    crypto.scrypt(pin, salt, PIN_KEY_LEN, { N: 16384, r: 8, p: 1 }, function(err, hash) {
      if (err) return reject(err);
      resolve(salt.toString('hex') + ':' + hash.toString('hex'));
    });
  });
}

function verifyPin(pin, stored) {
  if (!pin || !stored || typeof stored !== 'string') return Promise.resolve(false);
  var parts = stored.split(':');
  if (parts.length !== 2) return Promise.resolve(false);
  try {
    var salt = Buffer.from(parts[0], 'hex');
    var expected = Buffer.from(parts[1], 'hex');
    if (salt.length !== PIN_SALT_LEN || expected.length !== PIN_KEY_LEN) return Promise.resolve(false);
    // Try multiple scrypt param sets to handle hashes from before param changes
    var paramSets = [
      { N: 16384, r: 8, p: 1 },  // current
      { N: 16384, r: 8, p: 2 },  // intermediate legacy
    ];
    return new Promise(function(resolve) {
      var idx = 0;
      function tryNext() {
        if (idx >= paramSets.length) return resolve(false);
        var params = paramSets[idx++];
        try {
          crypto.scrypt(pin, salt, PIN_KEY_LEN, params, function(err, hash) {
            if (!err && crypto.timingSafeEqual(hash, expected)) return resolve(true);
            tryNext();
          });
        } catch (_) { tryNext(); }
      }
      tryNext();
    });
  } catch (_) {
    return Promise.resolve(false);
  }
}

async function setPinForAccount(key, pin) {
  if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 8 || !/^[a-zA-Z0-9]+$/.test(pin)) return false;
  var acc = loadAccount(key);
  if (!acc) return false;
  acc.pinHash = await hashPin(pin);
  saveAccount(acc);
  return true;
}

// ─── AES-256-GCM encryption helpers ───

function _encryptData(plaintext) {
  var currentKey = _getCurrentKey();
  var iv = crypto.randomBytes(12); // 96-bit IV for GCM
  var cipher = crypto.createCipheriv('aes-256-gcm', currentKey.key, iv);
  var encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  var authTag = cipher.getAuthTag();
  if (CURRENT_VERSION === 0) {
    // Legacy format (no version prefix) for backward compatibility
    return Buffer.concat([iv, authTag, encrypted]);
  }
  // Versioned format: version(1) + iv(12) + authTag(16) + ciphertext
  var vByte = Buffer.alloc(1);
  vByte[0] = currentKey.version;
  return Buffer.concat([vByte, iv, authTag, encrypted]);
}

function _decryptData(buffer) {
  if (buffer.length < 29) return null; // 12 + 16 + 1 minimum

  // Strategy 1: Try versioned format (first byte = known version > 0)
  var firstByte = buffer[0];
  if (firstByte > 0 && buffer.length >= 30) {
    var vKey = _getKeyByVersion(firstByte);
    if (vKey) {
      try {
        var vIv = buffer.slice(1, 13);
        var vTag = buffer.slice(13, 29);
        var vCipher = buffer.slice(29);
        var vDecipher = crypto.createDecipheriv('aes-256-gcm', vKey.key, vIv);
        vDecipher.setAuthTag(vTag);
        var vDec = Buffer.concat([vDecipher.update(vCipher), vDecipher.final()]);
        return vDec.toString('utf8');
      } catch (_) { /* fall through to legacy */ }
    }
  }

  // Strategy 2: Legacy format (no version prefix) — try all keys newest-first
  for (var i = ENCRYPTION_KEYS.length - 1; i >= 0; i--) {
    try {
      var iv = buffer.slice(0, 12);
      var authTag = buffer.slice(12, 28);
      var ciphertext = buffer.slice(28);
      var decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEYS[i].key, iv);
      decipher.setAuthTag(authTag);
      var decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (_) { continue; }
  }
  return null;
}

// In-memory store for temporary accounts (never written to disk)
const tempAccounts = new Map();

// ─── Tag index for O(1) friend lookups (Finding #9) ───
// Map<"username_lower:TAG", accountKey>
const tagIndex = new Map();

// ─── Write-behind cache for async I/O ───
const accountCache = new Map();
const CACHE_MAX = 5000;
const pendingWrites = new Map(); // key -> timeout handle

function _queueWrite(account) {
  const key = account.key;
  if (account.temp) return; // temps never hit disk
  // Update cache immediately
  accountCache.set(key, account);
  _evictCache();
  // Debounce disk write — at most once per 500ms per account
  if (pendingWrites.has(key)) clearTimeout(pendingWrites.get(key));
  pendingWrites.set(key, setTimeout(() => {
    pendingWrites.delete(key);
    const fp = accountPath(key);
    if (!fp) return;
    var scrubbed = _scrubForDisk(account);
    var jsonStr = JSON.stringify(scrubbed);
    var encrypted = _encryptData(jsonStr);
    fs.promises.writeFile(fp, encrypted)
      .catch(err => console.error('[accounts] Async write error:', err.message));
  }, 500));
}

// Evict oldest cache entries when over limit (Map iterates in insertion order)
function _evictCache() {
  if (accountCache.size <= CACHE_MAX) return;
  const iter = accountCache.keys();
  while (accountCache.size > CACHE_MAX * 0.8) {
    const oldest = iter.next().value;
    if (oldest) accountCache.delete(oldest);
    else break;
  }
}

// ─── Zero-knowledge scrub/restore for disk persistence ───

function _scrubForDisk(account) {
  // Shallow copy — only deep-clone fields that need mutation (friends, blocked, friendRequests, dms)
  var copy = Object.assign({}, account);
  // Replace raw key with hash
  if (copy.key) {
    copy.keyHash = _keyHash(copy.key);
    copy.tag = keyToTag(copy.key);
    delete copy.key;
  }
  // Hash friend keys (clone array + each entry)
  if (copy.friends && Array.isArray(copy.friends)) {
    copy.friends = copy.friends.map(function(f) {
      var hashed = Object.assign({}, f);
      if (hashed.key) { hashed.keyHash = _keyHash(hashed.key); delete hashed.key; }
      return hashed;
    });
  }
  // Hash blocked keys (clone array)
  if (copy.blocked && Array.isArray(copy.blocked)) {
    copy.blocked = copy.blocked.map(function(k) { return typeof k === 'string' && k.length < 64 ? _keyHash(k) : k; });
  }
  // Hash friend request keys (clone object + arrays)
  if (copy.friendRequests) {
    copy.friendRequests = Object.assign({}, copy.friendRequests);
    if (copy.friendRequests.incoming && Array.isArray(copy.friendRequests.incoming)) {
      copy.friendRequests.incoming = copy.friendRequests.incoming.map(function(r) {
        var hashed = Object.assign({}, r);
        if (hashed.fromKey) { hashed.fromKeyHash = _keyHash(hashed.fromKey); delete hashed.fromKey; }
        return hashed;
      });
    }
    if (copy.friendRequests.outgoing && Array.isArray(copy.friendRequests.outgoing)) {
      copy.friendRequests.outgoing = copy.friendRequests.outgoing.map(function(r) {
        var hashed = Object.assign({}, r);
        if (hashed.toKey) { hashed.toKeyHash = _keyHash(hashed.toKey); delete hashed.toKey; }
        return hashed;
      });
    }
  }
  // Hash DM conversation keys (clone dms object + conversations)
  if (copy.dms && copy.dms.conversations) {
    copy.dms = Object.assign({}, copy.dms);
    var newConvos = {};
    for (var convKey in copy.dms.conversations) {
      var hashedConvKey = convKey.length < 64 ? _keyHash(convKey) : convKey;
      newConvos[hashedConvKey] = copy.dms.conversations[convKey];
    }
    copy.dms.conversations = newConvos;
  }
  return copy;
}

function _restoreFromDisk(diskAccount, rawKey) {
  var account = JSON.parse(JSON.stringify(diskAccount));
  // Restore raw key
  account.key = rawKey;
  delete account.keyHash;
  // Restore friend keys from runtime keyHashMap
  if (account.friends && Array.isArray(account.friends)) {
    account.friends = account.friends.map(function(f) {
      if (f.keyHash && keyHashMap.has(f.keyHash)) {
        f.key = keyHashMap.get(f.keyHash);
        delete f.keyHash;
      } else if (f.keyHash) {
        // Friend not online — keep hash as placeholder, resolve later
        f.key = f.keyHash;
      }
      return f;
    });
  }
  // Restore blocked keys from runtime map
  if (account.blocked && Array.isArray(account.blocked)) {
    account.blocked = account.blocked.map(function(h) {
      return keyHashMap.has(h) ? keyHashMap.get(h) : h;
    });
  }
  // Restore friend request keys from runtime map
  if (account.friendRequests) {
    if (account.friendRequests.incoming && Array.isArray(account.friendRequests.incoming)) {
      account.friendRequests.incoming = account.friendRequests.incoming.map(function(r) {
        if (r.fromKeyHash) {
          r.fromKey = keyHashMap.has(r.fromKeyHash) ? keyHashMap.get(r.fromKeyHash) : r.fromKeyHash;
          delete r.fromKeyHash;
        }
        return r;
      });
    }
    if (account.friendRequests.outgoing && Array.isArray(account.friendRequests.outgoing)) {
      account.friendRequests.outgoing = account.friendRequests.outgoing.map(function(r) {
        if (r.toKeyHash) {
          r.toKey = keyHashMap.has(r.toKeyHash) ? keyHashMap.get(r.toKeyHash) : r.toKeyHash;
          delete r.toKeyHash;
        }
        return r;
      });
    }
  }
  // Restore DM conversation keys
  if (account.dms && account.dms.conversations) {
    var newConvos = {};
    for (var convHash in account.dms.conversations) {
      var realKey = keyHashMap.has(convHash) ? keyHashMap.get(convHash) : convHash;
      newConvos[realKey] = account.dms.conversations[convHash];
    }
    account.dms.conversations = newConvos;
  }
  return account;
}

// Force-flush all pending writes to disk (call on shutdown)
function flushAll() {
  for (const [key, timer] of pendingWrites) {
    clearTimeout(timer);
    pendingWrites.delete(key);
    const account = accountCache.get(key);
    if (!account || account.temp) continue;
    const fp = accountPath(key);
    if (!fp) continue;
    // Synchronous write on shutdown — must complete before exit
    try {
      var scrubbed = _scrubForDisk(account);
      var jsonStr = JSON.stringify(scrubbed);
      var encrypted = _encryptData(jsonStr);
      fs.writeFileSync(fp, encrypted);
    } catch (err) {
      console.error('[accounts] Flush write error for', key, ':', err.message);
    }
  }
}

// Safe sync existence check (used only for rare key-collision detection on create)
function _fileExistsSync(fp) {
  if (!fp) return false;
  try { fs.accessSync(fp); return true; } catch (_) { return false; }
}

const rpgData = require('./rpg-data');

// ---------------------------------------------------------------------------
// Character Slots System — "Swap-In / Swap-Out" Pattern
// ---------------------------------------------------------------------------
const MAX_CHARACTERS_PER_ACCOUNT = 4;

// Fields that belong to a character (extracted/restored during character switch)
const CHARACTER_FIELDS = [
  'monsters', 'activeParty', 'level', 'xp', 'guildId', 'questProgress',
  'craftingRecipes', 'skills', 'mmoInventory', 'equipment', 'plotId',
  'race', 'rpgStats', 'rpgCards', 'equippedCards', 'cardSlots', 'activeCardSlots', 'passiveCardSlots',
  'pendingPacks', 'pityPullsSinceLegendary', 'mount', 'lastZone', 'lastPosition', 'chips',
  'dungeonProgress',
  'knowledge',
  'permadeath',
  'awakenings',
];

// Returns default value for a character field (mirrors createAccount defaults)
function _getDefaultForField(field) {
  switch (field) {
    case 'monsters': return [];
    case 'activeParty': return [];
    case 'level': return 1;
    case 'xp': return 0;
    case 'guildId': return null;
    case 'questProgress': return {};
    case 'craftingRecipes': return [];
    case 'skills': return rpgData.getDefaultSkills();
    case 'mmoInventory': return { wood: 0, stone: 0, iron_ore: 0, iron_bar: 0, items: [] };
    case 'equipment': return { axe: null, pickaxe: null };
    case 'plotId': return null;
    case 'race': return null;
    case 'rpgStats': return rpgData.getDefaultStats();
    case 'rpgCards': return [];
    case 'equippedCards': return [];
    case 'cardSlots': return 1;
    case 'activeCardSlots': return 1;
    case 'passiveCardSlots': return 0;
    case 'pendingPacks': return 0;
    case 'pityPullsSinceLegendary': return 0;
    case 'mount': return null;
    case 'lastZone': return null;
    case 'lastPosition': return null;
    case 'chips': return 0;
    case 'dungeonProgress': return {
      guildMember: false,
      guildXp: 0,
      guildRank: 'stone',
      deepestFloor: 0,
      totalKills: 0,
      totalDeaths: 0,
      bossesKilled: 0,
      dailyQuests: {},
      lastQuestDate: null,
      clearedCaves: {},
      activeCave: null,
      activeCaveFloor: 0,
    };
    case 'knowledge': return {
      glossaryUnlocked: [],
      booksDiscovered: [],
      glossaryTriggersFired: [],
    };
    case 'permadeath': return false;
    case 'awakenings': return [];
    default: return null;
  }
}

// Extract character-specific fields from account top level into a plain object
function _extractCharacterData(account) {
  var charData = {};
  for (var i = 0; i < CHARACTER_FIELDS.length; i++) {
    var field = CHARACTER_FIELDS[i];
    charData[field] = account[field] !== undefined ? account[field] : _getDefaultForField(field);
  }
  // Preserve character metadata
  charData.name = account._characterName || account.username || 'Character';
  charData.createdAt = account._characterCreatedAt || account.createdAt;
  return charData;
}

// Apply a character object's fields to the account top level (swap-in)
function _applyCharacterData(account, charData) {
  for (var i = 0; i < CHARACTER_FIELDS.length; i++) {
    var field = CHARACTER_FIELDS[i];
    account[field] = charData[field] !== undefined ? charData[field] : _getDefaultForField(field);
  }
  account._characterName = charData.name || account.username || 'Character';
  account._characterCreatedAt = charData.createdAt || Date.now();
}

// Get a summary of a character for the character list
function _getCharacterSummary(charData, index) {
  return {
    index: index,
    name: charData.name || 'Character',
    race: charData.race || null,
    level: charData.level || 1,
    guildId: charData.guildId || null,
    createdAt: charData.createdAt || 0,
    hasPlot: !!charData.plotId,
    permadeath: !!charData.permadeath,
  };
}

// Lazy migration: wrap existing top-level character data into characters[0]
function _migrateToMultiCharacter(account) {
  if (!account.hallOfHeroes) account.hallOfHeroes = [];
  if (account.characters) return; // already migrated
  var charData = {};
  for (var i = 0; i < CHARACTER_FIELDS.length; i++) {
    var field = CHARACTER_FIELDS[i];
    charData[field] = account[field] !== undefined ? account[field] : _getDefaultForField(field);
  }
  charData.name = account.username || 'Character';
  charData.createdAt = account.createdAt || Date.now();
  account.characters = [charData];
  account.activeCharacterIndex = 0;
  account.maxCharacters = MAX_CHARACTERS_PER_ACCOUNT;
  account._characterName = charData.name;
  account._characterCreatedAt = charData.createdAt;
}

const ACCOUNT_EXPIRY_DAYS = 3650; // ~10 years — effectively permanent for MMO accounts
const ACCOUNT_EXPIRY_MS = ACCOUNT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const MAX_CHIPS = 999999999; // ~1 billion cap

// Sanitize usernames — only letters, digits, and spaces (no special chars)
function sanitizeName(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9 ]/g, '').trim();
}

// Tag generation: must match state.js generateTag() exactly
// Uses HMAC-SHA256 for deterministic but non-reversible tags
var TAG_ALPHANUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function keyToTag(key) {
  if (!key || typeof key !== 'string') return '????';
  var hmac = crypto.createHmac('sha256', process.env.TAG_HMAC_SECRET || 'mmolite-tag-v1').update(key).digest();
  var tag = '';
  for (var i = 0; i < 4; i++) {
    tag += TAG_ALPHANUM[hmac[i] % TAG_ALPHANUM.length];
  }
  return tag;
}

// Get 4-char discriminator from account key (safe to share publicly)
function getDiscriminator(key) {
  return keyToTag(key);
}

// Get user's friend tag: "Username#ABCD"
function getUserTag(key) {
  var acc = loadAccount(key);
  if (!acc) return null;
  return acc.username + '#' + keyToTag(key);
}

// Update tag index for an account
function _updateTagIndex(acc, rawKey) {
  if (!acc || acc.temp || !acc.username) return;
  var tag = acc.tag || (rawKey ? keyToTag(rawKey) : null);
  if (!tag) return;
  var indexKey = acc.username.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim() + ':' + tag.toUpperCase();
  tagIndex.set(indexKey, rawKey || (acc.keyHash && keyHashMap.has(acc.keyHash) ? keyHashMap.get(acc.keyHash) : null));
}

// Find a permanent account by friend tag (Username#discriminator)
// Uses in-memory index for O(1) lookup; falls back to disk scan if index miss
function findAccountByTag(username, discriminator) {
  var normalized = (username || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  if (!normalized || !discriminator || discriminator.length < 4) return null;
  var disc = discriminator.toUpperCase();

  // O(1) index lookup
  var indexKey = normalized + ':' + disc;
  if (tagIndex.has(indexKey)) {
    var cachedKey = tagIndex.get(indexKey);
    if (cachedKey) return cachedKey;
  }

  // Fallback: full scan (populates index as it goes)
  var files;
  try { files = fs.readdirSync(ACCOUNTS_DIR); } catch (e) { return null; }

  var scanned = 0;
  var MAX_SCAN = 500;
  for (var i = 0; i < files.length; i++) {
    if (++scanned > MAX_SCAN) break;
    if (!files[i].endsWith('.json')) continue;
    var fp = path.join(ACCOUNTS_DIR, files[i]);
    try {
      var buf = fs.readFileSync(fp);
      var acc;
      try {
        var decrypted = _decryptData(buf);
        if (decrypted) acc = JSON.parse(decrypted);
      } catch (_) {}
      if (!acc) {
        try { acc = JSON.parse(buf.toString('utf8')); } catch (_) {}
      }
      if (!acc || acc.temp) continue;
      var tag = acc.tag || (acc.key ? keyToTag(acc.key) : null);
      // Populate index for future lookups
      if (acc.username && tag) {
        var ik = acc.username.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim() + ':' + tag.toUpperCase();
        var resolvedKey = acc.key || (acc.keyHash && keyHashMap.has(acc.keyHash) ? keyHashMap.get(acc.keyHash) : null);
        tagIndex.set(ik, resolvedKey);
      }
      if (tag !== disc) continue;
      if (acc.username && acc.username.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim() === normalized) {
        if (acc.key) return acc.key;
        if (acc.keyHash && keyHashMap.has(acc.keyHash)) return keyHashMap.get(acc.keyHash);
        return null;
      }
    } catch (_) { continue; }
  }
  return null;
}

// Ensure directory exists
fs.mkdirSync(ACCOUNTS_DIR, { recursive: true });
if (ENCRYPTION_KEYS.length > 0) {
  console.log('[accounts] Encryption enabled (' + ENCRYPTION_KEYS.length + ' key(s), current version: ' + CURRENT_VERSION + ')');
}

// ─── Startup: pre-populate keyHashMap from all account files ───
// This allows friend key resolution to work immediately after restart
// without waiting for each user to log in.
(function _preloadKeyIndex() {
  try {
    var files = fs.readdirSync(ACCOUNTS_DIR).filter(function(f) { return f.endsWith('.json'); });
    var loaded = 0;
    for (var i = 0; i < files.length; i++) {
      var fp = path.join(ACCOUNTS_DIR, files[i]);
      try {
        var buf = fs.readFileSync(fp);
        var decrypted = _decryptData(buf);
        if (!decrypted) continue;
        var acc = JSON.parse(decrypted);
        // For hash-named files, we need some way to recover the raw key.
        // The raw key is NOT stored on disk (keyHash is stored instead).
        // But we CAN pre-populate the keyHash -> file mapping for future resolution.
        // Log pinHash status for debugging
        if (acc.keyHash) {
          console.log('[accounts-preload] file=' + files[i].slice(0, 8) + '... username=' + (acc.username || '?') + ' pinHash=' + (acc.pinHash ? 'SET' : 'NOT_SET'));
        }
        loaded++;
      } catch (e) { /* skip corrupt files */ }
    }
    if (loaded > 0) console.log('[accounts] Pre-loaded ' + loaded + ' account file(s) for diagnostics');
  } catch (e) {
    // data dir might not exist yet
  }
})();

function generateKey() {
  let key = '';
  // Rejection sampling to eliminate modulo bias
  const maxValid = 256 - (256 % KEY_CHARS.length);
  while (key.length < KEY_LENGTH) {
    const byte = crypto.randomBytes(1)[0];
    if (byte < maxValid) {
      key += KEY_CHARS[byte % KEY_CHARS.length];
    }
  }
  return key;
}

function accountPath(key) {
  // Sanitize key to prevent directory traversal
  var safeKey = key.replace(/[^a-zA-Z0-9]/g, '');
  if (safeKey.length < 12) return null;
  var hash = crypto.createHash('sha256').update(safeKey).digest('hex');
  return path.join(ACCOUNTS_DIR, hash + '.json');
}

function _legacyAccountPath(key) {
  var safeKey = key.replace(/[^a-zA-Z0-9]/g, '');
  if (safeKey.length !== KEY_LENGTH) return null;
  return path.join(ACCOUNTS_DIR, safeKey + '.json');
}

function createAccount(username, color) {
  let key;
  let attempts = 0;
  do {
    key = generateKey();
    attempts++;
    if (attempts > 100) return null; // safety
  } while (accountCache.has(key) || _fileExistsSync(accountPath(key)));

  var cleanUsername = sanitizeName(username || 'Anon').slice(0, 20) || 'Anon';
  var now = Date.now();

  // Build initial character data
  var initialChar = {};
  for (var fi = 0; fi < CHARACTER_FIELDS.length; fi++) {
    initialChar[CHARACTER_FIELDS[fi]] = _getDefaultForField(CHARACTER_FIELDS[fi]);
  }
  initialChar.name = cleanUsername;
  initialChar.createdAt = now;

  const account = {
    key,
    username: cleanUsername,
    color: color || '#f0b232',
    createdAt: now,
    lastSeen: now,
    stats: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      highScore: 0,
      cordsPosted: 0,
    },
    slurFilter: false,
    favoriteGifs: [],
    uploads: [],
    metadata: {},
    // Character slots
    characters: [initialChar],
    activeCharacterIndex: 0,
    maxCharacters: MAX_CHARACTERS_PER_ACCOUNT,
    _characterName: cleanUsername,
    _characterCreatedAt: now,
    // Character-specific fields at top level (active character)
    monsters: [],
    activeParty: [],
    level: 1,
    xp: 0,
    guildId: null,
    questProgress: {},
    craftingRecipes: [],
    skills: rpgData.getDefaultSkills(),
    mmoInventory: { wood: 0, stone: 0, iron_ore: 0, iron_bar: 0, items: [] },
    equipment: { axe: null, pickaxe: null },
    plotId: null,
    race: null,
    rpgStats: rpgData.getDefaultStats(),
    rpgCards: [],
    equippedCards: [],
    cardSlots: 1,
    activeCardSlots: 1,
    passiveCardSlots: 0,
    pendingPacks: 0,
    pityPullsSinceLegendary: 0,
    mount: null,
    lastZone: null,
    lastPosition: null,
    chips: 0,
    leviathanKills: {},
    leviathanTotalKills: 0,
    awakenings: [],
  };

  saveAccount(account);
  return account;
}

function selectAwakening(key, awakeningId) {
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  if (!account.awakenings) account.awakenings = [];

  // Validate the awakening exists and player qualifies
  var available = rpgData.getAvailableAwakenings(
    account.level || 1,
    account.rpgStats || rpgData.getDefaultStats(),
    account.awakenings
  );

  var found = null;
  for (var i = 0; i < available.length; i++) {
    if (available[i].id === awakeningId) {
      found = available[i];
      break;
    }
  }

  if (!found) return { error: 'Awakening not available or already chosen' };

  account.awakenings.push(awakeningId);
  saveAccount(account);
  return { success: true, awakening: found, awakenings: account.awakenings };
}

function createTempAccount(username, color) {
  let key;
  let attempts = 0;
  do {
    key = 'tmp_' + generateKey().slice(0, 9);
    attempts++;
    if (attempts > 100) return null;
  } while (tempAccounts.has(key));

  var cleanUsername = sanitizeName(username || 'Anon').slice(0, 20) || 'Anon';
  var now = Date.now();

  var initialChar = {};
  for (var fi = 0; fi < CHARACTER_FIELDS.length; fi++) {
    initialChar[CHARACTER_FIELDS[fi]] = _getDefaultForField(CHARACTER_FIELDS[fi]);
  }
  initialChar.name = cleanUsername;
  initialChar.createdAt = now;

  const account = {
    key,
    temp: true,
    username: cleanUsername,
    color: color || '#f0b232',
    createdAt: now,
    lastSeen: now,
    stats: { gamesPlayed: 0, wins: 0, losses: 0, highScore: 0, cordsPosted: 0 },
    slurFilter: false,
    favoriteGifs: [],
    uploads: [],
    metadata: {},
    characters: [initialChar],
    activeCharacterIndex: 0,
    maxCharacters: MAX_CHARACTERS_PER_ACCOUNT,
    _characterName: cleanUsername,
    _characterCreatedAt: now,
    monsters: [],
    activeParty: [],
    level: 1,
    xp: 0,
    guildId: null,
    questProgress: {},
    craftingRecipes: [],
    skills: rpgData.getDefaultSkills(),
    mmoInventory: { wood: 0, stone: 0, iron_ore: 0, iron_bar: 0, items: [] },
    equipment: { axe: null, pickaxe: null },
    plotId: null,
    race: null,
    rpgStats: rpgData.getDefaultStats(),
    rpgCards: [],
    equippedCards: [],
    cardSlots: 1,
    activeCardSlots: 1,
    passiveCardSlots: 0,
    pendingPacks: 0,
    pityPullsSinceLegendary: 0,
    mount: null,
    lastZone: null,
    lastPosition: null,
    chips: 0,
  };
  tempAccounts.set(key, account);
  return account;
}

function promoteTempAccount(tempKey) {
  const temp = tempAccounts.get(tempKey);
  if (!temp) return null;

  // Generate a real permanent key
  let newKey;
  let attempts = 0;
  do {
    newKey = generateKey();
    attempts++;
    if (attempts > 100) return null;
  } while (accountCache.has(newKey) || _fileExistsSync(accountPath(newKey)));

  // Transfer all data to permanent account
  const permanent = Object.assign({}, temp, { key: newKey });
  delete permanent.temp;

  permanent.lastSeen = Date.now();
  // Cache immediately and queue async write
  accountCache.set(newKey, permanent);
  _queueWrite(permanent);

  // Remove from temp store
  tempAccounts.delete(tempKey);
  return permanent;
}

function isTempAccount(key) {
  return tempAccounts.has(key);
}

function isAccountExpired(account) {
  if (!account) return false;
  const lastActive = account.lastSeen || account.createdAt || 0;
  return (Date.now() - lastActive) > ACCOUNT_EXPIRY_MS;
}

function loadAccount(key) {
  if (!key || typeof key !== 'string') return null;
  // Check in-memory temp accounts first
  if (tempAccounts.has(key)) return tempAccounts.get(key);

  // Check write-behind cache
  if (accountCache.has(key)) {
    const cached = accountCache.get(key);
    if (isAccountExpired(cached)) {
      accountCache.delete(key);
      // Queue async deletion from disk
      const fp = accountPath(key);
      if (fp) fs.promises.unlink(fp).catch(() => {});
      return null;
    }
    // Lazy migration to multi-character system
    _migrateToMultiCharacter(cached);
    return cached;
  }

  // Fall back to disk read
  const fp = accountPath(key);
  if (!fp) return null;

  try {
    var raw, account;
    if (fs.existsSync(fp)) {
      // New encrypted format
      var encBuf = fs.readFileSync(fp);
      var decrypted = _decryptData(encBuf);
      if (!decrypted) return null;
      account = JSON.parse(decrypted);
    } else {
      // Try legacy plaintext format for migration
      var legacyFp = _legacyAccountPath(key);
      if (!legacyFp || !fs.existsSync(legacyFp)) return null;
      raw = fs.readFileSync(legacyFp, 'utf8');
      account = JSON.parse(raw);
      // Migrate: scrub and write encrypted to new path, delete old file
      var scrubbed = _scrubForDisk(account);
      var jsonStr = JSON.stringify(scrubbed);
      var encrypted = _encryptData(jsonStr);
      fs.writeFileSync(fp, encrypted);
      fs.promises.unlink(legacyFp).catch(() => {});
      console.log('[accounts] Migrated account to encrypted storage: ' + key.slice(0, 3) + '...');
    }
    // Validate: either legacy format (raw key) or new format (keyHash)
    if (!account) return null;
    if (account.keyHash) {
      // New format: validate hash matches
      if (account.keyHash !== _keyHash(key)) return null;
      // Restore full account from disk format
      account = _restoreFromDisk(account, key);
    } else if (account.key !== key) {
      return null;
    }
    if (isAccountExpired(account)) {
      fs.promises.unlink(fp).catch(() => {});
      return null;
    }
    // Lazy migration to multi-character system
    _migrateToMultiCharacter(account);
    accountCache.set(key, account);
    keyHashMap.set(_keyHash(key), key);
    _updateTagIndex(account, key);
    _evictCache();
    return account;
  } catch (_) {
    // File not found or corrupt — try PostgreSQL as last resort
    if (db && db.isConnected) {
      // Note: this is synchronous context but db returns Promise.
      // We can't block here, so we fire an async load and cache it for
      // the next call. First call returns null, subsequent calls hit cache.
      db.getAccount(key).then(function(dbAccount) {
        if (dbAccount && !isAccountExpired(dbAccount)) {
          accountCache.set(key, dbAccount);
          keyHashMap.set(_keyHash(key), key);
          _updateTagIndex(dbAccount, key);
        }
      }).catch(function() {});
    }
    return null;
  }
}

function saveAccount(account) {
  if (!account || !account.key) return false;
  account.lastSeen = Date.now();

  // Sync active character's top-level fields back into characters array
  if (account.characters && typeof account.activeCharacterIndex === 'number') {
    var idx = account.activeCharacterIndex;
    if (idx >= 0 && idx < account.characters.length) {
      var charData = account.characters[idx];
      for (var ci = 0; ci < CHARACTER_FIELDS.length; ci++) {
        var cf = CHARACTER_FIELDS[ci];
        charData[cf] = account[cf] !== undefined ? account[cf] : _getDefaultForField(cf);
      }
      charData.name = account._characterName || charData.name || account.username;
      charData.createdAt = account._characterCreatedAt || charData.createdAt;
    }
  }

  // Temp accounts stay in memory only
  if (account.temp) {
    tempAccounts.set(account.key, account);
    return true;
  }

  // Write-behind: update cache immediately, queue async disk write
  _queueWrite(account);
  keyHashMap.set(_keyHash(account.key), account.key);

  // Dual-write to PostgreSQL (fire-and-forget, file is still primary)
  if (db && db.isConnected) {
    db.saveAccount(account.key, account).catch(function() {});
  }

  return true;
}

// ─── In-process chip lock to prevent TOCTOU race conditions ───
// Serializes chip operations per account key so concurrent async callers
// cannot interleave load-modify-save across await boundaries.
// The synchronous updateChips/setChips acquire the lock, perform the mutation
// synchronously (safe in single-threaded Node.js), and return the result.
// The lock also prevents interleaving if callers yield between operations.
const _chipLocks = new Map(); // key -> { queue: Promise, depth: number }

// Acquire a per-key lock. Returns a release function.
// In synchronous code, lock acquisition is non-blocking because Node.js is single-threaded.
function _acquireChipLock(key) {
  var entry = _chipLocks.get(key);
  if (!entry) {
    entry = { queue: Promise.resolve(), depth: 0 };
    _chipLocks.set(key, entry);
  }
  entry.depth++;
  return function release() {
    entry.depth--;
    if (entry.depth <= 0) {
      _chipLocks.delete(key);
    }
  };
}

function updateChips(key, amount) {
  if (typeof amount !== 'number' || !isFinite(amount) || isNaN(amount)) return null;
  var release = _acquireChipLock(key);
  try {
    const account = loadAccount(key);
    if (!account) return null;
    account.chips = Math.min(MAX_CHIPS, Math.max(0, (account.chips || 0) + amount));
    saveAccount(account);
    return account.chips;
  } finally {
    release();
  }
}

function setChips(key, amount) {
  var release = _acquireChipLock(key);
  try {
    const account = loadAccount(key);
    if (!account) return null;
    account.chips = Math.min(MAX_CHIPS, Math.max(0, amount));
    saveAccount(account);
    return account.chips;
  } finally {
    release();
  }
}

// ---------------------------------------------------------------------------
// Skill system — Mining, Woodcutting, etc.
// ---------------------------------------------------------------------------
const SKILL_MAX_LEVEL = Infinity;
function xpForLevel(n) { return Math.floor(80 * Math.pow(n, 1.7)); } // Polynomial curve: ~401 at lv10, ~56k at lv50, ~175k at lv99

function getSkill(key, skillName) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.skills) account.skills = {};
  return account.skills[skillName] || { level: 1, xp: 0 };
}

function addSkillXp(key, skillName, amount, xpRate) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.skills) account.skills = rpgData.getDefaultSkills();
  if (!account.skills[skillName]) account.skills[skillName] = { level: 1, xp: 0 };

  // Apply server rules xpRate multiplier (custom shard setting)
  if (typeof xpRate === 'number' && xpRate > 0) {
    amount = Math.round(amount * xpRate);
  }

  // Apply racial XP bonuses
  var xpMultiplier = 1.0;
  if (account.race) {
    var race = rpgData.RACES[account.race];
    if (race && race.racialFeat && race.racialFeat.effects) {
      for (var ei = 0; ei < race.racialFeat.effects.length; ei++) {
        var eff = race.racialFeat.effects[ei];
        if (eff.type === 'xp_bonus_all') xpMultiplier += eff.value;
        if (eff.type === 'xp_bonus_skill' && eff.skill === skillName) xpMultiplier += eff.value;
      }
    }
  }
  // Apply stat-based XP bonus (acumen)
  if (account.rpgStats) {
    xpMultiplier += (account.rpgStats.acumen || 5) * 0.01;
  }
  // Apply equipped card XP bonuses
  var cardEffects = getEquippedCardEffects(key);
  for (var ci = 0; ci < cardEffects.length; ci++) {
    var cardEff = cardEffects[ci];
    if (cardEff.type === 'xp_bonus_all' && cardEff.value) {
      xpMultiplier += cardEff.value;
    }
    if (cardEff.type === 'xp_bonus_skill' && cardEff.skill === skillName && cardEff.value) {
      xpMultiplier += cardEff.value;
    }
  }

  var adjustedAmount = Math.round(amount * xpMultiplier);
  var skill = account.skills[skillName];
  skill.xp += adjustedAmount;
  var leveledUp = false;

  while (skill.level < SKILL_MAX_LEVEL && skill.xp >= xpForLevel(skill.level)) {
    skill.xp -= xpForLevel(skill.level);
    skill.level++;
    leveledUp = true;
  }

  // 10% XP spillover to overall level
  var overallLeveledUp = false;
  var spillXp = Math.round(adjustedAmount * rpgData.XP_SPILLOVER_RATE);
  if (spillXp > 0 && account.level < rpgData.MAX_OVERALL_LEVEL) {
    if (typeof account.xp !== 'number') account.xp = 0;
    account.xp += spillXp;
    while (account.level < rpgData.MAX_OVERALL_LEVEL && account.xp >= rpgData.overallXpForLevel(account.level)) {
      account.xp -= rpgData.overallXpForLevel(account.level);
      account.level++;
      overallLeveledUp = true;
      // Award card pack on level up
      account.pendingPacks = (account.pendingPacks || 0) + 1;
      // Update card slots (total + split)
      account.cardSlots = rpgData.getCardSlotCount(account.level);
      account.activeCardSlots = rpgData.getActiveCardSlotCount(account.level);
      account.passiveCardSlots = rpgData.getPassiveCardSlotCount(account.level);
      // Award stat point every 3 levels
      if (account.level % rpgData.STAT_POINTS_PER_LEVELS === 0) {
        if (!account.rpgStats) account.rpgStats = rpgData.getDefaultStats();
        account.rpgStats.freePoints = (account.rpgStats.freePoints || 0) + 1;
      }
    }
  }

  saveAccount(account);
  return {
    level: skill.level, xp: skill.xp, xpNeeded: xpForLevel(skill.level), leveledUp: leveledUp,
    overallLevel: account.level, overallXp: account.xp, overallLeveledUp: overallLeveledUp,
    pendingPacks: account.pendingPacks || 0,
    freeStatPoints: account.rpgStats ? account.rpgStats.freePoints : 0,
  };
}

var ALLOWED_STAT_KEYS = new Set([
  'gamesPlayed', 'wins', 'losses', 'highScore', 'cordsPosted', 'cordsLiked',
  'messagesPosted', 'chipsWon', 'chipsLost', 'itemsCollected', 'tradesCompleted',
  'battlesWon', 'battlesLost', 'clickerClicks', 'giftsGiven', 'giftsReceived',
  'slotsPlayed', 'plinkoPlayed', 'scratchPlayed', 'lootboxOpened', 'coinFlipsPlayed',
  'pokerPlayed', 'blackjackPlayed', 'lieroPlayed', 'lieroWins', 'lieroKills',
]);

function updateStats(key, statUpdates) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.stats) account.stats = {};
  for (const [k, v] of Object.entries(statUpdates)) {
    if (!ALLOWED_STAT_KEYS.has(k)) continue;
    if (typeof v === 'number') {
      account.stats[k] = (account.stats[k] || 0) + v;
    } else {
      account.stats[k] = v;
    }
  }
  saveAccount(account);
  return account.stats;
}

function deleteAccount(key) {
  // Check temp accounts first
  if (tempAccounts.has(key)) {
    tempAccounts.delete(key);
    return true;
  }
  // Clear from cache and cancel pending writes
  accountCache.delete(key);
  if (pendingWrites.has(key)) {
    clearTimeout(pendingWrites.get(key));
    pendingWrites.delete(key);
  }
  const fp = accountPath(key);
  if (!fp) return false;
  // Async delete from disk
  fs.promises.unlink(fp).catch(() => {});
  // Also try deleting legacy path for migrated accounts
  var legacyFp = _legacyAccountPath(key);
  if (legacyFp) fs.promises.unlink(legacyFp).catch(() => {});
  return true;
}

function getPublicProfile(key) {
  const account = loadAccount(key);
  if (!account) return null;
  return {
    username: account.username,
    color: account.color,
    chips: account.chips,
    createdAt: account.createdAt,
    stats: account.stats || {},
  };
}

const MAX_FAVORITE_GIFS = 50;

function addFavoriteGif(key, gifUrl, previewUrl) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.favoriteGifs) account.favoriteGifs = [];
  // Don't duplicate
  if (account.favoriteGifs.some(g => g.url === gifUrl)) return account.favoriteGifs;
  account.favoriteGifs.unshift({ url: gifUrl, preview: previewUrl || gifUrl, addedAt: Date.now() });
  if (account.favoriteGifs.length > MAX_FAVORITE_GIFS) account.favoriteGifs.pop();
  saveAccount(account);
  return account.favoriteGifs;
}

function removeFavoriteGif(key, gifUrl) {
  const account = loadAccount(key);
  if (!account || !account.favoriteGifs) return null;
  account.favoriteGifs = account.favoriteGifs.filter(g => g.url !== gifUrl);
  saveAccount(account);
  return account.favoriteGifs;
}

function getFavoriteGifs(key) {
  const account = loadAccount(key);
  if (!account) return [];
  return account.favoriteGifs || [];
}

// Cache leaderboard to avoid scanning disk every request
let _leaderboardCache = null;
let _leaderboardCacheTime = 0;
const LEADERBOARD_CACHE_MS = 30 * 1000; // refresh every 30 seconds
let _leaderboardRefreshing = false;

// Non-blocking async leaderboard refresh
function _refreshLeaderboardAsync() {
  if (_leaderboardRefreshing) return;
  _leaderboardRefreshing = true;
  fs.promises.readdir(ACCOUNTS_DIR).then(files => {
    files = files.filter(f => f.endsWith('.json'));
    return Promise.all(files.map(f => {
      var fp = path.join(ACCOUNTS_DIR, f);
      return fs.promises.readFile(fp).then(buf => {
        var acc;
        // Try encrypted format first
        try {
          var decrypted = _decryptData(buf);
          if (decrypted) acc = JSON.parse(decrypted);
        } catch (_) {}
        // Fallback: plaintext JSON
        if (!acc) {
          try { acc = JSON.parse(buf.toString('utf8')); } catch (_) {}
        }
        if (!acc) return null;
        return { data: acc, key: acc.key || null, tag: acc.tag || (acc.key ? keyToTag(acc.key) : null) };
      }).catch(() => null);
    }));
  }).then(results => {
    const entries = results.filter(Boolean).map(r => ({
      username: r.data.username || 'Anon',
      color: r.data.color || '#f0b232',
      avatar: r.data.avatar || null,
      chips: r.data.chips || 0,
      stats: r.data.stats || {},
      tag: r.tag || (r.key ? keyToTag(r.key) : '????'),
      createdAt: r.data.createdAt,
      lastSeen: r.data.lastSeen,
    }));
    entries.sort((a, b) => b.chips - a.chips);
    _leaderboardCache = entries;
    _leaderboardCacheTime = Date.now();
  }).catch(err => {
    console.error('[accounts] Leaderboard refresh error:', err.message);
  }).finally(() => {
    _leaderboardRefreshing = false;
  });
}

function getLeaderboard(limit) {
  limit = limit || 50;
  const now = Date.now();
  if (_leaderboardCache && now - _leaderboardCacheTime < LEADERBOARD_CACHE_MS) {
    return _leaderboardCache.slice(0, limit);
  }
  // Prefer PostgreSQL leaderboard if available (indexed, no disk scan)
  if (db && db.isConnected) {
    db.getLeaderboard(limit).then(function(entries) {
      if (entries && entries.length > 0) {
        _leaderboardCache = entries;
        _leaderboardCacheTime = Date.now();
      }
    }).catch(function() {});
  } else {
    // Trigger non-blocking file scan refresh in the background
    _refreshLeaderboardAsync();
  }
  // Return stale data if available, otherwise empty
  return _leaderboardCache ? _leaderboardCache.slice(0, limit) : [];
}

// ─── Inventory management ───

const MAX_INVENTORY = 200;

function addInventoryItem(key, instanceItem) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.inventory) account.inventory = [];
  if (account.inventory.length >= MAX_INVENTORY) return { error: 'Inventory full' };
  account.inventory.push({
    id: instanceItem.instanceId,
    itemId: instanceItem.itemId,
    modifier: instanceItem.modifier || null,
    serial: instanceItem.serial || null,
    obtainedAt: instanceItem.obtainedAt || Date.now(),
    source: instanceItem.source || 'unknown',
  });
  saveAccount(account);
  return account.inventory;
}

function removeInventoryItem(key, instanceId) {
  const account = loadAccount(key);
  if (!account || !account.inventory) return null;
  const idx = account.inventory.findIndex(i => i.id === instanceId);
  if (idx === -1) return null;
  const removed = account.inventory.splice(idx, 1)[0];
  // Unequip if this item was equipped
  if (account.equipped) {
    if (account.equipped.badge === removed.itemId) account.equipped.badge = null;
    if (account.equipped.title === removed.itemId) account.equipped.title = null;
  }
  saveAccount(account);
  return removed;
}

function equipItem(key, instanceId) {
  const account = loadAccount(key);
  if (!account || !account.inventory) return null;
  const invItem = account.inventory.find(i => i.id === instanceId);
  if (!invItem) return null;
  if (!account.equipped) account.equipped = { badge: null, title: null };
  // Determine type from itemId prefix
  if (invItem.itemId.startsWith('badge_')) {
    account.equipped.badge = invItem.itemId;
  } else if (invItem.itemId.startsWith('title_')) {
    account.equipped.title = invItem.itemId;
  } else {
    return null; // collectibles can't be equipped
  }
  saveAccount(account);
  return account.equipped;
}

function unequipItem(key, type) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.equipped) account.equipped = { badge: null, title: null };
  if (type === 'badge') account.equipped.badge = null;
  else if (type === 'title') account.equipped.title = null;
  else return null;
  saveAccount(account);
  return account.equipped;
}

function getInventory(key) {
  const account = loadAccount(key);
  if (!account) return { inventory: [], equipped: { badge: null, title: null } };
  return {
    inventory: account.inventory || [],
    equipped: account.equipped || { badge: null, title: null },
  };
}

// ─── TCG Card collection ───

const MAX_CARDS = 500;

function addCard(key, cardInstance) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.cards) account.cards = [];
  if (account.cards.length >= MAX_CARDS) return { error: 'Card collection full (' + MAX_CARDS + ' max)' };
  account.cards.push({
    id: cardInstance.instanceId,
    cardId: cardInstance.cardId,
    rolledStats: cardInstance.rolledStats || null,
    shiny: cardInstance.shiny || false,
    obtainedAt: cardInstance.obtainedAt || Date.now(),
    source: cardInstance.source || 'unknown',
  });
  saveAccount(account);
  return account.cards;
}

function removeCard(key, instanceId) {
  const account = loadAccount(key);
  if (!account || !account.cards) return null;
  const idx = account.cards.findIndex(c => c.id === instanceId);
  if (idx === -1) return null;
  const removed = account.cards.splice(idx, 1)[0];
  saveAccount(account);
  return removed;
}

function getCards(key) {
  const account = loadAccount(key);
  if (!account) return [];
  return account.cards || [];
}

// ─── Showcase favorites (items user wants to show off) ───

const MAX_SHOWCASE = 6;

function setShowcase(key, showcaseItems) {
  const account = loadAccount(key);
  if (!account) return null;
  // Validate: only allow strings or numbers in showcase array
  var safe = [];
  var items = (showcaseItems || []).slice(0, MAX_SHOWCASE);
  for (var i = 0; i < items.length; i++) {
    if (typeof items[i] === 'string' || typeof items[i] === 'number') {
      safe.push(items[i]);
    }
  }
  account.showcase = safe;
  saveAccount(account);
  return account.showcase;
}

function getShowcase(key) {
  const account = loadAccount(key);
  if (!account) return [];
  return account.showcase || [];
}

// ─── Clicker idle game state ───

function _safeNum(val, fallback) {
  if (typeof val !== 'number' || !isFinite(val) || isNaN(val)) return fallback;
  return val;
}

function updateClickerState(key, state) {
  const account = loadAccount(key);
  if (!account) return null;
  // Sanitize: only allow known fields, reject non-plain objects
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  if (Object.getPrototypeOf(state) !== Object.prototype && Object.getPrototypeOf(state) !== null) return null;
  // Sanitize levels: only allow safe keys with finite numeric values, cap at 50 entries
  var safeLevels = Object.create(null);
  if (state.levels && typeof state.levels === 'object' && !Array.isArray(state.levels)) {
    var levelKeys = Object.keys(state.levels);
    for (var i = 0; i < Math.min(levelKeys.length, 50); i++) {
      var lk = levelKeys[i];
      if (typeof lk === 'string' && /^[a-zA-Z0-9_]+$/.test(lk) && typeof state.levels[lk] === 'number' && isFinite(state.levels[lk])) {
        safeLevels[lk] = Math.max(0, Math.floor(state.levels[lk]));
      }
    }
  }
  account.clickerState = {
    chips: _safeNum(state.chips, 0),
    levels: safeLevels,
    totalClicks: _safeNum(state.totalClicks, 0),
    totalEarned: _safeNum(state.totalEarned, 0),
    lastSaveTime: Date.now(),
    _collectDay: typeof state._collectDay === 'string' ? state._collectDay.slice(0, 10) : null,
    _collectTotal: _safeNum(state._collectTotal, 0),
    lastInterestDate: typeof state.lastInterestDate === 'string' ? state.lastInterestDate.slice(0, 10) : null,
  };
  saveAccount(account);
  return account.clickerState;
}

function getClickerState(key) {
  const account = loadAccount(key);
  if (!account) return null;
  return account.clickerState || null;
}

// ─── Slot Upgrades ───

function getSlotUpgrades(key) {
  const account = loadAccount(key);
  return account ? (account.slotUpgrades || {}) : {};
}

function updateSlotUpgrades(key, upgrades) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!upgrades || typeof upgrades !== 'object' || Array.isArray(upgrades)) return null;
  var safe = {};
  var keys = Object.keys(upgrades);
  for (var i = 0; i < Math.min(keys.length, 50); i++) {
    var k = keys[i];
    if (typeof k === 'string' && /^[a-zA-Z0-9_]+$/.test(k) && typeof upgrades[k] === 'number') {
      safe[k] = Math.max(0, Math.floor(upgrades[k]));
    }
  }
  account.slotUpgrades = safe;
  saveAccount(account);
  return safe;
}

// ─── Scratch Upgrades ───

function getScratchUpgrades(key) {
  const account = loadAccount(key);
  return account ? (account.scratchUpgrades || {}) : {};
}

function updateScratchUpgrades(key, upgrades) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!upgrades || typeof upgrades !== 'object' || Array.isArray(upgrades)) return null;
  var safe = {};
  var keys = Object.keys(upgrades);
  for (var i = 0; i < Math.min(keys.length, 50); i++) {
    var k = keys[i];
    if (typeof k === 'string' && /^[a-zA-Z0-9_]+$/.test(k) && typeof upgrades[k] === 'number') {
      safe[k] = Math.max(0, Math.floor(upgrades[k]));
    }
  }
  account.scratchUpgrades = safe;
  saveAccount(account);
  return safe;
}

// ─── Friends system ───

const MAX_FRIENDS = 100;
const MAX_FRIEND_REQUESTS = 50;
const MAX_BLOCKED = 200;

function _ensureFriendsData(account) {
  if (!account.friends) account.friends = [];
  if (!account.friendRequests) account.friendRequests = { incoming: [], outgoing: [] };
  if (!account.blocked) account.blocked = [];
}

// Compare a stored key (which may be a SHA-256 hash placeholder after restart)
// against a real key. Returns true if they match directly or via hash.
function _keyMatches(storedKey, realKey) {
  if (storedKey === realKey) return true;
  // If storedKey is a 64-char hex hash, compare against hash of realKey
  if (storedKey && storedKey.length === 64 && /^[a-f0-9]{64}$/.test(storedKey)) {
    return storedKey === _keyHash(realKey);
  }
  return false;
}

// Clean up stale hash entries: replace hash placeholders with real keys in friend data.
// Called after acceptFriendRequest/sendFriendRequest to fix hash-based entries.
function _resolveHashEntries(account, realKey) {
  var hash = _keyHash(realKey);
  if (account.friends) {
    for (var i = 0; i < account.friends.length; i++) {
      if (account.friends[i].key === hash) account.friends[i].key = realKey;
    }
  }
  if (account.friendRequests) {
    if (account.friendRequests.incoming) {
      for (var j = 0; j < account.friendRequests.incoming.length; j++) {
        if (account.friendRequests.incoming[j].fromKey === hash) account.friendRequests.incoming[j].fromKey = realKey;
      }
    }
    if (account.friendRequests.outgoing) {
      for (var k = 0; k < account.friendRequests.outgoing.length; k++) {
        if (account.friendRequests.outgoing[k].toKey === hash) account.friendRequests.outgoing[k].toKey = realKey;
      }
    }
  }
  if (account.blocked) {
    for (var b = 0; b < account.blocked.length; b++) {
      if (account.blocked[b] === hash) account.blocked[b] = realKey;
    }
  }
}

function sendFriendRequest(fromKey, toKey) {
  if (fromKey === toKey) return { error: 'Cannot friend yourself' };

  const fromAcc = loadAccount(fromKey);
  const toAcc = loadAccount(toKey);
  if (!fromAcc || !toAcc) return { error: 'Account not found' };
  if (fromAcc.temp || toAcc.temp) return { error: 'Permanent account required' };

  _ensureFriendsData(fromAcc);
  _ensureFriendsData(toAcc);

  // Resolve any hash placeholders now that we have both real keys
  _resolveHashEntries(fromAcc, toKey);
  _resolveHashEntries(toAcc, fromKey);

  // Check blocks (bidirectional)
  if (fromAcc.blocked.some(function(b) { return _keyMatches(b, toKey); })) return { error: 'User is blocked' };
  if (toAcc.blocked.some(function(b) { return _keyMatches(b, fromKey); })) return { error: 'Cannot send request' };

  // Already friends?
  if (fromAcc.friends.some(function(f) { return _keyMatches(f.key, toKey); })) return { error: 'Already friends' };

  // Already pending?
  if (fromAcc.friendRequests.outgoing.some(function(r) { return _keyMatches(r.toKey, toKey); })) return { error: 'Request already sent' };

  // Check limits
  if (fromAcc.friends.length >= MAX_FRIENDS) return { error: 'Your friend list is full' };
  if (fromAcc.friendRequests.outgoing.length >= MAX_FRIEND_REQUESTS) return { error: 'Too many pending requests' };

  // If target already sent us a request, auto-accept
  if (toAcc.friendRequests.outgoing.some(function(r) { return _keyMatches(r.toKey, fromKey); })) {
    return acceptFriendRequest(fromKey, toKey);
  }

  // Add to sender's outgoing
  fromAcc.friendRequests.outgoing.push({ toKey: toKey, sentAt: Date.now() });
  saveAccount(fromAcc);

  // Add to receiver's incoming
  toAcc.friendRequests.incoming.push({ fromKey: fromKey, fromUsername: fromAcc.username, sentAt: Date.now() });
  saveAccount(toAcc);

  return { success: true };
}

function acceptFriendRequest(accepterKey, requesterKey) {
  var accepter = loadAccount(accepterKey);
  var requester = loadAccount(requesterKey);
  if (!accepter || !requester) return { error: 'Account not found' };

  _ensureFriendsData(accepter);
  _ensureFriendsData(requester);

  // Resolve hash placeholders now that we have both real keys
  _resolveHashEntries(accepter, requesterKey);
  _resolveHashEntries(requester, accepterKey);

  // Verify request exists (incoming on accepter or outgoing on requester)
  var hasIncoming = accepter.friendRequests.incoming.some(function(r) { return r.fromKey === requesterKey; });
  var hasOutgoing = requester.friendRequests.outgoing.some(function(r) { return r.toKey === accepterKey; });
  if (!hasIncoming && !hasOutgoing) return { error: 'No pending request' };

  // Check limits
  if (accepter.friends.length >= MAX_FRIENDS) return { error: 'Your friend list is full' };
  if (requester.friends.length >= MAX_FRIENDS) return { error: 'Their friend list is full' };

  var now = Date.now();
  // Add to both friends lists (prevent duplicates)
  if (!accepter.friends.some(function(f) { return f.key === requesterKey; })) {
    accepter.friends.push({ key: requesterKey, addedAt: now });
  }
  if (!requester.friends.some(function(f) { return f.key === accepterKey; })) {
    requester.friends.push({ key: accepterKey, addedAt: now });
  }

  // Remove from all pending requests (both directions)
  accepter.friendRequests.incoming = accepter.friendRequests.incoming.filter(function(r) { return r.fromKey !== requesterKey; });
  accepter.friendRequests.outgoing = accepter.friendRequests.outgoing.filter(function(r) { return r.toKey !== requesterKey; });
  requester.friendRequests.outgoing = requester.friendRequests.outgoing.filter(function(r) { return r.toKey !== accepterKey; });
  requester.friendRequests.incoming = requester.friendRequests.incoming.filter(function(r) { return r.fromKey !== accepterKey; });

  saveAccount(accepter);
  saveAccount(requester);

  return { success: true, accepterName: accepter.username, requesterName: requester.username };
}

function rejectFriendRequest(rejecterKey, requesterKey) {
  var rejecter = loadAccount(rejecterKey);
  if (!rejecter) return { error: 'Account not found' };

  _ensureFriendsData(rejecter);
  _resolveHashEntries(rejecter, requesterKey);
  rejecter.friendRequests.incoming = rejecter.friendRequests.incoming.filter(function(r) { return r.fromKey !== requesterKey; });
  saveAccount(rejecter);

  var requester = loadAccount(requesterKey);
  if (requester) {
    _ensureFriendsData(requester);
    _resolveHashEntries(requester, rejecterKey);
    requester.friendRequests.outgoing = requester.friendRequests.outgoing.filter(function(r) { return r.toKey !== rejecterKey; });
    saveAccount(requester);
  }

  return { success: true };
}

function removeFriend(removerKey, friendKey) {
  var remover = loadAccount(removerKey);
  if (!remover) return { error: 'Account not found' };

  _ensureFriendsData(remover);
  _resolveHashEntries(remover, friendKey);
  remover.friends = remover.friends.filter(function(f) { return f.key !== friendKey; });
  saveAccount(remover);

  var friend = loadAccount(friendKey);
  if (friend) {
    _ensureFriendsData(friend);
    _resolveHashEntries(friend, removerKey);
    friend.friends = friend.friends.filter(function(f) { return f.key !== removerKey; });
    saveAccount(friend);
  }

  return { success: true };
}

function blockUser(blockerKey, targetKey) {
  if (blockerKey === targetKey) return { error: 'Cannot block yourself' };
  var blocker = loadAccount(blockerKey);
  if (!blocker) return { error: 'Account not found' };

  _ensureFriendsData(blocker);
  _resolveHashEntries(blocker, targetKey);

  if (blocker.blocked.includes(targetKey)) return { error: 'Already blocked' };
  if (blocker.blocked.length >= MAX_BLOCKED) return { error: 'Block list full' };

  blocker.blocked.push(targetKey);

  // Remove from friends if they were friends
  blocker.friends = blocker.friends.filter(function(f) { return f.key !== targetKey; });
  // Cancel any pending requests
  blocker.friendRequests.incoming = blocker.friendRequests.incoming.filter(function(r) { return r.fromKey !== targetKey; });
  blocker.friendRequests.outgoing = blocker.friendRequests.outgoing.filter(function(r) { return r.toKey !== targetKey; });
  saveAccount(blocker);

  // Remove from the other side too
  var target = loadAccount(targetKey);
  if (target) {
    _ensureFriendsData(target);
    _resolveHashEntries(target, blockerKey);
    target.friends = target.friends.filter(function(f) { return f.key !== blockerKey; });
    target.friendRequests.incoming = target.friendRequests.incoming.filter(function(r) { return r.fromKey !== blockerKey; });
    target.friendRequests.outgoing = target.friendRequests.outgoing.filter(function(r) { return r.toKey !== blockerKey; });
    saveAccount(target);
  }

  return { success: true };
}

function unblockUser(blockerKey, targetKey) {
  var blocker = loadAccount(blockerKey);
  if (!blocker) return { error: 'Account not found' };

  _ensureFriendsData(blocker);
  blocker.blocked = blocker.blocked.filter(function(k) { return k !== targetKey; });
  saveAccount(blocker);

  return { success: true };
}

// Try to resolve a key that might be a hash placeholder back to a real key
function _tryResolveKey(keyOrHash) {
  if (!keyOrHash) return keyOrHash;
  // If it's a 64-char hex string, it's likely a hash — try keyHashMap
  if (keyOrHash.length === 64 && /^[a-f0-9]{64}$/.test(keyOrHash)) {
    return keyHashMap.has(keyOrHash) ? keyHashMap.get(keyOrHash) : keyOrHash;
  }
  return keyOrHash;
}

function getFriendsData(key) {
  var acc = loadAccount(key);
  if (!acc) return { friends: [], incoming: [], outgoing: [], blocked: [] };

  _ensureFriendsData(acc);

  // Resolve hash placeholders to real keys where possible (fixes "Unknown" after restart)
  var dirty = false;
  for (var fi = 0; fi < acc.friends.length; fi++) {
    var resolved = _tryResolveKey(acc.friends[fi].key);
    if (resolved !== acc.friends[fi].key) { acc.friends[fi].key = resolved; dirty = true; }
  }
  if (acc.friendRequests.incoming) {
    for (var ii = 0; ii < acc.friendRequests.incoming.length; ii++) {
      var rIn = _tryResolveKey(acc.friendRequests.incoming[ii].fromKey);
      if (rIn !== acc.friendRequests.incoming[ii].fromKey) { acc.friendRequests.incoming[ii].fromKey = rIn; dirty = true; }
    }
  }
  if (acc.friendRequests.outgoing) {
    for (var oi = 0; oi < acc.friendRequests.outgoing.length; oi++) {
      var rOut = _tryResolveKey(acc.friendRequests.outgoing[oi].toKey);
      if (rOut !== acc.friendRequests.outgoing[oi].toKey) { acc.friendRequests.outgoing[oi].toKey = rOut; dirty = true; }
    }
  }
  if (dirty) saveAccount(acc);

  var friends = acc.friends.map(function(f) {
    var profile = getPublicProfile(f.key);
    return {
      key: f.key,
      username: profile ? profile.username : 'Unknown',
      color: profile ? profile.color : '#999',
      chips: profile ? profile.chips : 0,
      addedAt: f.addedAt,
      online: false, // caller fills this in via socketAccountMap
    };
  });

  var incoming = acc.friendRequests.incoming.map(function(r) {
    var profile = getPublicProfile(r.fromKey);
    return {
      key: r.fromKey,
      username: profile ? profile.username : r.fromUsername || 'Unknown',
      color: profile ? profile.color : '#999',
      sentAt: r.sentAt,
    };
  });

  var outgoing = acc.friendRequests.outgoing.map(function(r) {
    var profile = getPublicProfile(r.toKey);
    return {
      key: r.toKey,
      username: profile ? profile.username : 'Unknown',
      color: profile ? profile.color : '#999',
      sentAt: r.sentAt,
    };
  });

  return { friends: friends, incoming: incoming, outgoing: outgoing, blocked: acc.blocked || [] };
}

// ─── E2E Encrypted Direct Messages ───

const MAX_DM_CONVERSATIONS = 50;
const MAX_DM_MESSAGES = 100;

function _ensureDMData(account) {
  if (!account.dms) account.dms = { conversations: {} };
  if (!account.dms.conversations) account.dms.conversations = {};
}

function setPublicKey(key, publicKeyBase64, version) {
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  if (account.temp) return { error: 'Permanent account required' };
  if (typeof publicKeyBase64 !== 'string' || publicKeyBase64.length < 20 || publicKeyBase64.length > 500) {
    return { error: 'Invalid public key' };
  }

  // Migrate legacy e2ePublicKey to new e2eKeys format if needed
  if (!account.e2eKeys && account.e2ePublicKey) {
    account.e2eKeys = {
      current: {
        key: account.e2ePublicKey,
        version: 0,
        created: account.lastSeen || Date.now()
      },
      previous: null
    };
    delete account.e2ePublicKey;
  }

  // Initialize e2eKeys if this is the first key ever set
  if (!account.e2eKeys) {
    var newVersion = (typeof version === 'number' && version > 0) ? version : 1;
    account.e2eKeys = {
      current: {
        key: publicKeyBase64,
        version: newVersion,
        created: Date.now()
      },
      previous: null
    };
    saveAccount(account);
    return { success: true, version: newVersion };
  }

  // Rotate: current becomes previous, new key becomes current
  var nextVersion = (typeof version === 'number' && version > 0)
    ? version
    : (account.e2eKeys.current ? account.e2eKeys.current.version + 1 : 1);

  // Don't rotate if the key is identical to the current one (re-registration on reconnect)
  if (account.e2eKeys.current && account.e2eKeys.current.key === publicKeyBase64) {
    saveAccount(account);
    return { success: true, version: account.e2eKeys.current.version };
  }

  account.e2eKeys.previous = account.e2eKeys.current ? {
    key: account.e2eKeys.current.key,
    version: account.e2eKeys.current.version,
    created: account.e2eKeys.current.created
  } : null;

  account.e2eKeys.current = {
    key: publicKeyBase64,
    version: nextVersion,
    created: Date.now()
  };

  // Clean up legacy field if it still exists
  if (account.e2ePublicKey) delete account.e2ePublicKey;

  saveAccount(account);
  return { success: true, version: nextVersion };
}

function getPublicKeyE2E(key) {
  var account = loadAccount(key);
  if (!account) return null;

  // New versioned format
  if (account.e2eKeys && account.e2eKeys.current) {
    var result = {
      key: account.e2eKeys.current.key,
      version: account.e2eKeys.current.version,
      previousKey: null,
      previousVersion: null
    };
    if (account.e2eKeys.previous) {
      result.previousKey = account.e2eKeys.previous.key;
      result.previousVersion = account.e2eKeys.previous.version;
    }
    return result;
  }

  // Legacy fallback: old e2ePublicKey field
  if (account.e2ePublicKey) {
    return {
      key: account.e2ePublicKey,
      version: 0,
      previousKey: null,
      previousVersion: null
    };
  }

  return null;
}

function storeDM(fromKey, toKey, messageObj) {
  var fromAcc = loadAccount(fromKey);
  var toAcc = loadAccount(toKey);
  if (!fromAcc || !toAcc) return { error: 'Account not found' };
  if (fromAcc.temp || toAcc.temp) return { error: 'Permanent account required' };

  _ensureDMData(fromAcc);
  _ensureDMData(toAcc);

  // Store on sender's account
  var fromConvos = fromAcc.dms.conversations;
  if (!fromConvos[toKey]) {
    var fromConvoKeys = Object.keys(fromConvos);
    if (fromConvoKeys.length >= MAX_DM_CONVERSATIONS) {
      var oldest = null;
      var oldestTime = Infinity;
      for (var i = 0; i < fromConvoKeys.length; i++) {
        var la = fromConvos[fromConvoKeys[i]].lastActivity || 0;
        if (la < oldestTime) { oldestTime = la; oldest = fromConvoKeys[i]; }
      }
      if (oldest) delete fromConvos[oldest];
    }
    fromConvos[toKey] = { messages: [], lastActivity: 0 };
  }
  fromConvos[toKey].messages.push(messageObj);
  if (fromConvos[toKey].messages.length > MAX_DM_MESSAGES) {
    fromConvos[toKey].messages = fromConvos[toKey].messages.slice(-MAX_DM_MESSAGES);
  }
  fromConvos[toKey].lastActivity = messageObj.timestamp || Date.now();
  saveAccount(fromAcc);

  // Store on recipient's account
  var toConvos = toAcc.dms.conversations;
  if (!toConvos[fromKey]) {
    var toConvoKeys = Object.keys(toConvos);
    if (toConvoKeys.length >= MAX_DM_CONVERSATIONS) {
      var oldestTo = null;
      var oldestTimeTo = Infinity;
      for (var j = 0; j < toConvoKeys.length; j++) {
        var laTo = toConvos[toConvoKeys[j]].lastActivity || 0;
        if (laTo < oldestTimeTo) { oldestTimeTo = laTo; oldestTo = toConvoKeys[j]; }
      }
      if (oldestTo) delete toConvos[oldestTo];
    }
    toConvos[fromKey] = { messages: [], lastActivity: 0 };
  }
  toConvos[fromKey].messages.push(messageObj);
  if (toConvos[fromKey].messages.length > MAX_DM_MESSAGES) {
    toConvos[fromKey].messages = toConvos[fromKey].messages.slice(-MAX_DM_MESSAGES);
  }
  toConvos[fromKey].lastActivity = messageObj.timestamp || Date.now();
  saveAccount(toAcc);

  return { success: true };
}

function getDMHistory(key, otherKey, limit) {
  var account = loadAccount(key);
  if (!account) return [];
  _ensureDMData(account);
  var convo = account.dms.conversations[otherKey];
  if (!convo || !convo.messages) return [];
  var lim = (typeof limit === 'number' && limit > 0) ? Math.min(limit, MAX_DM_MESSAGES) : 50;
  return convo.messages.slice(-lim);
}

function getDMConversations(key) {
  var account = loadAccount(key);
  if (!account) return [];
  _ensureDMData(account);
  var convos = account.dms.conversations;
  var keys = Object.keys(convos);
  var result = [];
  for (var i = 0; i < keys.length; i++) {
    var otherKey = keys[i];
    var convo = convos[otherKey];
    result.push({
      key: otherKey,
      lastActivity: convo.lastActivity || 0,
      messageCount: convo.messages ? convo.messages.length : 0,
    });
  }
  result.sort(function(a, b) { return b.lastActivity - a.lastActivity; });
  return result;
}

// ─── Delete a specific DM message by ID ───
function deleteDMMessage(myKey, otherKey, messageId) {
  if (!myKey || !otherKey || !messageId) return false;
  var account = loadAccount(myKey);
  if (!account) return false;
  _ensureDMData(account);
  var convo = account.dms.conversations[otherKey];
  if (!convo || !convo.messages || convo.messages.length === 0) return false;
  var originalLen = convo.messages.length;
  convo.messages = convo.messages.filter(function(m) { return m.id !== messageId; });
  if (convo.messages.length === originalLen) return false; // message not found
  // If conversation is now empty, remove it entirely
  if (convo.messages.length === 0) {
    delete account.dms.conversations[otherKey];
  }
  saveAccount(account);
  return true;
}

// ─── Clear all DMs for an account ───
function clearDMs(key) {
  var account = loadAccount(key);
  if (!account) return;
  if (account.dms) {
    account.dms = { conversations: {} };
    saveAccount(account);
  }
}

// ─── Clear DMs for ALL accounts (used during daily wipe) ───
function clearAllDMs() {
  // Clear from cache
  for (var [key, account] of accountCache) {
    if (account && account.dms && !account.temp) {
      account.dms = { conversations: {} };
      _queueWrite(account);
    }
  }
  // Also scan disk for accounts not in cache
  try {
    var files = fs.readdirSync(ACCOUNTS_DIR);
    for (var i = 0; i < files.length; i++) {
      if (!files[i].endsWith('.json')) continue;
      var fp = path.join(ACCOUNTS_DIR, files[i]);
      try {
        var buf = fs.readFileSync(fp);
        var acc;
        try {
          var decrypted = _decryptData(buf);
          if (decrypted) acc = JSON.parse(decrypted);
        } catch (_) {}
        if (!acc) {
          try { acc = JSON.parse(buf.toString('utf8')); } catch (_) {}
        }
        if (acc && acc.dms && Object.keys(acc.dms.conversations || {}).length > 0) {
          acc.dms = { conversations: {} };
          // Write scrubbed version for accounts not in cache
          var accKey = acc.key || (acc.keyHash && keyHashMap.has(acc.keyHash) ? keyHashMap.get(acc.keyHash) : null);
          if (!accKey || !accountCache.has(accKey)) {
            var scrubbed = acc.key ? _scrubForDisk(acc) : acc; // already scrubbed if no raw key
            var jsonStr = JSON.stringify(scrubbed);
            var encrypted = _encryptData(jsonStr);
            fs.writeFileSync(fp, encrypted);
          }
        }
      } catch (_) { continue; }
    }
  } catch (_) {}
  console.log('[accounts] All DM conversations cleared');
}

// Cleanup expired accounts (async, non-blocking)
function cleanupExpiredAccounts() {
  fs.promises.readdir(ACCOUNTS_DIR).then(files => {
    files = files.filter(f => f.endsWith('.json'));
    let cleaned = 0;
    return Promise.all(files.map(file => {
      const fp = path.join(ACCOUNTS_DIR, file);
      return fs.promises.readFile(fp).then(buf => {
        var acc;
        try {
          var decrypted = _decryptData(buf);
          if (decrypted) acc = JSON.parse(decrypted);
        } catch (_) {}
        if (!acc) {
          try { acc = JSON.parse(buf.toString('utf8')); } catch (_) {}
        }
        if (acc && isAccountExpired(acc)) {
          // Handle both legacy (raw key) and new (keyHash) formats
          if (acc.key) accountCache.delete(acc.key);
          if (acc.keyHash) {
            var resolvedKey = keyHashMap.get(acc.keyHash);
            if (resolvedKey) accountCache.delete(resolvedKey);
            keyHashMap.delete(acc.keyHash);
          }
          cleaned++;
          return fs.promises.unlink(fp).catch(() => {});
        }
      }).catch(() => { /* skip corrupt files */ });
    })).then(() => {
      if (cleaned > 0) console.log('[accounts] Cleaned up ' + cleaned + ' expired accounts');
      return cleaned;
    });
  }).catch(err => {
    console.error('[accounts] Cleanup error:', err.message);
  });
  return 0;
}

// ─── Background re-encryption: migrate files from old key versions to current ───
var _reencryptRunning = false;
function reencryptAccounts() {
  if (_reencryptRunning) return;
  if (ENCRYPTION_KEYS.length <= 1 && CURRENT_VERSION === 0) return; // nothing to rotate
  _reencryptRunning = true;
  var migrated = 0;
  fs.promises.readdir(ACCOUNTS_DIR).then(function(files) {
    files = files.filter(function(f) { return f.endsWith('.json'); });
    return files.reduce(function(chain, file) {
      return chain.then(function() {
        var fp = path.join(ACCOUNTS_DIR, file);
        return fs.promises.readFile(fp).then(function(buf) {
          // If current version > 0, check if file already has current version prefix
          if (CURRENT_VERSION > 0 && buf.length >= 30 && buf[0] === CURRENT_VERSION) {
            return; // already current
          }
          var plaintext = _decryptData(buf);
          if (!plaintext) return; // corrupt or undecryptable — skip
          var reencrypted = _encryptData(plaintext);
          return fs.promises.writeFile(fp, reencrypted).then(function() { migrated++; });
        }).catch(function() { /* skip errors */ });
      });
    }, Promise.resolve());
  }).then(function() {
    if (migrated > 0) console.log('[accounts] Re-encrypted ' + migrated + ' account files to key version ' + CURRENT_VERSION);
  }).catch(function(err) {
    console.error('[accounts] Re-encryption error:', err.message);
  }).finally(function() {
    _reencryptRunning = false;
  });
}

// ─── MMO Resource Inventory ───

// Per-account resource lock to prevent TOCTOU races (same pattern as _chipLocks)
const _resourceLocks = new Map();

function _acquireResourceLock(key) {
  var entry = _resourceLocks.get(key);
  if (!entry) {
    entry = { depth: 0 };
    _resourceLocks.set(key, entry);
  }
  entry.depth++;
  return function release() {
    entry.depth--;
    if (entry.depth <= 0) {
      _resourceLocks.delete(key);
    }
  };
}

function addResource(key, resourceType, amount) {
  if (rpgData.ALL_RESOURCE_TYPES.indexOf(resourceType) === -1) return null;
  if (typeof amount !== 'number' || amount <= 0) return null;
  var release = _acquireResourceLock(key);
  try {
    const account = loadAccount(key);
    if (!account) return null;
    if (!account.mmoInventory) account.mmoInventory = { wood: 0, stone: 0, iron_ore: 0, iron_bar: 0, items: [] };
    account.mmoInventory[resourceType] = (account.mmoInventory[resourceType] || 0) + amount;
    saveAccount(account);
    return account.mmoInventory;
  } finally {
    release();
  }
}

function removeResource(key, resourceType, amount) {
  if (rpgData.ALL_RESOURCE_TYPES.indexOf(resourceType) === -1) return null;
  if (typeof amount !== 'number' || amount <= 0) return null;
  var release = _acquireResourceLock(key);
  try {
    const account = loadAccount(key);
    if (!account) return null;
    if (!account.mmoInventory) return null;
    var current = account.mmoInventory[resourceType] || 0;
    if (current < amount) return null; // not enough
    account.mmoInventory[resourceType] = current - amount;
    saveAccount(account);
    return account.mmoInventory;
  } finally {
    release();
  }
}

function getMMOInventory(key) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.mmoInventory) return { wood: 0, stone: 0, iron_ore: 0, iron_bar: 0, items: [] };
  return account.mmoInventory;
}

function addMMOItem(key, item) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.mmoInventory) account.mmoInventory = { wood: 0, stone: 0, iron_ore: 0, iron_bar: 0, items: [] };
  if (!account.mmoInventory.items) account.mmoInventory.items = [];
  if (account.mmoInventory.items.length >= 100) return { error: 'Inventory full' };
  account.mmoInventory.items.push(item);
  saveAccount(account);
  return account.mmoInventory;
}

function removeMMOItem(key, itemId) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.mmoInventory || !account.mmoInventory.items) return null;
  var idx = account.mmoInventory.items.findIndex(function(i) { return i.id === itemId; });
  if (idx === -1) return null;
  var removed = account.mmoInventory.items.splice(idx, 1)[0];
  saveAccount(account);
  return removed;
}

// Valid equipment slots: tools (axe, pickaxe) + combat gear (main_hand, off_hand, head, chest, undershirt, arms, hands, legs, feet, ring1-6, necklace)
var EQUIPMENT_SLOTS = ['axe', 'pickaxe', 'main_hand', 'off_hand', 'head', 'chest', 'undershirt', 'arms', 'hands', 'legs', 'feet', 'ring1', 'ring2', 'ring3', 'ring4', 'ring5', 'ring6', 'necklace'];

// Valid tool types for axe/pickaxe equipment slots (all tiers)
var VALID_AXES = { iron_axe:1, copper_axe:1, bronze_axe:1, steel_axe:1, mithril_axe:1 };
var VALID_PICKAXES = { iron_pickaxe:1, copper_pickaxe:1, bronze_pickaxe:1, steel_pickaxe:1, mithril_pickaxe:1 };

// Combat skill required for each weapon category
var COMBAT_SKILL_FOR_CATEGORY = {
  melee_blade: 'melee',
  melee_blunt: 'melee',
  archery:     'archery',
  magic:       'magic',
};

// Combat skill level required by rarity tier (higher tier = higher skill needed)
var RARITY_COMBAT_LEVEL = {
  common:     0,   // wooden/copper — anyone can equip
  uncommon:   3,   // bronze/iron
  rare:       8,   // silver/gold
  ultra_rare: 14,  // mithril
};

// Weapon types and which slot they go in
var WEAPON_TYPES = {
  // ===== STARTER WOODEN WEAPONS (no skill requirement) =====
  wooden_sword:  { slot: 'weapon', category: 'melee_blade', damage: 2, speed: 1.0, handedness: '1h', name: 'Wooden Sword',  rarity: 'common', icon: 'weapons/Sword_0.PNG' },
  wooden_dagger: { slot: 'weapon', category: 'melee_blade', damage: 1, speed: 1.4, critBonus: 0.02, handedness: '1h', name: 'Wooden Dagger', rarity: 'common', icon: 'weapons/Dagger_02.PNG' },
  wooden_mace:   { slot: 'weapon', category: 'melee_blunt', damage: 2, speed: 0.9, handedness: '1h', name: 'Wooden Mace',   rarity: 'common', icon: 'weapons/Hammer_02.PNG' },
  wooden_spear:  { slot: 'weapon', category: 'melee_blade', damage: 3, speed: 1.0, range: 2, handedness: '2h', name: 'Wooden Spear', rarity: 'common', icon: 'weapons/Spear_02.PNG' },

  // ===== SWORDS (melee_blade, balanced damage/speed) =====
  copper_sword:   { slot: 'weapon', category: 'melee_blade', damage: 4,  speed: 1.0, handedness: '1h', name: 'Copper Sword',   rarity: 'common',    icon: 'weapons/Sword_01.PNG' },
  bronze_sword:   { slot: 'weapon', category: 'melee_blade', damage: 6,  speed: 1.0, handedness: '1h', name: 'Bronze Sword',   rarity: 'common',    icon: 'weapons/Sword_10.PNG' },
  iron_sword:     { slot: 'weapon', category: 'melee_blade', damage: 8,  speed: 1.0, handedness: '1h', name: 'Iron Sword',     rarity: 'uncommon',  icon: 'weapons/Sword_05.PNG' },
  steel_sword:    { slot: 'weapon', category: 'melee_blade', damage: 12, speed: 1.0, handedness: '1h', name: 'Steel Sword',    rarity: 'uncommon',  icon: 'weapons/Sword_15.PNG' },
  silver_sword:   { slot: 'weapon', category: 'melee_blade', damage: 14, speed: 1.05, handedness: '1h', name: 'Silver Sword',  rarity: 'rare',      icon: 'weapons/Sword_30.PNG' },
  gold_sword:     { slot: 'weapon', category: 'melee_blade', damage: 16, speed: 1.0, handedness: '1h', name: 'Gold Sword',     rarity: 'rare',      icon: 'weapons/Sword_40.PNG' },
  mithril_sword:  { slot: 'weapon', category: 'melee_blade', damage: 22, speed: 1.1, handedness: '1h', name: 'Mithril Sword',  rarity: 'ultra_rare', icon: 'weapons/Sword_25.PNG' },

  // ===== BATTLE AXES (melee_blade, high damage, slow) =====
  copper_axe_weapon:  { slot: 'weapon', category: 'melee_blade', damage: 5,  speed: 0.8, handedness: '2h', name: 'Copper Battle Axe',  rarity: 'common',    icon: 'weapons/Axe_01.PNG' },
  bronze_axe_weapon:  { slot: 'weapon', category: 'melee_blade', damage: 8,  speed: 0.8, handedness: '2h', name: 'Bronze Battle Axe',  rarity: 'common',    icon: 'weapons/Axe_05.PNG' },
  iron_axe_weapon:    { slot: 'weapon', category: 'melee_blade', damage: 10, speed: 0.8, handedness: '2h', name: 'Iron Battle Axe',    rarity: 'uncommon',  icon: 'weapons/Axe_10.PNG' },
  steel_axe_weapon:   { slot: 'weapon', category: 'melee_blade', damage: 14, speed: 0.8, handedness: '2h', name: 'Steel Battle Axe',   rarity: 'uncommon',  icon: 'weapons/Axe_15.PNG' },
  silver_axe_weapon:  { slot: 'weapon', category: 'melee_blade', damage: 17, speed: 0.85, handedness: '2h', name: 'Silver Battle Axe', rarity: 'rare',      icon: 'weapons/Axe_20.PNG' },
  gold_axe_weapon:    { slot: 'weapon', category: 'melee_blade', damage: 20, speed: 0.8, handedness: '2h', name: 'Gold Battle Axe',    rarity: 'rare',      icon: 'weapons/Axe_30.PNG' },
  mithril_axe_weapon: { slot: 'weapon', category: 'melee_blade', damage: 28, speed: 0.9, handedness: '2h', name: 'Mithril Battle Axe', rarity: 'ultra_rare', icon: 'weapons/Axe_40.PNG' },

  // ===== MACES/HAMMERS (melee_blunt, good vs armor) =====
  copper_mace:   { slot: 'weapon', category: 'melee_blunt', damage: 4,  speed: 0.9, handedness: '1h', name: 'Copper Mace',   rarity: 'common',    icon: 'weapons/Hammer_01.PNG' },
  bronze_mace:   { slot: 'weapon', category: 'melee_blunt', damage: 7,  speed: 0.9, handedness: '1h', name: 'Bronze Mace',   rarity: 'common',    icon: 'weapons/Hammer_05.PNG' },
  iron_mace:     { slot: 'weapon', category: 'melee_blunt', damage: 9,  speed: 0.9, handedness: '1h', name: 'Iron Mace',     rarity: 'uncommon',  icon: 'weapons/Hammer_10.PNG' },
  steel_mace:    { slot: 'weapon', category: 'melee_blunt', damage: 13, speed: 0.9, handedness: '1h', name: 'Steel Mace',    rarity: 'uncommon',  icon: 'weapons/Hammer_15.PNG' },
  silver_mace:   { slot: 'weapon', category: 'melee_blunt', damage: 15, speed: 0.9, handedness: '1h', name: 'Silver Mace',   rarity: 'rare',      icon: 'weapons/Hammer_20.PNG' },
  gold_mace:     { slot: 'weapon', category: 'melee_blunt', damage: 18, speed: 0.9, handedness: '1h', name: 'Gold Mace',     rarity: 'rare',      icon: 'weapons/Hammer_30.PNG' },
  mithril_mace:  { slot: 'weapon', category: 'melee_blunt', damage: 24, speed: 0.95, handedness: '1h', name: 'Mithril Mace', rarity: 'ultra_rare', icon: 'weapons/Hammer_45.PNG' },

  // ===== DAGGERS (melee_blade, fast, crit bonus) =====
  copper_dagger:  { slot: 'weapon', category: 'melee_blade', damage: 2,  speed: 1.4, critBonus: 0.03, handedness: '1h', name: 'Copper Dagger',  rarity: 'common',    icon: 'weapons/Dagger_01.PNG' },
  bronze_dagger:  { slot: 'weapon', category: 'melee_blade', damage: 3,  speed: 1.4, critBonus: 0.04, handedness: '1h', name: 'Bronze Dagger',  rarity: 'common',    icon: 'weapons/Dagger_05.PNG' },
  iron_dagger:    { slot: 'weapon', category: 'melee_blade', damage: 5,  speed: 1.4, critBonus: 0.05, handedness: '1h', name: 'Iron Dagger',    rarity: 'uncommon',  icon: 'weapons/Dagger_10.PNG' },
  steel_dagger:   { slot: 'weapon', category: 'melee_blade', damage: 7,  speed: 1.4, critBonus: 0.06, handedness: '1h', name: 'Steel Dagger',   rarity: 'uncommon',  icon: 'weapons/Dagger_15.PNG' },
  silver_dagger:  { slot: 'weapon', category: 'melee_blade', damage: 9,  speed: 1.5, critBonus: 0.08, handedness: '1h', name: 'Silver Dagger',  rarity: 'rare',      icon: 'weapons/Dagger_30.PNG' },
  gold_dagger:    { slot: 'weapon', category: 'melee_blade', damage: 11, speed: 1.4, critBonus: 0.08, handedness: '1h', name: 'Gold Dagger',    rarity: 'rare',      icon: 'weapons/Dagger_40.PNG' },
  mithril_dagger: { slot: 'weapon', category: 'melee_blade', damage: 15, speed: 1.5, critBonus: 0.10, handedness: '1h', name: 'Mithril Dagger', rarity: 'ultra_rare', icon: 'weapons/Dagger_45.PNG' },

  // ===== SPEARS (melee_blade, range 2, moderate damage) =====
  copper_spear:  { slot: 'weapon', category: 'melee_blade', damage: 5,  speed: 1.0, range: 2, handedness: '2h', name: 'Copper Spear',  rarity: 'common',    icon: 'weapons/Spear_01.PNG' },
  bronze_spear:  { slot: 'weapon', category: 'melee_blade', damage: 7,  speed: 1.0, range: 2, handedness: '2h', name: 'Bronze Spear',  rarity: 'common',    icon: 'weapons/Spear_05.PNG' },
  iron_spear:    { slot: 'weapon', category: 'melee_blade', damage: 9,  speed: 1.0, range: 2, handedness: '2h', name: 'Iron Spear',    rarity: 'uncommon',  icon: 'weapons/Spear_10.PNG' },
  steel_spear:   { slot: 'weapon', category: 'melee_blade', damage: 13, speed: 1.0, range: 2, handedness: '2h', name: 'Steel Spear',   rarity: 'uncommon',  icon: 'weapons/Spear_15.PNG' },
  silver_spear:  { slot: 'weapon', category: 'melee_blade', damage: 15, speed: 1.05, range: 2, handedness: '2h', name: 'Silver Spear', rarity: 'rare',      icon: 'weapons/Spear_20.PNG' },
  gold_spear:    { slot: 'weapon', category: 'melee_blade', damage: 18, speed: 1.0, range: 2, handedness: '2h', name: 'Gold Spear',    rarity: 'rare',      icon: 'weapons/Spear_30.PNG' },
  mithril_spear: { slot: 'weapon', category: 'melee_blade', damage: 24, speed: 1.1, range: 2, handedness: '2h', name: 'Mithril Spear', rarity: 'ultra_rare', icon: 'weapons/Spear_35.PNG' },

  // ===== BOWS (archery, ranged) =====
  wooden_bow:    { slot: 'weapon', category: 'archery', damage: 7,  speed: 1.1, range: 4, handedness: '2h', name: 'Wooden Bow',    rarity: 'common',    icon: 'weapons/Bow_01.PNG' },
  copper_bow:    { slot: 'weapon', category: 'archery', damage: 9,  speed: 1.1, range: 4, handedness: '2h', name: 'Copper Bow',    rarity: 'common',    icon: 'weapons/Bow_05.PNG' },
  bronze_bow:    { slot: 'weapon', category: 'archery', damage: 11, speed: 1.1, range: 4, handedness: '2h', name: 'Bronze Bow',    rarity: 'uncommon',  icon: 'weapons/Bow_10.PNG' },
  iron_bow:      { slot: 'weapon', category: 'archery', damage: 13, speed: 1.1, range: 4, handedness: '2h', name: 'Iron Bow',      rarity: 'uncommon',  icon: 'weapons/Bow_15.PNG' },
  steel_bow:     { slot: 'weapon', category: 'archery', damage: 16, speed: 1.1, range: 5, handedness: '2h', name: 'Steel Bow',     rarity: 'rare',      icon: 'weapons/Bow_20.PNG' },
  silver_bow:    { slot: 'weapon', category: 'archery', damage: 18, speed: 1.15, range: 5, handedness: '2h', name: 'Silver Bow',   rarity: 'rare',      icon: 'weapons/Bow_25.PNG' },
  gold_bow:      { slot: 'weapon', category: 'archery', damage: 20, speed: 1.1, range: 5, handedness: '2h', name: 'Gold Bow',      rarity: 'rare',      icon: 'weapons/Bow_30.PNG' },
  mithril_bow:   { slot: 'weapon', category: 'archery', damage: 26, speed: 1.2, range: 6, handedness: '2h', name: 'Mithril Bow',   rarity: 'ultra_rare', icon: 'weapons/Bow_35.PNG' },

  // ===== CROSSBOWS (archery, slow but high damage) =====
  iron_crossbow:    { slot: 'weapon', category: 'archery', damage: 16, speed: 0.7, range: 5, handedness: '2h', name: 'Iron Crossbow',    rarity: 'uncommon',  icon: 'weapons/Crossbow_01.PNG' },
  steel_crossbow:   { slot: 'weapon', category: 'archery', damage: 22, speed: 0.7, range: 5, handedness: '2h', name: 'Steel Crossbow',   rarity: 'rare',      icon: 'weapons/Crossbow_05.PNG' },
  mithril_crossbow: { slot: 'weapon', category: 'archery', damage: 30, speed: 0.75, range: 6, handedness: '2h', name: 'Mithril Crossbow', rarity: 'ultra_rare', icon: 'weapons/Crossbow_10.PNG' },

  // ===== STAFFS (magic, magicDamage focus) =====
  wooden_staff:   { slot: 'weapon', category: 'magic', damage: 4,  speed: 1.0, magicDamage: 12, handedness: '2h', name: 'Wooden Staff',   rarity: 'common',    icon: 'weapons/staff_1.PNG' },
  copper_staff:   { slot: 'weapon', category: 'magic', damage: 5,  speed: 1.0, magicDamage: 16, handedness: '2h', name: 'Copper Staff',   rarity: 'common',    icon: 'weapons/Staff_05.PNG' },
  bronze_staff:   { slot: 'weapon', category: 'magic', damage: 6,  speed: 1.0, magicDamage: 20, handedness: '2h', name: 'Bronze Staff',   rarity: 'uncommon',  icon: 'weapons/Staff_10.PNG' },
  iron_staff:     { slot: 'weapon', category: 'magic', damage: 7,  speed: 1.0, magicDamage: 24, handedness: '2h', name: 'Iron Staff',     rarity: 'uncommon',  icon: 'weapons/Staff_15.PNG' },
  silver_staff:   { slot: 'weapon', category: 'magic', damage: 8,  speed: 1.05, magicDamage: 30, handedness: '2h', name: 'Silver Staff',  rarity: 'rare',      icon: 'weapons/Staff_25.PNG' },
  gold_staff:     { slot: 'weapon', category: 'magic', damage: 10, speed: 1.0, magicDamage: 36, handedness: '2h', name: 'Gold Staff',     rarity: 'rare',      icon: 'weapons/Staff_30.PNG' },
  mithril_staff:  { slot: 'weapon', category: 'magic', damage: 12, speed: 1.1, magicDamage: 48, handedness: '2h', name: 'Mithril Staff',  rarity: 'ultra_rare', icon: 'weapons/Staff_45.PNG' },

  // ===== WANDS (magic, fast cast, moderate power) =====
  wooden_wand:    { slot: 'weapon', category: 'magic', damage: 2,  speed: 1.2, magicDamage: 8,  handedness: '1h', name: 'Wooden Wand',    rarity: 'common',    icon: 'weapons/Wand.PNG' },
  copper_wand:    { slot: 'weapon', category: 'magic', damage: 3,  speed: 1.2, magicDamage: 11, handedness: '1h', name: 'Copper Wand',    rarity: 'common',    icon: 'weapons/Staff_02.PNG' },
  iron_wand:      { slot: 'weapon', category: 'magic', damage: 4,  speed: 1.2, magicDamage: 16, handedness: '1h', name: 'Iron Wand',      rarity: 'uncommon',  icon: 'weapons/Staff_08.PNG' },
  silver_wand:    { slot: 'weapon', category: 'magic', damage: 5,  speed: 1.25, magicDamage: 22, handedness: '1h', name: 'Silver Wand',   rarity: 'rare',      icon: 'weapons/Staff_20.PNG' },
  gold_wand:      { slot: 'weapon', category: 'magic', damage: 6,  speed: 1.2, magicDamage: 28, handedness: '1h', name: 'Gold Wand',      rarity: 'rare',      icon: 'weapons/Staff_35.PNG' },
  mithril_wand:   { slot: 'weapon', category: 'magic', damage: 8,  speed: 1.3, magicDamage: 36, handedness: '1h', name: 'Mithril Wand',   rarity: 'ultra_rare', icon: 'weapons/Staff_40.PNG' },

  // ===== SCYTHES (melee_blade, high damage, slow, crit) =====
  iron_scythe:    { slot: 'weapon', category: 'melee_blade', damage: 12, speed: 0.7, critBonus: 0.05, handedness: '2h', name: 'Iron Scythe',    rarity: 'uncommon',  icon: 'weapons/Scythe_01.PNG' },
  steel_scythe:   { slot: 'weapon', category: 'melee_blade', damage: 18, speed: 0.7, critBonus: 0.06, handedness: '2h', name: 'Steel Scythe',   rarity: 'rare',      icon: 'weapons/Scythe_03.PNG' },
  mithril_scythe: { slot: 'weapon', category: 'melee_blade', damage: 26, speed: 0.75, critBonus: 0.08, handedness: '2h', name: 'Mithril Scythe', rarity: 'ultra_rare', icon: 'weapons/Scythe_07.PNG' },

  // ===== SHIELDS =====
  wooden_shield:   { slot: 'shield', defense: 5,  blockChance: 0.15, name: 'Wooden Shield',   rarity: 'common',    icon: 'weapons/shield_01.PNG' },
  copper_shield:   { slot: 'shield', defense: 7,  blockChance: 0.17, name: 'Copper Shield',   rarity: 'common',    icon: 'weapons/shield_05.PNG' },
  bronze_shield:   { slot: 'shield', defense: 9,  blockChance: 0.18, name: 'Bronze Shield',   rarity: 'common',    icon: 'weapons/shield_10.PNG' },
  iron_shield:     { slot: 'shield', defense: 10, blockChance: 0.20, name: 'Iron Shield',     rarity: 'uncommon',  icon: 'weapons/shield_15.PNG' },
  steel_shield:    { slot: 'shield', defense: 14, blockChance: 0.22, name: 'Steel Shield',    rarity: 'uncommon',  icon: 'weapons/shield_20.PNG' },
  silver_shield:   { slot: 'shield', defense: 16, blockChance: 0.24, name: 'Silver Shield',   rarity: 'rare',      icon: 'weapons/shield_25.PNG' },
  gold_shield:     { slot: 'shield', defense: 18, blockChance: 0.25, name: 'Gold Shield',     rarity: 'rare',      icon: 'weapons/shield_30.PNG' },
  mithril_shield:  { slot: 'shield', defense: 24, blockChance: 0.28, name: 'Mithril Shield',  rarity: 'ultra_rare', icon: 'weapons/shield_40.PNG' },

  // ===== HELMETS =====
  leather_cap:     { slot: 'head', defense: 2,  armorType: 'leather', name: 'Leather Cap',     rarity: 'common',    icon: 'armor/LeatherHelmet.PNG' },
  copper_helm:     { slot: 'head', defense: 3,  armorType: 'chain', name: 'Copper Helm',     rarity: 'common',    icon: 'armor/BasicHelm.PNG' },
  bronze_helm:     { slot: 'head', defense: 4,  armorType: 'chain', name: 'Bronze Helm',     rarity: 'common',    icon: 'armor/BasicMailHelm.PNG' },
  iron_helm:       { slot: 'head', defense: 5,  armorType: 'plate', name: 'Iron Helm',       rarity: 'uncommon',  icon: 'armor/Helm_01_guard.PNG' },
  steel_helm:      { slot: 'head', defense: 7,  armorType: 'plate', name: 'Steel Helm',      rarity: 'uncommon',  icon: 'armor/Helm_07_footman.PNG' },
  silver_helm:     { slot: 'head', defense: 9,  armorType: 'plate', name: 'Silver Helm',     rarity: 'rare',      icon: 'armor/Helm_14_gold.PNG' },
  gold_helm:       { slot: 'head', defense: 11, armorType: 'plate', name: 'Gold Helm',       rarity: 'rare',      icon: 'armor/Helm_31_gold.PNG' },
  mithril_helm:    { slot: 'head', defense: 15, armorType: 'plate', name: 'Mithril Helm',    rarity: 'ultra_rare', icon: 'armor/KnightHelm3.PNG' },

  // ===== CHEST ARMOR =====
  leather_armor:   { slot: 'chest', defense: 4,  armorType: 'leather', name: 'Leather Armor',   rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  copper_armor:    { slot: 'chest', defense: 6,  armorType: 'chain', name: 'Copper Armor',    rarity: 'common',    icon: 'armor/Chest_07.PNG' },
  bronze_armor:    { slot: 'chest', defense: 8,  armorType: 'chain', name: 'Bronze Armor',    rarity: 'common',    icon: 'armor/Brigandine.PNG' },
  iron_armor:      { slot: 'chest', defense: 10, armorType: 'plate', speedPenalty: 0.05, name: 'Iron Armor',      rarity: 'uncommon',  icon: 'armor/Chest_14_milita.PNG' },
  steel_armor:     { slot: 'chest', defense: 14, armorType: 'plate', speedPenalty: 0.05, name: 'Steel Armor',     rarity: 'uncommon',  icon: 'armor/MailChest.PNG' },
  silver_armor:    { slot: 'chest', defense: 17, armorType: 'plate', speedPenalty: 0.03, name: 'Silver Armor',    rarity: 'rare',      icon: 'armor/PlateMailChest.PNG' },
  gold_armor:      { slot: 'chest', defense: 20, armorType: 'plate', speedPenalty: 0.05, name: 'Gold Armor',      rarity: 'rare',      icon: 'armor/KingsArmor.PNG' },
  mithril_armor:   { slot: 'chest', defense: 28, armorType: 'plate', speedPenalty: 0.02, name: 'Mithril Armor',   rarity: 'ultra_rare', icon: 'armor/KnightChest3.PNG' },

  // ===== NECKLACES =====
  amulet_vigor:     { slot: 'necklace', effects: [{ type: 'stat_boost', stat: 'vigor', value: 2 }], name: 'Amulet of Vigor',      rarity: 'uncommon', icon: 'resourcesandfood/NecklaceCross.PNG' },
  amulet_might:     { slot: 'necklace', effects: [{ type: 'stat_boost', stat: 'might', value: 2 }], name: 'Amulet of Might',      rarity: 'uncommon', icon: 'resourcesandfood/NecklaceGold.PNG' },
  pearl_amulet:     { slot: 'necklace', effects: [{ type: 'stat_boost', stat: 'presence', value: 3 }], name: 'Pearl Amulet',      rarity: 'rare',     icon: 'resourcesandfood/Pearl.PNG' },

  // ===== RINGS =====
  ring_finesse:     { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'finesse', value: 2 }], name: 'Ring of Finesse',    rarity: 'uncommon', icon: 'resourcesandfood/RingSilver.PNG' },
  ring_acumen:      { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'acumen', value: 2 }], name: 'Ring of Acumen',      rarity: 'uncommon', icon: 'resourcesandfood/RingGold.PNG' },
  ring_resolve:     { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'resolve', value: 2 }], name: 'Ring of Resolve',    rarity: 'uncommon', icon: 'resourcesandfood/RingBronze.PNG' },
  ring_ingenuity:   { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'ingenuity', value: 2 }], name: 'Ring of Ingenuity', rarity: 'uncommon', icon: 'resourcesandfood/RingViking.PNG' },
  gold_ring:        { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'might', value: 3 }, { type: 'stat_boost', stat: 'vigor', value: 3 }], name: 'Gold Ring of Power', rarity: 'rare', icon: 'resourcesandfood/RingGold2.PNG' },

  // ===== CLOTH ARMOR (sewing, mage-friendly, low defense, magic resist) =====
  cloth_hood:     { slot: 'head',  defense: 1, magicResist: 2, armorType: 'cloth', name: 'Cloth Hood',    rarity: 'common',    icon: 'armor/LeatherHelmet.PNG' },
  cloth_robe:     { slot: 'chest',  defense: 2, magicResist: 3, armorType: 'cloth', name: 'Cloth Robe',    rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  cloth_pants:    { slot: 'legs',  defense: 1, magicResist: 1, armorType: 'cloth', name: 'Cloth Pants',   rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  cloth_gloves:   { slot: 'hands', defense: 1, magicResist: 1, armorType: 'cloth', name: 'Cloth Gloves',  rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  cloth_boots:    { slot: 'feet',  defense: 1, speedBonus: 0.02, armorType: 'cloth', name: 'Cloth Boots',  rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },

  // ===== LEATHER ARMOR (sewing, balanced defense) =====
  leather_hood:    { slot: 'head',  defense: 3, armorType: 'leather', name: 'Leather Hood',    rarity: 'common',    icon: 'armor/LeatherHelmet.PNG' },
  leather_vest:    { slot: 'chest',  defense: 5, armorType: 'leather', name: 'Leather Vest',    rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  leather_pants:   { slot: 'legs',  defense: 3, armorType: 'leather', name: 'Leather Pants',   rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  leather_gloves:  { slot: 'hands', defense: 2, critBonus: 0.01, armorType: 'leather', name: 'Leather Gloves',  rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  leather_boots:   { slot: 'feet',  defense: 2, speedBonus: 0.03, armorType: 'leather', name: 'Leather Boots',   rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },

  // ===== REINFORCED LEATHER =====
  reinforced_leather_helm:    { slot: 'head',  defense: 6,  armorType: 'leather', name: 'Reinforced Leather Helm',    rarity: 'uncommon', icon: 'armor/LeatherHelmet.PNG' },
  reinforced_leather_vest:    { slot: 'chest',  defense: 10, armorType: 'leather', name: 'Reinforced Leather Vest',    rarity: 'uncommon', icon: 'armor/LeatherChest0.PNG' },
  reinforced_leather_pants:   { slot: 'legs',  defense: 6,  armorType: 'leather', name: 'Reinforced Leather Pants',   rarity: 'uncommon', icon: 'armor/LeatherChest0.PNG' },
  reinforced_leather_gloves:  { slot: 'hands', defense: 4,  critBonus: 0.02, armorType: 'leather', name: 'Reinforced Leather Gloves',  rarity: 'uncommon', icon: 'armor/LeatherChest0.PNG' },
  reinforced_leather_boots:   { slot: 'feet',  defense: 4,  speedBonus: 0.03, armorType: 'leather', name: 'Reinforced Leather Boots',   rarity: 'uncommon', icon: 'armor/LeatherChest0.PNG' },

  // ===== SILK ARMOR (mage-focused, magic resist + magic damage) =====
  silk_hood:    { slot: 'head',  defense: 3,  magicResist: 5,  magicDamage: 4, armorType: 'cloth', name: 'Silk Hood',    rarity: 'rare', icon: 'armor/LeatherHelmet.PNG' },
  silk_robe:    { slot: 'chest',  defense: 5,  magicResist: 8,  magicDamage: 8, armorType: 'cloth', name: 'Silk Robe',    rarity: 'rare', icon: 'armor/LeatherChest0.PNG' },
  silk_pants:   { slot: 'legs',  defense: 3,  magicResist: 3,  magicDamage: 2, armorType: 'cloth', name: 'Silk Pants',   rarity: 'rare', icon: 'armor/LeatherChest0.PNG' },
  silk_gloves:  { slot: 'hands', defense: 2,  magicResist: 4,  magicDamage: 5, armorType: 'cloth', name: 'Silk Gloves',  rarity: 'rare', icon: 'armor/LeatherChest0.PNG' },
  silk_boots:   { slot: 'feet',  defense: 2,  magicResist: 3,  speedBonus: 0.03, armorType: 'cloth', name: 'Silk Boots',   rarity: 'rare', icon: 'armor/LeatherChest0.PNG' },

  // ===== ENCHANTED CLOTH (endgame mage armor) =====
  enchanted_hood:    { slot: 'head',  defense: 5,  magicResist: 8,  magicDamage: 8,  armorType: 'cloth', name: 'Enchanted Hood',    rarity: 'ultra_rare', icon: 'armor/LeatherHelmet.PNG' },
  enchanted_robe:    { slot: 'chest',  defense: 8,  magicResist: 12, magicDamage: 15, armorType: 'cloth', name: 'Enchanted Robe',    rarity: 'ultra_rare', icon: 'armor/LeatherChest0.PNG' },
  enchanted_pants:   { slot: 'legs',  defense: 5,  magicResist: 6,  magicDamage: 5,  armorType: 'cloth', name: 'Enchanted Pants',   rarity: 'ultra_rare', icon: 'armor/LeatherChest0.PNG' },
  enchanted_gloves:  { slot: 'hands', defense: 3,  magicResist: 6,  magicDamage: 8,  armorType: 'cloth', name: 'Enchanted Gloves',  rarity: 'ultra_rare', icon: 'armor/LeatherChest0.PNG' },
  enchanted_boots:   { slot: 'feet',  defense: 3,  magicResist: 5,  magicDamage: 4,  speedBonus: 0.04, armorType: 'cloth', name: 'Enchanted Boots',   rarity: 'ultra_rare', icon: 'armor/LeatherChest0.PNG' },

  // ===== METAL GAUNTLETS =====
  copper_gauntlets:  { slot: 'hands', defense: 2,  armorType: 'chain', name: 'Copper Gauntlets',  rarity: 'common',     icon: 'armor/BasicHelm.PNG' },
  bronze_gauntlets:  { slot: 'hands', defense: 3,  armorType: 'chain', name: 'Bronze Gauntlets',  rarity: 'common',     icon: 'armor/BasicMailHelm.PNG' },
  iron_gauntlets:    { slot: 'hands', defense: 4,  armorType: 'plate', name: 'Iron Gauntlets',    rarity: 'uncommon',   icon: 'armor/Helm_01_guard.PNG' },
  steel_gauntlets:   { slot: 'hands', defense: 6,  armorType: 'plate', name: 'Steel Gauntlets',   rarity: 'uncommon',   icon: 'armor/Helm_07_footman.PNG' },
  silver_gauntlets:  { slot: 'hands', defense: 8,  armorType: 'plate', name: 'Silver Gauntlets',  rarity: 'rare',       icon: 'armor/Helm_14_gold.PNG' },
  gold_gauntlets:    { slot: 'hands', defense: 10, armorType: 'plate', name: 'Gold Gauntlets',    rarity: 'rare',       icon: 'armor/Helm_31_gold.PNG' },
  mithril_gauntlets: { slot: 'hands', defense: 14, armorType: 'plate', speedPenalty: 0.01, name: 'Mithril Gauntlets', rarity: 'ultra_rare', icon: 'armor/KnightHelm3.PNG' },

  // ===== METAL GREAVES =====
  copper_greaves:  { slot: 'legs', defense: 4,  armorType: 'chain', name: 'Copper Greaves',  rarity: 'common',     icon: 'armor/BasicHelm.PNG' },
  bronze_greaves:  { slot: 'legs', defense: 6,  armorType: 'chain', name: 'Bronze Greaves',  rarity: 'common',     icon: 'armor/BasicMailHelm.PNG' },
  iron_greaves:    { slot: 'legs', defense: 7,  armorType: 'plate', speedPenalty: 0.03, name: 'Iron Greaves',    rarity: 'uncommon',   icon: 'armor/Chest_14_milita.PNG' },
  steel_greaves:   { slot: 'legs', defense: 10, armorType: 'plate', speedPenalty: 0.03, name: 'Steel Greaves',   rarity: 'uncommon',   icon: 'armor/MailChest.PNG' },
  silver_greaves:  { slot: 'legs', defense: 12, armorType: 'plate', speedPenalty: 0.02, name: 'Silver Greaves',  rarity: 'rare',       icon: 'armor/PlateMailChest.PNG' },
  gold_greaves:    { slot: 'legs', defense: 15, armorType: 'plate', speedPenalty: 0.03, name: 'Gold Greaves',    rarity: 'rare',       icon: 'armor/KingsArmor.PNG' },
  mithril_greaves: { slot: 'legs', defense: 20, armorType: 'plate', speedPenalty: 0.01, name: 'Mithril Greaves', rarity: 'ultra_rare', icon: 'armor/KnightChest3.PNG' },

  // ===== METAL BOOTS =====
  copper_boots:  { slot: 'feet', defense: 3,  armorType: 'chain', name: 'Copper Boots',  rarity: 'common',     icon: 'armor/BasicHelm.PNG' },
  bronze_boots:  { slot: 'feet', defense: 4,  armorType: 'chain', name: 'Bronze Boots',  rarity: 'common',     icon: 'armor/BasicMailHelm.PNG' },
  iron_boots:    { slot: 'feet', defense: 5,  armorType: 'plate', speedPenalty: 0.02, name: 'Iron Boots',    rarity: 'uncommon',   icon: 'armor/Helm_01_guard.PNG' },
  steel_boots:   { slot: 'feet', defense: 7,  armorType: 'plate', speedPenalty: 0.02, name: 'Steel Boots',   rarity: 'uncommon',   icon: 'armor/Helm_07_footman.PNG' },
  silver_boots:  { slot: 'feet', defense: 9,  armorType: 'plate', speedPenalty: 0.01, name: 'Silver Boots',  rarity: 'rare',       icon: 'armor/Helm_14_gold.PNG' },
  gold_boots:    { slot: 'feet', defense: 11, armorType: 'plate', speedPenalty: 0.02, name: 'Gold Boots',    rarity: 'rare',       icon: 'armor/Helm_31_gold.PNG' },
  mithril_boots: { slot: 'feet', defense: 14, armorType: 'plate', speedPenalty: 0.01, name: 'Mithril Boots', rarity: 'ultra_rare', icon: 'armor/KnightChest3.PNG' },

  // ===== UNDERSHIRTS (light layer, small defense + utility) =====
  cloth_undershirt:    { slot: 'undershirt', defense: 1, magicResist: 1, armorType: 'cloth', name: 'Cloth Undershirt',    rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  leather_undershirt:  { slot: 'undershirt', defense: 2, armorType: 'leather', name: 'Leather Undershirt',  rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  padded_undershirt:   { slot: 'undershirt', defense: 3, armorType: 'chain', name: 'Padded Undershirt',   rarity: 'uncommon',  icon: 'armor/Chest_07.PNG' },
  silk_undershirt:     { slot: 'undershirt', defense: 2, magicResist: 4, magicDamage: 3, armorType: 'cloth', name: 'Silk Undershirt',     rarity: 'rare',      icon: 'armor/LeatherChest0.PNG' },
  enchanted_undershirt: { slot: 'undershirt', defense: 3, magicResist: 6, magicDamage: 6, armorType: 'cloth', name: 'Enchanted Undershirt', rarity: 'ultra_rare', icon: 'armor/LeatherChest0.PNG' },
  chainmail_undershirt: { slot: 'undershirt', defense: 5, speedPenalty: 0.02, armorType: 'chain', name: 'Chainmail Undershirt', rarity: 'uncommon', icon: 'armor/MailChest.PNG' },
  mithril_chainmail:   { slot: 'undershirt', defense: 8, armorType: 'chain', name: 'Mithril Chainmail',   rarity: 'ultra_rare', icon: 'armor/KnightChest3.PNG' },

  // ===== ARM GUARDS / BRACERS =====
  cloth_armwraps:      { slot: 'arms', defense: 1, armorType: 'cloth', name: 'Cloth Armwraps',      rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  leather_bracers:     { slot: 'arms', defense: 2, armorType: 'leather', name: 'Leather Bracers',     rarity: 'common',    icon: 'armor/LeatherChest0.PNG' },
  iron_bracers:        { slot: 'arms', defense: 4, armorType: 'plate', name: 'Iron Bracers',        rarity: 'uncommon',  icon: 'armor/Helm_01_guard.PNG' },
  steel_bracers:       { slot: 'arms', defense: 6, armorType: 'plate', name: 'Steel Bracers',       rarity: 'uncommon',  icon: 'armor/Helm_07_footman.PNG' },
  silver_bracers:      { slot: 'arms', defense: 8, armorType: 'plate', name: 'Silver Bracers',      rarity: 'rare',      icon: 'armor/Helm_14_gold.PNG' },
  gold_bracers:        { slot: 'arms', defense: 10, armorType: 'plate', name: 'Gold Bracers',        rarity: 'rare',      icon: 'armor/Helm_31_gold.PNG' },
  mithril_bracers:     { slot: 'arms', defense: 14, armorType: 'plate', name: 'Mithril Bracers',     rarity: 'ultra_rare', icon: 'armor/KnightHelm3.PNG' },
  silk_armwraps:       { slot: 'arms', defense: 2, magicResist: 3, magicDamage: 3, armorType: 'cloth', name: 'Silk Armwraps',       rarity: 'rare',      icon: 'armor/LeatherChest0.PNG' },
  enchanted_armwraps:  { slot: 'arms', defense: 3, magicResist: 5, magicDamage: 5, armorType: 'cloth', name: 'Enchanted Armwraps',  rarity: 'ultra_rare', icon: 'armor/LeatherChest0.PNG' },
  reinforced_leather_bracers: { slot: 'arms', defense: 5, armorType: 'leather', name: 'Reinforced Leather Bracers', rarity: 'uncommon', icon: 'armor/LeatherChest0.PNG' },

  // ===== JEWELCRAFTED RINGS =====
  silver_ring:     { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'finesse', value: 2 }], name: 'Silver Ring',     rarity: 'uncommon', icon: 'resourcesandfood/RingSilver.PNG' },
  gold_ring_craft: { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'might', value: 3 }], name: 'Gold Ring',        rarity: 'rare',     icon: 'resourcesandfood/RingGold.PNG' },
  mithril_ring:    { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'acumen', value: 4 }, { type: 'stat_boost', stat: 'resolve', value: 2 }], name: 'Mithril Ring', rarity: 'ultra_rare', icon: 'resourcesandfood/RingViking.PNG' },
  enchanted_ring:  { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'acumen', value: 3 }, { type: 'stat_boost', stat: 'ingenuity', value: 3 }], magicDamage: 5, name: 'Enchanted Ring', rarity: 'rare', icon: 'resourcesandfood/RingGold2.PNG' },

  // ===== JEWELCRAFTED NECKLACES =====
  silver_necklace:  { slot: 'necklace', effects: [{ type: 'stat_boost', stat: 'resolve', value: 2 }], name: 'Silver Necklace',  rarity: 'uncommon', icon: 'resourcesandfood/NecklaceCross.PNG' },
  gold_necklace:    { slot: 'necklace', effects: [{ type: 'stat_boost', stat: 'presence', value: 3 }, { type: 'stat_boost', stat: 'vigor', value: 2 }], name: 'Gold Necklace', rarity: 'rare', icon: 'resourcesandfood/NecklaceGold.PNG' },
  mithril_necklace: { slot: 'necklace', effects: [{ type: 'stat_boost', stat: 'vigor', value: 4 }, { type: 'stat_boost', stat: 'resolve', value: 3 }], magicResist: 5, name: 'Mithril Necklace', rarity: 'ultra_rare', icon: 'resourcesandfood/NecklaceGold.PNG' },
  ruby_pendant:     { slot: 'necklace', effects: [{ type: 'stat_boost', stat: 'might', value: 3 }, { type: 'stat_boost', stat: 'finesse', value: 2 }], name: 'Ruby Pendant', rarity: 'rare', icon: 'resourcesandfood/Pearl.PNG' },

  // ===== SPECIALIZED RINGS (from loot-generator RING_DESIGNS) =====
  ring_of_the_blade:     { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'finesse', value: 2 }], name: 'Ring of the Blade',     rarity: 'rare',      icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_arcane_focus:  { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'acumen', value: 3 }],  name: 'Ring of Arcane Focus',  rarity: 'rare',      icon: 'resourcesandfood/RingGold.PNG' },
  ring_of_the_hunt:      { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'finesse', value: 3 }], name: 'Ring of the Hunt',      rarity: 'rare',      icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_brutality:     { slot: 'ring1', effects: [{ type: 'stat_boost', stat: 'might', value: 3 }],   name: 'Ring of Brutality',     rarity: 'rare',      icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_iron_will:     { slot: 'ring2', effects: [{ type: 'stat_boost', stat: 'vigor', value: 4 }],   name: 'Ring of Iron Will',     rarity: 'rare',      icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_warding:       { slot: 'ring2', magicResist: 8, effects: [{ type: 'stat_boost', stat: 'resolve', value: 2 }], name: 'Ring of Warding', rarity: 'rare', icon: 'resourcesandfood/RingGold.PNG' },
  ring_of_regeneration:  { slot: 'ring2', effects: [{ type: 'stat_boost', stat: 'vigor', value: 2 }],   name: 'Ring of Regeneration',  rarity: 'rare',      icon: 'resourcesandfood/RingGold.PNG' },
  ring_of_the_well:      { slot: 'ring3', effects: [{ type: 'stat_boost', stat: 'acumen', value: 2 }],  name: 'Ring of the Well',      rarity: 'rare',      icon: 'resourcesandfood/RingGold.PNG' },
  ring_of_fury:          { slot: 'ring3', effects: [{ type: 'stat_boost', stat: 'might', value: 2 }],   name: 'Ring of Fury',          rarity: 'rare',      icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_concentration: { slot: 'ring3', effects: [{ type: 'stat_boost', stat: 'finesse', value: 2 }], name: 'Ring of Concentration', rarity: 'rare',      icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_endurance:     { slot: 'ring3', effects: [{ type: 'stat_boost', stat: 'vigor', value: 2 }],   name: 'Ring of Endurance',     rarity: 'rare',      icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_the_guide:     { slot: 'ring4', effects: [{ type: 'stat_boost', stat: 'acumen', value: 1 }],  name: 'Ring of the Guide',     rarity: 'uncommon',  icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_fortune:       { slot: 'ring4', effects: [{ type: 'stat_boost', stat: 'presence', value: 2 }], name: 'Ring of Fortune',      rarity: 'rare',      icon: 'resourcesandfood/RingGold.PNG' },
  ring_of_swiftness:     { slot: 'ring4', speedBonus: 0.08, effects: [{ type: 'stat_boost', stat: 'finesse', value: 1 }], name: 'Ring of Swiftness', rarity: 'uncommon', icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_the_smith:     { slot: 'ring5', effects: [{ type: 'stat_boost', stat: 'ingenuity', value: 2 }], name: 'Ring of the Smith',   rarity: 'uncommon',  icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_the_miner:     { slot: 'ring5', effects: [{ type: 'stat_boost', stat: 'vigor', value: 1 }],   name: 'Ring of the Miner',     rarity: 'uncommon',  icon: 'resourcesandfood/RingSilver.PNG' },
  ring_of_the_alchemist: { slot: 'ring5', effects: [{ type: 'stat_boost', stat: 'acumen', value: 2 }],  name: 'Ring of the Alchemist', rarity: 'rare',      icon: 'resourcesandfood/RingGold.PNG' },
  ring_of_the_enchanter: { slot: 'ring5', effects: [{ type: 'stat_boost', stat: 'acumen', value: 2 }],  name: 'Ring of the Enchanter', rarity: 'rare',      icon: 'resourcesandfood/RingGold.PNG' },
  ring_of_the_void_walker: { slot: 'ring6', effects: [{ type: 'stat_boost', stat: 'finesse', value: 3 }], name: 'Ring of the Void Walker', rarity: 'legendary', icon: 'resourcesandfood/RingViking.PNG' },
  ring_of_the_phoenix:   { slot: 'ring6', effects: [{ type: 'stat_boost', stat: 'vigor', value: 3 }],   name: 'Ring of the Phoenix',   rarity: 'legendary', icon: 'resourcesandfood/RingViking.PNG' },
  ring_of_the_leviathan: { slot: 'ring6', effects: [{ type: 'stat_boost', stat: 'vigor', value: 3 }, { type: 'stat_boost', stat: 'acumen', value: 3 }], name: 'Ring of the Leviathan', rarity: 'legendary', icon: 'resourcesandfood/RingViking.PNG' },
};

// ---------------------------------------------------------------------------
// Item Durability System
// ---------------------------------------------------------------------------

// Max durability by material/armor type (derived from item type name prefix or armorType)
var DURABILITY_BY_MATERIAL = {
  cloth:     50,
  leather:   50,
  wooden:    50,
  copper:    75,
  bronze:    100,
  iron:      150,
  steel:     200,
  silver:    175,
  gold:      175,
  mithril:   300,
  enchanted: 250,
  silk:      75,
  reinforced: 125,
  padded:    75,
  chainmail: 175,
  stormsteel: 250,
  deepsilver: 225,
  soulforged: 350,
  voidmetal:  400,
};

// Slots that count as "armor" for durability loss on taking damage (shield now in hand slots)
var ARMOR_SLOTS = ['head', 'chest', 'undershirt', 'arms', 'hands', 'legs', 'feet'];

// Slots that count as "weapon" for durability loss on attacking (both hands lose durability)
var WEAPON_SLOTS = ['main_hand', 'off_hand'];

// Slots that count as "tools" for durability loss on harvesting
var TOOL_SLOTS = ['axe', 'pickaxe'];

// Slots that never lose durability (jewelry)
var JEWELRY_SLOTS = ['ring1', 'ring2', 'ring3', 'ring4', 'ring5', 'ring6', 'necklace'];

// Repair cost: maps material prefix to resource type needed
var REPAIR_MATERIAL_COST = {
  cloth:     { resource: 'thread',      multiplier: 1 },
  leather:   { resource: 'leather',     multiplier: 1 },
  wooden:    { resource: 'wood',        multiplier: 1 },
  copper:    { resource: 'copper_ore',  multiplier: 1 },
  bronze:    { resource: 'bronze_bar',  multiplier: 1 },
  iron:      { resource: 'iron_bar',    multiplier: 1 },
  steel:     { resource: 'iron_bar',    multiplier: 2 },
  silver:    { resource: 'silver_bar',  multiplier: 1 },
  gold:      { resource: 'gold_bar',    multiplier: 1 },
  mithril:   { resource: 'mithril_ore', multiplier: 1 },
  enchanted: { resource: 'mana_crystal', multiplier: 1 },
  silk:      { resource: 'silk',        multiplier: 1 },
  reinforced: { resource: 'leather',    multiplier: 2 },
  padded:    { resource: 'cloth',       multiplier: 1 },
  chainmail: { resource: 'iron_bar',    multiplier: 1 },
  stormsteel: { resource: 'stormsteel_bar', multiplier: 2 },
  deepsilver: { resource: 'deepsilver_bar', multiplier: 2 },
  soulforged: { resource: 'soulforged_bar', multiplier: 3 },
  voidmetal:  { resource: 'voidmetal_bar',  multiplier: 3 },
};

// Determine material prefix from an item type string
function getItemMaterial(itemType) {
  if (!itemType || typeof itemType !== 'string') return 'iron';
  var prefixes = ['voidmetal', 'soulforged', 'deepsilver', 'stormsteel', 'enchanted', 'reinforced', 'chainmail', 'padded', 'mithril', 'leather', 'wooden', 'copper', 'bronze', 'silver', 'steel', 'cloth', 'silk', 'iron', 'gold'];
  for (var i = 0; i < prefixes.length; i++) {
    if (itemType.indexOf(prefixes[i]) === 0) return prefixes[i];
  }
  return 'iron'; // default fallback
}

// Get max durability for an item type
function getMaxDurability(itemType) {
  var material = getItemMaterial(itemType);
  return DURABILITY_BY_MATERIAL[material] || 100;
}

// Ensure an equipped item has durability fields.  Called when equipping and
// when any durability operation touches the item.  Items in inventory keep
// whatever durability they had; this only sets defaults if they are missing.
function ensureItemDurability(item) {
  if (!item) return;
  if (typeof item.maxDurability !== 'number' || item.maxDurability <= 0) {
    item.maxDurability = getMaxDurability(item.type);
  }
  if (typeof item.durability !== 'number' || item.durability < 0) {
    item.durability = item.maxDurability;
  }
}

// Reduce durability on a specific equipment slot.
// percentLoss is 0-1 (e.g. 0.01 = 1% of maxDurability).
// Returns { broken, durability, maxDurability, slot } or null if slot empty.
// The account must be loaded by the caller and saved afterwards.
function reduceDurability(account, slot, percentLoss, cardEffects) {
  if (!account || !account.equipment) return null;
  var itemId = account.equipment[slot];
  if (!itemId) return null;
  if (!account.mmoInventory || !account.mmoInventory.items) return null;
  var item = null;
  for (var i = 0; i < account.mmoInventory.items.length; i++) {
    if (account.mmoInventory.items[i].id === itemId) {
      item = account.mmoInventory.items[i];
      break;
    }
  }
  if (!item) return null;

  // Jewelry never loses durability
  if (JEWELRY_SLOTS.indexOf(slot) !== -1) return null;

  ensureItemDurability(item);

  // Card effect: "Indestructible" — 5% chance to not lose durability (stacks)
  var indestructibleChance = 0;
  if (cardEffects) {
    for (var ci = 0; ci < cardEffects.length; ci++) {
      if (cardEffects[ci].type === 'indestructible_chance') indestructibleChance += (cardEffects[ci].value || 0);
    }
  }
  if (indestructibleChance > 0 && Math.random() < indestructibleChance) {
    return { broken: false, durability: item.durability, maxDurability: item.maxDurability, slot: slot, saved: true };
  }

  // Card effect: weapon/armor durability bonuses reduce loss rate
  var lossMult = 1.0;
  if (cardEffects) {
    for (var cj = 0; cj < cardEffects.length; cj++) {
      var ce = cardEffects[cj];
      if (ce.type === 'weapon_durability_bonus' && WEAPON_SLOTS.indexOf(slot) !== -1) lossMult -= (ce.value || 0);
      if (ce.type === 'armor_durability_bonus' && ARMOR_SLOTS.indexOf(slot) !== -1) lossMult -= (ce.value || 0);
      if (ce.type === 'tool_durability_bonus' && TOOL_SLOTS.indexOf(slot) !== -1) lossMult -= (ce.value || 0);
    }
  }
  if (lossMult < 0.1) lossMult = 0.1; // minimum 10% of normal loss

  var lossAmount = Math.max(1, Math.round(item.maxDurability * percentLoss * lossMult));
  var wasBroken = item.durability <= 0;
  item.durability = Math.max(0, item.durability - lossAmount);
  var nowBroken = item.durability <= 0 && !wasBroken;

  return {
    broken: nowBroken,
    durability: item.durability,
    maxDurability: item.maxDurability,
    slot: slot,
    itemName: item.name || item.type,
    lowDurability: item.durability > 0 && item.durability <= item.maxDurability * 0.25,
  };
}

// Reduce durability on all armor slots (for damage taken events).
// Returns array of durability results (including broken/warning items).
function reduceArmorDurability(account, percentLoss, cardEffects) {
  var results = [];
  for (var i = 0; i < ARMOR_SLOTS.length; i++) {
    var r = reduceDurability(account, ARMOR_SLOTS[i], percentLoss, cardEffects);
    if (r) results.push(r);
  }
  return results;
}

// Reduce durability on weapon slots (for attack events) — both hands
function reduceWeaponDurability(account, percentLoss, cardEffects) {
  var results = [];
  for (var i = 0; i < WEAPON_SLOTS.length; i++) {
    var r = reduceDurability(account, WEAPON_SLOTS[i], percentLoss, cardEffects);
    if (r) results.push(r);
  }
  return results;
}

// Get durability info for all equipped items (for client display).
function getEquipmentDurability(key) {
  var account = loadAccount(key);
  if (!account) return {};
  var eq = account.equipment || {};
  var inv = (account.mmoInventory && account.mmoInventory.items) ? account.mmoInventory.items : [];
  var durabilityInfo = {};
  var needsSave = false;
  for (var si = 0; si < EQUIPMENT_SLOTS.length; si++) {
    var slot = EQUIPMENT_SLOTS[si];
    var itemId = eq[slot];
    if (!itemId) continue;
    var item = null;
    for (var ii = 0; ii < inv.length; ii++) {
      if (inv[ii].id === itemId) { item = inv[ii]; break; }
    }
    if (!item) continue;
    // Ensure durability fields exist (lazy migration for existing items)
    if (typeof item.durability !== 'number') {
      ensureItemDurability(item);
      needsSave = true;
    }
    durabilityInfo[slot] = {
      durability: item.durability,
      maxDurability: item.maxDurability,
      broken: item.durability <= 0,
      low: item.durability > 0 && item.durability <= item.maxDurability * 0.25,
      itemName: item.name || item.type,
    };
  }
  if (needsSave) saveAccount(account);
  return durabilityInfo;
}

// Repair an equipment slot.  Returns { success, cost, durabilityRestored, xpAwarded }
// or { error } on failure.  Caller should verify station proximity.
function repairEquipmentSlot(key, slot, cardEffects) {
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  if (!account.equipment) return { error: 'No equipment' };
  if (EQUIPMENT_SLOTS.indexOf(slot) === -1) return { error: 'Invalid slot' };
  var itemId = account.equipment[slot];
  if (!itemId) return { error: 'Nothing equipped in that slot' };
  if (!account.mmoInventory || !account.mmoInventory.items) return { error: 'Inventory error' };
  var item = null;
  for (var i = 0; i < account.mmoInventory.items.length; i++) {
    if (account.mmoInventory.items[i].id === itemId) { item = account.mmoInventory.items[i]; break; }
  }
  if (!item) return { error: 'Equipped item not found in inventory' };

  ensureItemDurability(item);

  if (item.durability >= item.maxDurability) return { error: 'Item is already at full durability' };

  var missingPercent = (item.maxDurability - item.durability) / item.maxDurability;
  var material = getItemMaterial(item.type);
  var costInfo = REPAIR_MATERIAL_COST[material] || { resource: 'iron_bar', multiplier: 1 };

  // Base resource cost = ceil(missingPercent * 10 * multiplier) -- minimum 1
  var baseCost = Math.max(1, Math.ceil(missingPercent * 10 * costInfo.multiplier));

  // Card effect: Master Mender — reduce repair cost
  var costReduction = 0;
  if (cardEffects) {
    for (var ci = 0; ci < cardEffects.length; ci++) {
      if (cardEffects[ci].type === 'repair_cost_reduction') costReduction += (cardEffects[ci].value || 0);
    }
  }
  if (costReduction > 0) {
    baseCost = Math.max(1, Math.round(baseCost * (1 - costReduction)));
  }

  // Check if player has enough resources
  var currentAmount = account.mmoInventory[costInfo.resource] || 0;
  if (currentAmount < baseCost) {
    var resName = costInfo.resource.replace(/_/g, ' ');
    return { error: 'Not enough ' + resName + ' (need ' + baseCost + ', have ' + currentAmount + ')' };
  }

  // Deduct resources
  account.mmoInventory[costInfo.resource] = currentAmount - baseCost;

  // Restore durability
  var durabilityRestored = item.maxDurability - item.durability;
  item.durability = item.maxDurability;

  // Award blacksmithing/crafting XP proportional to durability restored
  var repairXp = Math.max(1, Math.round(durabilityRestored * 0.5));

  saveAccount(account);

  return {
    success: true,
    cost: { resource: costInfo.resource, amount: baseCost },
    durabilityRestored: durabilityRestored,
    xpAwarded: repairXp,
    slot: slot,
    itemName: item.name || item.type,
  };
}

// Check if an item is broken (0 durability) — used by stat functions to zero out stats.
function isItemBroken(item) {
  if (!item) return false;
  if (typeof item.durability !== 'number') return false; // no durability = not broken (legacy)
  return item.durability <= 0;
}

// Migrate old weapon/shield slots to main_hand/off_hand
function migrateHandSlots(account) {
  if (!account.equipment) return;
  if (account.equipment.weapon !== undefined) {
    account.equipment.main_hand = account.equipment.weapon;
    delete account.equipment.weapon;
  }
  if (account.equipment.shield !== undefined) {
    account.equipment.off_hand = account.equipment.shield;
    delete account.equipment.shield;
  }
  // Ensure new ring slots exist
  for (var ri = 3; ri <= 6; ri++) {
    if (account.equipment['ring' + ri] === undefined) {
      account.equipment['ring' + ri] = null;
    }
  }
}

function getDefaultEquipment() {
  return { axe: null, pickaxe: null, main_hand: null, off_hand: null, head: null, chest: null, undershirt: null, arms: null, hands: null, legs: null, feet: null, ring1: null, ring2: null, ring3: null, ring4: null, ring5: null, ring6: null, necklace: null };
}

function getEquipment(key) {
  const account = loadAccount(key);
  if (!account) return getDefaultEquipment();
  // Migrate old weapon/shield slots if needed
  migrateHandSlots(account);
  var eq = account.equipment || {};
  // Ensure all slots exist
  for (var si = 0; si < EQUIPMENT_SLOTS.length; si++) {
    if (eq[EQUIPMENT_SLOTS[si]] === undefined) eq[EQUIPMENT_SLOTS[si]] = null;
  }
  return eq;
}

function equipMMOItem(key, slot, itemId) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.equipment) account.equipment = getDefaultEquipment();
  // Migrate old slots if needed
  migrateHandSlots(account);
  if (EQUIPMENT_SLOTS.indexOf(slot) === -1) return null;
  // Find item in inventory
  if (!account.mmoInventory || !account.mmoInventory.items) return null;
  var item = account.mmoInventory.items.find(function(i) { return i.id === itemId; });
  if (!item) return null;
  // Verify item type matches slot for tool slots
  if (slot === 'axe' && !VALID_AXES[item.type]) return null;
  if (slot === 'pickaxe' && !VALID_PICKAXES[item.type]) return null;
  // For combat slots, check WEAPON_TYPES
  if (slot !== 'axe' && slot !== 'pickaxe') {
    var weaponDef = WEAPON_TYPES[item.type];
    if (!weaponDef) return null;

    // Hand slots: weapons and shields can go in either main_hand or off_hand
    if (slot === 'main_hand' || slot === 'off_hand') {
      var slotMatch = (weaponDef.slot === 'weapon' || weaponDef.slot === 'shield');
      if (!slotMatch) return null;
      // Prevent equipping same item in both hands
      var otherSlot = (slot === 'main_hand') ? 'off_hand' : 'main_hand';
      if (account.equipment[otherSlot] === itemId) {
        return { error: 'Item already equipped in other hand' };
      }
      // Two-handed weapon in main_hand: auto-clear off_hand
      if (slot === 'main_hand' && weaponDef.handedness === '2h') {
        account.equipment.off_hand = null;
      }
      // Equipping anything in off_hand when main_hand has 2h: allowed (Titan Grip)
    } else if (slot === 'ring2' || slot === 'ring3' || slot === 'ring4' || slot === 'ring5' || slot === 'ring6') {
      // Ring items (slot: 'ring1') can be equipped in any ring slot
      if (weaponDef.slot !== 'ring1') return null;
    } else {
      var slotMatch = (weaponDef.slot === slot);
      if (!slotMatch) return null;
    }

    // Check combat skill requirement for weapons
    if (weaponDef.category && weaponDef.rarity) {
      var requiredSkill = COMBAT_SKILL_FOR_CATEGORY[weaponDef.category];
      var requiredLevel = RARITY_COMBAT_LEVEL[weaponDef.rarity] || 0;
      if (requiredSkill && requiredLevel > 0) {
        var skills = account.skills || {};
        var playerSkill = skills[requiredSkill];
        var playerLevel = (playerSkill && playerSkill.level) ? playerSkill.level : 0;
        if (playerLevel < requiredLevel) {
          return { error: 'Requires ' + requiredSkill.charAt(0).toUpperCase() + requiredSkill.slice(1) + ' Lv.' + requiredLevel };
        }
      }
    }
  }
  // Initialize durability on equip if not already set
  ensureItemDurability(item);

  account.equipment[slot] = itemId;
  saveAccount(account);
  return account.equipment;
}

function unequipMMOItem(key, slot) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.equipment) account.equipment = getDefaultEquipment();
  if (EQUIPMENT_SLOTS.indexOf(slot) === -1) return null;
  account.equipment[slot] = null;
  saveAccount(account);
  return account.equipment;
}

// Resolve an item's effective stats — merges procedural stats with base definition
function resolveItemStats(item) {
  if (!item) return null;
  var baseDef = WEAPON_TYPES[item.type] || {};

  // If item has procedural stats from loot-generator, use those
  if (item.stats) {
    var resolved = {};
    // Start with base definition fields
    for (var k in baseDef) {
      if (baseDef.hasOwnProperty(k)) resolved[k] = baseDef[k];
    }
    // Override with procedural stats (these already include quality + affixes)
    for (var s in item.stats) {
      if (item.stats.hasOwnProperty(s)) resolved[s] = item.stats[s];
    }
    // Copy item-level procedural fields
    resolved.quality = item.quality || null;
    resolved.rarity = item.rarity || baseDef.rarity || 'common';
    resolved.sockets = item.sockets || 0;
    resolved.socketedGems = item.socketedGems || [];
    resolved.augment = item.augment || null;
    resolved.setId = item.setId || null;
    resolved.setPieceId = item.setPieceId || null;
    resolved.uniqueId = item.uniqueId || null;
    resolved.uniqueEffect = item.uniqueEffect || null;
    resolved.wandProps = item.wandProps || null;
    resolved.imbued = item.imbued || false;
    resolved.effects = item.effects || baseDef.effects || null;
    resolved.prefix = item.prefix || null;
    resolved.prefixStats = item.prefixStats || null;
    resolved.suffix = item.suffix || null;
    resolved.suffixStats = item.suffixStats || null;
    resolved.handedness = item.handedness || baseDef.handedness || null;
    return resolved;
  }

  // Old item without procedural stats — use base definition
  return baseDef;
}

// Dual-hand equipment stats: returns { mainHand, offHand, mainHandItemId, offHandItemId }
function getEquippedHandStats(key) {
  var account = loadAccount(key);
  if (!account) return { mainHand: null, offHand: null, mainHandItemId: null, offHandItemId: null };
  migrateHandSlots(account);
  var eq = account.equipment || {};
  var inv = (account.mmoInventory && account.mmoInventory.items) || [];

  function getHandItem(slotId) {
    if (!eq[slotId]) return null;
    var item = inv.find(function(i) { return i.id === eq[slotId]; });
    if (!item || isItemBroken(item)) return null;
    return resolveItemStats(item);
  }

  return {
    mainHand: getHandItem('main_hand'),
    offHand: getHandItem('off_hand'),
    mainHandItemId: eq.main_hand || null,
    offHandItemId: eq.off_hand || null,
  };
}

// Backward-compatible wrapper: returns single weapon stats (main hand)
function getEquippedWeaponStats(key) {
  var handStats = getEquippedHandStats(key);
  return handStats.mainHand;
}

function getEquippedArmorTotal(key) {
  var account = loadAccount(key);
  if (!account) return 0;
  migrateHandSlots(account);
  var eq = account.equipment || {};
  var inv = (account.mmoInventory && account.mmoInventory.items) ? account.mmoInventory.items : [];
  var totalDef = 0;
  // Shield defense is now pulled from hand stats in combat code, not here
  var armorSlots = ['head', 'chest', 'undershirt', 'arms', 'hands', 'legs', 'feet'];
  for (var i = 0; i < armorSlots.length; i++) {
    var slotItemId = eq[armorSlots[i]];
    if (!slotItemId) continue;
    var slotItem = inv.find(function(it) { return it.id === slotItemId; });
    if (!slotItem) continue;
    // Broken items provide no defense
    if (isItemBroken(slotItem)) continue;
    var def = resolveItemStats(slotItem);
    if (def && def.defense) totalDef += def.defense;
  }
  return totalDef;
}

function getEquippedArmorStats(key) {
  var account = loadAccount(key);
  if (!account) return { totalDefense: 0, totalMagicResist: 0, totalMagicDamage: 0, totalCritBonus: 0, totalSpeedMod: 0 };
  migrateHandSlots(account);
  var eq = account.equipment || {};
  var inv = (account.mmoInventory && account.mmoInventory.items) ? account.mmoInventory.items : [];
  var stats = { totalDefense: 0, totalMagicResist: 0, totalMagicDamage: 0, totalCritBonus: 0, totalSpeedMod: 0 };
  // Shield defense now handled by hand stats in combat code — only body armor + jewelry here
  var armorSlots = ['head', 'chest', 'undershirt', 'arms', 'hands', 'legs', 'feet', 'ring1', 'ring2', 'ring3', 'ring4', 'ring5', 'ring6', 'necklace'];
  for (var i = 0; i < armorSlots.length; i++) {
    var slotItemId = eq[armorSlots[i]];
    if (!slotItemId) continue;
    var slotItem = inv.find(function(it) { return it.id === slotItemId; });
    if (!slotItem) continue;
    // Broken items provide no stats
    if (isItemBroken(slotItem)) continue;
    var def = resolveItemStats(slotItem);
    if (!def) continue;
    if (def.defense) stats.totalDefense += def.defense;
    if (def.magicResist) stats.totalMagicResist += def.magicResist;
    if (def.magicDamage) stats.totalMagicDamage += def.magicDamage;
    if (def.critBonus) stats.totalCritBonus += def.critBonus;
    if (def.speedBonus) stats.totalSpeedMod += def.speedBonus;
    if (def.speedPenalty) stats.totalSpeedMod -= def.speedPenalty;
  }
  return stats;
}

// ---------------------------------------------------------------------------
// Dual-Wield Combo System
// ---------------------------------------------------------------------------

var DUAL_WIELD_COMBOS = {
  // === DUAL BLADES ===
  'dagger_dagger': {
    name: 'Twin Fangs',
    bonuses: { attackSpeed: 0.25, critBonus: 0.08, dodgeBonus: 0.05 },
    skills: ['flurry_of_blades', 'twin_backstab'],
    description: 'Lightning-fast strikes. +25% attack speed, +8% crit, +5% dodge.',
  },
  'sword_sword': {
    name: 'Blade Storm',
    bonuses: { attackSpeed: 0.10, meleeDmgBonus: 0.12, parryChance: 0.08 },
    skills: ['whirlwind_slash', 'riposte'],
    description: 'Balanced dual offense. +10% speed, +12% melee damage, 8% parry.',
  },
  'sword_dagger': {
    name: 'Swordbreaker',
    bonuses: { attackSpeed: 0.15, critBonus: 0.05, parryChance: 0.06 },
    skills: ['feint_strike', 'disarm'],
    description: 'Main blade + quick off-hand. +15% speed, +5% crit, 6% parry.',
  },
  'axe_axe': {
    name: 'Berserker Fury',
    bonuses: { meleeDmgBonus: 0.20, attackSpeed: -0.10, lifesteal: 0.05 },
    skills: ['cleave', 'raging_blow'],
    description: 'Raw power, slower. +20% damage, -10% speed, 5% lifesteal.',
  },
  'mace_mace': {
    name: 'Skull Crusher',
    bonuses: { meleeDmgBonus: 0.18, stunChance: 0.10, armorPen: 0.08 },
    skills: ['ground_pound', 'concussive_blow'],
    description: 'Armor-breaking devastation. +18% damage, 10% stun, 8% armor pen.',
  },

  // === WEAPON + SHIELD ===
  'weapon_shield': {
    name: 'Sword & Board',
    bonuses: { blockChance: 0.05, defense: 5, counterChance: 0.06 },
    skills: ['shield_bash', 'defensive_stance'],
    description: 'Classic defense. +5% block, +5 defense, 6% counter chance.',
  },

  // === DUAL SHIELDS ===
  'shield_shield': {
    name: 'Iron Fortress',
    bonuses: { blockChance: 0.15, defense: 10, damageReduction: 0.15, attackSpeed: -0.30, meleeDmgBonus: -0.30 },
    skills: ['shield_wall', 'reflecting_guard', 'taunt'],
    description: 'Unstoppable defense. +15% block, +10 def, 15% DR. -30% damage/speed.',
  },

  // === DUAL MAGIC ===
  'wand_wand': {
    name: 'Arcane Conduit',
    bonuses: { magicDmgBonus: 0.20, castSpeed: 0.15, maxManaBonus: 20 },
    skills: ['arcane_barrage', 'mana_shield'],
    description: 'Doubled magical output. +20% magic damage, +15% cast speed, +20 mana.',
  },
  'staff_staff': {
    name: 'Grand Magister',
    bonuses: { magicDmgBonus: 0.30, magicResist: 10, castSpeed: -0.10, maxManaBonus: 40 },
    skills: ['meteor_strike', 'arcane_ward'],
    description: 'Supreme magic power. +30% magic damage, +10 MR, +40 mana. -10% cast speed.',
  },
  'wand_staff': {
    name: 'Battlemage',
    bonuses: { magicDmgBonus: 0.15, castSpeed: 0.10, magicResist: 5, maxManaBonus: 15 },
    skills: ['spell_weave', 'counterspell'],
    description: 'Balanced spellcasting. +15% magic, +10% cast, +5 MR, +15 mana.',
  },

  // === MELEE + MAGIC (hybrid) ===
  'sword_wand': {
    name: 'Spellblade',
    bonuses: { meleeDmgBonus: 0.08, magicDmgBonus: 0.08, weaponElement: 'arcane' },
    skills: ['enchanted_strike', 'spell_parry'],
    description: 'Melee-magic hybrid. +8% melee/magic, arcane-infused attacks.',
  },
  'mace_wand': {
    name: 'Battle Priest',
    bonuses: { meleeDmgBonus: 0.05, healBonus: 0.15, magicResist: 5 },
    skills: ['smite', 'healing_light'],
    description: 'Holy warrior. +5% melee, +15% healing, +5 magic resist.',
  },

  // === DUAL TWO-HANDED (Titan Grip) ===
  '2h_2h': {
    name: 'Titan Grip',
    bonuses: { meleeDmgBonus: 0.35, attackSpeed: -0.25, critBonus: 0.05 },
    penalties: { offHandDmgPenalty: 0.40 },
    skills: ['titan_slam', 'earthquake'],
    description: 'Dual two-handers! +35% damage, -25% speed. Off-hand at 60% power.',
    requiresStr: 15,
  },

  // === BOW/CROSSBOW + OFF-HAND ===
  'ranged_shield': {
    name: 'Shieldbearer Archer',
    bonuses: { blockChance: 0.10, defense: 3, attackSpeed: -0.15 },
    skills: ['shield_cover', 'aimed_shot'],
    description: 'Defensive archer. +10% block, +3 def. -15% attack speed.',
  },
  'ranged_dagger': {
    name: 'Scout',
    bonuses: { dodgeBonus: 0.08, critBonus: 0.05, moveSpeed: 0.10 },
    skills: ['quick_draw', 'knife_throw'],
    description: 'Mobile skirmisher. +8% dodge, +5% crit, +10% move speed.',
  },
};

// Categorize a weapon/shield definition into a combo category
function categorizeHandItem(weaponDef) {
  if (!weaponDef) return null;
  if (weaponDef.slot === 'shield') return 'shield';
  var name = (weaponDef.name || '').toLowerCase();
  var cat = weaponDef.category || '';
  // Check by name patterns
  if (name.indexOf('dagger') !== -1) return 'dagger';
  if (name.indexOf('sword') !== -1) return 'sword';
  if (name.indexOf('battle axe') !== -1) return 'axe';
  if (name.indexOf('mace') !== -1 || name.indexOf('hammer') !== -1) return 'mace';
  if (name.indexOf('spear') !== -1) return 'spear';
  if (name.indexOf('scythe') !== -1) return 'scythe';
  if (name.indexOf('staff') !== -1) return 'staff';
  if (name.indexOf('wand') !== -1) return 'wand';
  if (name.indexOf('crossbow') !== -1) return 'crossbow';
  if (name.indexOf('bow') !== -1) return 'bow';
  // Fallback by category
  if (cat === 'archery') return 'bow';
  if (cat === 'magic') return 'wand';
  if (cat === 'melee_blade') return 'sword';
  if (cat === 'melee_blunt') return 'mace';
  return null;
}

// Get generic combo key for categories that map to broader combos
function getGenericCombo(mhCat, ohCat, handStats) {
  // Check for 2H+2H (Titan Grip)
  var mhDef = handStats.mainHand;
  var ohDef = handStats.offHand;
  if (mhDef && ohDef && mhDef.handedness === '2h' && ohDef.handedness === '2h') {
    return DUAL_WIELD_COMBOS['2h_2h'];
  }
  // Ranged + off-hand combos
  var rangedCats = { bow: 1, crossbow: 1 };
  if (rangedCats[mhCat]) {
    if (ohCat === 'shield') return DUAL_WIELD_COMBOS['ranged_shield'];
    if (ohCat === 'dagger') return DUAL_WIELD_COMBOS['ranged_dagger'];
  }
  // Any weapon + shield
  if (ohCat === 'shield' && mhCat !== 'shield') return DUAL_WIELD_COMBOS['weapon_shield'];
  if (mhCat === 'shield' && ohCat !== 'shield') return DUAL_WIELD_COMBOS['weapon_shield'];
  return null;
}

// Get the active dual-wield combo for an account
function getDualWieldCombo(key) {
  var handStats = getEquippedHandStats(key);
  if (!handStats.mainHand && !handStats.offHand) return null;

  var mhCat = categorizeHandItem(handStats.mainHand);
  var ohCat = categorizeHandItem(handStats.offHand);

  if (!mhCat || !ohCat) return null; // only one hand equipped, no combo

  // Try specific combo first
  var comboKey = mhCat + '_' + ohCat;
  var combo = DUAL_WIELD_COMBOS[comboKey];
  if (!combo) {
    // Try reversed
    comboKey = ohCat + '_' + mhCat;
    combo = DUAL_WIELD_COMBOS[comboKey];
  }
  if (!combo) {
    // Try generic categories (weapon_shield, 2h_2h, etc.)
    combo = getGenericCombo(mhCat, ohCat, handStats);
  }

  return combo || null;
}

function getPlotId(key) {
  var account = loadAccount(key);
  if (!account) return null;
  return account.plotId || null;
}

function setPlotId(key, plotId) {
  var account = loadAccount(key);
  if (!account) return false;
  account.plotId = plotId;
  saveAccount(account);
  return true;
}

function getLastLocation(key) {
  var account = loadAccount(key);
  if (!account) return null;
  if (!account.lastZone) return null;
  return {
    zoneId: account.lastZone,
    x: account.lastPosition ? account.lastPosition.x : 0,
    y: account.lastPosition ? account.lastPosition.y : 0,
  };
}

function setLastLocation(key, zoneId, x, y) {
  var account = loadAccount(key);
  if (!account) return false;
  account.lastZone = zoneId;
  account.lastPosition = { x: Math.floor(x), y: Math.floor(y) };
  saveAccount(account);
  return true;
}

// ---------------------------------------------------------------------------
// RPG: Race selection
// ---------------------------------------------------------------------------

function setRace(key, raceId) {
  if (!rpgData.RACE_IDS.includes(raceId)) return { error: 'Invalid race' };
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  if (account.race != null) return { error: 'Race already chosen (permanent)' };
  account.race = raceId;
  // Apply racial stat bumps
  if (!account.rpgStats) account.rpgStats = rpgData.getDefaultStats();
  rpgData.applyRaceBumps(account.rpgStats, raceId);
  saveAccount(account);
  return { success: true, race: raceId, rpgStats: account.rpgStats };
}

// ---------------------------------------------------------------------------
// RPG: Stat allocation
// ---------------------------------------------------------------------------

function allocateStatPoint(key, statName) {
  if (!rpgData.STAT_KEYS.includes(statName)) return { error: 'Invalid stat' };
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  if (!account.rpgStats) account.rpgStats = rpgData.getDefaultStats();
  if ((account.rpgStats.freePoints || 0) <= 0) return { error: 'No free stat points' };
  account.rpgStats[statName]++;
  account.rpgStats.freePoints--;
  saveAccount(account);
  return { success: true, rpgStats: account.rpgStats, computedStats: rpgData.computeStats(account.rpgStats, account.level, account.race) };
}

function getComputedStats(key) {
  var account = loadAccount(key);
  if (!account) return null;
  return rpgData.computeStats(account.rpgStats || rpgData.getDefaultStats(), account.level || 1, account.race);
}

// Per-account pack lock to prevent TOCTOU races (same pattern as _chipLocks)
const _packLocks = new Map();

function _acquirePackLock(key) {
  var entry = _packLocks.get(key);
  if (!entry) {
    entry = { depth: 0 };
    _packLocks.set(key, entry);
  }
  entry.depth++;
  return function release() {
    entry.depth--;
    if (entry.depth <= 0) {
      _packLocks.delete(key);
    }
  };
}

// Per-account card lock for general card array mutations (same pattern as _chipLocks)
const _cardLocks = new Map();

function acquireCardLock(key) {
  var entry = _cardLocks.get(key);
  if (!entry) {
    entry = { depth: 0 };
    _cardLocks.set(key, entry);
  }
  entry.depth++;
  return function release() {
    entry.depth--;
    if (entry.depth <= 0) {
      _cardLocks.delete(key);
    }
  };
}

function releaseCardLock(releaseFn) {
  if (typeof releaseFn === 'function') releaseFn();
}

// ---------------------------------------------------------------------------
// RPG: Card pack management
// ---------------------------------------------------------------------------

function addPendingPack(key, count) {
  var account = loadAccount(key);
  if (!account) return null;
  account.pendingPacks = (account.pendingPacks || 0) + (count || 1);
  saveAccount(account);
  return account.pendingPacks;
}

function openPendingPack(key) {
  var release = _acquirePackLock(key);
  try {
    var account = loadAccount(key);
    if (!account) return { error: 'Account not found' };
    if ((account.pendingPacks || 0) <= 0) return { error: 'No packs to open' };
    if (!account.rpgCards) account.rpgCards = [];
    if (account.rpgCards.length >= rpgData.MAX_CARD_COLLECTION) return { error: 'Card collection full' };

    var pity = typeof account.pityPullsSinceLegendary === 'number' ? account.pityPullsSinceLegendary : 0;

    // Sum luck_bonus and card_luck_bonus from equipped cards
    var packLuckBonus = 0;
    var cardEffectsForPack = getEquippedCardEffects(key);
    for (var li = 0; li < cardEffectsForPack.length; li++) {
      if (cardEffectsForPack[li].type === 'luck_bonus') packLuckBonus += (cardEffectsForPack[li].value || 0);
      if (cardEffectsForPack[li].type === 'card_luck_bonus') packLuckBonus += (cardEffectsForPack[li].value || 0);
    }

    var result = rpgData.openCardPack(account.race, pity, packLuckBonus);
    var cards = result.cards;
    account.pityPullsSinceLegendary = result.pityPullsSinceLegendary;

    var addedCards = [];

    for (var i = 0; i < cards.length; i++) {
      if (account.rpgCards.length >= rpgData.MAX_CARD_COLLECTION) break;
      account.rpgCards.push(cards[i]);
      addedCards.push(cards[i]);
    }

    account.pendingPacks--;
    saveAccount(account);
    return { success: true, cards: addedCards, pendingPacks: account.pendingPacks };
  } finally {
    release();
  }
}

// ---------------------------------------------------------------------------
// RPG: Card equip/unequip
// ---------------------------------------------------------------------------

function equipRpgCard(key, cardInstanceId, slotIndex) {
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  if (!account.rpgCards) account.rpgCards = [];
  if (!account.equippedCards) account.equippedCards = [];
  _migrateEquippedCards(account);

  // Find card in collection
  var card = null;
  for (var i = 0; i < account.rpgCards.length; i++) {
    if (account.rpgCards[i].instanceId === cardInstanceId) { card = account.rpgCards[i]; break; }
  }
  if (!card) return { error: 'Card not found in collection' };

  // Determine card type from template
  var tmpl = rpgData.CARD_BY_ID[card.cardId] || {};
  var cardType = tmpl.type || card.type || 'passive_perk';
  var isActive = rpgData.isActiveCardType(cardType);

  // Count currently equipped active vs passive cards
  var activeCount = 0, passiveCount = 0;
  for (var ci = 0; ci < account.equippedCards.length; ci++) {
    var eqId = account.equippedCards[ci];
    if (!eqId) continue;
    var eqCardType = _getEquippedCardType(account, eqId);
    if (rpgData.isActiveCardType(eqCardType)) activeCount++;
    else passiveCount++;
  }

  // Get slot limits
  var activeSlots = account.activeCardSlots || rpgData.getActiveCardSlotCount(account.level || 1);
  var passiveSlots = account.passiveCardSlots || rpgData.getPassiveCardSlotCount(account.level || 1);

  // Check if already equipped — unequip first
  var wasEquipped = false;
  for (var j = 0; j < account.equippedCards.length; j++) {
    if (account.equippedCards[j] === cardInstanceId) {
      account.equippedCards.splice(j, 1);
      // Adjust counts since we removed it
      if (isActive) activeCount--;
      else passiveCount--;
      wasEquipped = true;
      break;
    }
  }

  // Validate slot availability for this card type
  if (isActive && activeCount >= activeSlots) return { error: 'No active card slots available (have ' + activeCount + '/' + activeSlots + ')' };
  if (!isActive && passiveCount >= passiveSlots) return { error: 'No passive card slots available (have ' + passiveCount + '/' + passiveSlots + ')' };

  account.equippedCards.push(cardInstanceId);
  saveAccount(account);
  return { success: true, equippedCards: account.equippedCards, activeCardSlots: activeSlots, passiveCardSlots: passiveSlots };
}

function unequipRpgCard(key, cardInstanceId) {
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  if (!account.equippedCards) return { error: 'No equipped cards' };
  _migrateEquippedCards(account);

  // Support both old slot-index and new instanceId-based unequip
  if (typeof cardInstanceId === 'number') {
    // Legacy: slot-index based (remove the card at that index)
    if (cardInstanceId < 0 || cardInstanceId >= account.equippedCards.length) return { error: 'Invalid slot' };
    account.equippedCards.splice(cardInstanceId, 1);
  } else {
    // New: instance-ID based
    var idx = account.equippedCards.indexOf(cardInstanceId);
    if (idx === -1) return { error: 'Card not equipped' };
    account.equippedCards.splice(idx, 1);
  }

  saveAccount(account);
  return { success: true, equippedCards: account.equippedCards };
}

// Helper: get card type for an equipped instance ID
function _getEquippedCardType(account, instanceId) {
  for (var i = 0; i < account.rpgCards.length; i++) {
    if (account.rpgCards[i].instanceId === instanceId) {
      var tmpl = rpgData.CARD_BY_ID[account.rpgCards[i].cardId] || {};
      return tmpl.type || account.rpgCards[i].type || 'passive_perk';
    }
  }
  return 'passive_perk';
}

// Migration: convert old null-padded slot-indexed arrays to clean ID arrays
function _migrateEquippedCards(account) {
  if (!account.equippedCards || !Array.isArray(account.equippedCards)) {
    account.equippedCards = [];
    return;
  }
  // Remove null entries (from old slot-indexed format)
  var hasNulls = false;
  for (var i = 0; i < account.equippedCards.length; i++) {
    if (account.equippedCards[i] === null || account.equippedCards[i] === undefined) {
      hasNulls = true;
      break;
    }
  }
  if (hasNulls) {
    var clean = [];
    for (var j = 0; j < account.equippedCards.length; j++) {
      if (account.equippedCards[j]) clean.push(account.equippedCards[j]);
    }
    account.equippedCards = clean;
  }
  // Ensure split slot counts exist
  if (typeof account.activeCardSlots !== 'number') {
    account.activeCardSlots = rpgData.getActiveCardSlotCount(account.level || 1);
  }
  if (typeof account.passiveCardSlots !== 'number') {
    account.passiveCardSlots = rpgData.getPassiveCardSlotCount(account.level || 1);
  }
  if (typeof account.cardSlots !== 'number' || account.cardSlots < account.activeCardSlots + account.passiveCardSlots) {
    account.cardSlots = rpgData.getCardSlotCount(account.level || 1);
  }
}

// ---------------------------------------------------------------------------
// RPG: Card fusion
// ---------------------------------------------------------------------------

function fuseRpgCards(key, card1Id, card2Id) {
  if (card1Id === card2Id) return { error: 'Cannot fuse a card with itself' };
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  if (!account.rpgCards) return { error: 'No cards' };

  var card1 = null, card2 = null, idx1 = -1, idx2 = -1;
  for (var i = 0; i < account.rpgCards.length; i++) {
    if (account.rpgCards[i].instanceId === card1Id) { card1 = account.rpgCards[i]; idx1 = i; }
    if (account.rpgCards[i].instanceId === card2Id) { card2 = account.rpgCards[i]; idx2 = i; }
  }
  if (!card1 || !card2) return { error: 'Card not found' };

  // Cannot fuse equipped cards
  if (account.equippedCards) {
    for (var j = 0; j < account.equippedCards.length; j++) {
      if (account.equippedCards[j] === card1Id || account.equippedCards[j] === card2Id) {
        return { error: 'Unequip cards before fusing' };
      }
    }
  }

  var result = rpgData.fuseCards(card1, card2);
  if (result.error) return result;

  // Remove both source cards (remove higher index first to avoid shifting)
  var toRemove = [idx1, idx2].sort(function(a, b) { return b - a; });
  for (var k = 0; k < toRemove.length; k++) {
    account.rpgCards.splice(toRemove[k], 1);
  }
  // Add fused card
  account.rpgCards.push(result.card);

  saveAccount(account);
  return { success: true, newCard: result.card };
}

function getRpgCards(key) {
  var account = loadAccount(key);
  if (!account) return [];
  return account.rpgCards || [];
}

// ---------------------------------------------------------------------------
// RPG: Get equipped card effects (aggregated)
// ---------------------------------------------------------------------------

function getEquippedCardEffects(key) {
  var account = loadAccount(key);
  if (!account) return [];
  if (!account.rpgCards || !account.equippedCards) return [];

  var effects = [];
  var cardMap = {};
  for (var i = 0; i < account.rpgCards.length; i++) {
    cardMap[account.rpgCards[i].instanceId] = account.rpgCards[i];
  }
  for (var j = 0; j < account.equippedCards.length; j++) {
    var cid = account.equippedCards[j];
    if (cid && cardMap[cid]) {
      var card = cardMap[cid];
      for (var k = 0; k < card.effects.length; k++) {
        var eff = JSON.parse(JSON.stringify(card.effects[k]));
        // Apply racial bonus for racial_feat cards
        if (card.type === 'racial_feat' && card.raceBonus === account.race && eff.raceValue !== undefined) {
          eff.value = eff.raceValue;
        }
        effects.push(eff);
      }
    }
  }
  return effects;
}

// ---------------------------------------------------------------------------
// RPG: Mount management
// ---------------------------------------------------------------------------

function setMount(key, mountType) {
  var account = loadAccount(key);
  if (!account) return null;
  account.mount = mountType || null;
  saveAccount(account);
  return account.mount;
}

function getMount(key) {
  var account = loadAccount(key);
  if (!account) return null;
  return account.mount || null;
}

// ---------------------------------------------------------------------------
// Character Slots: create, switch, delete, list
// ---------------------------------------------------------------------------

function createCharacter(key, characterName, options) {
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  _migrateToMultiCharacter(account);
  if (account.characters.length >= (account.maxCharacters || MAX_CHARACTERS_PER_ACCOUNT)) {
    return { error: 'Max characters reached (' + (account.maxCharacters || MAX_CHARACTERS_PER_ACCOUNT) + ')' };
  }
  var safeName = sanitizeName(characterName || 'New Character').slice(0, 20) || 'New Character';
  var charData = {};
  for (var i = 0; i < CHARACTER_FIELDS.length; i++) {
    charData[CHARACTER_FIELDS[i]] = _getDefaultForField(CHARACTER_FIELDS[i]);
  }
  charData.name = safeName;
  charData.createdAt = Date.now();
  if (options && options.permadeath) {
    charData.permadeath = true;
  }
  account.characters.push(charData);
  saveAccount(account);
  return { success: true, characterIndex: account.characters.length - 1 };
}

function switchCharacter(key, targetIndex) {
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  _migrateToMultiCharacter(account);
  if (targetIndex < 0 || targetIndex >= account.characters.length) {
    return { error: 'Invalid character index' };
  }
  if (targetIndex === account.activeCharacterIndex) {
    return { error: 'Already on this character' };
  }
  // Save current character back into array
  var currentIdx = account.activeCharacterIndex;
  var currentChar = account.characters[currentIdx];
  for (var i = 0; i < CHARACTER_FIELDS.length; i++) {
    var field = CHARACTER_FIELDS[i];
    currentChar[field] = account[field] !== undefined ? account[field] : _getDefaultForField(field);
  }
  currentChar.name = account._characterName || currentChar.name;
  currentChar.createdAt = account._characterCreatedAt || currentChar.createdAt;
  // Promote target character to top level
  var targetChar = account.characters[targetIndex];
  _applyCharacterData(account, targetChar);
  account.activeCharacterIndex = targetIndex;
  saveAccount(account);
  return { success: true, activeCharacterIndex: targetIndex };
}

function deleteCharacter(key, targetIndex) {
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  _migrateToMultiCharacter(account);
  if (account.characters.length <= 1) {
    return { error: 'Cannot delete last character' };
  }
  if (targetIndex < 0 || targetIndex >= account.characters.length) {
    return { error: 'Invalid character index' };
  }
  if (targetIndex === account.activeCharacterIndex) {
    return { error: 'Cannot delete active character. Switch to another character first.' };
  }
  account.characters.splice(targetIndex, 1);
  // Adjust activeCharacterIndex if needed
  if (account.activeCharacterIndex > targetIndex) {
    account.activeCharacterIndex--;
  }
  saveAccount(account);
  return { success: true };
}

function getCharacterList(key) {
  var account = loadAccount(key);
  if (!account) return null;
  _migrateToMultiCharacter(account);
  var list = [];
  for (var i = 0; i < account.characters.length; i++) {
    list.push(_getCharacterSummary(account.characters[i], i));
  }
  return {
    characters: list,
    activeCharacterIndex: account.activeCharacterIndex,
    maxCharacters: account.maxCharacters || MAX_CHARACTERS_PER_ACCOUNT,
  };
}

// ---------------------------------------------------------------------------
// Hall of Heroes — permadeath memorial archive
// ---------------------------------------------------------------------------

var MAX_HALL_OF_HEROES = 50;

function archiveToHallOfHeroes(key, heroSnapshot) {
  var account = loadAccount(key);
  if (!account) return null;
  if (!account.hallOfHeroes) account.hallOfHeroes = [];
  account.hallOfHeroes.push(heroSnapshot);
  // FIFO: keep only the most recent MAX_HALL_OF_HEROES entries
  while (account.hallOfHeroes.length > MAX_HALL_OF_HEROES) {
    account.hallOfHeroes.shift();
  }
  saveAccount(account);
  return account.hallOfHeroes;
}

function getHallOfHeroes(key) {
  var account = loadAccount(key);
  if (!account) return [];
  if (!account.hallOfHeroes) account.hallOfHeroes = [];
  return account.hallOfHeroes;
}

// Delete the active character for permadeath (can delete last/active character)
// Switches to next available character or sets activeCharacterIndex = -1 if none left.
function deleteActiveCharacterForPermadeath(key) {
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  _migrateToMultiCharacter(account);

  var idx = account.activeCharacterIndex;
  if (idx < 0 || idx >= account.characters.length) {
    return { error: 'No active character' };
  }

  account.characters.splice(idx, 1);

  if (account.characters.length === 0) {
    // No characters left — set sentinel value
    account.activeCharacterIndex = -1;
    // Clear top-level character fields
    for (var i = 0; i < CHARACTER_FIELDS.length; i++) {
      account[CHARACTER_FIELDS[i]] = _getDefaultForField(CHARACTER_FIELDS[i]);
    }
    account._characterName = null;
    account._characterCreatedAt = null;
  } else {
    // Switch to the next valid character (or first if we were at end)
    var newIdx = idx < account.characters.length ? idx : account.characters.length - 1;
    account.activeCharacterIndex = newIdx;
    _applyCharacterData(account, account.characters[newIdx]);
  }

  saveAccount(account);
  return {
    success: true,
    hasCharactersLeft: account.characters.length > 0,
    activeCharacterIndex: account.activeCharacterIndex,
  };
}

function incrementLeviathanKill(key, leviathanId) {
  var account = loadAccount(key);
  if (!account) return null;
  if (!account.leviathanKills) account.leviathanKills = {};
  if (!account.leviathanKills[leviathanId]) account.leviathanKills[leviathanId] = 0;
  account.leviathanKills[leviathanId]++;
  account.leviathanTotalKills = (account.leviathanTotalKills || 0) + 1;
  saveAccount(account);
  return account;
}

module.exports = {
  createAccount,
  createTempAccount,
  promoteTempAccount,
  isTempAccount,
  loadAccount,
  saveAccount,
  updateChips,
  setChips,
  updateStats,
  deleteAccount,
  getPublicProfile,
  addFavoriteGif,
  removeFavoriteGif,
  getFavoriteGifs,
  getLeaderboard,
  addInventoryItem,
  removeInventoryItem,
  equipItem,
  unequipItem,
  getInventory,
  addCard,
  removeCard,
  getCards,
  setShowcase,
  getShowcase,
  updateClickerState,
  getClickerState,
  getSlotUpgrades,
  updateSlotUpgrades,
  getScratchUpgrades,
  updateScratchUpgrades,
  cleanupExpiredAccounts,
  isAccountExpired,
  getDiscriminator,
  getUserTag,
  findAccountByTag,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getFriendsData,
  flushAll,
  setPublicKey,
  getPublicKey: getPublicKeyE2E,
  storeDM,
  getDMHistory,
  getDMConversations,
  ACCOUNTS_DIR,
  MAX_INVENTORY,
  MAX_CARDS,
  MAX_SHOWCASE,
  MAX_FRIENDS,
  MAX_FRIEND_REQUESTS,
  MAX_BLOCKED,
  ACCOUNT_EXPIRY_DAYS,
  MAX_CHIPS,
  MAX_DM_CONVERSATIONS,
  MAX_DM_MESSAGES,
  hashPin,
  verifyPin,
  setPinForAccount,
  clearDMs,
  clearAllDMs,
  deleteDMMessage,
  reencryptAccounts,
  keyHashMap,
  _keyHash,
  searchUsernames,
  getMemberCount,
  getSkill,
  addSkillXp,
  xpForLevel,
  addResource,
  removeResource,
  acquireResourceLock: _acquireResourceLock,
  getMMOInventory,
  addMMOItem,
  removeMMOItem,
  getEquipment,
  equipMMOItem,
  unequipMMOItem,
  getEquippedWeaponStats,
  getEquippedHandStats,
  getDualWieldCombo,
  categorizeHandItem,
  DUAL_WIELD_COMBOS,
  getEquippedArmorTotal,
  getEquippedArmorStats,
  resolveItemStats,
  EQUIPMENT_SLOTS,
  WEAPON_TYPES,
  COMBAT_SKILL_FOR_CATEGORY,
  RARITY_COMBAT_LEVEL,
  // Durability system
  ARMOR_SLOTS,
  WEAPON_SLOTS,
  TOOL_SLOTS,
  JEWELRY_SLOTS,
  ensureItemDurability,
  reduceDurability,
  reduceArmorDurability,
  reduceWeaponDurability,
  getEquipmentDurability,
  repairEquipmentSlot,
  isItemBroken,
  getItemMaterial,
  getMaxDurability,
  DURABILITY_BY_MATERIAL,
  REPAIR_MATERIAL_COST,
  getPlotId,
  setPlotId,
  getLastLocation,
  setLastLocation,
  // RPG
  setRace,
  allocateStatPoint,
  getComputedStats,
  addPendingPack,
  openPendingPack,
  equipRpgCard,
  unequipRpgCard,
  fuseRpgCards,
  getRpgCards,
  getEquippedCardEffects,
  selectAwakening,
  setMount,
  getMount,
  rpgData,
  acquireCardLock,
  releaseCardLock,
  // Character slots
  MAX_CHARACTERS_PER_ACCOUNT,
  CHARACTER_FIELDS,
  createCharacter,
  switchCharacter,
  deleteCharacter,
  getCharacterList,
  // Permadeath / Hall of Heroes
  archiveToHallOfHeroes,
  getHallOfHeroes,
  deleteActiveCharacterForPermadeath,
  // Leviathan kill tracking
  incrementLeviathanKill,
  // Shard bridge: import account from master server into local cache
  importAccount,
};

// Import an account object from the master server into the local cache.
// Used by shard-bridge.js to inject character data without needing disk files.
function importAccount(accountData) {
  if (!accountData || !accountData.key) return null;
  accountCache.set(accountData.key, accountData);
  return accountData;
}

function getMemberCount() {
  return _leaderboardCache ? _leaderboardCache.length : 0;
}

// Search permanent accounts by partial username (uses leaderboard cache)
function searchUsernames(query, limit) {
  limit = limit || 10;
  if (!query || typeof query !== 'string') return [];
  var q = query.toLowerCase().trim();
  if (q.length < 1) return [];
  var results = [];
  var seen = new Set();
  // Search leaderboard cache first (already loaded in memory)
  if (_leaderboardCache) {
    for (var i = 0; i < _leaderboardCache.length; i++) {
      var entry = _leaderboardCache[i];
      if (entry.username && entry.username.toLowerCase().indexOf(q) !== -1) {
        var key = entry.username.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ name: entry.username, color: entry.color || '#f0b232', tag: entry.tag || '' });
          if (results.length >= limit) return results;
        }
      }
    }
  }
  // Also scan accountCache for any not in leaderboard
  for (var [, acc] of accountCache) {
    if (acc && acc.username && !acc.temp && acc.username.toLowerCase().indexOf(q) !== -1) {
      var k = acc.username.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        results.push({ name: acc.username, color: acc.color || '#f0b232', tag: '' });
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}
