// director/director-zone.js
// Per-overworld-zone event director (GW2-style).
// 30s tick interval, iterates active zones, spawns mini-events,
// adjusts spawn multipliers based on player stress and macro directives.

'use strict';

// ---------------------------------------------------------------------------
// Zone directives (set by macro director)
// ---------------------------------------------------------------------------

var DIRECTIVES = {
  CALM:      'calm',
  ACTIVE:    'active',
  ESCALATED: 'escalated',
};

// Mini-event pool
var MINI_EVENTS = [
  { id: 'roaming_elite', name: 'Roaming Elite', description: 'A powerful creature roams the area!', duration: 120 },
  { id: 'resource_surge', name: 'Resource Surge', description: 'Rich resource deposits have appeared!', duration: 180 },
  { id: 'weather_shift', name: 'Weather Shift', description: 'Strange weather patterns affect the zone.', duration: 90 },
];

// Spawn multiplier ranges per directive
var SPAWN_MULTIPLIERS = {
  calm: 0.8,
  active: 1.0,
  escalated: 1.5,
};

// ---------------------------------------------------------------------------
// Per-zone director state
// ---------------------------------------------------------------------------

/** @type {Map<string, object>} zoneId -> zone director state */
var zoneStates = new Map();

/** @type {Map<string, string>} zoneId -> directive from macro */
var zoneDirectives = new Map();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Main zone tick — called every 30s from director/index.js.
 */
function tick(io, state, metrics) {
  if (!io || !state) return;

  state.zones.forEach(function(zone, zoneId) {
    if (zone.hidden || zone.type === 'dungeon' || zone.members.size === 0) return;

    // Get or create zone state
    var zs = zoneStates.get(zoneId);
    if (!zs) {
      zs = {
        spawnMultiplier: 1.0,
        activeEvents: [],
        lastEventAt: 0,
        tickCount: 0,
      };
      zoneStates.set(zoneId, zs);
    }
    zs.tickCount++;

    // Gather player socket IDs for this zone
    var socketIds = [];
    zone.members.forEach(function(sid) { socketIds.push(sid); });

    // Get stress aggregates
    var agg = metrics.getZoneAggregates(socketIds);

    // Get directive from macro director
    var directive = zoneDirectives.get(zoneId) || DIRECTIVES.ACTIVE;

    // If 40%+ of zone players are struggling, reduce pressure
    if (agg.total > 0 && (agg.struggling / agg.total) >= 0.4) {
      zs.spawnMultiplier = 0.5;
    } else {
      zs.spawnMultiplier = SPAWN_MULTIPLIERS[directive] || 1.0;
    }

    // Expire old events
    var now = Date.now();
    zs.activeEvents = zs.activeEvents.filter(function(evt) {
      return now < evt.expiresAt;
    });

    // Maybe spawn mini-event during escalated directive
    if (directive === DIRECTIVES.ESCALATED && zs.activeEvents.length === 0 && now - zs.lastEventAt > 60000) {
      var evt = MINI_EVENTS[Math.floor(Math.random() * MINI_EVENTS.length)];
      var activeEvt = {
        id: evt.id,
        name: evt.name,
        description: evt.description,
        startedAt: now,
        expiresAt: now + (evt.duration * 1000),
      };
      zs.activeEvents.push(activeEvt);
      zs.lastEventAt = now;

      // Emit to zone
      io.to('zone:' + zoneId).emit('zone_director_update', {
        message: evt.name + ': ' + evt.description,
        eventType: evt.id,
      });
    }
  });
}

/**
 * Set directive for a specific zone (called by macro director).
 */
function setDirective(zoneId, directive) {
  zoneDirectives.set(zoneId, directive);
}

/**
 * Get current spawn multiplier for a zone.
 */
function getSpawnMultiplier(zoneId) {
  var zs = zoneStates.get(zoneId);
  return zs ? zs.spawnMultiplier : 1.0;
}

/**
 * Get active events for a zone.
 */
function getActiveEvents(zoneId) {
  var zs = zoneStates.get(zoneId);
  return zs ? zs.activeEvents : [];
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  tick: tick,
  setDirective: setDirective,
  getSpawnMultiplier: getSpawnMultiplier,
  getActiveEvents: getActiveEvents,
  DIRECTIVES: DIRECTIVES,
};
