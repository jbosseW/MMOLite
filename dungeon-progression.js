// dungeon-progression.js
// Guild ranks, quest templates, dungeon skill perks, camp config, daily quest
// generation. Extracted from dungeon-data.js.

var worldgen = require('./worldgen');
var seededRandom = worldgen.seededRandom;
var chunkSeed = worldgen.chunkSeed;

// ---------------------------------------------------------------------------
// Guild ranks
// ---------------------------------------------------------------------------

var GUILD_RANKS = [
  { rank: 0,  name: 'Stone',        xpThreshold: 0      },
  { rank: 1,  name: 'Iron',         xpThreshold: 500    },
  { rank: 2,  name: 'Bronze',       xpThreshold: 1500   },
  { rank: 3,  name: 'Silver',       xpThreshold: 4000   },
  { rank: 4,  name: 'Gold',         xpThreshold: 10000  },
  { rank: 5,  name: 'Platinum',     xpThreshold: 25000  },
  { rank: 6,  name: 'Diamond',      xpThreshold: 60000  },
  { rank: 7,  name: 'Mythril',      xpThreshold: 150000 },
  { rank: 8,  name: 'Obsidian',     xpThreshold: 400000 },
  { rank: 9,  name: 'Relic',        xpThreshold: 1000000 },
];

// ---------------------------------------------------------------------------
// Quest templates
// ---------------------------------------------------------------------------

var QUEST_TEMPLATES = [
  {
    id: 'clear_floor',
    name: 'Floor Sweep',
    description: 'Clear all enemies on floor {floor}.',
    type: 'combat',
    xpReward: 50,
    goldReward: 25,
  },
  {
    id: 'boss_kill',
    name: 'Boss Slayer',
    description: 'Defeat the boss on floor {floor}.',
    type: 'combat',
    xpReward: 150,
    goldReward: 75,
  },
  {
    id: 'collect_chests',
    name: 'Treasure Hunter',
    description: 'Open {count} chests in any dungeon.',
    type: 'exploration',
    xpReward: 40,
    goldReward: 30,
  },
  {
    id: 'reach_depth',
    name: 'Deep Delver',
    description: 'Reach floor {floor} in any rift dungeon.',
    type: 'exploration',
    xpReward: 80,
    goldReward: 40,
  },
  {
    id: 'no_damage_floor',
    name: 'Untouchable',
    description: 'Complete a floor without taking any damage.',
    type: 'challenge',
    xpReward: 120,
    goldReward: 60,
  },
  {
    id: 'rescue_npc',
    name: 'Dungeon Rescue',
    description: 'Find and rescue an NPC trapped in a dungeon.',
    type: 'exploration',
    xpReward: 60,
    goldReward: 35,
  },
  {
    id: 'speed_clear',
    name: 'Speed Run',
    description: 'Clear a floor in under {time} seconds.',
    type: 'challenge',
    xpReward: 100,
    goldReward: 50,
  },
];

// ---------------------------------------------------------------------------
// Camp configuration (rift only)
// ---------------------------------------------------------------------------

var CAMP_CONFIG = {
  maxCampsPerFloor: 2,
  campRadius: 3,
  campfireCookRecipes: [
    { id: 'roast_meat',     input: ['fish'],              output: 'cooked_fish',  healAmount: 25 },
    { id: 'herb_potion',    input: ['herbs', 'herbs'],    output: 'potion_health', healAmount: 50 },
    { id: 'mushroom_stew',  input: ['mushroom', 'wheat'], output: 'stew',         healAmount: 40 },
    { id: 'bread_ration',   input: ['wheat', 'wheat'],    output: 'bread',        healAmount: 20 },
  ],
  shrineBuffs: [
    { id: 'shrine_power',   name: 'Power Blessing',   effect: { atkBoost: 5  }, duration: 120 },
    { id: 'shrine_guard',   name: 'Guardian Blessing', effect: { defBoost: 5  }, duration: 120 },
    { id: 'shrine_vitality', name: 'Vitality Blessing', effect: { hpBoost: 30 }, duration: 120 },
    { id: 'shrine_fortune', name: 'Fortune Blessing',  effect: { luckBoost: 10 }, duration: 120 },
  ],
  ambushChance: 0.15,
};

