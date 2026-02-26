// server.js — Main entry point for MMOLite
// Pokemon-style MMO game server. Love2D client connects via Socket.IO.

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Write PID to file so the LOVE client can shut us down cleanly
if (process.env.MMOLITE_PID_FILE) {
  try { fs.writeFileSync(process.env.MMOLITE_PID_FILE, String(process.pid)); } catch (_) {}
}

// Load env vars from /etc/mmolite/app.env (secrets stay out of source code)
try {
  var _envFile = process.env.MMOLITE_ENV_FILE || '/etc/mmolite/app.env';
  if (fs.existsSync(_envFile)) {
    var _envLines = fs.readFileSync(_envFile, 'utf8').split('\n');
    for (var _ei = 0; _ei < _envLines.length; _ei++) {
      var _line = _envLines[_ei].trim();
      if (!_line || _line[0] === '#') continue;
      var _eq = _line.indexOf('=');
      if (_eq > 0) {
        var _k = _line.slice(0, _eq).trim();
        var _v = _line.slice(_eq + 1).trim();
        if (!process.env[_k]) process.env[_k] = _v;
      }
    }
  }
} catch (_envErr) {
  console.error('[server] Warning: Could not load env file:', _envErr.message);
}

const express = require('express');
const http = require('http');
const { createServer } = http;
const { Server } = require('socket.io');
const { setupSocket, socketAccountMap, createDepsFactory, _stockMarket, _auctionHouse, sessionTokens, setDirector } = require('./socket');
const director = require('./director');
const nsGames = require('./handlers/namespace-games');
const nsMarket = require('./handlers/namespace-market');
const accounts = require('./accounts');
const state = require('./state');
const { Worker } = require('worker_threads');
const { LobbyManager } = require('./cardgames');
const { CoinFlipManager } = require('./coinflip');
let HorseRacingManager, ChessManager;
try { HorseRacingManager = require('./horseracing').HorseRacingManager; } catch(e) { console.warn('[server] horseracing module not found, horse racing disabled'); }
try { ChessManager = require('./chess').ChessManager; } catch(e) { console.warn('[server] chess module not found, chess disabled'); }
let PoolManager;
try { PoolManager = require('./pool').PoolManager; } catch(e) { console.warn('[server] pool module not found, pool disabled'); }
const loot = require('./loot');
const ratelimit = require('./ratelimit');
const pow = require('./pow');
const shardBridge = require('./shard-bridge');
const overworldStructures = require('./overworld-structures');

const redis = require('./redis');
const db = require('./db');
const compression = require('compression');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
const server = createServer(app);

app.use(compression());
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// Security headers (simplified — no web UI to protect)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.removeHeader('X-Powered-By');
  // Debug: log socket.io HTTP requests (only when DEBUG env var is set)
  if (process.env.DEBUG && req.url && req.url.startsWith('/socket.io/')) {
    const sid = req.query && req.query.sid ? req.query.sid.substring(0, 8) + '...' : 'none';
    console.log('[http] ' + req.method + ' sid=' + sid + ' t=' + (req.query && req.query.t || '?'));
    const origEnd = res.end;
    res.end = function() {
      console.log('[http] RES ' + req.method + ' sid=' + sid + ' status=' + res.statusCode + ' len=' + (res.getHeader('Content-Length') || '?'));
      origEnd.apply(res, arguments);
    };
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (res.statusCode >= 400 || ms > 2000) {
      console.log('[api] ' + req.method + ' ' + req.path + ' ' + res.statusCode + ' ' + ms + 'ms ip=' + (ratelimit.getIp(req) || '?'));
    }
  });
  next();
});

// Socket.IO — Love2D clients don't send Origin headers, so allow null origin
// In production, only allow origins specified via ALLOWED_ORIGINS env var (comma-separated)
const ALLOWED_ORIGINS = [];
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(function(o) {
    var trimmed = o.trim();
    if (trimmed) ALLOWED_ORIGINS.push(trimmed);
  });
}
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:8443');
}
var socketTransports = process.env.SOCKET_TRANSPORTS
  ? process.env.SOCKET_TRANSPORTS.split(',').map(function(t) { return t.trim(); })
  : ['websocket'];
