-- combat-anim.lua
-- Animation queue system for tactical combat with blocking semantics.
-- When animations are playing, game input is blocked.
-- Animations play sequentially from a FIFO queue, with support for
-- simultaneous (parallel) animations via the "simultaneous" type.
-- Part of MMOLite client.

local combatAnim = {}

-- ---------------------------------------------------------------------------
-- Constants
-- ---------------------------------------------------------------------------
local TILE_SIZE = 32
local MOVE_SPEED = 8            -- tiles per second for movement animation
local ATTACK_DURATION = 0.4     -- seconds for attack lunge animation
local DAMAGE_FLOAT_DURATION = 0.8  -- seconds for floating damage number
local DEATH_DURATION = 0.6      -- seconds for death fade
local STATUS_DURATION = 0.5     -- seconds for status effect flash
local TRANSITION_DURATION = 1.0 -- seconds for transition text
local SYNC_DURATION = 0.5       -- seconds for sync attack visual
local REACTION_DURATION = 0.5   -- seconds for reaction visual

local ATTACK_LUNGE_PX = 4       -- pixels attacker lunges toward target
local DAMAGE_FLOAT_PX = 20      -- pixels damage number floats upward

-- Local references for hot paths
local math_floor = math.floor
local math_min   = math.min
local math_max   = math.max
local math_sqrt  = math.sqrt
local math_abs   = math.abs
local table_insert = table.insert
local table_remove = table.remove

-- ---------------------------------------------------------------------------
-- Font cache
-- ---------------------------------------------------------------------------
local fontCache = {}
local function getFont(size)
    if not fontCache[size] then
        fontCache[size] = love.graphics.newFont(size)
    end
    return fontCache[size]
end

-- ---------------------------------------------------------------------------
-- State
-- ---------------------------------------------------------------------------
local queue = {}            -- FIFO animation queue
local currentAnim = nil     -- Currently playing animation (or nil)
local damageNumbers = {}    -- Persistent floating damage numbers (rendered separately)
local unitPositions = {}    -- unitId -> {x=number, y=number} visual positions (pixel coords)
local unitBasePositions = {}-- unitId -> {x=number, y=number} grid positions (tile coords)

-- Per-animation ephemeral state that needs to survive across frames.
-- Keyed by the animation table reference itself.
local animState = {}

-- ---------------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------------

--- Linearly interpolate between a and b by fraction t (0..1).
local function lerp(a, b, t)
    return a + (b - a) * t
end

--- Return pixel center for a tile coordinate.
local function tileToPx(tx, ty)
    return tx * TILE_SIZE + TILE_SIZE * 0.5,
           ty * TILE_SIZE + TILE_SIZE * 0.5
end

--- Return the normalized direction vector from (ax,ay) to (bx,by).
--- Returns (0,0) if the points are coincident.
local function direction(ax, ay, bx, by)
    local dx = bx - ax
    local dy = by - ay
    local len = math_sqrt(dx * dx + dy * dy)
    if len < 0.0001 then
        return 0, 0
    end
    return dx / len, dy / len
end

--- Get or create per-animation ephemeral state table.
local function getAnimState(anim)
    if not animState[anim] then
        animState[anim] = {}
    end
    return animState[anim]
end

--- Clean up ephemeral state for a finished animation.
local function clearAnimState(anim)
    animState[anim] = nil
end

--- Look up base pixel position for a unit. Returns px, py or nil, nil.
local function unitBasePx(unitId)
    local base = unitBasePositions[unitId]
    if not base then return nil, nil end
    return tileToPx(base.x, base.y)
end

--- Look up current visual pixel position for a unit. Falls back to base.
local function unitVisualPx(unitId)
    local vis = unitPositions[unitId]
    if vis then return vis.x, vis.y end
    return unitBasePx(unitId)
end

-- ---------------------------------------------------------------------------
-- Animation update helpers (one per type)
-- Each returns true when the animation is finished.
-- ---------------------------------------------------------------------------

-- Forward declarations for mutual recursion
local updateSingleAnim
local updateSimultaneous

