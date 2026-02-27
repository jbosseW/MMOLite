// dungeon-themes.js
// Theme data for dungeon generation — biome mappings, colors, element/combat
// properties, layouts, enemy pool fallbacks, and bonus loot tables.
// Extracted from dungeon-data.js. Helper functions selectLayout and getEnemyPool
// receive FLOOR_LAYOUTS and ENEMY_POOLS via the init() binding.

// ---------------------------------------------------------------------------
// Theme category lists
// ---------------------------------------------------------------------------

var CASTLE_THEMES = [
  'stone_keep',
  'grand_hall',
  'armory_vault',
  'throne_dungeon',
  'catacombs',
  'iron_forge',
  'haunted_manor',
];

var WILD_THEMES = [
  'crystal_cavern',
  'fungal_forest',
  'lava_rift',
  'frozen_depths',
  'flooded_ruins',
  'floating_islands',
  'bone_yard',
  'shadow_realm',
  'overgrown_temple',
  'clockwork_maze',
  'sand_tomb',
  'coral_grotto',
  'void_debris',
  'ancient_library',
  'tidal_vault',
  'plague_warren',
  'elven_reliquary',
  'gnomish_workshop',
  'orc_barrow',
  'mirage_palace',
  'frost_citadel',
  'goblin_warrens',
  'ashen_observatory',
  'sunken_cathedral',
  'puzzle_labyrinth',
  'celestial_spire',
  'infernal_pit',
  'dragons_den',
  'vampire_castle',
  'lich_sanctum',
  'cogwork_foundry',
  'astral_rift',
  'dinosaur_jungle',
  'spider_hive',
  'sunken_depths',
  'abyssal_dark',
  'werewolf_den',
  'troll_caves',
  'ruined_village',
];

// ---------------------------------------------------------------------------
// Biome to dungeon theme mapping (merged initial + extensions)
// ---------------------------------------------------------------------------

var BIOME_DUNGEON_THEMES = {
  0:  ['coral_grotto', 'flooded_ruins', 'tidal_vault', 'sunken_depths'],
  1:  ['sand_tomb', 'ancient_library', 'mirage_palace'],
  2:  ['crystal_cavern', 'frozen_depths', 'iron_forge', 'ashen_observatory', 'frost_citadel', 'puzzle_labyrinth', 'infernal_pit', 'dragons_den', 'spider_hive', 'abyssal_dark', 'troll_caves'],
  3:  ['lava_rift', 'sand_tomb', 'mirage_palace', 'ashen_observatory', 'infernal_pit', 'dragons_den'],
  4:  ['bone_yard', 'shadow_realm', 'orc_barrow', 'lich_sanctum', 'abyssal_dark', 'werewolf_den', 'troll_caves'],
  5:  ['fungal_forest', 'overgrown_temple', 'elven_reliquary', 'goblin_warrens', 'plague_warren', 'dinosaur_jungle', 'spider_hive', 'werewolf_den', 'troll_caves', 'ruined_village'],
  6:  ['stone_keep', 'overgrown_temple', 'haunted_manor', 'vampire_castle', 'werewolf_den', 'ruined_village'],
  7:  ['flooded_ruins', 'fungal_forest', 'plague_warren', 'sunken_cathedral', 'goblin_warrens', 'vampire_castle', 'dinosaur_jungle', 'spider_hive'],
  8:  ['catacombs', 'throne_dungeon', 'sunken_cathedral', 'haunted_manor', 'puzzle_labyrinth', 'celestial_spire', 'vampire_castle', 'lich_sanctum', 'ruined_village'],
  9:  ['clockwork_maze', 'crystal_cavern', 'gnomish_workshop', 'tidal_vault', 'puzzle_labyrinth', 'cogwork_foundry'],
  10: ['clockwork_maze', 'armory_vault', 'gnomish_workshop', 'iron_forge', 'cogwork_foundry'],
  11: ['clockwork_maze', 'coral_grotto', 'gnomish_workshop', 'tidal_vault', 'cogwork_foundry'],
  12: ['bone_yard', 'sand_tomb', 'orc_barrow', 'goblin_warrens', 'ashen_observatory', 'infernal_pit', 'lich_sanctum', 'astral_rift', 'abyssal_dark'],
  13: ['coral_grotto', 'flooded_ruins', 'tidal_vault', 'sunken_depths'],
  14: ['frozen_depths', 'crystal_cavern', 'frost_citadel', 'dragons_den'],
  15: ['bone_yard', 'shadow_realm', 'ashen_observatory', 'orc_barrow', 'astral_rift'],
  16: ['overgrown_temple', 'fungal_forest', 'elven_reliquary', 'celestial_spire', 'dinosaur_jungle'],
};

// ---------------------------------------------------------------------------
// Theme colors: { wall, floor, accent } each { r, g, b } (0-255)
// Merged initial definitions + extensions for new themes
// ---------------------------------------------------------------------------

