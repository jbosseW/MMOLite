// handlers/challenges.js
// Daily Challenges & Achievement system — MMO-themed.
// Socket handlers: get_daily_challenges, claim_challenge_reward, get_achievements, check_achievements
//
// Daily challenges rotate per player per day (5 selected from pool via seeded RNG).
// Achievements are one-time permanent unlocks with progress tracking.

// ─── Daily Challenge Pool (MMO-themed) ───
// 22 possible daily challenges. Each day, 5 are randomly selected per user.
var CHALLENGE_POOL = [
  // Gathering
  { id: 'harvest_10',  title: 'Gatherer',        description: 'Harvest 10 resources',   target: 10, reward: { coins: 100, xp: 50 },  track: 'harvest' },
  { id: 'harvest_50',  title: 'Master Gatherer',  description: 'Harvest 50 resources',   target: 50, reward: { coins: 300, xp: 150 }, track: 'harvest' },
  { id: 'mine_20',     title: 'Miner\'s Work',    description: 'Mine 20 ore',            target: 20, reward: { coins: 150, xp: 75 },  track: 'mine' },
  { id: 'chop_20',     title: 'Lumberjack',       description: 'Chop 20 trees',          target: 20, reward: { coins: 150, xp: 75 },  track: 'chop' },
  { id: 'catch_10',    title: 'Fisher',           description: 'Catch 10 fish',          target: 10, reward: { coins: 100, xp: 50 },  track: 'fish' },

  // Crafting
  { id: 'craft_5',     title: 'Artisan',          description: 'Craft 5 items',          target: 5,  reward: { coins: 200, xp: 100 }, track: 'craft' },
  { id: 'craft_20',    title: 'Workshop Master',  description: 'Craft 20 items',         target: 20, reward: { coins: 500, xp: 250 }, track: 'craft' },
  { id: 'cook_5',      title: 'Chef',             description: 'Cook 5 meals',           target: 5,  reward: { coins: 150, xp: 75 },  track: 'cook' },
  { id: 'repair_3',    title: 'Mender',           description: 'Repair 3 items',         target: 3,  reward: { coins: 100, xp: 50 },  track: 'repair' },

  // Combat
  { id: 'kill_10',     title: 'Monster Hunter',   description: 'Defeat 10 monsters',     target: 10, reward: { coins: 200, xp: 100 }, track: 'monster_kill' },
  { id: 'kill_50',     title: 'Slayer',           description: 'Defeat 50 monsters',     target: 50, reward: { coins: 500, xp: 300 }, track: 'monster_kill' },
  { id: 'ability_20',  title: 'Spellslinger',     description: 'Use 20 abilities',       target: 20, reward: { coins: 150, xp: 100 }, track: 'ability_use' },
  { id: 'boss_1',      title: 'Boss Slayer',      description: 'Defeat a boss',          target: 1,  reward: { coins: 500, xp: 250, pack: true }, track: 'boss_kill' },
  { id: 'crit_10',     title: 'Precision',        description: 'Land 10 critical hits',  target: 10, reward: { coins: 200, xp: 100 }, track: 'crit_hit' },

  // Dungeon
  { id: 'dungeon_3',   title: 'Spelunker',        description: 'Clear 3 dungeon floors', target: 3,  reward: { coins: 300, xp: 150 }, track: 'dungeon_floor' },
  { id: 'dungeon_10',  title: 'Delver',           description: 'Clear 10 dungeon floors', target: 10, reward: { coins: 750, xp: 400, pack: true }, track: 'dungeon_floor' },
  { id: 'rift_5',      title: 'Rift Walker',      description: 'Reach Rift floor 5',     target: 5,  reward: { coins: 500, xp: 300 }, track: 'rift_floor' },

  // Social / Economy
  { id: 'trade_1',     title: 'Trader',           description: 'Complete a trade',       target: 1,  reward: { coins: 100, xp: 50 },  track: 'trade' },
  { id: 'auction_1',   title: 'Auctioneer',       description: 'List an item on auction', target: 1, reward: { coins: 100, xp: 50 },  track: 'auction_list' },
  { id: 'explore_10',  title: 'Explorer',         description: 'Visit 10 new chunks',    target: 10, reward: { coins: 150, xp: 100 }, track: 'explore_chunk' },

  // Gacha
  { id: 'open_pack',   title: 'Card Collector',   description: 'Open a card pack',       target: 1,  reward: { coins: 50, xp: 25 },   track: 'pack_open' },
  { id: 'fuse_1',      title: 'Alchemist',        description: 'Fuse cards',             target: 1,  reward: { coins: 100, xp: 50 },  track: 'card_fuse' },
];

