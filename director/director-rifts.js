// director/director-rifts.js
// Thin director wrapper for the mini-rift lifecycle system.
// Delegates to overworld-rifts.js for all spawn/tick/clear logic.
//
// LORE CONTEXT:
// The Soldier — an unnamed Dominion warrior trapped inside the Primary Rift
// for 500 years — is desperately trying to reach Helios, the demi-god sealed
// beneath Solara Cathedral. Secondary rifts are his consciousness bleeding
// through reality. The Hollow are rift inhabitants: beings wearing known race
// shapes with empty eyes that shift species mid-motion. Not malice — desperation.

'use strict';

var overworldRifts = require('../overworld-rifts');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function init(state) {
  overworldRifts.init(state);
}

function tick(io, state, accounts, socketAccountMap) {
  overworldRifts.tick(state, io);
}

function getState() {
  return overworldRifts.getState();
}

function loadState(savedState) {
  overworldRifts.loadState(savedState);
}

function getRifts() {
  return overworldRifts;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  init: init,
  tick: tick,
  getState: getState,
  loadState: loadState,
  getRifts: getRifts,
};