var THEME_COLORS = {
  stone_keep:        { wall: { r: 90, g: 85, b: 80 },   floor: { r: 140, g: 130, b: 120 }, accent: { r: 180, g: 160, b: 100 } },
  grand_hall:        { wall: { r: 100, g: 90, b: 75 },   floor: { r: 170, g: 155, b: 130 }, accent: { r: 220, g: 190, b: 80  } },
  armory_vault:      { wall: { r: 70, g: 70, b: 80 },    floor: { r: 120, g: 115, b: 125 }, accent: { r: 160, g: 140, b: 180 } },
  throne_dungeon:    { wall: { r: 60, g: 50, b: 65 },    floor: { r: 110, g: 95, b: 115 },  accent: { r: 200, g: 170, b: 50  } },
  catacombs:         { wall: { r: 55, g: 50, b: 45 },    floor: { r: 100, g: 90, b: 80 },   accent: { r: 180, g: 180, b: 160 } },
  crystal_cavern:    { wall: { r: 40, g: 55, b: 90 },    floor: { r: 80, g: 110, b: 160 },  accent: { r: 140, g: 200, b: 255 } },
  fungal_forest:     { wall: { r: 35, g: 55, b: 35 },    floor: { r: 70, g: 100, b: 60 },   accent: { r: 150, g: 220, b: 100 } },
  lava_rift:         { wall: { r: 60, g: 30, b: 20 },    floor: { r: 110, g: 55, b: 35 },   accent: { r: 255, g: 120, b: 30  } },
  frozen_depths:     { wall: { r: 70, g: 85, b: 100 },   floor: { r: 140, g: 170, b: 200 }, accent: { r: 200, g: 230, b: 255 } },
  flooded_ruins:     { wall: { r: 45, g: 60, b: 70 },    floor: { r: 80, g: 110, b: 130 },  accent: { r: 100, g: 180, b: 200 } },
  floating_islands:  { wall: { r: 80, g: 75, b: 100 },   floor: { r: 150, g: 140, b: 180 }, accent: { r: 200, g: 180, b: 255 } },
  bone_yard:         { wall: { r: 65, g: 60, b: 55 },    floor: { r: 130, g: 120, b: 105 }, accent: { r: 200, g: 190, b: 170 } },
  shadow_realm:      { wall: { r: 25, g: 20, b: 35 },    floor: { r: 50, g: 40, b: 65 },    accent: { r: 120, g: 60, b: 180  } },
  overgrown_temple:  { wall: { r: 50, g: 70, b: 45 },    floor: { r: 95, g: 125, b: 80 },   accent: { r: 180, g: 200, b: 80  } },
  clockwork_maze:    { wall: { r: 85, g: 75, b: 60 },    floor: { r: 150, g: 135, b: 110 }, accent: { r: 200, g: 170, b: 60  } },
  sand_tomb:         { wall: { r: 130, g: 115, b: 80 },  floor: { r: 190, g: 170, b: 120 }, accent: { r: 220, g: 200, b: 100 } },
  coral_grotto:      { wall: { r: 40, g: 70, b: 85 },    floor: { r: 80, g: 130, b: 150 },  accent: { r: 255, g: 130, b: 140 } },
  void_debris:       { wall: { r: 15, g: 10, b: 25 },    floor: { r: 35, g: 25, b: 50 },    accent: { r: 100, g: 50, b: 200  } },
  ancient_library:   { wall: { r: 70, g: 55, b: 40 },    floor: { r: 130, g: 110, b: 85 },  accent: { r: 180, g: 150, b: 60  } },
  ocean_arena:       { wall: { r: 20, g: 40, b: 70 },    floor: { r: 40, g: 80, b: 120 },   accent: { r: 60, g: 180, b: 200  } },
  iron_forge:        { wall: { r: 65, g: 60, b: 55 },    floor: { r: 115, g: 105, b: 95 },  accent: { r: 255, g: 140, b: 20  } },
  haunted_manor:     { wall: { r: 75, g: 65, b: 80 },    floor: { r: 130, g: 120, b: 125 }, accent: { r: 120, g: 220, b: 120 } },
  tidal_vault:       { wall: { r: 30, g: 55, b: 75 },    floor: { r: 60, g: 100, b: 130 },  accent: { r: 50, g: 230, b: 200  } },
  plague_warren:     { wall: { r: 60, g: 55, b: 30 },    floor: { r: 105, g: 95, b: 55 },   accent: { r: 130, g: 200, b: 40  } },
  elven_reliquary:   { wall: { r: 100, g: 105, b: 85 },  floor: { r: 180, g: 185, b: 160 }, accent: { r: 200, g: 180, b: 60  } },
  gnomish_workshop:  { wall: { r: 100, g: 85, b: 55 },   floor: { r: 155, g: 135, b: 90 },  accent: { r: 60, g: 180, b: 255  } },
  orc_barrow:        { wall: { r: 80, g: 45, b: 35 },    floor: { r: 140, g: 110, b: 90 },  accent: { r: 200, g: 60, b: 40   } },
  mirage_palace:     { wall: { r: 155, g: 130, b: 90 },  floor: { r: 210, g: 190, b: 150 }, accent: { r: 255, g: 215, b: 60  } },
  frost_citadel:     { wall: { r: 50, g: 70, b: 105 },   floor: { r: 130, g: 160, b: 200 }, accent: { r: 210, g: 235, b: 255 } },
  goblin_warrens:    { wall: { r: 65, g: 50, b: 35 },    floor: { r: 115, g: 90, b: 65 },   accent: { r: 100, g: 200, b: 60  } },
  ashen_observatory: { wall: { r: 45, g: 40, b: 38 },    floor: { r: 95, g: 88, b: 82 },    accent: { r: 255, g: 80, b: 30   } },
  sunken_cathedral:  { wall: { r: 60, g: 70, b: 60 },    floor: { r: 110, g: 120, b: 105 }, accent: { r: 180, g: 160, b: 55  } },
  puzzle_labyrinth:  { wall: { r: 80, g: 80, b: 90 },    floor: { r: 150, g: 145, b: 155 }, accent: { r: 80, g: 120, b: 200  } },
  celestial_spire:   { wall: { r: 210, g: 205, b: 200 }, floor: { r: 200, g: 185, b: 140 }, accent: { r: 255, g: 220, b: 100 } },
  infernal_pit:      { wall: { r: 30, g: 15, b: 15 },    floor: { r: 70, g: 40, b: 25 },    accent: { r: 255, g: 100, b: 20  } },
  dragons_den:       { wall: { r: 60, g: 45, b: 35 },    floor: { r: 130, g: 110, b: 60 },  accent: { r: 255, g: 160, b: 30  } },
  vampire_castle:    { wall: { r: 45, g: 15, b: 20 },    floor: { r: 80, g: 65, b: 70 },    accent: { r: 180, g: 30, b: 40   } },
  lich_sanctum:      { wall: { r: 40, g: 25, b: 50 },    floor: { r: 120, g: 115, b: 105 }, accent: { r: 80, g: 200, b: 60   } },
  cogwork_foundry:   { wall: { r: 100, g: 75, b: 40 },   floor: { r: 130, g: 125, b: 120 }, accent: { r: 200, g: 210, b: 220 } },
  astral_rift:       { wall: { r: 10, g: 5, b: 30 },     floor: { r: 50, g: 30, b: 80 },    accent: { r: 180, g: 200, b: 255 } },
  hollow_breach:     { wall: { r: 20, g: 5, b: 35 },     floor: { r: 60, g: 40, b: 70 },    accent: { r: 160, g: 80, b: 255 } },
  shattered_veil:    { wall: { r: 8, g: 3, b: 15 },      floor: { r: 35, g: 30, b: 40 },    accent: { r: 220, g: 50, b: 200 } },
  desperation_core:  { wall: { r: 25, g: 8, b: 40 },     floor: { r: 50, g: 45, b: 42 },    accent: { r: 120, g: 220, b: 80 } },
  dinosaur_jungle:   { wall: { r: 30, g: 60, b: 25 },    floor: { r: 90, g: 75, b: 50 },    accent: { r: 220, g: 180, b: 50  } },
  spider_hive:       { wall: { r: 40, g: 35, b: 30 },    floor: { r: 150, g: 145, b: 140 }, accent: { r: 120, g: 200, b: 50  } },
  sunken_depths:     { wall: { r: 15, g: 30, b: 55 },    floor: { r: 40, g: 60, b: 50 },    accent: { r: 50, g: 220, b: 180  } },
  abyssal_dark:      { wall: { r: 8, g: 5, b: 8 },       floor: { r: 25, g: 22, b: 25 },    accent: { r: 60, g: 30, b: 15    } },
  werewolf_den:      { wall: { r: 55, g: 40, b: 30 },    floor: { r: 100, g: 80, b: 60 },   accent: { r: 180, g: 190, b: 210 } },
  troll_caves:       { wall: { r: 50, g: 55, b: 40 },    floor: { r: 80, g: 70, b: 50 },    accent: { r: 170, g: 180, b: 40  } },
  ruined_village:    { wall: { r: 90, g: 80, b: 70 },    floor: { r: 140, g: 130, b: 115 }, accent: { r: 130, g: 100, b: 60  } },
};

