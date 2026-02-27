// dungeon-data.js
// Dungeon generation data and algorithms for rift dungeons and biome caves.
// BSP room placement, enemy pools, loot tables, quest templates, guild ranks.
// Deterministic generation using seeded RNG from worldgen.js.

var worldgen = require('./worldgen');
var seededRandom = worldgen.seededRandom;
var chunkSeed = worldgen.chunkSeed;

var dungeonAnimal = require('./dungeon-animal');
var dungeonProgression = require('./dungeon-progression');
var dungeonThemes = require('./dungeon-themes');

// Destructure animal morphing exports
var FORM_INTERACTABLES = dungeonAnimal.FORM_INTERACTABLES;
var FORM_INTERACTABLE_KEYS = dungeonAnimal.FORM_INTERACTABLE_KEYS;
var THEME_FORM_INTERACTABLE_WEIGHTS = dungeonAnimal.THEME_FORM_INTERACTABLE_WEIGHTS;
var selectFormInteractable = dungeonAnimal.selectFormInteractable;
var generateFormInteractables = dungeonAnimal.generateFormInteractables;
var DUNGEON_ANIMALS = dungeonAnimal.DUNGEON_ANIMALS;
var ANIMAL_SPEAK_CATEGORIES = dungeonAnimal.ANIMAL_SPEAK_CATEGORIES;
var ANIMAL_DIALOGUES = dungeonAnimal.ANIMAL_DIALOGUES;
var ANIMAL_DIALOGUE_DEFAULT = dungeonAnimal.ANIMAL_DIALOGUE_DEFAULT;
var getAnimalDialogue = dungeonAnimal.getAnimalDialogue;
var generateAnimalNpcs = dungeonAnimal.generateAnimalNpcs;

// Destructure progression exports
var GUILD_RANKS = dungeonProgression.GUILD_RANKS;
var QUEST_TEMPLATES = dungeonProgression.QUEST_TEMPLATES;
var CAMP_CONFIG = dungeonProgression.CAMP_CONFIG;
var DUNGEON_SKILL_PERKS = dungeonProgression.DUNGEON_SKILL_PERKS;
var getDungeonSkillBonuses = dungeonProgression.getDungeonSkillBonuses;
var generateDailyQuests = dungeonProgression.generateDailyQuests;

// Destructure theme exports
var CASTLE_THEMES = dungeonThemes.CASTLE_THEMES;
var WILD_THEMES = dungeonThemes.WILD_THEMES;
var BIOME_DUNGEON_THEMES = dungeonThemes.BIOME_DUNGEON_THEMES;
var THEME_COLORS = dungeonThemes.THEME_COLORS;
var THEME_ELEMENT_MAP = dungeonThemes.THEME_ELEMENT_MAP;
var THEME_COMBAT_PROPERTIES = dungeonThemes.THEME_COMBAT_PROPERTIES;
var THEME_LAYOUT_MAP = dungeonThemes.THEME_LAYOUT_MAP;
var selectLayout = dungeonThemes.selectLayout;
var THEME_POOL_FALLBACK = dungeonThemes.THEME_POOL_FALLBACK;
var getEnemyPool = dungeonThemes.getEnemyPool;
var THEME_BONUS_LOOT = dungeonThemes.THEME_BONUS_LOOT;

// ---------------------------------------------------------------------------
// Seed prefixes & cache limits
// ---------------------------------------------------------------------------

var RIFT_SEED_PREFIX = 'rift:';
var CAVE_SEED_PREFIX = 'cave:';
var WORLD_DUNGEON_SEED_PREFIX = 'world:';
var STRUCTURE_SEED_PREFIX = 'struct:';
var MINI_RIFT_SEED_PREFIX = 'minirift:';
var MAX_FLOOR_CACHE = 64;
var TILE_SIZE = 32;

// ---------------------------------------------------------------------------
// Floor size tables
// ---------------------------------------------------------------------------

var RIFT_FLOOR_SIZE = {
  small:  { width: 40, height: 30, minRooms: 4,  maxRooms: 6  },
  medium: { width: 56, height: 42, minRooms: 6,  maxRooms: 10 },
  large:  { width: 72, height: 54, minRooms: 10, maxRooms: 14 },
  huge:   { width: 96, height: 72, minRooms: 14, maxRooms: 20 },
};

var CAVE_FLOOR_SIZE = {
  small:  { width: 36, height: 28, minRooms: 3,  maxRooms: 5  },
  medium: { width: 48, height: 36, minRooms: 5,  maxRooms: 8  },
  large:  { width: 64, height: 48, minRooms: 8,  maxRooms: 12 },
};

// Raid floor size — large arena for 8-16 player encounters
var RAID_FLOOR_SIZE = { width: 120, height: 90, minRooms: 4, maxRooms: 6 };

// ---------------------------------------------------------------------------
// Cave floors by biome (min/max floor count for biome caves)
// ---------------------------------------------------------------------------

var CAVE_FLOORS_BY_BIOME = {
  0:  { min: 2, max: 4  },   // WATER - underwater grottoes
  1:  { min: 3, max: 6  },   // DESERT - sand tombs
  2:  { min: 5, max: 10 },   // MOUNTAIN - deep mines
  3:  { min: 3, max: 5  },   // SCORCHED_SANDS - lava tubes
  4:  { min: 2, max: 5  },   // STEPPES - burial mounds
  5:  { min: 3, max: 7  },   // FOREST - root caverns
  6:  { min: 2, max: 4  },   // PLAINS - shallow caves
  7:  { min: 4, max: 8  },   // SWAMP - flooded ruins
  8:  { min: 3, max: 6  },   // HOLY_DOMINION - catacombs
  9:  { min: 2, max: 5  },   // GNOMISH_ISLES - tinker tunnels
  10: { min: 3, max: 6  },   // MECHSPIRE - clockwork depths
  11: { min: 2, max: 4  },   // CLOCKWORK_HARBOR - harbor vaults
};

// ---------------------------------------------------------------------------
// Tile types
// ---------------------------------------------------------------------------

var TILE = {
  WALL:        0,
  FLOOR:       1,
  CORRIDOR:    2,
  DOOR:        3,
  STAIRS_UP:   4,
  STAIRS_DOWN: 5,
  ENTRANCE:    6,
  EXIT:        7,
  CHEST:       8,
  TRAP:        9,
  CAMP_SPOT:   10,
  SHRINE:      11,
  BOSS_DOOR:   12,
  SHORTCUT:    13,
  CORPSE:      14,
};

// Bind TILE constant into dungeon-animal so its generators can check floor tiles
dungeonAnimal.init(TILE);

// ---------------------------------------------------------------------------
// Enemy archetype defaults — abilities, detection radii per archetype
// ---------------------------------------------------------------------------

var ENEMY_DEFAULTS = {
  bruiser:    { detectionRadius: 4, abilities: [{ id: 'heavy_strike', name: 'Heavy Strike', damage: 1.5, range: 1, windUp: 2, cooldown: 4, weight: 10 }] },
  skirmisher: { detectionRadius: 5, abilities: [{ id: 'quick_slash', name: 'Quick Slash', damage: 1.0, range: 1, windUp: 1, cooldown: 2, weight: 10 }] },
  ranged:     { detectionRadius: 6, abilities: [{ id: 'ranged_shot', name: 'Ranged Shot', damage: 1.2, range: 4, windUp: 2, cooldown: 3, weight: 10 }] },
  controller: { detectionRadius: 5, abilities: [{ id: 'debuff_strike', name: 'Cursed Touch', damage: 0.8, range: 2, windUp: 2, cooldown: 5, weight: 10, effect: 'slow', effectChance: 0.4 }] },
  support:    { detectionRadius: 5, abilities: [{ id: 'ally_heal', name: 'Mend', heals: true, healAmount: 15, range: 3, windUp: 2, cooldown: 6, weight: 15 }, { id: 'support_strike', name: 'Strike', damage: 0.7, range: 1, windUp: 1, cooldown: 3, weight: 5 }] },
  elite:      { detectionRadius: 6, abilities: [{ id: 'heavy_strike', name: 'Heavy Strike', damage: 1.5, range: 1, windUp: 2, cooldown: 4, weight: 10 }, { id: 'power_slam', name: 'Power Slam', damage: 2.0, range: 1, windUp: 3, cooldown: 6, weight: 8, effect: 'stun', effectChance: 0.3 }] },
};

// ---------------------------------------------------------------------------
// Boss Mechanical Identity — each boss gets ONE defining mechanic
// These create unique encounters that demand specific counterplay.
// Lore: The Rift warps creatures in distinct ways based on their nature.
// ---------------------------------------------------------------------------

var BOSS_MECHANICS = {
  // Boss resurrects once with different abilities (like a Hollowed refusing final death)
  resurrect: {
    id: 'resurrect',
    name: 'Undying Will',
    description: 'Resurrects once at 50% HP with new abilities',
    onDeath: function(boss) {
      if (!boss._hasResurrected) {
        boss._hasResurrected = true;
        boss.hp = Math.floor(boss.maxHp * 0.5);
        boss.name = boss.name + ' (Reborn)';
        // Swap to phase 2 abilities if available
        if (boss.phases && boss.phases.length > 0) {
          var lastPhase = boss.phases[boss.phases.length - 1];
          if (lastPhase.abilities) boss.abilities = lastPhase.abilities;
        }
        boss.atk = Math.floor(boss.atk * 1.3);
        boss.changed = true;
        return { resurrected: true, message: boss.name + ' refuses to die!' };
      }
      return null;
    },
  },

  // Persistent AoE zone lingers 8 ticks after boss dies
  death_aoe: {
    id: 'death_aoe',
    name: 'Lingering Doom',
    description: 'Leaves a damaging zone for 8 turns after death',
    onDeath: function(boss) {
      return {
        deathZone: true,
        zoneX: boss.x,
        zoneY: boss.y,
        zoneRadius: 3,
        zoneDamage: Math.floor(boss.atk * 0.4),
        zoneDuration: 8,
        message: 'The ground seethes with ' + (boss.element || 'dark') + ' energy!',
      };
    },
  },

  // Boss is immune to damage until shield minions are killed
  shield_phase: {
    id: 'shield_phase',
    name: 'Warded Shell',
    description: 'Immune to damage until shield-bearers are slain',
    onSpawn: function(boss, floor) {
      boss._shieldActive = true;
      boss._shieldCount = 2;
      return {
        spawnMinions: true,
        minionCount: 2,
        minionTemplate: {
          id: boss.id + '_ward',
          name: 'Ward of ' + boss.name.split(' ')[0],
          hp: Math.floor(boss.maxHp * 0.15),
          atk: Math.floor(boss.atk * 0.3),
          def: Math.floor(boss.def * 0.5),
          xp: Math.floor(boss.xp * 0.1),
          gold: Math.floor(boss.gold * 0.05),
          isShieldBearer: true,
          linkedBossId: boss.id,
        },
      };
    },
    onMinionDeath: function(boss) {
      boss._shieldCount = Math.max(0, (boss._shieldCount || 0) - 1);
      if (boss._shieldCount <= 0) {
        boss._shieldActive = false;
        boss.changed = true;
        return { shieldBroken: true, message: boss.name + "'s ward shatters!" };
      }
      return null;
    },
    modifyDamage: function(boss, damage) {
      if (boss._shieldActive) return 0;
      return damage;
    },
  },

  // Boss spawns portals that produce minions until sealed (destroyed)
  summon_portals: {
    id: 'summon_portals',
    name: 'Rift Caller',
    description: 'Summons portals that spawn minions every 4 turns',
    onPhaseChange: function(boss) {
      return {
        spawnPortals: true,
        portalCount: 2,
        portalHp: Math.floor(boss.maxHp * 0.1),
        portalSpawnRate: 4,
        portalMinionTemplate: {
          id: boss.id + '_spawn',
          name: 'Rift Spawn',
          hp: Math.floor(boss.maxHp * 0.05),
          atk: Math.floor(boss.atk * 0.25),
          def: Math.floor(boss.def * 0.3),
          xp: 5,
          gold: 2,
        },
      };
    },
  },

  // Boss splits into 2 weaker copies at 50% HP
  split: {
    id: 'split',
    name: 'Mitosis',
    description: 'Splits into two weaker copies at 50% HP',
    onPhaseChange: function(boss) {
      if (!boss._hasSplit && boss.hp <= boss.maxHp * 0.5) {
        boss._hasSplit = true;
        var splitHp = Math.floor(boss.hp * 0.6);
        return {
          splitBoss: true,
          copyTemplate: {
            id: boss.id + '_copy',
            name: boss.name + ' (Fragment)',
            hp: splitHp,
            maxHp: splitHp,
            atk: Math.floor(boss.atk * 0.7),
            def: Math.floor(boss.def * 0.7),
            xp: Math.floor(boss.xp * 0.3),
            gold: Math.floor(boss.gold * 0.3),
            isBoss: false,
          },
          message: boss.name + ' fractures into two!',
        };
      }
      return null;
    },
  },

  // Boss regenerates HP rapidly unless burst down
  regenerator: {
    id: 'regenerator',
    name: 'Relentless Vitality',
    description: 'Regenerates 3% max HP per turn; must be burst down',
    onTick: function(boss) {
      var regenAmount = Math.floor(boss.maxHp * 0.03);
      boss.hp = Math.min(boss.maxHp, boss.hp + regenAmount);
      boss.changed = true;
      return { healed: regenAmount };
    },
  },

  // Boss reflects a percentage of damage taken back to attacker
  reflect: {
    id: 'reflect',
    name: 'Thorned Hide',
    description: 'Reflects 25% of damage taken back to attacker',
    modifyDamage: function(boss, damage) {
      return damage; // full damage goes through
    },
    onDamaged: function(boss, damage, attacker) {
      var reflected = Math.floor(damage * 0.25);
      return { reflectDamage: reflected, message: boss.name + ' thorns lash back!' };
    },
  },

  // Boss gains ATK as HP drops (inverse scaling - more dangerous when wounded)
  fury: {
    id: 'fury',
    name: 'Berserker Fury',
    description: 'Attack power increases as HP drops',
    modifyAtk: function(boss) {
      var hpPct = boss.hp / boss.maxHp;
      // At full HP: 1.0x, at 10% HP: up to 2.0x
      var mult = 1.0 + (1.0 - hpPct);
      return Math.floor(boss.atk * mult);
    },
  },
};

// ---------------------------------------------------------------------------
// Class Templates — layered onto base enemies to create elites/rares
// Each template adds abilities and stat multipliers.
// Lore: The Rift imbues certain creatures with foreign powers.
// ---------------------------------------------------------------------------

var CLASS_TEMPLATES = {
  pyromancer: {
    id: 'pyromancer',
    name: 'Pyromancer',
    suffix: 'the Scorching',
    statMult: { hp: 1.1, atk: 1.3, def: 0.9 },
    abilities: [
      { id: 'fireball', name: 'Fireball', damage: 1.6, range: 3, windUp: 2, cooldown: 5, weight: 12, effect: 'burn', effectChance: 0.5 },
    ],
    element: 'fire',
  },
  frostweaver: {
    id: 'frostweaver',
    name: 'Frostweaver',
    suffix: 'the Frozen',
    statMult: { hp: 1.1, atk: 1.2, def: 1.1 },
    abilities: [
      { id: 'frost_bolt', name: 'Frost Bolt', damage: 1.3, range: 3, windUp: 2, cooldown: 4, weight: 11, effect: 'slow', effectChance: 0.4 },
    ],
    element: 'ice',
  },
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    suffix: 'the Frenzied',
    statMult: { hp: 1.3, atk: 1.4, def: 0.7 },
    abilities: [
      { id: 'frenzy_strike', name: 'Frenzy Strike', damage: 2.0, range: 1, windUp: 1, cooldown: 4, weight: 14 },
    ],
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow',
    suffix: 'the Veiled',
    statMult: { hp: 0.9, atk: 1.3, def: 0.8 },
    abilities: [
      { id: 'shadow_strike', name: 'Shadow Strike', damage: 1.8, range: 1, windUp: 1, cooldown: 5, weight: 12, effect: 'bleed', effectChance: 0.4 },
    ],
    element: 'dark',
  },
  healer: {
    id: 'healer',
    name: 'Healer',
    suffix: 'the Mending',
    statMult: { hp: 1.2, atk: 0.8, def: 1.2 },
    abilities: [
      { id: 'heal_pulse', name: 'Heal Pulse', heals: true, healAmount: 20, range: 3, windUp: 2, cooldown: 6, weight: 15 },
    ],
  },
  venomancer: {
    id: 'venomancer',
    name: 'Venomancer',
    suffix: 'the Toxic',
    statMult: { hp: 1.0, atk: 1.2, def: 1.0 },
    abilities: [
      { id: 'venom_spit', name: 'Venom Spit', damage: 1.1, range: 2, windUp: 2, cooldown: 4, weight: 11, effect: 'poison', effectChance: 0.6 },
    ],
    element: 'poison',
  },
  stormcaller: {
    id: 'stormcaller',
    name: 'Stormcaller',
    suffix: 'the Charged',
    statMult: { hp: 1.0, atk: 1.3, def: 0.9 },
    abilities: [
      { id: 'chain_lightning', name: 'Chain Lightning', damage: 1.4, range: 3, windUp: 2, cooldown: 5, weight: 12, effect: 'stun', effectChance: 0.2 },
    ],
    element: 'lightning',
  },
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    suffix: 'the Bulwark',
    statMult: { hp: 1.5, atk: 0.8, def: 1.6 },
    abilities: [
      { id: 'shield_bash', name: 'Shield Bash', damage: 1.0, range: 1, windUp: 2, cooldown: 4, weight: 10, effect: 'stun', effectChance: 0.3 },
    ],
  },
};

var CLASS_TEMPLATE_KEYS = Object.keys(CLASS_TEMPLATES);

// ---------------------------------------------------------------------------
// Boss-to-Mechanic mapping — assigns a unique mechanic to each boss.
// Lore-driven: each mechanic reflects the boss's nature and environment.
// ---------------------------------------------------------------------------

var BOSS_MECHANIC_MAP = {
  // Castle themes
  sk_lord:          'shield_phase',     // Iron Castellan — defended by castle guards
  // Crystal cavern
  cc_queen:         'reflect',          // Prismatic Queen — crystal reflection
  // Fungal forest
  ff_matriarch:     'split',            // Spore Matriarch — fungal mitosis
  // Lava rift
  lr_titan:         'death_aoe',        // Molten Titan — magma pool on death
  // Frozen depths
  fd_queen:         'fury',             // Frost Empress — cold fury intensifies
  // Flooded ruins
  fr_king:          'regenerator',      // Drowned King — water heals endlessly
  // Bone yard
  by_lord:          'resurrect',        // Bone Sovereign — undead refuses death
  // Shadow realm
  sr_lich:          'summon_portals',    // Shadow Lich — tears shadow portals
  // Overgrown temple
  ot_avatar:        'regenerator',      // Avatar of the Wild — nature restores
  // Sand tomb
  st_king:          'resurrect',        // Eternal Pharaoh — cursed immortality
  // Iron forge
  if_overlord:      'fury',             // Grand Smelter — overheating rage
  // Haunted manor
  hm_patriarch:     'summon_portals',   // Lord Varek — summons ghostly servants
  // Tidal vault
  tv_kraken:        'death_aoe',        // Tidebound Kraken — tidal surge on death
  // Plague warren
  pw_father:        'death_aoe',        // Father Pestilence — plague cloud lingers
  // Elven reliquary
  er_keeper:        'shield_phase',     // Eternal Keeper — ancient arcane wards
  // Gnomish workshop
  gw_director:      'split',            // Director Zero — creates copies
  // Orc barrow
  ob_warlord:       'fury',             // Warlord Grukk — orcish berserker rage
  // Mirage palace
  mp_caliph:        'reflect',          // Eternal Caliph — mirror illusions
  // Frost citadel
  fc_sovereign:     'death_aoe',        // Winter Sovereign — eternal blizzard
  // Goblin warrens
  gv_overlord:      'summon_portals',   // Skrix — calls goblin reinforcements
  // Ashen observatory
  ao_watcher:       'death_aoe',        // Ashen Watcher — volcanic eruption
  // Sunken cathedral
  sc_archbishop:    'resurrect',        // Forsaken Archbishop — unholy revival
  // Puzzle labyrinth
  pl_architect:     'split',            // Architect of Madness — fragments of madness
  // Celestial spire
  cs_solanthis:     'shield_phase',     // Archangel Solanthis — divine wards
  // Infernal pit
  ip_malachar:      'fury',             // Pit Lord Malachar — demonic rage
  // Dragon's den
  dd_vyraxion:      'death_aoe',        // Vyraxion — dragonfire lingers
  // Vampire castle
  vc_count:         'regenerator',      // Count Sanguine — blood regeneration
  // Lich sanctum
  ls_archlich:      'resurrect',        // Archlich Veranthos — phylactery revival
  // Cogwork foundry
  cw_engine:        'reflect',          // Overclocked Engine — metallic deflection
  // Astral rift
  at_consciousness: 'split',            // Rift Consciousness — fractures reality
  // Dinosaur jungle
  dj_rex:           'fury',             // Primeval Rex — primal rage
  // Spider hive
  sh_broodmother:   'summon_portals',   // Broodmother — spawns egg sacs
  // Sunken depths
  sd_leviathan:     'regenerator',      // Abyssal Leviathan — deep-water healing
  // Abyssal dark
  ad_thing:         'reflect',          // The Thing That Sees — psychic reflection
  // Werewolf den
  wd_fenris:        'fury',             // Alpha Fenris — lunar frenzy
  // Troll caves
  tc_grothak:       'regenerator',      // Grothak — troll regeneration (thematic!)
  // Ruined village
  rv_mayor:         'summon_portals',   // Hollowed Mayor — raises villagers
};

// ---------------------------------------------------------------------------
// Enemy Ranks — normal enemies can be promoted to elite/rare/champion
// Lore: Deeper in the Rift, its corruption concentrates in certain creatures.
// ---------------------------------------------------------------------------

var ENEMY_RANKS = {
  normal:   { id: 'normal',   namePfx: '',          statMult: { hp: 1.0,  atk: 1.0,  def: 1.0  }, xpMult: 1.0,  goldMult: 1.0,  templateCount: 0, color: null },
  elite:    { id: 'elite',    namePfx: 'Elite ',    statMult: { hp: 1.5,  atk: 1.3,  def: 1.2  }, xpMult: 1.8,  goldMult: 1.5,  templateCount: 1, color: { r: 255, g: 220, b: 50 } },   // yellow
  rare:     { id: 'rare',     namePfx: 'Rare ',     statMult: { hp: 2.0,  atk: 1.5,  def: 1.4  }, xpMult: 2.5,  goldMult: 2.0,  templateCount: 1, color: { r: 255, g: 140, b: 40 } },   // orange
  champion: { id: 'champion', namePfx: 'Champion ', statMult: { hp: 3.0,  atk: 1.8,  def: 1.6  }, xpMult: 4.0,  goldMult: 3.0,  templateCount: 2, color: { r: 220, g: 50, b: 50 } },    // red
};

// ---------------------------------------------------------------------------
// Difficulty Tiers — player-selectable difficulty for dungeon runs
// Each tier scales enemy stats, spawn rates, and rewards.
// ---------------------------------------------------------------------------

var DIFFICULTY_TIERS = {
  standard: { id: 'standard', name: 'Standard',   hpMult: 1.0,  atkMult: 1.0,  defMult: 1.0,  eliteChance: 0.05,  rareChance: 0.02,  championChance: 0.005, xpMult: 1.0,  goldMult: 1.0,  lootBonus: 0.0  },
  veteran:  { id: 'veteran',  name: 'Veteran',     hpMult: 1.3,  atkMult: 1.2,  defMult: 1.15, eliteChance: 0.10,  rareChance: 0.04,  championChance: 0.01,  xpMult: 1.3,  goldMult: 1.25, lootBonus: 0.10 },
  elite:    { id: 'elite',    name: 'Elite',        hpMult: 1.7,  atkMult: 1.4,  defMult: 1.3,  eliteChance: 0.15,  rareChance: 0.08,  championChance: 0.02,  xpMult: 1.6,  goldMult: 1.5,  lootBonus: 0.20 },
  mythic:   { id: 'mythic',   name: 'Mythic',       hpMult: 2.2,  atkMult: 1.7,  defMult: 1.5,  eliteChance: 0.25,  rareChance: 0.12,  championChance: 0.05,  xpMult: 2.0,  goldMult: 2.0,  lootBonus: 0.35 },
};

// ---------------------------------------------------------------------------
// promoteEnemy — applies rank and class templates to a base enemy
// Returns the promoted enemy with new name, stats, and abilities.
// ---------------------------------------------------------------------------

function promoteEnemy(enemy, rank, templates, rng) {
  var rankDef = ENEMY_RANKS[rank] || ENEMY_RANKS.normal;
  if (rank === 'normal') return enemy;

  // Apply rank stat multipliers
  enemy.hp = Math.floor(enemy.hp * rankDef.statMult.hp);
  enemy.maxHp = enemy.hp;
  enemy.atk = Math.floor(enemy.atk * rankDef.statMult.atk);
  enemy.def = Math.floor(enemy.def * rankDef.statMult.def);
  enemy.xp = Math.floor(enemy.xp * rankDef.xpMult);
  enemy.gold = Math.floor(enemy.gold * rankDef.goldMult);
  enemy.rank = rank;
  enemy.rankColor = rankDef.color;

  // Apply class templates
  var appliedTemplates = [];
  var templatePool = templates || CLASS_TEMPLATE_KEYS;
  for (var t = 0; t < rankDef.templateCount && templatePool.length > 0; t++) {
    var idx = Math.floor((rng || Math.random)() * templatePool.length);
    var templateKey = templatePool[idx];
    var tmpl = CLASS_TEMPLATES[templateKey];
    if (!tmpl) continue;

    // Apply stat multipliers from template
    enemy.hp = Math.floor(enemy.hp * tmpl.statMult.hp);
    enemy.maxHp = enemy.hp;
    enemy.atk = Math.floor(enemy.atk * tmpl.statMult.atk);
    enemy.def = Math.floor(enemy.def * tmpl.statMult.def);

    // Add template abilities
    if (!enemy.abilities) enemy.abilities = [];
    for (var a = 0; a < tmpl.abilities.length; a++) {
      enemy.abilities.push(tmpl.abilities[a]);
    }

    // Override element if template specifies one
    if (tmpl.element) enemy.element = tmpl.element;

    appliedTemplates.push(tmpl);
  }

  // Build name: "Elite Goblin Grunt the Scorching"
  var suffix = '';
  if (appliedTemplates.length > 0) {
    suffix = ' ' + appliedTemplates[appliedTemplates.length - 1].suffix;
  }
  enemy.name = rankDef.namePfx + enemy.name + suffix;
  enemy.appliedTemplates = appliedTemplates.map(function(t) { return t.id; });

  return enemy;
}

// ---------------------------------------------------------------------------
// Archetype inference from enemy template name/stats
// ---------------------------------------------------------------------------

// Name-pattern to archetype mapping. Order matters: first match wins.
var _ARCHETYPE_NAME_PATTERNS = [
  // Skirmisher: fast, fragile creatures
  { pattern: /rat|bat|imp|wolf|hound|wasp|spider|fish|eel|beetle|toad|crawler|slug|spirit|scarab|roach|maggot|viper|snake|asp|pup|raptor|insect|vulture|brood|parasite|jelly|spawn|piranha|familiar|kobold|scout|whelp|drone|sprocket/i, archetype: 'skirmisher' },
  // Ranged: stays at distance
  { pattern: /archer|wisp|banshee|phoenix|spitter|overcharge/i, archetype: 'ranged' },
  // Controller: debuffs and magic
  { pattern: /mage|crystallomancer|lich|shade|shaman|demon|fiend|necro|priest|sorcerer|weaver|warper|succubus|incubus|devourer|chorister|preacher|druid|stargazer|alchemist|heretic|bishop|cardinal|specter/i, archetype: 'controller' },
  // Support: heals/buffs allies
  { pattern: /hive mind|siren/i, archetype: 'support' },
  // Bruiser: tanky melee
  { pattern: /guard|knight|golem|titan|colossus|bear|treant|crab|worm|drake|yeti|naga|revenant|horror|brute|behemoth|troll|guardian|sentinel|construct|gargoyle|effigy|champion|automaton|sauropod|triceratops|mammoth|juggernaut|berserker|warchief|reaver|matriarch|lurker|huntsman|stalker|lycan|pack|howler|brawler/i, archetype: 'bruiser' },
  // Hollowed/Maddened humanoids default to bruiser
  { pattern: /hollowed|maddened|cursed|consumed|cocooned|victim|villager|merchant|livestock|thrall|zealot|apprentice|acolyte|worker|food|sailor|traveler|blind|noble|servant|dweller|feeder/i, archetype: 'bruiser' },
];

function inferArchetype(template) {
  // If the template already has an explicit archetype, use it
  if (template.archetype) return template.archetype;
  var name = template.name || '';
  for (var i = 0; i < _ARCHETYPE_NAME_PATTERNS.length; i++) {
    if (_ARCHETYPE_NAME_PATTERNS[i].pattern.test(name)) {
      return _ARCHETYPE_NAME_PATTERNS[i].archetype;
    }
  }
  // Fallback heuristic: high def relative to atk = bruiser, high atk low hp = skirmisher
  if (template.def > template.atk) return 'bruiser';
  if (template.hp <= 25 && template.atk >= 8) return 'skirmisher';
  return 'bruiser';
}

// ---------------------------------------------------------------------------
// Enemy pools — per theme, with shallow/mid/deep/boss tiers
// ---------------------------------------------------------------------------

