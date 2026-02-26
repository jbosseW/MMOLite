# MMOLite - Crafting, Building & World Expansion Plan

## Overview
Add persistent resources, inventory/crafting system, placeable structures, lock/key mechanics, chunk-based world generation, and starting town protection.

---

## Phase 1: Persistent Resources & MMO Inventory (Server)

### 1.1 Make Resources Permanent
**File: `handlers/zone.js`** (lines 116-193)
- Change harvest behavior: resources are **never depleted** globally
- Instead, add a **per-player cooldown** (e.g., 3-5 seconds between harvests of same node)
- Remove `resource.depletedUntil = now + resource.respawnMs` line
- Remove `resource_depleted` broadcast (resources always visible)
- Track per-player harvest cooldowns in a Map on the server

### 1.2 Add MMO Resource Inventory to Accounts
**File: `accounts.js`**
- Add `mmoInventory` to account creation (both `createAccount` and `createTempAccount`):
```js
mmoInventory: {
  wood: 0,
  stone: 0,
  iron_ore: 0,
  iron_bar: 0,
  items: []  // crafted/placeable items: { id, type, name, data }
}
```
- New functions:
  - `addResource(key, resourceType, amount)` - Add wood/stone/iron_ore/iron_bar
  - `removeResource(key, resourceType, amount)` - Remove with underflow check
  - `getMMOInventory(key)` - Return full inventory
  - `addMMOItem(key, item)` - Add crafted item
  - `removeMMOItem(key, itemId)` - Remove by instance ID

### 1.3 Update Harvest Flow
**File: `handlers/zone.js`**
- On successful harvest: call `accounts.addResource(accKey, resourceType, 1)`
- Map resource types: tree -> 'wood', stone -> 'stone', iron -> 'iron_ore'
- Send updated inventory counts in `harvest_result`
- Add `inventory_updated` event to push inventory changes to client

---

## Phase 2: Crafting Recipes System (Server)

### 2.1 Crafting Recipe Definitions
**File: `handlers/crafting.js`** (currently a stub - full rewrite)

**Basic Crafting (no station required):**
| Recipe | Inputs | Output |
|--------|--------|--------|
| Forge | 20 wood + 15 stone | 1 forge (placeable) |
| Storage Chest | 10 wood | 1 chest (placeable) |
| Wall | 5 wood | 1 wall (placeable) |
| Door | 8 wood + 2 iron_bar | 1 door (placeable) |
| Raft | 30 wood | 1 raft (placeable) |

**Forge Recipes (must be near a placed forge):**
| Recipe | Inputs | Output |
|--------|--------|--------|
| Iron Bar | 1 iron_ore | 1 iron_bar |

**Anvil Recipes (must be near a placed anvil):**
| Recipe | Inputs | Output |
|--------|--------|--------|
| Iron Anvil | 15 iron_bar | 1 anvil (placeable) |
| Iron Axe | 5 iron_bar + 3 wood | 1 iron_axe (equippable) |
| Iron Pickaxe | 5 iron_bar + 3 wood | 1 iron_pickaxe (equippable) |
| Iron Lock | 3 iron_bar | 1 lock (ties to owner) |
| Key Copy | 1 iron_bar | 1 key (for a specific lock) |

### 2.2 Crafting Events
- `craft_item` - Client sends: `{ recipeId, stationId? (for forge/anvil nearby) }`
- Server validates: resources, station proximity, skill levels
- Server responds: `craft_result` with updated inventory

---

## Phase 3: Inventory & Crafting UI (Client)

### 3.1 Inventory Panel (I key toggle)
**File: `scenes/game.lua`**
- New state: `showInventory = false`
- Panel: right side of screen, 320px wide, full height
- **Resources Tab** (default):
  - Wood count with icon
  - Stone count with icon
  - Iron Ore count with icon
  - Iron Bar count with icon
- **Items Tab**:
  - List of crafted/held items
  - Equipment slots: Axe, Pickaxe (click to equip)
- **Crafting Tab**:
  - List of all recipes
  - Color-coded: green = craftable, gray = missing materials
  - Shows cost breakdown for each recipe
  - Click to craft
  - Filtered by "Basic" / "Forge" / "Anvil" tabs
    - Forge/Anvil recipes only clickable when near the station

### 3.2 New Network Events (Client)
- Listen: `inventory_updated` -> update local inventory state
- Listen: `craft_result` -> success/fail feedback
- Send: `craft_item` -> request crafting
- Send: `get_inventory` -> request full inventory on connect

### 3.3 Station Interaction
- When near a placed forge and press E -> opens inventory with Forge tab
- When near a placed anvil and press E -> opens inventory with Anvil tab
- When near a storage chest and press E -> opens chest UI (separate panel)

---

## Phase 4: Placeable Structures (Server + Client)

### 4.1 Server: Placement System
**New file: `handlers/placement.js`**

**Placed Object Structure:**
```js
{
  id: 'uuid',
  type: 'forge' | 'anvil' | 'chest' | 'wall' | 'door' | 'raft',
  x: number, y: number,
  ownerKey: 'account_key',     // who placed it
  lockId: null | 'lock_uuid',  // if locked
  health: 100,
  contents: [],                // for chests
  createdAt: timestamp
}
```