local function updateMove(anim, dt)
    if not anim.path or #anim.path < 1 then return true end

    local speed = (anim.speed or MOVE_SPEED) * TILE_SIZE  -- convert to px/sec
    anim.elapsed = (anim.elapsed or 0) + dt
    anim.pathIndex = anim.pathIndex or 1

    -- Current waypoint target (tile coords)
    local wp = anim.path[anim.pathIndex]
    if not wp then return true end

    local targetX, targetY = tileToPx(wp.x, wp.y)

    -- Ensure the unit has a visual position initialised
    if not unitPositions[anim.unitId] then
        -- Start from base or from the first path node
        local bx, by = unitBasePx(anim.unitId)
        if not bx then
            local first = anim.path[1]
            bx, by = tileToPx(first.x, first.y)
        end
        unitPositions[anim.unitId] = { x = bx, y = by }
    end
    local pos = unitPositions[anim.unitId]

    -- Move toward current waypoint
    local dx = targetX - pos.x
    local dy = targetY - pos.y
    local dist = math_sqrt(dx * dx + dy * dy)
    local step = speed * dt

    if step >= dist then
        -- Arrived at this waypoint
        pos.x = targetX
        pos.y = targetY
        anim.pathIndex = anim.pathIndex + 1
        if anim.pathIndex > #anim.path then
            -- Path exhausted -- update base position to final waypoint
            local last = anim.path[#anim.path]
            unitBasePositions[anim.unitId] = { x = last.x, y = last.y }
            return true
        end
    else
        -- Partial move
        local nx, ny = direction(pos.x, pos.y, targetX, targetY)
        pos.x = pos.x + nx * step
        pos.y = pos.y + ny * step
    end

    return false
end

local function updateAttack(anim, dt)
    anim.elapsed = (anim.elapsed or 0) + dt
    local t = anim.elapsed
    local st = getAnimState(anim)

    -- Cache attacker origin
    if not st.originX then
        local ax, ay = unitVisualPx(anim.attackerId)
        if not ax then ax, ay = 0, 0 end
        st.originX, st.originY = ax, ay

        local tx, ty = unitVisualPx(anim.targetId)
        if not tx then tx, ty = ax, ay end
        st.targetX, st.targetY = tx, ty
        st.dirX, st.dirY = direction(ax, ay, tx, ty)

        -- Prepare lunge offset table for the attacker
        if not unitPositions[anim.attackerId] then
            unitPositions[anim.attackerId] = { x = ax, y = ay }
        end
        st.damageSpawned = false
    end

    local halfDur = ATTACK_DURATION * 0.5

    if t < halfDur then
        -- Phase 1: lunge toward target
        local frac = t / halfDur
        local ox = st.dirX * ATTACK_LUNGE_PX * frac
        local oy = st.dirY * ATTACK_LUNGE_PX * frac
        unitPositions[anim.attackerId].x = st.originX + ox
        unitPositions[anim.attackerId].y = st.originY + oy
    else
        -- Phase 2/3: spawn damage number at midpoint, then return
        if not st.damageSpawned then
            st.damageSpawned = true
            local color = {1, 1, 1}
            if anim.isCrit then
                color = {1, 1, 0}
            end
            combatAnim.spawnDamageNumber(st.targetX, st.targetY - TILE_SIZE * 0.5, anim.damage or 0, color)
        end

        -- Return to origin
        local frac = math_min(1, (t - halfDur) / halfDur)
        local ox = st.dirX * ATTACK_LUNGE_PX * (1 - frac)
        local oy = st.dirY * ATTACK_LUNGE_PX * (1 - frac)
        unitPositions[anim.attackerId].x = st.originX + ox
        unitPositions[anim.attackerId].y = st.originY + oy
    end

    if t >= ATTACK_DURATION then
        -- Snap attacker back exactly
        unitPositions[anim.attackerId].x = st.originX
        unitPositions[anim.attackerId].y = st.originY
        clearAnimState(anim)
        return true
    end
    return false
end

local function updateDeath(anim, dt)
    anim.elapsed = (anim.elapsed or 0) + dt
    anim.alpha = math_max(0, 1 - (anim.elapsed / DEATH_DURATION))
    if anim.elapsed >= DEATH_DURATION then
        anim.alpha = 0
        return true
    end
    return false
end

local function updateStatus(anim, dt)
    anim.elapsed = (anim.elapsed or 0) + dt
    return anim.elapsed >= STATUS_DURATION
end

local function updateTransition(anim, dt)
    anim.elapsed = (anim.elapsed or 0) + dt
    return anim.elapsed >= TRANSITION_DURATION
end

local function updateSyncAttack(anim, dt)
    anim.elapsed = (anim.elapsed or 0) + dt
    local st = getAnimState(anim)

    -- Spawn damage numbers once at the midpoint
    if not st.damageSpawned and anim.elapsed >= SYNC_DURATION * 0.5 then
        st.damageSpawned = true
        if anim.attacks then
            for _, atk in ipairs(anim.attacks) do
                local tx, ty = unitVisualPx(atk.toId)
                if tx then
                    local color = {1, 1, 1}
                    if atk.isCrit then color = {1, 1, 0} end
                    combatAnim.spawnDamageNumber(tx, ty - TILE_SIZE * 0.5, atk.damage or 0, color)
                end
            end
        end
    end

    if anim.elapsed >= SYNC_DURATION then
        clearAnimState(anim)
        return true
    end
    return false
end

local function updateReaction(anim, dt)
    anim.elapsed = (anim.elapsed or 0) + dt
    return anim.elapsed >= REACTION_DURATION
end

--- Update a single animation entry. Returns true when finished.
updateSingleAnim = function(anim, dt)
    if not anim or not anim.type then return true end

    local t = anim.type
    if t == "move" then
        return updateMove(anim, dt)
    elseif t == "attack" then
        return updateAttack(anim, dt)
    elseif t == "damage_number" then
        -- Damage numbers spawned inline don't block; they just get added to the
        -- persistent list immediately and are considered "done" for queue purposes.
        combatAnim.spawnDamageNumber(anim.x, anim.y, anim.amount, anim.color)
        return true
    elseif t == "death" then
        return updateDeath(anim, dt)
    elseif t == "status" then
        return updateStatus(anim, dt)
    elseif t == "transition_in" or t == "transition_out" then
        return updateTransition(anim, dt)
    elseif t == "simultaneous" then
        return updateSimultaneous(anim, dt)
    elseif t == "sync_attack" then
        return updateSyncAttack(anim, dt)
    elseif t == "reaction" then
        return updateReaction(anim, dt)
    end
    -- Unknown type -- treat as instant
    return true
end

--- Update a simultaneous container: all children in parallel.
--- Done when every child is done.
updateSimultaneous = function(anim, dt)
    if not anim.anims or #anim.anims == 0 then return true end

    local st = getAnimState(anim)
    if not st.finished then
        st.finished = {}
    end

    local allDone = true
    for i, child in ipairs(anim.anims) do
        if not st.finished[i] then
            local done = updateSingleAnim(child, dt)
            if done then
                st.finished[i] = true
                clearAnimState(child)
            else
                allDone = false
            end
        end
    end

    if allDone then
        clearAnimState(anim)
    end
    return allDone
end

-- ---------------------------------------------------------------------------
-- Drawing helpers
-- ---------------------------------------------------------------------------

local function drawAttackLunge(anim)
    -- The lunge is handled by displacing unitPositions in updateAttack.
    -- Nothing extra to draw here; the unit renderer uses getUnitVisualPos.
end

local function drawDeath(anim)
    if not anim or anim.type ~= "death" then return end
    local px, py = unitVisualPx(anim.unitId)
    if not px then return end
    -- Draw a semi-transparent red overlay fading out
    local alpha = anim.alpha or 0
    love.graphics.setColor(1, 0, 0, alpha * 0.35)
    love.graphics.rectangle("fill",
        px - TILE_SIZE * 0.5, py - TILE_SIZE * 0.5,
        TILE_SIZE, TILE_SIZE)
end

local function drawStatus(anim)
    if not anim or anim.type ~= "status" then return end
    local px, py = unitVisualPx(anim.unitId)
    if not px then return end

    local progress = (anim.elapsed or 0) / STATUS_DURATION
    -- Pulsing flash: sin-based alpha
    local alpha = math_abs(math.sin(progress * math.pi * 2))

    local effectColors = {
        burn    = {1, 0.4, 0.1},
        poison  = {0.3, 1, 0.3},
        freeze  = {0.4, 0.7, 1},
        stun    = {1, 1, 0.3},
        heal    = {0.3, 1, 0.3},
        shield  = {0, 0.8, 1},
        bleed   = {0.8, 0.1, 0.1},
    }
    local col = effectColors[anim.effect] or {1, 1, 1}

    love.graphics.setColor(col[1], col[2], col[3], alpha * 0.6)
    local font = getFont(11)
    love.graphics.setFont(font)
    local label = anim.effect or "?"
    if anim.applied == false then
        label = label .. " RESISTED"
    end
    local tw = font:getWidth(label)
    love.graphics.print(label, px - tw * 0.5, py - TILE_SIZE - 6)
end

local function drawTransition(anim)
    if not anim then return end
    local isIn = (anim.type == "transition_in")
    local progress = math_min(1, (anim.elapsed or 0) / TRANSITION_DURATION)

    local alpha
    if isIn then
        -- Fade in then hold
        alpha = math_min(1, progress * 2)
    else
        -- Hold then fade out
        if progress < 0.5 then
            alpha = 1
        else
            alpha = 1 - (progress - 0.5) * 2
        end
    end
    alpha = math_max(0, math_min(1, alpha))

    -- Draw centered text in screen space (push identity transform)
    love.graphics.push()
    love.graphics.origin()

    local sw = love.graphics.getWidth()
    local sh = love.graphics.getHeight()

    -- Darken background slightly
    love.graphics.setColor(0, 0, 0, alpha * 0.5)
    love.graphics.rectangle("fill", 0, 0, sw, sh)

    -- Title text
    local font = getFont(32)
    love.graphics.setFont(font)
    local text = anim.text or ""
    local tw = font:getWidth(text)
    love.graphics.setColor(1, 1, 1, alpha)
    love.graphics.print(text, (sw - tw) * 0.5, sh * 0.4)

    love.graphics.pop()
end

local function drawSyncAttack(anim)
    if not anim or anim.type ~= "sync_attack" then return end
    if not anim.attacks then return end
    local progress = math_min(1, (anim.elapsed or 0) / SYNC_DURATION)
    -- Draw lines from each attacker to each target
    local alpha = 1 - progress  -- fade out over duration
    love.graphics.setColor(1, 0.8, 0.2, alpha * 0.8)
    love.graphics.setLineWidth(2)
    for _, atk in ipairs(anim.attacks) do
        local fx, fy = unitVisualPx(atk.fromId)
        local tx, ty = unitVisualPx(atk.toId)
        if fx and tx then
            -- Draw line only up to the progress fraction for a "slash" effect
            local lx = lerp(fx, tx, math_min(1, progress * 2))
            local ly = lerp(fy, ty, math_min(1, progress * 2))
            love.graphics.line(fx, fy, lx, ly)
        end
    end
    love.graphics.setLineWidth(1)
end

local function drawReaction(anim)
    if not anim or anim.type ~= "reaction" then return end
    local px, py = unitVisualPx(anim.unitId)
    if not px then return end

    local progress = (anim.elapsed or 0) / REACTION_DURATION
    local alpha = 1 - progress  -- fade out

    local reactionColors = {
        counter_strike = {1, 0.6, 0.2},
        dodge          = {0.5, 0.9, 1},
        block          = {0.7, 0.7, 0.8},
        parry          = {1, 1, 0.4},
        reflect        = {0.8, 0.3, 1},
        absorb         = {0, 1, 1},
    }
    local col = reactionColors[anim.reactionType] or {1, 1, 1}

    love.graphics.setColor(col[1], col[2], col[3], alpha)
    local font = getFont(13)
    love.graphics.setFont(font)

    local label = (anim.reactionType or "reaction"):upper()
    if anim.success == false then
        label = label .. " FAILED"
    end

    local tw = font:getWidth(label)
    -- Float upward slightly
    local yOff = -progress * 12
    love.graphics.print(label, px - tw * 0.5, py - TILE_SIZE - 14 + yOff)
end

--- Draw sub-animations for a simultaneous container.
local function drawSimultaneous(anim)
    if not anim or not anim.anims then return end
    for _, child in ipairs(anim.anims) do
        combatAnim.drawSingleAnim(child)
    end
end

--- Draw a single animation entry (dispatches by type).
function combatAnim.drawSingleAnim(anim)
    if not anim or not anim.type then return end
    local t = anim.type
    if t == "attack" then
        drawAttackLunge(anim)
    elseif t == "death" then
        drawDeath(anim)
    elseif t == "status" then
        drawStatus(anim)
    elseif t == "transition_in" or t == "transition_out" then
        drawTransition(anim)
    elseif t == "sync_attack" then
        drawSyncAttack(anim)
    elseif t == "reaction" then
        drawReaction(anim)
    elseif t == "simultaneous" then
        drawSimultaneous(anim)
    end
    -- "move" and "damage_number" don't have extra draw; they affect
    -- unitPositions / damageNumbers which are drawn by the caller.
end

-- ---------------------------------------------------------------------------
-- Public API
-- ---------------------------------------------------------------------------

--- Add a single animation to the end of the queue.
function combatAnim.queue(anim)
    if not anim then return end
    -- Ensure elapsed is initialised so we don't have to nil-check everywhere
    anim.elapsed = anim.elapsed or 0
    table_insert(queue, anim)
end

--- Add a simultaneous animation group (all play in parallel, block until all done).
function combatAnim.queueBatch(anims)
    if not anims or #anims == 0 then return end
    if #anims == 1 then
        -- No need to wrap a single animation
        combatAnim.queue(anims[1])
        return
    end
    combatAnim.queue({
        type = "simultaneous",
        anims = anims,
        elapsed = 0,
    })
end

--- Main update loop. Call once per frame.
function combatAnim.update(dt)
    -- 1. Pop next animation from queue if we have no current one
    if not currentAnim and #queue > 0 then
        currentAnim = table_remove(queue, 1)
    end

    -- 2. Update current animation
    if currentAnim then
        local done = updateSingleAnim(currentAnim, dt)
        if done then
            clearAnimState(currentAnim)
            currentAnim = nil
            -- Don't immediately pop the next one this frame; let one frame pass
            -- so drawing can catch the final state. The next update will pop.
        end
    end

    -- 3. Always update persistent floating damage numbers
    for i = #damageNumbers, 1, -1 do
        local dn = damageNumbers[i]
        dn.elapsed = dn.elapsed + dt
        dn.offsetY = dn.offsetY + (DAMAGE_FLOAT_PX / DAMAGE_FLOAT_DURATION) * dt
        dn.alpha = math_max(0, 1 - (dn.elapsed / DAMAGE_FLOAT_DURATION))
        if dn.elapsed >= DAMAGE_FLOAT_DURATION then
            table_remove(damageNumbers, i)
        end
    end
end

--- Render active animations (call inside the world-space draw pass).
function combatAnim.draw()
    if currentAnim then
        combatAnim.drawSingleAnim(currentAnim)
    end
end

--- Separate draw function for floating damage numbers (call on top of everything).
--- Expects to be called inside the world-space transform.
function combatAnim.drawDamageNumbers()
    if #damageNumbers == 0 then return end
    local font = getFont(14)
    love.graphics.setFont(font)
    for _, dn in ipairs(damageNumbers) do
        local col = dn.color or {1, 1, 1}
        local alpha = dn.alpha or 1
        local x = dn.x
        local y = dn.y - dn.offsetY

        -- Shadow for readability
        love.graphics.setColor(0, 0, 0, alpha * 0.6)
        local text = tostring(dn.amount)
        local tw = font:getWidth(text)
        love.graphics.print(text, x - tw * 0.5 + 1, y + 1)

        -- Actual number
        love.graphics.setColor(col[1], col[2], col[3], alpha)
        love.graphics.print(text, x - tw * 0.5, y)
    end
end

--- Returns true if the animation system is busy (queue or current playing).
--- When true, game input should be blocked.
function combatAnim.isPlaying()
    return currentAnim ~= nil or #queue > 0
end

--- Force-clear the entire animation state. Used on disconnect, skip, or scene exit.
function combatAnim.clear()
    queue = {}
    if currentAnim then
        clearAnimState(currentAnim)
    end
    currentAnim = nil
    damageNumbers = {}
    animState = {}
    -- Don't clear unitPositions/unitBasePositions here; the caller decides
    -- whether to keep those (e.g. skip vs full reset).
end

--- Return the interpolated visual pixel position for a unit.
--- Returns x, y or nil if no visual offset is active.
function combatAnim.getUnitVisualPos(unitId)
    local vis = unitPositions[unitId]
    if vis then
        return vis.x, vis.y
    end
    -- Fall back to base position if set
    local base = unitBasePositions[unitId]
    if base then
        return tileToPx(base.x, base.y)
    end
    return nil, nil
end

--- Set the base grid position for a unit (called when server confirms position).
--- Also updates the visual position to match if no animation is actively moving it.
function combatAnim.setUnitBasePos(unitId, x, y)
    unitBasePositions[unitId] = { x = x, y = y }
    -- If the unit has no active visual position, snap it
    if not unitPositions[unitId] then
        local px, py = tileToPx(x, y)
        unitPositions[unitId] = { x = px, y = py }
    end
end

--- Directly spawn a floating damage number (convenience, does not go through queue).
function combatAnim.spawnDamageNumber(x, y, amount, color)
    table_insert(damageNumbers, {
        x = x,
        y = y,
        amount = amount or 0,
        color = color or {1, 1, 1},
        elapsed = 0,
        offsetY = 0,
        alpha = 1,
    })
end

--- Reset all state for a new combat encounter.
function combatAnim.init()
    queue = {}
    currentAnim = nil
    damageNumbers = {}
    unitPositions = {}
    unitBasePositions = {}
    animState = {}
    -- Pre-warm fonts so first frame doesn't hitch
    getFont(11)
    getFont(13)
    getFont(14)
    getFont(32)
end

--- Clean up all state when combat ends.
function combatAnim.cleanup()
    queue = {}
    if currentAnim then
        clearAnimState(currentAnim)
    end
    currentAnim = nil
    damageNumbers = {}
    unitPositions = {}
    unitBasePositions = {}
    animState = {}
    -- Don't nil out fontCache; fonts are reusable across combats
end

-- ---------------------------------------------------------------------------
-- Accessors for external systems that need to inspect state
-- ---------------------------------------------------------------------------

--- Return the number of queued animations (not counting current).
function combatAnim.queueLength()
    return #queue
end

--- Return whether a specific unit is currently being animated for death.
function combatAnim.isUnitDying(unitId)
    if currentAnim and currentAnim.type == "death" and currentAnim.unitId == unitId then
        return true, currentAnim.alpha or 0
    end
    if currentAnim and currentAnim.type == "simultaneous" and currentAnim.anims then
        for _, child in ipairs(currentAnim.anims) do
            if child.type == "death" and child.unitId == unitId then
                return true, child.alpha or 0
            end
        end
    end
    return false, 1
end

--- Remove a unit from the visual position tracking (e.g. after confirmed death/removal).
function combatAnim.removeUnit(unitId)
    unitPositions[unitId] = nil
    unitBasePositions[unitId] = nil
end

--- Return the current base grid position for a unit, or nil.
function combatAnim.getUnitBasePos(unitId)
    local base = unitBasePositions[unitId]
    if base then
        return base.x, base.y
    end
    return nil, nil
end

return combatAnim
