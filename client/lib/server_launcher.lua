-- ============================================================================
-- server_launcher.lua
-- Launches and manages a local Node.js server for offline/LAN play.
-- ============================================================================

local net = require("lib.net")

local M = {}

-- State
M.process = nil         -- process handle (platform-dependent)
M.pid = nil             -- process ID for cleanup
M.running = false       -- is local server running?
M.launching = false     -- currently launching?
M.lastError = nil       -- last error message

-- Detect OS
local isWindows = love.system.getOS() == "Windows"

-- ---------------------------------------------------------------------------
-- Resolve the directory containing the game executable.
-- In a fused LOVE build, love.filesystem.getSource() returns the path to
-- the fused .exe itself (e.g. "F:/build/MMOLite/MMOLite.exe").
-- In an unfused run (`love client/`), it returns the project directory
-- (e.g. "F:/MMOLite/client").
-- We need the *directory* that contains node.exe and server.js, which is
-- the folder that holds the fused exe, or the parent of client/ when unfused.
-- ---------------------------------------------------------------------------
local exeDir = nil

local function getExeDir()
    if exeDir then return exeDir end

    local source = love.filesystem.getSource()    -- fused: "X:/path/to/Game.exe"  unfused: "X:/path/to/client"
    local isFused = love.filesystem.isFused()

    if isFused then
        -- source is the full path to the .exe — strip the filename to get directory
        exeDir = source:match("^(.*)[/\\][^/\\]+$") or source
    else
        -- source is the client/ directory — go up one level to the project root
        exeDir = source:match("^(.*)[/\\][^/\\]+$") or source
    end

    -- Normalize path separators to forward slashes (Lua io works fine with them on Windows)
    exeDir = exeDir:gsub("\\", "/")

    print("[server_launcher] Resolved exe directory: " .. exeDir)
    print("[server_launcher] isFused=" .. tostring(isFused) .. "  source=" .. tostring(source))
    return exeDir
end

-- Sanitize a string for safe use in shell commands
local function sanitizeShellArg(str)
    if not str then return "" end
    if isWindows then
        -- Strip characters that can break out of Windows shell commands
        return str:gsub('[&|<>^%%"!]', '')
    else
        -- For Unix, strip single quotes and shell metacharacters
        return str:gsub("[&|<>;`$(){}!'\"\\]", '')
    end
end

-- ---------------------------------------------------------------------------
-- Find node.exe location (using absolute paths based on exe directory)
-- ---------------------------------------------------------------------------
local function findNodePath()
    local dir = getExeDir()

    -- Check bundled locations first (absolute paths relative to exe dir)
    local bundledPaths
    if isWindows then
        bundledPaths = {
            dir .. "/node.exe",
            dir .. "/bin/node.exe",
        }
    else
        bundledPaths = {
            dir .. "/node",
            dir .. "/bin/node",
        }
    end

    for _, path in ipairs(bundledPaths) do
        local f = io.open(path, "r")
        if f then
            f:close()
            print("[server_launcher] Found node at: " .. path)
            return path
        end
    end

    -- Fall back to system PATH
    if isWindows then
        local handle = io.popen("where node.exe 2>NUL")
        if handle then
            local result = handle:read("*l")
            handle:close()
            if result and #result > 0 then
                print("[server_launcher] Found node on PATH: " .. result)
                return result
            end
        end
    else
        local handle = io.popen("which node 2>/dev/null")
        if handle then
            local result = handle:read("*l")
            handle:close()
            if result and #result > 0 then
                print("[server_launcher] Found node on PATH: " .. result)
                return result
            end
        end
    end

    print("[server_launcher] node not found! Searched: " .. table.concat(bundledPaths, ", "))
    return nil
end

-- ---------------------------------------------------------------------------
-- Find server.js location (using absolute paths based on exe directory)
-- ---------------------------------------------------------------------------
local function findServerPath()
    local dir = getExeDir()

    local paths = {
        dir .. "/server.js",
        dir .. "/../server.js",
    }
    for _, path in ipairs(paths) do
        local f = io.open(path, "r")
        if f then
            f:close()
            print("[server_launcher] Found server.js at: " .. path)
            return path
        end
    end

    print("[server_launcher] server.js not found! Searched: " .. table.concat(paths, ", "))
    return nil
