// ---------------------------------------------------------------------------
// Overworld Structures — Procedural Enemy Camps & Strongholds
// ---------------------------------------------------------------------------
// Extracted from dungeon-data.js — pure data definitions for structure types
// and their enemy pools. Re-imported by dungeon-data.js at load time.

var STRUCTURE_TYPES = {
  BANDIT_CAMP: {
    id: 'bandit_camp', name: 'Bandit Camp', icon: 'camp',
    description: 'A makeshift camp of outlaws and thieves',
    floors: { min: 1, max: 3 }, difficulty: 'easy',
    themes: ['stone_keep', 'overgrown_temple'],
    enemyPool: 'bandits',
    lootTier: 'common', xpMultiplier: 0.8,
    biomes: [5, 6, 16, 4],
    spawnWeight: 30,
    minPlayerLevel: 1,
  },
  GOBLIN_WARREN: {
    id: 'goblin_warren', name: 'Goblin Warren', icon: 'cave',
    description: 'A network of crude tunnels infested with goblins',
    floors: { min: 2, max: 4 }, difficulty: 'easy',
    themes: ['crystal_cavern', 'flooded_ruins'],
    enemyPool: 'goblins',
    lootTier: 'common', xpMultiplier: 0.9,
    biomes: [5, 7, 2],
    spawnWeight: 25,
    minPlayerLevel: 1,
  },
  ORC_WARBAND: {
    id: 'orc_warband', name: 'Orc Warband Camp', icon: 'camp',
    description: 'A war camp of organized orc raiders',
    floors: { min: 2, max: 4 }, difficulty: 'medium',
    themes: ['stone_keep', 'bone_yard'],
    enemyPool: 'orcs',
    lootTier: 'uncommon', xpMultiplier: 1.0,
    biomes: [4, 6, 1],
    spawnWeight: 20,
    minPlayerLevel: 5,
  },
  UNDEAD_CRYPT: {
    id: 'undead_crypt', name: 'Risen Crypt', icon: 'crypt',
    description: 'An ancient burial site where the dead walk again',
    floors: { min: 3, max: 5 }, difficulty: 'medium',
    themes: ['catacombs', 'bone_yard'],
    enemyPool: 'undead',
    lootTier: 'uncommon', xpMultiplier: 1.1,
    biomes: [7, 12, 8],
    spawnWeight: 15,
    minPlayerLevel: 8,
  },
  CULTIST_SHRINE: {
    id: 'cultist_shrine', name: 'Cultist Shrine', icon: 'shrine',
    description: 'A dark temple where fanatics perform forbidden rituals',
    floors: { min: 2, max: 4 }, difficulty: 'medium',
    themes: ['shadow_realm', 'overgrown_temple'],
    enemyPool: 'cultists',
    lootTier: 'uncommon', xpMultiplier: 1.1,
    biomes: [7, 12, 5],
    spawnWeight: 15,
    minPlayerLevel: 8,
  },
  OCCUPIED_VILLAGE: {
    id: 'occupied_village', name: 'Occupied Village', icon: 'village',
    description: 'A peaceful village overrun by hostile forces',
    floors: { min: 2, max: 3 }, difficulty: 'medium',
    themes: ['stone_keep', 'overgrown_temple'],
    enemyPool: 'occupiers',
    lootTier: 'uncommon', xpMultiplier: 1.2,
    biomes: [6, 8, 16, 5],
    spawnWeight: 10,
    minPlayerLevel: 5,
    rescueNpcs: true,
  },
  DRAGON_LAIR: {
    id: 'dragon_lair', name: "Dragon's Lair", icon: 'dragon',
    description: 'A cavern claimed by a fearsome dragon and its minions',
    floors: { min: 3, max: 5 }, difficulty: 'hard',
    themes: ['lava_rift', 'crystal_cavern'],
    enemyPool: 'dragon_kin',
    lootTier: 'rare', xpMultiplier: 1.5,
    biomes: [2, 3, 14],
    spawnWeight: 5,
    minPlayerLevel: 15,
    hasBoss: true,
  },
  STRONGHOLD: {
    id: 'stronghold', name: 'Enemy Stronghold', icon: 'fortress',
    description: 'A fortified position held by a powerful warlord',
    floors: { min: 4, max: 6 }, difficulty: 'hard',
    themes: ['stone_keep', 'armory_vault'],
    enemyPool: 'stronghold_garrison',
    lootTier: 'rare', xpMultiplier: 1.4,
    biomes: [2, 4, 8, 6],
    spawnWeight: 8,
    minPlayerLevel: 12,
    hasBoss: true,
  },
  HAUNTED_CASTLE: {
    id: 'haunted_castle', name: 'Haunted Castle', icon: 'castle',
    description: 'An ancient castle overrun by spectral horrors',
    floors: { min: 4, max: 7 }, difficulty: 'hard',
    themes: ['shadow_realm', 'catacombs'],
    enemyPool: 'spectral',
    lootTier: 'rare', xpMultiplier: 1.5,
    biomes: [7, 12, 14],
    spawnWeight: 5,
    minPlayerLevel: 15,
    hasBoss: true,
  },
  PIRATE_COVE: {
    id: 'pirate_cove', name: 'Pirate Cove', icon: 'ship',
    description: 'A hidden coastal hideout for seafaring raiders',
    floors: { min: 2, max: 4 }, difficulty: 'medium',
    themes: ['coral_grotto', 'flooded_ruins'],
    enemyPool: 'pirates',
    lootTier: 'uncommon', xpMultiplier: 1.1,
    biomes: [13, 0],
    spawnWeight: 12,
    minPlayerLevel: 6,
  },
  MECHANICAL_OUTPOST: {
    id: 'mechanical_outpost', name: 'Rogue Automaton Foundry', icon: 'gear',
    description: 'A gnomish workshop overtaken by malfunctioning automatons',
    floors: { min: 2, max: 4 }, difficulty: 'medium',
    themes: ['clockwork_maze', 'armory_vault'],
    enemyPool: 'automatons',
    lootTier: 'uncommon', xpMultiplier: 1.2,
    biomes: [9, 10, 11],
    spawnWeight: 12,
    minPlayerLevel: 8,
  },
  FROST_ENCAMPMENT: {
    id: 'frost_encampment', name: 'Frost Giant Encampment', icon: 'camp',
    description: 'A camp of frost giants and their icy thralls',
    floors: { min: 3, max: 5 }, difficulty: 'hard',
    themes: ['frozen_depths', 'stone_keep'],
    enemyPool: 'frost_giants',
    lootTier: 'rare', xpMultiplier: 1.3,
    biomes: [14, 15],
    spawnWeight: 8,
    minPlayerLevel: 12,
    hasBoss: true,
  },
  DESERT_TOMB: {
    id: 'desert_tomb', name: 'Awakened Tomb', icon: 'crypt',
    description: 'An ancient pharaoh rises from a sand-buried tomb',
    floors: { min: 3, max: 5 }, difficulty: 'hard',
    themes: ['sand_tomb', 'overgrown_temple'],
    enemyPool: 'tomb_guardians',
    lootTier: 'rare', xpMultiplier: 1.3,
    biomes: [1, 3],
    spawnWeight: 8,
    minPlayerLevel: 12,
    hasBoss: true,
  },
};