// ---------------------------------------------------------------------------
// Dungeon Skill Perk Tiers
// dungeon_dwelling: camp/survival/traps  |  dungeon_delving: loot/combat/shortcuts
// Each threshold unlocks a gameplay bonus. getDungeonSkillBonuses() computes
// the aggregate modifiers for a player account.
// ---------------------------------------------------------------------------

var DUNGEON_SKILL_PERKS = {
  dungeon_dwelling: [
    { level: 5,  id: 'trap_sense',       description: 'Detect traps before stepping on them. -25% trap damage.' },
    { level: 10, id: 'camp_mastery',      description: 'Camp rest heals 50% more. Cooking heals +25%. Ambush chance -40%.' },
    { level: 15, id: 'npc_rapport',       description: '+50% gold and XP from dungeon NPCs.' },
    { level: 20, id: 'keen_awareness',    description: 'Fog-of-war reveal radius +1 tile.' },
    { level: 30, id: 'survivor_instinct', description: '-15% all dungeon damage taken. +2 HP regen in dungeons.' },
    { level: 40, id: 'trap_immunity',     description: 'Traps deal 0 damage (still trigger for allies).' },
    { level: 50, id: 'master_camper',     description: 'Camp fully heals to max HP. Shrine always available at camps.' },
  ],
  dungeon_delving: [
    { level: 5,  id: 'loot_sense',       description: 'Chest loot tier +1 step (common->uncommon, etc). +15% gold from chests.' },
    { level: 10, id: 'shortcut_finder',   description: '10% chance per floor to discover a shortcut skipping 1-2 floors.' },
    { level: 15, id: 'combat_veteran',    description: '+10% damage dealt in dungeons.' },
    { level: 20, id: 'xp_hunter',         description: '+20% dungeon skill XP. +15% gold from kills.' },
    { level: 30, id: 'boss_expertise',    description: '+15% damage to bosses. Boss kills drop +1 resource.' },
    { level: 40, id: 'treasure_magnet',   description: 'Chest card pack chance doubled. +25% gold from all sources.' },
    { level: 50, id: 'master_delver',     description: '+25% all dungeon damage. +30% XP. +50% gold.' },
  ],
};

/**
 * getDungeonSkillBonuses(account) — compute aggregate dungeon skill bonuses.
 * Returns an object with all modifier fields pre-computed so handlers can apply
 * them efficiently without re-checking perk levels on every action.
 *
 * @param {Object} account — player account with account.skills
 * @returns {Object} bonuses
 */
