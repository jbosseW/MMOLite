// combat-raid-boss.js
// Lich Raid Boss combat system — threat tables, multi-phase boss fights,
// phylactery mechanics, and multi-action boss turns.
//
// Extracted from dungeon-combat.js. All functions preserve their original
// signatures and behavior. Dependencies from the core combat engine are
// injected via init().

'use strict';

var combatGrid = require('./combat-grid');
var isWalkableCombat = combatGrid.isWalkableCombat;
var getAdjacentTiles = combatGrid.getAdjacentTiles;

// ---------------------------------------------------------------------------
// Injected dependencies (set by init())
// ---------------------------------------------------------------------------

var activeCombats;    // Map — module-level combat storage from dungeon-combat
var initCombat;       // function(dungeonId, players, enemies, floor, callbacks)
var getUnitAtPosition; // function(combat, x, y)
var handleUnitDeath;  // function(combat, unitId, killerId)
var checkCombatEnd;   // function(combat) -> result|null
var endCombat;        // function(combat, result)
var advanceCombat;    // function(combat)

function init(deps) {
  activeCombats     = deps.activeCombats;
  initCombat        = deps.initCombat;
  getUnitAtPosition = deps.getUnitAtPosition;
  handleUnitDeath   = deps.handleUnitDeath;
  checkCombatEnd    = deps.checkCombatEnd;
  endCombat         = deps.endCombat;
  advanceCombat     = deps.advanceCombat;
}

// ---------------------------------------------------------------------------
// Threat table
// ---------------------------------------------------------------------------
// combat.threatTable = Map<unitId, { damage: 0, healing: 0, total: 0 }>
// combat.partyGroups = [[unitIds], [unitIds], ...]
// combat.lichRaidPhase = 1-4
// combat.phylacteries = [] (phase 2 destructible units)

function updateThreat(combat, unitId, amount, type) {
  if (!combat.threatTable) return;
  var entry = combat.threatTable.get(unitId);
  if (!entry) {
    entry = { damage: 0, healing: 0, total: 0 };
    combat.threatTable.set(unitId, entry);
  }
  var mult = (type === 'healing') ? 0.5 : (type === 'taunt') ? 2.0 : 1.0;
  var threatAmount = Math.abs(amount) * mult;
  if (type === 'damage') entry.damage += Math.abs(amount);
  else if (type === 'healing') entry.healing += Math.abs(amount);
  entry.total += threatAmount;
  combat.threatTable.set(unitId, entry);
}

function getTopThreats(combat, count) {
  if (!combat.threatTable) return [];
  var entries = [];
  var iter = combat.threatTable.entries();
  var e = iter.next();
  while (!e.done) {
    var unit = combat.units.get(e.value[0]);
    if (unit && unit.alive && unit.type === 'player') {
      entries.push({ id: e.value[0], threat: e.value[1].total });
    }
    e = iter.next();
  }
  entries.sort(function(a, b) { return b.threat - a.threat; });
  return entries.slice(0, count).map(function(e) { return e.id; });
}

// ---------------------------------------------------------------------------
// Boss targeting helpers
// ---------------------------------------------------------------------------

function getLowestHpPlayer(combat) {
  var lowest = null;
  var lowestHp = Infinity;
  var iter = combat.units.values();
  var e = iter.next();
  while (!e.done) {
    if (e.value.type === 'player' && e.value.alive && e.value.hp < lowestHp) {
      lowest = e.value.id;
      lowestHp = e.value.hp;
    }
    e = iter.next();
  }
  return lowest;
}

function getBestClusterTarget(combat) {
  // Find the player position with most allies within 2 tiles
  var bestId = null;
  var bestCount = 0;
  var playerPositions = [];
  var iter = combat.units.values();
  var e = iter.next();
  while (!e.done) {
    if (e.value.type === 'player' && e.value.alive) {
      playerPositions.push({ id: e.value.id, x: e.value.x, y: e.value.y });
    }
    e = iter.next();
  }
  for (var i = 0; i < playerPositions.length; i++) {
    var count = 0;
    for (var j = 0; j < playerPositions.length; j++) {
      if (i === j) continue;
      var dist = Math.abs(playerPositions[i].x - playerPositions[j].x) +
                 Math.abs(playerPositions[i].y - playerPositions[j].y);
      if (dist <= 2) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestId = playerPositions[i].id;
    }
  }
  return bestId || (playerPositions.length > 0 ? playerPositions[0].id : null);
}