// ---------------------------------------------------------------------------
// Theme element mapping — default element for enemies spawned in each theme
// ---------------------------------------------------------------------------

var THEME_ELEMENT_MAP = {
  stone_keep:        'earth',
  grand_hall:        'earth',
  armory_vault:      'earth',
  throne_dungeon:    'dark',
  catacombs:         'dark',
  crystal_cavern:    'arcane',
  fungal_forest:     'poison',
  lava_rift:         'fire',
  frozen_depths:     'ice',
  flooded_ruins:     'ice',
  floating_islands:  'wind',
  bone_yard:         'dark',
  shadow_realm:      'dark',
  overgrown_temple:  'earth',
  clockwork_maze:    'lightning',
  sand_tomb:         'earth',
  coral_grotto:      'ice',
  void_debris:       'dark',
  ancient_library:   'arcane',
  iron_forge:        'fire',
  haunted_manor:     'dark',
  tidal_vault:       'ice',
  plague_warren:     'poison',
  elven_reliquary:   'arcane',
  gnomish_workshop:  'lightning',
  orc_barrow:        'dark',
  mirage_palace:     'arcane',
  frost_citadel:     'ice',
  goblin_warrens:    'poison',
  ashen_observatory: 'fire',
  sunken_cathedral:  'holy',
  puzzle_labyrinth:  'arcane',
  celestial_spire:   'holy',
  infernal_pit:      'fire',
  dragons_den:       'fire',
  vampire_castle:    'dark',
  lich_sanctum:      'dark',
  cogwork_foundry:   'lightning',
  astral_rift:       'arcane',
  hollow_breach:     'shadow',
  shattered_veil:    'shadow',
  desperation_core:  'arcane',
  dinosaur_jungle:   'earth',
  spider_hive:       'poison',
  sunken_depths:     'ice',
  abyssal_dark:      'dark',
  werewolf_den:      'dark',
  troll_caves:       'earth',
  ruined_village:    'dark',
  ocean_arena:       'ice',
};