var ENEMY_POOLS = {
  stone_keep: {
    shallow: [
      { id: 'sk_guard',    name: 'Keep Guard',              hp: 40,  atk: 8,  def: 5,  xp: 15, gold: 5  },
      { id: 'sk_rat',      name: 'Giant Rat',               hp: 20,  atk: 5,  def: 2,  xp: 8,  gold: 2  },
      { id: 'sk_skeleton', name: 'Skeleton Sentry',         hp: 30,  atk: 7,  def: 3,  xp: 12, gold: 4  },
      { id: 'sk_hollowed', name: 'Hollowed Wanderer',       hp: 25,  atk: 7,  def: 3,  xp: 10, gold: 4  },
    ],
    mid: [
      { id: 'sk_knight',   name: 'Fallen Knight',           hp: 70,  atk: 14, def: 10, xp: 30, gold: 12 },
      { id: 'sk_archer',   name: 'Ghost Archer',            hp: 50,  atk: 16, def: 6,  xp: 25, gold: 10, archetype: 'ranged', abilities: [{ id: 'spectral_arrow', name: 'Spectral Arrow', damage: 1.3, range: 5, windUp: 2, cooldown: 3, weight: 10, effect: 'chill', effectChance: 0.2 }] },
      { id: 'sk_hound',    name: 'War Hound',               hp: 45,  atk: 12, def: 5,  xp: 20, gold: 8  },
      { id: 'sk_maddened', name: 'Maddened Adventurer',      hp: 55,  atk: 15, def: 7,  xp: 24, gold: 10 },
    ],
    deep: [
      { id: 'sk_warden',   name: 'Dungeon Warden',          hp: 120, atk: 22, def: 15, xp: 55, gold: 25 },
      { id: 'sk_wraith',   name: 'Armored Wraith',          hp: 90,  atk: 25, def: 12, xp: 45, gold: 20 },
      { id: 'sk_golem',    name: 'Stone Golem',             hp: 160, atk: 18, def: 22, xp: 60, gold: 30 },
      { id: 'sk_lost',     name: 'Hollowed Lost Explorer',  hp: 100, atk: 24, def: 13, xp: 48, gold: 22 },
    ],
    boss: [
      { id: 'sk_lord',     name: 'The Iron Castellan', hp: 400, atk: 35, def: 25, xp: 200, gold: 100 },
    ],
  },
  crystal_cavern: {
    shallow: [
      { id: 'cc_shard',    name: 'Crystal Shard',             hp: 25,  atk: 10, def: 8,  xp: 12, gold: 6  },
      { id: 'cc_bat',      name: 'Gem Bat',                   hp: 18,  atk: 6,  def: 2,  xp: 8,  gold: 3  },
      { id: 'cc_crawler',  name: 'Cave Crawler',              hp: 30,  atk: 7,  def: 4,  xp: 10, gold: 4  },
      { id: 'cc_hollowed', name: 'Hollowed Crystal Miner',    hp: 22,  atk: 8,  def: 5,  xp: 10, gold: 5  },
    ],
    mid: [
      { id: 'cc_golem',    name: 'Crystal Golem',             hp: 80,  atk: 15, def: 14, xp: 35, gold: 15 },
      { id: 'cc_wisp',     name: 'Prismatic Wisp',            hp: 40,  atk: 20, def: 5,  xp: 28, gold: 12 },
      { id: 'cc_spider',   name: 'Gemback Spider',            hp: 55,  atk: 13, def: 8,  xp: 25, gold: 10 },
      { id: 'cc_maddened', name: 'Maddened Gem Seeker',       hp: 48,  atk: 17, def: 6,  xp: 24, gold: 11 },
    ],
    deep: [
      { id: 'cc_titan',    name: 'Crystal Titan',             hp: 150, atk: 24, def: 20, xp: 60, gold: 30 },
      { id: 'cc_worm',     name: 'Burrowing Geode',           hp: 110, atk: 28, def: 15, xp: 50, gold: 25 },
      { id: 'cc_mage',     name: 'Crystallomancer',           hp: 85,  atk: 30, def: 10, xp: 55, gold: 28, archetype: 'controller', abilities: [{ id: 'crystal_lance', name: 'Crystal Lance', damage: 1.4, range: 3, windUp: 2, cooldown: 4, weight: 10 }, { id: 'shatter_ward', name: 'Shatter Ward', damage: 0.6, range: 2, windUp: 2, cooldown: 6, weight: 8, effect: 'armor_break', effectChance: 0.5 }] },
    ],
    boss: [
      { id: 'cc_queen',    name: 'The Prismatic Queen', hp: 450, atk: 38, def: 28, xp: 220, gold: 120 },
    ],
  },
  fungal_forest: {
    shallow: [
      { id: 'ff_spore',    name: 'Spore Walker',     hp: 22,  atk: 6,  def: 3,  xp: 9,  gold: 3  },
      { id: 'ff_toad',     name: 'Toxic Toad',       hp: 28,  atk: 8,  def: 4,  xp: 11, gold: 4  },
      { id: 'ff_beetle',   name: 'Fungus Beetle',    hp: 20,  atk: 5,  def: 6,  xp: 8,  gold: 3  },
    ],
    mid: [
      { id: 'ff_treant',   name: 'Mycelium Treant',  hp: 85,  atk: 14, def: 12, xp: 32, gold: 14 },
      { id: 'ff_shambler', name: 'Rot Shambler',     hp: 60,  atk: 16, def: 7,  xp: 26, gold: 11 },
      { id: 'ff_wasp',     name: 'Bloat Wasp',       hp: 35,  atk: 18, def: 4,  xp: 22, gold: 9  },
    ],
    deep: [
      { id: 'ff_hydra',    name: 'Spore Hydra',      hp: 140, atk: 26, def: 16, xp: 58, gold: 28 },
      { id: 'ff_brain',    name: 'Hive Mind',        hp: 100, atk: 30, def: 12, xp: 52, gold: 24, archetype: 'support', abilities: [{ id: 'psychic_pulse', name: 'Psychic Pulse', damage: 0.9, range: 3, windUp: 2, cooldown: 4, weight: 8, effect: 'confusion', effectChance: 0.4 }, { id: 'spore_heal', name: 'Spore Mend', heals: true, healAmount: 20, range: 4, windUp: 2, cooldown: 5, weight: 12 }] },
      { id: 'ff_colossus', name: 'Fungal Colossus',  hp: 170, atk: 20, def: 22, xp: 65, gold: 32 },
    ],
    boss: [
      { id: 'ff_mother',   name: 'The Spore Mother', hp: 420, atk: 36, def: 24, xp: 210, gold: 110, abilities: [{ id: 'spore_slam', name: 'Spore Slam', damage: 1.5, range: 1, windUp: 2, cooldown: 4, weight: 10 }, { id: 'toxic_cloud', name: 'Toxic Cloud', damage: 0.8, range: 3, windUp: 2, cooldown: 5, weight: 8, effect: 'poison', effectChance: 0.6 }, { id: 'regenerate', name: 'Fungal Regeneration', heals: true, healAmount: 30, range: 0, windUp: 3, cooldown: 8, weight: 6 }], phases: [{ threshold: 0.6, name: 'Spore Bloom', atkMult: 1.3, abilities: [{ id: 'spore_burst', name: 'Spore Burst', damage: 1.6, range: 2, windUp: 2, cooldown: 4, weight: 12, effect: 'poison', effectChance: 0.7 }, { id: 'root_slam', name: 'Root Slam', damage: 2.0, range: 1, windUp: 3, cooldown: 5, weight: 10, effect: 'root', effectChance: 0.4 }], speed: 2 }, { threshold: 0.3, name: 'Final Bloom', atkMult: 1.6, abilities: [{ id: 'death_spore', name: 'Death Spore', damage: 2.2, range: 3, windUp: 3, cooldown: 5, weight: 14, effect: 'poison', effectChance: 0.8 }, { id: 'fungal_wrath', name: 'Fungal Wrath', damage: 1.8, range: 1, windUp: 2, cooldown: 3, weight: 10 }], detectionRadius: 8 }] },
    ],
  },
  lava_rift: {
    shallow: [
      { id: 'lr_imp',      name: 'Magma Imp',        hp: 24,  atk: 9,  def: 3,  xp: 10, gold: 4  },
      { id: 'lr_hound',    name: 'Cinder Hound',     hp: 30,  atk: 8,  def: 4,  xp: 12, gold: 5  },
      { id: 'lr_slug',     name: 'Lava Slug',        hp: 35,  atk: 6,  def: 7,  xp: 11, gold: 5  },
    ],
    mid: [
      { id: 'lr_elem',     name: 'Fire Elemental',   hp: 75,  atk: 20, def: 8,  xp: 34, gold: 16 },
      { id: 'lr_drake',    name: 'Magma Drake',      hp: 90,  atk: 17, def: 12, xp: 38, gold: 18 },
      { id: 'lr_golem',    name: 'Obsidian Golem',   hp: 100, atk: 14, def: 18, xp: 35, gold: 15 },
    ],
    deep: [
      { id: 'lr_wyrm',     name: 'Lava Wyrm',        hp: 160, atk: 28, def: 18, xp: 65, gold: 35 },
      { id: 'lr_demon',    name: 'Infernal Demon',   hp: 130, atk: 32, def: 14, xp: 58, gold: 30 },
      { id: 'lr_phoenix',  name: 'Ash Phoenix',      hp: 110, atk: 26, def: 16, xp: 55, gold: 28, archetype: 'ranged', abilities: [{ id: 'flame_bolt', name: 'Flame Bolt', damage: 1.3, range: 4, windUp: 2, cooldown: 3, weight: 10 }, { id: 'rebirth_flame', name: 'Rebirth Flame', heals: true, healAmount: 30, range: 0, windUp: 3, cooldown: 12, weight: 5 }] },
    ],
    boss: [
      { id: 'lr_titan',    name: 'Molten Titan',     hp: 500, atk: 42, def: 30, xp: 250, gold: 140 },
    ],
  },
  frozen_depths: {
    shallow: [
      { id: 'fd_wolf',     name: 'Frost Wolf',       hp: 28,  atk: 8,  def: 4,  xp: 10, gold: 4  },
      { id: 'fd_spirit',   name: 'Ice Spirit',       hp: 20,  atk: 10, def: 3,  xp: 9,  gold: 3  },
      { id: 'fd_yeti',     name: 'Snow Yeti',        hp: 40,  atk: 7,  def: 6,  xp: 13, gold: 5  },
    ],
    mid: [
      { id: 'fd_knight',   name: 'Frozen Knight',    hp: 80,  atk: 16, def: 14, xp: 35, gold: 16 },
      { id: 'fd_banshee',  name: 'Frost Banshee',    hp: 50,  atk: 22, def: 6,  xp: 30, gold: 13, archetype: 'ranged', abilities: [{ id: 'wail', name: 'Frost Wail', damage: 1.1, range: 4, windUp: 2, cooldown: 3, weight: 10, effect: 'fear', effectChance: 0.3 }] },
      { id: 'fd_bear',     name: 'Glacier Bear',     hp: 95,  atk: 15, def: 12, xp: 33, gold: 14 },
    ],
    deep: [
      { id: 'fd_dragon',   name: 'Ice Wyrm',         hp: 150, atk: 28, def: 20, xp: 62, gold: 32 },
      { id: 'fd_lich',     name: 'Frost Lich',       hp: 100, atk: 34, def: 14, xp: 58, gold: 28, archetype: 'controller', abilities: [{ id: 'frost_bolt', name: 'Frost Bolt', damage: 1.2, range: 4, windUp: 2, cooldown: 3, weight: 10 }, { id: 'blizzard', name: 'Blizzard', damage: 0.7, range: 3, windUp: 3, cooldown: 7, weight: 7, effect: 'slow', effectChance: 0.6 }] },
      { id: 'fd_colossus', name: 'Glacial Colossus', hp: 180, atk: 22, def: 24, xp: 68, gold: 35 },
    ],
    boss: [
      { id: 'fd_queen',    name: 'The Frost Empress', hp: 480, atk: 40, def: 30, xp: 240, gold: 130 },
    ],
  },
  flooded_ruins: {
    shallow: [
      { id: 'fr_fish',     name: 'Piranha Swarm',    hp: 18,  atk: 9,  def: 2,  xp: 8,  gold: 3  },
      { id: 'fr_crab',     name: 'Rust Crab',        hp: 30,  atk: 6,  def: 8,  xp: 10, gold: 4  },
      { id: 'fr_eel',      name: 'Electric Eel',     hp: 22,  atk: 11, def: 3,  xp: 9,  gold: 4  },
    ],
    mid: [
      { id: 'fr_naga',     name: 'Ruin Naga',        hp: 70,  atk: 18, def: 10, xp: 32, gold: 14 },
      { id: 'fr_golem',    name: 'Waterlogged Golem', hp: 90, atk: 13, def: 16, xp: 30, gold: 13 },
      { id: 'fr_shade',    name: 'Drowned Shade',    hp: 55,  atk: 20, def: 6,  xp: 28, gold: 12 },
    ],
    deep: [
      { id: 'fr_kraken',   name: 'Depth Kraken',     hp: 140, atk: 26, def: 18, xp: 60, gold: 30 },
      { id: 'fr_serpent',  name: 'Abyssal Serpent',  hp: 120, atk: 30, def: 14, xp: 55, gold: 28 },
      { id: 'fr_leviathan', name: 'Ruin Leviathan',  hp: 170, atk: 24, def: 22, xp: 65, gold: 34 },
    ],
    boss: [
      { id: 'fr_king',     name: 'The Drowned King', hp: 460, atk: 38, def: 28, xp: 230, gold: 125 },
    ],
  },
  bone_yard: {
    shallow: [
      { id: 'by_skeleton', name: 'Bone Walker',              hp: 25,  atk: 7,  def: 5,  xp: 9,  gold: 3  },
      { id: 'by_ghoul',    name: 'Grave Ghoul',              hp: 30,  atk: 9,  def: 4,  xp: 11, gold: 4  },
      { id: 'by_vulture',  name: 'Carrion Vulture',          hp: 18,  atk: 8,  def: 2,  xp: 8,  gold: 3  },
      { id: 'by_hollowed', name: 'Hollowed Grave Digger',    hp: 24,  atk: 8,  def: 3,  xp: 10, gold: 4  },
    ],
    mid: [
      { id: 'by_revenant', name: 'Bone Revenant',            hp: 75,  atk: 16, def: 12, xp: 32, gold: 14 },
      { id: 'by_wraith',   name: 'Death Wraith',             hp: 55,  atk: 22, def: 6,  xp: 28, gold: 12 },
      { id: 'by_horror',   name: 'Flesh Horror',             hp: 90,  atk: 14, def: 14, xp: 34, gold: 15 },
      { id: 'by_maddened', name: 'Maddened Bone Collector',  hp: 60,  atk: 17, def: 9,  xp: 26, gold: 11 },
    ],
    deep: [
      { id: 'by_lich',     name: 'Bone Lich',                hp: 110, atk: 30, def: 14, xp: 55, gold: 28 },
      { id: 'by_dragon',   name: 'Skeletal Dragon',          hp: 160, atk: 26, def: 20, xp: 65, gold: 34 },
      { id: 'by_titan',    name: 'Ossuary Titan',            hp: 140, atk: 24, def: 22, xp: 60, gold: 30 },
    ],
    boss: [
      { id: 'by_lord',     name: 'The Bone Sovereign', hp: 440, atk: 36, def: 26, xp: 220, gold: 115 },
    ],
  },
  shadow_realm: {
    shallow: [
      { id: 'sr_shade',    name: 'Shadow Wisp',              hp: 18,  atk: 10, def: 2,  xp: 9,  gold: 4  },
      { id: 'sr_hound',    name: 'Void Hound',               hp: 28,  atk: 8,  def: 5,  xp: 11, gold: 4  },
      { id: 'sr_eye',      name: 'Floating Eye',             hp: 15,  atk: 12, def: 1,  xp: 10, gold: 5  },
      { id: 'sr_hollowed', name: 'Hollowed Shadow-Touched',  hp: 22,  atk: 9,  def: 3,  xp: 10, gold: 5  },
    ],
    mid: [
      { id: 'sr_stalker',  name: 'Shadow Stalker',           hp: 60,  atk: 22, def: 8,  xp: 34, gold: 16 },
      { id: 'sr_phantom',  name: 'Nightmare Phantom',        hp: 50,  atk: 24, def: 5,  xp: 30, gold: 14 },
      { id: 'sr_knight',   name: 'Dark Knight',              hp: 80,  atk: 18, def: 14, xp: 36, gold: 16 },
      { id: 'sr_maddened', name: 'Maddened Void-Walker',     hp: 65,  atk: 20, def: 7,  xp: 30, gold: 13 },
    ],
    deep: [
      { id: 'sr_fiend',    name: 'Void Fiend',               hp: 120, atk: 32, def: 14, xp: 60, gold: 32 },
      { id: 'sr_horror',   name: 'Eldritch Horror',          hp: 140, atk: 28, def: 18, xp: 58, gold: 30 },
      { id: 'sr_weaver',   name: 'Shadow Weaver',            hp: 100, atk: 34, def: 12, xp: 55, gold: 28, archetype: 'controller', abilities: [{ id: 'shadow_bolt', name: 'Shadow Bolt', damage: 1.3, range: 4, windUp: 2, cooldown: 3, weight: 10 }, { id: 'void_snare', name: 'Void Snare', damage: 0.5, range: 3, windUp: 2, cooldown: 6, weight: 8, effect: 'root', effectChance: 0.5 }] },
      { id: 'sr_consumed', name: 'Hollowed Consumed One',    hp: 115, atk: 30, def: 15, xp: 56, gold: 29 },
    ],
    boss: [
      { id: 'sr_lord',     name: 'The Void Harbinger', hp: 500, atk: 44, def: 30, xp: 260, gold: 150, abilities: [{ id: 'void_cleave', name: 'Void Cleave', damage: 1.8, range: 1, windUp: 2, cooldown: 4, weight: 10 }, { id: 'shadow_nova', name: 'Shadow Nova', damage: 1.2, range: 3, windUp: 3, cooldown: 6, weight: 8, effect: 'blind', effectChance: 0.5 }, { id: 'consume', name: 'Consume Reality', damage: 2.5, range: 1, windUp: 4, cooldown: 10, weight: 5, effect: 'doom', effectChance: 0.3 }], phases: [{ threshold: 0.6, name: 'Void Rift', atkMult: 1.3, abilities: [{ id: 'rift_tear', name: 'Rift Tear', damage: 2.0, range: 2, windUp: 2, cooldown: 4, weight: 12 }, { id: 'shadow_nova', name: 'Shadow Nova', damage: 1.2, range: 3, windUp: 3, cooldown: 5, weight: 10, effect: 'blind', effectChance: 0.6 }], speed: 2 }, { threshold: 0.3, name: 'Unmaking', atkMult: 1.8, abilities: [{ id: 'unmake', name: 'Unmake', damage: 3.0, range: 1, windUp: 3, cooldown: 5, weight: 14 }, { id: 'void_collapse', name: 'Void Collapse', damage: 1.5, range: 4, windUp: 4, cooldown: 6, weight: 10, effect: 'slow', effectChance: 0.8 }], detectionRadius: 10 }] },
    ],
  },
  overgrown_temple: {
    shallow: [
      { id: 'ot_vine',     name: 'Vine Creeper',     hp: 25,  atk: 7,  def: 5,  xp: 9,  gold: 3  },
      { id: 'ot_golem',    name: 'Moss Golem',       hp: 35,  atk: 6,  def: 8,  xp: 12, gold: 5  },
      { id: 'ot_snake',    name: 'Temple Viper',     hp: 18,  atk: 10, def: 2,  xp: 8,  gold: 3  },
    ],
    mid: [
      { id: 'ot_guardian', name: 'Stone Guardian',   hp: 85,  atk: 15, def: 16, xp: 35, gold: 15 },
      { id: 'ot_druid',    name: 'Wild Druid',       hp: 55,  atk: 20, def: 8,  xp: 30, gold: 13 },
      { id: 'ot_ape',      name: 'Temple Ape',       hp: 70,  atk: 17, def: 10, xp: 28, gold: 12 },
    ],
    deep: [
      { id: 'ot_hydra',    name: 'Vine Hydra',       hp: 140, atk: 26, def: 18, xp: 60, gold: 30 },
      { id: 'ot_titan',    name: 'Overgrown Titan',  hp: 160, atk: 22, def: 22, xp: 65, gold: 34 },
      { id: 'ot_spirit',   name: 'Ancient Spirit',   hp: 100, atk: 32, def: 12, xp: 55, gold: 28 },
    ],
    boss: [
      { id: 'ot_avatar',   name: 'Avatar of the Wild', hp: 460, atk: 38, def: 28, xp: 230, gold: 125 },
    ],
  },
  sand_tomb: {
    shallow: [
      { id: 'st_scarab',   name: 'Sand Scarab',      hp: 20,  atk: 7,  def: 4,  xp: 8,  gold: 3  },
      { id: 'st_mummy',    name: 'Tomb Mummy',       hp: 32,  atk: 8,  def: 6,  xp: 12, gold: 5  },
      { id: 'st_snake',    name: 'Dust Asp',         hp: 16,  atk: 10, def: 2,  xp: 9,  gold: 4  },
    ],
    mid: [
      { id: 'st_priest',   name: 'Sand Priest',      hp: 60,  atk: 20, def: 8,  xp: 32, gold: 14 },
      { id: 'st_golem',    name: 'Sandstone Golem',  hp: 90,  atk: 14, def: 16, xp: 35, gold: 15 },
      { id: 'st_jackal',   name: 'Anubis Jackal',    hp: 55,  atk: 18, def: 10, xp: 30, gold: 13 },
    ],
    deep: [
      { id: 'st_sphinx',   name: 'Tomb Sphinx',      hp: 130, atk: 28, def: 18, xp: 60, gold: 32 },
      { id: 'st_pharaoh',  name: 'Cursed Pharaoh',   hp: 120, atk: 32, def: 14, xp: 58, gold: 30 },
      { id: 'st_worm',     name: 'Sand Worm',        hp: 160, atk: 24, def: 20, xp: 65, gold: 34 },
    ],
    boss: [
      { id: 'st_king',     name: 'The Eternal Pharaoh', hp: 470, atk: 40, def: 28, xp: 240, gold: 130 },
    ],
  },
};

// ---------------------------------------------------------------------------
// NEW THEMES (12 additions)
// ---------------------------------------------------------------------------

// --- 1. iron_forge ---
// Castle category: the industrial underbelly of a great keep.
// Biomes: Mountain (2), Mechspire (10), Clockwork Harbor (11)
// Layout: ARENA — open central forge pit, surrounding catwalks
ENEMY_POOLS.iron_forge = {
  shallow: [
    { id: 'if_hollowed',   name: 'Hollowed Dwarf Smith',    hp: 28, atk: 8,  def: 5,  xp: 11, gold: 5  },
    { id: 'if_slag',       name: 'Slag Crawler',            hp: 30, atk: 6,  def: 5,  xp: 10, gold: 3  },
    { id: 'if_maddened',   name: 'Maddened Dwarf Miner',    hp: 24, atk: 9,  def: 3,  xp: 10, gold: 4  },
    { id: 'if_bellows',    name: 'Bellows Imp',             hp: 18, atk: 8,  def: 2,  xp: 9,  gold: 4  },
  ],
  mid: [
    { id: 'if_forgebound', name: 'Forgebound Dwarf',        hp: 80, atk: 16, def: 14, xp: 36, gold: 16 },
    { id: 'if_automaton',  name: 'Furnace Automaton',       hp: 75, atk: 15, def: 13, xp: 34, gold: 15 },
    { id: 'if_smelter',    name: 'Hollowed Smelter',        hp: 65, atk: 18, def: 9,  xp: 30, gold: 13 },
    { id: 'if_golem',      name: 'Slag Golem',              hp: 90, atk: 13, def: 17, xp: 34, gold: 15 },
  ],
  deep: [
    { id: 'if_juggernaut', name: 'Hollowed Juggernaut',     hp: 160, atk: 24, def: 22, xp: 65, gold: 34 },
    { id: 'if_berserker',  name: 'Maddened Forge-Lord',     hp: 130, atk: 28, def: 16, xp: 58, gold: 29 },
    { id: 'if_fiend',      name: 'Molten Fiend',            hp: 110, atk: 32, def: 12, xp: 55, gold: 27 },
  ],
  boss: [
    { id: 'if_overlord',   name: 'The Hollowed Grand Smelter', hp: 480, atk: 42, def: 32, xp: 245, gold: 135 },
  ],
};

// --- 2. haunted_manor ---
// Castle category: a cursed noble estate where the dead still dine.
// Biomes: Plains (6), Holy Dominion (8), Swamp (7)
// Layout: BSP_ROOMS — interconnected manor rooms and servant passages
ENEMY_POOLS.haunted_manor = {
  shallow: [
    { id: 'hm_hollowed',    name: 'Hollowed Human Servant',  hp: 22, atk: 8,  def: 3,  xp: 10, gold: 5  },
    { id: 'hm_poltergeist', name: 'Poltergeist',             hp: 20, atk: 9,  def: 2,  xp: 10, gold: 5  },
    { id: 'hm_maddened',    name: 'Maddened Noble',          hp: 26, atk: 7,  def: 4,  xp: 9,  gold: 5  },
    { id: 'hm_rat',         name: 'Cursed Familiar',         hp: 15, atk: 8,  def: 1,  xp: 8,  gold: 3  },
  ],
  mid: [
    { id: 'hm_specter',     name: 'Hollowed Human Specter',  hp: 55, atk: 22, def: 6,  xp: 30, gold: 13 },
    { id: 'hm_butler',      name: 'Maddened Butler',         hp: 70, atk: 16, def: 11, xp: 32, gold: 14 },
    { id: 'hm_hound',       name: 'Phantom Hound',           hp: 50, atk: 20, def: 7,  xp: 28, gold: 12 },
  ],
  deep: [
    { id: 'hm_countess',    name: 'The Hollowed Countess',   hp: 120, atk: 30, def: 14, xp: 58, gold: 30 },
    { id: 'hm_revenant',    name: 'Maddened Noble Revenant',  hp: 140, atk: 26, def: 18, xp: 62, gold: 32 },
    { id: 'hm_amalgam',     name: 'Grief Amalgam',           hp: 105, atk: 28, def: 13, xp: 55, gold: 27 },
  ],
  boss: [
    { id: 'hm_patriarch',   name: 'Lord Varek the Hollowed', hp: 440, atk: 38, def: 26, xp: 225, gold: 120 },
  ],
};

// --- 3. tidal_vault ---
// Wild category: a sea-god's drowned treasury sealed beneath tidal pressure.
// Biomes: Water (0), Beach (13), Gnomish Isles (9)
// Layout: LAKE — flooded central chamber, raised stone platforms around it
ENEMY_POOLS.tidal_vault = {
  shallow: [
    { id: 'tv_hollowed',    name: 'Hollowed Lizardfolk Diver', hp: 24, atk: 8,  def: 4,  xp: 10, gold: 4  },
    { id: 'tv_barnacle',    name: 'Barnacle Scraper',          hp: 22, atk: 7,  def: 5,  xp: 9,  gold: 3  },
    { id: 'tv_eel',         name: 'Saltfang Eel',              hp: 18, atk: 10, def: 2,  xp: 9,  gold: 4  },
    { id: 'tv_crab',        name: 'Tidal Crab',                hp: 28, atk: 6,  def: 7,  xp: 10, gold: 4  },
  ],
  mid: [
    { id: 'tv_siren',       name: 'Vault Siren',               hp: 55, atk: 22, def: 6,  xp: 30, gold: 14, archetype: 'support', abilities: [{ id: 'siren_song', name: 'Siren Song', damage: 0.9, range: 3, windUp: 2, cooldown: 4, weight: 8, effect: 'confusion', effectChance: 0.4 }, { id: 'tidal_mend', name: 'Tidal Mend', heals: true, healAmount: 18, range: 4, windUp: 2, cooldown: 5, weight: 12 }] },
    { id: 'tv_maddened',    name: 'Maddened Lizardfolk Shaman', hp: 60, atk: 20, def: 8,  xp: 31, gold: 14 },
    { id: 'tv_guardian',    name: 'Tide Guardian',              hp: 80, atk: 14, def: 16, xp: 34, gold: 15 },
    { id: 'tv_shark',       name: 'Bronze Shark',               hp: 65, atk: 19, def: 10, xp: 31, gold: 13 },
  ],
  deep: [
    { id: 'tv_warden',      name: 'Hollowed Abyssal Warden',   hp: 140, atk: 26, def: 20, xp: 62, gold: 32 },
    { id: 'tv_colossus',    name: 'Tidal Colossus',             hp: 170, atk: 22, def: 24, xp: 66, gold: 35 },
    { id: 'tv_leviathan',   name: 'Maddened Vault Leviathan',   hp: 150, atk: 30, def: 16, xp: 60, gold: 30 },
  ],
  boss: [
    { id: 'tv_kraken',      name: 'The Hollowed Tidebound Kraken', hp: 500, atk: 40, def: 30, xp: 255, gold: 145 },
  ],
};

// --- 4. plague_warren ---
// Wild category: a labyrinthine network of rat tunnels bloated with disease.
// Biomes: Swamp (7), Forest (5), Wastes (12)
// Layout: MAZE — twisting narrow passages, dead ends, ooze-flooded corridors
ENEMY_POOLS.plague_warren = {
  shallow: [
    { id: 'pw_rat',         name: 'Plague Rat',        hp: 18, atk: 6,  def: 2,  xp: 8,  gold: 3  },
    { id: 'pw_maggot',      name: 'Bloat Maggot',      hp: 24, atk: 5,  def: 4,  xp: 8,  gold: 2  },
    { id: 'pw_roach',       name: 'Bile Roach',        hp: 16, atk: 8,  def: 3,  xp: 8,  gold: 3  },
  ],
  mid: [
    { id: 'pw_carrier',     name: 'Plague Carrier',    hp: 60, atk: 16, def: 8,  xp: 28, gold: 11 },
    { id: 'pw_brute',       name: 'Infected Brute',    hp: 80, atk: 18, def: 12, xp: 34, gold: 14 },
    { id: 'pw_crawler',     name: 'Ooze Crawler',      hp: 45, atk: 20, def: 5,  xp: 26, gold: 10 },
  ],
  deep: [
    { id: 'pw_behemoth',    name: 'Plague Behemoth',   hp: 155, atk: 26, def: 18, xp: 62, gold: 30 },
    { id: 'pw_queen',       name: 'Vermin Queen',      hp: 130, atk: 28, def: 14, xp: 56, gold: 27 },
    { id: 'pw_blight',      name: 'Blight Horror',     hp: 110, atk: 30, def: 10, xp: 54, gold: 26 },
  ],
  boss: [
    { id: 'pw_father',      name: 'Father Pestilence', hp: 450, atk: 36, def: 24, xp: 230, gold: 120 },
  ],
};