// Build a lookup map for fast access
var CHALLENGE_MAP = {};
for (var ci = 0; ci < CHALLENGE_POOL.length; ci++) {
  CHALLENGE_MAP[CHALLENGE_POOL[ci].id] = CHALLENGE_POOL[ci];
}

// ─── Achievement Definitions (MMO-themed, one-time unlocks) ───
// Each achievement has a type + target for progress-based checking.
// type: the tracking key that increments progress
// target: value to reach (number or string for special checks like 'legendary')
var ACHIEVEMENTS = [
  // Progression
  { id: 'first_craft',       title: 'First Creation',   description: 'Craft your first item',              type: 'craft',           target: 1,      reward: { coins: 50, pack: true } },
  { id: 'level_10',          title: 'Adventurer',        description: 'Reach level 10',                     type: 'level',           target: 10,     reward: { coins: 500, pack: true } },
  { id: 'level_25',          title: 'Veteran',           description: 'Reach level 25',                     type: 'level',           target: 25,     reward: { coins: 1000, pack: true } },
  { id: 'level_50',          title: 'Hero',              description: 'Reach level 50',                     type: 'level',           target: 50,     reward: { coins: 2500, pack: true } },
  { id: 'level_99',          title: 'Legend',             description: 'Reach level 99',                     type: 'level',           target: 99,     reward: { coins: 10000, pack: true } },

  // Skills
  { id: 'skill_25',          title: 'Journeyman',        description: 'Reach level 25 in any skill',        type: 'skill_level',     target: 25,     reward: { coins: 500 } },
  { id: 'skill_50',          title: 'Expert',            description: 'Reach level 50 in any skill',        type: 'skill_level',     target: 50,     reward: { coins: 1000, pack: true } },
  { id: 'skill_99',          title: 'Grand Master',      description: 'Reach level 99 in any skill',        type: 'skill_level',     target: 99,     reward: { coins: 5000, pack: true } },
  { id: 'all_skills_10',     title: 'Jack of All Trades', description: 'Get all skills to level 10',        type: 'all_skills_level', target: 10,    reward: { coins: 2000, pack: true } },

  // Dungeon
  { id: 'first_dungeon',     title: 'Into the Dark',     description: 'Enter your first dungeon',           type: 'dungeon_enter',   target: 1,      reward: { coins: 100 } },
  { id: 'rift_10',           title: 'Rift Delver',       description: 'Reach Rift floor 10',                type: 'rift_floor',      target: 10,     reward: { coins: 500, pack: true } },
  { id: 'rift_25',           title: 'Abyssal Explorer',  description: 'Reach Rift floor 25',                type: 'rift_floor',      target: 25,     reward: { coins: 1000, pack: true } },
  { id: 'rift_50',           title: 'Void Walker',       description: 'Reach Rift floor 50',                type: 'rift_floor',      target: 50,     reward: { coins: 2500, pack: true } },
  { id: 'world_dungeon_5',   title: 'Dungeon Crawler',   description: 'Complete 5 different world dungeons', type: 'unique_dungeons', target: 5,     reward: { coins: 1000, pack: true } },

  // Combat
  { id: 'first_kill',        title: 'First Blood',       description: 'Defeat your first monster',          type: 'monster_kill',    target: 1,      reward: { coins: 50 } },
  { id: 'kill_100',          title: 'Centurion',         description: 'Defeat 100 monsters',                type: 'monster_kill',    target: 100,    reward: { coins: 500 } },
  { id: 'kill_1000',         title: 'Warlord',           description: 'Defeat 1000 monsters',               type: 'monster_kill',    target: 1000,   reward: { coins: 2000, pack: true } },
  { id: 'boss_10',           title: 'Boss Hunter',       description: 'Defeat 10 bosses',                   type: 'boss_kill',       target: 10,     reward: { coins: 1000, pack: true } },

  // Economy
  { id: 'earn_1000',         title: 'Prosperous',        description: 'Earn 1000 coins total',              type: 'coins_earned',    target: 1000,   reward: { coins: 100 } },
  { id: 'earn_100000',       title: 'Tycoon',            description: 'Earn 100,000 coins total',           type: 'coins_earned',    target: 100000, reward: { coins: 5000, pack: true } },

  // Cards
  { id: 'collect_50',        title: 'Card Enthusiast',   description: 'Collect 50 unique cards',            type: 'unique_cards',    target: 50,     reward: { coins: 500 } },
  { id: 'collect_200',       title: 'Card Master',       description: 'Collect 200 unique cards',           type: 'unique_cards',    target: 200,    reward: { coins: 2000, pack: true } },
  { id: 'legendary_card',    title: 'Legendary Find',    description: 'Obtain a Legendary card',            type: 'card_rarity',     target: 'legendary', reward: { coins: 1000 } },

  // Social
  { id: 'join_guild',        title: 'Guild Member',      description: 'Join a guild',                       type: 'guild_join',      target: 1,      reward: { coins: 100 } },
  { id: 'first_trade',       title: 'Merchant',          description: 'Complete your first trade',          type: 'trade',           target: 1,      reward: { coins: 50 } },

  // Exploration
  { id: 'visit_all_towns',   title: 'World Traveler',    description: 'Visit all 10 anchor towns',          type: 'towns_visited',   target: 10,     reward: { coins: 1000, pack: true } },
  { id: 'explore_100',       title: 'Cartographer',      description: 'Discover 100 unique chunks',         type: 'explore_chunk',   target: 100,    reward: { coins: 500 } },
];