end

-- ---------------------------------------------------------------------------
-- Generate a config file for custom server settings
-- ---------------------------------------------------------------------------
function M.generateConfig(opts)
    opts = opts or {}
    local config = {
        shardId = opts.shardId or "local",
        shardName = opts.shardName or "Local Server",
        port = opts.port or 3001,
        masterServerUrl = opts.public and "http://<shard1-ip>:4000" or "",
        official = false,
        maxPlayers = opts.maxPlayers or 8,
        rules = {
            pvpEnabled = opts.pvpEnabled or false,
            xpRate = opts.xpRate or 1.0,
            dropRate = opts.dropRate or 1.0,
            offlineBonus = opts.offline or false,
        },
    }

    -- Write config to LOVE save directory
    local json = net.json.encode(config)
    local configPath = love.filesystem.getSaveDirectory() .. "/custom-shard-config.json"
    local f = io.open(configPath, "w")
    if f then
        f:write(json)
        f:close()
        return configPath
    end
    return nil
end

-- ---------------------------------------------------------------------------
-- Save/load server configs
-- ---------------------------------------------------------------------------
function M.saveServerConfig(name, opts)
    local configs = M.loadSavedConfigs()
    configs[name] = opts
    local json = net.json.encode(configs)
    love.filesystem.write("server-configs.json", json)
end

function M.loadSavedConfigs()
    if love.filesystem.getInfo("server-configs.json") then
        local data = love.filesystem.read("server-configs.json")
        if data then
            local ok, configs = pcall(net.json.decode, data)
            if ok and type(configs) == "table" then
                return configs
            end
        end
    end
    return {}
end

function M.deleteSavedConfig(name)
    local configs = M.loadSavedConfigs()
    configs[name] = nil
    local json = net.json.encode(configs)
    love.filesystem.write("server-configs.json", json)
end