// --- 5. elven_reliquary ---
// Wild category: a sealed vault of ancient elven artifacts, locked by forgotten wards.
// Biomes: Elven South (16), Forest (5)
// Layout: TEMPLE_HALLS — long symmetrical corridors, warded alcoves, inner sanctum
ENEMY_POOLS.elven_reliquary = {
  shallow: [
    { id: 'er_hollowed',    name: 'Hollowed Elf Acolyte',    hp: 22, atk: 10, def: 4,  xp: 11, gold: 5  },
    { id: 'er_ward',        name: 'Arcane Ward',             hp: 20, atk: 9,  def: 6,  xp: 10, gold: 4  },
    { id: 'er_maddened',    name: 'Maddened Elf Warden',     hp: 26, atk: 8,  def: 5,  xp: 10, gold: 4  },
    { id: 'er_sprite',      name: 'Forest Sprite',           hp: 16, atk: 8,  def: 3,  xp: 9,  gold: 4  },
  ],
  mid: [
    { id: 'er_archivist',   name: 'Hollowed Archivist',      hp: 50, atk: 22, def: 7,  xp: 32, gold: 14 },
    { id: 'er_golem',       name: 'Willow Golem',            hp: 85, atk: 15, def: 15, xp: 36, gold: 16 },
    { id: 'er_wraith',      name: 'Maddened Elf Blademaster', hp: 68, atk: 20, def: 9,  xp: 30, gold: 13 },
    { id: 'er_sentinel',    name: 'Deranged Rune Sentinel',  hp: 30, atk: 12, def: 10, xp: 25, gold: 11 },
  ],
  deep: [
    { id: 'er_corrupted',   name: 'Corrupted Elf Sorcerer',  hp: 100, atk: 34, def: 12, xp: 58, gold: 29 },
    { id: 'er_lich',        name: 'Hollowed Elven Lich',     hp: 120, atk: 32, def: 14, xp: 60, gold: 32 },
    { id: 'er_construct',   name: 'Relic Construct',         hp: 155, atk: 22, def: 22, xp: 64, gold: 33 },
  ],
  boss: [
    { id: 'er_keeper',      name: 'The Hollowed Eternal Keeper', hp: 460, atk: 40, def: 28, xp: 240, gold: 130 },
  ],
};

// --- 6. gnomish_workshop ---
// Wild category: an abandoned gnomish research facility where the experiments still run.
// Biomes: Gnomish Isles (9), Mechspire (10), Clockwork Harbor (11)
// Layout: MAZE — interlocking lab cells, steam vents, conveyor corridors
ENEMY_POOLS.gnomish_workshop = {
  shallow: [
    { id: 'gw_hollowed',    name: 'Hollowed Gnome Tinker',   hp: 20, atk: 8,  def: 3,  xp: 10, gold: 5  },
    { id: 'gw_sprocket',    name: 'Rogue Sprocket',          hp: 20, atk: 7,  def: 4,  xp: 9,  gold: 4  },
    { id: 'gw_drone',       name: 'Malfunction Drone',       hp: 18, atk: 9,  def: 3,  xp: 9,  gold: 4  },
    { id: 'gw_maddened',    name: 'Maddened Gnome Laborer',  hp: 16, atk: 9,  def: 2,  xp: 9,  gold: 4  },
  ],
  mid: [
    { id: 'gw_mk2',         name: 'Combat Mk.II',            hp: 70, atk: 17, def: 12, xp: 34, gold: 15 },
    { id: 'gw_alchemist',   name: 'Hollowed Gnome Alchemist', hp: 55, atk: 20, def: 8,  xp: 30, gold: 13 },
    { id: 'gw_colossus',    name: 'Scrap Colossus',          hp: 90, atk: 14, def: 16, xp: 35, gold: 15 },
    { id: 'gw_crazed',      name: 'Crazed Gnome Engineer',   hp: 48, atk: 22, def: 6,  xp: 28, gold: 12 },
  ],
  deep: [
    { id: 'gw_failsafe',    name: 'Project Failsafe',        hp: 145, atk: 28, def: 18, xp: 62, gold: 31 },
    { id: 'gw_siege',       name: 'Siege Engine',            hp: 170, atk: 22, def: 24, xp: 66, gold: 34 },
    { id: 'gw_experiment',  name: 'Hollowed Gnome Abomination', hp: 110, atk: 32, def: 12, xp: 58, gold: 29 },
  ],
  boss: [
    { id: 'gw_director',    name: 'The Hollowed Director Zero', hp: 490, atk: 42, def: 30, xp: 250, gold: 140 },
  ],
};

// --- 7. orc_barrow ---
// Wild category: a sacred orcish burial mound where fallen warlords refuse to sleep.
// Biomes: Steppes (4), Plains (6), Desert (1)
// Layout: OPEN_CAVERN — wide rough-cut chambers, open central barrow pit
ENEMY_POOLS.orc_barrow = {
  shallow: [
    { id: 'ob_hollowed',    name: 'Hollowed Orc Warrior',    hp: 30, atk: 9,  def: 4,  xp: 11, gold: 4  },
    { id: 'ob_shade',       name: 'Barrow Shade',            hp: 28, atk: 8,  def: 4,  xp: 10, gold: 3  },
    { id: 'ob_maddened',    name: 'Maddened Orc Berserker',  hp: 26, atk: 10, def: 2,  xp: 10, gold: 4  },
    { id: 'ob_whelp',       name: 'Dire Whelp',              hp: 24, atk: 7,  def: 3,  xp: 9,  gold: 3  },
  ],
  mid: [
    { id: 'ob_reaver',      name: 'Hollowed Orc Reaver',     hp: 80, atk: 18, def: 11, xp: 35, gold: 15 },
    { id: 'ob_shaman',      name: 'Maddened Orc Shaman',     hp: 55, atk: 22, def: 7,  xp: 31, gold: 13 },
    { id: 'ob_champion',    name: 'Pale Champion',           hp: 85, atk: 16, def: 14, xp: 36, gold: 16 },
    { id: 'ob_skull',       name: 'Warrior Skull Swarm',     hp: 40, atk: 14, def: 5,  xp: 22, gold: 10 },
  ],
  deep: [
    { id: 'ob_warchief',    name: 'Hollowed Orc Warchief',   hp: 150, atk: 28, def: 18, xp: 64, gold: 33 },
    { id: 'ob_titan',       name: 'Burial Titan',            hp: 165, atk: 24, def: 22, xp: 66, gold: 34 },
    { id: 'ob_soulrender',  name: 'Maddened Soul Render',    hp: 115, atk: 30, def: 14, xp: 57, gold: 28 },
  ],
  boss: [
    { id: 'ob_warlord',     name: "Warlord Grukk the Hollowed", hp: 465, atk: 40, def: 28, xp: 238, gold: 128 },
  ],
};

// --- 8. mirage_palace ---
// Wild category: a desert illusionist's palace that shifts and deceives.
// Biomes: Desert (1), Scorched Sands (3)
// Layout: ISLAND — rooms connected by sand-bridges that can vanish
ENEMY_POOLS.mirage_palace = {
  shallow: [
    { id: 'mp_hollowed',    name: 'Hollowed Cat Folk Nomad',  hp: 18, atk: 10, def: 2,  xp: 10, gold: 5  },
    { id: 'mp_illusion',    name: 'Sand Illusion',            hp: 16, atk: 10, def: 2,  xp: 10, gold: 5  },
    { id: 'mp_djinn',       name: 'Sand Djinn',               hp: 22, atk: 9,  def: 3,  xp: 10, gold: 5  },
    { id: 'mp_viper',       name: 'Mirage Viper',             hp: 18, atk: 8,  def: 2,  xp: 9,  gold: 4  },
  ],
  mid: [
    { id: 'mp_sphinx',      name: 'Riddle Sphinx',            hp: 70, atk: 18, def: 10, xp: 34, gold: 15 },
    { id: 'mp_maddened',    name: 'Maddened Cat Folk Dancer',  hp: 50, atk: 24, def: 6,  xp: 31, gold: 14 },
    { id: 'mp_golem',       name: 'Glass Golem',              hp: 85, atk: 14, def: 16, xp: 35, gold: 15 },
  ],
  deep: [
    { id: 'mp_sultan',      name: 'Hollowed Miragesultan',    hp: 120, atk: 30, def: 14, xp: 58, gold: 29 },
    { id: 'mp_sandwyrm',    name: 'Palace Sand Wyrm',         hp: 155, atk: 26, def: 20, xp: 64, gold: 33 },
    { id: 'mp_vizier',      name: 'Maddened Undying Vizier',   hp: 105, atk: 32, def: 11, xp: 56, gold: 27 },
  ],
  boss: [
    { id: 'mp_caliph',      name: 'The Hollowed Eternal Caliph', hp: 455, atk: 38, def: 26, xp: 235, gold: 125 },
  ],
};

// --- 9. frost_citadel ---
// Wild category: a fortress carved into a glacier by ancient beings, now locked in eternal winter.
// Biomes: Frostbound (14)
// Layout: BSP_ROOMS — carved ice-block rooms, frozen-over archways
ENEMY_POOLS.frost_citadel = {
  shallow: [
    { id: 'fc_hollowed',    name: 'Hollowed Frost Dweller',  hp: 24, atk: 9,  def: 4,  xp: 10, gold: 4  },
    { id: 'fc_sprite',      name: 'Frost Sprite',            hp: 18, atk: 9,  def: 4,  xp: 9,  gold: 4  },
    { id: 'fc_hound',       name: 'Glacial Hound',           hp: 28, atk: 7,  def: 5,  xp: 10, gold: 4  },
    { id: 'fc_maddened',    name: 'Maddened Frozen One',     hp: 20, atk: 11, def: 3,  xp: 10, gold: 5  },
  ],
  mid: [
    { id: 'fc_knight',      name: 'Hollowed Ice Knight',     hp: 80, atk: 16, def: 14, xp: 35, gold: 16 },
    { id: 'fc_warden',      name: 'Maddened Citadel Warden', hp: 90, atk: 14, def: 16, xp: 36, gold: 16 },
    { id: 'fc_mage',        name: 'Glacier Mage',            hp: 52, atk: 22, def: 7,  xp: 31, gold: 14 },
  ],
  deep: [
    { id: 'fc_titan',       name: 'Frost Titan',             hp: 170, atk: 24, def: 24, xp: 68, gold: 35 },
    { id: 'fc_lich',        name: 'Hollowed Permafrost Lich', hp: 110, atk: 34, def: 14, xp: 60, gold: 30 },
    { id: 'fc_wyrm',        name: 'Blizzard Wyrm',           hp: 150, atk: 28, def: 20, xp: 63, gold: 32 },
  ],
  boss: [
    { id: 'fc_sovereign',   name: 'The Hollowed Winter Sovereign', hp: 510, atk: 42, def: 32, xp: 260, gold: 150 },
  ],
};

// --- 10. goblin_warrens ---
// Wild category: a chaotic, trap-dense sprawl built by generations of goblin clans.
// Biomes: Forest (5), Swamp (7), Wastes (12)
// Layout: MAZE — cramped tunnels, rigged corridors, ambush pits
ENEMY_POOLS.goblin_warrens = {
  shallow: [
    { id: 'gv_hollowed',    name: 'Hollowed Goblin Grunt',   hp: 20, atk: 8,  def: 2,  xp: 9,  gold: 4  },
    { id: 'gv_trapper',     name: 'Pit Trapper',             hp: 18, atk: 6,  def: 3,  xp: 8,  gold: 5  },
    { id: 'gv_maddened',    name: 'Maddened Goblin Scrapper', hp: 16, atk: 9,  def: 1,  xp: 9,  gold: 4  },
    { id: 'gv_rat',         name: 'Warren Rat',              hp: 14, atk: 5,  def: 1,  xp: 6,  gold: 3  },
  ],
  mid: [
    { id: 'gv_warboss',     name: 'Hollowed Goblin Warboss', hp: 80, atk: 18, def: 10, xp: 34, gold: 16 },
    { id: 'gv_shaman',      name: 'Maddened Hex Shaman',     hp: 50, atk: 22, def: 6,  xp: 30, gold: 14 },
    { id: 'gv_brawler',     name: 'Cave Brawler',            hp: 70, atk: 16, def: 12, xp: 32, gold: 14 },
    { id: 'gv_crazed',      name: 'Crazed Goblin Bomber',    hp: 35, atk: 25, def: 3,  xp: 26, gold: 12 },
  ],
  deep: [
    { id: 'gv_king',        name: 'Hollowed Goblin King',    hp: 140, atk: 28, def: 16, xp: 60, gold: 31 },
    { id: 'gv_beast',       name: 'Tamed Cave Beast',        hp: 160, atk: 24, def: 20, xp: 64, gold: 33 },
    { id: 'gv_tinker',      name: 'Maddened Master Tinker',  hp: 100, atk: 32, def: 10, xp: 57, gold: 28 },
  ],
  boss: [
    { id: 'gv_overlord',    name: "Skrix the Hollowed Warchief", hp: 430, atk: 36, def: 22, xp: 220, gold: 115 },
  ],
};

// --- 11. ashen_observatory ---
// Wild category: a mountaintop observatory consumed by volcanic eruption, now haunted.
// Biomes: Mountain (2), Scorched Sands (3), Wastes (12)
// Layout: OPEN_CAVERN — shattered dome, exposed sky-shafts, ash-drifted floors
ENEMY_POOLS.ashen_observatory = {
  shallow: [
    { id: 'ao_ashfiend',    name: 'Ash Fiend',         hp: 24, atk: 9,  def: 3,  xp: 10, gold: 4  },
    { id: 'ao_cinder',      name: 'Cinder Wisp',       hp: 16, atk: 11, def: 1,  xp: 10, gold: 5  },
    { id: 'ao_vulture',     name: 'Ember Vulture',     hp: 20, atk: 8,  def: 2,  xp: 9,  gold: 4  },
  ],
  mid: [
    { id: 'ao_stargazer',   name: 'Burned Stargazer',  hp: 55, atk: 22, def: 7,  xp: 31, gold: 14 },
    { id: 'ao_drake',       name: 'Ash Drake',         hp: 80, atk: 17, def: 13, xp: 36, gold: 16 },
    { id: 'ao_golem',       name: 'Cinder Golem',      hp: 90, atk: 14, def: 17, xp: 35, gold: 15 },
  ],
  deep: [
    { id: 'ao_phoenix',     name: 'Ruined Phoenix',    hp: 120, atk: 30, def: 14, xp: 58, gold: 29 },
    { id: 'ao_titan',       name: 'Obsidian Titan',    hp: 160, atk: 26, def: 22, xp: 66, gold: 34 },
    { id: 'ao_herald',      name: 'Caldera Herald',    hp: 130, atk: 28, def: 16, xp: 60, gold: 30 },
  ],
  boss: [
    { id: 'ao_watcher',     name: 'The Ashen Watcher', hp: 475, atk: 40, def: 28, xp: 242, gold: 132 },
  ],
};

// --- 12. sunken_cathedral ---
// Wild category: a holy cathedral swallowed by the earth in an ancient catastrophe.
// Biomes: Holy Dominion (8), Swamp (7), Water (0)
// Layout: TEMPLE_HALLS — grand nave, flooded transepts, collapsed bell towers
ENEMY_POOLS.sunken_cathedral = {
  shallow: [
    { id: 'sc_zealot',      name: 'Drowned Zealot',    hp: 26, atk: 8,  def: 4,  xp: 10, gold: 4  },
    { id: 'sc_wraith',      name: 'Penitent Wraith',   hp: 18, atk: 10, def: 2,  xp: 9,  gold: 4  },
    { id: 'sc_gargoyle',    name: 'Stone Gargoyle',    hp: 32, atk: 7,  def: 7,  xp: 11, gold: 4  },
  ],
  mid: [
    { id: 'sc_inquisitor',  name: 'Fallen Inquisitor', hp: 75, atk: 18, def: 12, xp: 36, gold: 16 },
    { id: 'sc_seraph',      name: 'Corrupted Seraph',  hp: 55, atk: 22, def: 8,  xp: 32, gold: 14 },
    { id: 'sc_effigy',      name: 'Stone Effigy',      hp: 90, atk: 14, def: 16, xp: 35, gold: 15 },
  ],
  deep: [
    { id: 'sc_heretic',     name: 'High Heretic',      hp: 125, atk: 30, def: 14, xp: 58, gold: 29 },
    { id: 'sc_bishop',      name: 'Undead Bishop',     hp: 105, atk: 28, def: 13, xp: 55, gold: 27 },
    { id: 'sc_cardinal',    name: 'Void Cardinal',     hp: 145, atk: 26, def: 18, xp: 63, gold: 32 },
  ],
  boss: [
    { id: 'sc_archbishop',  name: 'The Forsaken Archbishop', hp: 470, atk: 40, def: 28, xp: 242, gold: 132 },
  ],
};

// --- 13. puzzle_labyrinth ---
// Wild category: a floor designed by something intelligent and cruel. Shifting walls,
// pressure plates, logic gates made of stone. The trapped builders went mad trying
// to solve their own creation. Conceptually the most trap-dense theme.
// Biomes: Holy Dominion (8), Gnomish Isles (9), Mountain (2)
// Layout: MAZE — shifting corridors, dead-end chambers, rune-locked gates
ENEMY_POOLS.puzzle_labyrinth = {
  shallow: [
    { id: 'pl_hollowed',    name: 'Hollowed Puzzle Scholar',   hp: 22, atk: 8,  def: 4,  xp: 10, gold: 5  },
    { id: 'pl_sentinel',    name: 'Stone Sentinel',            hp: 32, atk: 7,  def: 7,  xp: 12, gold: 4  },
    { id: 'pl_mimic',       name: 'Tile Mimic',                hp: 26, atk: 10, def: 3,  xp: 11, gold: 5  },
    { id: 'pl_maddened',    name: 'Maddened Maze Runner',      hp: 20, atk: 9,  def: 2,  xp: 9,  gold: 4  },
  ],
  mid: [
    { id: 'pl_construct',   name: 'Rune Construct',            hp: 85, atk: 15, def: 14, xp: 35, gold: 15 },
    { id: 'pl_warden',      name: 'Hollowed Labyrinth Warden', hp: 70, atk: 18, def: 10, xp: 32, gold: 14 },
    { id: 'pl_gatekeeper',  name: 'Stone Gatekeeper',          hp: 90, atk: 14, def: 16, xp: 34, gold: 15 },
    { id: 'pl_crazed',      name: 'Maddened Puzzle Architect', hp: 55, atk: 22, def: 6,  xp: 28, gold: 12 },
  ],
  deep: [
    { id: 'pl_colossus',    name: 'Rune Colossus',             hp: 160, atk: 24, def: 22, xp: 65, gold: 34 },
    { id: 'pl_weaver',      name: 'Hollowed Logic Weaver',     hp: 120, atk: 30, def: 14, xp: 58, gold: 29 },
    { id: 'pl_obelisk',     name: 'Sentient Obelisk',          hp: 140, atk: 26, def: 20, xp: 62, gold: 32 },
  ],
  boss: [
    { id: 'pl_architect',   name: 'The Architect of Madness',  hp: 460, atk: 38, def: 28, xp: 235, gold: 125 },
  ],
};

// --- 14. celestial_spire ---
// Wild category: a fragment of the divine realm pulled into the rift. Once-radiant halls
// now corrupted. The angels that guarded it have become hollowed — their light turned to
// madness, their halos cracked, their hymns turned to screams.
// Biomes: Holy Dominion (8), Elven South (16)
// Layout: TEMPLE_HALLS — grand celestial corridors, radiant inner sanctum, choir chambers
ENEMY_POOLS.celestial_spire = {
  shallow: [
    { id: 'cs_hollowed',    name: 'Hollowed Fallen Angel',       hp: 28, atk: 10, def: 5,  xp: 12, gold: 6  },
    { id: 'cs_wraith',      name: 'Light Wraith',                hp: 22, atk: 11, def: 3,  xp: 11, gold: 5  },
    { id: 'cs_construct',   name: 'Radiant Construct',           hp: 34, atk: 8,  def: 7,  xp: 13, gold: 5  },
    { id: 'cs_maddened',    name: 'Maddened Celestial Guardian',  hp: 26, atk: 9,  def: 4,  xp: 10, gold: 5  },
  ],
  mid: [
    { id: 'cs_seraph',      name: 'Corrupted Seraph',            hp: 80, atk: 20, def: 12, xp: 38, gold: 18 },
    { id: 'cs_sentinel',    name: 'Hollowed Celestial Sentinel', hp: 90, atk: 16, def: 16, xp: 36, gold: 16 },
    { id: 'cs_chorister',   name: 'Maddened Hymn Chorister',     hp: 55, atk: 24, def: 6,  xp: 32, gold: 14 },
    { id: 'cs_paladin',     name: 'Fallen Paladin',              hp: 75, atk: 18, def: 13, xp: 34, gold: 15 },
  ],
  deep: [
    { id: 'cs_archangel',   name: 'Hollowed Archangel',          hp: 150, atk: 30, def: 20, xp: 68, gold: 36 },
    { id: 'cs_throne',      name: 'Shattered Throne Guardian',   hp: 140, atk: 28, def: 22, xp: 65, gold: 34 },
    { id: 'cs_radiant',     name: 'Maddened Radiant Devourer',   hp: 125, atk: 34, def: 14, xp: 60, gold: 30 },
  ],
  boss: [
    { id: 'cs_solanthis',   name: 'Archangel Solanthis the Shattered', hp: 520, atk: 44, def: 32, xp: 270, gold: 155 },
  ],
};

// --- 15. infernal_pit ---
// Wild category: a pocket of the abyss swallowed by the rift. Brimstone, lava rivers,
// chains hanging from impossible heights. The demons here are trapped too — and they
// are furious about it. Thematically similar to lava_rift but with demonic enemies.
// Biomes: Scorched Sands (3), Wastes (12), Mountain (2)
// Layout: OPEN_CAVERN — vast brimstone caverns with chain-bridges and lava pools
ENEMY_POOLS.infernal_pit = {
  shallow: [
    { id: 'ip_hollowed',    name: 'Hollowed Damned Soul',        hp: 24, atk: 9,  def: 3,  xp: 10, gold: 4  },
    { id: 'ip_imp',         name: 'Pit Imp',                     hp: 18, atk: 10, def: 2,  xp: 9,  gold: 5  },
    { id: 'ip_hound',       name: 'Hellhound',                   hp: 30, atk: 8,  def: 5,  xp: 12, gold: 5  },
    { id: 'ip_maddened',    name: 'Maddened Devil-Touched',      hp: 22, atk: 9,  def: 3,  xp: 10, gold: 4  },
  ],
  mid: [
    { id: 'ip_succubus',    name: 'Succubus Temptress',          hp: 60, atk: 24, def: 7,  xp: 34, gold: 16 },
    { id: 'ip_chain',       name: 'Chain Demon',                 hp: 85, atk: 17, def: 14, xp: 36, gold: 16 },
    { id: 'ip_hollowed_m',  name: 'Hollowed Infernal Cultist',   hp: 70, atk: 20, def: 10, xp: 32, gold: 14 },
    { id: 'ip_incubus',     name: 'Incubus Deceiver',            hp: 55, atk: 22, def: 8,  xp: 30, gold: 14 },
  ],
  deep: [
    { id: 'ip_fiend',       name: 'Greater Pit Fiend',           hp: 160, atk: 28, def: 20, xp: 66, gold: 35 },
    { id: 'ip_torturer',    name: 'Hollowed Abyssal Torturer',   hp: 130, atk: 32, def: 16, xp: 60, gold: 30 },
    { id: 'ip_warden',      name: 'Maddened Chain Warden',       hp: 145, atk: 26, def: 22, xp: 64, gold: 33 },
  ],
  boss: [
    { id: 'ip_malachar',    name: 'Pit Lord Malachar the Chained', hp: 510, atk: 44, def: 30, xp: 260, gold: 150 },
  ],
};

// --- 16. dragons_den ---
// Wild category: the lair of an ancient dragon, pulled whole into the rift. Mountains of
// gold, charred bones, egg chambers. The dragon's hoard attracted others who became
// trapped and hollowed. The dragon itself has gone mad from confinement.
// Biomes: Mountain (2), Scorched Sands (3), Frostbound (14)
// Layout: OPEN_CAVERN — massive hoard chamber, egg alcoves, charred tunnels
ENEMY_POOLS.dragons_den = {
  shallow: [
    { id: 'dd_hollowed',    name: 'Hollowed Treasure Hunter',    hp: 24, atk: 8,  def: 3,  xp: 10, gold: 6  },
    { id: 'dd_wyrmling',    name: 'Wyrmling',                    hp: 30, atk: 9,  def: 5,  xp: 12, gold: 5  },
    { id: 'dd_kobold',      name: 'Kobold Servant',              hp: 16, atk: 7,  def: 2,  xp: 8,  gold: 4  },
    { id: 'dd_maddened',    name: 'Maddened Hoard-Cursed',       hp: 22, atk: 10, def: 3,  xp: 10, gold: 5  },
  ],
  mid: [
    { id: 'dd_dragonkin',   name: 'Dragonkin Warrior',           hp: 85, atk: 18, def: 14, xp: 38, gold: 18 },
    { id: 'dd_drake',       name: 'Drake Guard',                 hp: 90, atk: 16, def: 16, xp: 36, gold: 16 },
    { id: 'dd_hollowed_m',  name: 'Hollowed Dragon Cultist',     hp: 65, atk: 22, def: 8,  xp: 32, gold: 14 },
    { id: 'dd_kobold_e',    name: 'Kobold Elite Trapper',        hp: 50, atk: 20, def: 6,  xp: 28, gold: 12 },
  ],
  deep: [
    { id: 'dd_wyvern',      name: 'Rift-Scarred Wyvern',        hp: 160, atk: 28, def: 22, xp: 68, gold: 36 },
    { id: 'dd_guardian',     name: 'Hollowed Hoard Guardian',    hp: 140, atk: 30, def: 18, xp: 64, gold: 33 },
    { id: 'dd_ancient',     name: 'Maddened Elder Dragonkin',    hp: 150, atk: 32, def: 16, xp: 66, gold: 34 },
  ],
  boss: [
    { id: 'dd_vyraxion',    name: 'Vyraxion the Rift-Mad Wyrm', hp: 560, atk: 48, def: 34, xp: 280, gold: 160, abilities: [{ id: 'dragon_claw', name: 'Dragon Claw', damage: 1.8, range: 1, windUp: 2, cooldown: 3, weight: 10 }, { id: 'fire_breath', name: 'Fire Breath', damage: 1.5, range: 3, windUp: 3, cooldown: 6, weight: 8, effect: 'burn', effectChance: 0.6 }, { id: 'tail_sweep', name: 'Tail Sweep', damage: 1.2, range: 2, windUp: 1, cooldown: 4, weight: 7 }], phases: [{ threshold: 0.6, name: 'Rift-Fueled Rage', atkMult: 1.4, abilities: [{ id: 'rift_breath', name: 'Rift Breath', damage: 2.0, range: 4, windUp: 3, cooldown: 5, weight: 12, effect: 'burn', effectChance: 0.7 }, { id: 'dragon_claw', name: 'Dragon Claw', damage: 2.2, range: 1, windUp: 2, cooldown: 3, weight: 10 }], speed: 2 }, { threshold: 0.3, name: 'Rift Madness', atkMult: 1.8, abilities: [{ id: 'annihilate', name: 'Annihilating Breath', damage: 3.0, range: 4, windUp: 4, cooldown: 6, weight: 14, effect: 'burn', effectChance: 0.9 }, { id: 'rift_stomp', name: 'Rift Stomp', damage: 2.0, range: 2, windUp: 2, cooldown: 4, weight: 10, effect: 'stun', effectChance: 0.5 }], detectionRadius: 10 }] },
  ],
};

// --- 17. vampire_castle ---
// A gothic castle where an ancient vampire lord turned the inhabitants.
// Blood fountains, crimson tapestries, coffin rooms.
// Biomes: Holy Dominion (8), Plains (6), Swamp (7)
// Layout: BSP_ROOMS — interconnected castle chambers, coffin rooms, throne hall
ENEMY_POOLS.vampire_castle = {
  shallow: [
    { id: 'vc_thrall',     name: 'Hollowed Thrall',         hp: 22, atk: 8,  def: 3,  xp: 9,  gold: 4  },
    { id: 'vc_spawn',      name: 'Vampire Spawn',           hp: 26, atk: 9,  def: 4,  xp: 11, gold: 5  },
    { id: 'vc_bat',        name: 'Blood Bat',               hp: 16, atk: 7,  def: 2,  xp: 8,  gold: 3  },
    { id: 'vc_gargoyle',   name: 'Stone Gargoyle',          hp: 32, atk: 7,  def: 7,  xp: 12, gold: 5  },
  ],
  mid: [
    { id: 'vc_golem',      name: 'Blood Golem',             hp: 85, atk: 15, def: 14, xp: 35, gold: 15 },
    { id: 'vc_knight',     name: 'Maddened Blood Knight',   hp: 75, atk: 18, def: 11, xp: 33, gold: 14 },
    { id: 'vc_nosferatu',  name: 'Nosferatu Stalker',       hp: 55, atk: 22, def: 6,  xp: 30, gold: 13 },
    { id: 'vc_maddened',   name: 'Maddened Courtier',       hp: 60, atk: 20, def: 8,  xp: 28, gold: 12 },
  ],
  deep: [
    { id: 'vc_elder',      name: 'Elder Vampire',           hp: 140, atk: 28, def: 18, xp: 62, gold: 32 },
    { id: 'vc_bloodlord',  name: 'Hollowed Blood Lord',     hp: 130, atk: 30, def: 16, xp: 58, gold: 30 },
    { id: 'vc_abomination',name: 'Crimson Abomination',     hp: 160, atk: 24, def: 22, xp: 65, gold: 34 },
  ],
  boss: [
    { id: 'vc_count',      name: 'Count Sanguine the Eternal', hp: 480, atk: 42, def: 30, xp: 248, gold: 138 },
  ],
};