// Enemy pools for overworld structures — shallow/mid/deep/boss tiers matching existing pool format
var STRUCTURE_ENEMY_POOLS = {
  bandits: {
    shallow: [
      { id: 'st_bandit_scout',    name: 'Bandit Scout',    hp: 30,  atk: 8,  def: 3,  xp: 15, gold: 5,  type: 'humanoid' },
      { id: 'st_bandit_thug',     name: 'Bandit Thug',     hp: 45,  atk: 12, def: 5,  xp: 22, gold: 8,  type: 'humanoid' },
    ],
    mid: [
      { id: 'st_bandit_archer',   name: 'Bandit Archer',   hp: 35,  atk: 14, def: 3,  xp: 20, gold: 8,  type: 'humanoid', archetype: 'ranged' },
      { id: 'st_bandit_enforcer', name: 'Bandit Enforcer', hp: 55,  atk: 15, def: 7,  xp: 28, gold: 12, type: 'humanoid' },
    ],
    deep: [
      { id: 'st_bandit_lt',       name: 'Bandit Lieutenant', hp: 70,  atk: 18, def: 9,  xp: 38, gold: 18, type: 'humanoid' },
    ],
    boss: [
      { id: 'st_bandit_captain',  name: 'Bandit Captain',  hp: 120, atk: 22, def: 10, xp: 80, gold: 45, type: 'humanoid' },
    ],
  },
  goblins: {
    shallow: [
      { id: 'st_goblin_skulker',   name: 'Goblin Skulker',    hp: 20,  atk: 6,  def: 2,  xp: 10, gold: 3,  type: 'humanoid' },
      { id: 'st_goblin_scrapper',  name: 'Goblin Scrapper',   hp: 28,  atk: 8,  def: 3,  xp: 14, gold: 5,  type: 'humanoid' },
    ],
    mid: [
      { id: 'st_goblin_shaman',   name: 'Goblin Shaman',     hp: 25,  atk: 10, def: 2,  xp: 18, gold: 8,  type: 'humanoid', archetype: 'controller' },
      { id: 'st_goblin_berserker', name: 'Goblin Berserker', hp: 40,  atk: 14, def: 4,  xp: 25, gold: 10, type: 'humanoid' },
    ],
    deep: [
      { id: 'st_goblin_warchief', name: 'Goblin Warchief',   hp: 55,  atk: 16, def: 6,  xp: 32, gold: 15, type: 'humanoid' },
    ],
    boss: [
      { id: 'st_goblin_king',     name: 'Goblin Chieftain',  hp: 100, atk: 20, def: 8, xp: 65, gold: 40, type: 'humanoid' },
    ],
  },
  orcs: {
    shallow: [
      { id: 'st_orc_grunt',       name: 'Orc Grunt',         hp: 50,  atk: 14, def: 6,  xp: 22, gold: 8,  type: 'humanoid' },
      { id: 'st_orc_shield',      name: 'Orc Shieldbearer',  hp: 65,  atk: 10, def: 12, xp: 25, gold: 10, type: 'humanoid', archetype: 'bruiser' },
    ],
    mid: [
      { id: 'st_orc_warpriest',   name: 'Orc Warpriest',     hp: 45,  atk: 16, def: 5,  xp: 28, gold: 12, type: 'humanoid', archetype: 'support' },
      { id: 'st_orc_brute',       name: 'Orc Brute',         hp: 75,  atk: 18, def: 8,  xp: 32, gold: 14, type: 'humanoid' },
    ],
    deep: [
      { id: 'st_orc_champion',    name: 'Orc Champion',      hp: 95,  atk: 22, def: 10, xp: 45, gold: 22, type: 'humanoid', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_orc_warlord',     name: 'Orc Warlord',       hp: 160, atk: 26, def: 12, xp: 100, gold: 60, type: 'humanoid' },
    ],
  },
  undead: {
    shallow: [
      { id: 'st_skeleton',        name: 'Skeleton Warrior',   hp: 30,  atk: 10, def: 8,  xp: 18, gold: 6,  type: 'undead' },
      { id: 'st_zombie',          name: 'Zombie Shambler',    hp: 55,  atk: 8,  def: 4,  xp: 16, gold: 4,  type: 'undead' },
    ],
    mid: [
      { id: 'st_wraith',          name: 'Wraith',             hp: 35,  atk: 16, def: 2,  xp: 28, gold: 12, type: 'undead', archetype: 'skirmisher', invisibility: { type: 'spectral', detectableBy: ['magic_sense', 'true_seeing', 'echolocation'] } },
      { id: 'st_ghoul',           name: 'Ravenous Ghoul',     hp: 50,  atk: 14, def: 5,  xp: 24, gold: 10, type: 'undead' },
    ],
    deep: [
      { id: 'st_death_knight',    name: 'Death Knight',       hp: 80,  atk: 20, def: 10, xp: 42, gold: 20, type: 'undead', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_lich_acolyte',    name: 'Lich Acolyte',       hp: 140, atk: 24, def: 8, xp: 90, gold: 50, type: 'undead' },
    ],
  },
  cultists: {
    shallow: [
      { id: 'st_cultist_init',    name: 'Cultist Initiate',   hp: 28,  atk: 10, def: 3,  xp: 16, gold: 5,  type: 'humanoid' },
      { id: 'st_cultist_fanatic', name: 'Cultist Fanatic',    hp: 50,  atk: 15, def: 6,  xp: 25, gold: 10, type: 'humanoid' },
    ],
    mid: [
      { id: 'st_cultist_sorc',    name: 'Cultist Sorcerer',   hp: 35,  atk: 18, def: 4,  xp: 28, gold: 12, type: 'humanoid', archetype: 'controller' },
      { id: 'st_cultist_guard',   name: 'Shrine Guardian',    hp: 60,  atk: 14, def: 8,  xp: 26, gold: 10, type: 'humanoid' },
    ],
    deep: [
      { id: 'st_cultist_arch',    name: 'Cult Archon',        hp: 75,  atk: 22, def: 7,  xp: 42, gold: 20, type: 'humanoid', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_dark_priest',     name: 'Dark Priest',        hp: 150, atk: 26, def: 10, xp: 95, gold: 55, type: 'humanoid' },
    ],
  },
  occupiers: {
    shallow: [
      { id: 'st_raider_scout',    name: 'Raider Scout',       hp: 35,  atk: 10, def: 4,  xp: 18, gold: 6,  type: 'humanoid' },
      { id: 'st_raider_brute',    name: 'Raider Brute',       hp: 55,  atk: 14, def: 7,  xp: 25, gold: 10, type: 'humanoid' },
    ],
    mid: [
      { id: 'st_enslaved',        name: 'Enslaved Villager',  hp: 20,  atk: 4,  def: 2,  xp: 5,  gold: 0,  type: 'humanoid', passive: true, rescuable: true },
      { id: 'st_raider_sgt',      name: 'Raider Sergeant',    hp: 65,  atk: 16, def: 8,  xp: 30, gold: 14, type: 'humanoid' },
    ],
    deep: [
      { id: 'st_raider_elite',    name: 'Raider Elite',       hp: 80,  atk: 20, def: 10, xp: 40, gold: 20, type: 'humanoid', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_raider_warchief', name: 'Raider Warchief',    hp: 140, atk: 24, def: 11, xp: 85, gold: 50, type: 'humanoid' },
    ],
  },
  dragon_kin: {
    shallow: [
      { id: 'st_kobold',          name: 'Kobold Servant',     hp: 25,  atk: 8,  def: 3,  xp: 14, gold: 5,  type: 'draconic' },
      { id: 'st_drake_whelp',     name: 'Drake Whelp',        hp: 40,  atk: 12, def: 6,  xp: 20, gold: 8,  type: 'draconic' },
    ],
    mid: [
      { id: 'st_drake_guard',     name: 'Drake Guard',        hp: 70,  atk: 18, def: 10, xp: 35, gold: 16, type: 'draconic', archetype: 'bruiser' },
      { id: 'st_dragonkin_sorc',  name: 'Dragonkin Sorcerer', hp: 55,  atk: 22, def: 6,  xp: 40, gold: 18, type: 'draconic', archetype: 'controller' },
    ],
    deep: [
      { id: 'st_drake_elite',     name: 'Elder Drake',        hp: 110, atk: 25, def: 14, xp: 55, gold: 28, type: 'draconic', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_young_dragon',    name: 'Young Dragon',       hp: 280, atk: 34, def: 18, xp: 180, gold: 100, type: 'draconic' },
    ],
  },
  stronghold_garrison: {
    shallow: [
      { id: 'st_guard_recruit',   name: 'Guard Recruit',      hp: 40,  atk: 10, def: 7,  xp: 18, gold: 6,  type: 'humanoid' },
      { id: 'st_guard_spear',     name: 'Spearman',           hp: 45,  atk: 13, def: 6,  xp: 20, gold: 8,  type: 'humanoid' },
    ],
    mid: [
      { id: 'st_elite_guard',     name: 'Elite Guard',        hp: 65,  atk: 16, def: 10, xp: 30, gold: 14, type: 'humanoid' },
      { id: 'st_battle_mage',     name: 'Battle Mage',        hp: 50,  atk: 20, def: 5,  xp: 35, gold: 16, type: 'humanoid', archetype: 'controller' },
    ],
    deep: [
      { id: 'st_fortress_knight', name: 'Fortress Knight',    hp: 100, atk: 22, def: 14, xp: 50, gold: 24, type: 'humanoid', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_dark_warlord',    name: 'Dark Warlord',       hp: 220, atk: 30, def: 16, xp: 140, gold: 80, type: 'humanoid' },
    ],
  },
  spectral: {
    shallow: [
      { id: 'st_lost_spirit',     name: 'Lost Spirit',        hp: 30,  atk: 12, def: 2,  xp: 20, gold: 6,  type: 'undead', invisibility: { type: 'spectral', detectableBy: ['magic_sense', 'true_seeing'] } },
      { id: 'st_phantom_soldier', name: 'Phantom Soldier',    hp: 45,  atk: 14, def: 6,  xp: 24, gold: 8,  type: 'undead' },
    ],
    mid: [
      { id: 'st_phantom_knight',  name: 'Phantom Knight',     hp: 60,  atk: 18, def: 8,  xp: 35, gold: 14, type: 'undead', archetype: 'bruiser' },
      { id: 'st_banshee',         name: 'Banshee',            hp: 45,  atk: 22, def: 3,  xp: 38, gold: 16, type: 'undead', archetype: 'controller' },
    ],
    deep: [
      { id: 'st_spectral_warden', name: 'Spectral Warden',    hp: 90,  atk: 24, def: 12, xp: 50, gold: 24, type: 'undead', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_death_lord',      name: 'Death Knight Lord',  hp: 240, atk: 32, def: 16, xp: 150, gold: 90, type: 'undead' },
    ],
  },
  pirates: {
    shallow: [
      { id: 'st_pirate_deck',     name: 'Pirate Deckhand',    hp: 35,  atk: 10, def: 4,  xp: 16, gold: 6,  type: 'humanoid' },
      { id: 'st_pirate_gunner',   name: 'Pirate Gunner',      hp: 40,  atk: 16, def: 3,  xp: 22, gold: 10, type: 'humanoid', archetype: 'ranged' },
    ],
    mid: [
      { id: 'st_pirate_mate',     name: 'First Mate',         hp: 70,  atk: 18, def: 8,  xp: 38, gold: 16, type: 'humanoid' },
      { id: 'st_pirate_bomb',     name: 'Pirate Bombardier',  hp: 45,  atk: 20, def: 4,  xp: 30, gold: 14, type: 'humanoid', archetype: 'ranged' },
    ],
    deep: [
      { id: 'st_pirate_boatswn',  name: 'Pirate Boatswain',   hp: 85,  atk: 22, def: 10, xp: 45, gold: 22, type: 'humanoid', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_pirate_captain',  name: 'Pirate Captain',     hp: 160, atk: 26, def: 12, xp: 100, gold: 60, type: 'humanoid' },
    ],
  },
  automatons: {
    shallow: [
      { id: 'st_rogue_clock',     name: 'Rogue Clockwork',    hp: 45,  atk: 12, def: 10, xp: 22, gold: 8,  type: 'construct' },
      { id: 'st_haywire_turret',  name: 'Haywire Turret',     hp: 30,  atk: 20, def: 12, xp: 28, gold: 12, type: 'construct', archetype: 'ranged' },
    ],
    mid: [
      { id: 'st_steel_golem',     name: 'Steel Golem',        hp: 80,  atk: 16, def: 14, xp: 35, gold: 16, type: 'construct', archetype: 'bruiser' },
      { id: 'st_spark_drone',     name: 'Spark Drone',        hp: 35,  atk: 18, def: 8,  xp: 26, gold: 12, type: 'construct' },
    ],
    deep: [
      { id: 'st_mech_guardian',   name: 'Mech Guardian',      hp: 100, atk: 22, def: 16, xp: 48, gold: 24, type: 'construct', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_corrupted_core',  name: 'Corrupted Core',     hp: 190, atk: 28, def: 14, xp: 120, gold: 70, type: 'construct' },
    ],
  },
  frost_giants: {
    shallow: [
      { id: 'st_ice_troll',       name: 'Ice Troll',          hp: 55,  atk: 14, def: 6,  xp: 24, gold: 8,  type: 'giant' },
      { id: 'st_frost_elem',      name: 'Frost Elemental',    hp: 45,  atk: 18, def: 8,  xp: 28, gold: 12, type: 'elemental', archetype: 'controller' },
    ],
    mid: [
      { id: 'st_frost_warrior',   name: 'Frost Giant Warrior', hp: 100, atk: 22, def: 12, xp: 45, gold: 20, type: 'giant', archetype: 'bruiser' },
      { id: 'st_ice_shaman',      name: 'Ice Shaman',         hp: 60,  atk: 20, def: 6,  xp: 35, gold: 16, type: 'giant', archetype: 'support' },
    ],
    deep: [
      { id: 'st_frost_guard',     name: 'Frost Giant Guard',  hp: 130, atk: 26, def: 14, xp: 58, gold: 28, type: 'giant', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_frost_jarl',      name: 'Frost Giant Jarl',   hp: 260, atk: 32, def: 16, xp: 160, gold: 100, type: 'giant' },
    ],
  },
  tomb_guardians: {
    shallow: [
      { id: 'st_sand_scarab',     name: 'Sand Scarab',        hp: 25,  atk: 8,  def: 6,  xp: 14, gold: 4,  type: 'beast' },
      { id: 'st_mummy_soldier',   name: 'Mummified Soldier',  hp: 50,  atk: 14, def: 10, xp: 26, gold: 10, type: 'undead' },
    ],
    mid: [
      { id: 'st_tomb_golem',      name: 'Tomb Guardian Golem', hp: 75, atk: 18, def: 14, xp: 38, gold: 18, type: 'construct', archetype: 'bruiser' },
      { id: 'st_sand_wraith',     name: 'Sand Wraith',        hp: 40,  atk: 16, def: 4,  xp: 28, gold: 12, type: 'undead', archetype: 'skirmisher' },
    ],
    deep: [
      { id: 'st_anubis_guard',    name: 'Anubis Guardian',    hp: 110, atk: 24, def: 12, xp: 52, gold: 26, type: 'construct', archetype: 'elite' },
    ],
    boss: [
      { id: 'st_risen_pharaoh',   name: 'Risen Pharaoh',      hp: 250, atk: 30, def: 14, xp: 155, gold: 95, type: 'undead' },
    ],
  },
};

module.exports = { STRUCTURE_TYPES, STRUCTURE_ENEMY_POOLS };
