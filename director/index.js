// director/index.js
// AI Event Director — orchestration entry point.
// Initializes all director tiers (Micro, Zone, Macro) and the Raid system.
// Micro director piggybacks on the existing AI tick in handlers/dungeon.js.
// Zone and Macro directors run on their own intervals.

'use strict';

var directorMetrics = require('./director-metrics');
var directorMicro   = require('./director-micro');
var directorZone    = require('./director-zone');
var directorMacro   = require('./director-macro');
var directorRaid    = require('./director-raid');
var directorOcean   = require('./director-ocean');
var directorLich    = require('./director-lich');

var _io = null;
var _state = null;
var _accounts = null;
var _socketAccountMap = null;
var _zoneInterval = null;
var _macroInterval = null;
var _oceanInterval = null;
var _lichInterval = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize the director system.
 * Call after all handlers are set up and io is ready.
 */
function init(io, state, accounts, socketAccountMap) {
  _io = io;
  _state = state;
  _accounts = accounts;
  _socketAccountMap = socketAccountMap;

  // Initialize zone director (30s interval)
  _zoneInterval = setInterval(function() {
    try {
      directorZone.tick(_io, _state, directorMetrics);
    } catch (err) {
      console.error('[director] Zone tick error:', err.message);
    }
  }, 30000);
  if (_zoneInterval && _zoneInterval.unref) _zoneInterval.unref();

  // Initialize macro director (5min interval)
  _macroInterval = setInterval(function() {
    try {
      directorMacro.tick(_io, _state, directorMetrics, directorZone);
    } catch (err) {
      console.error('[director] Macro tick error:', err.message);
    }
  }, 5 * 60 * 1000);
  if (_macroInterval && _macroInterval.unref) _macroInterval.unref();

  // Initialize ocean director (60s interval)
  _oceanInterval = setInterval(function() {
    try {
      directorOcean.tick(_io, _state, _accounts, _socketAccountMap);
    } catch (err) {
      console.error('[director] Ocean tick error:', err.message);
    }
  }, 60000);
  if (_oceanInterval && _oceanInterval.unref) _oceanInterval.unref();

  // Initialize lich corruption director (60s interval, daily spread + debuff ticks)
  directorLich.init();
  _lichInterval = setInterval(function() {
    try {
      directorLich.tick(_io, _state, _accounts, _socketAccountMap);
    } catch (err) {
      console.error('[director] Lich tick error:', err.message);
    }
  }, 60000);
  if (_lichInterval && _lichInterval.unref) _lichInterval.unref();

  console.log('[director] AI Event Director initialized (micro=per-tick, zone=30s, macro=5min, ocean=60s, lich=60s)');
}

/**
 * Get references to director subsystems (for injection into handler deps).
 */
function getMetrics() {
  return directorMetrics;
}

function getMicroDirector() {
  return directorMicro;
}

function getZoneDirector() {
  return directorZone;
}

function getMacroDirector() {
  return directorMacro;
}

function getRaid() {
  return directorRaid;
}

function getOceanDirector() {
  return directorOcean;
}

function getLichDirector() {
  return directorLich;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  init: init,
  getMetrics: getMetrics,
  getMicroDirector: getMicroDirector,
  getZoneDirector: getZoneDirector,
  getMacroDirector: getMacroDirector,
  getRaid: getRaid,
  getOceanDirector: getOceanDirector,
  getLichDirector: getLichDirector,
};