-- ---------------------------------------------------------------------------
-- Launch local server
-- ---------------------------------------------------------------------------
function M.launch(opts, callback)
    if M.running or M.launching then
        if callback then callback(false, "Server already running") end
        return
    end

    opts = opts or {}
    M.launching = true
    M.lastError = nil

    local nodePath = findNodePath()
    if not nodePath then
        M.launching = false
        M.lastError = "Node.js not found. Install Node.js or place node.exe next to the game."
        if callback then callback(false, M.lastError) end
        return
    end

    local serverPath = findServerPath()
    if not serverPath then
        M.launching = false
        M.lastError = "server.js not found."
        if callback then callback(false, M.lastError) end
        return
    end

    local port = opts.port or 3001
    local offline = opts.offline and "1" or "0"

    -- Build environment variables
    local envVars = string.format(
        "PORT=%d OFFLINE_MODE=%s ACCOUNT_SECRET=%s",
        port, offline, opts.accountSecret or "offline-local-key"
    )

    -- Add config path if custom settings provided
    local configPath = nil
    if opts.configPath then
        configPath = opts.configPath
    elseif opts.custom then
        configPath = M.generateConfig(opts)
    else
        -- Default to local-server-config.json so the server doesn't try to
        -- heartbeat to a master server (shard-config.json is for production).
        local dir = getExeDir()
        local localCfg = dir .. "/local-server-config.json"
        local f = io.open(localCfg, "r")
        if f then
            f:close()
            configPath = localCfg
        end
    end
    if configPath then
        envVars = envVars .. ' MMOLITE_CONFIG="' .. configPath .. '"'
    end

    -- Add password if set (sanitize to prevent shell injection)
    if opts.password and #opts.password > 0 then
        envVars = envVars .. " SHARD_PASSWORD=" .. sanitizeShellArg(opts.password)
    end

    -- Build and launch the server process, capturing PID for targeted shutdown
    local cmd
    local pidFile = love.filesystem.getSaveDirectory() .. "/server.pid"

    -- We must cd into the exe directory so that node can find its
    -- node_modules, server.js, and all other server files via
    -- relative require() paths. The nodePath and serverPath are already
    -- absolute, but node's own require('./foo') needs the correct CWD.
    local dir = getExeDir()

    if isWindows then
        local winDir = dir:gsub("/", "\\")
        local saveDir = love.filesystem.getSaveDirectory()
        local batPath = saveDir .. "/launch_server.bat"
        local winPidFile = pidFile:gsub("/", "\\")

        -- Write a lean bat file: set env vars, run node directly.
        -- Node writes its own PID via MMOLITE_PID_FILE (no slow tasklist).
        local batFile = io.open(batPath, "w")
        if batFile then
            batFile:write("@echo off\r\n")
            batFile:write('cd /d "' .. winDir .. '"\r\n')
            batFile:write("set PORT=" .. port .. "\r\n")
            batFile:write("set OFFLINE_MODE=" .. offline .. "\r\n")
            batFile:write("set ACCOUNT_SECRET=" .. (opts.accountSecret or "offline-local-key") .. "\r\n")
            batFile:write('set MMOLITE_PID_FILE=' .. winPidFile .. '\r\n')
            if configPath then
                batFile:write('set MMOLITE_CONFIG=' .. configPath .. '\r\n')
            end
            if opts.password and #opts.password > 0 then
                batFile:write("set SHARD_PASSWORD=" .. sanitizeShellArg(opts.password) .. "\r\n")
            end
            -- Run node directly (bat stays alive as long as node runs — needed for env vars)
            batFile:write('"' .. nodePath .. '" "' .. serverPath .. '"\r\n')
            batFile:close()
        end

        -- Write a VBScript launcher that runs the bat completely hidden (no CMD window).
        -- WshShell.Run with 0 = hidden window, False = don't wait for completion.
        local vbsPath = saveDir .. "/launch_server.vbs"
        local vbsFile = io.open(vbsPath, "w")
        if vbsFile then
            local winBatPath = batPath:gsub("/", "\\")
            vbsFile:write('Set WshShell = CreateObject("WScript.Shell")\r\n')
            vbsFile:write('WshShell.Run """' .. winBatPath .. '""", 0, False\r\n')
            vbsFile:close()
        end

        -- wscript returns instantly and the bat runs hidden in the background
        cmd = 'wscript "' .. vbsPath .. '"'
    else
        -- On Unix, cd into the directory, then launch in background
        cmd = string.format(
            'cd "%s" && MMOLITE_PID_FILE="%s" %s "%s" "%s" > /dev/null 2>&1 &',
            dir, pidFile, envVars, nodePath, serverPath
        )
    end

    print("[server_launcher] Launching: " .. cmd)
    os.execute(cmd)
    M._pidFile = pidFile

    -- Poll for health check
    M._pollHealth(port, 0, callback)
end

-- ---------------------------------------------------------------------------
-- Poll health endpoint until server responds
-- ---------------------------------------------------------------------------
function M._pollHealth(port, attempts, callback)
    local maxAttempts = 60 -- 60 * 0.5s = 30s timeout
    if attempts >= maxAttempts then
        M.launching = false
        M.lastError = "Server failed to start (timeout)"
        if callback then callback(false, M.lastError) end
        return
    end

    M._healthTimer = {
        port = port,
        attempts = attempts,
        maxAttempts = maxAttempts,
        callback = callback,
        elapsed = 0,
    }
end