// ---------------------------------------------------------------------------
// Theme combat properties — default resistances, weaknesses, damageType
// per theme. Individual enemy templates can override these via their own
// resistances/weaknesses/damageType fields.
// resistances: { element: multiplier } — values < 1 reduce incoming damage
// weaknesses:  { element: multiplier } — values > 1 increase incoming damage
// damageType:  string — the element this enemy deals when attacking
// ---------------------------------------------------------------------------

var THEME_COMBAT_PROPERTIES = {
  // -- Castle themes --
  stone_keep:        { resistances: { earth: 0.7 },                        weaknesses: { lightning: 1.3 },              damageType: 'slashing' },
  grand_hall:        { resistances: { earth: 0.7 },                        weaknesses: { lightning: 1.3 },              damageType: 'slashing' },
  armory_vault:      { resistances: { slashing: 0.7, piercing: 0.7 },     weaknesses: { lightning: 1.4 },              damageType: 'slashing' },
  throne_dungeon:    { resistances: { shadow: 0.6, poison: 0.7 },         weaknesses: { holy: 1.5, fire: 1.3 },       damageType: 'shadow' },
  catacombs:         { resistances: { shadow: 0.6, poison: 0.7 },         weaknesses: { holy: 1.5, fire: 1.3 },       damageType: 'shadow' },
  iron_forge:        { resistances: { fire: 0.5, poison: 0.7 },           weaknesses: { lightning: 1.5, water: 1.3 },  damageType: 'fire' },
  haunted_manor:     { resistances: { shadow: 0.6, poison: 0.8 },         weaknesses: { holy: 1.5 },                  damageType: 'shadow' },

  // -- Wild themes: elemental --
  crystal_cavern:    { resistances: { arcane: 0.5 },                       weaknesses: { blunt: 1.4, earth: 1.3 },     damageType: 'arcane' },
  fungal_forest:     { resistances: { poison: 0.5, water: 0.7, earth: 0.7 }, weaknesses: { fire: 1.5, slashing: 1.3 }, damageType: 'poison' },
  lava_rift:         { resistances: { fire: 0.3 },                         weaknesses: { ice: 1.5, water: 1.5 },       damageType: 'fire' },
  frozen_depths:     { resistances: { ice: 0.3 },                          weaknesses: { fire: 1.5 },                  damageType: 'ice' },
  flooded_ruins:     { resistances: { water: 0.5, fire: 0.7 },            weaknesses: { lightning: 1.5 },              damageType: 'water' },
  bone_yard:         { resistances: { shadow: 0.6, poison: 0.5 },         weaknesses: { holy: 1.5, fire: 1.3 },       damageType: 'shadow' },
  shadow_realm:      { resistances: { shadow: 0.3 },                       weaknesses: { holy: 1.5 },                  damageType: 'shadow' },
  overgrown_temple:  { resistances: { earth: 0.5, water: 0.7 },           weaknesses: { fire: 1.5, slashing: 1.3 },   damageType: 'nature' },
  sand_tomb:         { resistances: { earth: 0.5, poison: 0.7 },          weaknesses: { holy: 1.4, water: 1.3 },      damageType: 'earth' },

  // -- New wild themes --
  tidal_vault:       { resistances: { water: 0.5, fire: 0.7 },            weaknesses: { lightning: 1.5 },              damageType: 'water' },
  plague_warren:     { resistances: { poison: 0.3 },                       weaknesses: { fire: 1.5, holy: 1.3 },       damageType: 'poison' },
  elven_reliquary:   { resistances: { arcane: 0.5 },                       weaknesses: { shadow: 1.4 },                damageType: 'arcane' },
  gnomish_workshop:  { resistances: { lightning: 0.5, poison: 0.7 },      weaknesses: { water: 1.4 },                 damageType: 'lightning' },
  orc_barrow:        { resistances: { shadow: 0.6 },                       weaknesses: { holy: 1.4 },                  damageType: 'shadow' },
  mirage_palace:     { resistances: { arcane: 0.5 },                       weaknesses: { earth: 1.3 },                 damageType: 'arcane' },
  frost_citadel:     { resistances: { ice: 0.3 },                          weaknesses: { fire: 1.5 },                  damageType: 'ice' },
  goblin_warrens:    { resistances: { poison: 0.7 },                       weaknesses: { holy: 1.3, fire: 1.2 },       damageType: 'poison' },
  ashen_observatory: { resistances: { fire: 0.4 },                         weaknesses: { ice: 1.4, water: 1.3 },       damageType: 'fire' },
  sunken_cathedral:  { resistances: { holy: 0.5, shadow: 0.7 },           weaknesses: { fire: 1.3 },                  damageType: 'holy' },
  puzzle_labyrinth:  { resistances: { arcane: 0.5, earth: 0.7 },          weaknesses: { lightning: 1.3 },              damageType: 'arcane' },
  celestial_spire:   { resistances: { holy: 0.4 },                         weaknesses: { shadow: 1.5 },                damageType: 'holy' },
  infernal_pit:      { resistances: { fire: 0.4, shadow: 0.6 },           weaknesses: { holy: 1.5, ice: 1.3 },        damageType: 'fire' },
  dragons_den:       { resistances: { fire: 0.4 },                         weaknesses: { ice: 1.5 },                   damageType: 'fire' },
  vampire_castle:    { resistances: { shadow: 0.5 },                       weaknesses: { holy: 1.5, fire: 1.3 },       damageType: 'shadow' },
  lich_sanctum:      { resistances: { shadow: 0.4, poison: 0.5 },         weaknesses: { holy: 1.5, fire: 1.3 },       damageType: 'shadow' },
  cogwork_foundry:   { resistances: { lightning: 0.5, poison: 0.7 },      weaknesses: { water: 1.4 },                 damageType: 'lightning' },
  astral_rift:       { resistances: { arcane: 0.4 },                       weaknesses: { holy: 1.3, shadow: 1.3 },     damageType: 'arcane' },
  hollow_breach:     { resistances: { shadow: 0.5 },                       weaknesses: { holy: 1.5, fire: 1.3 },       damageType: 'shadow' },
  shattered_veil:    { resistances: { shadow: 0.4 },                       weaknesses: { holy: 1.5, fire: 1.3 },       damageType: 'shadow' },
  desperation_core:  { resistances: { arcane: 0.4, shadow: 0.5 },         weaknesses: { holy: 1.5, fire: 1.3 },       damageType: 'arcane' },
  dinosaur_jungle:   { resistances: { earth: 0.6, nature: 0.7 },          weaknesses: { fire: 1.4, ice: 1.3 },        damageType: 'nature' },
  spider_hive:       { resistances: { poison: 0.4 },                       weaknesses: { fire: 1.5, slashing: 1.3 },   damageType: 'poison' },
  sunken_depths:     { resistances: { water: 0.4, fire: 0.7 },            weaknesses: { lightning: 1.5 },              damageType: 'water' },
  abyssal_dark:      { resistances: { shadow: 0.3 },                       weaknesses: { holy: 1.5 },                  damageType: 'shadow' },
  werewolf_den:      { resistances: { shadow: 0.7 },                       weaknesses: { holy: 1.3, slashing: 1.3 },   damageType: 'slashing' },
  troll_caves:       { resistances: { earth: 0.6, poison: 0.7 },          weaknesses: { fire: 1.5 },                  damageType: 'blunt' },
  ruined_village:    { resistances: { shadow: 0.6 },                       weaknesses: { holy: 1.4 },                  damageType: 'shadow' },
  ocean_arena:       { resistances: { water: 0.4, fire: 0.7 },            weaknesses: { lightning: 1.5 },              damageType: 'water' },

  // Fallback themes without dedicated pools
  floating_islands:  { resistances: { wind: 0.5 },                         weaknesses: { earth: 1.4 },                 damageType: 'wind' },
  clockwork_maze:    { resistances: { lightning: 0.5, poison: 0.7 },      weaknesses: { water: 1.4 },                 damageType: 'lightning' },
  coral_grotto:      { resistances: { water: 0.5, ice: 0.7 },             weaknesses: { lightning: 1.5 },              damageType: 'water' },
  void_debris:       { resistances: { shadow: 0.4 },                       weaknesses: { holy: 1.4 },                  damageType: 'shadow' },
  ancient_library:   { resistances: { arcane: 0.5 },                       weaknesses: { fire: 1.3 },                  damageType: 'arcane' },
};