// --- 18. lich_sanctum ---
// The laboratory of a lich who achieved immortality but lost sanity over millennia.
// Phylacteries, soul cages, necromantic circles.
// Biomes: Wastes (12), Steppes (4), Holy Dominion (8)
// Layout: TEMPLE_HALLS — long ritual corridors, soul cage alcoves, inner sanctum
ENEMY_POOLS.lich_sanctum = {
  shallow: [
    { id: 'ls_apprentice', name: 'Hollowed Apprentice',     hp: 20, atk: 9,  def: 3,  xp: 10, gold: 5  },
    { id: 'ls_skelmage',   name: 'Skeletal Mage',           hp: 24, atk: 10, def: 4,  xp: 11, gold: 5  },
    { id: 'ls_wraith',     name: 'Soul Wraith',             hp: 18, atk: 11, def: 2,  xp: 10, gold: 5  },
    { id: 'ls_construct',  name: 'Bone Construct',          hp: 30, atk: 7,  def: 6,  xp: 10, gold: 4  },
  ],
  mid: [
    { id: 'ls_necro',      name: 'Maddened Necromancer',    hp: 60, atk: 22, def: 7,  xp: 32, gold: 14 },
    { id: 'ls_revenant',   name: 'Phylactery Revenant',     hp: 80, atk: 16, def: 14, xp: 35, gold: 15 },
    { id: 'ls_specter',    name: 'Caged Soul Specter',      hp: 50, atk: 24, def: 5,  xp: 30, gold: 13 },
  ],
  deep: [
    { id: 'ls_deathknight',name: 'Death Knight',            hp: 150, atk: 28, def: 20, xp: 64, gold: 33 },
    { id: 'ls_demilich',   name: 'Demi-Lich',               hp: 110, atk: 34, def: 12, xp: 58, gold: 30 },
    { id: 'ls_hollowed',   name: 'Hollowed Soul Harvester', hp: 130, atk: 30, def: 16, xp: 60, gold: 31 },
  ],
  boss: [
    { id: 'ls_archlich', name: 'Archlich Veranthos', hp: 500, atk: 44, def: 30, xp: 258, gold: 148,
      isRaidBoss: true,
      abilities: [
        { id: 'soul_drain', name: 'Soul Drain', damage: 1.5, range: 3, windUp: 2, cooldown: 4, weight: 10, effect: 'slow', effectChance: 0.4 },
        { id: 'death_coil', name: 'Death Coil', damage: 2.0, range: 4, windUp: 3, cooldown: 6, weight: 8 },
        { id: 'raise_dead', name: 'Raise Dead', heals: true, healAmount: 40, range: 0, windUp: 4, cooldown: 10, weight: 5 },
        { id: 'necrotic_burst', name: 'Necrotic Burst', damage: 1.8, range: 3, windUp: 2, cooldown: 4, weight: 12, effect: 'bleed', effectChance: 0.5 },
        { id: 'death_storm', name: 'Death Storm', damage: 2.5, range: 4, windUp: 3, cooldown: 5, weight: 14, effect: 'doom', effectChance: 0.4 },
        { id: 'soul_harvest', name: 'Soul Harvest', damage: 1.5, range: 2, windUp: 2, cooldown: 4, weight: 10, effect: 'slow', effectChance: 0.7 },
      ],
      phases: [
        { threshold: 0.7, name: 'Awakening', atkMult: 1.0, speed: 1,
          abilities: ['soul_drain', 'death_coil', 'raise_dead'],
          addsPerCycle: 2, addType: 'skeleton',
          description: 'The Archlich stirs, summoning skeletal guardians.' },
        { threshold: 0.4, name: 'Phylactery Shield', atkMult: 1.3, speed: 2,
          abilities: ['soul_drain', 'necrotic_burst'],
          bossImmune: true, phylacteryCount: 4,
          description: 'Phylacteries shield the Archlich. Destroy them!' },
        { threshold: 0.15, name: 'Necrotic Storm', atkMult: 1.5, speed: 2,
          abilities: ['death_coil', 'necrotic_burst', 'soul_harvest'],
          addsPerParty: 1, hasCorruptionZones: true, deathCoilMult: 2.0,
          description: 'Necrotic energy saturates the chamber. Avoid the corruption zones!' },
        { threshold: 0.0, name: 'Undeath Unbound', atkMult: 1.7, speed: 3,
          abilities: ['death_storm', 'soul_harvest', 'death_coil'],
          enrage: true, soulHarvestAll: true, deathStormMult: 2.5,
          detectionRadius: 9,
          description: 'The Archlich unleashes its full power in a desperate assault!' },
      ],
      // Raid scaling: base stats multiplied by (2 + playerCount * 0.5) for HP, (1.5 + playerCount * 0.05) for ATK
      raidScaling: { hpFormula: '2 + N * 0.5', atkFormula: '1.5 + N * 0.05', defMult: 1.5 },
      loot: [
        { type: 'purification_crystal', count: 3, chance: 1.0 },
        { type: 'dark_crystal', count: 5, chance: 1.0 },
        { type: 'boss_trophy', count: 1, chance: 1.0 },
        { type: 'mana_crystal', count: 10, chance: 0.8 },
      ],
    },
  ],
};

// --- 19. cogwork_foundry ---
// A massive gnomish/dwarven factory gone haywire. Assembly lines still run,
// producing mad automatons. Steam, gears, pistons.
// Biomes: Gnomish Isles (9), Mechspire (10), Clockwork Harbor (11)
// Layout: MAZE — interlocking assembly corridors, steam-vent dead ends
ENEMY_POOLS.cogwork_foundry = {
  shallow: [
    { id: 'cw_worker',     name: 'Hollowed Gnome Worker',   hp: 18, atk: 8,  def: 3,  xp: 9,  gold: 4  },
    { id: 'cw_automaton',  name: 'Rogue Automaton',         hp: 28, atk: 7,  def: 5,  xp: 10, gold: 4  },
    { id: 'cw_steamgolem', name: 'Steam Golem',             hp: 34, atk: 6,  def: 7,  xp: 12, gold: 5  },
    { id: 'cw_spider',     name: 'Gear Spider',             hp: 20, atk: 9,  def: 3,  xp: 9,  gold: 4  },
  ],
  mid: [
    { id: 'cw_engineer',   name: 'Maddened Dwarf Engineer', hp: 70, atk: 18, def: 10, xp: 34, gold: 15 },
    { id: 'cw_sentinel',   name: 'Foundry Sentinel',        hp: 85, atk: 15, def: 15, xp: 36, gold: 16 },
    { id: 'cw_overcharge', name: 'Overcharged Drone',       hp: 50, atk: 24, def: 5,  xp: 30, gold: 13 },
    { id: 'cw_maddened',   name: 'Maddened Gnome Foreman',  hp: 55, atk: 20, def: 8,  xp: 28, gold: 12 },
  ],
  deep: [
    { id: 'cw_siege',      name: 'Siege Automaton',         hp: 170, atk: 24, def: 24, xp: 68, gold: 35 },
    { id: 'cw_titan',      name: 'Foundry Titan',           hp: 140, atk: 28, def: 18, xp: 62, gold: 32 },
    { id: 'cw_hollowed',   name: 'Hollowed Master Smith',   hp: 115, atk: 32, def: 14, xp: 58, gold: 29 },
  ],
  boss: [
    { id: 'cw_engine',     name: 'The Overclocked Engine',  hp: 510, atk: 42, def: 32, xp: 255, gold: 145 },
  ],
};

// --- 20. astral_rift ---
// A tear in reality leading to the space between worlds. Floating platforms
// in void, crystallized thoughts, reality-warping corridors.
// Biomes: Wastes (12), Southern Wastes (15)
// Layout: ISLAND — scattered reality fragments connected by void bridges
ENEMY_POOLS.astral_rift = {
  shallow: [
    { id: 'at_traveler',   name: 'Hollowed Lost Traveler',  hp: 20, atk: 9,  def: 3,  xp: 10, gold: 5  },
    { id: 'at_devourer',   name: 'Thought Devourer',        hp: 22, atk: 10, def: 3,  xp: 11, gold: 5  },
    { id: 'at_shard',      name: 'Reality Shard',           hp: 26, atk: 8,  def: 6,  xp: 10, gold: 4  },
    { id: 'at_parasite',   name: 'Astral Parasite',         hp: 16, atk: 11, def: 1,  xp: 9,  gold: 4  },
  ],
  mid: [
    { id: 'at_walker',     name: 'Void Walker',             hp: 65, atk: 20, def: 9,  xp: 32, gold: 14 },
    { id: 'at_warp',       name: 'Reality Warper',          hp: 55, atk: 24, def: 6,  xp: 31, gold: 14 },
    { id: 'at_maddened',   name: 'Maddened Planeswalker',   hp: 70, atk: 18, def: 11, xp: 34, gold: 15 },
  ],
  deep: [
    { id: 'at_titan',      name: 'Astral Titan',            hp: 150, atk: 28, def: 20, xp: 64, gold: 33 },
    { id: 'at_horror',     name: 'Void Horror',             hp: 130, atk: 32, def: 14, xp: 60, gold: 30 },
    { id: 'at_hollowed',   name: 'Hollowed Rift-Bound',     hp: 110, atk: 30, def: 16, xp: 56, gold: 28 },
  ],
  boss: [
    { id: 'at_consciousness', name: 'The Rift Consciousness', hp: 490, atk: 44, def: 28, xp: 252, gold: 142 },
  ],
};

// --- 21. hollow_breach (mini-rift) ---
// Secondary rifts — The Soldier's consciousness bleeding through reality.
// The Hollow are rift inhabitants that mimic known race shapes but get the details wrong.
// Used exclusively by mini-rift dungeons (overworld-rifts.js).
ENEMY_POOLS.hollow_breach = {
  shallow: [
    { id: 'hb_mimicry',    name: 'Hollow Mimicry',          hp: 18, atk: 8,  def: 3,  xp: 9,  gold: 4, isLiving: false, element: 'shadow' },
    { id: 'hb_parasite',   name: 'Void Parasite',           hp: 22, atk: 10, def: 2,  xp: 10, gold: 4, isLiving: false, element: 'shadow' },
    { id: 'hb_shard',      name: 'Fractured Shard',         hp: 28, atk: 9,  def: 5,  xp: 11, gold: 5, isLiving: false, element: 'arcane' },
    { id: 'hb_walker',     name: 'Hollow Walker',           hp: 30, atk: 12, def: 4,  xp: 12, gold: 5, isLiving: false, element: 'shadow', archetype: 'melee' },
  ],
  mid: [
    { id: 'hb_stealer',    name: 'Shape Stealer',           hp: 55, atk: 20, def: 8,  xp: 30, gold: 14, isLiving: false, element: 'shadow', archetype: 'controller', abilities: [{ name: 'Identity Theft', damage: 12, effect: 'confuse', chance: 0.3 }] },
    { id: 'hb_weaver',     name: 'Void Weaver',             hp: 60, atk: 22, def: 7,  xp: 32, gold: 15, isLiving: false, element: 'shadow', archetype: 'caster', abilities: [{ name: 'Void Thread', damage: 15, effect: 'slow', chance: 0.35 }] },
    { id: 'hb_echo',       name: 'Desperate Echo',          hp: 65, atk: 24, def: 9,  xp: 34, gold: 16, isLiving: false, element: 'arcane', archetype: 'melee' },
    { id: 'hb_messenger',  name: 'Torn Messenger',          hp: 70, atk: 26, def: 10, xp: 36, gold: 16, isLiving: false, element: 'shadow', archetype: 'ranged', abilities: [{ name: 'Desperate Plea', damage: 18, effect: 'fear', chance: 0.25 }] },
  ],
  deep: [
    { id: 'hb_knight',     name: 'Hollow Knight',           hp: 130, atk: 30, def: 16, xp: 58, gold: 30, isLiving: false, element: 'shadow', archetype: 'melee', abilities: [{ name: 'Void Slash', damage: 22, effect: 'bleed', chance: 0.4 }] },
    { id: 'hb_horror',     name: 'Void Horror',             hp: 140, atk: 32, def: 14, xp: 62, gold: 32, isLiving: false, element: 'shadow', archetype: 'controller', abilities: [{ name: 'Reality Warp', damage: 20, effect: 'confuse', chance: 0.45 }] },
    { id: 'hb_eater',      name: 'Reality Eater',           hp: 150, atk: 34, def: 15, xp: 66, gold: 34, isLiving: false, element: 'arcane', archetype: 'caster', abilities: [{ name: 'Consume Reality', damage: 25, effect: 'drain', chance: 0.35 }] },
  ],
  boss: [
    {
      id: 'hb_anchor',
      name: 'The Rift Anchor',
      hp: 400, atk: 38, def: 24, xp: 220, gold: 130,
      isLiving: false, element: 'shadow', archetype: 'boss',
      phases: [
        { name: 'Unstable', hpThreshold: 1.0, atkMult: 1.0, defMult: 1.0 },
        { name: 'Fracturing', hpThreshold: 0.5, atkMult: 1.3, defMult: 0.9 },
        { name: 'Final Scream', hpThreshold: 0.2, atkMult: 1.6, defMult: 0.7 },
      ],
      abilities: [
        { name: 'Void Pulse', damage: 20, effect: 'knockback', chance: 0.4, cooldown: 2 },
        { name: 'Reality Shatter', damage: 30, effect: 'confuse', chance: 0.3, cooldown: 3 },
        { name: 'Summon Hollow', damage: 0, effect: 'summon', chance: 0.25, cooldown: 4, summonId: 'hb_mimicry', summonCount: 2 },
        { name: 'Desperation Wave', damage: 35, effect: 'fear', chance: 0.2, cooldown: 5 },
      ],
      drops: ['purification_crystal', 'dark_crystal', 'mana_crystal'],
    },
  ],
};

// --- 22. dinosaur_jungle ---
// A primeval jungle preserved deep underground where prehistoric beasts
// never went extinct. The rift pulled an ancient era into its walls.
// Biomes: Forest (5), Swamp (7), Elven South (16)
// Layout: ORGANIC — natural cavern shapes, overgrown with primeval flora
ENEMY_POOLS.dinosaur_jungle = {
  shallow: [
    { id: 'dj_hunter',     name: 'Hollowed Tribal Hunter',  hp: 24, atk: 8,  def: 3,  xp: 10, gold: 4  },
    { id: 'dj_raptor',     name: 'Raptor',                  hp: 28, atk: 9,  def: 4,  xp: 12, gold: 5  },
    { id: 'dj_insect',     name: 'Giant Jungle Insect',     hp: 20, atk: 7,  def: 5,  xp: 9,  gold: 3  },
    { id: 'dj_crawler',    name: 'Jungle Crawler',          hp: 22, atk: 8,  def: 3,  xp: 9,  gold: 4  },
  ],
  mid: [
    { id: 'dj_tribe',      name: 'Maddened Tribespeople',   hp: 65, atk: 18, def: 10, xp: 32, gold: 14 },
    { id: 'dj_triceratops', name: 'Armored Herbivore',      hp: 90, atk: 14, def: 16, xp: 36, gold: 16 },
    { id: 'dj_terror',     name: 'Terror Bird',             hp: 55, atk: 22, def: 6,  xp: 30, gold: 13 },
  ],
  deep: [
    { id: 'dj_alpha',      name: 'Alpha Raptor Pack',       hp: 140, atk: 28, def: 16, xp: 60, gold: 30 },
    { id: 'dj_sauropod',   name: 'Enraged Sauropod',        hp: 180, atk: 22, def: 24, xp: 68, gold: 36 },
    { id: 'dj_hollowed',   name: 'Hollowed Primal Shaman',  hp: 110, atk: 32, def: 12, xp: 56, gold: 28 },
  ],
  boss: [
    { id: 'dj_rex',        name: 'The Primeval Rex',        hp: 520, atk: 44, def: 32, xp: 260, gold: 150 },
  ],
};

// --- 22. spider_hive ---
// Web-choked tunnels housing a colony of massive spiders. Everything is
// wrapped in silk. Some victims still twitch.
// Biomes: Forest (5), Swamp (7), Mountain (2)
// Layout: ORGANIC — natural web-draped tunnels, silk-wrapped chambers
ENEMY_POOLS.spider_hive = {
  shallow: [
    { id: 'sp_cocooned',   name: 'Hollowed Cocooned Victim', hp: 22, atk: 7,  def: 4,  xp: 9,  gold: 4  },
    { id: 'sp_spinner',    name: 'Web Spinner',              hp: 20, atk: 8,  def: 3,  xp: 9,  gold: 3  },
    { id: 'sp_brood',      name: 'Brood Spider',             hp: 18, atk: 9,  def: 2,  xp: 8,  gold: 3  },
    { id: 'sp_spitter',    name: 'Venom Spitter',            hp: 24, atk: 10, def: 3,  xp: 11, gold: 5  },
  ],
  mid: [
    { id: 'sp_bonded',     name: 'Maddened Spider-Bonded',  hp: 65, atk: 20, def: 8,  xp: 32, gold: 14 },
    { id: 'sp_lurker',     name: 'Silk Lurker',             hp: 70, atk: 18, def: 11, xp: 34, gold: 15 },
    { id: 'sp_huntsman',   name: 'Giant Huntsman',          hp: 80, atk: 16, def: 13, xp: 35, gold: 15 },
  ],
  deep: [
    { id: 'sp_matriarch',  name: 'Hive Matriarch',          hp: 140, atk: 28, def: 18, xp: 62, gold: 32 },
    { id: 'sp_weaver',     name: 'Phase Weaver',            hp: 110, atk: 32, def: 12, xp: 56, gold: 28 },
    { id: 'sp_hollowed',   name: 'Hollowed Arachnid Host',  hp: 130, atk: 26, def: 20, xp: 60, gold: 30 },
  ],
  boss: [
    { id: 'sp_broodmother', name: 'The Broodmother',        hp: 470, atk: 40, def: 28, xp: 242, gold: 132, abilities: [{ id: 'fang_strike', name: 'Venomous Fang', damage: 1.6, range: 1, windUp: 2, cooldown: 3, weight: 10, effect: 'poison', effectChance: 0.5 }, { id: 'web_shot', name: 'Web Shot', damage: 0.8, range: 4, windUp: 2, cooldown: 5, weight: 8, effect: 'root', effectChance: 0.6 }, { id: 'spawn_brood', name: 'Spawn Broodlings', damage: 0.0, range: 0, windUp: 4, cooldown: 10, weight: 5 }], phases: [{ threshold: 0.6, name: 'Brood Frenzy', atkMult: 1.3, abilities: [{ id: 'frenzy_bite', name: 'Frenzy Bite', damage: 2.0, range: 1, windUp: 1, cooldown: 3, weight: 12, effect: 'poison', effectChance: 0.6 }, { id: 'web_barrage', name: 'Web Barrage', damage: 1.0, range: 3, windUp: 2, cooldown: 4, weight: 10, effect: 'root', effectChance: 0.5 }], speed: 2 }, { threshold: 0.3, name: 'Death Throes', atkMult: 1.7, abilities: [{ id: 'venom_nova', name: 'Venom Nova', damage: 2.0, range: 3, windUp: 3, cooldown: 5, weight: 14, effect: 'poison', effectChance: 0.8 }, { id: 'desperate_fang', name: 'Desperate Fang', damage: 2.5, range: 1, windUp: 1, cooldown: 3, weight: 10 }], detectionRadius: 9 }] },
  ],
};

// --- 23. sunken_depths ---
// Completely submerged floors. Bioluminescent kelp forests, drowned ruins.
// Lizard Folk can freely explore; others need rafts or swimming mounts.
// Biomes: Water (0), Beach (13)
// Layout: LAKE — vast flooded chambers, kelp forests, submerged platforms
ENEMY_POOLS.sunken_depths = {
  shallow: [
    { id: 'sd_sailor',     name: 'Hollowed Drowned Sailor', hp: 22, atk: 8,  def: 3,  xp: 9,  gold: 4  },
    { id: 'sd_fish',       name: 'Deep Sea Anglerfish',     hp: 20, atk: 9,  def: 3,  xp: 10, gold: 4  },
    { id: 'sd_jelly',      name: 'Giant Jellyfish',         hp: 18, atk: 10, def: 2,  xp: 9,  gold: 4  },
    { id: 'sd_krakenspawn',name: 'Kraken Spawn',            hp: 28, atk: 7,  def: 5,  xp: 11, gold: 5  },
  ],
  mid: [
    { id: 'sd_merfolk',    name: 'Maddened Merfolk',        hp: 65, atk: 20, def: 9,  xp: 32, gold: 14 },
    { id: 'sd_serpent',    name: 'Brine Serpent',           hp: 75, atk: 18, def: 12, xp: 34, gold: 15 },
    { id: 'sd_golem',      name: 'Coral Golem',             hp: 85, atk: 14, def: 16, xp: 35, gold: 15 },
  ],
  deep: [
    { id: 'sd_horror',     name: 'Abyssal Horror',          hp: 140, atk: 28, def: 18, xp: 62, gold: 32 },
    { id: 'sd_kraken',     name: 'Juvenile Kraken',         hp: 160, atk: 26, def: 22, xp: 66, gold: 34 },
    { id: 'sd_hollowed',   name: 'Hollowed Depth Warden',   hp: 120, atk: 30, def: 14, xp: 58, gold: 30 },
  ],
  boss: [
    { id: 'sd_leviathan',  name: 'The Abyssal Leviathan',   hp: 510, atk: 42, def: 32, xp: 258, gold: 148 },
  ],
};

// --- 24. abyssal_dark ---
// Floors consumed by absolute darkness. No natural light penetrates.
// Only darkvision races (Dwarf, Goblin, Cat Folk) can see beyond their tile.
// Biomes: Mountain (2), Wastes (12), Steppes (4)
// Layout: MAZE — pitch-dark winding passages, no landmarks
ENEMY_POOLS.abyssal_dark = {
  shallow: [
    { id: 'ad_blind',      name: 'Hollowed Blind One',      hp: 24, atk: 8,  def: 4,  xp: 10, gold: 4  },
    { id: 'ad_elemental',  name: 'Darkness Elemental',      hp: 20, atk: 10, def: 3,  xp: 10, gold: 5  },
    { id: 'ad_crawler',    name: 'Shadow Crawler',          hp: 18, atk: 9,  def: 2,  xp: 9,  gold: 4  },
    { id: 'ad_stalker',    name: 'Eyeless Stalker',         hp: 26, atk: 8,  def: 5,  xp: 11, gold: 4  },
  ],
  mid: [
    { id: 'ad_dweller',    name: 'Maddened Dark-Dweller',   hp: 70, atk: 18, def: 11, xp: 34, gold: 15 },
    { id: 'ad_feeder',     name: 'Gloom Feeder',            hp: 60, atk: 22, def: 7,  xp: 30, gold: 13 },
    { id: 'ad_lurker',     name: 'Abyss Lurker',            hp: 80, atk: 16, def: 14, xp: 35, gold: 15 },
  ],
  deep: [
    { id: 'ad_horror',     name: 'Lightless Horror',        hp: 140, atk: 28, def: 18, xp: 62, gold: 32 },
    { id: 'ad_void',       name: 'Void Incarnate',          hp: 120, atk: 32, def: 14, xp: 58, gold: 30 },
    { id: 'ad_hollowed',   name: 'Hollowed Abyss-Touched',  hp: 130, atk: 26, def: 20, xp: 60, gold: 30 },
  ],
  boss: [
    { id: 'ad_thing',      name: 'The Thing That Sees Without Eyes', hp: 480, atk: 40, def: 30, xp: 245, gold: 135 },
  ],
};

// --- 25. werewolf_den ---
// A pack of lycanthropes have hollowed out a den deep within.
// Claw marks on every wall. The howling never stops.
// Biomes: Forest (5), Plains (6), Steppes (4)
// Layout: ORGANIC — rough-hewn natural den, tunnels, central pack grounds
ENEMY_POOLS.werewolf_den = {
  shallow: [
    { id: 'wd_victim',     name: 'Hollowed Half-Turned Victim', hp: 22, atk: 8,  def: 3,  xp: 9,  gold: 4  },
    { id: 'wd_direwolf',   name: 'Dire Wolf',               hp: 28, atk: 9,  def: 4,  xp: 11, gold: 4  },
    { id: 'wd_pup',        name: 'Wolf Pup',                hp: 14, atk: 6,  def: 2,  xp: 7,  gold: 3  },
    { id: 'wd_scout',      name: 'Pack Scout',              hp: 24, atk: 10, def: 3,  xp: 10, gold: 5  },
  ],
  mid: [
    { id: 'wd_lycan',      name: 'Maddened Lycanthrope',    hp: 80, atk: 18, def: 11, xp: 35, gold: 15 },
    { id: 'wd_howler',     name: 'Howling Ravager',         hp: 65, atk: 22, def: 8,  xp: 32, gold: 14 },
    { id: 'wd_packleader', name: 'Pack Leader',             hp: 75, atk: 16, def: 13, xp: 34, gold: 15 },
  ],
  deep: [
    { id: 'wd_alpha_wolf', name: 'Alpha Dire Wolf',         hp: 150, atk: 26, def: 20, xp: 64, gold: 33 },
    { id: 'wd_berserker',  name: 'Maddened Lycan Berserker', hp: 130, atk: 30, def: 16, xp: 60, gold: 30 },
    { id: 'wd_hollowed',   name: 'Hollowed Moon-Cursed',    hp: 140, atk: 28, def: 18, xp: 62, gold: 32 },
  ],
  boss: [
    { id: 'wd_fenris',     name: 'Alpha Fenris the Moonbound', hp: 475, atk: 42, def: 28, xp: 248, gold: 136 },
  ],
};

// --- 26. troll_caves ---
// Crude cave dwellings of massive trolls. Bones piled high, crude clubs
// strewn about. The trolls regenerate — you must kill them fast.
// Biomes: Mountain (2), Forest (5), Steppes (4)
// Layout: OPEN_CAVERN — wide rough-cut troll dens, bone piles, crude shelters
ENEMY_POOLS.troll_caves = {
  shallow: [
    { id: 'tc_food',       name: 'Hollowed Troll Food',     hp: 18, atk: 6,  def: 2,  xp: 8,  gold: 3  },
    { id: 'tc_young',      name: 'Young Troll',             hp: 30, atk: 9,  def: 5,  xp: 12, gold: 5  },
    { id: 'tc_cave',       name: 'Cave Troll Runt',         hp: 26, atk: 8,  def: 4,  xp: 10, gold: 4  },
  ],
  mid: [
    { id: 'tc_troll',      name: 'Cave Troll',              hp: 90, atk: 16, def: 14, xp: 36, gold: 16 },
    { id: 'tc_rock',       name: 'Rock Troll',              hp: 85, atk: 14, def: 16, xp: 35, gold: 15 },
    { id: 'tc_shaman',     name: 'Maddened Troll Shaman',   hp: 60, atk: 22, def: 7,  xp: 30, gold: 13 },
    { id: 'tc_maddened',   name: 'Maddened Troll Brute',    hp: 80, atk: 18, def: 12, xp: 34, gold: 15 },
  ],
  deep: [
    { id: 'tc_elder',      name: 'Elder Mountain Troll',    hp: 170, atk: 24, def: 24, xp: 68, gold: 36 },
    { id: 'tc_warlord',    name: 'Troll Warlord',           hp: 150, atk: 28, def: 18, xp: 62, gold: 32 },
    { id: 'tc_hollowed',   name: 'Hollowed Troll Champion', hp: 140, atk: 26, def: 20, xp: 60, gold: 30 },
  ],
  boss: [
    { id: 'tc_grothak',    name: 'Grothak the Regenerating', hp: 500, atk: 40, def: 30, xp: 255, gold: 145 },
  ],
};

// --- 27. ruined_village ---
// An entire surface village was pulled into the rift. Buildings half-swallowed
// by stone, the villagers hollowed by exposure. A grotesque parody of normal life.
// Biomes: Plains (6), Holy Dominion (8), Forest (5)
// Layout: BSP_ROOMS — half-buried buildings, collapsed streets, ruined square
ENEMY_POOLS.ruined_village = {
  shallow: [
    { id: 'rv_villager',   name: 'Hollowed Villager',       hp: 20, atk: 7,  def: 3,  xp: 9,  gold: 4  },
    { id: 'rv_merchant',   name: 'Maddened Merchant',       hp: 22, atk: 8,  def: 3,  xp: 9,  gold: 5  },
    { id: 'rv_livestock',  name: 'Feral Livestock',         hp: 26, atk: 8,  def: 4,  xp: 10, gold: 3  },
    { id: 'rv_child',      name: 'Cursed Child (Ghostly)',  hp: 14, atk: 10, def: 1,  xp: 10, gold: 5  },
  ],
  mid: [
    { id: 'rv_guard',      name: 'Maddened Village Guard',  hp: 75, atk: 16, def: 12, xp: 33, gold: 14 },
    { id: 'rv_smith',      name: 'Hollowed Village Smith',  hp: 80, atk: 18, def: 11, xp: 35, gold: 15 },
    { id: 'rv_preacher',   name: 'Maddened Street Preacher', hp: 55, atk: 22, def: 6,  xp: 30, gold: 13 },
  ],
  deep: [
    { id: 'rv_militia',    name: 'Hollowed Militia Captain', hp: 130, atk: 28, def: 18, xp: 60, gold: 30 },
    { id: 'rv_amalgam',    name: 'Village Amalgam',         hp: 160, atk: 24, def: 22, xp: 66, gold: 34 },
    { id: 'rv_maddened',   name: 'Maddened Village Elder',  hp: 110, atk: 32, def: 12, xp: 56, gold: 28 },
  ],
  boss: [
    { id: 'rv_mayor',      name: 'The Hollowed Mayor',      hp: 460, atk: 38, def: 26, xp: 235, gold: 128 },
  ],
};