-- Cancel a pending launch (clears health poll so callback won't fire after scene exit)
function M.cancel()
    M._healthTimer = nil
    M.launching = false
end

-- Must be called from love.update(dt) to drive health polling
function M.update(dt)
    if not M._healthTimer then return end

    local ht = M._healthTimer
    ht.elapsed = ht.elapsed + dt

    if ht.elapsed < 0.1 then return end
    ht.elapsed = 0

    -- Try health check (2s timeout per attempt — we poll frequently)
    net.fetchHealth("127.0.0.1", ht.port, function(success, data)
        if success then
            M._healthTimer = nil
            M.running = true
            M.launching = false
            M.lastError = nil
            print("[server_launcher] Server is up on port " .. ht.port)
            if ht.callback then ht.callback(true) end
        else
            ht.attempts = ht.attempts + 1
            if ht.attempts >= ht.maxAttempts then
                M._healthTimer = nil
                M.launching = false
                M.lastError = "Server failed to start (timeout after " .. ht.attempts .. " attempts)"
                print("[server_launcher] " .. M.lastError)
                if ht.callback then ht.callback(false, M.lastError) end
            end
        end
    end, 2)
end

-- ---------------------------------------------------------------------------
-- Shutdown local server
-- ---------------------------------------------------------------------------
function M.shutdown()
    if not M.running and not M.launching then return end

    print("[server_launcher] Shutting down local server...")

    M._killServerProcess()

    M.running = false
    M.launching = false
    M.pid = nil
    M._healthTimer = nil
end

-- Internal: kill the server process by PID file or fallback
function M._killServerProcess()
    -- Try to read PID from pid file for targeted kill
    local pid = nil
    local pidFile = M._pidFile or (love.filesystem.getSaveDirectory() .. "/server.pid")
    local f = io.open(pidFile, "r")
    if f then
        local content = f:read("*l")
        f:close()
        if content then
            pid = content:match("(%d+)")
        end
        os.remove(pidFile)
    end

    if isWindows then
        if pid then
            os.execute('taskkill /F /PID ' .. pid .. ' 2>NUL')
            print("[server_launcher] Killed node PID " .. pid)
        else
            -- Fallback: kill by window title (less destructive than /IM node.exe)
            os.execute('taskkill /F /FI "WINDOWTITLE eq MMOLite*" /IM node.exe 2>NUL')
        end
    else
        if pid then
            os.execute("kill " .. pid .. " 2>/dev/null || true")
            print("[server_launcher] Killed node PID " .. pid)
        else
            os.execute("pkill -f 'node server.js' 2>/dev/null || true")
        end
    end
    M._pidFile = nil
end

-- Kill any orphaned server from a previous session (e.g. game crashed without calling quit)
function M.cleanupOrphans()
    local pidFile = love.filesystem.getSaveDirectory() .. "/server.pid"
    local f = io.open(pidFile, "r")
    if f then
        local content = f:read("*l")
        f:close()
        if content then
            local pid = content:match("(%d+)")
            if pid then
                print("[server_launcher] Found orphaned server (PID " .. pid .. "), cleaning up...")
                if isWindows then
                    os.execute('taskkill /F /PID ' .. pid .. ' 2>NUL')
                else
                    os.execute("kill " .. pid .. " 2>/dev/null || true")
                end
            end
        end
        os.remove(pidFile)
    end
end

-- ---------------------------------------------------------------------------
-- Get local LAN IP address
-- ---------------------------------------------------------------------------
function M.getLocalIP()
    if isWindows then
        local handle = io.popen('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike \"*Loopback*\" -and $_.PrefixOrigin -ne \"WellKnown\" } | Select-Object -First 1).IPAddress" 2>NUL')
        if handle then
            local result = handle:read("*l")
            handle:close()
            if result and #result > 0 and result ~= "" then
                return result
            end
        end
        -- Fallback: parse ipconfig
        local handle2 = io.popen('ipconfig 2>NUL')
        if handle2 then
            local output = handle2:read("*a")
            handle2:close()
            local ip = output:match("IPv4 Address[%s%.]*:%s*(%d+%.%d+%.%d+%.%d+)")
            if ip then return ip end
        end
    else
        -- macOS: try common network interfaces (en0 = Wi-Fi, en1 = Ethernet)
        local interfaces = { "en0", "en1", "en2" }
        for _, iface in ipairs(interfaces) do
            local handle = io.popen("ifconfig " .. iface .. " 2>/dev/null | grep 'inet ' | awk '{print $2}'")
            if handle then
                local result = handle:read("*l")
                handle:close()
                if result and #result > 0 and result:match("^%d+%.%d+%.%d+%.%d+$") then
                    return result
                end
            end
        end
        -- Linux fallback: hostname -I
        local handle = io.popen("hostname -I 2>/dev/null | awk '{print $1}'")
        if handle then
            local result = handle:read("*l")
            handle:close()
            if result and #result > 0 then
                return result
            end
        end
    end
    return "127.0.0.1"
end

return M