// Build achievement lookup map
var ACHIEVEMENT_MAP = {};
for (var ai = 0; ai < ACHIEVEMENTS.length; ai++) {
  ACHIEVEMENT_MAP[ACHIEVEMENTS[ai].id] = ACHIEVEMENTS[ai];
}

// ─── Utility: get today's date string in UTC ───
function getUTCDateString() {
  var now = new Date();
  return now.getUTCFullYear() + '-' +
    String(now.getUTCMonth() + 1).padStart(2, '0') + '-' +
    String(now.getUTCDate()).padStart(2, '0');
}

// ─── Utility: seeded random for deterministic daily challenge selection ───
// Uses a simple hash to generate a seed from accountKey + date
function seedFromString(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Deterministic selection of 5 challenges for a given key + date
function selectDailyChallenges(accountKey, dateStr) {
  var seed = seedFromString(accountKey + ':' + dateStr);
  // Fisher-Yates shuffle with seeded RNG
  var indices = [];
  for (var i = 0; i < CHALLENGE_POOL.length; i++) indices.push(i);

  // Simple LCG seeded random
  var s = seed;
  function nextRand() {
    s = (s * 1664525 + 1013904223) & 0x7FFFFFFF;
    return s / 0x7FFFFFFF;
  }

  for (var j = indices.length - 1; j > 0; j--) {
    var k = Math.floor(nextRand() * (j + 1));
    var tmp = indices[j];
    indices[j] = indices[k];
    indices[k] = tmp;
  }

  return [
    CHALLENGE_POOL[indices[0]],
    CHALLENGE_POOL[indices[1]],
    CHALLENGE_POOL[indices[2]],
    CHALLENGE_POOL[indices[3]],
    CHALLENGE_POOL[indices[4]]
  ];
}

// ─── Ensure challenge data exists on account ───
function ensureChallengeData(account, accountKey) {
  var today = getUTCDateString();
  if (!account.dailyChallenges || account.dailyChallenges.date !== today) {
    // Generate new challenges for today
    var selected = selectDailyChallenges(accountKey, today);
    account.dailyChallenges = {
      date: today,
      challenges: selected.map(function(c) {
        return {
          id: c.id,
          progress: 0,
          completed: false,
          claimed: false
        };
      })
    };
  }
  return account.dailyChallenges;
}

// ─── Track challenge progress ───
// Called from other handlers when tracked events happen.
// type: the tracking key (e.g. 'harvest', 'monster_kill', 'craft')
// amount: how much to increment (default 1)
function trackChallengeProgress(accounts, accountKey, type, amount) {
  if (!accountKey || !type) return;
  amount = amount || 1;
  var acc = accounts.loadAccount(accountKey);
  if (!acc) return;
  var data = ensureChallengeData(acc, accountKey);
  var changed = false;

  for (var i = 0; i < data.challenges.length; i++) {
    var ch = data.challenges[i];
    var def = CHALLENGE_MAP[ch.id];
    if (!def) continue;
    if (def.track === type && !ch.completed) {
      ch.progress = Math.min(ch.progress + amount, def.target);
      if (ch.progress >= def.target) {
        ch.completed = true;
      }
      changed = true;
    }
  }

  if (changed) {
    accounts.saveAccount(acc);
  }
  return changed;
}

// ─── Achievement progress tracking ───
// Stores cumulative progress for each achievement type on the account.
// Returns an array of newly unlocked achievement IDs (may be empty).
function trackAchievementProgress(accounts, accountKey, type, amount, socket) {
  if (!accountKey || !type) return [];
  amount = amount || 1;
  var acc = accounts.loadAccount(accountKey);
  if (!acc) return [];

  if (!acc.achievements) acc.achievements = {};
  if (!acc.achievementProgress) acc.achievementProgress = {};

  var newlyUnlocked = [];
  var changed = false;

  for (var i = 0; i < ACHIEVEMENTS.length; i++) {
    var ach = ACHIEVEMENTS[i];
    if (ach.type !== type) continue;
    // Already unlocked
    if (acc.achievements[ach.id]) continue;

    // Special types that use non-numeric targets
    if (ach.type === 'card_rarity') {
      // 'amount' is a rarity string for this type; target is a rarity string
      if (amount === ach.target) {
        acc.achievements[ach.id] = Date.now();
        newlyUnlocked.push(ach.id);
        changed = true;
        // Award achievement reward
        _awardAchievementReward(accounts, acc, accountKey, ach, socket);
      }
      continue;
    }

    // Numeric cumulative progress
    var prevProgress = acc.achievementProgress[ach.id] || 0;
    var newProgress = prevProgress + amount;
    acc.achievementProgress[ach.id] = newProgress;
    changed = true;

    if (typeof ach.target === 'number' && newProgress >= ach.target) {
      acc.achievements[ach.id] = Date.now();
      newlyUnlocked.push(ach.id);
      // Award achievement reward
      _awardAchievementReward(accounts, acc, accountKey, ach, socket);
    }
  }

  if (changed) {
    accounts.saveAccount(acc);
  }

  return newlyUnlocked;
}

// ─── Check achievement by absolute value (for level, skill_level, etc.) ───
// Instead of incrementing, sets progress to the given value if higher.
// Returns array of newly unlocked achievement IDs.
function checkAchievementAbsolute(accounts, accountKey, type, currentValue, socket) {
  if (!accountKey || !type) return [];
  var acc = accounts.loadAccount(accountKey);
  if (!acc) return [];

  if (!acc.achievements) acc.achievements = {};
  if (!acc.achievementProgress) acc.achievementProgress = {};

  var newlyUnlocked = [];
  var changed = false;

  for (var i = 0; i < ACHIEVEMENTS.length; i++) {
    var ach = ACHIEVEMENTS[i];
    if (ach.type !== type) continue;
    if (acc.achievements[ach.id]) continue;

    // For absolute checks, set progress to current value if it's higher
    var prevProgress = acc.achievementProgress[ach.id] || 0;
    if (currentValue > prevProgress) {
      acc.achievementProgress[ach.id] = currentValue;
      changed = true;
    }

    if (typeof ach.target === 'number' && currentValue >= ach.target) {
      acc.achievements[ach.id] = Date.now();
      newlyUnlocked.push(ach.id);
      _awardAchievementReward(accounts, acc, accountKey, ach, socket);
    }
  }

  if (changed) {
    accounts.saveAccount(acc);
  }

  return newlyUnlocked;
}

// ─── Award achievement reward (internal helper) ───
function _awardAchievementReward(accounts, acc, accountKey, achievement, socket) {
  if (!achievement.reward) return;
  var reward = achievement.reward;

  if (reward.coins && typeof reward.coins === 'number') {
    accounts.updateChips(accountKey, reward.coins);
    if (socket) {
      var newAcc = accounts.loadAccount(accountKey);
      if (newAcc) {
        socket.emit('chips_updated', { chips: newAcc.chips, reason: 'Achievement: ' + achievement.title + ' +' + reward.coins });
      }
    }
  }

  if (reward.pack) {
    if (accounts.addPendingPack) {
      accounts.addPendingPack(accountKey, 1);
    } else {
      // Fallback: directly increment
      var packAcc = accounts.loadAccount(accountKey);
      if (packAcc) {
        packAcc.pendingPacks = (packAcc.pendingPacks || 0) + 1;
        accounts.saveAccount(packAcc);
      }
    }
  }
}

// ─── Legacy checkAchievement (simple unlock by ID, no progress) ───
// Kept for backward compatibility with any remaining callers.
function checkAchievement(accounts, accountKey, achievementId) {
  if (!accountKey || !achievementId) return false;
  if (!ACHIEVEMENT_MAP[achievementId]) return false;
  var acc = accounts.loadAccount(accountKey);
  if (!acc) return false;
  if (!acc.achievements) acc.achievements = {};
  if (acc.achievements[achievementId]) return false;
  acc.achievements[achievementId] = Date.now();
  var ach = ACHIEVEMENT_MAP[achievementId];
  _awardAchievementReward(accounts, acc, accountKey, ach, null);
  accounts.saveAccount(acc);
  return true;
}

// ─── Get achievement list with unlock status and progress ───
function getAchievements(accounts, accountKey) {
  var acc = accountKey ? accounts.loadAccount(accountKey) : null;
  var unlocked = (acc && acc.achievements) ? acc.achievements : {};
  var progress = (acc && acc.achievementProgress) ? acc.achievementProgress : {};
  return ACHIEVEMENTS.map(function(a) {
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      target: a.target,
      progress: progress[a.id] || 0,
      reward: a.reward || null,
      unlockedAt: unlocked[a.id] || null
    };
  });
}