// ---------------------------------------------------------------------------
// Invisible enemy definitions — enemies with invisibility types
// Added to existing theme pools in mid/deep tiers (appear floors 3+)
// Types: 'natural', 'magical', 'spectral', 'ambush'
// ---------------------------------------------------------------------------

// --- NATURAL INVISIBILITY (5 enemies) ---
// shadow_stalker — shadow_realm mid+deep (shadow predator blending with darkness)
ENEMY_POOLS.shadow_realm.mid.push(
  { id: 'inv_shadow_stalker', name: 'Shadow Stalker',   hp: 70,  atk: 24, def: 8,  xp: 38, gold: 18, invisibility: 'natural', archetype: 'skirmisher' }
);
ENEMY_POOLS.shadow_realm.deep.push(
  { id: 'inv_shadow_stalker_d', name: 'Shadow Stalker', hp: 130, atk: 34, def: 14, xp: 62, gold: 34, invisibility: 'natural', archetype: 'skirmisher' }
);

// chameleon_lurker — fungal_forest + overgrown_temple mid (color-shifting reptilian ambusher)
ENEMY_POOLS.fungal_forest.mid.push(
  { id: 'inv_chameleon_lurker', name: 'Chameleon Lurker', hp: 65, atk: 20, def: 7, xp: 34, gold: 15, invisibility: 'natural', archetype: 'skirmisher' }
);
ENEMY_POOLS.overgrown_temple.mid.push(
  { id: 'inv_chameleon_lurker_ot', name: 'Chameleon Lurker', hp: 65, atk: 20, def: 7, xp: 34, gold: 15, invisibility: 'natural', archetype: 'skirmisher' }
);

// cave_crawler_invisible — crystal_cavern deep (translucent cave spider)
ENEMY_POOLS.crystal_cavern.deep.push(
  { id: 'inv_cave_crawler_invis', name: 'Translucent Cave Spider', hp: 120, atk: 30, def: 12, xp: 58, gold: 28, invisibility: 'natural', archetype: 'skirmisher' }
);

// dust_phantom — sand_tomb mid+deep (creature made of floating dust particles)
ENEMY_POOLS.sand_tomb.mid.push(
  { id: 'inv_dust_phantom', name: 'Dust Phantom', hp: 55, atk: 22, def: 6, xp: 32, gold: 14, invisibility: 'natural', archetype: 'skirmisher' }
);
ENEMY_POOLS.sand_tomb.deep.push(
  { id: 'inv_dust_phantom_d', name: 'Dust Phantom', hp: 115, atk: 32, def: 12, xp: 58, gold: 30, invisibility: 'natural', archetype: 'skirmisher' }
);

// wind_wraith — frozen_depths deep (invisible air elemental)
ENEMY_POOLS.frozen_depths.deep.push(
  { id: 'inv_wind_wraith', name: 'Wind Wraith', hp: 105, atk: 28, def: 10, xp: 56, gold: 28, invisibility: 'natural', archetype: 'ranged', isLiving: false,
    abilities: [{ id: 'gale_slash', name: 'Gale Slash', damage: 1.3, range: 3, windUp: 2, cooldown: 3, weight: 10 }] }
);

// --- MAGICAL INVISIBILITY (5 enemies) ---
// arcane_stalker — ancient_library fallback (sand_tomb) mid, mirage_palace mid (mage maintaining invisibility spell)
ENEMY_POOLS.sand_tomb.mid.push(
  { id: 'inv_arcane_stalker', name: 'Arcane Stalker', hp: 60, atk: 24, def: 6, xp: 36, gold: 16, invisibility: 'magical', archetype: 'ranged',
    abilities: [{ id: 'arcane_bolt', name: 'Arcane Bolt', damage: 1.2, range: 4, windUp: 2, cooldown: 3, weight: 10 }] }
);
ENEMY_POOLS.mirage_palace.mid.push(
  { id: 'inv_arcane_stalker_mp', name: 'Arcane Stalker', hp: 60, atk: 24, def: 6, xp: 36, gold: 16, invisibility: 'magical', archetype: 'ranged',
    abilities: [{ id: 'arcane_bolt', name: 'Arcane Bolt', damage: 1.2, range: 4, windUp: 2, cooldown: 3, weight: 10 }] }
);

// void_lurker — void_debris fallback (shadow_realm) deep, astral_rift deep (entity hidden by void magic)
ENEMY_POOLS.shadow_realm.deep.push(
  { id: 'inv_void_lurker', name: 'Void Lurker', hp: 140, atk: 36, def: 16, xp: 68, gold: 36, invisibility: 'magical', archetype: 'controller', isLiving: false,
    abilities: [{ id: 'void_grasp', name: 'Void Grasp', damage: 1.4, range: 2, windUp: 2, cooldown: 4, weight: 10, effect: 'slow', effectChance: 0.4 }] }
);
ENEMY_POOLS.astral_rift.deep.push(
  { id: 'inv_void_lurker_ar', name: 'Void Lurker', hp: 140, atk: 36, def: 16, xp: 68, gold: 36, invisibility: 'magical', archetype: 'controller', isLiving: false,
    abilities: [{ id: 'void_grasp', name: 'Void Grasp', damage: 1.4, range: 2, windUp: 2, cooldown: 4, weight: 10, effect: 'slow', effectChance: 0.4 }] }
);

// phantom_assassin — shadow_realm mid, goblin_warrens mid (magically cloaked assassin)
ENEMY_POOLS.shadow_realm.mid.push(
  { id: 'inv_phantom_assassin', name: 'Phantom Assassin', hp: 55, atk: 26, def: 5, xp: 36, gold: 16, invisibility: 'magical', archetype: 'skirmisher' }
);
ENEMY_POOLS.goblin_warrens.mid.push(
  { id: 'inv_phantom_assassin_gw', name: 'Phantom Assassin', hp: 55, atk: 26, def: 5, xp: 36, gold: 16, invisibility: 'magical', archetype: 'skirmisher' }
);

// invisible_guardian — sand_tomb deep, elven_reliquary deep (ancient ward made invisible by enchantment)
ENEMY_POOLS.sand_tomb.deep.push(
  { id: 'inv_invisible_guardian', name: 'Invisible Guardian', hp: 160, atk: 26, def: 22, xp: 66, gold: 34, invisibility: 'magical', archetype: 'bruiser', isLiving: false }
);
ENEMY_POOLS.elven_reliquary.deep.push(
  { id: 'inv_invisible_guardian_er', name: 'Invisible Guardian', hp: 160, atk: 26, def: 22, xp: 66, gold: 34, invisibility: 'magical', archetype: 'bruiser', isLiving: false }
);

// fey_trickster — fungal_forest mid, elven_reliquary mid (faerie using glamour magic)
ENEMY_POOLS.fungal_forest.mid.push(
  { id: 'inv_fey_trickster', name: 'Fey Trickster', hp: 45, atk: 20, def: 5, xp: 30, gold: 14, invisibility: 'magical', archetype: 'controller',
    abilities: [{ id: 'glamour_bolt', name: 'Glamour Bolt', damage: 1.0, range: 3, windUp: 2, cooldown: 4, weight: 10, effect: 'confusion', effectChance: 0.3 }] }
);
ENEMY_POOLS.elven_reliquary.mid.push(
  { id: 'inv_fey_trickster_er', name: 'Fey Trickster', hp: 45, atk: 20, def: 5, xp: 30, gold: 14, invisibility: 'magical', archetype: 'controller',
    abilities: [{ id: 'glamour_bolt', name: 'Glamour Bolt', damage: 1.0, range: 3, windUp: 2, cooldown: 4, weight: 10, effect: 'confusion', effectChance: 0.3 }] }
);

// --- SPECTRAL / ETHEREAL (4 enemies) ---
// wraith_shade — bone_yard deep, haunted_manor deep (partially phased out spirit)
ENEMY_POOLS.bone_yard.deep.push(
  { id: 'inv_wraith_shade', name: 'Wraith Shade', hp: 100, atk: 32, def: 10, xp: 58, gold: 28, invisibility: 'spectral', archetype: 'skirmisher', isLiving: false }
);
ENEMY_POOLS.haunted_manor.deep.push(
  { id: 'inv_wraith_shade_hm', name: 'Wraith Shade', hp: 100, atk: 32, def: 10, xp: 58, gold: 28, invisibility: 'spectral', archetype: 'skirmisher', isLiving: false }
);

// ethereal_watcher — haunted_manor mid, sand_tomb mid (ghost sentry)
ENEMY_POOLS.haunted_manor.mid.push(
  { id: 'inv_ethereal_watcher', name: 'Ethereal Watcher', hp: 50, atk: 22, def: 6, xp: 32, gold: 14, invisibility: 'spectral', archetype: 'ranged', isLiving: false,
    abilities: [{ id: 'spectral_gaze', name: 'Spectral Gaze', damage: 1.1, range: 4, windUp: 2, cooldown: 3, weight: 10, effect: 'fear', effectChance: 0.2 }] }
);
ENEMY_POOLS.sand_tomb.mid.push(
  { id: 'inv_ethereal_watcher_st', name: 'Ethereal Watcher', hp: 50, atk: 22, def: 6, xp: 32, gold: 14, invisibility: 'spectral', archetype: 'ranged', isLiving: false,
    abilities: [{ id: 'spectral_gaze', name: 'Spectral Gaze', damage: 1.1, range: 4, windUp: 2, cooldown: 3, weight: 10, effect: 'fear', effectChance: 0.2 }] }
);

// phase_spider — shadow_realm deep, astral_rift deep (spider that exists between planes)
ENEMY_POOLS.shadow_realm.deep.push(
  { id: 'inv_phase_spider', name: 'Phase Spider', hp: 110, atk: 30, def: 12, xp: 56, gold: 28, invisibility: 'spectral', archetype: 'skirmisher', isLiving: false }
);
ENEMY_POOLS.astral_rift.deep.push(
  { id: 'inv_phase_spider_ar', name: 'Phase Spider', hp: 110, atk: 30, def: 12, xp: 56, gold: 28, invisibility: 'spectral', archetype: 'skirmisher', isLiving: false }
);

// banshee_echo — bone_yard mid, shadow_realm mid (echo of a banshee, barely corporeal)
ENEMY_POOLS.bone_yard.mid.push(
  { id: 'inv_banshee_echo', name: 'Banshee Echo', hp: 45, atk: 24, def: 4, xp: 30, gold: 14, invisibility: 'spectral', archetype: 'ranged', isLiving: false,
    abilities: [{ id: 'echo_wail', name: 'Echo Wail', damage: 1.2, range: 3, windUp: 2, cooldown: 4, weight: 10, effect: 'fear', effectChance: 0.35 }] }
);
ENEMY_POOLS.shadow_realm.mid.push(
  { id: 'inv_banshee_echo_sr', name: 'Banshee Echo', hp: 45, atk: 24, def: 4, xp: 30, gold: 14, invisibility: 'spectral', archetype: 'ranged', isLiving: false,
    abilities: [{ id: 'echo_wail', name: 'Echo Wail', damage: 1.2, range: 3, windUp: 2, cooldown: 4, weight: 10, effect: 'fear', effectChance: 0.35 }] }
);

// --- AMBUSH STEALTH (4 enemies) ---
// mimic_chest — added to multiple theme pools deep tier (disguised as a chest)
// stone_keep, crystal_cavern, sand_tomb, bone_yard
ENEMY_POOLS.stone_keep.deep.push(
  { id: 'inv_mimic_chest', name: 'Mimic Chest', hp: 140, atk: 28, def: 18, xp: 60, gold: 40, invisibility: 'ambush', archetype: 'bruiser' }
);
ENEMY_POOLS.crystal_cavern.deep.push(
  { id: 'inv_mimic_chest_cc', name: 'Mimic Chest', hp: 140, atk: 28, def: 18, xp: 60, gold: 40, invisibility: 'ambush', archetype: 'bruiser' }
);
ENEMY_POOLS.sand_tomb.deep.push(
  { id: 'inv_mimic_chest_st', name: 'Mimic Chest', hp: 140, atk: 28, def: 18, xp: 60, gold: 40, invisibility: 'ambush', archetype: 'bruiser' }
);
ENEMY_POOLS.bone_yard.deep.push(
  { id: 'inv_mimic_chest_by', name: 'Mimic Chest', hp: 140, atk: 28, def: 18, xp: 60, gold: 40, invisibility: 'ambush', archetype: 'bruiser' }
);

// trapdoor_spider — crystal_cavern mid, spider_hive mid, fungal_forest mid (hides in floor tiles, springs up)
ENEMY_POOLS.crystal_cavern.mid.push(
  { id: 'inv_trapdoor_spider', name: 'Trapdoor Spider', hp: 60, atk: 20, def: 8, xp: 30, gold: 12, invisibility: 'ambush', archetype: 'skirmisher' }
);
ENEMY_POOLS.spider_hive.mid.push(
  { id: 'inv_trapdoor_spider_sh', name: 'Trapdoor Spider', hp: 60, atk: 20, def: 8, xp: 30, gold: 12, invisibility: 'ambush', archetype: 'skirmisher' }
);
ENEMY_POOLS.fungal_forest.mid.push(
  { id: 'inv_trapdoor_spider_ff', name: 'Trapdoor Spider', hp: 60, atk: 20, def: 8, xp: 30, gold: 12, invisibility: 'ambush', archetype: 'skirmisher' }
);

// sand_lurker — sand_tomb mid+deep (buried in sand/dirt floor)
ENEMY_POOLS.sand_tomb.mid.push(
  { id: 'inv_sand_lurker', name: 'Sand Lurker', hp: 70, atk: 18, def: 10, xp: 32, gold: 14, invisibility: 'ambush', archetype: 'bruiser' }
);
ENEMY_POOLS.sand_tomb.deep.push(
  { id: 'inv_sand_lurker_d', name: 'Sand Lurker', hp: 140, atk: 26, def: 18, xp: 62, gold: 32, invisibility: 'ambush', archetype: 'bruiser' }
);

// ceiling_lurker — stone_keep mid, iron_forge mid, haunted_manor mid (hangs from ceiling above doorways)
ENEMY_POOLS.stone_keep.mid.push(
  { id: 'inv_ceiling_lurker', name: 'Ceiling Lurker', hp: 55, atk: 22, def: 6, xp: 28, gold: 12, invisibility: 'ambush', archetype: 'skirmisher' }
);
ENEMY_POOLS.iron_forge.mid.push(
  { id: 'inv_ceiling_lurker_if', name: 'Ceiling Lurker', hp: 55, atk: 22, def: 6, xp: 28, gold: 12, invisibility: 'ambush', archetype: 'skirmisher' }
);
ENEMY_POOLS.haunted_manor.mid.push(
  { id: 'inv_ceiling_lurker_hm', name: 'Ceiling Lurker', hp: 55, atk: 22, def: 6, xp: 28, gold: 12, invisibility: 'ambush', archetype: 'skirmisher' }
);

// Also add cave floor counts for missing biomes
CAVE_FLOORS_BY_BIOME[12] = { min: 3, max: 6  };  // WASTES
CAVE_FLOORS_BY_BIOME[13] = { min: 2, max: 4  };  // BEACH
CAVE_FLOORS_BY_BIOME[14] = { min: 4, max: 8  };  // FROSTBOUND
CAVE_FLOORS_BY_BIOME[15] = { min: 3, max: 6  };  // SOUTHERN_WASTES
CAVE_FLOORS_BY_BIOME[16] = { min: 3, max: 7  };  // ELVEN_SOUTH

// ---------------------------------------------------------------------------
// Floor layout types
// ---------------------------------------------------------------------------

var FLOOR_LAYOUTS = {
  BSP_ROOMS: 'bsp_rooms',       // Standard rooms + L-corridors (castles, keeps)
  MAZE: 'maze',                 // Recursive backtracker maze (tight, winding)
  LAKE: 'lake',                 // Water-filled with walkway bridges
  OPEN_CAVERN: 'open_cavern',   // 1-2 huge rooms with pillar obstacles
  TEMPLE_HALLS: 'temple_halls', // Long parallel halls with cross-connections
  ARENA: 'arena',               // Large central room + surrounding chambers
  ISLAND: 'island',             // Scattered platforms connected by bridges
  ORGANIC: 'organic',           // Cellular automata natural cave shapes
  RAID_ARENA: 'raid_arena',     // Large central arena + waiting room + barrier + alcoves
  OCEAN_ARENA: 'ocean_arena',   // Ocean leviathan arena — spawn platform + open water + debris
};

// Bind FLOOR_LAYOUTS and ENEMY_POOLS into dungeon-themes for selectLayout/getEnemyPool
dungeonThemes.init({ FLOOR_LAYOUTS: FLOOR_LAYOUTS, ENEMY_POOLS: ENEMY_POOLS });

// ---------------------------------------------------------------------------
// Shared corridor carving utilities (used by multiple layout generators)
// ---------------------------------------------------------------------------

function carveCorridorH(grid, width, height, y, x1, x2) {
  var startX = Math.min(x1, x2);
  var endX = Math.max(x1, x2);
  for (var cx = startX; cx <= endX; cx++) {
    if (y >= 0 && y < height && cx >= 0 && cx < width) {
      if (grid[y][cx] === TILE.WALL) {
        grid[y][cx] = TILE.CORRIDOR;
      }
    }
  }
}

function carveCorridorV(grid, width, height, x, y1, y2) {
  var startY = Math.min(y1, y2);
  var endY = Math.max(y1, y2);
  for (var cy = startY; cy <= endY; cy++) {
    if (cy >= 0 && cy < height && x >= 0 && x < width) {
      if (grid[cy][x] === TILE.WALL) {
        grid[cy][x] = TILE.CORRIDOR;
      }
    }
  }
}

function connectRoomsOnGrid(grid, width, height, roomA, roomB, rng) {
  if (rng() < 0.5) {
    carveCorridorH(grid, width, height, roomA.centerY, roomA.centerX, roomB.centerX);
    carveCorridorV(grid, width, height, roomB.centerX, roomA.centerY, roomB.centerY);
  } else {
    carveCorridorV(grid, width, height, roomA.centerX, roomA.centerY, roomB.centerY);
    carveCorridorH(grid, width, height, roomB.centerY, roomA.centerX, roomB.centerX);
  }
}

function initGrid(width, height) {
  var grid = [];
  for (var y = 0; y < height; y++) {
    grid[y] = [];
    for (var x = 0; x < width; x++) {
      grid[y][x] = TILE.WALL;
    }
  }
  return grid;
}