// ---------------------------------------------------------------------------
// Theme -> preferred layouts (weighted selection)
// ---------------------------------------------------------------------------

var THEME_LAYOUT_MAP = {
  // Castle themes
  stone_keep:       [{ layout: 'bsp_rooms', weight: 6 }, { layout: 'temple_halls', weight: 3 }, { layout: 'arena', weight: 1 }],
  grand_hall:       [{ layout: 'temple_halls', weight: 5 }, { layout: 'arena', weight: 3 }, { layout: 'bsp_rooms', weight: 2 }],
  armory_vault:     [{ layout: 'bsp_rooms', weight: 5 }, { layout: 'maze', weight: 3 }, { layout: 'temple_halls', weight: 2 }],
  throne_dungeon:   [{ layout: 'arena', weight: 5 }, { layout: 'bsp_rooms', weight: 3 }, { layout: 'temple_halls', weight: 2 }],
  catacombs:        [{ layout: 'maze', weight: 5 }, { layout: 'bsp_rooms', weight: 3 }, { layout: 'organic', weight: 2 }],
  iron_forge:       [{ layout: 'arena', weight: 5 }, { layout: 'bsp_rooms', weight: 3 }, { layout: 'open_cavern', weight: 2 }],
  haunted_manor:    [{ layout: 'bsp_rooms', weight: 5 }, { layout: 'maze', weight: 3 }, { layout: 'organic', weight: 2 }],
  // Wild themes
  crystal_cavern:   [{ layout: 'organic', weight: 5 }, { layout: 'open_cavern', weight: 3 }, { layout: 'maze', weight: 2 }],
  fungal_forest:    [{ layout: 'organic', weight: 6 }, { layout: 'island', weight: 2 }, { layout: 'open_cavern', weight: 2 }],
  lava_rift:        [{ layout: 'island', weight: 4 }, { layout: 'open_cavern', weight: 4 }, { layout: 'organic', weight: 2 }],
  frozen_depths:    [{ layout: 'organic', weight: 4 }, { layout: 'open_cavern', weight: 3 }, { layout: 'maze', weight: 3 }],
  flooded_ruins:    [{ layout: 'lake', weight: 6 }, { layout: 'island', weight: 3 }, { layout: 'bsp_rooms', weight: 1 }],
  floating_islands: [{ layout: 'island', weight: 7 }, { layout: 'open_cavern', weight: 2 }, { layout: 'arena', weight: 1 }],
  bone_yard:        [{ layout: 'open_cavern', weight: 5 }, { layout: 'arena', weight: 3 }, { layout: 'organic', weight: 2 }],
  shadow_realm:     [{ layout: 'maze', weight: 4 }, { layout: 'organic', weight: 3 }, { layout: 'island', weight: 3 }],
  overgrown_temple: [{ layout: 'temple_halls', weight: 5 }, { layout: 'bsp_rooms', weight: 3 }, { layout: 'organic', weight: 2 }],
  clockwork_maze:   [{ layout: 'maze', weight: 7 }, { layout: 'bsp_rooms', weight: 2 }, { layout: 'temple_halls', weight: 1 }],
  sand_tomb:        [{ layout: 'temple_halls', weight: 5 }, { layout: 'maze', weight: 3 }, { layout: 'bsp_rooms', weight: 2 }],
  coral_grotto:     [{ layout: 'lake', weight: 5 }, { layout: 'organic', weight: 3 }, { layout: 'island', weight: 2 }],
  void_debris:      [{ layout: 'island', weight: 6 }, { layout: 'open_cavern', weight: 2 }, { layout: 'maze', weight: 2 }],
  ancient_library:  [{ layout: 'temple_halls', weight: 6 }, { layout: 'bsp_rooms', weight: 3 }, { layout: 'maze', weight: 1 }],
  // Wild themes - new
  tidal_vault:        [{ layout: 'lake', weight: 6 }, { layout: 'island', weight: 3 }, { layout: 'organic', weight: 1 }],
  plague_warren:      [{ layout: 'maze', weight: 6 }, { layout: 'organic', weight: 3 }, { layout: 'bsp_rooms', weight: 1 }],
  elven_reliquary:    [{ layout: 'temple_halls', weight: 6 }, { layout: 'bsp_rooms', weight: 3 }, { layout: 'organic', weight: 1 }],
  gnomish_workshop:   [{ layout: 'maze', weight: 5 }, { layout: 'arena', weight: 3 }, { layout: 'bsp_rooms', weight: 2 }],
  orc_barrow:         [{ layout: 'open_cavern', weight: 5 }, { layout: 'bsp_rooms', weight: 3 }, { layout: 'arena', weight: 2 }],
  mirage_palace:      [{ layout: 'island', weight: 5 }, { layout: 'temple_halls', weight: 3 }, { layout: 'maze', weight: 2 }],
  frost_citadel:      [{ layout: 'bsp_rooms', weight: 5 }, { layout: 'open_cavern', weight: 3 }, { layout: 'maze', weight: 2 }],
  goblin_warrens:     [{ layout: 'maze', weight: 6 }, { layout: 'open_cavern', weight: 3 }, { layout: 'organic', weight: 1 }],
  ashen_observatory:  [{ layout: 'open_cavern', weight: 5 }, { layout: 'island', weight: 3 }, { layout: 'arena', weight: 2 }],
  sunken_cathedral:   [{ layout: 'temple_halls', weight: 5 }, { layout: 'lake', weight: 3 }, { layout: 'bsp_rooms', weight: 2 }],
  // Wild themes - rift chaos
  puzzle_labyrinth:   [{ layout: 'maze', weight: 7 }, { layout: 'temple_halls', weight: 2 }, { layout: 'bsp_rooms', weight: 1 }],
  celestial_spire:    [{ layout: 'temple_halls', weight: 6 }, { layout: 'arena', weight: 2 }, { layout: 'island', weight: 2 }],
  infernal_pit:       [{ layout: 'open_cavern', weight: 5 }, { layout: 'arena', weight: 3 }, { layout: 'lake', weight: 2 }],
  dragons_den:        [{ layout: 'open_cavern', weight: 6 }, { layout: 'arena', weight: 3 }, { layout: 'bsp_rooms', weight: 1 }],
  // Wild themes - dark magick rift
  vampire_castle:     [{ layout: 'bsp_rooms', weight: 5 }, { layout: 'temple_halls', weight: 3 }, { layout: 'maze', weight: 2 }],
  lich_sanctum:       [{ layout: 'temple_halls', weight: 5 }, { layout: 'bsp_rooms', weight: 3 }, { layout: 'arena', weight: 2 }],
  cogwork_foundry:    [{ layout: 'maze', weight: 5 }, { layout: 'arena', weight: 3 }, { layout: 'bsp_rooms', weight: 2 }],
  astral_rift:        [{ layout: 'island', weight: 6 }, { layout: 'open_cavern', weight: 3 }, { layout: 'organic', weight: 1 }],
  hollow_breach:      [{ layout: 'bsp_rooms', weight: 5 }, { layout: 'temple_halls', weight: 3 }, { layout: 'organic', weight: 2 }],
  shattered_veil:     [{ layout: 'island', weight: 5 }, { layout: 'open_cavern', weight: 3 }, { layout: 'organic', weight: 2 }],
  desperation_core:   [{ layout: 'temple_halls', weight: 5 }, { layout: 'arena', weight: 3 }, { layout: 'bsp_rooms', weight: 2 }],
  dinosaur_jungle:    [{ layout: 'organic', weight: 5 }, { layout: 'open_cavern', weight: 3 }, { layout: 'lake', weight: 2 }],
  spider_hive:        [{ layout: 'organic', weight: 5 }, { layout: 'maze', weight: 3 }, { layout: 'open_cavern', weight: 2 }],
  sunken_depths:      [{ layout: 'lake', weight: 7 }, { layout: 'island', weight: 2 }, { layout: 'organic', weight: 1 }],
  abyssal_dark:       [{ layout: 'maze', weight: 6 }, { layout: 'organic', weight: 3 }, { layout: 'open_cavern', weight: 1 }],
  werewolf_den:       [{ layout: 'organic', weight: 5 }, { layout: 'open_cavern', weight: 3 }, { layout: 'maze', weight: 2 }],
  troll_caves:        [{ layout: 'open_cavern', weight: 6 }, { layout: 'organic', weight: 3 }, { layout: 'bsp_rooms', weight: 1 }],
  ruined_village:     [{ layout: 'bsp_rooms', weight: 5 }, { layout: 'open_cavern', weight: 3 }, { layout: 'temple_halls', weight: 2 }],
};