// ─── Helper: enrich challenge data with definitions ───
function enrichChallenges(challenges) {
  return challenges.map(function(ch) {
    var def = CHALLENGE_MAP[ch.id];
    if (!def) return null;
    return {
      id: ch.id,
      title: def.title,
      description: def.description,
      target: def.target,
      progress: ch.progress,
      reward: def.reward,
      completed: ch.completed,
      claimed: ch.claimed
    };
  }).filter(function(x) { return x !== null; });
}

// ─── Milliseconds until midnight UTC ───
function msUntilMidnightUTC() {
  var now = new Date();
  var midnight = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0
  ));
  return midnight.getTime() - now.getTime();
}

// ─── Emit achievement_unlocked event to socket ───
function emitAchievementUnlocks(socket, accounts, newlyUnlocked) {
  if (!socket || !newlyUnlocked || newlyUnlocked.length === 0) return;
  for (var i = 0; i < newlyUnlocked.length; i++) {
    var ach = ACHIEVEMENT_MAP[newlyUnlocked[i]];
    if (ach) {
      socket.emit('achievement_unlocked', {
        id: ach.id,
        title: ach.title,
        description: ach.description,
        reward: ach.reward || null
      });
    }
  }
}

// ─── Socket handler registration ───
module.exports = {
  // Exported for use by other handlers
  trackChallengeProgress: trackChallengeProgress,
  trackAchievementProgress: trackAchievementProgress,
  checkAchievementAbsolute: checkAchievementAbsolute,
  checkAchievement: checkAchievement,
  emitAchievementUnlocks: emitAchievementUnlocks,
  getAchievements: getAchievements,
  ACHIEVEMENTS: ACHIEVEMENTS,
  ACHIEVEMENT_MAP: ACHIEVEMENT_MAP,
  CHALLENGE_POOL: CHALLENGE_POOL,

  init(io, socket, deps) {
    var { socketAccountMap, accounts, checkEventRate, loot } = deps;
    var crypto = require('crypto');

    // ------------------------------------------------------------------
    // Get daily challenges
    // ------------------------------------------------------------------
    socket.on('get_daily_challenges', function() {
      try {
        var key = socketAccountMap.get(socket.id);
        if (!key) {
          socket.emit('daily_challenges', { challenges: [], resetIn: msUntilMidnightUTC() });
          return;
        }
        var acc = accounts.loadAccount(key);
        if (!acc) {
          socket.emit('daily_challenges', { challenges: [], resetIn: msUntilMidnightUTC() });
          return;
        }
        var data = ensureChallengeData(acc, key);
        accounts.saveAccount(acc);

        socket.emit('daily_challenges', {
          challenges: enrichChallenges(data.challenges),
          resetIn: msUntilMidnightUTC()
        });
      } catch (err) {
        console.error('[get_daily_challenges] Error:', err.message);
      }
    });

    // ------------------------------------------------------------------
    // Claim challenge reward
    // ------------------------------------------------------------------
    socket.on('claim_challenge_reward', function(data) {
      try {
        if (!data || typeof data.challengeId !== 'string') return;
        var key = socketAccountMap.get(socket.id);
        if (!key) {
          socket.emit('error', { message: 'Need an account to claim rewards' });
          return;
        }
        var acc = accounts.loadAccount(key);
        if (!acc) {
          socket.emit('error', { message: 'Account not found' });
          return;
        }
        var challengeData = ensureChallengeData(acc, key);

        // Find the challenge
        var found = null;
        for (var i = 0; i < challengeData.challenges.length; i++) {
          if (challengeData.challenges[i].id === data.challengeId) {
            found = challengeData.challenges[i];
            break;
          }
        }

        if (!found) {
          socket.emit('error', { message: 'Challenge not found' });
          return;
        }
        if (!found.completed) {
          socket.emit('error', { message: 'Challenge not completed yet' });
          return;
        }
        if (found.claimed) {
          socket.emit('error', { message: 'Reward already claimed' });
          return;
        }

        var def = CHALLENGE_MAP[found.id];
        if (!def) {
          socket.emit('error', { message: 'Invalid challenge' });
          return;
        }

        found.claimed = true;
        accounts.saveAccount(acc);

        // Award coins
        var coinReward = (def.reward && def.reward.coins) ? def.reward.coins : 0;
        if (coinReward > 0) {
          var newChips = accounts.updateChips(key, coinReward);
          if (newChips !== null) {
            socket.emit('chips_updated', { chips: newChips, reason: 'Challenge complete: ' + def.title + ' +' + coinReward });
          }
        }

        // Award XP (add to overall level via a small skill XP distribution)
        var xpReward = (def.reward && def.reward.xp) ? def.reward.xp : 0;
        if (xpReward > 0) {
          // Spread XP across the player's highest skill as bonus skill XP
          // This also contributes 10% to overall level via the spillover system
          accounts.addSkillXp(key, 'crafting', xpReward);
        }

        // Award card pack
        if (def.reward && def.reward.pack) {
          if (accounts.addPendingPack) {
            accounts.addPendingPack(key, 1);
          } else {
            var packAcc = accounts.loadAccount(key);
            if (packAcc) {
              packAcc.pendingPacks = (packAcc.pendingPacks || 0) + 1;
              accounts.saveAccount(packAcc);
            }
          }
          socket.emit('pack_awarded', { reason: 'Challenge complete: ' + def.title });
        }

        // Award a guaranteed randomized key item for opening packs/lootboxes
        if (loot && loot.rollGuaranteedKey) {
          var keyDrop = loot.rollGuaranteedKey();
          if (keyDrop) {
            var keyInstance = {
              instanceId: crypto.randomBytes(6).toString('hex'),
              itemId: keyDrop.id,
              obtainedAt: Date.now(),
              source: 'challenge_reward'
            };
            accounts.addInventoryItem(key, keyInstance);
            socket.emit('key_drop', {
              key: { id: keyDrop.id, name: keyDrop.name, rarity: keyDrop.rarity, img: keyDrop.img },
              instanceId: keyInstance.instanceId
            });
          }
        }

        // Send updated challenges
        socket.emit('daily_challenges', {
          challenges: enrichChallenges(challengeData.challenges),
          resetIn: msUntilMidnightUTC()
        });

        socket.emit('challenge_claimed', { challengeId: found.id, reward: def.reward });
      } catch (err) {
        console.error('[claim_challenge_reward] Error:', err.message);
      }
    });

    // ------------------------------------------------------------------
    // Get achievements
    // ------------------------------------------------------------------
    socket.on('get_achievements', function() {
      try {
        var key = socketAccountMap.get(socket.id);
        var achievements = getAchievements(accounts, key);
        socket.emit('achievements', { achievements: achievements });
      } catch (err) {
        console.error('[get_achievements] Error:', err.message);
      }
    });

    // ------------------------------------------------------------------
    // Check achievements (client can trigger a full scan)
    // ------------------------------------------------------------------
    socket.on('check_achievements', function() {
      try {
        var key = socketAccountMap.get(socket.id);
        if (!key) return;
        var acc = accounts.loadAccount(key);
        if (!acc) return;

        var newlyUnlocked = [];

        // Check level-based achievements
        if (acc.level) {
          var levelUnlocks = checkAchievementAbsolute(accounts, key, 'level', acc.level, socket);
          for (var li = 0; li < levelUnlocks.length; li++) newlyUnlocked.push(levelUnlocks[li]);
        }

        // Check skill-based achievements
        if (acc.skills) {
          var skillNames = Object.keys(acc.skills);
          var minSkillLevel = Infinity;
          for (var si = 0; si < skillNames.length; si++) {
            var skill = acc.skills[skillNames[si]];
            var skillLv = skill.level || 1;
            if (skillLv < minSkillLevel) minSkillLevel = skillLv;
            var skillUnlocks = checkAchievementAbsolute(accounts, key, 'skill_level', skillLv, socket);
            for (var su = 0; su < skillUnlocks.length; su++) newlyUnlocked.push(skillUnlocks[su]);
          }
          // all_skills_level check
          if (minSkillLevel !== Infinity) {
            var allSkillUnlocks = checkAchievementAbsolute(accounts, key, 'all_skills_level', minSkillLevel, socket);
            for (var as = 0; as < allSkillUnlocks.length; as++) newlyUnlocked.push(allSkillUnlocks[as]);
          }
        }

        // Check unique cards count
        if (acc.rpgCards && acc.rpgCards.length > 0) {
          var uniqueCardIds = {};
          for (var ci = 0; ci < acc.rpgCards.length; ci++) {
            if (acc.rpgCards[ci].cardId) uniqueCardIds[acc.rpgCards[ci].cardId] = true;
          }
          var uniqueCount = Object.keys(uniqueCardIds).length;
          var cardUnlocks = checkAchievementAbsolute(accounts, key, 'unique_cards', uniqueCount, socket);
          for (var cu = 0; cu < cardUnlocks.length; cu++) newlyUnlocked.push(cardUnlocks[cu]);
        }

        emitAchievementUnlocks(socket, accounts, newlyUnlocked);

        // Always send full achievement list
        var achievements = getAchievements(accounts, key);
        socket.emit('achievements', { achievements: achievements });
      } catch (err) {
        console.error('[check_achievements] Error:', err.message);
      }
    });
  }
};
