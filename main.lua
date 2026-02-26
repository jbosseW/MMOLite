-- ============================================================================
-- MMOLite - Love2D Client
-- Pokemon-style MMO connecting to MMOLite server via Socket.IO
-- ============================================================================

-- Scene manager
local currentScene = nil
local scenes = {}

function _G.switchScene(name)
    if scenes[name] then
        currentScene = scenes[name]
        if currentScene.load then
            currentScene.load()
        end
    else
        print("[main] Unknown scene: " .. tostring(name))
    end
end

local debugFont = nil

-- Global state (shared across scenes)
_G.selectedShard = nil
_G.gameClient = nil
_G.identity = nil
_G.serverAuth = nil
_G.pendingClient = nil
_G.pendingAuth = nil
_G.pendingCreatePin = nil
_G.serverStats = nil

function love.load()
    love.graphics.setBackgroundColor(0.08, 0.08, 0.14)

    debugFont = love.graphics.newFont(11)

    -- Load scenes
    scenes.shards = require("scenes.shards")
    scenes.login = require("scenes.login")
    scenes.game = require("scenes.game")

    -- Start at shard selection
    _G.switchScene("shards")
end

function love.update(dt)
    dt = math.min(dt, 1/20) -- cap dt

    -- Drive pending network client (for login handshake)
    if _G.pendingClient then
        _G.pendingClient:update(dt)
    end

    if currentScene and currentScene.update then
        currentScene.update(dt)
    end
end

function love.draw()
    if currentScene and currentScene.draw then
        currentScene.draw()
    end

    -- FPS counter (debug)
    love.graphics.setColor(1, 1, 1, 0.25)
    love.graphics.setFont(debugFont)
    love.graphics.print("FPS: " .. love.timer.getFPS(), 5, love.graphics.getHeight() - 16)
end

function love.mousepressed(x, y, button)
    if currentScene and currentScene.mousepressed then
        currentScene.mousepressed(x, y, button)
    end
end

function love.mousemoved(x, y)
    if currentScene and currentScene.mousemoved then
        currentScene.mousemoved(x, y)
    end
end

function love.keypressed(key)
    if currentScene and currentScene.keypressed then
        currentScene.keypressed(key)
    end
end

function love.textinput(text)
    if currentScene and currentScene.textinput then
        currentScene.textinput(text)
    end
end

function love.resize(w, h)
    -- Scenes can handle resize if needed
end