function ensureMinRooms(grid, width, height, rooms) {
  if (rooms.length < 2) {
    var fallbackRooms = [
      { x: 3, y: 3, w: 6, h: 5 },
      { x: width - 11, y: height - 9, w: 6, h: 5 },
    ];
    for (var fi = rooms.length; fi < 2; fi++) {
      var fb = fallbackRooms[fi];
      for (var fy = fb.y; fy < fb.y + fb.h; fy++) {
        for (var fx = fb.x; fx < fb.x + fb.w; fx++) {
          if (fy >= 0 && fy < height && fx >= 0 && fx < width) {
            grid[fy][fx] = TILE.FLOOR;
          }
        }
      }
      rooms.push({
        x: fb.x, y: fb.y, w: fb.w, h: fb.h,
        centerX: Math.floor(fb.x + fb.w / 2),
        centerY: Math.floor(fb.y + fb.h / 2),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Layout generator: BSP Rooms (original algorithm)
// ---------------------------------------------------------------------------

function generateBSPLayout(width, height, rng, minRooms, maxRooms) {
  var grid = initGrid(width, height);

  var targetRooms = minRooms + Math.floor(rng() * (maxRooms - minRooms + 1));
  var rooms = [];
  var maxAttempts = targetRooms * 30;

  for (var attempt = 0; attempt < maxAttempts && rooms.length < targetRooms; attempt++) {
    var rw = 4 + Math.floor(rng() * 5); // 4-8
    var rh = 4 + Math.floor(rng() * 3); // 4-6
    var rx = 2 + Math.floor(rng() * (width - rw - 4));
    var ry = 2 + Math.floor(rng() * (height - rh - 4));

    var overlap = false;
    for (var ri = 0; ri < rooms.length; ri++) {
      var other = rooms[ri];
      if (rx - 2 < other.x + other.w && rx + rw + 2 > other.x &&
          ry - 2 < other.y + other.h && ry + rh + 2 > other.y) {
        overlap = true;
        break;
      }
    }
    if (overlap) continue;

    for (var cy = ry; cy < ry + rh; cy++) {
      for (var cx = rx; cx < rx + rw; cx++) {
        grid[cy][cx] = TILE.FLOOR;
      }
    }

    rooms.push({
      x: rx, y: ry, w: rw, h: rh,
      centerX: Math.floor(rx + rw / 2),
      centerY: Math.floor(ry + rh / 2),
    });
  }

  ensureMinRooms(grid, width, height, rooms);

  for (var ci = 0; ci < rooms.length - 1; ci++) {
    connectRoomsOnGrid(grid, width, height, rooms[ci], rooms[ci + 1], rng);
  }

  if (rooms.length > 3) {
    var extraCount = 1 + Math.floor(rng() * 2);
    for (var ei = 0; ei < extraCount; ei++) {
      var a = Math.floor(rng() * rooms.length);
      var b = Math.floor(rng() * rooms.length);
      if (a !== b) {
        connectRoomsOnGrid(grid, width, height, rooms[a], rooms[b], rng);
      }
    }
  }

  return { grid: grid, rooms: rooms };
}

// ---------------------------------------------------------------------------
// Layout generator: Maze (recursive backtracker)
// ---------------------------------------------------------------------------

function generateMazeLayout(width, height, rng, minRooms, maxRooms) {
  var grid = initGrid(width, height);

  // Maze cells: each cell is 3x3 tiles (1 floor center + wall border)
  var cellsX = Math.floor((width - 2) / 3);
  var cellsY = Math.floor((height - 2) / 3);
  if (cellsX < 3) cellsX = 3;
  if (cellsY < 3) cellsY = 3;

  var visited = [];
  for (var my = 0; my < cellsY; my++) {
    visited[my] = [];
    for (var mx = 0; mx < cellsX; mx++) {
      visited[my][mx] = false;
    }
  }

  function cellToTile(cx, cy) {
    return { x: 1 + cx * 3 + 1, y: 1 + cy * 3 + 1 };
  }

  function carveCell(cx, cy) {
    var t = cellToTile(cx, cy);
    if (t.y >= 0 && t.y < height && t.x >= 0 && t.x < width) {
      grid[t.y][t.x] = TILE.CORRIDOR;
    }
  }

  function carvePassage(cx1, cy1, cx2, cy2) {
    var t1 = cellToTile(cx1, cy1);
    var t2 = cellToTile(cx2, cy2);
    var px = (t1.x + t2.x) >> 1;
    var py = (t1.y + t2.y) >> 1;
    if (py >= 0 && py < height && px >= 0 && px < width) {
      grid[py][px] = TILE.CORRIDOR;
    }
  }

  // Iterative backtracker (avoids stack overflow on large grids)
  var stack = [];
  var startCX = Math.floor(rng() * cellsX);
  var startCY = Math.floor(rng() * cellsY);
  visited[startCY][startCX] = true;
  carveCell(startCX, startCY);
  stack.push({ x: startCX, y: startCY });

  var dirs = [
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
  ];

  while (stack.length > 0) {
    var cur = stack[stack.length - 1];
    var neighbors = [];
    for (var di = 0; di < dirs.length; di++) {
      var nx = cur.x + dirs[di].dx;
      var ny = cur.y + dirs[di].dy;
      if (nx >= 0 && nx < cellsX && ny >= 0 && ny < cellsY && !visited[ny][nx]) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      var chosen = neighbors[Math.floor(rng() * neighbors.length)];
      visited[chosen.y][chosen.x] = true;
      carvePassage(cur.x, cur.y, chosen.x, chosen.y);
      carveCell(chosen.x, chosen.y);
      stack.push(chosen);
    }
  }

  // Create rooms: expand every 4th cell into a larger room (5x3)
  var rooms = [];
  var targetRoomCount = minRooms + Math.floor(rng() * (maxRooms - minRooms + 1));
  var candidates = [];
  for (var rcy = 0; rcy < cellsY; rcy++) {
    for (var rcx = 0; rcx < cellsX; rcx++) {
      if ((rcy * cellsX + rcx) % 4 === 0) {
        candidates.push({ cx: rcx, cy: rcy });
      }
    }
  }

  // Shuffle candidates (Fisher-Yates)
  for (var si = candidates.length - 1; si > 0; si--) {
    var sj = Math.floor(rng() * (si + 1));
    var tmp = candidates[si];
    candidates[si] = candidates[sj];
    candidates[sj] = tmp;
  }

  var roomCount = Math.min(targetRoomCount, candidates.length);
  for (var ri = 0; ri < roomCount; ri++) {
    var cand = candidates[ri];
    var t = cellToTile(cand.cx, cand.cy);
    var rmx = t.x - 2;
    var rmy = t.y - 1;
    var rmw = 5;
    var rmh = 3;
    if (rmx < 1) rmx = 1;
    if (rmy < 1) rmy = 1;
    if (rmx + rmw >= width - 1) rmw = width - 2 - rmx;
    if (rmy + rmh >= height - 1) rmh = height - 2 - rmy;
    if (rmw < 3) rmw = 3;
    if (rmh < 3) rmh = 3;

    for (var fy = rmy; fy < rmy + rmh && fy < height - 1; fy++) {
      for (var fx = rmx; fx < rmx + rmw && fx < width - 1; fx++) {
        grid[fy][fx] = TILE.FLOOR;
      }
    }

    rooms.push({
      x: rmx, y: rmy, w: rmw, h: rmh,
      centerX: Math.floor(rmx + rmw / 2),
      centerY: Math.floor(rmy + rmh / 2),
    });
  }

  ensureMinRooms(grid, width, height, rooms);

  return { grid: grid, rooms: rooms };
}

// ---------------------------------------------------------------------------
// Layout generator: Lake (water-filled with walkway bridges)
// ---------------------------------------------------------------------------

function generateLakeLayout(width, height, rng, minRooms, maxRooms) {
  var grid = initGrid(width, height);
  var rooms = [];

  // Main walkway path from left side to right side
  var pathY = Math.floor(height / 2) + Math.floor(rng() * 6) - 3;
  var pathWidth = 1 + Math.floor(rng() * 2); // 1-2 tiles wide
  var curX = 2;
  var curY = pathY;

  while (curX < width - 3) {
    for (var pw = 0; pw < pathWidth; pw++) {
      var py = curY + pw;
      if (py >= 1 && py < height - 1 && curX >= 1 && curX < width - 1) {
        grid[py][curX] = TILE.CORRIDOR;
      }
    }

    var moveRoll = rng();
    if (moveRoll < 0.55) {
      curX++;
    } else if (moveRoll < 0.75) {
      curX++;
      curY = Math.max(2, Math.min(height - 3 - pathWidth, curY - 1));
    } else if (moveRoll < 0.95) {
      curX++;
      curY = Math.max(2, Math.min(height - 3 - pathWidth, curY + 1));
    } else {
      if (rng() < 0.5) {
        curY = Math.max(2, curY - 1);
      } else {
        curY = Math.min(height - 3 - pathWidth, curY + 1);
      }
    }
  }

  // Branch paths (2-4 branches off the main path)
  var branchCount = 2 + Math.floor(rng() * 3);
  var walkTiles = [];
  for (var sy = 0; sy < height; sy++) {
    for (var sx = 0; sx < width; sx++) {
      if (grid[sy][sx] === TILE.CORRIDOR) {
        walkTiles.push({ x: sx, y: sy });
      }
    }
  }

  for (var bi = 0; bi < branchCount && walkTiles.length > 0; bi++) {
    var branchStart = walkTiles[Math.floor(rng() * walkTiles.length)];
    var bx = branchStart.x;
    var by = branchStart.y;
    var bDir = rng() < 0.5 ? -1 : 1;
    var bLen = 5 + Math.floor(rng() * 10);

    for (var bs = 0; bs < bLen; bs++) {
      if (by >= 1 && by < height - 1 && bx >= 1 && bx < width - 1) {
        grid[by][bx] = TILE.CORRIDOR;
      }
      by += bDir;
      if (rng() < 0.3) bx += (rng() < 0.5 ? -1 : 1);
      bx = Math.max(1, Math.min(width - 2, bx));
      by = Math.max(1, Math.min(height - 2, by));
    }
  }

  // Create 3-6 small island rooms connected to walkways
  var islandCount = 3 + Math.floor(rng() * 4);
  walkTiles = [];
  for (var sy2 = 0; sy2 < height; sy2++) {
    for (var sx2 = 0; sx2 < width; sx2++) {
      if (grid[sy2][sx2] === TILE.CORRIDOR) {
        walkTiles.push({ x: sx2, y: sy2 });
      }
    }
  }

  for (var ii = 0; ii < islandCount && walkTiles.length > 0; ii++) {
    var anchor = walkTiles[Math.floor(rng() * walkTiles.length)];
    var offX = (rng() < 0.5 ? -1 : 1) * (2 + Math.floor(rng() * 3));
    var offY = (rng() < 0.5 ? -1 : 1) * (2 + Math.floor(rng() * 3));
    var iw = 3 + Math.floor(rng() * 3); // 3-5
    var ih = 3 + Math.floor(rng() * 2); // 3-4
    var ix = Math.max(1, Math.min(width - iw - 1, anchor.x + offX));
    var iy = Math.max(1, Math.min(height - ih - 1, anchor.y + offY));

    for (var iry = iy; iry < iy + ih; iry++) {
      for (var irx = ix; irx < ix + iw; irx++) {
        grid[iry][irx] = TILE.FLOOR;
      }
    }

    var room = {
      x: ix, y: iy, w: iw, h: ih,
      centerX: Math.floor(ix + iw / 2),
      centerY: Math.floor(iy + ih / 2),
    };
    rooms.push(room);

    connectRoomsOnGrid(grid, width, height, room, { centerX: anchor.x, centerY: anchor.y }, rng);
  }

  // Place some single-tile bridges across water gaps
  var bridgeCount = 2 + Math.floor(rng() * 4);
  for (var bri = 0; bri < bridgeCount; bri++) {
    var bridgeX = 3 + Math.floor(rng() * (width - 6));
    var bridgeY = 3 + Math.floor(rng() * (height - 6));
    if (grid[bridgeY][bridgeX] === TILE.WALL) {
      var hasNearby = false;
      for (var ndy = -2; ndy <= 2 && !hasNearby; ndy++) {
        for (var ndx = -2; ndx <= 2 && !hasNearby; ndx++) {
          var checkY = bridgeY + ndy;
          var checkX = bridgeX + ndx;
          if (checkY >= 0 && checkY < height && checkX >= 0 && checkX < width) {
            if (grid[checkY][checkX] === TILE.CORRIDOR || grid[checkY][checkX] === TILE.FLOOR) {
              hasNearby = true;
            }
          }
        }
      }
      if (hasNearby) {
        grid[bridgeY][bridgeX] = TILE.FLOOR;
      }
    }
  }

  ensureMinRooms(grid, width, height, rooms);

  return { grid: grid, rooms: rooms };
}

// ---------------------------------------------------------------------------
// Layout generator: Open Cavern (1-2 huge rooms with pillars)
// ---------------------------------------------------------------------------

function generateOpenCavernLayout(width, height, rng, minRooms, maxRooms) {
  var grid = initGrid(width, height);
  var rooms = [];

  var bigRoomCount = 1 + (rng() < 0.5 ? 1 : 0); // 1 or 2

  if (bigRoomCount === 1) {
    var margin = 3;
    var rw = Math.floor(width * (0.6 + rng() * 0.2));
    var rh = Math.floor(height * (0.6 + rng() * 0.2));
    var rx = Math.floor((width - rw) / 2);
    var ry = Math.floor((height - rh) / 2);
    if (rx < margin) rx = margin;
    if (ry < margin) ry = margin;
    if (rx + rw > width - margin) rw = width - margin - rx;
    if (ry + rh > height - margin) rh = height - margin - ry;

    for (var cy = ry; cy < ry + rh; cy++) {
      for (var cx = rx; cx < rx + rw; cx++) {
        grid[cy][cx] = TILE.FLOOR;
      }
    }

    rooms.push({
      x: rx, y: ry, w: rw, h: rh,
      centerX: Math.floor(rx + rw / 2),
      centerY: Math.floor(ry + rh / 2),
    });
  } else {
    var margin2 = 3;
    var halfW = Math.floor((width - margin2 * 3) / 2);
    var roomH = Math.floor(height * (0.55 + rng() * 0.15));
    var roomY = Math.floor((height - roomH) / 2);
    if (roomY < margin2) roomY = margin2;
    if (roomY + roomH > height - margin2) roomH = height - margin2 - roomY;

    var r1x = margin2;
    var r1w = halfW;
    for (var c1y = roomY; c1y < roomY + roomH; c1y++) {
      for (var c1x = r1x; c1x < r1x + r1w; c1x++) {
        grid[c1y][c1x] = TILE.FLOOR;
      }
    }
    rooms.push({
      x: r1x, y: roomY, w: r1w, h: roomH,
      centerX: Math.floor(r1x + r1w / 2),
      centerY: Math.floor(roomY + roomH / 2),
    });

    var r2x = margin2 + halfW + margin2;
    var r2w = halfW;
    if (r2x + r2w > width - margin2) r2w = width - margin2 - r2x;
    for (var c2y = roomY; c2y < roomY + roomH; c2y++) {
      for (var c2x = r2x; c2x < r2x + r2w; c2x++) {
        grid[c2y][c2x] = TILE.FLOOR;
      }
    }
    rooms.push({
      x: r2x, y: roomY, w: r2w, h: roomH,
      centerX: Math.floor(r2x + r2w / 2),
      centerY: Math.floor(roomY + roomH / 2),
    });

    // Connect rooms with wide corridor (3 tiles)
    var connY = Math.floor(roomY + roomH / 2);
    for (var cw = -1; cw <= 1; cw++) {
      var corridorY = connY + cw;
      if (corridorY >= 0 && corridorY < height) {
        carveCorridorH(grid, width, height, corridorY, r1x + r1w, r2x);
      }
    }
  }

  // Scatter pillar clusters (2x2 WALL blocks) inside rooms for cover
  for (var pi = 0; pi < rooms.length; pi++) {
    var rm = rooms[pi];
    var pillarCount = 3 + Math.floor(rng() * 5);
    for (var pj = 0; pj < pillarCount; pj++) {
      var ppx = rm.x + 2 + Math.floor(rng() * Math.max(1, rm.w - 4));
      var ppy = rm.y + 2 + Math.floor(rng() * Math.max(1, rm.h - 4));
      if (Math.abs(ppx - rm.centerX) < 2 && Math.abs(ppy - rm.centerY) < 2) continue;
      for (var pdy = 0; pdy < 2; pdy++) {
        for (var pdx = 0; pdx < 2; pdx++) {
          var tpx = ppx + pdx;
          var tpy = ppy + pdy;
          if (tpy >= rm.y + 1 && tpy < rm.y + rm.h - 1 && tpx >= rm.x + 1 && tpx < rm.x + rm.w - 1) {
            grid[tpy][tpx] = TILE.WALL;
          }
        }
      }
    }
  }

  // Add small alcoves (3x3 rooms) along the walls
  var alcoveCount = 3 + Math.floor(rng() * 4);
  for (var ai = 0; ai < alcoveCount; ai++) {
    var parentRoom = rooms[Math.floor(rng() * rooms.length)];
    var side = Math.floor(rng() * 4);
    var ax, ay;
    if (side === 0) {
      ax = parentRoom.x + 1 + Math.floor(rng() * Math.max(1, parentRoom.w - 4));
      ay = parentRoom.y - 3;
    } else if (side === 1) {
      ax = parentRoom.x + 1 + Math.floor(rng() * Math.max(1, parentRoom.w - 4));
      ay = parentRoom.y + parentRoom.h;
    } else if (side === 2) {
      ax = parentRoom.x - 3;
      ay = parentRoom.y + 1 + Math.floor(rng() * Math.max(1, parentRoom.h - 4));
    } else {
      ax = parentRoom.x + parentRoom.w;
      ay = parentRoom.y + 1 + Math.floor(rng() * Math.max(1, parentRoom.h - 4));
    }

    ax = Math.max(1, Math.min(width - 4, ax));
    ay = Math.max(1, Math.min(height - 4, ay));

    for (var acy = ay; acy < ay + 3 && acy < height - 1; acy++) {
      for (var acx = ax; acx < ax + 3 && acx < width - 1; acx++) {
        grid[acy][acx] = TILE.FLOOR;
      }
    }

    var alcove = {
      x: ax, y: ay, w: 3, h: 3,
      centerX: ax + 1, centerY: ay + 1,
    };
    rooms.push(alcove);

    connectRoomsOnGrid(grid, width, height, alcove, parentRoom, rng);
  }

  ensureMinRooms(grid, width, height, rooms);

  return { grid: grid, rooms: rooms };
}

// ---------------------------------------------------------------------------
// Layout generator: Temple Halls (long parallel halls with cross-connections)
// ---------------------------------------------------------------------------

function generateTempleHallsLayout(width, height, rng, minRooms, maxRooms) {
  var grid = initGrid(width, height);
  var rooms = [];

  var hallCount = 3 + Math.floor(rng() * 3); // 3-5
  var hallSpacing = Math.floor((height - 4) / (hallCount + 1));
  var hallWidth = 3;
  var hallMarginX = 3;

  var halls = [];
  for (var hi = 0; hi < hallCount; hi++) {
    var hallY = hallSpacing * (hi + 1) - Math.floor(hallWidth / 2);
    hallY = Math.max(2, Math.min(height - hallWidth - 2, hallY));
    var hallStartX = hallMarginX;
    var hallEndX = width - hallMarginX;
    var hallW = hallEndX - hallStartX;

    for (var hy = hallY; hy < hallY + hallWidth; hy++) {
      for (var hx = hallStartX; hx < hallEndX; hx++) {
        if (hy >= 0 && hy < height && hx >= 0 && hx < width) {
          grid[hy][hx] = TILE.FLOOR;
        }
      }
    }

    var hall = {
      x: hallStartX, y: hallY, w: hallW, h: hallWidth,
      centerX: Math.floor(hallStartX + hallW / 2),
      centerY: Math.floor(hallY + hallWidth / 2),
    };
    halls.push(hall);
    rooms.push(hall);
  }

  // 2-4 vertical cross-connections
  var crossCount = 2 + Math.floor(rng() * 3);
  for (var ci = 0; ci < crossCount; ci++) {
    var crossX = hallMarginX + 3 + Math.floor(rng() * Math.max(1, width - hallMarginX * 2 - 6));
    var crossWidth = 2 + Math.floor(rng() * 2); // 2-3 tiles

    var topHall = halls[0];
    var botHall = halls[halls.length - 1];
    var startY = topHall.y;
    var endY = botHall.y + botHall.h;

    for (var ccy = startY; ccy < endY; ccy++) {
      for (var ccx = crossX; ccx < crossX + crossWidth; ccx++) {
        if (ccy >= 0 && ccy < height && ccx >= 0 && ccx < width) {
          if (grid[ccy][ccx] === TILE.WALL) {
            grid[ccy][ccx] = TILE.CORRIDOR;
          }
        }
      }
    }
  }

  // Place small rooms (4x4) at intersection points
  var intersectionRoomCount = 0;
  var maxIntersectionRooms = Math.min(maxRooms - rooms.length, hallCount * crossCount);
  for (var ihi = 0; ihi < halls.length && intersectionRoomCount < maxIntersectionRooms; ihi++) {
    var iHall = halls[ihi];
    for (var isx = iHall.x; isx < iHall.x + iHall.w - 3; isx++) {
      var aboveIsCorridor = (iHall.y - 1 >= 0 && grid[iHall.y - 1][isx] === TILE.CORRIDOR);
      var belowIsCorridor = (iHall.y + iHall.h < height && grid[iHall.y + iHall.h][isx] === TILE.CORRIDOR);
      if ((aboveIsCorridor || belowIsCorridor) && rng() < 0.4 && intersectionRoomCount < maxIntersectionRooms) {
        var irx = Math.max(1, Math.min(width - 5, isx - 1));
        var iry = Math.max(1, Math.min(height - 5, iHall.y - 1));
        for (var iry2 = iry; iry2 < iry + 4 && iry2 < height - 1; iry2++) {
          for (var irx2 = irx; irx2 < irx + 4 && irx2 < width - 1; irx2++) {
            grid[iry2][irx2] = TILE.FLOOR;
          }
        }
        rooms.push({
          x: irx, y: iry, w: 4, h: 4,
          centerX: irx + 2, centerY: iry + 2,
        });
        intersectionRoomCount++;
        isx += 6;
      }
    }
  }

  // Add alcoves along halls
  var alcoveCount = 2 + Math.floor(rng() * 3);
  for (var ali = 0; ali < alcoveCount; ali++) {
    var alcoveHall = halls[Math.floor(rng() * halls.length)];
    var alcoveX = alcoveHall.x + 2 + Math.floor(rng() * Math.max(1, alcoveHall.w - 6));
    var above = rng() < 0.5;
    var alcoveY = above ? alcoveHall.y - 3 : alcoveHall.y + alcoveHall.h;
    alcoveY = Math.max(1, Math.min(height - 4, alcoveY));
    alcoveX = Math.max(1, Math.min(width - 4, alcoveX));

    for (var aly = alcoveY; aly < alcoveY + 3 && aly < height - 1; aly++) {
      for (var alx = alcoveX; alx < alcoveX + 3 && alx < width - 1; alx++) {
        grid[aly][alx] = TILE.FLOOR;
      }
    }

    var alRoom = {
      x: alcoveX, y: alcoveY, w: 3, h: 3,
      centerX: alcoveX + 1, centerY: alcoveY + 1,
    };
    rooms.push(alRoom);
    connectRoomsOnGrid(grid, width, height, alRoom, alcoveHall, rng);
  }

  ensureMinRooms(grid, width, height, rooms);

  return { grid: grid, rooms: rooms };
}

// ---------------------------------------------------------------------------
// Layout generator: Arena (large central room + surrounding chambers)
// ---------------------------------------------------------------------------

function generateArenaLayout(width, height, rng, minRooms, maxRooms) {
  var grid = initGrid(width, height);
  var rooms = [];

  // Central room: 40-50% of floor space
  var centerFrac = 0.4 + rng() * 0.1;
  var crw = Math.floor(width * Math.sqrt(centerFrac));
  var crh = Math.floor(height * Math.sqrt(centerFrac));
  if (crw < 8) crw = 8;
  if (crh < 6) crh = 6;
  var crx = Math.floor((width - crw) / 2);
  var cry = Math.floor((height - crh) / 2);
  crx = Math.max(2, crx);
  cry = Math.max(2, cry);
  if (crx + crw > width - 2) crw = width - 2 - crx;
  if (cry + crh > height - 2) crh = height - 2 - cry;

  for (var cy = cry; cy < cry + crh; cy++) {
    for (var cx = crx; cx < crx + crw; cx++) {
      grid[cy][cx] = TILE.FLOOR;
    }
  }

  var centralRoom = {
    x: crx, y: cry, w: crw, h: crh,
    centerX: Math.floor(crx + crw / 2),
    centerY: Math.floor(cry + crh / 2),
  };
  rooms.push(centralRoom);

  // Scatter pillar obstacles in central room
  var pillarCount = 2 + Math.floor(rng() * 4);
  for (var pi = 0; pi < pillarCount; pi++) {
    var ppx = crx + 3 + Math.floor(rng() * Math.max(1, crw - 6));
    var ppy = cry + 3 + Math.floor(rng() * Math.max(1, crh - 6));
    if (Math.abs(ppx - centralRoom.centerX) < 2 && Math.abs(ppy - centralRoom.centerY) < 2) continue;
    for (var pdy = 0; pdy < 2; pdy++) {
      for (var pdx = 0; pdx < 2; pdx++) {
        var tpx = ppx + pdx;
        var tpy = ppy + pdy;
        if (tpy >= cry + 1 && tpy < cry + crh - 1 && tpx >= crx + 1 && tpx < crx + crw - 1) {
          grid[tpy][tpx] = TILE.WALL;
        }
      }
    }
  }

  // 4-8 smaller rooms arranged around the perimeter
  var perimRoomCount = 4 + Math.floor(rng() * 5);
  var positions = [];
  positions.push({ x: crx + Math.floor(crw / 2) - 3, y: cry - 7 });
  positions.push({ x: crx + Math.floor(crw / 2) - 3, y: cry + crh + 2 });
  positions.push({ x: crx - 8, y: cry + Math.floor(crh / 2) - 2 });
  positions.push({ x: crx + crw + 2, y: cry + Math.floor(crh / 2) - 2 });
  positions.push({ x: crx - 7, y: cry - 6 });
  positions.push({ x: crx + crw + 1, y: cry - 6 });
  positions.push({ x: crx - 7, y: cry + crh + 1 });
  positions.push({ x: crx + crw + 1, y: cry + crh + 1 });

  // Shuffle positions
  for (var si = positions.length - 1; si > 0; si--) {
    var sj = Math.floor(rng() * (si + 1));
    var tmp = positions[si];
    positions[si] = positions[sj];
    positions[sj] = tmp;
  }

  for (var pri = 0; pri < perimRoomCount && pri < positions.length; pri++) {
    var pos = positions[pri];
    var prw = 4 + Math.floor(rng() * 3); // 4-6
    var prh = 4 + Math.floor(rng() * 3); // 4-6
    var prx = Math.max(1, Math.min(width - prw - 1, pos.x));
    var pry = Math.max(1, Math.min(height - prh - 1, pos.y));

    for (var pcy = pry; pcy < pry + prh; pcy++) {
      for (var pcx = prx; pcx < prx + prw; pcx++) {
        if (pcy >= 0 && pcy < height && pcx >= 0 && pcx < width) {
          grid[pcy][pcx] = TILE.FLOOR;
        }
      }
    }

    var perimRoom = {
      x: prx, y: pry, w: prw, h: prh,
      centerX: Math.floor(prx + prw / 2),
      centerY: Math.floor(pry + prh / 2),
    };
    rooms.push(perimRoom);

    connectRoomsOnGrid(grid, width, height, perimRoom, centralRoom, rng);
  }

  ensureMinRooms(grid, width, height, rooms);

  return { grid: grid, rooms: rooms };
}

// ---------------------------------------------------------------------------
// Layout generator: Island (scattered platforms connected by narrow bridges)
// ---------------------------------------------------------------------------

function generateIslandLayout(width, height, rng, minRooms, maxRooms) {
  var grid = initGrid(width, height);
  var rooms = [];

  var islandCount = 5 + Math.floor(rng() * 6); // 5-10
  islandCount = Math.max(islandCount, minRooms);
  if (islandCount > maxRooms) islandCount = maxRooms;
  var maxAttempts = islandCount * 40;
  var attempts = 0;

  while (rooms.length < islandCount && attempts < maxAttempts) {
    attempts++;
    var iw = 3 + Math.floor(rng() * 3); // 3-5
    var ih = 3 + Math.floor(rng() * 3); // 3-5
    var ix = 2 + Math.floor(rng() * (width - iw - 4));
    var iy = 2 + Math.floor(rng() * (height - ih - 4));

    var overlap = false;
    for (var ri = 0; ri < rooms.length; ri++) {
      var other = rooms[ri];
      if (ix - 3 < other.x + other.w && ix + iw + 3 > other.x &&
          iy - 3 < other.y + other.h && iy + ih + 3 > other.y) {
        overlap = true;
        break;
      }
    }
    if (overlap) continue;

    for (var icy = iy; icy < iy + ih; icy++) {
      for (var icx = ix; icx < ix + iw; icx++) {
        grid[icy][icx] = TILE.FLOOR;
      }
    }

    rooms.push({
      x: ix, y: iy, w: iw, h: ih,
      centerX: Math.floor(ix + iw / 2),
      centerY: Math.floor(iy + ih / 2),
    });
  }

  ensureMinRooms(grid, width, height, rooms);

  // Connect rooms with single-tile-wide bridges
  for (var ci = 0; ci < rooms.length - 1; ci++) {
    var roomA = rooms[ci];
    var roomB = rooms[ci + 1];

    if (rng() < 0.4) {
      if (Math.abs(roomA.centerY - roomB.centerY) <= 2) {
        carveCorridorH(grid, width, height, roomA.centerY, roomA.centerX, roomB.centerX);
      } else if (Math.abs(roomA.centerX - roomB.centerX) <= 2) {
        carveCorridorV(grid, width, height, roomA.centerX, roomA.centerY, roomB.centerY);
      } else {
        connectRoomsOnGrid(grid, width, height, roomA, roomB, rng);
      }
    } else {
      connectRoomsOnGrid(grid, width, height, roomA, roomB, rng);
    }
  }

  // 1-2 extra cross-connections
  if (rooms.length > 3) {
    var extraConns = 1 + Math.floor(rng() * 2);
    for (var ei = 0; ei < extraConns; ei++) {
      var a = Math.floor(rng() * rooms.length);
      var b = Math.floor(rng() * rooms.length);
      if (a !== b) {
        connectRoomsOnGrid(grid, width, height, rooms[a], rooms[b], rng);
      }
    }
  }

  return { grid: grid, rooms: rooms };
}

// ---------------------------------------------------------------------------
// Layout generator: Organic (cellular automata cave generation)
// ---------------------------------------------------------------------------

function generateOrganicLayout(width, height, rng, minRooms, maxRooms) {
  // Step 1: Fill grid randomly (45% FLOOR, 55% WALL)
  var grid = [];
  for (var y = 0; y < height; y++) {
    grid[y] = [];
    for (var x = 0; x < width; x++) {
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        grid[y][x] = TILE.WALL;
      } else {
        grid[y][x] = (rng() < 0.45) ? TILE.FLOOR : TILE.WALL;
      }
    }
  }

  // Step 2: Run 5 iterations of cellular automata
  for (var iter = 0; iter < 5; iter++) {
    var newGrid = [];
    for (var ny = 0; ny < height; ny++) {
      newGrid[ny] = [];
      for (var nx = 0; nx < width; nx++) {
        if (ny === 0 || ny === height - 1 || nx === 0 || nx === width - 1) {
          newGrid[ny][nx] = TILE.WALL;
          continue;
        }
        var wallCount = 0;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            var ny2 = ny + dy;
            var nx2 = nx + dx;
            if (ny2 < 0 || ny2 >= height || nx2 < 0 || nx2 >= width) {
              wallCount++;
            } else if (grid[ny2][nx2] === TILE.WALL) {
              wallCount++;
            }
          }
        }

        if (grid[ny][nx] === TILE.WALL) {
          newGrid[ny][nx] = (wallCount >= 4) ? TILE.WALL : TILE.FLOOR;
        } else {
          newGrid[ny][nx] = (wallCount >= 5) ? TILE.WALL : TILE.FLOOR;
        }
      }
    }
    grid = newGrid;
  }

  // Step 3: Flood-fill to find the largest connected region
  var regionMap = [];
  for (var ry = 0; ry < height; ry++) {
    regionMap[ry] = [];
    for (var rx = 0; rx < width; rx++) {
      regionMap[ry][rx] = -1;
    }
  }

  var regions = [];
  var regionId = 0;

  for (var fy = 1; fy < height - 1; fy++) {
    for (var fx = 1; fx < width - 1; fx++) {
      if (grid[fy][fx] === TILE.FLOOR && regionMap[fy][fx] === -1) {
        var regionTiles = [];
        var queue = [{ x: fx, y: fy }];
        regionMap[fy][fx] = regionId;

        while (queue.length > 0) {
          var cur = queue.shift();
          regionTiles.push(cur);
          var floodDirs = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
          ];
          for (var fdi = 0; fdi < floodDirs.length; fdi++) {
            var fnx = cur.x + floodDirs[fdi].dx;
            var fny = cur.y + floodDirs[fdi].dy;
            if (fnx >= 0 && fnx < width && fny >= 0 && fny < height &&
                grid[fny][fnx] === TILE.FLOOR && regionMap[fny][fnx] === -1) {
              regionMap[fny][fnx] = regionId;
              queue.push({ x: fnx, y: fny });
            }
          }
        }

        regions.push(regionTiles);
        regionId++;
      }
    }
  }

  // Step 4: Find largest region, fill all others with WALL
  var largestIdx = 0;
  var largestSize = 0;
  for (var li = 0; li < regions.length; li++) {
    if (regions[li].length > largestSize) {
      largestSize = regions[li].length;
      largestIdx = li;
    }
  }

  for (var ri2 = 0; ri2 < regions.length; ri2++) {
    if (ri2 !== largestIdx) {
      var tiles = regions[ri2];
      for (var ti = 0; ti < tiles.length; ti++) {
        grid[tiles[ti].y][tiles[ti].x] = TILE.WALL;
      }
    }
  }

  // Defensive: if too few floor tiles, force open space
  if (largestSize < 20) {
    var forcedX = Math.floor(width / 4);
    var forcedY = Math.floor(height / 4);
    var forcedW = Math.floor(width / 2);
    var forcedH = Math.floor(height / 2);
    for (var fry = forcedY; fry < forcedY + forcedH; fry++) {
      for (var frx = forcedX; frx < forcedX + forcedW; frx++) {
        if (fry > 0 && fry < height - 1 && frx > 0 && frx < width - 1) {
          grid[fry][frx] = TILE.FLOOR;
        }
      }
    }
  }

  // Step 5: Identify rooms as rectangular sub-regions within the organic shape
  var rooms = [];
  var usedCells = [];
  for (var uy = 0; uy < height; uy++) {
    usedCells[uy] = [];
    for (var ux = 0; ux < width; ux++) {
      usedCells[uy][ux] = false;
    }
  }

  var targetRoomCount = minRooms + Math.floor(rng() * (maxRooms - minRooms + 1));
  var roomAttempts = 0;
  var maxRoomAttempts = targetRoomCount * 50;

  while (rooms.length < targetRoomCount && roomAttempts < maxRoomAttempts) {
    roomAttempts++;
    var osx = 2 + Math.floor(rng() * (width - 4));
    var osy = 2 + Math.floor(rng() * (height - 4));
    if (grid[osy][osx] !== TILE.FLOOR || usedCells[osy][osx]) continue;

    // Try to expand a rectangle from this point
    var orw = 1;
    var orh = 1;
    while (orw < 6 && osx + orw < width - 1 && grid[osy][osx + orw] === TILE.FLOOR && !usedCells[osy][osx + orw]) orw++;
    var canExpand = true;
    while (orh < 5 && osy + orh < height - 1 && canExpand) {
      for (var chk = osx; chk < osx + orw; chk++) {
        if (grid[osy + orh][chk] !== TILE.FLOOR || usedCells[osy + orh][chk]) {
          canExpand = false;
          break;
        }
      }
      if (canExpand) orh++;
    }

    if (orw >= 3 && orh >= 3) {
      for (var ucy = osy; ucy < osy + orh; ucy++) {
        for (var ucx = osx; ucx < osx + orw; ucx++) {
          usedCells[ucy][ucx] = true;
        }
      }
      rooms.push({
        x: osx, y: osy, w: orw, h: orh,
        centerX: Math.floor(osx + orw / 2),
        centerY: Math.floor(osy + orh / 2),
      });
    }
  }

  ensureMinRooms(grid, width, height, rooms);

  return { grid: grid, rooms: rooms };
}

// ---------------------------------------------------------------------------
// Layout dispatcher: selects and runs the appropriate generator
// ---------------------------------------------------------------------------

function generateLayoutForFloor(layout, width, height, rng, minRooms, maxRooms) {
  switch (layout) {
    case 'maze':          return generateMazeLayout(width, height, rng, minRooms, maxRooms);
    case 'lake':          return generateLakeLayout(width, height, rng, minRooms, maxRooms);
    case 'open_cavern':   return generateOpenCavernLayout(width, height, rng, minRooms, maxRooms);
    case 'temple_halls':  return generateTempleHallsLayout(width, height, rng, minRooms, maxRooms);
    case 'arena':         return generateArenaLayout(width, height, rng, minRooms, maxRooms);
    case 'island':        return generateIslandLayout(width, height, rng, minRooms, maxRooms);
    case 'organic':       return generateOrganicLayout(width, height, rng, minRooms, maxRooms);
    case 'raid_arena':    return generateRaidArenaLayout(width, height, rng);
    case 'ocean_arena':   return generateOceanArenaLayout(width, height, rng);
    case 'bsp_rooms':     // fall through
    default:              return generateBSPLayout(width, height, rng, minRooms, maxRooms);
  }
}

// ---------------------------------------------------------------------------
// Layout: RAID_ARENA — large central arena + waiting room + barrier + 4 alcoves
// Used for raid boss floors (every 50th rift floor).
// ---------------------------------------------------------------------------
function generateRaidArenaLayout(width, height, rng) {
  // Initialize grid with walls
  var grid = [];
  for (var y = 0; y < height; y++) {
    grid[y] = [];
    for (var x = 0; x < width; x++) {
      grid[y][x] = TILE.WALL;
    }
  }

  var rooms = [];

  // Room 1: Waiting room (south side, smaller)
  var waitW = 30, waitH = 20;
  var waitX = Math.floor((width - waitW) / 2);
  var waitY = height - waitH - 2;
  for (var wy = waitY; wy < waitY + waitH; wy++) {
    for (var wx = waitX; wx < waitX + waitW; wx++) {
      grid[wy][wx] = TILE.FLOOR;
    }
  }
  rooms.push({
    x: waitX, y: waitY, w: waitW, h: waitH,
    centerX: waitX + Math.floor(waitW / 2),
    centerY: waitY + Math.floor(waitH / 2),
  });

  // Barrier row (BOSS_DOOR tiles separating waiting room from arena)
  var barrierY = waitY - 1;
  for (var bx = waitX + 4; bx < waitX + waitW - 4; bx++) {
    grid[barrierY][bx] = TILE.BOSS_DOOR;
  }

  // Room 2: Main arena (large central area)
  var arenaW = Math.floor(width * 0.7);
  var arenaH = Math.floor(height * 0.5);
  var arenaX = Math.floor((width - arenaW) / 2);
  var arenaY = Math.floor((barrierY - arenaH) / 2) + 2;
  for (var ay = arenaY; ay < arenaY + arenaH; ay++) {
    for (var ax = arenaX; ax < arenaX + arenaW; ax++) {
      grid[ay][ax] = TILE.FLOOR;
    }
  }
  // Add pillar cover (scattered walls within arena for tactical positioning)
  var pillarCount = 8 + Math.floor(rng() * 6);
  for (var pi = 0; pi < pillarCount; pi++) {
    var px = arenaX + 3 + Math.floor(rng() * (arenaW - 6));
    var py = arenaY + 3 + Math.floor(rng() * (arenaH - 6));
    // 2x2 pillar
    if (py + 1 < arenaY + arenaH && px + 1 < arenaX + arenaW) {
      grid[py][px] = TILE.WALL;
      grid[py][px + 1] = TILE.WALL;
      grid[py + 1][px] = TILE.WALL;
      grid[py + 1][px + 1] = TILE.WALL;
    }
  }
  rooms.push({
    x: arenaX, y: arenaY, w: arenaW, h: arenaH,
    centerX: arenaX + Math.floor(arenaW / 2),
    centerY: arenaY + Math.floor(arenaH / 2),
  });

  // Connect barrier to arena with corridor
  for (var cy = arenaY + arenaH; cy <= barrierY; cy++) {
    for (var cx = waitX + 8; cx < waitX + waitW - 8; cx++) {
      if (grid[cy][cx] === TILE.WALL) grid[cy][cx] = TILE.CORRIDOR;
    }
  }

  // Room 3-6: 4 alcoves at corners of arena (for raid mechanics)
  var alcoveSize = 8;
  var alcovePositions = [
    { x: arenaX - alcoveSize - 1, y: arenaY },                              // top-left
    { x: arenaX + arenaW + 1,     y: arenaY },                              // top-right
    { x: arenaX - alcoveSize - 1, y: arenaY + arenaH - alcoveSize },        // bottom-left
    { x: arenaX + arenaW + 1,     y: arenaY + arenaH - alcoveSize },        // bottom-right
  ];
  for (var ai = 0; ai < alcovePositions.length; ai++) {
    var aPos = alcovePositions[ai];
    if (aPos.x < 1 || aPos.x + alcoveSize >= width - 1) continue;
    if (aPos.y < 1 || aPos.y + alcoveSize >= height - 1) continue;

    for (var aly = aPos.y; aly < aPos.y + alcoveSize; aly++) {
      for (var alx = aPos.x; alx < aPos.x + alcoveSize; alx++) {
        grid[aly][alx] = TILE.FLOOR;
      }
    }
    // Connect alcove to arena with corridor
    var connY = aPos.y + Math.floor(alcoveSize / 2);
    var connStartX = (aPos.x < arenaX) ? aPos.x + alcoveSize : arenaX + arenaW;
    var connEndX = (aPos.x < arenaX) ? arenaX : aPos.x;
    for (var ccx = Math.min(connStartX, connEndX); ccx <= Math.max(connStartX, connEndX); ccx++) {
      if (grid[connY][ccx] === TILE.WALL) grid[connY][ccx] = TILE.CORRIDOR;
    }

    rooms.push({
      x: aPos.x, y: aPos.y, w: alcoveSize, h: alcoveSize,
      centerX: aPos.x + Math.floor(alcoveSize / 2),
      centerY: aPos.y + Math.floor(alcoveSize / 2),
    });
  }

  return { grid: grid, rooms: rooms };
}

// ---------------------------------------------------------------------------
// Enemy scaling
// ---------------------------------------------------------------------------

function scaleEnemy(template, floorNum, theme) {
  var mult = Math.max(0, floorNum - 1);
  var archetype = inferArchetype(template);
  var defaults = ENEMY_DEFAULTS[archetype] || ENEMY_DEFAULTS.bruiser;
  var scaledHp = Math.floor(template.hp * (1 + mult * 0.12));
  // Resolve combat properties: template overrides theme defaults
  var themeCombat = (theme && THEME_COMBAT_PROPERTIES[theme]) || {};
  return {
    id:              template.id,
    name:            template.name,
    hp:              scaledHp,
    maxHp:           scaledHp,
    atk:             Math.floor(template.atk  * (1 + mult * 0.08)),
    def:             Math.floor(template.def  * (1 + mult * 0.05)),
    xp:              Math.floor(template.xp   * (1 + mult * 0.20)),
    gold:            Math.floor(template.gold * (1 + mult * 0.15)),
    archetype:       archetype,
    detectionRadius: (template.detectionRadius != null) ? template.detectionRadius : defaults.detectionRadius,
    abilities:       template.abilities || defaults.abilities,
    resistances:     template.resistances || themeCombat.resistances || null,
    weaknesses:      template.weaknesses  || themeCombat.weaknesses  || null,
    damageType:      template.damageType  || themeCombat.damageType  || null,
    element:         template.element || (theme ? (THEME_ELEMENT_MAP[theme] || null) : null),
    invisibility:    template.invisibility || null,
    isLiving:        (template.isLiving !== undefined) ? template.isLiving : undefined,
  };
}

function scaleBoss(template, floorNum, theme) {
  var mult = Math.max(0, floorNum - 1);
  var defaults = ENEMY_DEFAULTS.elite;
  var scaledHp = Math.floor(template.hp * (1 + mult * 0.15));
  var scaledAtk = Math.floor(template.atk * (1 + mult * 0.10));

  // Build boss-specific abilities: use template overrides or elite defaults
  var abilities = template.abilities || [
    { id: 'heavy_strike', name: 'Heavy Strike', damage: 1.5, range: 1, windUp: 2, cooldown: 4, weight: 10 },
    { id: 'power_slam', name: 'Power Slam', damage: 2.0, range: 1, windUp: 3, cooldown: 6, weight: 8, effect: 'stun', effectChance: 0.3 },
    { id: 'boss_roar', name: 'Terrifying Roar', damage: 0.6, range: 3, windUp: 1, cooldown: 8, weight: 6, effect: 'fear', effectChance: 0.5 },
  ];

  // Build boss phases: use template overrides or generate defaults
  var phases = template.phases || [
    {
      threshold: 0.6,
      name: 'Enraged',
      atkMult: 1.3,
      abilities: [
        { id: 'enraged_strike', name: 'Enraged Strike', damage: 1.8, range: 1, windUp: 2, cooldown: 3, weight: 12 },
        { id: 'power_slam', name: 'Power Slam', damage: 2.0, range: 1, windUp: 3, cooldown: 5, weight: 10, effect: 'stun', effectChance: 0.4 },
      ],
      speed: 2,
    },
    {
      threshold: 0.3,
      name: 'Desperate',
      atkMult: 1.6,
      abilities: [
        { id: 'desperate_flurry', name: 'Desperate Flurry', damage: 2.2, range: 1, windUp: 1, cooldown: 3, weight: 14 },
        { id: 'death_throes', name: 'Death Throes', damage: 1.5, range: 2, windUp: 2, cooldown: 4, weight: 10, effect: 'bleed', effectChance: 0.6 },
      ],
      detectionRadius: 8,
    },
  ];

  // Resolve combat properties: template overrides theme defaults
  var themeCombat = (theme && THEME_COMBAT_PROPERTIES[theme]) || {};

  return {
    id:              template.id,
    name:            template.name,
    hp:              scaledHp,
    maxHp:           scaledHp,
    atk:             scaledAtk,
    def:             Math.floor(template.def  * (1 + mult * 0.08)),
    xp:              Math.floor(template.xp   * (1 + mult * 0.30)),
    gold:            Math.floor(template.gold * (1 + mult * 0.25)),
    isBoss:          true,
    archetype:       'elite',
    detectionRadius: defaults.detectionRadius,
    cardPackReward:  true,
    abilities:       abilities,
    phases:          phases,
    resistances:     template.resistances || themeCombat.resistances || null,
    weaknesses:      template.weaknesses  || themeCombat.weaknesses  || null,
    damageType:      template.damageType  || themeCombat.damageType  || null,
    element:         template.element || (theme ? (THEME_ELEMENT_MAP[theme] || null) : null),
    mechanic:        template.mechanic || BOSS_MECHANIC_MAP[template.id] || null,
    mechanicDef:     (template.mechanic || BOSS_MECHANIC_MAP[template.id]) ? (BOSS_MECHANICS[template.mechanic || BOSS_MECHANIC_MAP[template.id]] || null) : null,
  };
}

// ---------------------------------------------------------------------------
// Chest loot tiers
// ---------------------------------------------------------------------------

var CHEST_LOOT = {
  common: {
    goldMin: 5,    goldMax: 15,
    resources: ['wood', 'stone', 'iron_ore', 'herbs'],
    cardChance: 0.05,
  },
  uncommon: {
    goldMin: 15,   goldMax: 40,
    resources: ['iron_bar', 'bronze_ore', 'glass_sand', 'mushroom', 'gem_rough', 'copper_ore'],
    cardChance: 0.12,
  },
  rare: {
    goldMin: 40,   goldMax: 100,
    resources: ['bronze_bar', 'glass', 'mana_crystal', 'gem_cut', 'cogs', 'silver_ore', 'copper_bar'],
    cardChance: 0.25,
  },
  legendary: {
    goldMin: 100,  goldMax: 300,
    resources: ['mana_crystal', 'gem_cut', 'clockwork_core', 'glass_lens', 'gold_ore', 'silver_bar', 'mithril_ore'],
    cardChance: 0.50,
  },
};

// ---------------------------------------------------------------------------
// Trap types
// ---------------------------------------------------------------------------

var TRAP_TYPES = {
  spike_pit:        { name: 'Spike Pit',        damageFactor: 1.0, effect: null,     effectDuration: 0, tickDamage: 0, detectDifficulty: 1 },
  arrow_trap:       { name: 'Arrow Trap',       damageFactor: 0.8, effect: null,     effectDuration: 0, tickDamage: 0, detectDifficulty: 2 },
  pressure_plate:   { name: 'Pressure Plate',   damageFactor: 0.5, effect: 'stun',   effectDuration: 2, tickDamage: 0, detectDifficulty: 2 },
  poison_gas:       { name: 'Poison Gas',       damageFactor: 0.3, effect: 'poison', effectDuration: 8, tickDamage: 3, detectDifficulty: 2 },
  collapsing_floor: { name: 'Collapsing Floor', damageFactor: 1.5, effect: 'stun',   effectDuration: 1, tickDamage: 0, detectDifficulty: 1 },
  tripwire:         { name: 'Tripwire',         damageFactor: 0.4, effect: 'slow',   effectDuration: 5, tickDamage: 0, detectDifficulty: 2 },
  dart_trap:        { name: 'Dart Trap',        damageFactor: 0.6, effect: 'poison', effectDuration: 5, tickDamage: 2, detectDifficulty: 2 },
  flame_jet:        { name: 'Flame Jet',        damageFactor: 1.2, effect: 'burn',   effectDuration: 3, tickDamage: 5, detectDifficulty: 1 },
};
var TRAP_TYPE_KEYS = Object.keys(TRAP_TYPES);

// ---------------------------------------------------------------------------
// Trap damage
// ---------------------------------------------------------------------------

function getTrapDamage(floorNum) {
  return 10 + floorNum * 5;
}

// ---------------------------------------------------------------------------
// Special events (rare per-floor occurrences)
// ---------------------------------------------------------------------------

var SPECIAL_EVENTS = [
  {
    id: 'treasure_goblin',
    name: 'Treasure Goblin',
    description: 'A treasure goblin dashes through the room! Defeat it before it escapes.',
    duration: 15,
    reward: { goldMultiplier: 3, bonusXp: 50 },
  },
  {
    id: 'ancient_shrine',
    name: 'Ancient Shrine',
    description: 'A glowing shrine offers a temporary blessing to all nearby adventurers.',
    duration: 0,
    reward: { buff: 'shrine_power', buffDuration: 120 },
  },
  {
    id: 'merchant_ghost',
    name: 'Merchant Ghost',
    description: 'The ghost of a long-dead merchant offers rare wares at fair prices.',
    duration: 0,
    reward: { shopDiscount: 0.30, rareItems: true },
  },
  {
    id: 'mini_boss',
    name: 'Mini Boss Ambush',
    description: 'A powerful creature blocks the passage. Defeat it for bonus rewards.',
    duration: 0,
    reward: { bonusXp: 100, bonusGold: 50, cardChance: 0.20 },
  },
  {
    id: 'portal_room',
    name: 'Portal Room',
    description: 'A shimmering portal leads to a hidden treasure chamber.',
    duration: 0,
    reward: { bonusChests: 3, chestTier: 'rare' },
  },
  {
    id: 'memory_crystal',
    name: 'Memory Crystal',
    description: 'A crystal holds memories of past adventurers, granting wisdom.',
    duration: 0,
    reward: { bonusXp: 75, skillXp: 25 },
  },
];

// ---------------------------------------------------------------------------
// Floor modifiers — special conditions applied to floors alongside the theme.
// Each floor has a chance to roll a modifier. Modifiers stack with the theme.
// ---------------------------------------------------------------------------

var FLOOR_MODIFIERS = {
  none:           { id: 'none',           name: 'Normal',          weight: 50, description: 'Standard floor, no special conditions.' },
  trap_gauntlet:  { id: 'trap_gauntlet',  name: 'Trap Gauntlet',   weight: 8,  description: 'Triple trap density. Pressure plates and spike pits everywhere. Dungeon Dwelling skill reduces trap damage.',
    trapMultiplier: 3, trapDamageBonus: 0.5 },
  mimic_infestation: { id: 'mimic_infestation', name: 'Mimic Infestation', weight: 6, description: 'Some chests are mimics — hostile creatures disguised as treasure. Attack when opened.',
    mimicChance: 0.40, mimicTemplate: { id: 'mimic', name: 'Mimic', hp: 60, atk: 18, def: 8, xp: 30, gold: 20, isMimic: true } },
  dense_fog:      { id: 'dense_fog',      name: 'Dense Fog',       weight: 7,  description: 'Thick fog reduces visibility to 1 tile (normally 3). Darkvision races see 2 tiles. Enemies harder to spot.',
    fogRadius: 1, darkvisionFogRadius: 2, enemyDetectionReduction: 1 },
  treasure_vault: { id: 'treasure_vault', name: 'Treasure Vault',  weight: 4,  description: 'A floor overflowing with loot. Double chest count, all chests upgraded one tier. Guarded by extra enemies.',
    chestMultiplier: 2, chestTierBonus: 1, enemyMultiplier: 1.5 },
  cursed:         { id: 'cursed',          name: 'Cursed Floor',    weight: 5,  description: 'A dark curse permeates this floor. Enemies deal 20% more damage, but drop 50% more gold and XP.',
    enemyDamageBonus: 0.20, enemyGoldBonus: 0.50, enemyXpBonus: 0.50 },
  hollowed_swarm: { id: 'hollowed_swarm', name: 'Hollowed Swarm',  weight: 5,  description: 'The hollowed have gathered en masse. 50% more enemies, all hollowed/maddened variants.',
    enemyMultiplier: 1.5, forceHollowed: true },
  silent_floor:   { id: 'silent_floor',   name: 'Silent Floor',    weight: 5,  description: 'An eerie silence. No ambient sounds. Enemies do not patrol — they stand perfectly still until you get close.',
    enemiesStationary: true, detectionRadiusBonus: 1 },
  unstable_rift:  { id: 'unstable_rift',  name: 'Unstable Rift',   weight: 4,  description: 'The floor shifts and warps. Corridors may collapse. Walls appear and disappear. Layout partially randomizes every 60 seconds.',
    wallShiftInterval: 60, collapseChance: 0.05 },
  blood_moon:     { id: 'blood_moon',     name: 'Blood Moon',      weight: 3,  description: 'A crimson glow suffuses everything. Enemies regenerate HP slowly. Vampiric enemies heal on hit.',
    enemyRegenPerTick: 1, vampiricHealPercent: 0.10 },
  sanctuary:      { id: 'sanctuary',      name: 'Sanctuary Floor', weight: 3,  description: 'A rare floor of peace. No enemies spawn. Contains a shrine, merchant NPC, and healing spring. A moment to breathe.',
    noEnemies: true, guaranteedShrine: true, guaranteedMerchant: true, healingSpring: true },
};

function selectFloorModifier(rng, floorNum) {
  // No modifiers on first 3 floors (ease players in)
  if (floorNum <= 3) return FLOOR_MODIFIERS.none;

  var totalWeight = 0;
  var modifiers = Object.keys(FLOOR_MODIFIERS);
  modifiers.forEach(function(key) { totalWeight += FLOOR_MODIFIERS[key].weight; });

  var roll = rng() * totalWeight;
  var cumulative = 0;
  for (var i = 0; i < modifiers.length; i++) {
    cumulative += FLOOR_MODIFIERS[modifiers[i]].weight;
    if (roll < cumulative) return FLOOR_MODIFIERS[modifiers[i]];
  }
  return FLOOR_MODIFIERS.none;
}

// ---------------------------------------------------------------------------
// Dungeon NPCs
// ---------------------------------------------------------------------------

var DUNGEON_NPCS = [
  {
    id: 'prisoner',
    name: 'Imprisoned Adventurer',
    dialogue: 'Thank you for freeing me! Take this as a reward.',
    reward: { gold: 20, xp: 15 },
    questHook: 'escort_to_exit',
  },
  {
    id: 'lost_merchant',
    name: 'Lost Merchant',
    dialogue: 'I got separated from my caravan. Would you like to trade?',
    reward: null,
    questHook: 'trade_opportunity',
  },
  {
    id: 'wounded_knight',
    name: 'Wounded Knight',
    dialogue: 'I can barely stand... the boss on the next floor is fearsome. Take my shield.',
    reward: { defBoost: 3, duration: 300 },
    questHook: null,
  },
  {
    id: 'trapped_mage',
    name: 'Trapped Mage',
    dialogue: 'These wards are too strong for me alone. Help me break free and I will aid you.',
    reward: { atkBoost: 5, duration: 180 },
    questHook: 'mage_companion',
  },
  {
    id: 'escaped_prisoner',
    name: 'Escaped Prisoner',
    dialogue: 'The guards are distracted. I mapped a shortcut to the lower floors.',
    reward: { revealMap: true },
    questHook: 'shortcut_reveal',
  },
];

var dungeonCorpsesData = require('./dungeon-corpses');
var DUNGEON_CORPSES = dungeonCorpsesData.DUNGEON_CORPSES;


// ---------------------------------------------------------------------------
// getThemeForFloor — determines which visual/gameplay theme to use
// ---------------------------------------------------------------------------

function getThemeForFloor(floorNum, seed, options) {
  // Allow forced theme from world dungeons (opts.theme overrides all selection)
  if (options && options.theme) return options.theme;

  // Use themeSeed (if provided) for theme RNG so themes stay stable
  // even when the main seed rotates daily (caves/world dungeons).
  var themeSeedStr = (options && options.themeSeed) ? options.themeSeed : seed;
  var rng = seededRandom(chunkSeed(floorNum, 0, themeSeedStr + ':theme'));
  var type = (options && options.type) || 'rift';

  if (type === 'cave') {
    var biome = (options && options.biome != null) ? options.biome : 5;
    var themes = BIOME_DUNGEON_THEMES[biome];
    if (!themes || themes.length === 0) themes = BIOME_DUNGEON_THEMES[5];
    var idx = Math.floor(rng() * themes.length);
    return themes[idx];
  }

  // Rift: floors 1-5 use castle themes, 6+ use wild themes
  if (floorNum <= 5) {
    var cIdx = Math.floor(rng() * CASTLE_THEMES.length);
    return CASTLE_THEMES[cIdx];
  }

  var wIdx = Math.floor(rng() * WILD_THEMES.length);
  return WILD_THEMES[wIdx];
}

// ---------------------------------------------------------------------------
// getCaveDepth — returns number of floors for a biome cave
// ---------------------------------------------------------------------------

function getCaveDepth(biome, caveKey) {
  var range = CAVE_FLOORS_BY_BIOME[biome];
  if (!range) range = { min: 2, max: 4 };
  var rng = seededRandom(chunkSeed(biome, 0, CAVE_SEED_PREFIX + caveKey));
  var depth = range.min + Math.floor(rng() * (range.max - range.min + 1));
  return depth;
}

// ---------------------------------------------------------------------------
// Layout: OCEAN_ARENA — open water arena for leviathan encounters
// Spawn platform (bottom), large open arena (center/top), debris + pillars.
// ---------------------------------------------------------------------------
function generateOceanArenaLayout(width, height, rng) {
  var grid = [];
  for (var y = 0; y < height; y++) {
    grid[y] = [];
    for (var x = 0; x < width; x++) {
      grid[y][x] = TILE.WALL;
    }
  }

  var rooms = [];

  // Player spawn platform (bottom section)
  var spawnW = Math.min(30, Math.floor(width * 0.4));
  var spawnH = Math.min(15, Math.floor(height * 0.18));
  var spawnX = Math.floor((width - spawnW) / 2);
  var spawnY = height - spawnH - 2;
  for (var sy = spawnY; sy < spawnY + spawnH; sy++) {
    for (var sx = spawnX; sx < spawnX + spawnW; sx++) {
      grid[sy][sx] = TILE.FLOOR;
    }
  }
  rooms.push({
    x: spawnX, y: spawnY, w: spawnW, h: spawnH,
    centerX: spawnX + Math.floor(spawnW / 2),
    centerY: spawnY + Math.floor(spawnH / 2),
  });

  // Main arena (center/top — large open water area)
  var arenaW = Math.floor(width * 0.75);
  var arenaH = Math.floor(height * 0.55);
  var arenaX = Math.floor((width - arenaW) / 2);
  var arenaY = 3;
  for (var ay = arenaY; ay < arenaY + arenaH; ay++) {
    for (var ax = arenaX; ax < arenaX + arenaW; ax++) {
      grid[ay][ax] = TILE.FLOOR;
    }
  }
  rooms.push({
    x: arenaX, y: arenaY, w: arenaW, h: arenaH,
    centerX: arenaX + Math.floor(arenaW / 2),
    centerY: arenaY + Math.floor(arenaH / 2),
  });

  // Connecting corridor (spawn platform to arena)
  var corrX = Math.floor(width / 2) - 3;
  var corrTopY = arenaY + arenaH;
  var corrBotY = spawnY;
  for (var cy = corrTopY; cy < corrBotY; cy++) {
    for (var cx = corrX; cx < corrX + 6; cx++) {
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        grid[cy][cx] = TILE.FLOOR;
      }
    }
  }

  // Floating debris: 1x1 WALL obstacles scattered in arena
  var debrisCount = 6 + Math.floor(rng() * 8);
  for (var di = 0; di < debrisCount; di++) {
    var dx = arenaX + 2 + Math.floor(rng() * (arenaW - 4));
    var dy = arenaY + 2 + Math.floor(rng() * (arenaH - 4));
    grid[dy][dx] = TILE.WALL;
  }

  // Coral pillars: 3x3 WALL clusters
  var pillarCount = 3 + Math.floor(rng() * 4);
  for (var pi = 0; pi < pillarCount; pi++) {
    var px = arenaX + 4 + Math.floor(rng() * (arenaW - 8));
    var py = arenaY + 4 + Math.floor(rng() * (arenaH - 8));
    for (var ppy = py; ppy < py + 3 && ppy < arenaY + arenaH - 1; ppy++) {
      for (var ppx = px; ppx < px + 3 && ppx < arenaX + arenaW - 1; ppx++) {
        grid[ppy][ppx] = TILE.WALL;
      }
    }
  }

  // 2x2 debris clusters
  var clusterCount = 2 + Math.floor(rng() * 3);
  for (var ci = 0; ci < clusterCount; ci++) {
    var cxx = arenaX + 3 + Math.floor(rng() * (arenaW - 6));
    var cyy = arenaY + 3 + Math.floor(rng() * (arenaH - 6));
    if (cyy + 1 < arenaY + arenaH && cxx + 1 < arenaX + arenaW) {
      grid[cyy][cxx] = TILE.WALL;
      grid[cyy][cxx + 1] = TILE.WALL;
      grid[cyy + 1][cxx] = TILE.WALL;
      grid[cyy + 1][cxx + 1] = TILE.WALL;
    }
  }

  return { grid: grid, rooms: rooms, spawnRoom: rooms[0], arenaRoom: rooms[1] };
}