const io = new Server(server, {
  path: '/socket.io/',
  transports: socketTransports,
  maxHttpBufferSize: 500000,
  pingInterval: 10000,
  pingTimeout: 5000,
  perMessageDeflate: {
    zlibDeflateOptions: { level: 1 },
    threshold: 1024,
    serverMaxWindowBits: 13,
  },
  cors: {
    origin: function(origin, cb) {
      // Love2D clients send no Origin header — allow null origin
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      // In dev mode with no ALLOWED_ORIGINS configured, allow all for convenience
      if (process.env.NODE_ENV !== 'production') return cb(null, true);
      // Production: reject unknown origins
      return cb('Origin not allowed', false);
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
  allowRequest: (req, cb) => {
    // Love2D sends no Origin — skip origin check, keep connection limit
    if (ratelimit.getConnectionCount() >= ratelimit.MAX_GLOBAL_CONNECTIONS) {
      return cb('Server full', false);
    }
    cb(null, true);
  },
});

// ---------------------------------------------------------------------------
// Redis adapter for multi-process (PM2 cluster) support
// ---------------------------------------------------------------------------
if (process.env.OFFLINE_MODE !== '1') {
  redis.ready.then(function(ok) {
    if (ok && redis.pubClient && redis.subClient) {
      try {
        var createAdapter = require('@socket.io/redis-adapter').createAdapter;
        io.adapter(createAdapter(redis.pubClient, redis.subClient));
        console.log('[server] Redis adapter attached for multi-process support');
      } catch (err) {
        console.warn('[server] Could not attach Redis adapter:', err.message);
      }
      // Initialize cross-process state sync
      state.initSync(redis).catch(function() {});
    }
  }).catch(function() {});
}

// ---------------------------------------------------------------------------
// Game Worker thread — BossOrbs + BossBrawl physics run off the main thread
// ---------------------------------------------------------------------------

let gameWorker = new Worker(path.join(__dirname, 'game-worker.js'));

const gameProxy = createGameProxy(gameWorker);
const lieroProxy = createLieroProxy(gameWorker);

const lobbyManager = new LobbyManager();
const coinFlipManager = new CoinFlipManager();
const horseRacingManager = HorseRacingManager ? new HorseRacingManager() : null;
const chessManager = ChessManager ? new ChessManager() : null;
const poolManager = PoolManager ? new PoolManager() : null;
setupSocket(io, gameProxy, lobbyManager, {}, coinFlipManager, lieroProxy, horseRacingManager);

// Initialize AI Event Director
setDirector(director);
director.init(io, state, accounts, socketAccountMap);

// Initialize overworld structures system
overworldStructures.init(state);

// Overworld structures tick (every 5 minutes — spawn/expire structures)
setInterval(function() {
  try {
    overworldStructures.tick(state, io);
  } catch (err) {
    console.error('[server] Overworld structures tick error:', err.message);
  }
}, 5 * 60 * 1000);
// Run first tick after 30s to let server warm up
setTimeout(function() {
  try {
    overworldStructures.tick(state, io);
  } catch (err) {
    console.error('[server] Overworld structures initial tick error:', err.message);
  }
}, 30000);

// Set up /games and /market namespaces
const depsFactory = createDepsFactory(io, gameProxy, lobbyManager, coinFlipManager, lieroProxy, horseRacingManager, chessManager, poolManager);
const gamesNs = nsGames.setup(io, depsFactory, sessionTokens);
const marketNs = nsMarket.setup(io, depsFactory, sessionTokens);

// ---------------------------------------------------------------------------
// Game Proxy — stands in for GameManager on the main thread
// ---------------------------------------------------------------------------
function createGameProxy(worker) {
  const _callbacks = new Map();
  let _nextId = 0;
  const _playerInstances = new Map();

  function _send(msg, callback) {
    if (callback) {
      msg.reqId = _nextId++;
      _callbacks.set(msg.reqId, callback);
    }
    try {
      (proxy._worker || worker).postMessage(msg);
    } catch (err) {
      console.error('[game-proxy] postMessage failed:', err.message);
      if (msg.reqId !== undefined) _callbacks.delete(msg.reqId);
    }
  }

  var proxy = {
    _callbacks: _callbacks,
    _playerInstances: _playerInstances,
    _worker: null,
    findBestInstance: function() { return 'main'; },
    getPlayerInstance: function(socketId) { return _playerInstances.get(socketId) || null; },
    getInstanceList: function(callback) { _send({ type: 'orbs_get_instances' }, callback); },
    updateInput: function(socketId, x, y, boost) {
      try { (proxy._worker || worker).postMessage({ type: 'orbs_move', socketId: socketId, x: x, y: y, boost: boost }); } catch (_) {}
    },
    joinBestInstance: function(socketId, name, color, instanceId, callback) {
      _send({ type: 'orbs_join', socketId: socketId, name: name, color: color, instanceId: instanceId || null }, callback);
    },
    removePlayer: function(socketId) {
      _playerInstances.delete(socketId);
      try { (proxy._worker || worker).postMessage({ type: 'orbs_leave', socketId: socketId }); } catch (_) {}
    },
    disconnectCleanup: function(socketId) {
      _playerInstances.delete(socketId);
      try { (proxy._worker || worker).postMessage({ type: 'disconnect', socketId: socketId }); } catch (_) {}
    },
    handleMessage: function(msg) {
      if (msg.reqId !== undefined && _callbacks.has(msg.reqId)) {
        _callbacks.get(msg.reqId)(msg);
        _callbacks.delete(msg.reqId);
      }
      if (msg.type === 'orbs_joined' && msg.instanceId) _playerInstances.set(msg.socketId, msg.instanceId);
      if (msg.type === 'orbs_left') _playerInstances.delete(msg.socketId);
    },
  };
  return proxy;
}

// ---------------------------------------------------------------------------
// Liero Proxy — stands in for LieroManager on the main thread
// ---------------------------------------------------------------------------
function createLieroProxy(worker) {
  const _callbacks = new Map();
  let _nextId = 0;
  const _playerLobbies = new Map();

  function _send(msg, callback) {
    if (callback) {
      msg.reqId = _nextId++;
      _callbacks.set(msg.reqId, callback);
    }
    (proxy._worker || worker).postMessage(msg);
  }

  var proxy = {
    _callbacks: _callbacks,
    _playerLobbies: _playerLobbies,
    _worker: null,
    getPlayerLobbyId: function(socketId) { return _playerLobbies.get(socketId) || null; },
    getLobbies: function(callback) { _send({ type: 'liero_get_lobbies' }, callback); },
    getLobbyState: function(lobbyId, callback) { _send({ type: 'liero_get_lobby_state', lobbyId: lobbyId }, callback); },
    createLobby: function(socketId, name, color, settings, weapons, spell, callback) {
      _send({ type: 'liero_create', socketId: socketId, name: name, color: color, settings: settings, weapons: weapons, spell: spell }, callback);
    },
    joinLobby: function(socketId, lobbyId, name, color, weapons, spell, callback) {
      _send({ type: 'liero_join', socketId: socketId, lobbyId: lobbyId, name: name, color: color, weapons: weapons, spell: spell }, callback);
    },
    leaveLobby: function(socketId, callback) {
      _playerLobbies.delete(socketId);
      _send({ type: 'liero_leave', socketId: socketId }, callback);
    },
    startGame: function(lobbyId, socketId, callback) {
      _send({ type: 'liero_start', lobbyId: lobbyId, socketId: socketId }, callback);
    },
    handleInput: function(socketId, input) {
      (proxy._worker || worker).postMessage({ type: 'liero_input', socketId: socketId, input: input });
    },
    addBot: function(lobbyId, requesterId, callback) {
      _send({ type: 'liero_add_bot', lobbyId: lobbyId, requesterId: requesterId }, callback);
    },
    removeBot: function(lobbyId, botId, requesterId, callback) {
      _send({ type: 'liero_remove_bot', lobbyId: lobbyId, botId: botId, requesterId: requesterId }, callback);
    },
    disconnectCleanup: function(socketId) {
      _playerLobbies.delete(socketId);
      (proxy._worker || worker).postMessage({ type: 'disconnect', socketId: socketId });
    },
    handleMessage: function(msg) {
      if (msg.reqId !== undefined && _callbacks.has(msg.reqId)) {
        _callbacks.get(msg.reqId)(msg);
        _callbacks.delete(msg.reqId);
      }
      if (msg.type === 'liero_created' && msg.lobbyId) _playerLobbies.set(msg.socketId, msg.lobbyId);
      if (msg.type === 'liero_joined' && msg.success && msg.lobbyId) _playerLobbies.set(msg.socketId, msg.lobbyId);
      if (msg.type === 'liero_left') _playerLobbies.delete(msg.socketId);
    },
  };
  return proxy;
}

// ---------------------------------------------------------------------------
// Worker message handler — broadcasts game state via Socket.IO
// ---------------------------------------------------------------------------
function _handleWorkerMessage(msg) {
  switch (msg.type) {
    case 'orbs_tick': {
      var ticks = msg.ticks;
      for (var ti = 0; ti < ticks.length; ti++) {
        var t = ticks[ti];
        var roomName = 'game_' + t.instanceId;
        if (t.playerCount > 20) {
          for (var nsi = 0; nsi < 2; nsi++) {
            var ns = nsi === 0 ? io.sockets : gamesNs;
            var room = ns.adapter.rooms.get(roomName);
            if (!room) continue;
            for (var sid of room) {
              var s = ns.sockets ? ns.sockets.get(sid) : null;
              if (!s) continue;
              var myPlayer = null;
              for (var pi = 0; pi < t.allPlayers.length; pi++) {
                if (t.allPlayers[pi].id === sid) { myPlayer = t.allPlayers[pi]; break; }
              }
              if (!myPlayer) {
                s.emit('game_players', { players: t.allPlayers, leaderboard: t.leaderboard });
                continue;
              }
              var halfW = 1600 * 0.6, halfH = 1200 * 0.6;
              var visible = [];
              for (var vi = 0; vi < t.allPlayers.length; vi++) {
                var other = t.allPlayers[vi];
                if (Math.abs(other.x - myPlayer.x) < halfW && Math.abs(other.y - myPlayer.y) < halfH) visible.push(other);
              }
              s.emit('game_players', { players: visible, leaderboard: t.leaderboard });
            }
          }
        } else {
          var playersState = { players: t.allPlayers, leaderboard: t.leaderboard };
          io.to(roomName).emit('game_players', playersState);
          gamesNs.to(roomName).emit('game_players', playersState);
        }
        if (t.eatenOrbs.length > 0) {
          var eatenBatch = { orbs: t.eatenOrbs };
          io.to(roomName).emit('game_orbs_eaten', eatenBatch);
          gamesNs.to(roomName).emit('game_orbs_eaten', eatenBatch);
        }
        if (t.spawnedOrbs.length > 0) {
          var spawnedBatch = { orbs: t.spawnedOrbs };
          io.to(roomName).emit('game_orbs_spawned', spawnedBatch);
          gamesNs.to(roomName).emit('game_orbs_spawned', spawnedBatch);
        }
        for (var ei = 0; ei < t.eatenPlayers.length; ei++) {
          var ep = t.eatenPlayers[ei];
          io.to(roomName).emit('game_player_eaten', ep);
          gamesNs.to(roomName).emit('game_player_eaten', ep);
          var killerAccKey = socketAccountMap.get(ep.by);
          if (killerAccKey) {
            var chipReward = 50;
            var newChips = accounts.updateChips(killerAccKey, chipReward);
            var killerSocket = io.sockets.sockets.get(ep.by) || gamesNs.sockets.get(ep.by);
            if (killerSocket && newChips !== null) {
              killerSocket.emit('chips_updated', { chips: newChips, reason: 'Ate ' + ep.eatenName + '! +' + chipReward });
            }
          }
        }
      }
      break;
    }

    case 'liero_tick': {
      var broadcasts = msg.broadcasts;
      for (var bi = 0; bi < broadcasts.length; bi++) {
        var b = broadcasts[bi];
        var lRoomName = 'liero_' + b.lobbyId;
        io.to(lRoomName).emit('liero_tick', { players: b.players, projectiles: b.projectiles, pickups: b.pickups });
        gamesNs.to(lRoomName).emit('liero_tick', { players: b.players, projectiles: b.projectiles, pickups: b.pickups });
        if (b.terrainDeltas && b.terrainDeltas.length > 0) {
          io.to(lRoomName).emit('liero_terrain_delta', { changes: b.terrainDeltas });
          gamesNs.to(lRoomName).emit('liero_terrain_delta', { changes: b.terrainDeltas });
        }
        if (b.kills) {
          for (var ki = 0; ki < b.kills.length; ki++) {
            io.to(lRoomName).emit('liero_player_killed', b.kills[ki]);
            gamesNs.to(lRoomName).emit('liero_player_killed', b.kills[ki]);
          }
        }
        if (b.respawns) {
          for (var ri = 0; ri < b.respawns.length; ri++) {
            io.to(lRoomName).emit('liero_player_respawn', b.respawns[ri]);
            gamesNs.to(lRoomName).emit('liero_player_respawn', b.respawns[ri]);
          }
        }
        if (b.pickupSpawns) {
          for (var psi = 0; psi < b.pickupSpawns.length; psi++) {
            io.to(lRoomName).emit('liero_pickup_spawned', { pickup: b.pickupSpawns[psi] });
            gamesNs.to(lRoomName).emit('liero_pickup_spawned', { pickup: b.pickupSpawns[psi] });
          }
        }
        if (b.pickupCollections) {
          for (var pci = 0; pci < b.pickupCollections.length; pci++) {
            io.to(lRoomName).emit('liero_pickup_collected', b.pickupCollections[pci]);
            gamesNs.to(lRoomName).emit('liero_pickup_collected', b.pickupCollections[pci]);
          }
        }
        if (b.spellCasts) {
          for (var sci = 0; sci < b.spellCasts.length; sci++) {
            io.to(lRoomName).emit('liero_spell_cast', b.spellCasts[sci]);
            gamesNs.to(lRoomName).emit('liero_spell_cast', b.spellCasts[sci]);
          }
        }
        if (b.gameOver) {
          io.to(lRoomName).emit('liero_game_over', b.gameOver);
          gamesNs.to(lRoomName).emit('liero_game_over', b.gameOver);
          if (b.gameOver.chipRewards) {
            for (var pid of Object.keys(b.gameOver.chipRewards || {})) {
              var accKey = socketAccountMap.get(pid);
              if (accKey) {
                var reward = b.gameOver.chipRewards[pid];
                var newC = accounts.updateChips(accKey, reward);
                var sock = io.sockets.sockets.get(pid) || gamesNs.sockets.get(pid);
                if (sock && newC !== null) sock.emit('chips_updated', { chips: newC, reason: 'BossBrawl: +' + reward + ' chips' });
              }
            }
          }
          var lLobbies = msg.lobbies || [];
          io.to('liero_lobby').emit('liero_lobbies_updated', { lobbies: lLobbies });
          gamesNs.to('liero_lobby').emit('liero_lobbies_updated', { lobbies: lLobbies });
        }
      }
      break;
    }

    case 'orbs_disconnect_cleanup': {
      var dRoomName = 'game_' + msg.instanceId;
      io.to(dRoomName).emit('game_player_left', { id: msg.socketId });
      gamesNs.to(dRoomName).emit('game_player_left', { id: msg.socketId });
      break;
    }

    case 'liero_disconnect_cleanup': {
      if (!msg.destroyed && msg.lobbyState) {
        io.to('liero_' + msg.lobbyId).emit('liero_lobby_update', { lobby: msg.lobbyState });
        gamesNs.to('liero_' + msg.lobbyId).emit('liero_lobby_update', { lobby: msg.lobbyState });
      }
      io.to('liero_lobby').emit('liero_lobbies_updated', { lobbies: msg.lobbies });
      gamesNs.to('liero_lobby').emit('liero_lobbies_updated', { lobbies: msg.lobbies });
      break;
    }

    case 'ready':
      console.log('[server] Game worker thread is ready');
      break;

    default:
      break;
  }
}

gameWorker.on('message', function(msg) {
  try {
    gameProxy.handleMessage(msg);
    lieroProxy.handleMessage(msg);
    _handleWorkerMessage(msg);
  } catch (err) {
    console.error('[server] Worker message handler error:', err.message);
  }
});

gameWorker.on('error', function(err) {
  console.error('[server] Game worker error:', err.message);
});

gameWorker.on('exit', function(code) {
  console.error('[server] Game worker exited with code', code, '-- respawning...');
  _respawnGameWorker();
});

var _workerRespawnCount = 0;
function _respawnGameWorker() {
  _workerRespawnCount++;
  if (_workerRespawnCount > 10) {
    console.error('[server] Game worker respawn limit exceeded (10). Giving up.');
    return;
  }
  var delay = Math.min(5000, 500 * _workerRespawnCount);
  setTimeout(function() {
    try {
      var newWorker = new Worker(path.join(__dirname, 'game-worker.js'));
      gameProxy._worker = newWorker;
      lieroProxy._worker = newWorker;
      gameProxy._callbacks.clear();
      lieroProxy._callbacks.clear();
      gameProxy._playerInstances.clear();
      lieroProxy._playerLobbies.clear();
      newWorker.on('message', function(msg) {
        try {
          gameProxy.handleMessage(msg);
          lieroProxy.handleMessage(msg);
          _handleWorkerMessage(msg);
        } catch (err) {
          console.error('[server] Worker message handler error:', err.message);
        }
      });
      newWorker.on('error', function(err) { console.error('[server] Game worker error:', err.message); });
      newWorker.on('exit', function(c) { console.error('[server] Game worker exited with code', c, '-- respawning...'); _respawnGameWorker(); });
      gameWorker = newWorker;
      console.log('[server] Game worker respawned (#' + _workerRespawnCount + ')');
      setTimeout(function() { if (newWorker === gameWorker) _workerRespawnCount = 0; }, 5 * 60 * 1000);
    } catch (err) {
      console.error('[server] Failed to respawn game worker:', err.message);
    }
  }, delay);
}

// Redirect stock market ticks to namespaces
_stockMarket.onTick = function(marketState) {
  var marketRoom = marketNs.adapter.rooms.get('stock_market');
  if (marketRoom && marketRoom.size > 0) marketNs.to('stock_market').emit('stock_market_tick', marketState);
  var defaultRoom = io.sockets.adapter.rooms.get('stock_market');
  if (defaultRoom && defaultRoom.size > 0) io.to('stock_market').emit('stock_market_tick', marketState);
};
_stockMarket.onEvent = function(event) {
  var marketRoom = marketNs.adapter.rooms.get('stock_market');
  if (marketRoom && marketRoom.size > 0) marketNs.to('stock_market').emit('stock_market_event', event);
  var defaultRoom = io.sockets.adapter.rooms.get('stock_market');
  if (defaultRoom && defaultRoom.size > 0) io.to('stock_market').emit('stock_market_event', event);
};

// CORS for REST API — use same origin policy as Socket.IO
app.use('/api', function(req, res, next) {
  var origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---------------------------------------------------------------------------
// Master API Proxy — forwards master-specific routes to localhost:MASTER_PORT
// This allows remote shards to reach the master API through the shard's port
// when the master port is not externally accessible.
// ---------------------------------------------------------------------------
var MASTER_PORT = process.env.MASTER_PORT || 4000;
var MASTER_PROXY_PATHS = [
  '/api/shards',
  '/api/accounts/authenticate',
  '/api/accounts/create',
  '/api/accounts/set-pin',
  '/api/characters/checkout',
  '/api/characters/checkin',
  '/api/characters/save',
];

function proxyToMaster(req, res) {
  // Body already parsed by express.json() — re-serialize for forwarding
  var postData = (req.body && Object.keys(req.body).length > 0) ? JSON.stringify(req.body) : '';
  var options = {
    hostname: '127.0.0.1',
    port: MASTER_PORT,
    path: req.originalUrl,
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'X-Shard-Secret': req.headers['x-shard-secret'] || '',
    },
    timeout: 10000,
  };
  var proxyReq = http.request(options, function(proxyRes) {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxyReq.on('error', function(err) {
    res.status(502).json({ error: 'Master server unavailable: ' + err.message });
  });
  proxyReq.on('timeout', function() {
    proxyReq.destroy();
    res.status(504).json({ error: 'Master server timeout' });
  });
  if (postData) proxyReq.write(postData);
  proxyReq.end();
}

// Only proxy if this shard is co-located with the master (master mode + local master)
if (shardBridge.isMasterMode && shardBridge.config.masterServerUrl &&
    (shardBridge.config.masterServerUrl.includes('127.0.0.1') || shardBridge.config.masterServerUrl.includes('localhost'))) {
  MASTER_PROXY_PATHS.forEach(function(p) {
    app.all(p, proxyToMaster);
    // Also handle subpaths
    app.all(p + '/*', proxyToMaster);
  });
  console.log('[server] Master API proxy enabled on port ' + (process.env.PORT || shardBridge.config.port || '?') + ' -> localhost:' + MASTER_PORT);
}

// ---------------------------------------------------------------------------
// REST endpoints — MMO
// ---------------------------------------------------------------------------

app.get('/api/zones', (req, res) => {
  const clientIp = ratelimit.getIp(req);
  if (clientIp && !ratelimit.check(clientIp, 'api_zones', 20, 60000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  res.json({ zones: state.getZoneList() });
});

app.get('/api/zone/:id/players', (req, res) => {
  const clientIp = ratelimit.getIp(req);
  if (clientIp && !ratelimit.check(clientIp, 'api_zone_players', 30, 60000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  var zoneId = req.params.id;
  var zone = state.zones.get(zoneId);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });
  res.json({ zoneId: zoneId, playerCount: zone.members.size, players: state.getPlayersInZone(zoneId) });
});

app.get('/api/account/lookup/:key', (req, res) => {
  if (!req.params.key || req.params.key.length < 12 || !/^[a-zA-Z0-9]+$/.test(req.params.key)) {
    return res.status(400).json({ error: 'Invalid key format' });
  }
  const clientIp = ratelimit.getIp(req);
  if (clientIp && !ratelimit.check(clientIp, 'account_lookup', 3, 60000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  const profile = accounts.getPublicProfile(req.params.key);
  setTimeout(() => {
    if (!profile) return res.json({ username: null, color: null });
    res.json({ username: profile.username, color: profile.color });
  }, 50 + Math.random() * 50);
});

app.get('/api/health', (req, res) => {
  const clientIp = ratelimit.getIp(req);
  if (clientIp && !ratelimit.check(clientIp, 'api_health', 60, 60000, { skipViolation: true })) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    zones: state.zones.size,
    players: state.users.size,
    world: {
      timeOfDay: state.world.timeOfDay,
      weather: state.world.weather,
    },
    shard: {
      id: shardBridge.config.shardId,
      name: shardBridge.config.shardName,
      version: shardBridge.config.version,
      masterMode: shardBridge.isMasterMode,
    },
  });
});

// ---------------------------------------------------------------------------
// REST endpoints — Proof-of-Work challenge
// ---------------------------------------------------------------------------
app.get('/api/pow/challenge', (req, res) => {
  const type = req.query.type === 'account' ? 'account' : 'connect';
  const clientIp = ratelimit.getIp(req);
  if (clientIp && !ratelimit.check(clientIp, 'pow_challenge', 60, 3600000, { skipViolation: true })) {
    return res.status(429).json({ error: 'Too many challenge requests.' });
  }
  const challenge = pow.generateChallenge(type);
  res.json(challenge);
});

// ---------------------------------------------------------------------------
// REST endpoints — Admin (deploy tooling)
// ---------------------------------------------------------------------------
app.post('/api/admin/update-warning', (req, res) => {
  var adminSecret = process.env.ADMIN_DEPLOY_SECRET;
  if (!adminSecret) return res.status(503).json({ error: 'Not configured' });
  var auth = req.headers['authorization'] || '';
  var expected = 'Bearer ' + adminSecret;
  var authBuf = Buffer.from(auth, 'utf8');
  var expectedBuf = Buffer.from(expected, 'utf8');
  if (authBuf.length !== expectedBuf.length || !require('crypto').timingSafeEqual(authBuf, expectedBuf)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.body && req.body.clear) {
    io.emit('update_warning', { message: null, clear: true });
    console.log('[admin] Update warning cleared via API');
    return res.json({ success: true, action: 'cleared' });
  }
  var message = (req.body && typeof req.body.message === 'string')
    ? req.body.message.slice(0, 200)
    : 'Server update incoming. May be briefly unavailable.';
  var minutesLeft = (req.body && typeof req.body.minutesLeft === 'number')
    ? req.body.minutesLeft : null;
  io.emit('update_warning', { message: message, minutesLeft: minutesLeft });
  console.log('[admin] Update warning triggered: ' + message);
  res.json({ success: true, message: message });
});

// Block scanner probes
const BLOCKED_PATHS = [
  '/.env', '/.git/*', '/.htaccess', '/.htpasswd',
  '/wp-admin*', '/wp-login*', '/wp-content*', '/wp-includes*',
  '/server.js', '/package.json', '/package-lock.json', '/node_modules*',
  '/metrics', '/graphql', '/swagger', '/swagger-ui*', '/api-docs*',
  '/admin', '/admin/*', '/debug', '/debug/*',
  '/phpinfo*', '/phpmyadmin*', '/xmlrpc.php',
  '/actuator*', '/console', '/config*',
];
app.all(BLOCKED_PATHS, (req, res) => {
  console.log('[security] Blocked path probe: ' + req.path + ' ip=' + (ratelimit.getIp(req) || '?'));
  res.status(404).send('Not found');
});

// Catch-all for unmatched routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.all('*', (req, res) => {
  res.status(404).send('MMOLite game server. Connect via Love2D client.');
});

// ---------------------------------------------------------------------------
// Zone tick broadcast — send player positions per zone
// ---------------------------------------------------------------------------
setInterval(function() {
  var worldPayload = { time: state.world.timeOfDay, weather: state.world.weather };
  for (var entry of state.zones) {
    var zoneId = entry[0];
    var zone = entry[1];
    if (zone.members.size > 0) {
      if (zone.chunkCache && zone.members.size > 20) {
        // Large chunk-based zones: send per-player filtered positions (nearby only)
        var RADIUS_SQ = 2560 * 2560; // ~5 chunks
        for (var sid of zone.members) {
          var myPos = state.playerPositions.get(sid);
          if (!myPos) continue;
          var nearby = [];
          for (var otherId of zone.members) {
            var oPos = state.playerPositions.get(otherId);
            if (!oPos) continue;
            var dx = oPos.x - myPos.x, dy = oPos.y - myPos.y;
            if (dx * dx + dy * dy < RADIUS_SQ) {
              nearby.push({ id: otherId, x: oPos.x, y: oPos.y, f: oPos.facing });
            }
          }
          io.to(sid).emit('zone_tick', { players: nearby, time: worldPayload.time, weather: worldPayload.weather });
        }
      } else {
        // Small zones or few players: broadcast all positions
        var positions = [];
        for (var sid of zone.members) {
          var pos = state.playerPositions.get(sid);
          if (pos) positions.push({ id: sid, x: pos.x, y: pos.y, f: pos.facing });
        }
        io.to('zone:' + zoneId).emit('zone_tick', {
          players: positions,
          time: worldPayload.time,
          weather: worldPayload.weather,
        });
      }
    }
  }
}, 10000); // Recovery-only sync every 10s (real-time updates via zone_move deltas)

// Event loop lag monitoring
try {
  var perfHooks = require('perf_hooks');
  var eld = perfHooks.monitorEventLoopDelay({ resolution: 50 });
  eld.enable();
  setInterval(function() {
    var p99 = eld.percentile(99) / 1e6; // ns -> ms
    var mean = eld.mean / 1e6;
    if (p99 > 100) {
      console.warn('[perf] Event loop lag — mean=' + mean.toFixed(1) + 'ms p99=' + p99.toFixed(1) + 'ms');
    }
    eld.reset();
  }, 30000);
} catch (_perfErr) {
  // perf_hooks not available on older Node versions
}

// World time cycle — advance day/night every minute
setInterval(function() {
  state.advanceWorldTime();
  io.emit('world_time', { timeOfDay: state.world.timeOfDay, weather: state.world.weather });
}, 60000);

// ---------------------------------------------------------------------------
// Daily wipe — ephemeral state resets at midnight UTC (accounts persist)
// ---------------------------------------------------------------------------
function scheduleNextWipe() {
  const now = new Date();
  const nextMidnight = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0
  ));
  const msUntilMidnight = nextMidnight.getTime() - now.getTime();

  const ms5 = msUntilMidnight - 5 * 60 * 1000;
  if (ms5 > 0) {
    setTimeout(() => {
      io.emit('wipe_warning', { message: 'Server wipe in 5 minutes. Zone state will be cleared.', minutesLeft: 5 });
    }, ms5);
  }

  const ms1 = msUntilMidnight - 60 * 1000;
  if (ms1 > 0) {
    setTimeout(() => {
      io.emit('wipe_warning', { message: 'Server wipe in 1 minute.', minutesLeft: 1 });
    }, ms1);
  }

  setTimeout(() => {
    io.emit('server_wipe', { message: 'Daily wipe complete.' });
    gamesNs.emit('server_wipe', { message: 'Daily wipe complete.' });
    marketNs.emit('server_wipe', { message: 'Daily wipe complete.' });

    // Wipe ephemeral state (zones keep definitions, clear players/chat)
    state.wipeEphemeral();

    io.disconnectSockets(true);
    gamesNs.disconnectSockets(true);
    marketNs.disconnectSockets(true);

    // Reset game state
    gameWorker.postMessage({ type: 'reset' });
    gameProxy._playerInstances.clear();
    lieroProxy._playerLobbies.clear();
    lobbyManager.reset();
    coinFlipManager.reset();
    if (horseRacingManager && horseRacingManager.reset) horseRacingManager.reset();
    if (chessManager && chessManager.reset) chessManager.reset();
    if (poolManager && poolManager.reset) poolManager.reset();
    if (_stockMarket && _stockMarket.reset) _stockMarket.reset();
    try { var macroDir = director.getMacroDirector(); if (macroDir && macroDir.reset) macroDir.reset(); } catch (_) {}
    accounts.clearAllDMs();
    overworldStructures.reset();

    console.log('[wipe] Daily wipe executed.');
    scheduleNextWipe();
  }, msUntilMidnight);

  const h = Math.floor(msUntilMidnight / 3600000);
  const m = Math.floor((msUntilMidnight % 3600000) / 60000);
  console.log(`[wipe] Next wipe in ${h}h ${m}m (midnight UTC)`);
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
function gracefulShutdown(signal) {
  console.log('[server] ' + signal + ' received.');
  try {
    io.emit('update_warning', { message: 'Server restarting. Back in a moment.', minutesLeft: 0 });
  } catch (e) {}
  setTimeout(function() {
    // Save all characters back to master and deregister shard
    shardBridge.saveAllCharacters();
    shardBridge.stopHeartbeat();
    accounts.flushAll();
    try { loot.flushSerialCounter(); } catch (_) {}
    try { db.close(); } catch (_) {}
    server.close(function() {
      console.log('[server] Shut down gracefully.');
      process.exit(0);
    });
    setTimeout(function() {
      console.log('[server] Forcing exit.');
      process.exit(0);
    }, 5000);
  }, 1000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason instanceof Error ? reason.stack || reason.message : reason);
});

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err.stack || err.message);
  try { accounts.flushAll(); } catch (_) {}
  setTimeout(() => process.exit(1), 500);
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || shardBridge.config.port || 8443;

// Store shard password for socket.js to check (env var takes priority over config)
var shardPassword = process.env.SHARD_PASSWORD || shardBridge.config.password || null;
if (shardPassword) {
  shardBridge.config.password = shardPassword;
}

server.listen(PORT, () => {
  console.log('');
  console.log('==============================================');
  console.log(`  MMOLite running on port ${PORT}`);
  if (process.env.OFFLINE_MODE === '1') {
    console.log('  ** Server running in OFFLINE MODE **');
  } else {
    console.log('  KVM2: <shard1-ip>');
  }
  console.log('  Pokemon-style MMO game server');
  console.log('  Love2D client connects via Socket.IO');
  if (process.env.OFFLINE_MODE !== '1') {
    console.log('  Daily wipe at midnight UTC.');
  }
  if (shardPassword) {
    console.log('  Password protected: YES');
  }
  console.log('==============================================');
  console.log('');

  // Create default zones on startup
  state.initDefaultZones();

  // Start shard bridge heartbeat (registers with master server) — skip in offline mode
  if (process.env.OFFLINE_MODE !== '1') {
    shardBridge.startHeartbeat(function() { return state.users.size; });
  } else {
    console.log('[server] Offline mode — skipping shard heartbeat');
  }

  // Skip daily wipe in offline/local mode — no reason to reset solo play
  if (process.env.OFFLINE_MODE !== '1') {
    scheduleNextWipe();
  } else {
    console.log('[wipe] Offline mode — daily wipe disabled');
  }

  // ---------------------------------------------------------------------------
  // LAN discovery broadcast (UDP)
  // ---------------------------------------------------------------------------
  if (process.env.OFFLINE_MODE === '1' || !shardBridge.isMasterMode) {
    var dgram = require('dgram');
    var os = require('os');
    var udpBroadcast = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    udpBroadcast.bind(function() {
      udpBroadcast.setBroadcast(true);

      var broadcastInterval = setInterval(function() {
        // Determine local LAN IP
        var localIP = '127.0.0.1';
        var interfaces = os.networkInterfaces();
        var ifNames = Object.keys(interfaces);
        for (var i = 0; i < ifNames.length; i++) {
          var addrs = interfaces[ifNames[i]];
          for (var j = 0; j < addrs.length; j++) {
            if (addrs[j].family === 'IPv4' && !addrs[j].internal) {
              localIP = addrs[j].address;
              break;
            }
          }
          if (localIP !== '127.0.0.1') break;
        }

        var playerCount = io.engine ? io.engine.clientsCount : 0;
        var packet = JSON.stringify({
          type: 'MMOLITE_SHARD',
          name: shardBridge.config.shardName || 'Local Server',
          host: localIP,
          port: PORT,
          players: playerCount,
          maxPlayers: shardBridge.config.maxPlayers || 8,
          version: '1.0.0',
          hasPassword: !!(process.env.SHARD_PASSWORD || shardBridge.config.password),
          rules: shardBridge.config.rules || {},
        });

        var buf = Buffer.from(packet);
        udpBroadcast.send(buf, 0, buf.length, 5050, '255.255.255.255');
      }, 3000);

      console.log('[server] LAN broadcast started on UDP port 5050');

      // Clean up on shutdown
      process.on('SIGINT', function() { clearInterval(broadcastInterval); udpBroadcast.close(); });
      process.on('SIGTERM', function() { clearInterval(broadcastInterval); udpBroadcast.close(); });
    });
  }
});