// FLOOR_LAYOUTS and ENEMY_POOLS are injected via init() from dungeon-data.js
var _FLOOR_LAYOUTS = null;
var _ENEMY_POOLS = null;

function init(deps) {
  _FLOOR_LAYOUTS = deps.FLOOR_LAYOUTS;
  _ENEMY_POOLS = deps.ENEMY_POOLS;
}

function selectLayout(theme, rng) {
  var layouts = THEME_LAYOUT_MAP[theme];
  if (!layouts || layouts.length === 0) {
    return _FLOOR_LAYOUTS.BSP_ROOMS;
  }
  var totalWeight = 0;
  for (var i = 0; i < layouts.length; i++) totalWeight += layouts[i].weight;
  var roll = rng() * totalWeight;
  var cumulative = 0;
  for (var j = 0; j < layouts.length; j++) {
    cumulative += layouts[j].weight;
    if (roll < cumulative) return layouts[j].layout;
  }
  return layouts[0].layout;
}

// ---------------------------------------------------------------------------
// Fallback mapping: themes without explicit pools map to the closest match
// ---------------------------------------------------------------------------

var THEME_POOL_FALLBACK = {
  grand_hall:          'stone_keep',
  armory_vault:        'stone_keep',
  throne_dungeon:      'stone_keep',
  catacombs:           'bone_yard',
  floating_islands:    'crystal_cavern',
  clockwork_maze:      'stone_keep',
  coral_grotto:        'flooded_ruins',
  void_debris:         'shadow_realm',
  ancient_library:     'sand_tomb',
  iron_forge:          'stone_keep',
  haunted_manor:       'stone_keep',
  tidal_vault:         'flooded_ruins',
  plague_warren:       'fungal_forest',
  elven_reliquary:     'overgrown_temple',
  gnomish_workshop:    'clockwork_maze',
  orc_barrow:          'bone_yard',
  mirage_palace:       'sand_tomb',
  frost_citadel:       'frozen_depths',
  goblin_warrens:      'bone_yard',
  ashen_observatory:   'lava_rift',
  sunken_cathedral:    'catacombs',
  puzzle_labyrinth:    'clockwork_maze',
  celestial_spire:     'overgrown_temple',
  infernal_pit:        'lava_rift',
  dragons_den:         'lava_rift',
  vampire_castle:      'stone_keep',
  lich_sanctum:        'shadow_realm',
  cogwork_foundry:     'gnomish_workshop',
  astral_rift:         'shadow_realm',
  hollow_breach:       'astral_rift',
  shattered_veil:      'hollow_breach',
  desperation_core:    'hollow_breach',
  dinosaur_jungle:     'overgrown_temple',
  spider_hive:         'fungal_forest',
  sunken_depths:       'flooded_ruins',
  abyssal_dark:        'shadow_realm',
  werewolf_den:        'bone_yard',
  troll_caves:         'bone_yard',
  ruined_village:      'stone_keep',
};

