-- schema.sql — PostgreSQL schema for MMOLite account persistence
-- Auto-applied on first successful connection by db.js
--
-- Mirrors the file-based account structure in accounts.js.
-- Top-level scalar fields (username, chips, level, xp, color) are stored as
-- columns for efficient indexing and leaderboard queries.  Everything else
-- (monsters, inventory, cards, mmoInventory, equipment, stats, skills,
-- friends, clickerState, etc.) lives in the JSONB `data` column.

CREATE TABLE IF NOT EXISTS accounts (
  key          TEXT PRIMARY KEY,
  username     TEXT NOT NULL,
  color        TEXT DEFAULT '#ffffff',
  chips        BIGINT DEFAULT 1000,
  level        INTEGER DEFAULT 1,
  xp           BIGINT DEFAULT 0,
  data         JSONB DEFAULT '{}',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
CREATE INDEX IF NOT EXISTS idx_accounts_chips    ON accounts(chips DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_level    ON accounts(level DESC);
