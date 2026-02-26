-- lib/sha256.lua
-- Pure Lua SHA-256 implementation for Proof-of-Work
-- Operates on byte strings, returns hex digest

local _bit = rawget(_G, "bit") or require("bit")
local band  = _bit.band
local bor   = _bit.bor
local bxor  = _bit.bxor
local bnot  = _bit.bnot
local rshift = _bit.rshift
local lshift = _bit.lshift

local function rrotate(x, n)
    return bor(rshift(x, n), lshift(band(x, 0xFFFFFFFF), 32 - n))
end

local K = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
}

local function preprocess(msg)
    local len = #msg
    local bitlen = len * 8
    msg = msg .. "\128"
    while (#msg % 64) ~= 56 do
        msg = msg .. "\0"
    end
    -- Append 64-bit big-endian length
    local hi = math.floor(bitlen / 2^32)
    local lo = bitlen % 2^32
    msg = msg .. string.char(
        band(rshift(hi, 24), 0xFF), band(rshift(hi, 16), 0xFF),
        band(rshift(hi, 8), 0xFF), band(hi, 0xFF),
        band(rshift(lo, 24), 0xFF), band(rshift(lo, 16), 0xFF),
        band(rshift(lo, 8), 0xFF), band(lo, 0xFF)
    )
    return msg
end

local function sha256(msg)
    msg = preprocess(msg)

    local H0 = 0x6a09e667
    local H1 = 0xbb67ae85
    local H2 = 0x3c6ef372
    local H3 = 0xa54ff53a
    local H4 = 0x510e527f
    local H5 = 0x9b05688c
    local H6 = 0x1f83d9ab
    local H7 = 0x5be0cd19

    local W = {}

    for chunk = 1, #msg, 64 do
        for i = 0, 15 do
            local off = chunk + i * 4
            local b1, b2, b3, b4 = msg:byte(off, off + 3)
            W[i] = bor(lshift(b1, 24), lshift(b2, 16), lshift(b3, 8), b4)
        end

        for i = 16, 63 do
            local s0 = bxor(rrotate(W[i-15], 7), rrotate(W[i-15], 18), rshift(W[i-15], 3))
            local s1 = bxor(rrotate(W[i-2], 17), rrotate(W[i-2], 19), rshift(W[i-2], 10))
            W[i] = band(W[i-16] + s0 + W[i-7] + s1, 0xFFFFFFFF)
        end

        local a, b, c, d, e, f, g, h = H0, H1, H2, H3, H4, H5, H6, H7

        for i = 0, 63 do
            local S1 = bxor(rrotate(e, 6), rrotate(e, 11), rrotate(e, 25))
            local ch = bxor(band(e, f), band(bnot(e), g))
            local temp1 = band(h + S1 + ch + K[i+1] + W[i], 0xFFFFFFFF)
            local S0 = bxor(rrotate(a, 2), rrotate(a, 13), rrotate(a, 22))
            local maj = bxor(band(a, b), band(a, c), band(b, c))
            local temp2 = band(S0 + maj, 0xFFFFFFFF)

            h = g
            g = f
            f = e
            e = band(d + temp1, 0xFFFFFFFF)
            d = c
            c = b
            b = a
            a = band(temp1 + temp2, 0xFFFFFFFF)
        end

        H0 = band(H0 + a, 0xFFFFFFFF)
        H1 = band(H1 + b, 0xFFFFFFFF)
        H2 = band(H2 + c, 0xFFFFFFFF)
        H3 = band(H3 + d, 0xFFFFFFFF)
        H4 = band(H4 + e, 0xFFFFFFFF)
        H5 = band(H5 + f, 0xFFFFFFFF)
        H6 = band(H6 + g, 0xFFFFFFFF)
        H7 = band(H7 + h, 0xFFFFFFFF)
    end

    return string.format("%08x%08x%08x%08x%08x%08x%08x%08x",
        H0, H1, H2, H3, H4, H5, H6, H7)
end

-- Returns raw bytes (for leading-zero-bit checking)
local function sha256_binary(msg)
    local hex = sha256(msg)
    local bytes = {}
    for i = 1, #hex, 2 do
        bytes[#bytes + 1] = tonumber(hex:sub(i, i+1), 16)
    end
    return bytes
end

-- Check if hash has N leading zero bits
local function hasLeadingZeros(hashBytes, difficulty)
    local fullBytes = math.floor(difficulty / 8)
    local remainBits = difficulty % 8

    for i = 1, fullBytes do
        if hashBytes[i] ~= 0 then return false end
    end

    if remainBits > 0 then
        local mask = lshift(0xFF, 8 - remainBits)
        mask = band(mask, 0xFF)
        if band(hashBytes[fullBytes + 1], mask) ~= 0 then return false end
    end

    return true
end

-- Solve a PoW challenge: find nonce where SHA256(challenge..nonce) has `difficulty` leading zero bits
-- Returns nonce string, or nil if maxAttempts exceeded
-- `batchSize` controls how many hashes per love.update frame (non-blocking solving)
local function solveChallenge(challenge, difficulty, maxAttempts)
    maxAttempts = maxAttempts or 10000000
    for i = 0, maxAttempts - 1 do
        local nonce = tostring(i)
        local hash = sha256_binary(challenge .. nonce)
        if hasLeadingZeros(hash, difficulty) then
            return nonce
        end
    end
    return nil
end

return {
    sha256 = sha256,
    sha256_binary = sha256_binary,
    hasLeadingZeros = hasLeadingZeros,
    solveChallenge = solveChallenge,
}
