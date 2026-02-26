# MMOLite Network & Performance Optimization Report
## Full Client/Server Architecture Audit

**Date:** February 24, 2026
**Scope:** Socket.IO server (Node.js), LOVE 2D client (Lua), production infrastructure (KVM 1 & KVM 2)

---

## Executive Summary

This report covers a full-stack performance audit of the MMOLite game across server networking, client rendering, state management, and loading/resilience patterns. The audit identified **12 high-priority issues**, **9 medium-priority improvements**, and **6 architectural enhancements** that together would significantly improve server throughput, client frame rates, network bandwidth usage, and player experience during lag or disconnects.

**What works well:**
- Spatial grid for zone_move broadcasts (O(neighborhood) not O(zone))
- Dungeon fog-of-war delta streaming (incremental tile reveals)
- Write-behind account cache with 500ms debounce
- Worker thread isolation for physics (game-worker.js)
- PoW + rate limit layering for connection security
- Session token for namespace auth

**What needs immediate attention:**
- Blocking filesystem calls on the main event loop (getMemberCount, findAccountByTag)
- Static data re-sent on every zone transition (~5-10 KB wasted per zone_enter)
- No client-side chunk eviction (unbounded memory growth)
- No loading screens between scenes
- Sub-optimal compression window (serverMaxWindowBits: 10)
- Global broadcasts for Liero events hitting all MMO players

---

## Part 1: Server-Side Issues

### 1.1 HIGH PRIORITY — Blocking Filesystem Calls

**`accounts.getMemberCount()` — Every 30 seconds on main thread**
- Location: `socket.js:206`, called via `setInterval`
- Problem: Calls `fs.readdirSync(ACCOUNTS_DIR)` to count `.json` files. With 5,000+ account files, this stalls the event loop for 1-10ms on every call.
- Fix: Track account count as an incrementing counter. Increment on `createAccount()`, decrement on delete. Cache the value.

**`findAccountByTag` — Synchronous disk scan**
- Location: `accounts.js:526-574`
- Problem: Falls back to `fs.readdirSync` + per-file `fs.readFileSync` + `_decryptData` + `JSON.parse`, scanning up to 500 files synchronously. A single friend-search can stall the event loop for tens to hundreds of milliseconds.
- Fix: Maintain an in-memory `tagIndex: Map<tag, accountKey>` built at startup and updated on account changes. Already rate-limited to 3/min/IP, but the stall affects all players, not just the searcher.

**`_preloadKeyIndex` — Startup blocking**
- Location: `accounts.js:586-611`
- Problem: Decrypts every account file synchronously at module load time. With 5,000 accounts, this is 5,000 AES decryptions before the server starts listening.
- Fix: Convert to async with a startup-complete signal. Not urgent but surprising.

### 1.2 HIGH PRIORITY — Payload Optimization

**Static data sent on every zone_state response**
- Location: `state.js:436-465`
- Problem: `rarityInfo`, `skillDefinitions`, `statNames`, and overworld scale constants (biomeColors, biomeNames, biomeSpeeds, rivers, featureColors, featureSpeeds, chunkSize, worldScale, gameDaySeconds, overworldWalkSpeed, mountSpeeds) are included in every `zone_state` response. These never change. They add ~5-10 KB to every zone transition.
- Fix: Send static data once in the `identity` event (`socket.js:481-528`). Exclude from subsequent `zone_state` responses. Client caches on first receive.

**`_scrubForDisk` deep clone overhead**
- Location: `accounts.js:235-283`
- Problem: Every `saveAccount` call does `JSON.parse(JSON.stringify(account))` to deep clone before scrubbing. A full account (100+ cards, inventory, 4 character slots) can be 20-50 KB. This creates 2-4x the account size in temporary allocations per save, triggering GC pressure.
- Fix: Maintain a pre-scrubbed representation or use a targeted copy that only clones mutable fields.

**perMessageDeflate compression window too small**
- Location: `server.js:125`
- Problem: `serverMaxWindowBits: 10` (1 KB sliding window). Default is 15 (32 KB). The small window produces poor compression ratios on large payloads (chunk data, floor grids, zone state) because the compressor cannot reference repeated patterns further back.
- Fix: Change to `serverMaxWindowBits: 13` or `14`. Monitor memory — each connection allocates a zlib context proportional to window size.

```javascript
// server.js line 121-126, change to:
perMessageDeflate: {
  zlibDeflateOptions: { level: 1 },
  threshold: 1024,
  serverMaxWindowBits: 13,
}
```