**Events:**
- `place_object` - { type, x, y } -> validates, removes item from inventory, adds to zone
- `remove_object` - { objectId } -> only owner can remove, returns item to inventory
- `interact_object` - { objectId, action } -> open chest, use forge/anvil

**Storage:**
- `state.js`: Add `placedObjects` array to zone definition
- Persist placed objects to disk (new file: `data/placements/{zoneId}.json`)
- Load on server start

### 4.2 Starting Town Protection
- Define protected area bounds in zone config:
```js
protectedArea: { x: 0, y: 0, width: 1600, height: 1200 }  // entire starter town
```
- `place_object` handler checks if position falls within any protected area
- Rejects with error: "Cannot build in the starting town"

### 4.3 Client: Placement Mode
**File: `scenes/game.lua`**
- New state: `placementMode = false`, `placementType = nil`
- Activated from inventory: click a placeable item
- Ghost preview at mouse cursor (snapped to grid)
- Green tint = valid, Red tint = invalid (protected area / collision)
- Left-click to place, Escape/Right-click to cancel
- Render all placed objects in world space (after resources, before players)

### 4.4 Lock/Key System
- When crafting a lock: generates unique `lockId`, tied to `ownerKey`
- Lock can be applied to doors and chests via `interact_object { action: 'lock', lockId }`
- Key Copy crafting: specify which lockId to copy -> creates key item with that lockId
- Interaction check: if object is locked, only owner or holder of matching key can interact
- Keys are inventory items: `{ type: 'key', lockId: '...', label: 'My Door Key' }`

---

## Phase 5: Chunk-based World Generation

### 5.1 Expand to Overworld
**File: `state.js`**
- Create new zone: `overworld` (large: 6400 x 4800 or bigger)
- Add connection from starter_town to overworld (mountain pass to the north, bridges for water)
- Overworld has NO water/mountain borders (open world)

### 5.2 Chunk System
**New file: `worldgen.js`** (server-side)

**Chunk specs:**
- Chunk size: 512 x 512 pixels (16x16 tiles at 32px)
- World grid: 12x9 chunks = 6144 x 4608 pixel world
- Each chunk has: biome type, resource spawns, terrain features

**Biome types** (based on map image):
- `grass` - Open grassland, scattered trees
- `forest` - Dense trees, more wood
- `rocky` - Stone outcrops, mining spots
- `mountain` - Iron ore deposits, rocky terrain
- `beach` - Transition to water, sand
- `water` - Non-walkable (ocean/lakes)

**Generation:**
- Seeded RNG per chunk coordinates for deterministic generation
- Biome map derived from the provided map image (stored as a 2D array)
- Resources auto-placed per biome:
  - Forest: 3-5 trees per chunk
  - Rocky: 2-3 stone + 1 iron per chunk
  - Mountain: 1-2 stone + 2-3 iron per chunk
  - Grass: 1-2 trees, 0-1 stone per chunk

### 5.3 Client Chunk Loading
**File: `scenes/game.lua`**
- Track currently visible chunks based on camera position
- Request chunk data from server when entering new chunks
- Render only visible chunks + 1 chunk buffer
- Different ground colors per biome
- Chunk transitions with blended edges

### 5.4 Server Chunk Events
- `chunk_enter` - Client requests chunk data when moving into new chunk area
- `chunk_state` - Server responds with: terrain, resources, placed objects for that chunk
- Server lazy-generates chunks on first request, caches result

---

## Phase 6: Equipment Effects

### 6.1 Tool Bonuses
- **Iron Axe**: 2x wood per harvest (harvest gives 2 instead of 1)
- **Iron Pickaxe**: 2x stone/ore per harvest
- Server checks equipped items on harvest and applies multiplier

### 6.2 Equipment Tracking
- Add `equipment` field to account: `{ axe: null, pickaxe: null }`
- Events: `equip_item`, `unequip_item`
- Client HUD shows equipped tools

---

## File Changes Summary

### Server (Node.js):
| File | Action | Changes |
|------|--------|---------|
| `accounts.js` | Modify | Add mmoInventory, resource functions, equipment |
| `state.js` | Modify | Add placedObjects to zones, overworld zone, protectedArea |
| `handlers/zone.js` | Modify | Persistent resources, per-player cooldowns, inventory integration |
| `handlers/crafting.js` | Rewrite | Full recipe system with station validation |
| `handlers/placement.js` | **New** | Place/remove/interact with structures |
| `worldgen.js` | **New** | Chunk-based world generation |
| `socket.js` | Modify | Register placement handler, send inventory on connect |
| `server.js` | Modify | Load/save placements on startup/shutdown |

### Client (Lua/LOVE):
| File | Action | Changes |
|------|--------|---------|
| `scenes/game.lua` | Major modify | Inventory UI, crafting UI, placement mode, chunk rendering, structure rendering |

---

## Implementation Order

1. **Persistent resources + resource inventory** (server accounts.js + zone.js)
2. **Crafting recipes** (server crafting.js)
3. **Inventory UI** (client game.lua - I key panel)
4. **Crafting UI** (client game.lua - crafting tab)
5. **Placement system** (server placement.js + client rendering)
6. **Starting town protection** (server-side area check)
7. **Lock/key system** (server + client interaction)
8. **Chunk-based overworld** (worldgen.js + client chunk loading)
9. **Equipment effects** (server harvest multipliers)
10. **Storage chest UI** (client chest interaction panel)