// ---------------------------------------------------------------------------
// generateFloor — layout-aware floor generation with enemies, chests, traps, NPCs
// ---------------------------------------------------------------------------

function generateFloor(floorNum, seed, options) {
  var opts = options || {};
  var type = opts.type || 'rift';
  var totalFloors = opts.totalFloors || 0;
  var difficulty = DIFFICULTY_TIERS[opts.difficulty] || DIFFICULTY_TIERS.standard;

  // Create seeded RNG
  var floorSeed = chunkSeed(floorNum, 0, (type === 'cave' ? CAVE_SEED_PREFIX : RIFT_SEED_PREFIX) + seed);
  var rng = seededRandom(floorSeed);

  // Determine theme
  var theme = getThemeForFloor(floorNum, seed, opts);

  // Pick floor size based on floor number and type
  var sizeKey;
  if (type === 'cave') {
    if (floorNum <= 2) sizeKey = 'small';
    else if (floorNum <= 5) sizeKey = 'medium';
    else sizeKey = 'large';
  } else {
    if (floorNum <= 3)       sizeKey = 'small';
    else if (floorNum <= 8)  sizeKey = 'medium';
    else if (floorNum <= 15) sizeKey = 'large';
    else                     sizeKey = 'huge';
  }

  var sizeTable = (type === 'cave') ? CAVE_FLOOR_SIZE : RIFT_FLOOR_SIZE;
  var size = sizeTable[sizeKey];
  var width = size.width;
  var height = size.height;
  var minRooms = size.minRooms;
  var maxRooms = size.maxRooms;

  // Determine boss floor early (needed for layout selection)
  var isBossFloor = false;
  if (type === 'rift') {
    isBossFloor = (floorNum % 10 === 0);
  } else if (type === 'cave' && totalFloors > 0) {
    isBossFloor = (floorNum === totalFloors);
  }

  // Determine raid boss floor (every 50th rift floor)
  var isRaidBossFloor = false;
  if (type === 'rift' && floorNum > 0 && floorNum % 50 === 0) {
    isRaidBossFloor = true;
    isBossFloor = true; // Raid floors are also boss floors
  }

  // Select layout: raid floors use RAID_ARENA, boss floors use ARENA, otherwise theme-based
  var layout;
  if (isRaidBossFloor) {
    layout = FLOOR_LAYOUTS.RAID_ARENA;
    // Override size for raid arena
    width = RAID_FLOOR_SIZE.width;
    height = RAID_FLOOR_SIZE.height;
    minRooms = RAID_FLOOR_SIZE.minRooms;
    maxRooms = RAID_FLOOR_SIZE.maxRooms;
  } else {
    layout = isBossFloor ? FLOOR_LAYOUTS.ARENA : selectLayout(theme, rng);
  }

  // Generate grid + rooms using the selected layout generator
  var result = generateLayoutForFloor(layout, width, height, rng, minRooms, maxRooms);
  var grid = result.grid;
  var rooms = result.rooms;

  // Place doors at room-corridor transitions (max 2 per room)
  for (var di = 0; di < rooms.length; di++) {
    var room = rooms[di];
    var doorCount = 0;
    var doorMaxPerRoom = 2;

    // Check room perimeter for corridor adjacency
    for (var dy = room.y - 1; dy <= room.y + room.h && doorCount < doorMaxPerRoom; dy++) {
      for (var dx = room.x - 1; dx <= room.x + room.w && doorCount < doorMaxPerRoom; dx++) {
        // Only check edge cells
        if (dy === room.y - 1 || dy === room.y + room.h ||
            dx === room.x - 1 || dx === room.x + room.w) {
          if (dy >= 0 && dy < height && dx >= 0 && dx < width) {
            if (grid[dy][dx] === TILE.CORRIDOR) {
              // Verify this corridor cell is adjacent to a floor cell inside the room
              var adjFloor = false;
              var neighbors = [
                { nx: dx - 1, ny: dy }, { nx: dx + 1, ny: dy },
                { nx: dx, ny: dy - 1 }, { nx: dx, ny: dy + 1 },
              ];
              for (var ni = 0; ni < neighbors.length; ni++) {
                var n = neighbors[ni];
                if (n.nx >= room.x && n.nx < room.x + room.w &&
                    n.ny >= room.y && n.ny < room.y + room.h) {
                  adjFloor = true;
                  break;
                }
              }
              if (adjFloor) {
                grid[dy][dx] = TILE.DOOR;
                doorCount++;
              }
            }
          }
        }
      }
    }
  }

  // Place STAIRS_UP in first room center, STAIRS_DOWN in last room center
  var firstRoom = rooms[0];
  var lastRoom = rooms[rooms.length - 1];
  grid[firstRoom.centerY][firstRoom.centerX] = TILE.STAIRS_UP;

  if (floorNum === 1) {
    grid[firstRoom.centerY][firstRoom.centerX] = TILE.ENTRANCE;
  }

  grid[lastRoom.centerY][lastRoom.centerX] = TILE.STAIRS_DOWN;

  // If boss floor, replace a door in the last room with BOSS_DOOR
  if (isBossFloor) {
    grid[lastRoom.centerY][lastRoom.centerX] = TILE.EXIT;
    var bossDoored = false;
    for (var bdy = lastRoom.y - 1; bdy <= lastRoom.y + lastRoom.h && !bossDoored; bdy++) {
      for (var bdx = lastRoom.x - 1; bdx <= lastRoom.x + lastRoom.w && !bossDoored; bdx++) {
        if (bdy >= 0 && bdy < height && bdx >= 0 && bdx < width) {
          if (grid[bdy][bdx] === TILE.DOOR) {
            grid[bdy][bdx] = TILE.BOSS_DOOR;
            bossDoored = true;
          }
        }
      }
    }
  }

  // Determine enemy tier based on floor depth
  var enemyTier;
  if (isBossFloor) {
    enemyTier = 'boss';
  } else if (floorNum <= 3) {
    enemyTier = 'shallow';
  } else if (floorNum <= 7) {
    enemyTier = 'mid';
  } else {
    enemyTier = 'deep';
  }

  // Allow forced enemy pool from world dungeons (opts.enemyPool overrides theme-based)
  var effectivePoolTheme = (opts.enemyPool && ENEMY_POOLS[opts.enemyPool]) ? opts.enemyPool : theme;
  var pool = ENEMY_POOLS[effectivePoolTheme] || getEnemyPool(theme);

  // Place enemies, chests, traps, NPCs per room
  var enemies = [];
  var chests = [];
  var traps = [];
  var npcs = [];
  var campSpots = [];
  var corpses = [];
  var campsPlaced = 0;

  for (var ri2 = 0; ri2 < rooms.length; ri2++) {
    var rm = rooms[ri2];
    var isFirstRoom = (ri2 === 0);
    var isLastRoom = (ri2 === rooms.length - 1);

    // Skip enemy placement in the entrance room
    if (isFirstRoom) {
      // Place a camp spot in the first room (rift only)
      if (type === 'rift' && campsPlaced < CAMP_CONFIG.maxCampsPerFloor) {
        var campX = rm.x + 1 + Math.floor(rng() * (rm.w - 2));
        var campY = rm.y + 1 + Math.floor(rng() * (rm.h - 2));
        if (grid[campY][campX] === TILE.FLOOR) {
          grid[campY][campX] = TILE.CAMP_SPOT;
          campSpots.push({ x: campX, y: campY, roomIndex: ri2 });
          campsPlaced++;
        }
      }
      continue;
    }

    // Enemies: 2-5 per room (boss room on boss floor gets boss enemy)
    if (isLastRoom && isBossFloor) {
      var bossTemplates = pool.boss;
      if (bossTemplates && bossTemplates.length > 0) {
        var bossTemplate = bossTemplates[Math.floor(rng() * bossTemplates.length)];
        var boss = scaleBoss(bossTemplate, floorNum, effectivePoolTheme);

        // Apply difficulty scaling to boss
        if (difficulty.id !== 'standard') {
          boss.hp = Math.floor(boss.hp * difficulty.hpMult);
          boss.maxHp = boss.hp;
          boss.atk = Math.floor(boss.atk * difficulty.atkMult);
          boss.def = Math.floor(boss.def * difficulty.defMult);
          boss.xp = Math.floor(boss.xp * difficulty.xpMult);
          boss.gold = Math.floor(boss.gold * difficulty.goldMult);
        }

        boss.x = rm.centerX;
        boss.y = rm.centerY + 1;
        if (boss.y >= rm.y + rm.h) boss.y = rm.centerY;
        boss.difficulty = difficulty.id;
        enemies.push(boss);
      }
    } else {
      var tierEnemies = pool[enemyTier];
      if (!tierEnemies || tierEnemies.length === 0) tierEnemies = pool.shallow;
      var enemyCount = 2 + Math.floor(rng() * 4); // 2-5
      for (var ec = 0; ec < enemyCount; ec++) {
        var et = tierEnemies[Math.floor(rng() * tierEnemies.length)];
        var enemy = scaleEnemy(et, floorNum, effectivePoolTheme);

        // Rank promotion: roll for elite/rare/champion based on difficulty
        var rankRoll = rng();
        if (rankRoll < difficulty.championChance) {
          promoteEnemy(enemy, 'champion', null, rng);
        } else if (rankRoll < difficulty.championChance + difficulty.rareChance) {
          promoteEnemy(enemy, 'rare', null, rng);
        } else if (rankRoll < difficulty.championChance + difficulty.rareChance + difficulty.eliteChance) {
          promoteEnemy(enemy, 'elite', null, rng);
        }

        // Apply difficulty stat scaling
        if (difficulty.id !== 'standard') {
          enemy.hp = Math.floor(enemy.hp * difficulty.hpMult);
          enemy.maxHp = enemy.hp;
          enemy.atk = Math.floor(enemy.atk * difficulty.atkMult);
          enemy.def = Math.floor(enemy.def * difficulty.defMult);
          enemy.xp = Math.floor(enemy.xp * difficulty.xpMult);
          enemy.gold = Math.floor(enemy.gold * difficulty.goldMult);
        }

        // Place within room bounds (avoid center which might have stairs)
        enemy.x = rm.x + 1 + Math.floor(rng() * (rm.w - 2));
        enemy.y = rm.y + 1 + Math.floor(rng() * (rm.h - 2));
        enemies.push(enemy);
      }
    }

    // Chests: 0-1 per room (higher chance deeper)
    var chestChance = 0.15 + floorNum * 0.02;
    if (chestChance > 0.60) chestChance = 0.60;
    if (rng() < chestChance) {
      var chestX = rm.x + 1 + Math.floor(rng() * (rm.w - 2));
      var chestY = rm.y + 1 + Math.floor(rng() * (rm.h - 2));
      if (grid[chestY][chestX] === TILE.FLOOR) {
        grid[chestY][chestX] = TILE.CHEST;

        // Determine loot tier
        var tierRoll = rng();
        var lootTier;
        if (tierRoll < 0.50)      lootTier = 'common';
        else if (tierRoll < 0.80) lootTier = 'uncommon';
        else if (tierRoll < 0.95) lootTier = 'rare';
        else                      lootTier = 'legendary';

        var lootDef = CHEST_LOOT[lootTier];
        var chestGold = lootDef.goldMin + Math.floor(rng() * (lootDef.goldMax - lootDef.goldMin + 1));
        var chestResource = lootDef.resources[Math.floor(rng() * lootDef.resources.length)];
        var chestCard = rng() < lootDef.cardChance;

        chests.push({
          x: chestX,
          y: chestY,
          tier: lootTier,
          gold: chestGold,
          resource: chestResource,
          resourceAmount: 1 + Math.floor(rng() * 3),
          hasCard: chestCard,
          roomIndex: ri2,
          opened: false,
        });
      }
    }

    // Traps: 0-1 per room (deeper floors = more traps)
    var trapChance = 0.10 + floorNum * 0.015;
    if (trapChance > 0.45) trapChance = 0.45;
    if (rng() < trapChance) {
      var trapX = rm.x + 1 + Math.floor(rng() * (rm.w - 2));
      var trapY = rm.y + 1 + Math.floor(rng() * (rm.h - 2));
      if (grid[trapY][trapX] === TILE.FLOOR) {
        grid[trapY][trapX] = TILE.TRAP;
        var trapTypeKey = TRAP_TYPE_KEYS[Math.floor(rng() * TRAP_TYPE_KEYS.length)];
        var trapTypeDef = TRAP_TYPES[trapTypeKey];
        traps.push({
          x: trapX,
          y: trapY,
          type: trapTypeKey,
          name: trapTypeDef.name,
          damage: Math.floor(getTrapDamage(floorNum) * trapTypeDef.damageFactor),
          effect: trapTypeDef.effect || null,
          effectDuration: trapTypeDef.effectDuration || 0,
          tickDamage: trapTypeDef.tickDamage || 0,
          roomIndex: ri2,
          triggered: false,
        });
      }
    }

    // NPCs: 10% chance per room
    if (rng() < 0.10) {
      var npcTemplate = DUNGEON_NPCS[Math.floor(rng() * DUNGEON_NPCS.length)];
      var npcX = rm.x + 1 + Math.floor(rng() * (rm.w - 2));
      var npcY = rm.y + 1 + Math.floor(rng() * (rm.h - 2));
      npcs.push({
        id: npcTemplate.id,
        name: npcTemplate.name,
        dialogue: npcTemplate.dialogue,
        reward: npcTemplate.reward,
        questHook: npcTemplate.questHook,
        x: npcX,
        y: npcY,
        roomIndex: ri2,
        interacted: false,
      });
    }

    // Camp spots: place in a mid-floor room (rift only)
    if (type === 'rift' && campsPlaced < CAMP_CONFIG.maxCampsPerFloor) {
      var midRoom = Math.floor(rooms.length / 2);
      if (ri2 === midRoom) {
        var cx2 = rm.x + 1 + Math.floor(rng() * (rm.w - 2));
        var cy2 = rm.y + 1 + Math.floor(rng() * (rm.h - 2));
        if (grid[cy2][cx2] === TILE.FLOOR) {
          grid[cy2][cx2] = TILE.CAMP_SPOT;
          campSpots.push({ x: cx2, y: cy2, roomIndex: ri2 });
          campsPlaced++;
        }
      }
    }

    // Corpses / dead adventurers: 0-1 per room (no corpses on boss floors)
    if (!isBossFloor) {
      var corpseChance = 0.08 + floorNum * 0.01;
      if (corpseChance > 0.30) corpseChance = 0.30;
      if (rng() < corpseChance) {
        var corpseX = rm.x + 1 + Math.floor(rng() * (rm.w - 2));
        var corpseY = rm.y + 1 + Math.floor(rng() * (rm.h - 2));
        if (grid[corpseY][corpseX] === TILE.FLOOR) {
          grid[corpseY][corpseX] = TILE.CORPSE;
          // Select template: prefer theme-affinity matches
          var corpsePool = [];
          for (var cpi = 0; cpi < DUNGEON_CORPSES.length; cpi++) {
            var ct = DUNGEON_CORPSES[cpi];
            if (ct.themeAffinity === null || ct.themeAffinity.indexOf(theme) >= 0) {
              corpsePool.push(ct);
            }
          }
          if (corpsePool.length === 0) corpsePool = DUNGEON_CORPSES;
          var corpseTemplate = corpsePool[Math.floor(rng() * corpsePool.length)];
          // Scale gold with floor depth
          var corpseGoldMin = corpseTemplate.goldMin + (floorNum >= 10 ? Math.floor(floorNum * 0.5) : 0);
          var corpseGoldMax = corpseTemplate.goldMax + (floorNum >= 10 ? Math.floor(floorNum * 1.0) : 0);
          var corpseGold = corpseGoldMin + Math.floor(rng() * (corpseGoldMax - corpseGoldMin + 1));
          // Resource roll
          var corpseResource = null;
          var corpseResourceAmt = 0;
          if (rng() < corpseTemplate.resourceChance) {
            corpseResource = corpseTemplate.resources[Math.floor(rng() * corpseTemplate.resources.length)];
            corpseResourceAmt = 1 + Math.floor(rng() * 2);
            // Deeper floors: rarer resources from template pool
            if (floorNum >= 20 && corpseTemplate.resources.length > 1) {
              corpseResource = corpseTemplate.resources[Math.floor(rng() * corpseTemplate.resources.length)];
              corpseResourceAmt += 1;
            }
          }
          var corpseHasCard = rng() < corpseTemplate.cardChance;
          corpses.push({
            x: corpseX,
            y: corpseY,
            id: corpseTemplate.id,
            name: corpseTemplate.name,
            description: corpseTemplate.description,
            gold: corpseGold,
            resource: corpseResource,
            resourceAmount: corpseResourceAmt,
            hasCard: corpseHasCard,
            bookChanceMult: corpseTemplate.bookChanceMult,
            roomIndex: ri2,
            examined: false,
          });
        }
      }
    }
  }

  // Special events: 1% chance per floor
  var specialEvent = null;
  if (rng() < 0.01) {
    specialEvent = SPECIAL_EVENTS[Math.floor(rng() * SPECIAL_EVENTS.length)];
  }

  // Floor modifier: rolled per floor (none on floors 1-3)
  var floorModifier = selectFloorModifier(rng, floorNum);

  // Cap invisible enemies: 0 on floors 1-2, max 2 on floors 3+
  // Remove invisibility from excess enemies (convert them to normal enemies)
  if (floorNum < 3) {
    for (var ivi = 0; ivi < enemies.length; ivi++) {
      if (enemies[ivi].invisibility) enemies[ivi].invisibility = null;
    }
  } else {
    var invisCount = 0;
    var MAX_INVISIBLE_PER_FLOOR = 2;
    for (var ivi2 = 0; ivi2 < enemies.length; ivi2++) {
      if (enemies[ivi2].invisibility) {
        invisCount++;
        if (invisCount > MAX_INVISIBLE_PER_FLOOR) {
          enemies[ivi2].invisibility = null;
        }
      }
    }
  }

  // Build the floor object (without form interactables/animals yet — they need the full floor ref)
  var floorObj = {
    floorNum:     floorNum,
    seed:         floorSeed,
    type:         type,
    theme:        theme,
    layout:       layout,
    themeColors:  THEME_COLORS[theme] || THEME_COLORS.stone_keep,
    sizeKey:      sizeKey,
    width:        width,
    height:       height,
    grid:         grid,
    rooms:        rooms,
    enemies:      enemies,
    chests:       chests,
    traps:        traps,
    npcs:         npcs,
    corpses:      corpses,
    campSpots:    campSpots,
    isBossFloor:  isBossFloor,
    isRaidBossFloor: isRaidBossFloor,
    specialEvent: specialEvent,
    floorModifier: floorModifier,
    stairsUp:     { x: firstRoom.centerX, y: firstRoom.centerY },
    stairsDown:   { x: lastRoom.centerX, y: lastRoom.centerY },
    formInteractables: [],
    animalNpcs:   [],
  };

  // Generate form-gated interactables (1-3 per floor, floors 2+)
  floorObj.formInteractables = generateFormInteractables(floorObj, rng);

  // Generate ambient animal NPCs (0-2 per floor)
  floorObj.animalNpcs = generateAnimalNpcs(floorObj, rng);

  return floorObj;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Enemy loot tables — per tier, theme-aware drops
// ---------------------------------------------------------------------------

var ENEMY_LOOT = {
  shallow: {
    dropChance: 0.30,
    resources: ['wood', 'stone', 'iron_ore', 'herbs'],
    amountMin: 1, amountMax: 1,
    multiDropChance: 0.0,
    essenceChance: 0.15,
    essenceMin: 1, essenceMax: 1,
  },
  mid: {
    dropChance: 0.45,
    resources: ['iron_bar', 'bronze_ore', 'mushroom', 'gem_rough', 'copper_ore'],
    amountMin: 1, amountMax: 2,
    multiDropChance: 0.15,
    essenceChance: 0.25,
    essenceMin: 1, essenceMax: 2,
  },
  deep: {
    dropChance: 0.60,
    resources: ['bronze_bar', 'mana_crystal', 'gem_cut', 'silver_ore', 'dark_crystal'],
    amountMin: 1, amountMax: 3,
    multiDropChance: 0.25,
    essenceChance: 0.35,
    essenceMin: 1, essenceMax: 3,
  },
  boss: {
    dropChance: 1.0,
    resources: ['mana_crystal', 'gem_cut', 'dark_crystal', 'mithril_ore', 'gold_ore'],
    amountMin: 2, amountMax: 5,
    multiDropChance: 0.80,
    essenceChance: 1.0,
    essenceMin: 3, essenceMax: 8,
    alwaysBossTrophy: true,
  },
};

function rollEnemyLoot(enemy, floorNum, theme) {
  // Determine tier
  var tier;
  if (enemy.isBoss) tier = 'boss';
  else if (floorNum >= 15) tier = 'deep';
  else if (floorNum >= 6) tier = 'mid';
  else tier = 'shallow';

  var lootDef = ENEMY_LOOT[tier];
  var drops = [];

  // Roll main resource drop
  if (Math.random() < lootDef.dropChance) {
    var pool = lootDef.resources.slice();
    // Merge theme-specific resources
    var themeBonus = THEME_BONUS_LOOT[theme];
    if (themeBonus) {
      for (var i = 0; i < themeBonus.length; i++) {
        if (pool.indexOf(themeBonus[i]) === -1) pool.push(themeBonus[i]);
      }
    }

    var resource = pool[Math.floor(Math.random() * pool.length)];
    var amount = lootDef.amountMin + Math.floor(Math.random() * (lootDef.amountMax - lootDef.amountMin + 1));
    drops.push({ resource: resource, amount: amount });

    // Multi-drop chance: roll a second resource
    if (Math.random() < lootDef.multiDropChance) {
      var resource2 = pool[Math.floor(Math.random() * pool.length)];
      drops.push({ resource: resource2, amount: 1 });
    }
  }

  // Dungeon essence drop (separate roll)
  if (Math.random() < lootDef.essenceChance) {
    var essenceAmt = lootDef.essenceMin + Math.floor(Math.random() * (lootDef.essenceMax - lootDef.essenceMin + 1));
    // Scale with floor depth
    essenceAmt += Math.floor(floorNum / 10);
    drops.push({ resource: 'dungeon_essence', amount: essenceAmt });
  }

  // Boss always drops a trophy
  if (lootDef.alwaysBossTrophy) {
    drops.push({ resource: 'boss_trophy', amount: 1 });
  }

  return drops;
}

// ---------------------------------------------------------------------------
// Overworld arena generation — small arenas for FF-style instanced combat
// ---------------------------------------------------------------------------

function generateOverworldArena(biomeId, seed) {
  var ARENA_W = 16;
  var ARENA_H = 12;
  var rng = seededRandom(typeof seed === 'string' ? chunkSeed(0, 0, seed) : (seed || 1));

  var result = generateArenaLayout(ARENA_W, ARENA_H, rng, 1, 1);
  var grid = result.grid;
  var rooms = result.rooms;

  // Pick theme from biome — seeded random from full biome theme list for variety
  var biomeThemes = BIOME_DUNGEON_THEMES[biomeId] || ['stone_keep'];
  var themeName = biomeThemes[Math.floor(rng() * biomeThemes.length)] || 'stone_keep';
  var themeColors = THEME_COLORS[themeName] || THEME_COLORS.stone_keep;

  // Central room is always rooms[0]
  var central = rooms[0] || { x: 2, y: 2, w: 12, h: 8, centerX: 8, centerY: 6 };

  // Player entrance: bottom-center of central room
  var entranceX = central.centerX;
  var entranceY = central.y + central.h - 2;
  if (entranceY >= ARENA_H) entranceY = ARENA_H - 2;
  // Ensure entrance tile is floor
  if (grid[entranceY] && grid[entranceY][entranceX] !== TILE.FLOOR) {
    grid[entranceY][entranceX] = TILE.FLOOR;
  }

  // Enemy spawn: top-center of central room
  var enemyX = central.centerX;
  var enemyY = central.y + 1;
  if (enemyY < 0) enemyY = 1;
  if (grid[enemyY] && grid[enemyY][enemyX] !== TILE.FLOOR) {
    grid[enemyY][enemyX] = TILE.FLOOR;
  }

  return {
    grid: grid,
    themeColors: themeColors,
    themeName: themeName,
    rooms: rooms,
    width: ARENA_W,
    height: ARENA_H,
    entranceX: entranceX,
    entranceY: entranceY,
    enemyX: enemyX,
    enemyY: enemyY,
  };
}

// ---------------------------------------------------------------------------
// Overworld Structures — imported from dungeon-structures.js
// ---------------------------------------------------------------------------

var _structureData = require('./dungeon-structures');
var STRUCTURE_TYPES = _structureData.STRUCTURE_TYPES;
var STRUCTURE_ENEMY_POOLS = _structureData.STRUCTURE_ENEMY_POOLS;

// Register structure enemy pools into the main ENEMY_POOLS table so generateFloor()
// can resolve them via opts.enemyPool the same way world dungeons do.
var _structPoolKeys = Object.keys(STRUCTURE_ENEMY_POOLS);
for (var _spi = 0; _spi < _structPoolKeys.length; _spi++) {
  var _spk = _structPoolKeys[_spi];
  if (!ENEMY_POOLS[_spk]) {
    ENEMY_POOLS[_spk] = STRUCTURE_ENEMY_POOLS[_spk];
  }
}

// ---------------------------------------------------------------------------
// generateStructureFloor — wrapper around generateFloor() for overworld structures
// ---------------------------------------------------------------------------

/**
 * Generate a floor for an overworld structure dungeon.
 * @param {object} structDef - A STRUCTURE_TYPES entry (e.g. STRUCTURE_TYPES.BANDIT_CAMP)
 * @param {number} floorNum - Floor number (1-based)
 * @param {string} seed - Unique seed for this structure instance (e.g. structure ID)
 * @param {number} totalFloors - Total floors for this instance
 * @returns {object} floor object (same shape as generateFloor output)
 */
function generateStructureFloor(structDef, floorNum, seed, totalFloors) {
  if (!structDef) return null;
  totalFloors = totalFloors || structDef.floors.max;

  // Pick theme deterministically: use the structure's themes list
  var themeRng = seededRandom(chunkSeed(floorNum, 0, STRUCTURE_SEED_PREFIX + seed + ':theme'));
  var theme = structDef.themes[Math.floor(themeRng() * structDef.themes.length)];

  // Generate using the standard pipeline — type 'cave' for finite sizing
  var floor = generateFloor(floorNum, STRUCTURE_SEED_PREFIX + seed, {
    type: 'cave',
    isRift: false,
    biome: (structDef.biomes && structDef.biomes.length > 0) ? structDef.biomes[0] : 6,
    totalFloors: totalFloors,
    theme: theme,
    enemyPool: structDef.enemyPool,
    themeSeed: STRUCTURE_SEED_PREFIX + seed,
  });

  // Apply xp multiplier to all enemies
  if (floor && structDef.xpMultiplier && structDef.xpMultiplier !== 1.0) {
    for (var ei = 0; ei < floor.enemies.length; ei++) {
      floor.enemies[ei].xp = Math.floor((floor.enemies[ei].xp || 10) * structDef.xpMultiplier);
    }
  }

  // Apply loot tier bias to chests for structure difficulty
  if (floor && structDef.lootTier) {
    var tierBias = structDef.lootTier;
    for (var ci = 0; ci < floor.chests.length; ci++) {
      // Upgrade chests based on structure loot tier
      if (tierBias === 'uncommon' && floor.chests[ci].tier === 'common') {
        if (themeRng() < 0.4) floor.chests[ci].tier = 'uncommon';
      } else if (tierBias === 'rare') {
        if (floor.chests[ci].tier === 'common' && themeRng() < 0.5) floor.chests[ci].tier = 'uncommon';
        if (floor.chests[ci].tier === 'uncommon' && themeRng() < 0.3) floor.chests[ci].tier = 'rare';
      }
    }
  }

  // Mark rescuable NPCs if the structure type has them
  if (floor && structDef.rescueNpcs) {
    // Add a rescuable NPC to a mid-room if one doesn't already exist
    var rescueRng = seededRandom(chunkSeed(floorNum, 1, STRUCTURE_SEED_PREFIX + seed + ':rescue'));
    if (rescueRng() < 0.6 && floor.rooms.length > 2) {
      var rescueRoomIdx = 1 + Math.floor(rescueRng() * (floor.rooms.length - 2));
      var rescueRoom = floor.rooms[rescueRoomIdx];
      var rNpcX = rescueRoom.x + 1 + Math.floor(rescueRng() * Math.max(1, rescueRoom.w - 2));
      var rNpcY = rescueRoom.y + 1 + Math.floor(rescueRng() * Math.max(1, rescueRoom.h - 2));
      floor.npcs.push({
        id: 'captive_villager_' + floorNum,
        name: 'Captive Villager',
        dialogue: 'Thank the gods you found me! Please, take this as thanks for my rescue.',
        reward: { gold: 20 + floorNum * 10, xp: 30 + floorNum * 15 },
        questHook: null,
        x: rNpcX,
        y: rNpcY,
        roomIndex: rescueRoomIdx,
        interacted: false,
        rescuable: true,
      });
    }
  }

  return floor;
}

// ---------------------------------------------------------------------------
// Mini-Rift floor generation
// ---------------------------------------------------------------------------
// Themes progress: floors 1-5 hollow_breach, 6-14 shattered_veil, 15-20 desperation_core
// Final floor always ARENA layout with boss. Enemy stats scale with tier.

var MINI_RIFT_TIER_TABLE = [
  { maxFloors: 7,  tier: 1, difficulty: 'easy',    lootTier: 'uncommon',   xpMult: 1.2, minLevel: 5,  corruptionRadius: 3, lifetimeH: 4 },
  { maxFloors: 10, tier: 2, difficulty: 'medium',   lootTier: 'uncommon',   xpMult: 1.4, minLevel: 10, corruptionRadius: 4, lifetimeH: 5 },
  { maxFloors: 14, tier: 3, difficulty: 'hard',     lootTier: 'rare',       xpMult: 1.6, minLevel: 15, corruptionRadius: 5, lifetimeH: 6 },
  { maxFloors: 17, tier: 4, difficulty: 'hard',     lootTier: 'rare',       xpMult: 1.8, minLevel: 20, corruptionRadius: 5, lifetimeH: 7 },
  { maxFloors: 20, tier: 5, difficulty: 'extreme',  lootTier: 'ultra_rare', xpMult: 2.0, minLevel: 25, corruptionRadius: 6, lifetimeH: 8 },
];

var MINI_RIFT_BOSS_REWARDS = [
  { tier: 1, gold: 75,  darkCrystal: 3, purificationCrystal: 1, cardPacks: 1, xpBonus: 200 },
  { tier: 2, gold: 100, darkCrystal: 4, purificationCrystal: 1, cardPacks: 1, xpBonus: 400 },
  { tier: 3, gold: 150, darkCrystal: 5, purificationCrystal: 2, cardPacks: 2, xpBonus: 700 },
  { tier: 4, gold: 200, darkCrystal: 6, purificationCrystal: 2, cardPacks: 2, xpBonus: 1000 },
  { tier: 5, gold: 300, darkCrystal: 7, purificationCrystal: 3, cardPacks: 3, xpBonus: 1500 },
];

function getMiniRiftTier(totalFloors) {
  for (var i = 0; i < MINI_RIFT_TIER_TABLE.length; i++) {
    if (totalFloors <= MINI_RIFT_TIER_TABLE[i].maxFloors) return MINI_RIFT_TIER_TABLE[i];
  }
  return MINI_RIFT_TIER_TABLE[MINI_RIFT_TIER_TABLE.length - 1];
}

function getMiniRiftBossRewards(tier) {
  if (tier >= 1 && tier <= MINI_RIFT_BOSS_REWARDS.length) return MINI_RIFT_BOSS_REWARDS[tier - 1];
  return MINI_RIFT_BOSS_REWARDS[0];
}

function generateMiniRiftFloor(riftDef, floorNum, seed, totalFloors) {
  if (!riftDef) return null;
  totalFloors = totalFloors || riftDef.totalFloors || 10;

  // Select theme based on floor depth
  var theme;
  if (floorNum <= 5) theme = 'hollow_breach';
  else if (floorNum <= 14) theme = 'shattered_veil';
  else theme = 'desperation_core';

  var isFinalFloor = (floorNum === totalFloors);
  var tierInfo = getMiniRiftTier(totalFloors);
  var tierScale = 0.8 + (tierInfo.tier * 0.15);

  // Generate using the standard pipeline — type 'cave' for finite sizing
  var floor = generateFloor(floorNum, MINI_RIFT_SEED_PREFIX + seed, {
    type: 'cave',
    isRift: false,
    biome: 12, // WASTES — void terrain
    totalFloors: totalFloors,
    theme: theme,
    enemyPool: 'hollow_breach',
    themeSeed: MINI_RIFT_SEED_PREFIX + seed,
  });

  if (!floor) return null;

  // Scale enemy HP/ATK by tier
  for (var ei = 0; ei < floor.enemies.length; ei++) {
    var e = floor.enemies[ei];
    e.hp = Math.floor((e.hp || 30) * tierScale);
    e.atk = Math.floor((e.atk || 8) * tierScale);
    e.xp = Math.floor((e.xp || 10) * tierInfo.xpMult);
    e.gold = Math.floor((e.gold || 5) * tierScale);
  }

  // Upgrade chests based on rift loot tier
  var themeRng = seededRandom(chunkSeed(floorNum, 0, MINI_RIFT_SEED_PREFIX + seed + ':loot'));
  if (tierInfo.lootTier) {
    for (var ci = 0; ci < floor.chests.length; ci++) {
      if (tierInfo.lootTier === 'uncommon' && floor.chests[ci].tier === 'common') {
        if (themeRng() < 0.5) floor.chests[ci].tier = 'uncommon';
      } else if (tierInfo.lootTier === 'rare') {
        if (floor.chests[ci].tier === 'common' && themeRng() < 0.6) floor.chests[ci].tier = 'uncommon';
        if (floor.chests[ci].tier === 'uncommon' && themeRng() < 0.35) floor.chests[ci].tier = 'rare';
      } else if (tierInfo.lootTier === 'ultra_rare') {
        if (floor.chests[ci].tier === 'common') floor.chests[ci].tier = 'uncommon';
        if (floor.chests[ci].tier === 'uncommon' && themeRng() < 0.5) floor.chests[ci].tier = 'rare';
        if (floor.chests[ci].tier === 'rare' && themeRng() < 0.2) floor.chests[ci].tier = 'ultra_rare';
      }
    }
  }

  // Tag floor with mini-rift metadata
  floor.isMiniRift = true;
  floor.riftTier = tierInfo.tier;
  floor.isFinalFloor = isFinalFloor;

  return floor;
}

module.exports = {
  // Constants
  RIFT_SEED_PREFIX,
  CAVE_SEED_PREFIX,
  WORLD_DUNGEON_SEED_PREFIX,
  MINI_RIFT_SEED_PREFIX,
  MAX_FLOOR_CACHE,
  TILE_SIZE,
  RIFT_FLOOR_SIZE,
  CAVE_FLOOR_SIZE,
  RAID_FLOOR_SIZE,
  CAVE_FLOORS_BY_BIOME,
  BIOME_DUNGEON_THEMES,

  // Tiles
  TILE,

  // Themes
  CASTLE_THEMES,
  WILD_THEMES,
  THEME_COLORS,

  // Enemies
  ENEMY_DEFAULTS,
  ENEMY_POOLS,
  THEME_POOL_FALLBACK,
  THEME_ELEMENT_MAP,
  THEME_COMBAT_PROPERTIES,
  getEnemyPool,
  inferArchetype,
  scaleEnemy,

  // Boss Mechanics
  BOSS_MECHANICS,
  BOSS_MECHANIC_MAP,

  // Enemy Ranks & Class Templates
  ENEMY_RANKS,
  CLASS_TEMPLATES,
  CLASS_TEMPLATE_KEYS,
  promoteEnemy,

  // Difficulty
  DIFFICULTY_TIERS,
  scaleBoss,

  // Loot
  CHEST_LOOT,
  ENEMY_LOOT,
  THEME_BONUS_LOOT,
  rollEnemyLoot,
  getTrapDamage,

  // Traps
  TRAP_TYPES,
  TRAP_TYPE_KEYS,

  // Events, NPCs, Corpses & Floor Modifiers
  SPECIAL_EVENTS,
  DUNGEON_NPCS,
  DUNGEON_CORPSES,
  FLOOR_MODIFIERS,
  selectFloorModifier,

  // Progression
  GUILD_RANKS,
  QUEST_TEMPLATES,

  // Camp
  CAMP_CONFIG,

  // Dungeon Skill Perks
  DUNGEON_SKILL_PERKS,
  getDungeonSkillBonuses,

  // Layout system
  FLOOR_LAYOUTS,
  THEME_LAYOUT_MAP,
  selectLayout,

  // Generation functions
  getThemeForFloor,
  getCaveDepth,
  generateDailyQuests,
  generateFloor,
  generateOceanArenaLayout,
  generateOverworldArena,

  // Animal morphing exploration
  FORM_INTERACTABLES,
  FORM_INTERACTABLE_KEYS,
  THEME_FORM_INTERACTABLE_WEIGHTS,
  selectFormInteractable,
  generateFormInteractables,
  DUNGEON_ANIMALS,
  ANIMAL_SPEAK_CATEGORIES,
  ANIMAL_DIALOGUES,
  ANIMAL_DIALOGUE_DEFAULT,
  getAnimalDialogue,
  generateAnimalNpcs,

  // Overworld Structures
  STRUCTURE_SEED_PREFIX,
  STRUCTURE_TYPES,
  STRUCTURE_ENEMY_POOLS,
  generateStructureFloor,

  // Mini-Rift system
  MINI_RIFT_SEED_PREFIX,
  MINI_RIFT_TIER_TABLE,
  MINI_RIFT_BOSS_REWARDS,
  getMiniRiftTier,
  getMiniRiftBossRewards,
  generateMiniRiftFloor,
};