### 1.3 HIGH PRIORITY — Broadcast Scope Issues

**Liero lobby updates broadcast to ALL sockets**
- Location: `server.js:432-433, 451-453`
- Problem: `io.emit('liero_lobbies_updated', ...)` and `io.emit('liero_disconnect_cleanup', ...)` use unscoped `io.emit()`, sending to every connected socket including all MMO players who have no interest in Liero.
- Fix: Create a `liero_lobby_watchers` room. Only emit to that room.

```javascript
// Replace io.emit with room-scoped emit:
io.to('liero_lobby_watchers').emit('liero_lobbies_updated', { lobbies: lLobbies });
gamesNs.to('liero_lobby_watchers').emit('liero_lobbies_updated', { lobbies: lLobbies });
```

**Zone tick broadcasts unfiltered positions**
- Location: `server.js:732-750`
- Problem: Every 10 seconds, sends ALL player positions in a zone to ALL zone members regardless of spatial proximity. In the overworld with 50 players spread across 1000km, every player receives 49 irrelevant positions.
- Fix: Use the existing `gridGetNearby` spatial grid to filter the recovery broadcast to only nearby players. Or reduce the interval to 30 seconds (it's a recovery sync, not primary state).

### 1.4 MEDIUM PRIORITY — Data Structure Inefficiencies

**`getPlayerParty` O(n) scan on every dungeon kill**
- Location: `state.js:633-638`
- Problem: Iterates all parties to find which one a player belongs to. Called on every enemy kill for party XP sharing.
- Fix: Add `playerPartyMap: Map<socketId, partyId>` reverse index. Update on party join/leave.

**Multiple `loadAccount` calls per resource_harvest**
- Location: `zone.js:433-554`
- Problem: A single harvest event calls `loadAccount` 4-5 times through `getEquipment`, `getMMOInventory`, `addSkillXp`, and `addResource`. Each is an O(1) cache lookup, but the function call overhead and repeated cache access adds up at high harvest rates.
- Fix: Load account once at the start of the handler, mutate in-place, save once at the end.

**Enemy-by-ID scan in dungeon AI**
- Location: `dungeon.js:281-291`
- Problem: O(enemies) scan per player per attack event to find the attacking enemy. With 20 enemies and 4 players, 80 iterations per attack.
- Fix: Add `enemiesById: Map<enemyId, enemy>` to each floor object.

**Coordinate string concatenation for visibility checks**
- Location: `dungeon.js:143`
- Problem: `pd.lastVisibleSet.has(upd.x + ',' + upd.y)` creates a new string for every visibility check on every AI tick. Creates GC pressure.
- Fix: Use numeric packing: `upd.x * 10000 + upd.y` (safe for grids under 10,000 wide).

### 1.5 MEDIUM PRIORITY — Memory & Cleanup

**Dungeon state not cleared on wipeEphemeral**
- Location: `dungeon.js` module-level Maps
- Problem: `riftFloors`, `caveFloors`, `playerDungeons`, `floorPlayers`, `floorRefs`, `floorTickIntervals`, `wallShiftIntervals`, `floorLightSources`, `floorLightMaps`, `floorAccessOrder` are NOT cleared by `state.wipeEphemeral()`. Old data persists after midnight wipe.
- Fix: Export a `clearDungeonState()` function from the dungeon handler and call it from `wipeEphemeral`.

**Stale battle entries**
- Problem: `activeBattles` entries are removed via `endBattle()`, but there is no timeout-based cleanup. A disconnected client mid-battle could leave orphaned entries.
- Fix: Add a 5-minute timeout sweep for battles with no recent activity.

**`unstable_rift` wall shift interval**
- Location: `dungeon.js:472-522`
- Problem: Iterates the entire floor grid (up to 96x72 = 6,912 tiles) per interval tick, calling `Math.random()` per tile. Most CPU-intensive periodic operation in the dungeon system.
- Fix: Pre-select candidate tiles at generation time. Only iterate candidates during wall shift, not the full grid.

---

## Part 2: Client-Side Issues

### 2.1 HIGH PRIORITY — Memory Management

**Unbounded chunk cache**
- Location: `game.lua`, `overworld.chunks = {}`
- Problem: Chunks are added on every `chunk_data` event and NEVER removed. After hours of exploration, hundreds of chunk tables accumulate in memory, each with 256-entry feature arrays. No eviction policy exists.
- Fix: Add LRU eviction matching the server's approach. Keep chunks within a radius of the player, evict the rest.

```lua
local MAX_CLIENT_CHUNKS = 200
local function evictDistantChunks(playerCX, playerCY)
    local count = 0
    for key, _ in pairs(overworld.chunks) do count = count + 1 end
    if count <= MAX_CLIENT_CHUNKS then return end

    local evictRadius = 8  -- chunks beyond this distance get evicted
    for key, chunk in pairs(overworld.chunks) do
        if math.abs(chunk.cx - playerCX) > evictRadius or
           math.abs(chunk.cy - playerCY) > evictRadius then
            overworld.chunks[key] = nil
        end
    end
end
```

### 2.2 HIGH PRIORITY — Loading Screens

**No loading screen between scenes**
- Location: `main.lua`, `switchScene()`
- Problem: `sceneLoading` flag is set and cleared within the same call stack. The "Loading..." text in `love.draw()` is never rendered because no draw frame occurs between set and clear.
- Current loading screens: Only `game._zoneLoading` (zone entry) and reconnection overlay work correctly.
- Fix: Implement async scene loading with coroutines.

```lua
-- main.lua — async-capable scene switching
local loadingState = { active = false, progress = 0, message = "Loading..." }

function _G.switchScene(name)
    if scenes[name] then
        if currentScene and currentScene.unload then
            pcall(currentScene.unload)
        end
        -- Show loading screen for one frame minimum
        loadingState.active = true
        loadingState.message = "Loading " .. name .. "..."
        currentScene = scenes[name]
        -- Defer load() to next frame so loading screen renders
        pendingLoad = function()
            if currentScene.load then pcall(currentScene.load) end
            loadingState.active = false
        end
    end
end

-- In love.update(dt):
if pendingLoad then
    local fn = pendingLoad
    pendingLoad = nil
    fn()
end

-- In love.draw():
if loadingState.active then
    drawLoadingScreen(loadingState.progress, loadingState.message)
    return
end
```

**Loading screen draw function:**
```lua
function drawLoadingScreen(progress, message)
    local w, h = love.graphics.getDimensions()
    love.graphics.setColor(0.08, 0.08, 0.12, 1)
    love.graphics.rectangle("fill", 0, 0, w, h)

    -- Progress bar
    local barW, barH = 400, 12
    local barX, barY = w/2 - barW/2, h * 0.65
    love.graphics.setColor(0.2, 0.2, 0.25, 1)
    love.graphics.rectangle("fill", barX, barY, barW, barH, 4, 4)
    love.graphics.setColor(0.4, 0.7, 1.0, 1)
    love.graphics.rectangle("fill", barX, barY, barW * progress, barH, 4, 4)

    -- Message
    love.graphics.setColor(0.7, 0.7, 0.8, 1)
    love.graphics.printf(message, barX, barY + 20, barW, "center")

    -- Pulsing indicator
    local pulse = 0.7 + math.sin(love.timer.getTime() * 3) * 0.3
    love.graphics.setColor(0.4, 0.7, 1.0, pulse)
    love.graphics.circle("fill", w/2, h * 0.78, 4)
end
```

### 2.3 HIGH PRIORITY — Rendering Performance

**Overworld terrain: 3,000+ draw calls per frame**
- Location: `game.lua:4018-4167`, `drawGround()`
- Problem: Double-loop renders every tile feature (flower, tree, etc.) as individual `love.graphics.rectangle/circle` calls. With 12 visible chunks x 256 tiles = 3,072 draw calls for features alone, per frame.
- Fix: Cache each chunk to a Canvas. Only re-render when chunk data changes.

```lua
local chunkCanvases = {}

function getChunkCanvas(cx, cy, chunkData)
    local key = cx .. "," .. cy
    if not chunkCanvases[key] then
        local canvas = love.graphics.newCanvas(512, 512)
        love.graphics.setCanvas(canvas)
        love.graphics.clear()
        -- Render all 256 tiles for this chunk ONCE
        renderChunkTiles(chunkData)
        love.graphics.setCanvas()
        chunkCanvases[key] = canvas
    end
    return chunkCanvases[key]
end

-- In drawGround(): one draw call per chunk instead of 256
function drawGround()
    for cy = startCY, endCY do
        for cx = startCX, endCX do
            local chunk = overworld.chunks[cx..","..cy]
            if chunk then
                local canvas = getChunkCanvas(cx, cy, chunk)
                love.graphics.draw(canvas, cx * 512 - camera.x, cy * 512 - camera.y)
            end
        end
    end
end
```

**Dungeon rendering: no viewport culling**
- Location: `game.lua:6755-6917`, `drawDungeonFloor()`
- Problem: Iterates ALL tiles on the floor grid, even those off-screen. A 96x72 floor = 6,912 iterations with 4+ draw calls per wall tile.
- Fix: Calculate visible tile range from camera position and only iterate that range.

```lua
local startX = math.max(1, math.floor((camera.x) / tileSize))
local startY = math.max(1, math.floor((camera.y) / tileSize))
local endX = math.min(#dungeon.grid[1], math.ceil((camera.x + screenW) / tileSize) + 1)
local endY = math.min(#dungeon.grid, math.ceil((camera.y + screenH) / tileSize) + 1)

for y = startY, endY do
    for x = startX, endX do
        -- render tile
    end
end
```

**Dungeon minimap redrawn every frame**
- Location: `game.lua:7302-7354`
- Problem: Full grid iteration drawing the minimap pixel-by-pixel as rectangles every single frame, even when nothing has changed.
- Fix: Render minimap to a Canvas. Only update when `dungeon_visibility_update` arrives.

**Torch glow: 12 concentric circles per frame**
- Location: `game.lua:7134-7149`
- Problem: Draws 12 overlapping transparent circles for torch glow effect.
- Fix: Pre-render the glow to a Canvas at load time. Draw one textured quad per frame instead of 12 circles.

### 2.4 MEDIUM PRIORITY — Networking

**No reconnection logic in net.lua itself**
- Problem: Reconnection is only handled in game.lua's disconnect handler (3 retries, 2s/5s/10s delays). Other scenes have no recovery path. No exponential backoff. No jitter to prevent thundering herd on server restart.
- Fix: Move reconnection into net.lua with proper backoff:

```lua
local function getReconnectDelay(attempt)
    local exp = math.min(attempt, 5)
    local delay = 1.0 * (2 ^ exp)  -- 1, 2, 4, 8, 16, 32s
    delay = math.min(delay, 30.0)
    local jitter = delay * 0.25
    return delay + (math.random() * jitter * 2 - jitter)
end
```

**No WebSocket connect timeout**
- Location: `lib/net.lua`, `Client:connect()`
- Problem: If the server accepts TCP but never responds to the Engine.IO handshake, the client hangs indefinitely.
- Fix: Add a 10-second connection timeout. If no `WS_OPEN` message arrives within the timeout, close the socket and trigger reconnect.

**WS worker 50ms blocking select**
- Location: `lib/net.lua`, WS_WORKER_CODE
- Problem: `socket.select({sock}, nil, 0.05)` blocks for up to 50ms per iteration. Under high message rates, this delays processing.
- Fix: Reduce to `0.01` (10ms) or use non-blocking mode with a short sleep fallback.

### 2.5 MEDIUM PRIORITY — Update Loop

**Proximity scans O(n) every frame**
- Location: `game.lua:2744-3338`
- Problem: Every frame scans ALL zone connections, ALL resources, ALL cave entrances, ALL placed objects, ALL NPCs for proximity. No spatial indexing.
- Fix: Use a simple grid-based spatial hash for interactive entities. Only check entities in the player's current and adjacent grid cells.

**Camera lerp is frame-rate dependent**
- Location: `game.lua`, `camera.x = camera.x + (target - camera.x) * 8 * dt`
- Problem: At 30fps the camera moves differently than at 120fps. The lerp factor `8 * dt` doesn't produce frame-rate-independent smoothing.
- Fix: Use exponential decay: `camera.x = camera.x + (target - camera.x) * (1 - math.exp(-8 * dt))`

**Font recreation on every scene load**
- Problem: Every scene creates fonts in `load()` and `resize()`. No shared font cache.
- Fix: Create a global font cache in `main.lua`:

```lua
local fontCache = {}
function _G.getFont(size)
    if not fontCache[size] then
        fontCache[size] = love.graphics.newFont(size)
    end
    return fontCache[size]
end
```

---

## Part 3: Protocol & Transport Optimizations

### 3.1 Force WebSocket-Only Transport

- Location: `server.js:112-114`
- Current: Both `polling` and `websocket` enabled
- Problem: HTTP polling adds overhead (headers, JSON envelope wrapping, no binary mode). The LOVE 2D client has full WebSocket support.
- Fix: Default to WebSocket-only:

```javascript
var socketTransports = process.env.SOCKET_TRANSPORTS
  ? process.env.SOCKET_TRANSPORTS.split(',').map(t => t.trim())
  : ['websocket'];
```

Set `SOCKET_TRANSPORTS=websocket` in `/etc/mmolite/app.env` on both KVM servers.

### 3.2 Install Native WebSocket Add-ons

Socket.IO uses the `ws` library. Two optional native add-ons provide 15-25% throughput improvement:

```bash
# Run on both <shard1-ip> and <shard2-ip>
cd /opt/mmolite
npm install bufferutil utf-8-validate
pm2 restart mmolite --update-env
```

Drop-in acceleration. Socket.IO detects and uses them automatically.

### 3.3 Server-Side Move Batching

- Current: Each `zone_move` triggers individual socket emits to all nearby players.
- Improvement: Accumulate moves and broadcast in batches at 10Hz:

```javascript
var moveBatch = {};
var BATCH_INTERVAL_MS = 100;

setInterval(function() {
  var keys = Object.keys(moveBatch);
  if (keys.length === 0) return;

  var byZone = {};
  for (var i = 0; i < keys.length; i++) {
    var sid = keys[i];
    var entry = moveBatch[sid];
    if (!byZone[entry.zoneId]) byZone[entry.zoneId] = [];
    byZone[entry.zoneId].push(entry.payload);
  }
  moveBatch = {};

  for (var zid in byZone) {
    io.to('zone:' + zid).emit('batch_move', byZone[zid]);
  }
}, BATCH_INTERVAL_MS);
```

Converts O(N) emits per move event into O(zones) emits per batch interval.

### 3.4 Incremental Chunk Sending

- Current: `sendNearbyChunks()` sends all 25 chunks every time, even if the client already has most of them.
- Fix: Track which chunks each client has received server-side. Only send new chunks.

```javascript
var clientChunks = new Map();  // socketId -> Set of "cx,cy"

function sendNearbyChunksIncremental(socket, zoneId, cx, cy) {
  var toSend = [];
  for (var dy = -CHUNK_VIEW_RADIUS; dy <= CHUNK_VIEW_RADIUS; dy++) {
    for (var dx = -CHUNK_VIEW_RADIUS; dx <= CHUNK_VIEW_RADIUS; dx++) {
      var ncx = cx + dx, ncy = cy + dy;
      var key = ncx + ',' + ncy;
      var set = clientChunks.get(socket.id);
      if (!set || !set.has(key)) {
        var chunk = state.getOrGenerateChunk(zoneId, ncx, ncy);
        if (chunk) {
          toSend.push(chunk);
          if (!set) { set = new Set(); clientChunks.set(socket.id, set); }
          set.add(key);
        }
      }
    }
  }
  if (toSend.length > 0) {
    socket.emit('chunk_data', { chunks: toSend });
  }
}
```

### 3.5 Delta-Encode Facing Direction

- Current: Facing sent as string (`"right"`, `"left"`, etc.) — ~10 bytes per packet.
- Fix: Send as integer index (0-3) — 1 byte per packet.

```javascript
var FACING_INDEX = { right: 0, left: 1, up: 2, down: 3 };
// In move payloads: { id, x: Math.round(x), y: Math.round(y), f: FACING_INDEX[facing] }
```

### 3.6 Reduce Heartbeat Interval

- Current: `pingInterval: 25000, pingTimeout: 30000` (dead client detected in ~55s)
- Fix: `pingInterval: 10000, pingTimeout: 5000` (dead client detected in ~15s)

Frees resources from dead connections 3.5x faster.

---

## Part 4: Client-Side Prediction & Interpolation

### 4.1 Entity Interpolation for Remote Players

- Current: Remote players teleport to each new server-reported position 8 times per second, causing visible jitter.
- Fix: Buffer recent positions and render 150ms in the past, interpolating smoothly between known points.

```lua
local INTERP_DELAY = 0.15  -- 150ms behind real-time

local function updatePlayerInterpolation(dt)
    local renderTime = love.timer.getTime() - INTERP_DELAY
    for id, p in pairs(players) do
        if id == myId or not p.interpBuffer or #p.interpBuffer < 2 then
            goto continue
        end
        -- Find bracketing snapshots
        local from, to
        for i = 1, #p.interpBuffer - 1 do
            if p.interpBuffer[i].t <= renderTime and p.interpBuffer[i+1].t >= renderTime then
                from = p.interpBuffer[i]
                to = p.interpBuffer[i+1]
                break
            end
        end
        if from and to then
            local alpha = (renderTime - from.t) / (to.t - from.t)
            alpha = math.max(0, math.min(1, alpha))
            p.renderX = from.x + (to.x - from.x) * alpha
            p.renderY = from.y + (to.y - from.y) * alpha
        end
        ::continue::
    end
end
```

### 4.2 Connection State UI

Show a persistent connection status indicator during gameplay:

```lua
local CONNECTION_STATES = {
    DISCONNECTED    = { label = "Disconnected",           color = {0.8, 0.3, 0.3} },
    CONNECTING      = { label = "Connecting...",          color = {0.8, 0.7, 0.3} },
    AUTHENTICATING  = { label = "Authenticating...",      color = {0.8, 0.7, 0.3} },
    LOADING_ZONE    = { label = "Loading zone...",        color = {0.4, 0.7, 1.0} },
    LOADING_CHUNKS  = { label = "Streaming world...",     color = {0.4, 0.7, 1.0} },
    READY           = { label = "Connected",              color = {0.3, 0.8, 0.5} },
}
```

### 4.3 Offline Action Queue

Queue non-destructive actions during brief disconnects, replay on reconnect:

```lua
local offlineQueue = {}
local function queueOrEmit(event, data)
    if net.isConnected() then
        net.emit(event, data)
    elseif #offlineQueue < 32 then
        table.insert(offlineQueue, { event = event, data = data, t = love.timer.getTime() })
    end
end
```

Only queue movement and chat. Never queue economy actions (trades, purchases).

---

## Part 5: Production Server Tuning

### 5.1 V8 GC Flags

Add to `/etc/mmolite/app.env` on both KVM servers:

```bash
NODE_OPTIONS=--max-old-space-size=512 --max-semi-space-size=32
```

- `--max-old-space-size=512`: Prevents Node from consuming all RAM on VPS
- `--max-semi-space-size=32`: Reduces Scavenge GC frequency by 50-70% for short-lived objects (position updates, spatial grid lookups) at cost of ~48MB extra RAM

### 5.2 Event Loop Monitoring

Add to `server.js`:

```javascript
const { monitorEventLoopDelay } = require('perf_hooks');
const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

setInterval(function() {
  var lag = histogram.mean / 1e6;
  var p99 = histogram.percentile(99) / 1e6;
  if (lag > 50) {
    console.warn('[perf] Event loop lag: mean=' + lag.toFixed(1) + 'ms p99=' + p99.toFixed(1) + 'ms');
  }
  histogram.reset();
}, 30000);
```

Alert threshold: mean > 50ms = something is blocking. p99 > 100ms = players experiencing lag spikes.

### 5.3 Reduce Spatial Broadcast Radius

- Current: `SPATIAL_BROADCAST_RADIUS = 5` (5 chunks = 2,560px = ~12.8km)
- Problem: Players "see" movement updates from 12.8km away.
- Fix: Reduce to 3 chunks (1,536px, ~3x visible screen width). Reduces broadcast recipients by ~64% in dense zones.

---

## Priority Implementation Order

### Tier 1 — Quick Wins (Low effort, immediate impact)

| # | Fix | Location | Effort | Impact |
|---|-----|----------|--------|--------|
| 1 | Force WebSocket-only transport | server.js, app.env | 5 min | High |
| 2 | Install bufferutil + utf-8-validate | Both KVM servers | 5 min | Medium |
| 3 | Fix Liero global broadcast scope | server.js:432-453 | 15 min | Medium |
| 4 | Increase serverMaxWindowBits to 13 | server.js:125 | 1 min | Medium |
| 5 | Reduce heartbeat to 10s/5s | server.js:118-119 | 1 min | Medium |
| 6 | Add V8 GC flags | app.env | 5 min | Medium |
| 7 | Delta-encode facing (int index) | zone.js, game.lua | 30 min | Low |

### Tier 2 — Medium Effort, High Impact

| # | Fix | Location | Effort | Impact |
|---|-----|----------|--------|--------|
| 8 | Replace getMemberCount with counter | accounts.js, socket.js | 1 hr | High |
| 9 | Remove static data from zone_state | state.js, socket.js, game.lua | 2 hr | High |
| 10 | Client chunk cache eviction | game.lua | 1 hr | High |
| 11 | Loading screen between scenes | main.lua | 2 hr | High |
| 12 | Server-side move batching | zone.js | 3 hr | High |
| 13 | Dungeon viewport culling | game.lua | 1 hr | High |
| 14 | Chunk canvas caching | game.lua | 3 hr | High |
| 15 | Reconnection with backoff/jitter | net.lua | 2 hr | Medium |

### Tier 3 — Architectural Improvements

| # | Fix | Location | Effort | Impact |
|---|-----|----------|--------|--------|
| 16 | Entity interpolation for remote players | game.lua | 4 hr | High |
| 17 | Incremental chunk sending | zone.js | 3 hr | Medium |
| 18 | playerPartyMap reverse index | state.js | 1 hr | Medium |
| 19 | Batch account operations per handler | zone.js, dungeon.js | 4 hr | Medium |
| 20 | Event loop lag monitoring | server.js | 30 min | Medium |
| 21 | Minimap canvas caching | game.lua | 1 hr | Low |
| 22 | Torch glow canvas pre-render | game.lua | 1 hr | Low |
| 23 | Connection state UI indicator | game.lua | 2 hr | Medium |
| 24 | Offline action queue | game.lua | 2 hr | Medium |
| 25 | Global font cache | main.lua | 30 min | Low |
| 26 | Reduce SPATIAL_BROADCAST_RADIUS | zone.js | 5 min | Medium |
| 27 | Zone tick spatial filtering | server.js | 1 hr | Low |

---

## Race Conditions & Stability Notes

### Confirmed Safe
- **Chip lock (accounts.js)**: The `_chipLocks` mechanism is a no-op for synchronous callers in Node.js's single-threaded model. Correct as documented.
- **Guild vault lock (guild.js)**: Forward-compatibility guard, not strictly needed currently.

### Potential Issues
- **playerTransitioning Set (dungeon.js:95)**: If the dungeon handler throws after adding to `playerTransitioning` but before removing, the player is permanently locked out of floor transitions until server restart. Add a try/finally wrapper.
- **wipeEphemeral doesn't clear dungeon state**: Module-level Maps in dungeon.js persist after midnight wipe. Technically a memory leak, though floors regenerate fresh each daily seed.
- **Guild vault state**: `guild.vault` is in-memory only. No mechanism ensures vault state is flushed at wipe time beyond the graceful shutdown path.

---

## What Already Works Well

These patterns are correctly implemented and should not be changed:

1. **Spatial grid in zone.js** — O(neighborhood) broadcast, not O(zone)
2. **Dungeon fog delta streaming** — Incremental tile reveals, not full grid per move
3. **Write-behind account cache** — 500ms debounce, 5000-account cap with LRU
4. **Worker thread for physics** — game-worker.js keeps physics off event loop
5. **PoW + rate limit layering** — Multiple defense layers prevent flood attacks
6. **Session token auth** — Prevents unauthorized namespace access
7. **Chunk LRU on server** — Correct insertion-order Map with delete-reinsert touch
8. **Combat animation system** — FIFO queue, proper font cache, clean lifecycle
9. **Reconnection overlay in game.lua** — Semi-transparent overlay with retry counter
10. **dt capping** — `math.min(dt, 1/20)` prevents spiral-of-death

---

## Sources

- [Socket.IO Performance Tuning](https://socket.io/docs/v4/performance-tuning/)
- [Socket.IO Server Options](https://socket.io/docs/v4/server-options/)
- [Node.js V8 GC Tuning](https://blog.platformatic.dev/optimizing-nodejs-performance-v8-memory-management-and-gc-tuning)
- [Client-Side Prediction - Gabriel Gambetta](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html)
- [Entity Interpolation - Gabriel Gambetta](https://www.gabrielgambetta.com/entity-interpolation.html)
- [Valve Latency Compensation](https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization)
- [LOVE 2D SpriteBatch](https://love2d.org/wiki/SpriteBatch)
- [Tile Rendering Optimization in LOVE2D](https://peerdh.com/blogs/programming-insights/optimizing-tile-based-rendering-performance-in-love2d-with-lua-1)
- [Node.js Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [Scaling Socket.IO with Redis](https://medium.com/@connect.hashblock/scaling-socket-io-redis-adapters-and-namespace-partitioning-for-100k-connections-afd01c6938e7)
