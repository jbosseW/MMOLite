// leviathan-data.js
// Ocean Leviathan Boss System — templates, regions, arenas, scaling, loot.
// Leviathans are overworld-only roaming bosses in ocean biomes.

'use strict';

// ---------------------------------------------------------------------------
// Size tiers
// ---------------------------------------------------------------------------

var SIZE_TIERS = {
  large: {
    chunks: 1,
    arenaWidth: 60,
    arenaHeight: 45,
    minPlayers: 1,
    maxPlayers: 4,
    minParts: 2,
    maxParts: 3,
    enrageTimerSec: 150,
  },
  massive: {
    chunks: 2,
    arenaWidth: 90,
    arenaHeight: 68,
    minPlayers: 3,
    maxPlayers: 8,
    minParts: 3,
    maxParts: 5,
    enrageTimerSec: 200,
  },
  colossal: {
    chunks: 3,
    arenaWidth: 120,
    arenaHeight: 90,
    minPlayers: 6,
    maxPlayers: 16,
    minParts: 4,
    maxParts: 6,
    enrageTimerSec: 300,
  },
};

// ---------------------------------------------------------------------------
// Part position map — used for placing parts in the ocean arena
// ---------------------------------------------------------------------------

var PART_POSITIONS = {
  center:       function(w, h) { return { x: Math.floor(w / 2), y: Math.floor(h * 0.35) }; },
  top:          function(w, h) { return { x: Math.floor(w / 2), y: Math.floor(h * 0.15) }; },
  bottom:       function(w, h) { return { x: Math.floor(w / 2), y: Math.floor(h * 0.55) }; },
  left:         function(w, h) { return { x: Math.floor(w * 0.25), y: Math.floor(h * 0.35) }; },
  right:        function(w, h) { return { x: Math.floor(w * 0.75), y: Math.floor(h * 0.35) }; },
  top_left:     function(w, h) { return { x: Math.floor(w * 0.25), y: Math.floor(h * 0.15) }; },
  top_right:    function(w, h) { return { x: Math.floor(w * 0.75), y: Math.floor(h * 0.15) }; },
  bottom_left:  function(w, h) { return { x: Math.floor(w * 0.25), y: Math.floor(h * 0.55) }; },
  bottom_right: function(w, h) { return { x: Math.floor(w * 0.75), y: Math.floor(h * 0.55) }; },
};

// ---------------------------------------------------------------------------
// onDestroy effect types
// ---------------------------------------------------------------------------
// expose_core    — reduce target part's def by %
// reduce_speed   — reduce all parts' speed by %
// disable_lure   — stop the lure pull mechanic
// stop_spawns    — prevent birth sac add spawns
// disable_hazard — stop rift organ tile hazard creation
// expose_body    — reveal hidden body part (underbelly)
// weaken_grip    — reduce all remaining tentacles' atk by flat amount

// ---------------------------------------------------------------------------
// 8 Leviathan templates
// ---------------------------------------------------------------------------

