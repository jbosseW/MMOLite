-- ============================================================================
-- lan_discovery.lua
-- UDP listener for LAN server discovery via broadcast packets.
-- Uses LuaSocket (bundled with LOVE2D).
-- ============================================================================

local socket = require("socket")
local net = require("lib.net")

local M = {}

-- State
M.servers = {}          -- discovered servers: key=host:port, value={name, host, port, players, maxPlayers, version, hasPassword, rules, lastSeen}
M.listening = false     -- is listener active?
M.udp = nil             -- UDP socket

local DISCOVERY_PORT = 5050
local EXPIRE_TIME = 10  -- seconds before a server is considered gone

-- ---------------------------------------------------------------------------
-- Start listening for LAN broadcasts
-- ---------------------------------------------------------------------------
function M.start()
    if M.listening then return true end

    local udp = socket.udp()
    if not udp then
        print("[lan_discovery] Failed to create UDP socket")
        return false
    end

    -- Allow address reuse and bind to discovery port
    udp:setsockname("0.0.0.0", DISCOVERY_PORT)
    udp:settimeout(0) -- non-blocking

    M.udp = udp
    M.listening = true
    M.servers = {}
    print("[lan_discovery] Listening for LAN servers on port " .. DISCOVERY_PORT)
    return true
end

-- ---------------------------------------------------------------------------
-- Stop listening
-- ---------------------------------------------------------------------------
function M.stop()
    if M.udp then
        M.udp:close()
        M.udp = nil
    end
    M.listening = false
    M.servers = {}
end

-- ---------------------------------------------------------------------------
-- Update: read incoming packets and expire old servers
-- Must be called from love.update(dt)
-- ---------------------------------------------------------------------------
function M.update(dt)
    if not M.listening or not M.udp then return end

    -- Read all available packets (non-blocking)
    while true do
        local data, ip, port = M.udp:receivefrom()
        if not data then break end

        -- Try to parse as JSON
        local ok, packet = pcall(net.json.decode, data)
        if ok and type(packet) == "table" and packet.type == "MMOLITE_SHARD" then
            local key = (packet.host or ip) .. ":" .. (packet.port or 3001)
            M.servers[key] = {
                name = packet.name or "Unknown Server",
                host = packet.host or ip,
                port = packet.port or 3001,
                players = packet.players or 0,
                maxPlayers = packet.maxPlayers or 8,
                version = packet.version or "?",
                hasPassword = packet.hasPassword or false,
                rules = packet.rules or {},
                lastSeen = love.timer.getTime(),
                sourceIP = ip,
            }
        end
    end

    -- Expire servers not seen recently
    local now = love.timer.getTime()
    local toRemove = {}
    for key, server in pairs(M.servers) do
        if now - server.lastSeen > EXPIRE_TIME then
            toRemove[#toRemove + 1] = key
        end
    end
    for _, key in ipairs(toRemove) do
        M.servers[key] = nil
    end
end

-- ---------------------------------------------------------------------------
-- Get sorted list of discovered servers
-- ---------------------------------------------------------------------------
function M.getServerList()
    local list = {}
    for _, server in pairs(M.servers) do
        list[#list + 1] = server
    end
    -- Sort by name
    table.sort(list, function(a, b) return a.name < b.name end)
    return list
end

-- ---------------------------------------------------------------------------
-- Get server count
-- ---------------------------------------------------------------------------
function M.getServerCount()
    local count = 0
    for _ in pairs(M.servers) do count = count + 1 end
    return count
end

return M
