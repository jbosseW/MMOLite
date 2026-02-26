// director/director-macro.js
// Server-wide narrative director (RimWorld-style).
// 5min tick, computes global tension score, fires world events,
// manages 7-day narrative arc, sets zone directives.

'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var EVENT_COOLDOWN_MS = 15 * 60 * 1000;  // 15 minutes between world events
var TENSION_THRESHOLD = 60;               // Tension score to trigger events (0-100)

// World event pool
var directorLich = null;
try { directorLich = require('./director-lich'); } catch (e) { /* optional */ }

var WORLD_EVENTS = [
  {
    id: 'invasion',
    title: 'The Rift Surges!',
    description: 'Creatures from the Rift spill into the overworld. Dungeons grow more dangerous!',
    type: 'combat',
    duration: 10 * 60 * 1000, // 10 minutes
    zoneEffect: 'escalated',
  },
  {
    id: 'world_boss',
    title: 'World Boss Awakens!',
    description: 'A colossal beast has emerged in the wilderness!',
    type: 'boss',
    duration: 15 * 60 * 1000,
    zoneEffect: 'escalated',
  },
  {
    id: 'rift_surge',
    title: 'Rift Energy Surge',
    description: 'The Rift pulses with energy. Dungeon loot is enhanced but enemies grow stronger!',
    type: 'dungeon',
    duration: 8 * 60 * 1000,
    zoneEffect: 'active',
  },
  {
    id: 'economy_disruption',
    title: 'Trade Route Disruption',
    description: 'Trade routes are under threat. Shop prices fluctuate wildly!',
    type: 'economy',
    duration: 12 * 60 * 1000,
    zoneEffect: 'calm',
  },
  {
    id: 'weather_anomaly',
    title: 'Arcane Storm',
    description: 'An arcane storm sweeps across the land, empowering magic but reducing visibility.',
    type: 'weather',
    duration: 6 * 60 * 1000,
    zoneEffect: 'active',
  },
  {
    id: 'lich_corruption_surge',
    title: 'The Corruption Deepens!',
    description: 'Dark energy pulses from the Sanctum of Veranthos. Corruption spreads faster across the land!',
    type: 'lich',
    duration: 10 * 60 * 1000,
    zoneEffect: 'escalated',
  },
  {
    id: 'holy_capital_response',
    title: 'Holy Capital Responds!',
    description: 'The Holy Dominion sends paladins to push back the corruption. Undead are weakened!',
    type: 'lich_counter',
    duration: 8 * 60 * 1000,
    zoneEffect: 'calm',
  },
];

// Narrative arc day effects (7-day cycle)
var NARRATIVE_ARC = [
  { day: 0, label: 'calm',       tensionMod: -10, description: 'A day of peace.' },
  { day: 1, label: 'gathering',  tensionMod: 0,   description: 'Tensions begin to simmer.' },
  { day: 2, label: 'rising',     tensionMod: +10, description: 'Trouble brews on the horizon.' },
  { day: 3, label: 'peak',       tensionMod: +20, description: 'The world strains under pressure.' },
  { day: 4, label: 'crisis',     tensionMod: +30, description: 'Crisis point — events are inevitable.' },
  { day: 5, label: 'resolution', tensionMod: +10, description: 'Forces begin to wane.' },
  { day: 6, label: 'aftermath',  tensionMod: -5,  description: 'The world recovers.' },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

var lastEventAt = 0;
var activeWorldEvents = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Main macro tick — called every 5 minutes from director/index.js.
 */
function tick(io, state, metrics, zoneDirector) {
  if (!io || !state) return;

  var now = Date.now();

  // Get director state from world (or use defaults)
  var ds = state.world.directorState;
  if (!ds) {
    ds = { globalTensionScore: 0, narrativeDay: 0, narrativeDayStartedAt: now, activeWorldEvents: [] };
    state.world.directorState = ds;
  }

  // Advance narrative day every 24 hours of real time
  if (!ds.narrativeDayStartedAt) ds.narrativeDayStartedAt = now;
  if (now - ds.narrativeDayStartedAt >= 24 * 60 * 60 * 1000) {
    ds.narrativeDay = (ds.narrativeDay || 0) + 1;
    ds.narrativeDayStartedAt = now;
  }

  // Get global metrics
  var global = metrics.getGlobalAggregates();

  // Compute global tension score (0-100)
  var tension = 0;

  // Idle rate contributes to tension (bored players = need excitement)
  tension += global.idleRate * 30;

  // Low dungeon participation = boring, raise tension
  tension += (1 - global.dungeonParticipation) * 20;

  // Time since last event
  var timeSinceEvent = now - lastEventAt;
  var timeFactor = Math.min(1, timeSinceEvent / (30 * 60 * 1000)); // caps at 30min
  tension += timeFactor * 25;

  // Low average stress = players are coasting, raise tension
  tension += (1 - global.avgStress) * 15;

  // Narrative arc modifier
  var dayInfo = NARRATIVE_ARC[ds.narrativeDay % 7];
  tension += dayInfo.tensionMod;

  // Player count modifier (more players = more events)
  if (global.totalPlayers >= 10) tension += 10;

  // Lich corruption modifier — high corruption raises global tension
  if (directorLich) {
    var corruptedCount = directorLich.getTotalCorruptedChunks();
    if (corruptedCount > 10) tension += Math.min(20, corruptedCount * 0.5);
  }

  tension = Math.max(0, Math.min(100, tension));
  ds.globalTensionScore = Math.round(tension);

  // Expire old events
  activeWorldEvents = activeWorldEvents.filter(function(evt) {
    return now < evt.expiresAt;
  });
  ds.activeWorldEvents = activeWorldEvents;

  // Check if we should fire a world event
  if (tension > TENSION_THRESHOLD && (now - lastEventAt) > EVENT_COOLDOWN_MS && activeWorldEvents.length === 0) {
    fireWorldEvent(io, state, zoneDirector, ds);
  }
}

/**
 * Fire a random world event.
 */
function fireWorldEvent(io, state, zoneDirector, ds) {
  var now = Date.now();
  var evt = WORLD_EVENTS[Math.floor(Math.random() * WORLD_EVENTS.length)];

  var activeEvt = {
    id: evt.id,
    title: evt.title,
    description: evt.description,
    type: evt.type,
    startedAt: now,
    expiresAt: now + evt.duration,
  };

  activeWorldEvents.push(activeEvt);
  lastEventAt = now;
  ds.activeWorldEvents = activeWorldEvents;

  // Set zone directives based on event
  if (zoneDirector && evt.zoneEffect) {
    state.zones.forEach(function(zone, zoneId) {
      if (!zone.hidden && zone.type !== 'dungeon') {
        zoneDirector.setDirective(zoneId, evt.zoneEffect);
      }
    });
  }

  // Broadcast to all clients
  io.emit('world_event', {
    title: evt.title,
    description: evt.description,
    type: evt.type,
    duration: evt.duration,
  });

  console.log('[director] World event fired: ' + evt.title + ' (tension=' + ds.globalTensionScore + ')');
}

/**
 * Get current global tension score.
 */
function getGlobalTension(state) {
  var ds = state && state.world && state.world.directorState;
  return ds ? ds.globalTensionScore : 0;
}

/**
 * Get active world events.
 */
function getActiveEvents() {
  return activeWorldEvents;
}

/**
 * Reset state (called on daily wipe).
 */
function reset() {
  lastEventAt = 0;
  activeWorldEvents = [];
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  tick: tick,
  getGlobalTension: getGlobalTension,
  getActiveEvents: getActiveEvents,
  reset: reset,
};