function getRandomPartyTargets(combat) {
  // Pick a random party group and return all alive member unitIds
  if (!combat.partyGroups || combat.partyGroups.length === 0) return [];
  var aliveGroups = [];
  for (var gi = 0; gi < combat.partyGroups.length; gi++) {
    var aliveMembers = [];
    for (var mi = 0; mi < combat.partyGroups[gi].length; mi++) {
      var unit = combat.units.get(combat.partyGroups[gi][mi]);
      if (unit && unit.alive) aliveMembers.push(unit.id);
    }
    if (aliveMembers.length > 0) aliveGroups.push(aliveMembers);
  }
  if (aliveGroups.length === 0) return [];
  return aliveGroups[Math.floor(Math.random() * aliveGroups.length)];
}

function selectBossTarget(combat, actionIndex) {
  var mode = actionIndex % 4;
  switch (mode) {
    case 0: // highest threat
      var topThreats = getTopThreats(combat, 1);
      return topThreats.length > 0 ? { targets: [topThreats[0]], mode: 'highest_threat' } : null;
    case 1: // lowest HP — finish off weak targets
      var lowHp = getLowestHpPlayer(combat);
      return lowHp ? { targets: [lowHp], mode: 'lowest_hp' } : null;
    case 2: // AoE cluster — hit densest player group
      var cluster = getBestClusterTarget(combat);
      return cluster ? { targets: [cluster], mode: 'cluster_aoe', isAoE: true } : null;
    case 3: // random party — attack entire party
      var partyTargets = getRandomPartyTargets(combat);
      return partyTargets.length > 0 ? { targets: partyTargets, mode: 'random_party', isPartyWide: true } : null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Add spawning
// ---------------------------------------------------------------------------

var _spawnAddSeq = 0;

function spawnCombatAdd(combat, addTemplate, count) {
  var spawned = [];
  for (var i = 0; i < count; i++) {
    var addId = 'add_' + Date.now() + '_' + (++_spawnAddSeq);
    var add = {
      id: addId,
      type: 'enemy',
      name: addTemplate.name || 'Summoned Undead',
      hp: addTemplate.hp || 50,
      maxHp: addTemplate.hp || 50,
      x: 0,
      y: 0,
      ct: 0,
      speed: addTemplate.speed || 8,
      alive: true,
      statusEffects: [],
      equippedCards: [],
      abilityCooldowns: new Map(),
      combat: {
        atk: addTemplate.atk || 15,
        def: addTemplate.def || 5,
      },
      abilities: addTemplate.abilities || [],
      xp: addTemplate.xp || 10,
      gold: addTemplate.gold || 5,
      isBoss: false,
      isPhylactery: addTemplate.isPhylactery || false,
      isAdd: true,
    };
    // Find a walkable, unoccupied spawn position
    var spawnX = (addTemplate.x != null) ? addTemplate.x : Math.floor(Math.random() * (combat.floor ? combat.floor.width : 20));
    var spawnY = (addTemplate.y != null) ? addTemplate.y : Math.floor(Math.random() * (combat.floor ? combat.floor.height : 20));
    if (combat.floor && combat.floor.grid) {
      if (!isWalkableCombat(combat.floor.grid, spawnX, spawnY, combat.floor.width, combat.floor.height, null) || getUnitAtPosition(combat, spawnX, spawnY)) {
        var _spawnFound = false;
        for (var _sr = 1; _sr <= 5 && !_spawnFound; _sr++) {
          var _adj = getAdjacentTiles(spawnX, spawnY, combat.floor.width, combat.floor.height);
          for (var _ai = 0; _ai < _adj.length; _ai++) {
            if (isWalkableCombat(combat.floor.grid, _adj[_ai].x, _adj[_ai].y, combat.floor.width, combat.floor.height, null) && !getUnitAtPosition(combat, _adj[_ai].x, _adj[_ai].y)) {
              spawnX = _adj[_ai].x; spawnY = _adj[_ai].y; _spawnFound = true; break;
            }
          }
          if (!_spawnFound) { spawnX += _sr; spawnY += _sr; }
        }
      }
    }
    add.x = spawnX;
    add.y = spawnY;
    combat.units.set(addId, add);
    spawned.push(add);
  }

  // Broadcast spawned adds
  if (combat.callbacks.broadcastToFloor) {
    combat.callbacks.broadcastToFloor('tc_units_spawned', {
      combatId: combat.id,
      units: spawned.map(function(u) {
        return { id: u.id, name: u.name, hp: u.hp, maxHp: u.maxHp, x: u.x, y: u.y, isPhylactery: u.isPhylactery };
      }),
    });
  }
  return spawned;
}

// ---------------------------------------------------------------------------
// Lich raid boss phases
// ---------------------------------------------------------------------------

var LICH_RAID_PHASES = [
  { threshold: 1.0, name: 'Awakening', addsPerCycle: 2, addType: 'skeleton' },
  { threshold: 0.7, name: 'Phylactery Shield', phylacteryCount: 4, bossImmune: true },
  { threshold: 0.4, name: 'Necrotic Storm', addsPerParty: 1, hasCorruptionZones: true, deathCoilMult: 2.0 },
  { threshold: 0.15, name: 'Undeath Unbound', enrage: true, atkMult: 1.5, soulHarvestAll: true, deathStormMult: 2.5 },
];

function getLichRaidPhase(combat) {
  if (!combat.isLichRaid) return 0;
  var bossUnit = null;
  var iter = combat.units.values();
  var e = iter.next();
  while (!e.done) {
    if (e.value.isBoss && e.value.alive) { bossUnit = e.value; break; }
    e = iter.next();
  }
  if (!bossUnit) return combat.lichRaidPhase || 1;
  var hpPct = bossUnit.hp / bossUnit.maxHp;
  if (hpPct <= 0.15) return 4;
  if (hpPct <= 0.40) return 3;
  if (hpPct <= 0.70) return 2;
  return 1;
}

function handleLichRaidPhaseTransition(combat, oldPhase, newPhase) {
  if (oldPhase === newPhase) return;
  combat.lichRaidPhase = newPhase;
  var phaseDef = LICH_RAID_PHASES[newPhase - 1];

  // Broadcast phase change
  if (combat.callbacks.broadcastToFloor) {
    combat.callbacks.broadcastToFloor('tc_boss_phase_change', {
      combatId: combat.id,
      phase: newPhase,
      phaseName: phaseDef.name,
      message: 'Phase ' + newPhase + ': ' + phaseDef.name,
    });
  }

  // Phase 2: spawn phylacteries, boss becomes immune
  if (newPhase === 2) {
    var bossUnit = null;
    var iter = combat.units.values();
    var e = iter.next();
    while (!e.done) {
      if (e.value.isBoss && e.value.alive) { bossUnit = e.value; break; }
      e = iter.next();
    }
    if (bossUnit) {
      bossUnit._isPhylacteryImmune = true;
      var phylHp = Math.ceil(bossUnit.maxHp * 0.05);
      combat.phylacteries = [];
      for (var phi = 0; phi < 4; phi++) {
        var phylactery = {
          name: 'Phylactery of Veranthos',
          hp: phylHp,
          atk: 0,
          def: 10,
          speed: 1,
          x: bossUnit.x + (phi % 2 === 0 ? -3 : 3),
          y: bossUnit.y + (phi < 2 ? -3 : 3),
          isPhylactery: true,
          xp: 20,
          gold: 10,
        };
        var spawned = spawnCombatAdd(combat, phylactery, 1);
        combat.phylacteries.push(spawned[0].id);
      }
    }
  }

  // Phase 3: spawn unkillable adds (1 per party)
  if (newPhase === 3) {
    var bossUnit2 = null;
    var iter2 = combat.units.values();
    var e2 = iter2.next();
    while (!e2.done) {
      if (e2.value.isBoss && e2.value.alive) { bossUnit2 = e2.value; break; }
      e2 = iter2.next();
    }
    if (bossUnit2) {
      // Remove phylactery immunity
      bossUnit2._isPhylacteryImmune = false;
      // Burst damage on transition
      var burstDmg = Math.ceil(bossUnit2.maxHp * 0.10);
      bossUnit2.hp = Math.max(1, bossUnit2.hp - burstDmg);
    }
    // Spawn undead adds (1 per party group)
    var addCount = combat.partyGroups ? combat.partyGroups.length : 1;
    spawnCombatAdd(combat, {
      name: 'Necrotic Shade',
      hp: 200,
      atk: 20,
      def: 15,
      speed: 10,
    }, addCount);
  }

  // Phase 4: enrage
  if (newPhase === 4) {
    var bossUnit3 = null;
    var iter3 = combat.units.values();
    var e3 = iter3.next();
    while (!e3.done) {
      if (e3.value.isBoss && e3.value.alive) { bossUnit3 = e3.value; break; }
      e3 = iter3.next();
    }
    if (bossUnit3 && bossUnit3.combat) {
      bossUnit3.combat.atk = Math.ceil((bossUnit3._baseAtk || bossUnit3.combat.atk) * 1.5);
    }
  }
}

function checkPhylacteries(combat) {
  if (!combat.phylacteries || combat.phylacteries.length === 0) return;
  var allDestroyed = true;
  for (var pi = 0; pi < combat.phylacteries.length; pi++) {
    var phyl = combat.units.get(combat.phylacteries[pi]);
    if (phyl && phyl.alive) {
      allDestroyed = false;
      break;
    }
  }
  if (allDestroyed && combat.lichRaidPhase === 2) {
    // Force transition to phase 3
    handleLichRaidPhaseTransition(combat, 2, 3);
  }
}

// ---------------------------------------------------------------------------
// Raid boss combat initialization
// ---------------------------------------------------------------------------

function initRaidBossCombat(dungeonId, parties, bossData, floor, callbacks) {
  // parties: { partyId: [{ socketId, name, combat, rpgStats, race, equippedCards, x, y }] }
  var allPlayers = [];
  var partyGroups = [];

  var partyKeys = Object.keys(parties);
  for (var pi = 0; pi < partyKeys.length; pi++) {
    var partyMembers = parties[partyKeys[pi]];
    var groupIds = [];
    for (var mi = 0; mi < partyMembers.length; mi++) {
      allPlayers.push(partyMembers[mi]);
      groupIds.push('player_' + partyMembers[mi].socketId);
    }
    partyGroups.push(groupIds);
  }

  // Scale boss based on real player count
  var scaleFactor = callbacks.scaleFactor || 1.0;
  var playerCount = allPlayers.length;
  var scaledBoss = {
    id: bossData.id || 'ls_archlich',
    name: bossData.name || 'Archlich Veranthos',
    hp: Math.ceil(bossData.hp * (2 + playerCount * 0.5) * scaleFactor),
    atk: Math.ceil(bossData.atk * (1.5 + playerCount * 0.05) * scaleFactor),
    def: Math.ceil(bossData.def * 1.5),
    xp: bossData.xp * playerCount,
    gold: bossData.gold * playerCount,
    abilities: bossData.abilities || [],
    isBoss: true,
  };

  var enemies = [scaledBoss];

  // Use standard initCombat then enhance with raid features
  var raidCallbacks = {};
  for (var k in callbacks) {
    if (callbacks.hasOwnProperty(k)) raidCallbacks[k] = callbacks[k];
  }
  raidCallbacks.isRaid = true;

  var combat = initCombat(dungeonId, allPlayers, enemies, floor, raidCallbacks);

  // Enhance with lich raid features
  if (combat && activeCombats.has(combat)) {
    // combat is a combatId string from initCombat broadcast
    // Need to get the actual combat object
  }

  // Find the actual combat by ID (initCombat stores it in activeCombats)
  var combatObj = null;
  var combatIter = activeCombats.values();
  var cEntry = combatIter.next();
  while (!cEntry.done) {
    if (cEntry.value.dungeonId === dungeonId && cEntry.value.state !== 'combat_end') {
      combatObj = cEntry.value;
      break;
    }
    cEntry = combatIter.next();
  }

  if (combatObj) {
    combatObj.isLichRaid = true;
    combatObj.threatTable = new Map();
    combatObj.partyGroups = partyGroups;
    combatObj.lichRaidPhase = 1;
    combatObj.phylacteries = [];
    combatObj.bossActionCount = Math.max(1, Math.ceil(playerCount / 4));
    combatObj._raidScaleFactor = scaleFactor;

    // Initialize threat for all players
    for (var ti = 0; ti < allPlayers.length; ti++) {
      combatObj.threatTable.set('player_' + allPlayers[ti].socketId, { damage: 0, healing: 0, total: 0 });
    }
  }

  return combatObj;
}

// ---------------------------------------------------------------------------
// Lich raid boss multi-action turn
// ---------------------------------------------------------------------------

function executeLichRaidBossTurn(combat) {
  var bossUnit = null;
  var iter = combat.units.values();
  var e = iter.next();
  while (!e.done) {
    if (e.value.isBoss && e.value.alive) { bossUnit = e.value; break; }
    e = iter.next();
  }
  if (!bossUnit) return;

  // Check phase transition
  var oldPhase = combat.lichRaidPhase || 1;
  var newPhase = getLichRaidPhase(combat);
  if (newPhase !== oldPhase) {
    handleLichRaidPhaseTransition(combat, oldPhase, newPhase);
  }

  // Check phylacteries (phase 2 immunity)
  checkPhylacteries(combat);

  // Boss is immune during phase 2 if phylacteries alive
  if (bossUnit._isPhylacteryImmune) {
    // Boss still attacks but can't be damaged
    // This is checked in damage calculation, not here
  }

  // Calculate number of actions
  var alivePlayerCount = 0;
  var pIter = combat.units.values();
  var pE = pIter.next();
  while (!pE.done) {
    if (pE.value.type === 'player' && pE.value.alive) alivePlayerCount++;
    pE = pIter.next();
  }
  var actionCount = Math.max(1, Math.ceil(alivePlayerCount / 4));

  // Phase 1: spawn skeleton adds
  var phaseDef = LICH_RAID_PHASES[(combat.lichRaidPhase || 1) - 1];
  if (phaseDef && phaseDef.addsPerCycle) {
    spawnCombatAdd(combat, {
      name: 'Skeletal Guardian',
      hp: 80,
      atk: 12,
      def: 8,
      speed: 6,
      xp: 5,
      gold: 3,
    }, phaseDef.addsPerCycle);
  }

  // Phase 4: Soul Harvest hits ALL players
  if (combat.lichRaidPhase === 4 && bossUnit.combat) {
    var soulHarvestDmg = Math.ceil(bossUnit.combat.atk * 0.3);
    var allPlayerIter = combat.units.values();
    var apE = allPlayerIter.next();
    var soulHarvestTargets = [];
    while (!apE.done) {
      if (apE.value.type === 'player' && apE.value.alive) {
        apE.value.hp = Math.max(0, apE.value.hp - soulHarvestDmg);
        var shKilled = apE.value.hp <= 0;
        if (shKilled) { apE.value.alive = false; apE.value.hp = 0; }
        soulHarvestTargets.push({ id: apE.value.id, damage: soulHarvestDmg, hp: apE.value.hp });
        if (shKilled) handleUnitDeath(combat, apE.value.id, bossUnit.id);
      }
      apE = allPlayerIter.next();
    }
    if (soulHarvestTargets.length > 0 && combat.callbacks.broadcastToFloor) {
      combat.callbacks.broadcastToFloor('tc_boss_soul_harvest', {
        combatId: combat.id,
        bossId: bossUnit.id,
        targets: soulHarvestTargets,
        damage: soulHarvestDmg,
        message: 'Archlich Veranthos unleashes Soul Harvest on all players!',
      });
    }
  }

  // Execute boss actions with threat-based targeting
  for (var ai = 0; ai < actionCount; ai++) {
    var targetInfo = selectBossTarget(combat, ai);
    if (!targetInfo || !targetInfo.targets || targetInfo.targets.length === 0) continue;

    var abilityIndex = ai % (bossUnit.abilities ? bossUnit.abilities.length : 1);
    var ability = bossUnit.abilities ? bossUnit.abilities[abilityIndex] : null;
    var baseDmg = bossUnit.combat ? bossUnit.combat.atk : 30;
    var dmgMult = ability ? (ability.damage || 1.0) : 1.0;

    // Phase 3: Death Coil gets 2x multiplier
    if (combat.lichRaidPhase === 3 && ability && ability.id === 'death_coil') {
      dmgMult *= 2.0;
    }
    // Phase 4: Death Storm gets 2.5x
    if (combat.lichRaidPhase === 4 && ability && ability.id === 'death_storm') {
      dmgMult *= 2.5;
    }

    var totalDmg = Math.ceil(baseDmg * dmgMult);

    for (var ti = 0; ti < targetInfo.targets.length; ti++) {
      var targetUnit = combat.units.get(targetInfo.targets[ti]);
      if (!targetUnit || !targetUnit.alive) continue;

      // Apply party-wide reduced damage if hitting multiple
      var multiTargetReduction = targetInfo.isPartyWide ? 0.6 : 1.0;
      var finalDmg = Math.ceil(totalDmg * multiTargetReduction);

      // Apply defense
      var targetDef = targetUnit.combat ? (targetUnit.combat.def || 0) : 0;
      finalDmg = Math.max(1, finalDmg - Math.floor(targetDef * 0.3));

      targetUnit.hp = Math.max(0, targetUnit.hp - finalDmg);
      if (targetUnit.hp <= 0) {
        targetUnit.alive = false;
        targetUnit.hp = 0;
        handleUnitDeath(combat, targetUnit.id, bossUnit.id);
      }

      // Update threat (boss attacking increases target's threat slightly)
      if (targetUnit.alive) updateThreat(combat, targetUnit.id, finalDmg * 0.1, 'damage');
    }

    // Broadcast boss attack
    if (combat.callbacks.broadcastToFloor) {
      combat.callbacks.broadcastToFloor('tc_boss_attack', {
        combatId: combat.id,
        bossId: bossUnit.id,
        actionIndex: ai,
        targetMode: targetInfo.mode,
        targets: targetInfo.targets.map(function(tId) {
          var u = combat.units.get(tId);
          return u ? { id: u.id, hp: u.hp, maxHp: u.maxHp, alive: u.alive } : { id: tId };
        }),
        ability: ability ? { id: ability.id, name: ability.name } : null,
        damage: totalDmg,
      });
    }
  }

  // Phase 3: corruption zones — mark 3x3 areas that deal damage
  if (combat.lichRaidPhase === 3) {
    var numZones = Math.min(3, Math.max(1, Math.floor(alivePlayerCount / 4)));
    var corruptionZones = [];
    for (var zi = 0; zi < numZones; zi++) {
      // Pick a random player position for zone placement
      var randomTarget = getBestClusterTarget(combat);
      var zoneUnit = randomTarget ? combat.units.get(randomTarget) : null;
      if (zoneUnit) {
        corruptionZones.push({ x: zoneUnit.x, y: zoneUnit.y, radius: 1, damage: Math.ceil(baseDmg * 0.4) });
      }
    }
    if (corruptionZones.length > 0 && combat.callbacks.broadcastToFloor) {
      combat.callbacks.broadcastToFloor('tc_corruption_zones', {
        combatId: combat.id,
        zones: corruptionZones,
        message: 'Necrotic corruption erupts from the ground!',
      });
    }
  }

  // Check for combat end after boss actions
  var checkResult = checkCombatEnd(combat);
  if (checkResult) {
    endCombat(combat, checkResult);
    return;
  }

  // Continue to next player turn cycle
  advanceCombat(combat);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  init: init,
  updateThreat: updateThreat,
  getTopThreats: getTopThreats,
  selectBossTarget: selectBossTarget,
  spawnCombatAdd: spawnCombatAdd,
  getLichRaidPhase: getLichRaidPhase,
  handleLichRaidPhaseTransition: handleLichRaidPhaseTransition,
  checkPhylacteries: checkPhylacteries,
  initRaidBossCombat: initRaidBossCombat,
  executeLichRaidBossTurn: executeLichRaidBossTurn,
  LICH_RAID_PHASES: LICH_RAID_PHASES,
};