function getDungeonSkillBonuses(account) {
  var bonuses = {
    // dungeon_dwelling
    trapDetect: false,        // can see traps (Lv5)
    trapDamageReduction: 0,   // fractional reduction (0.25 at Lv5, 1.0 at Lv40)
    campHealMult: 1.0,        // multiplier on rest/cook heal amounts
    ambushChanceReduction: 0, // fractional reduction on ambush chance
    npcRewardMult: 1.0,       // multiplier on NPC gold/xp rewards
    fogRevealBonus: 0,        // extra tiles of fog reveal radius
    dungeonDamageTakenMult: 1.0, // multiplier on incoming damage
    dungeonHpRegen: 0,        // flat HP regen bonus per rest tick
    campFullHeal: false,      // camp rest heals to max HP
    campFreeShrine: false,    // camps always have shrine available

    // dungeon_delving
    chestTierBonus: 0,        // +N steps to chest loot tier
    chestGoldMult: 1.0,       // multiplier on chest gold
    shortcutChance: 0,        // chance per floor to find shortcut
    dungeonDamageMult: 1.0,   // multiplier on outgoing damage
    dungeonXpMult: 1.0,       // multiplier on skill XP gains
    killGoldMult: 1.0,        // multiplier on gold from kills
    bossDamageMult: 1.0,      // multiplier on boss damage
    bossExtraResource: 0,     // extra resource drops from bosses
    chestCardChanceMult: 1.0, // multiplier on chest card pack chance
    allGoldMult: 1.0,         // final multiplier on all gold sources

    // raw skill levels (for client-side display / threshold checks)
    dwellingLevel: 0,
    delvingLevel: 0,
  };

  if (!account || !account.skills) return bonuses;

  var dwellSkill = account.skills.dungeon_dwelling;
  var delveSkill = account.skills.dungeon_delving;
  var dwLv = (dwellSkill && dwellSkill.level) ? dwellSkill.level : 0;
  var dlLv = (delveSkill && delveSkill.level) ? delveSkill.level : 0;

  bonuses.dwellingLevel = dwLv;
  bonuses.delvingLevel = dlLv;

  // --- dungeon_dwelling perks ---
  if (dwLv >= 5) {
    bonuses.trapDetect = true;
    bonuses.trapDamageReduction = 0.25;
  }
  if (dwLv >= 10) {
    bonuses.campHealMult = 1.5;
    bonuses.ambushChanceReduction = 0.40;
  }
  if (dwLv >= 15) {
    bonuses.npcRewardMult = 1.5;
  }
  if (dwLv >= 20) {
    bonuses.fogRevealBonus = 1;
  }
  if (dwLv >= 30) {
    bonuses.dungeonDamageTakenMult = 0.85;
    bonuses.dungeonHpRegen = 2;
  }
  if (dwLv >= 40) {
    bonuses.trapDamageReduction = 1.0; // full immunity
  }
  if (dwLv >= 50) {
    bonuses.campFullHeal = true;
    bonuses.campFreeShrine = true;
  }

  // --- dungeon_delving perks ---
  if (dlLv >= 5) {
    bonuses.chestTierBonus = 1;
    bonuses.chestGoldMult = 1.15;
  }
  if (dlLv >= 10) {
    bonuses.shortcutChance = 0.10;
  }
  if (dlLv >= 15) {
    bonuses.dungeonDamageMult = 1.10;
  }
  if (dlLv >= 20) {
    bonuses.dungeonXpMult = 1.20;
    bonuses.killGoldMult = 1.15;
  }
  if (dlLv >= 30) {
    bonuses.bossDamageMult = 1.15;
    bonuses.bossExtraResource = 1;
  }
  if (dlLv >= 40) {
    bonuses.chestCardChanceMult = 2.0;
    bonuses.allGoldMult = 1.25;
  }
  if (dlLv >= 50) {
    bonuses.dungeonDamageMult = 1.25;   // overrides Lv15 value
    bonuses.dungeonXpMult = 1.30;       // overrides Lv20 value
    bonuses.allGoldMult = 1.50;         // overrides Lv40 value
  }

  return bonuses;
}

// ---------------------------------------------------------------------------
// generateDailyQuests — seeded daily quest selection
// ---------------------------------------------------------------------------

function generateDailyQuests(seed) {
  var rng = seededRandom(chunkSeed(0, 0, 'dailyquest:' + seed));
  var count = 3 + Math.floor(rng() * 3); // 3-5 quests
  var quests = [];
  var used = {};

  for (var i = 0; i < count; i++) {
    var attempts = 0;
    var idx;
    do {
      idx = Math.floor(rng() * QUEST_TEMPLATES.length);
      attempts++;
    } while (used[idx] && attempts < 20);
    used[idx] = true;

    var tmpl = QUEST_TEMPLATES[idx];
    var quest = {
      id:          tmpl.id + '_' + i,
      templateId:  tmpl.id,
      name:        tmpl.name,
      description: tmpl.description,
      type:        tmpl.type,
      xpReward:    tmpl.xpReward,
      goldReward:  tmpl.goldReward,
      progress:    0,
      completed:   false,
    };

    // Fill in template placeholders with seeded values
    if (tmpl.description.indexOf('{floor}') !== -1) {
      var floor;
      if (tmpl.id === 'boss_kill') {
        // Boss floors are every 10th floor; pick a reachable boss floor (10 or 20)
        floor = (1 + Math.floor(rng() * 2)) * 10;
      } else {
        floor = 1 + Math.floor(rng() * 20);
      }
      quest.description = quest.description.replace('{floor}', String(floor));
      quest.targetFloor = floor;
    }
    if (tmpl.description.indexOf('{count}') !== -1) {
      var cnt = 3 + Math.floor(rng() * 8);
      quest.description = quest.description.replace('{count}', String(cnt));
      quest.targetCount = cnt;
    }
    if (tmpl.description.indexOf('{time}') !== -1) {
      var time = 60 + Math.floor(rng() * 120);
      quest.description = quest.description.replace('{time}', String(time));
      quest.targetTime = time;
    }

    quests.push(quest);
  }

  return quests;
}

module.exports = {
  GUILD_RANKS,
  QUEST_TEMPLATES,
  CAMP_CONFIG,
  DUNGEON_SKILL_PERKS,
  getDungeonSkillBonuses,
  generateDailyQuests,
};