function getEnemyPool(theme) {
  if (_ENEMY_POOLS[theme]) return _ENEMY_POOLS[theme];
  var fallback = THEME_POOL_FALLBACK[theme];
  if (fallback && _ENEMY_POOLS[fallback]) return _ENEMY_POOLS[fallback];
  return _ENEMY_POOLS.stone_keep;
}

// ---------------------------------------------------------------------------
// Theme-specific bonus resources added to the loot pool
// ---------------------------------------------------------------------------

var THEME_BONUS_LOOT = {
  crystal_cavern:     ['gem_rough', 'gem_cut', 'mana_crystal'],
  fungal_forest:      ['mushroom', 'herbs', 'potion_health'],
  lava_rift:          ['iron_ore', 'iron_bar', 'glass_sand'],
  frozen_depths:      ['silver_ore', 'mana_crystal', 'gem_rough'],
  sand_tomb:          ['gold_ore', 'gem_rough', 'stone'],
  bone_yard:          ['dark_crystal', 'stone', 'iron_ore'],
  shadow_realm:       ['dark_crystal', 'mana_crystal', 'dungeon_essence'],
  coral_grotto:       ['shellfish', 'seaweed', 'gem_rough'],
  flooded_ruins:      ['seaweed', 'fish', 'gem_rough'],
  overgrown_temple:   ['herbs', 'wood', 'mushroom'],
  clockwork_maze:     ['cogs', 'gears', 'springs'],
  stone_keep:         ['stone', 'iron_ore', 'iron_bar'],
  throne_dungeon:     ['gold_ore', 'gem_cut', 'silver_bar'],
  catacombs:          ['dark_crystal', 'stone', 'herbs'],
  ancient_library:    ['mana_crystal', 'glass_lens', 'herbs'],
  armory_vault:       ['iron_bar', 'steel_bar', 'bronze_bar'],
  iron_forge:         ['iron_ore', 'iron_bar', 'steel_bar'],
  haunted_manor:      ['dark_crystal', 'herbs', 'glass_vial'],
  tidal_vault:        ['shellfish', 'seaweed', 'gem_rough'],
  plague_warren:      ['mushroom', 'herbs', 'potion_health'],
  elven_reliquary:    ['mana_crystal', 'gem_cut', 'gold_ore'],
  gnomish_workshop:   ['cogs', 'gears', 'springs', 'clockwork_core'],
  orc_barrow:         ['iron_ore', 'bronze_bar', 'stone'],
  mirage_palace:      ['gold_ore', 'gem_cut', 'glass'],
  frost_citadel:      ['silver_ore', 'mana_crystal', 'gem_rough'],
  goblin_warrens:     ['copper_ore', 'mushroom', 'herbs'],
  infernal_pit:       ['iron_ore', 'dark_crystal', 'mana_crystal'],
  dragons_den:        ['gold_ore', 'gem_cut', 'mithril_ore'],
  vampire_castle:     ['dark_crystal', 'herbs', 'potion_health'],
  lich_sanctum:       ['dark_crystal', 'mana_crystal', 'gem_cut'],
  cogwork_foundry:    ['cogs', 'gears', 'springs', 'steel_bar'],
  astral_rift:        ['mana_crystal', 'dark_crystal', 'dungeon_essence'],
  hollow_breach:      ['dark_crystal', 'mana_crystal', 'purification_crystal'],
  shattered_veil:     ['dark_crystal', 'mana_crystal', 'dungeon_essence'],
  desperation_core:   ['dark_crystal', 'purification_crystal', 'mana_crystal', 'dungeon_essence'],
  dinosaur_jungle:    ['wood', 'herbs', 'stone'],
  spider_hive:        ['herbs', 'mushroom', 'dark_crystal'],
  sunken_depths:      ['seaweed', 'shellfish', 'gem_rough'],
  abyssal_dark:       ['dark_crystal', 'mana_crystal', 'dungeon_essence'],
  werewolf_den:       ['herbs', 'mushroom', 'iron_ore'],
  troll_caves:        ['stone', 'iron_ore', 'mushroom'],
  ruined_village:     ['wood', 'stone', 'iron_ore'],
};

module.exports = {
  init,

  // Theme category lists
  CASTLE_THEMES,
  WILD_THEMES,

  // Biome mapping
  BIOME_DUNGEON_THEMES,

  // Colors
  THEME_COLORS,

  // Element and combat
  THEME_ELEMENT_MAP,
  THEME_COMBAT_PROPERTIES,

  // Layouts
  THEME_LAYOUT_MAP,
  selectLayout,

  // Enemy pool fallback
  THEME_POOL_FALLBACK,
  getEnemyPool,

  // Bonus loot
  THEME_BONUS_LOOT,
};