var LEVIATHAN_TEMPLATES = {
  // ---- LARGE tier ----
  reef_titan: {
    id: 'reef_titan',
    name: 'Reef Titan',
    tier: 'large',
    totalHp: 2000,
    baseXp: 500,
    baseGold: 200,
    phases: [
      { threshold: 1.0, name: 'Armored',   atkMult: 1.0, description: 'The Reef Titan hunkers behind its shell.' },
      { threshold: 0.5, name: 'Exposed',    atkMult: 1.3, description: 'Shell cracked! The Titan lashes out in fury.' },
      { threshold: 0.2, name: 'Desperate',  atkMult: 1.6, description: 'The Titan fights with reckless abandon.' },
    ],
    parts: [
      { id: 'shell',  name: 'Shell',      hpPercent: 0.35, atk: 8,  def: 25, archetype: 'tank',   position: 'center',    abilities: ['fortify', 'shell_slam'],    onDestroy: { effect: 'expose_core', target: 'core', defReduction: 0.5, message: 'The shell shatters, exposing the soft core!' } },
      { id: 'claw_l', name: 'Left Claw',   hpPercent: 0.30, atk: 18, def: 10, archetype: 'melee',  position: 'left',      abilities: ['pinch', 'sweep'],           onDestroy: null },
      { id: 'claw_r', name: 'Right Claw',  hpPercent: 0.35, atk: 20, def: 10, archetype: 'melee',  position: 'right',     abilities: ['pinch', 'crush'],           onDestroy: null },
    ],
    loot: 'reef_titan',
  },

  storm_serpent: {
    id: 'storm_serpent',
    name: 'Storm Serpent',
    tier: 'large',
    totalHp: 2500,
    baseXp: 600,
    baseGold: 250,
    phases: [
      { threshold: 1.0, name: 'Coiled',    atkMult: 1.0, description: 'The Storm Serpent writhes through the waves.' },
      { threshold: 0.5, name: 'Uncoiled',  atkMult: 1.4, description: 'The serpent uncoils, striking with blinding speed!' },
      { threshold: 0.2, name: 'Storm Fury', atkMult: 1.8, description: 'Lightning crackles along the serpent\'s body!' },
    ],
    parts: [
      { id: 'head',   name: 'Head',        hpPercent: 0.40, atk: 22, def: 12, archetype: 'melee',  position: 'top',       abilities: ['lightning_bite', 'thunder_roar'], onDestroy: null },
      { id: 'coils',  name: 'Coils',       hpPercent: 0.35, atk: 14, def: 15, archetype: 'tank',   position: 'center',    abilities: ['constrict', 'whip'],             onDestroy: null },
      { id: 'tail',   name: 'Tail',        hpPercent: 0.25, atk: 16, def: 8,  archetype: 'melee',  position: 'bottom',    abilities: ['tail_lash', 'storm_surge'],      onDestroy: { effect: 'reduce_speed', speedReduction: 0.3, message: 'The tail is severed! All parts slow down.' } },
    ],
    loot: 'storm_serpent',
  },

  // ---- MASSIVE tier ----
  coral_colossus: {
    id: 'coral_colossus',
    name: 'Coral Colossus',
    tier: 'massive',
    totalHp: 5000,
    baseXp: 1200,
    baseGold: 500,
    phases: [
      { threshold: 1.0, name: 'Regenerating', atkMult: 1.0, description: 'The Colossus draws power from its coral crown.' },
      { threshold: 0.5, name: 'Fractured',    atkMult: 1.3, description: 'Coral fragments orbit the Colossus like shrapnel!' },
      { threshold: 0.2, name: 'Crumbling',    atkMult: 1.6, description: 'The Colossus crumbles but refuses to fall!' },
    ],
    parts: [
      { id: 'core',   name: 'Core',         hpPercent: 0.30, atk: 10, def: 20, archetype: 'healer', position: 'center',    abilities: ['regenerate', 'coral_burst'],       onDestroy: null },
      { id: 'arm_l',  name: 'Left Arm',     hpPercent: 0.20, atk: 22, def: 12, archetype: 'melee',  position: 'left',      abilities: ['smash', 'coral_throw'],            onDestroy: null },
      { id: 'arm_r',  name: 'Right Arm',    hpPercent: 0.20, atk: 24, def: 12, archetype: 'melee',  position: 'right',     abilities: ['smash', 'reef_sweep'],             onDestroy: null },
      { id: 'crown',  name: 'Coral Crown',  hpPercent: 0.30, atk: 12, def: 18, archetype: 'caster', position: 'top',       abilities: ['heal_pulse', 'tidal_wave'],        onDestroy: { effect: 'expose_core', target: 'core', defReduction: 0.6, message: 'The crown crumbles! The core can no longer regenerate!' } },
    ],
    loot: 'coral_colossus',
  },

  kraken_titan: {
    id: 'kraken_titan',
    name: 'Kraken Titan',
    tier: 'massive',
    totalHp: 6000,
    baseXp: 1400,
    baseGold: 600,
    phases: [
      { threshold: 1.0, name: 'Grasping',   atkMult: 1.0, description: 'Tentacles writhe beneath the surface.' },
      { threshold: 0.5, name: 'Enraged',    atkMult: 1.4, description: 'The Kraken rises fully, its eyes burning!' },
      { threshold: 0.2, name: 'Death Grip', atkMult: 1.7, description: 'The Kraken wraps everything in a final embrace!' },
    ],
    parts: [
      { id: 'maw',      name: 'Maw',        hpPercent: 0.20, atk: 30, def: 15, archetype: 'melee',  position: 'center',       abilities: ['devour', 'ink_cloud'],         onDestroy: null },
      { id: 'tent_1',   name: 'Tentacle 1',  hpPercent: 0.20, atk: 16, def: 8,  archetype: 'melee',  position: 'top_left',     abilities: ['grab', 'slam'],                onDestroy: { effect: 'weaken_grip', atkReduction: 3, message: 'A tentacle is severed! The Kraken\'s grip weakens.' } },
      { id: 'tent_2',   name: 'Tentacle 2',  hpPercent: 0.20, atk: 16, def: 8,  archetype: 'melee',  position: 'top_right',    abilities: ['grab', 'slam'],                onDestroy: { effect: 'weaken_grip', atkReduction: 3, message: 'A tentacle is severed! The Kraken\'s grip weakens.' } },
      { id: 'tent_3',   name: 'Tentacle 3',  hpPercent: 0.20, atk: 16, def: 8,  archetype: 'melee',  position: 'bottom_left',  abilities: ['grab', 'whip'],                onDestroy: { effect: 'weaken_grip', atkReduction: 3, message: 'A tentacle is severed! The Kraken\'s grip weakens.' } },
      { id: 'tent_4',   name: 'Tentacle 4',  hpPercent: 0.20, atk: 16, def: 8,  archetype: 'melee',  position: 'bottom_right', abilities: ['grab', 'whip'],                onDestroy: { effect: 'weaken_grip', atkReduction: 3, message: 'A tentacle is severed! The Kraken\'s grip weakens.' } },
    ],
    loot: 'kraken_titan',
  },

  abyssal_maw: {
    id: 'abyssal_maw',
    name: 'Abyssal Maw',
    tier: 'massive',
    totalHp: 5500,
    baseXp: 1300,
    baseGold: 550,
    phases: [
      { threshold: 1.0, name: 'Luring',     atkMult: 1.0, description: 'A bioluminescent lure beckons from the deep.' },
      { threshold: 0.5, name: 'Jaws Open',  atkMult: 1.3, description: 'The Maw opens wide, revealing rows of teeth!' },
      { threshold: 0.2, name: 'Frenzy',     atkMult: 1.7, description: 'The Abyssal Maw thrashes in a feeding frenzy!' },
    ],
    parts: [
      { id: 'lure',   name: 'Lure',         hpPercent: 0.20, atk: 8,  def: 6,  archetype: 'caster', position: 'top',       abilities: ['mesmerize', 'flash'],            onDestroy: { effect: 'disable_lure', message: 'The lure goes dark! Players are freed from its pull!' } },
      { id: 'jaw_l',  name: 'Left Jaw',     hpPercent: 0.25, atk: 26, def: 14, archetype: 'melee',  position: 'left',      abilities: ['bite', 'snap'],                  onDestroy: null },
      { id: 'jaw_r',  name: 'Right Jaw',    hpPercent: 0.25, atk: 26, def: 14, archetype: 'melee',  position: 'right',     abilities: ['bite', 'crunch'],                onDestroy: null },
      { id: 'body',   name: 'Body',         hpPercent: 0.30, atk: 14, def: 20, archetype: 'tank',   position: 'center',    abilities: ['thrash', 'deep_dive'],           onDestroy: null },
    ],
    loot: 'abyssal_maw',
  },

  // ---- COLOSSAL tier ----
  leviathan_mother: {
    id: 'leviathan_mother',
    name: 'Leviathan Mother',
    tier: 'colossal',
    totalHp: 10000,
    baseXp: 3000,
    baseGold: 1200,
    phases: [
      { threshold: 1.0, name: 'Nesting',    atkMult: 1.0, description: 'The Mother protects her brood.' },
      { threshold: 0.5, name: 'Wrathful',   atkMult: 1.4, description: 'The Mother roars — her children scatter!' },
      { threshold: 0.2, name: 'Last Stand', atkMult: 1.8, description: 'The Mother sacrifices everything to protect her spawn!' },
    ],
    parts: [
      { id: 'head',       name: 'Head',         hpPercent: 0.25, atk: 35, def: 18, archetype: 'melee',  position: 'top',          abilities: ['charge', 'roar'],              onDestroy: null },
      { id: 'body',       name: 'Body',         hpPercent: 0.25, atk: 20, def: 25, archetype: 'tank',   position: 'center',       abilities: ['body_slam', 'tidal_shield'],   onDestroy: null },
      { id: 'tail',       name: 'Tail',         hpPercent: 0.15, atk: 28, def: 12, archetype: 'melee',  position: 'bottom',       abilities: ['tail_whip', 'tsunami'],        onDestroy: null },
      { id: 'birth_sac_l', name: 'Birth Sac L', hpPercent: 0.15, atk: 6,  def: 10, archetype: 'caster', position: 'bottom_left',  abilities: ['spawn_add'],                   onDestroy: { effect: 'stop_spawns', side: 'left', message: 'A birth sac bursts! Fewer spawn will emerge.' } },
      { id: 'birth_sac_r', name: 'Birth Sac R', hpPercent: 0.15, atk: 6,  def: 10, archetype: 'caster', position: 'bottom_right', abilities: ['spawn_add'],                   onDestroy: { effect: 'stop_spawns', side: 'right', message: 'A birth sac bursts! Fewer spawn will emerge.' } },
      { id: 'fin',         name: 'Dorsal Fin',  hpPercent: 0.05, atk: 18, def: 8,  archetype: 'melee',  position: 'top_right',    abilities: ['fin_slice', 'current_push'],   onDestroy: null },
    ],
    loot: 'leviathan_mother',
  },

  void_whale: {
    id: 'void_whale',
    name: 'Void Whale',
    tier: 'colossal',
    totalHp: 12000,
    baseXp: 3500,
    baseGold: 1400,
    phases: [
      { threshold: 1.0, name: 'Drifting',   atkMult: 1.0, description: 'The Void Whale drifts between dimensions.' },
      { threshold: 0.5, name: 'Breach',     atkMult: 1.3, description: 'Reality fractures as the Whale breaches!' },
      { threshold: 0.2, name: 'Collapse',   atkMult: 1.7, description: 'The void collapses — space warps around the Whale!' },
    ],
    parts: [
      { id: 'head',         name: 'Head',          hpPercent: 0.25, atk: 32, def: 20, archetype: 'melee',  position: 'top',          abilities: ['void_scream', 'dimensional_crush'],   onDestroy: null },
      { id: 'fluke',        name: 'Fluke',         hpPercent: 0.20, atk: 28, def: 14, archetype: 'melee',  position: 'bottom',       abilities: ['tail_slam', 'rift_wave'],              onDestroy: null },
      { id: 'rift_organ_l', name: 'Rift Organ L',  hpPercent: 0.15, atk: 10, def: 10, archetype: 'caster', position: 'left',         abilities: ['create_hazard', 'void_pulse'],         onDestroy: { effect: 'disable_hazard', side: 'left', message: 'A rift organ collapses! Fewer void zones will form.' } },
      { id: 'rift_organ_r', name: 'Rift Organ R',  hpPercent: 0.15, atk: 10, def: 10, archetype: 'caster', position: 'right',        abilities: ['create_hazard', 'void_pulse'],         onDestroy: { effect: 'disable_hazard', side: 'right', message: 'A rift organ collapses! Fewer void zones will form.' } },
      { id: 'plating',      name: 'Void Plating',  hpPercent: 0.25, atk: 12, def: 30, archetype: 'tank',   position: 'center',       abilities: ['void_armor', 'phase_shift'],           onDestroy: null },
    ],
    loot: 'void_whale',
  },

  ancient_leviathan: {
    id: 'ancient_leviathan',
    name: 'Ancient Leviathan',
    tier: 'colossal',
    totalHp: 15000,
    baseXp: 4500,
    baseGold: 1800,
    phases: [
      { threshold: 1.0, name: 'Slumbering',  atkMult: 1.0, description: 'The Ancient One stirs from millennia of sleep.' },
      { threshold: 0.5, name: 'Awakened',     atkMult: 1.5, description: 'The Ancient Leviathan fully awakens — the sea boils!' },
      { threshold: 0.2, name: 'Primordial',   atkMult: 2.0, description: 'Primordial power erupts — this is the end of days!' },
    ],
    parts: [
      { id: 'head',         name: 'Head',           hpPercent: 0.25, atk: 40, def: 22, archetype: 'melee',  position: 'top',          abilities: ['ancient_bite', 'primordial_roar'],     onDestroy: null },
      { id: 'shell_l',      name: 'Shell Plate L',  hpPercent: 0.15, atk: 10, def: 35, archetype: 'tank',   position: 'left',         abilities: ['shell_guard', 'plate_slam'],            onDestroy: { effect: 'expose_body', target: 'underbelly', message: 'Shell plate shattered! The soft underbelly is exposed!' } },
      { id: 'shell_r',      name: 'Shell Plate R',  hpPercent: 0.15, atk: 10, def: 35, archetype: 'tank',   position: 'right',        abilities: ['shell_guard', 'plate_slam'],            onDestroy: { effect: 'expose_body', target: 'underbelly', message: 'Shell plate shattered! The soft underbelly is exposed!' } },
      { id: 'tail',         name: 'Tail',           hpPercent: 0.20, atk: 35, def: 15, archetype: 'melee',  position: 'bottom',       abilities: ['tail_crush', 'maelstrom'],              onDestroy: null },
      { id: 'underbelly',   name: 'Underbelly',     hpPercent: 0.25, atk: 15, def: 5,  archetype: 'melee',  position: 'center',       abilities: ['thrash'],                               onDestroy: null, hidden: true },
    ],
    loot: 'ancient_leviathan',
  },
};

// ---------------------------------------------------------------------------
// 4 Ocean regions (bounds from worldgen.js chunk coords)
// ---------------------------------------------------------------------------

var OCEAN_REGIONS = [
  {
    id: 'silver_seas',
    name: 'Silver Seas',
    dangerLevel: 1,
    bounds: { cxMin: 1064, cxMax: 1119, cyMin: 1250, cyMax: 1313 },
    maxActive: 2,
    spawnTable: [
      { templateId: 'reef_titan',     weight: 5 },
      { templateId: 'storm_serpent',  weight: 5 },
    ],
  },
  {
    id: 'eastern_channel',
    name: 'Eastern Channel',
    dangerLevel: 2,
    bounds: { cxMin: 1120, cxMax: 1300, cyMin: 1250, cyMax: 1400 },
    maxActive: 3,
    spawnTable: [
      { templateId: 'reef_titan',      weight: 3 },
      { templateId: 'storm_serpent',   weight: 3 },
      { templateId: 'coral_colossus', weight: 3 },
      { templateId: 'abyssal_maw',    weight: 1 },
    ],
  },
  {
    id: 'southern_ocean',
    name: 'Southern Ocean',
    dangerLevel: 3,
    bounds: { cxMin: 660, cxMax: 1300, cyMin: 1330, cyMax: 1499 },
    maxActive: 4,
    spawnTable: [
      { templateId: 'coral_colossus',    weight: 3 },
      { templateId: 'kraken_titan',      weight: 3 },
      { templateId: 'abyssal_maw',       weight: 3 },
      { templateId: 'leviathan_mother',  weight: 1 },
    ],
  },
  {
    id: 'western_ocean',
    name: 'Western Ocean',
    dangerLevel: 4,
    bounds: { cxMin: 0, cxMax: 660, cyMin: 0, cyMax: 1499 },
    maxActive: 5,
    spawnTable: [
      { templateId: 'kraken_titan',       weight: 2 },
      { templateId: 'abyssal_maw',        weight: 2 },
      { templateId: 'leviathan_mother',   weight: 3 },
      { templateId: 'void_whale',         weight: 2 },
      { templateId: 'ancient_leviathan',  weight: 1 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Loot tables
// ---------------------------------------------------------------------------

var LOOT_TABLES = {
  reef_titan: {
    guaranteed: [
      { resource: 'leviathan_shell', min: 2, max: 4 },
      { resource: 'ancient_coral',   min: 1, max: 3 },
    ],
    rare: [
      { resource: 'leviathan_heart',  chance: 0.20 },
      { resource: 'coral_trophy',     chance: 0.15 },
      { resource: 'sea_mount_egg',    chance: 0.02 },
    ],
  },
  storm_serpent: {
    guaranteed: [
      { resource: 'leviathan_scale',   min: 2, max: 5 },
      { resource: 'storm_scale',       min: 1, max: 3 },
      { resource: 'lightning_essence', min: 1, max: 2 },
    ],
    rare: [
      { resource: 'leviathan_heart',  chance: 0.20 },
      { resource: 'serpent_fang',      chance: 0.25 },
      { resource: 'sea_mount_egg',    chance: 0.02 },
    ],
  },
  coral_colossus: {
    guaranteed: [
      { resource: 'leviathan_shell',  min: 3, max: 6 },
      { resource: 'ancient_coral',    min: 2, max: 5 },
      { resource: 'coral_trophy',     min: 1, max: 2 },
    ],
    rare: [
      { resource: 'leviathan_heart',  chance: 0.22 },
      { resource: 'sea_mount_egg',    chance: 0.03 },
    ],
  },
  kraken_titan: {
    guaranteed: [
      { resource: 'leviathan_scale',  min: 3, max: 6 },
      { resource: 'kraken_ink',       min: 2, max: 4 },
      { resource: 'kraken_beak',      min: 1, max: 2 },
    ],
    rare: [
      { resource: 'leviathan_heart',  chance: 0.22 },
      { resource: 'leviathan_fang',   chance: 0.15 },
      { resource: 'sea_mount_egg',    chance: 0.03 },
    ],
  },
  abyssal_maw: {
    guaranteed: [
      { resource: 'leviathan_scale',  min: 3, max: 5 },
      { resource: 'leviathan_fang',   min: 1, max: 3 },
    ],
    rare: [
      { resource: 'leviathan_heart',  chance: 0.22 },
      { resource: 'serpent_fang',      chance: 0.20 },
      { resource: 'sea_mount_egg',    chance: 0.03 },
    ],
  },
  leviathan_mother: {
    guaranteed: [
      { resource: 'leviathan_scale',  min: 5, max: 10 },
      { resource: 'leviathan_shell',  min: 3, max: 6 },
      { resource: 'leviathan_fang',   min: 2, max: 4 },
    ],
    rare: [
      { resource: 'leviathan_heart',  chance: 0.25 },
      { resource: 'sea_mount_egg',    chance: 0.04 },
    ],
  },
  void_whale: {
    guaranteed: [
      { resource: 'leviathan_scale',  min: 5, max: 10 },
      { resource: 'leviathan_shell',  min: 3, max: 7 },
      { resource: 'lightning_essence', min: 2, max: 4 },
    ],
    rare: [
      { resource: 'leviathan_heart',  chance: 0.25 },
      { resource: 'sea_mount_egg',    chance: 0.04 },
    ],
  },
  ancient_leviathan: {
    guaranteed: [
      { resource: 'leviathan_scale',  min: 8, max: 15 },
      { resource: 'leviathan_shell',  min: 5, max: 10 },
      { resource: 'leviathan_fang',   min: 3, max: 6 },
      { resource: 'ancient_coral',    min: 3, max: 5 },
    ],
    rare: [
      { resource: 'leviathan_heart',  chance: 0.25 },
      { resource: 'coral_trophy',     chance: 0.30 },
      { resource: 'sea_mount_egg',    chance: 0.05 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Scaling: adjusts HP/ATK/DEF by region danger level
// ---------------------------------------------------------------------------

function scaleLeviathan(template, dangerLevel) {
  var dl = Math.max(1, dangerLevel) - 1;
  var hpMult  = 1 + dl * 0.20;
  var atkMult = 1 + dl * 0.15;
  var defMult = 1 + dl * 0.10;

  var scaled = {
    id: template.id,
    name: template.name,
    tier: template.tier,
    totalHp: Math.round(template.totalHp * hpMult),
    baseXp: Math.round(template.baseXp * hpMult),
    baseGold: Math.round(template.baseGold * hpMult),
    phases: template.phases,
    loot: template.loot,
    parts: [],
  };

  for (var i = 0; i < template.parts.length; i++) {
    var p = template.parts[i];
    scaled.parts.push({
      id: p.id,
      name: p.name,
      hpPercent: p.hpPercent,
      hp: Math.round(template.totalHp * hpMult * p.hpPercent),
      atk: Math.round(p.atk * atkMult),
      def: Math.round(p.def * defMult),
      archetype: p.archetype,
      position: p.position,
      abilities: p.abilities,
      onDestroy: p.onDestroy,
      hidden: p.hidden || false,
    });
  }

  return scaled;
}

// ---------------------------------------------------------------------------
// Loot rolling
// ---------------------------------------------------------------------------

function rollLeviathanLoot(lootTableId) {
  var table = LOOT_TABLES[lootTableId];
  if (!table) return [];

  var drops = [];

  // Guaranteed drops
  for (var i = 0; i < table.guaranteed.length; i++) {
    var g = table.guaranteed[i];
    var qty = g.min + Math.floor(Math.random() * (g.max - g.min + 1));
    if (qty > 0) {
      drops.push({ resource: g.resource, quantity: qty });
    }
  }

  // Rare drops
  for (var r = 0; r < table.rare.length; r++) {
    var rd = table.rare[r];
    if (Math.random() < rd.chance) {
      drops.push({ resource: rd.resource, quantity: 1 });
    }
  }

  return drops;
}

// ---------------------------------------------------------------------------
// Ocean arena layout generator
// ---------------------------------------------------------------------------

function generateOceanArenaLayout(width, height, rng, tier) {
  // Initialize grid with walls (water boundary)
  var WALL = 0;
  var FLOOR = 1;
  var grid = [];
  for (var y = 0; y < height; y++) {
    grid[y] = [];
    for (var x = 0; x < width; x++) {
      grid[y][x] = WALL;
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
      grid[sy][sx] = FLOOR;
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
      grid[ay][ax] = FLOOR;
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
        grid[cy][cx] = FLOOR;
      }
    }
  }

  // Floating debris: 1x1 WALL obstacles scattered in arena
  var debrisCount = 6 + Math.floor(rng() * 8);
  for (var di = 0; di < debrisCount; di++) {
    var dx = arenaX + 2 + Math.floor(rng() * (arenaW - 4));
    var dy = arenaY + 2 + Math.floor(rng() * (arenaH - 4));
    grid[dy][dx] = WALL;
  }

  // Coral pillars: 3x3 WALL clusters for cover
  var pillarCount = (tier === 'colossal') ? 6 : (tier === 'massive') ? 4 : 3;
  for (var pi = 0; pi < pillarCount; pi++) {
    var px = arenaX + 4 + Math.floor(rng() * (arenaW - 8));
    var py = arenaY + 4 + Math.floor(rng() * (arenaH - 8));
    for (var ppy = py; ppy < py + 3 && ppy < arenaY + arenaH - 1; ppy++) {
      for (var ppx = px; ppx < px + 3 && ppx < arenaX + arenaW - 1; ppx++) {
        grid[ppy][ppx] = WALL;
      }
    }
  }

  // 2x2 debris clusters
  var clusterCount = 2 + Math.floor(rng() * 3);
  for (var ci = 0; ci < clusterCount; ci++) {
    var cxx = arenaX + 3 + Math.floor(rng() * (arenaW - 6));
    var cyy = arenaY + 3 + Math.floor(rng() * (arenaH - 6));
    if (cyy + 1 < arenaY + arenaH && cxx + 1 < arenaX + arenaW) {
      grid[cyy][cxx] = WALL;
      grid[cyy][cxx + 1] = WALL;
      grid[cyy + 1][cxx] = WALL;
      grid[cyy + 1][cxx + 1] = WALL;
    }
  }

  return { grid: grid, rooms: rooms, spawnRoom: rooms[0], arenaRoom: rooms[1] };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  SIZE_TIERS: SIZE_TIERS,
  PART_POSITIONS: PART_POSITIONS,
  LEVIATHAN_TEMPLATES: LEVIATHAN_TEMPLATES,
  OCEAN_REGIONS: OCEAN_REGIONS,
  LOOT_TABLES: LOOT_TABLES,
  scaleLeviathan: scaleLeviathan,
  rollLeviathanLoot: rollLeviathanLoot,
  generateOceanArenaLayout: generateOceanArenaLayout,
};
