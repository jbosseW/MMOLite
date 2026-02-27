// combat-ai-enemy.js
// Enemy/NPC AI decision-making, enemy turn execution, reaction pausing.
// Extracted from dungeon-combat.js — dungeon-combat.js re-exports all names for backward compatibility.

'use strict';

var dungeonAI = require('./dungeon-ai');
var combatSync = require('./combat-sync');
var combatGrid = require('./combat-grid');
var combatPassives = require('./combat-passive-helpers');

var chebyshevDist = combatGrid.chebyshevDist;
var manhattanDist = combatGrid.manhattanDist;
var bfsPath = combatGrid.bfsPath;
var isWalkableCombat = combatGrid.isWalkableCombat;
var hasImmunity = combatPassives.hasImmunity;
var hasCCImmunity = combatPassives.hasCCImmunity;

// Injected dependencies from dungeon-combat.js
var activeCombats, handlePlayerAction, executeMove, executeBasicAttack, executeAbility;
var handleUnitDeath, checkCombatEnd, endCombat, advanceCombat, endUnitTurn;
var getUnitsInRadius, getUnitAtPosition, checkExhaustion;
var PLAYER_BASE_AP, ENEMY_ANIM_DELAY_MS;

function init(deps) {
  activeCombats      = deps.activeCombats;
  handlePlayerAction = deps.handlePlayerAction;
  executeMove        = deps.executeMove;
  executeBasicAttack = deps.executeBasicAttack;
  executeAbility     = deps.executeAbility;
  handleUnitDeath    = deps.handleUnitDeath;
  checkCombatEnd     = deps.checkCombatEnd;
  endCombat          = deps.endCombat;
  advanceCombat      = deps.advanceCombat;
  endUnitTurn        = deps.endUnitTurn;
  getUnitsInRadius   = deps.getUnitsInRadius;
  getUnitAtPosition  = deps.getUnitAtPosition;
  checkExhaustion    = deps.checkExhaustion;
  PLAYER_BASE_AP     = deps.PLAYER_BASE_AP;
  ENEMY_ANIM_DELAY_MS = deps.ENEMY_ANIM_DELAY_MS;
}

/**
 * Auto-submit actions for NPC units in the current turn group.
 */
function processNPCActions(combat) {
  if (!activeCombats.has(combat.id)) return;
  var npcIds = [];
  for (var i = 0; i < combat.turnGroup.length; i++) {
    var uid = combat.turnGroup[i];
    var unit = combat.units.get(uid);
    if (unit && unit.alive && unit.socketId && unit.socketId.indexOf('npc_') === 0) {
      npcIds.push(uid);
    }
  }
  if (npcIds.length === 0) return;

  setTimeout(function() {
    if (!activeCombats.has(combat.id) || combat.state !== 'player_turn') return;
    for (var ni = 0; ni < npcIds.length; ni++) {
      var npcUnitId = npcIds[ni];
      var npcUnit = combat.units.get(npcUnitId);
      if (!npcUnit || !npcUnit.alive) continue;
      if (combat.pendingActions.get(npcUnitId) === true) continue;

      var npcAction = decideNPCAction(combat, npcUnit);
      handlePlayerAction(combat.id, npcUnit.socketId, npcAction);
    }
  }, 300);
}

/**
 * Decide what action an NPC should take based on their role.
 */
function decideNPCAction(combat, npcUnit) {
  var role = npcUnit._npcRole || 'dps';

  var enemies = [];
  var allies = [];
  var iter = combat.units.values();
  var e = iter.next();
  while (!e.done) {
    if (e.value.alive) {
      if (e.value.type === 'enemy') enemies.push(e.value);
      else if (e.value.type === 'player' && e.value.id !== npcUnit.id) allies.push(e.value);
    }
    e = iter.next();
  }

  if (role === 'healer') {
    var lowestAlly = null;
    var lowestPct = 1.0;
    for (var ai = 0; ai < allies.length; ai++) {
      var pct = allies[ai].hp / allies[ai].maxHp;
      if (pct < lowestPct) { lowestPct = pct; lowestAlly = allies[ai]; }
    }
    if (lowestAlly && lowestPct < 0.6 && npcUnit.combat && npcUnit.combat.mana >= 10) {
      return { type: 'npc_heal', data: { targetId: lowestAlly.id } };
    }
  }

  if (enemies.length > 0) {
    var attackRange = (npcUnit.combat && npcUnit.combat.weaponRange) ? Math.floor(npcUnit.combat.weaponRange) : 1;
    var closestEnemy = null;
    var closestDist = 99999;
    var inRangeEnemy = null;

    for (var ei = 0; ei < enemies.length; ei++) {
      var dist = chebyshevDist(npcUnit.x, npcUnit.y, enemies[ei].x, enemies[ei].y);
      if (dist <= attackRange) {
        if (role === 'dps') {
          if (!inRangeEnemy || enemies[ei].hp < inRangeEnemy.hp) inRangeEnemy = enemies[ei];
        } else {
          if (!inRangeEnemy) inRangeEnemy = enemies[ei];
        }
      }
      if (dist < closestDist) { closestDist = dist; closestEnemy = enemies[ei]; }
    }

    if (inRangeEnemy) {
      return { type: 'attack', data: { targetId: inRangeEnemy.id } };
    }

    if (closestEnemy && npcUnit.mp > 0) {
      var dx = closestEnemy.x - npcUnit.x;
      var dy = closestEnemy.y - npcUnit.y;
      var moveX = npcUnit.x + (dx > 0 ? 1 : dx < 0 ? -1 : 0);
      var moveY = npcUnit.y + (dy > 0 ? 1 : dy < 0 ? -1 : 0);
      return { type: 'move', data: { x: moveX, y: moveY } };
    }
  }

  return { type: 'end_turn', data: {} };
}

/**
 * Pause the enemy turn to give a defending player a chance to react.
 */
function pauseForReaction(combat, defenderId, attackerId, rawDamage, isCrit, callback) {
  var defender = combat.units.get(defenderId);
  if (!defender || defender.type !== 'player' || !defender.alive) {
    callback(null);
    return;
  }

  var attackType = 'melee';
  var attacker = combat.units.get(attackerId);
  if (attacker && attacker.combat && attacker.combat.range && attacker.combat.range > 1) {
    attackType = 'ranged';
  }

  var available = combatSync.checkReactionAvailable(combat, defenderId, attackerId, attackType);
  if (available.length === 0 || !defender.rp || defender.rp <= 0) {
    callback(null);
    return;
  }

  combat.pendingReaction = {
    defenderId: defenderId,
    attackData: {
      attackerId: attackerId,
      damage: rawDamage,
      isCrit: isCrit,
    },
  };

  combat.pendingReactionCallback = function(reactionResult) {
    if (combat.reactionTimer) {
      clearTimeout(combat.reactionTimer);
      combat.reactionTimer = null;
    }
    combat.pendingReaction = null;
    combat.pendingReactionCallback = null;
    callback(reactionResult);
  };

  if (combat.callbacks.emitToPlayer && defender.socketId) {
    combat.callbacks.emitToPlayer(defender.socketId, 'tc_combat_reaction', {
      combatId: combat.id,
      defenderId: defenderId,
      attackerId: attackerId,
      attackerName: attacker ? attacker.name : 'Enemy',
      incomingDamage: rawDamage,
      isCrit: isCrit,
      availableReactions: available,
      timer: 3,
    });
  }

  combat.reactionTimer = setTimeout(function() {
    if (combat.pendingReaction && combat.pendingReaction.defenderId === defenderId) {
      var autoResult = combatSync.executeReaction(
        combat, defenderId, 'pass', combat.pendingReaction.attackData
      );
      if (combat.pendingReactionCallback) {
        combat.pendingReactionCallback(autoResult);
      }
    }
  }, 3000);
}

/**
 * Find the first enemy_attack event targeting a player in the action events.
 */
function findPlayerAttackEvent(combat, actionEvents) {
  for (var fi = 0; fi < actionEvents.length; fi++) {
    var evt = actionEvents[fi];
    if (evt.type === 'enemy_attack' && evt.targetId) {
      var target = combat.units.get(evt.targetId);
      if (target && target.type === 'player') {
        return evt;
      }
    }
  }
  return null;
}

/**
 * Finalize the enemy turn: broadcast action, end turn, and advance combat.
 */
function finishEnemyTurn(combat, unitId, unit, aiAction, actionEvents) {
  if (!activeCombats.has(combat.id)) return;

  if (combat.callbacks.broadcastToFloor) {
    combat.callbacks.broadcastToFloor('tc_combat_enemy_action', {
      combatId: combat.id,
      unitId: unitId,
      enemyName: unit.name,
      action: aiAction.type,
      events: actionEvents,
      enemyX: unit.x,
      enemyY: unit.y,
      enemyHp: unit.hp,
      enemyMaxHp: unit.maxHp,
      turnNumber: combat.turnNumber,
    });
  }

  var actionType = aiAction.type || 'wait';
  endUnitTurn(combat, unitId, actionType === 'attack' ? 'attacked' : (actionType === 'move' ? 'moved' : 'waited'));

  setTimeout(function() {
    advanceCombat(combat);
  }, ENEMY_ANIM_DELAY_MS);
}

/**
 * Start an enemy's turn. Delegates to dungeon AI for decision making.
 */
function startEnemyTurn(combat, unitId) {
  if (!activeCombats.has(combat.id)) return;

  combat.state = 'enemy_turn';
  combat.turnNumber++;

  var unit = combat.units.get(unitId);
  if (!unit || !unit.alive) {
    setTimeout(function() { advanceCombat(combat); }, 50);
    return;
  }

  checkExhaustion(combat);

  var checkResult = checkCombatEnd(combat);
  if (checkResult) {
    endCombat(combat, checkResult);
    return;
  }

  unit.mp = unit.mp || 2;
  unit.ap = PLAYER_BASE_AP;
  unit.momentumShield = 0;

  if (unit.isPlayerSummon && unit.turnsLeft !== undefined) {
    unit.turnsLeft--;
    if (unit.turnsLeft <= 0) {
      unit.alive = false;
      unit.hp = 0;
      handleUnitDeath(combat, unitId, null);
      setTimeout(function() { advanceCombat(combat); }, 50);
      return;
    }
  }

  var playerUnits = [];
  var iter = combat.units.values();
  var entry = iter.next();
  while (!entry.done) {
    var entUnit = entry.value;
    if (unit.isPlayerSummon) {
      if (entUnit.type === 'enemy' && !entUnit.isPlayerSummon && entUnit.alive) {
        playerUnits.push(entUnit);
      }
    } else {
      if (entUnit.type === 'player' && entUnit.alive) {
        playerUnits.push(entUnit);
      }
    }
    entry = iter.next();
  }

  var aiAction = null;
  if (typeof dungeonAI.decideTurnAction === 'function') {
    try {
      aiAction = dungeonAI.decideTurnAction(unit, combat, playerUnits, combat.floor);
    } catch (err) {
      console.error('[dungeon-combat] AI error for ' + unit.name + ':', err.message);
      aiAction = null;
    }
  }

  if (!aiAction) {
    aiAction = fallbackAI(combat, unit, playerUnits);
  }

  var actionEvents = executeAIAction(combat, unit, aiAction, playerUnits);

  var playerAttackEvt = findPlayerAttackEvent(combat, actionEvents);
  if (playerAttackEvt) {
    pauseForReaction(
      combat,
      playerAttackEvt.targetId,
      unitId,
      playerAttackEvt.actualDamage,
      playerAttackEvt.isCrit,
      function(reactionResult) {
        if (reactionResult && reactionResult.reactionType !== 'pass') {
          var damageDiff = playerAttackEvt.actualDamage - reactionResult.modifiedDamage;
          if (damageDiff > 0) {
            var targetUnit = combat.units.get(playerAttackEvt.targetId);
            if (targetUnit && targetUnit.alive) {
              targetUnit.hp = Math.min(targetUnit.maxHp, targetUnit.hp + damageDiff);
            } else if (targetUnit && !targetUnit.alive && damageDiff >= playerAttackEvt.actualDamage) {
              targetUnit.hp = Math.min(targetUnit.maxHp || 1, damageDiff);
              targetUnit.alive = true;
            }
            playerAttackEvt.reactionApplied = true;
            playerAttackEvt.originalDamage = playerAttackEvt.actualDamage;
            playerAttackEvt.actualDamage = reactionResult.modifiedDamage;
            playerAttackEvt.targetHp = targetUnit ? Math.max(0, targetUnit.hp) : 0;
            playerAttackEvt.targetDied = targetUnit ? !targetUnit.alive : true;
          }

          if (reactionResult.counterDamage > 0) {
            var atkUnit = combat.units.get(unitId);
            if (atkUnit && atkUnit.alive) {
              atkUnit.hp -= reactionResult.counterDamage;
              if (atkUnit.hp <= 0) {
                atkUnit.hp = 0;
                atkUnit.alive = false;
                handleUnitDeath(combat, unitId, playerAttackEvt.targetId);
              }
            }
          }

          if (combat.callbacks.broadcastToFloor) {
            combat.callbacks.broadcastToFloor('tc_combat_reaction_result', {
              combatId: combat.id,
              defenderId: playerAttackEvt.targetId,
              attackerId: unitId,
              reactionType: reactionResult.reactionType,
              success: reactionResult.success,
              modifiedDamage: reactionResult.modifiedDamage,
              counterDamage: reactionResult.counterDamage || 0,
              shieldAbsorbed: reactionResult.shieldAbsorbed || 0,
              attackerHp: unit.hp,
              defenderHp: playerAttackEvt.targetHp,
            });
          }
        }

        finishEnemyTurn(combat, unitId, unit, aiAction, actionEvents);
      }
    );
    return;
  }

  finishEnemyTurn(combat, unitId, unit, aiAction, actionEvents);
}

/**
 * Fallback AI when dungeonAI.decideTurnAction is not available.
 */
function fallbackAI(combat, enemy, playerUnits) {
  if (playerUnits.length === 0) {
    return { type: 'wait' };
  }

  var nearest = null;
  var nearestDist = Infinity;
  for (var i = 0; i < playerUnits.length; i++) {
    var p = playerUnits[i];
    var d = manhattanDist(enemy.x, enemy.y, p.x, p.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = p;
    }
  }

  if (!nearest) return { type: 'wait' };

  var attackRange = (enemy.combat && enemy.combat.range) ? enemy.combat.range : 1;
  if (chebyshevDist(enemy.x, enemy.y, nearest.x, nearest.y) <= attackRange) {
    return { type: 'attack', targetId: nearest.id };
  }

  var path = bfsPath(
    combat, combat.floor.grid, enemy.x, enemy.y, nearest.x, nearest.y,
    enemy.mp, combat.units, combat.floor.width, combat.floor.height, enemy.id
  );

  if (path && path.length > 1) {
    return { type: 'move_attack', movePath: path, targetId: nearest.id };
  }

  return { type: 'wait' };
}

/**
 * Apply on-hit effects, pierce, and chain from a player summon's attack.
 */
function _applySummonOnHit(combat, attacker, primaryTarget, atkDmg, events) {
  if (!attacker || !primaryTarget) return;
  var floor = combat.floor;
  var grid  = floor ? floor.grid  : null;
  var gridW = floor ? (floor.width  || (grid && grid[0] && grid[0].length) || 0) : 0;
  var gridH = floor ? (floor.height || (grid && grid.length) || 0) : 0;

  // 1. Status on-hit effects on primary target
  if (attacker.onHitEffects && attacker.onHitEffects.length > 0) {
    if (!primaryTarget.statusEffects) primaryTarget.statusEffects = [];
    for (var _sohi = 0; _sohi < attacker.onHitEffects.length; _sohi++) {
      var _soh = attacker.onHitEffects[_sohi];
      switch (_soh.type) {
        case 'bleed':
          if (Math.random() < (_soh.chance || 0.25)) {
            primaryTarget.statusEffects.push({ name: 'bleeding', type: 'debuff', duration: _soh.duration || 2, tickDamage: _soh.tickDamage || 4, sourceId: attacker.id });
            events.push({ type: 'summon_on_hit', effect: 'bleeding', unitId: primaryTarget.id, attackerId: attacker.id });
          }
          break;
        case 'burn':
          if (Math.random() < (_soh.chance || 0.25)) {
            primaryTarget.statusEffects.push({ name: 'burned', type: 'debuff', duration: 2, tickDamage: Math.max(3, Math.round(atkDmg * 0.15)), sourceId: attacker.id });
            events.push({ type: 'summon_on_hit', effect: 'burned', unitId: primaryTarget.id, attackerId: attacker.id });
          }
          break;
        case 'slow':
          if (Math.random() < (_soh.chance || 0.25)) {
            primaryTarget.statusEffects.push({ name: 'slowed', type: 'debuff', duration: 2, speedReduction: 0.5, sourceId: attacker.id });
            events.push({ type: 'summon_on_hit', effect: 'slowed', unitId: primaryTarget.id, attackerId: attacker.id });
          }
          break;
        case 'poison':
          if (Math.random() < (_soh.chance || 0.20) && !hasImmunity(primaryTarget, 'poison')) {
            primaryTarget.statusEffects.push({ name: 'poisoned', type: 'debuff', duration: 3, tickDamage: Math.max(2, Math.round(atkDmg * 0.10)), sourceId: attacker.id });
            events.push({ type: 'summon_on_hit', effect: 'poisoned', unitId: primaryTarget.id, attackerId: attacker.id });
          }
          break;
        case 'stun':
          if (Math.random() < (_soh.chance || 0.15) && !hasCCImmunity(primaryTarget, 'stunned')) {
            primaryTarget.statusEffects.push({ name: 'stunned', type: 'debuff', duration: _soh.duration || 1, skipTurn: true, sourceId: attacker.id });
            events.push({ type: 'summon_on_hit', effect: 'stunned', unitId: primaryTarget.id, attackerId: attacker.id });
          }
          break;
        case 'mark':
          if (Math.random() < (_soh.chance || 0.20)) {
            primaryTarget.statusEffects.push({ name: 'marked', type: 'debuff', duration: 2, damageTakenBonus: _soh.damageTakenBonus || 0.10, sourceId: attacker.id });
            events.push({ type: 'summon_on_hit', effect: 'marked', unitId: primaryTarget.id, attackerId: attacker.id });
          }
          break;
        case 'mana_drain':
          var _sohManaDrain = Math.min(_soh.value || 4, (primaryTarget.combat && primaryTarget.combat.mana) || 0);
          if (_sohManaDrain > 0 && primaryTarget.combat) {
            primaryTarget.combat.mana = Math.max(0, (primaryTarget.combat.mana || 0) - _sohManaDrain);
            events.push({ type: 'summon_on_hit', effect: 'mana_drain', unitId: primaryTarget.id, attackerId: attacker.id, amount: _sohManaDrain });
          }
          break;
        case 'wound':
          primaryTarget.statusEffects.push({ name: 'wounded', type: 'debuff', duration: 3, healingReduction: _soh.healing_reduction || 0.30, sourceId: attacker.id });
          events.push({ type: 'summon_on_hit', effect: 'wounded', unitId: primaryTarget.id, attackerId: attacker.id });
          break;
        case 'knockback':
          if (grid && !hasCCImmunity(primaryTarget, 'knockback')) {
            var _sohKbDx = primaryTarget.x - attacker.x, _sohKbDy = primaryTarget.y - attacker.y;
            var _sohKbNx = _sohKbDx === 0 ? 0 : (_sohKbDx > 0 ? 1 : -1);
            var _sohKbNy = _sohKbDy === 0 ? 0 : (_sohKbDy > 0 ? 1 : -1);
            if (_sohKbNx === 0 && _sohKbNy === 0) _sohKbNx = 1;
            var _sohKbFX = primaryTarget.x, _sohKbFY = primaryTarget.y;
            for (var _sohKbt = 0; _sohKbt < (_soh.tiles || 1); _sohKbt++) {
              var _sohKbNxT = _sohKbFX + _sohKbNx, _sohKbNyT = _sohKbFY + _sohKbNy;
              if (!isWalkableCombat(grid, _sohKbNxT, _sohKbNyT, gridW, gridH, null) || getUnitAtPosition(combat, _sohKbNxT, _sohKbNyT)) break;
              _sohKbFX = _sohKbNxT; _sohKbFY = _sohKbNyT;
            }
            if (_sohKbFX !== primaryTarget.x || _sohKbFY !== primaryTarget.y) {
              primaryTarget.x = _sohKbFX; primaryTarget.y = _sohKbFY;
              events.push({ type: 'summon_knockback', unitId: primaryTarget.id, attackerId: attacker.id, newX: _sohKbFX, newY: _sohKbFY });
            }
          }
          break;
        case 'push':
          if (grid && !hasCCImmunity(primaryTarget, 'knockback')) {
            var _sohPsDx = primaryTarget.x - attacker.x, _sohPsDy = primaryTarget.y - attacker.y;
            var _sohPsNx = _sohPsDx === 0 ? 0 : (_sohPsDx > 0 ? 1 : -1);
            var _sohPsNy = _sohPsDy === 0 ? 0 : (_sohPsDy > 0 ? 1 : -1);
            if (_sohPsNx === 0 && _sohPsNy === 0) _sohPsNx = 1;
            var _sohPsFX = primaryTarget.x, _sohPsFY = primaryTarget.y;
            for (var _sohPst = 0; _sohPst < (_soh.tiles || 2); _sohPst++) {
              var _sohPsNxT = _sohPsFX + _sohPsNx, _sohPsNyT = _sohPsFY + _sohPsNy;
              if (!isWalkableCombat(grid, _sohPsNxT, _sohPsNyT, gridW, gridH, null) || getUnitAtPosition(combat, _sohPsNxT, _sohPsNyT)) break;
              _sohPsFX = _sohPsNxT; _sohPsFY = _sohPsNyT;
            }
            if (_sohPsFX !== primaryTarget.x || _sohPsFY !== primaryTarget.y) {
              primaryTarget.x = _sohPsFX; primaryTarget.y = _sohPsFY;
              events.push({ type: 'summon_knockback', unitId: primaryTarget.id, attackerId: attacker.id, newX: _sohPsFX, newY: _sohPsFY });
            }
          }
          break;
        case 'pull':
          if (grid && !hasCCImmunity(primaryTarget, 'knockback')) {
            var _sohPlDx = attacker.x - primaryTarget.x, _sohPlDy = attacker.y - primaryTarget.y;
            var _sohPlNx = _sohPlDx === 0 ? 0 : (_sohPlDx > 0 ? 1 : -1);
            var _sohPlNy = _sohPlDy === 0 ? 0 : (_sohPlDy > 0 ? 1 : -1);
            var _sohPlFX = primaryTarget.x, _sohPlFY = primaryTarget.y;
            for (var _sohPlt = 0; _sohPlt < (_soh.tiles || 1); _sohPlt++) {
              var _sohPlNxT = _sohPlFX + _sohPlNx, _sohPlNyT = _sohPlFY + _sohPlNy;
              if (_sohPlNxT === attacker.x && _sohPlNyT === attacker.y) break;
              if (!isWalkableCombat(grid, _sohPlNxT, _sohPlNyT, gridW, gridH, null) || getUnitAtPosition(combat, _sohPlNxT, _sohPlNyT)) break;
              _sohPlFX = _sohPlNxT; _sohPlFY = _sohPlNyT;
            }
            if (_sohPlFX !== primaryTarget.x || _sohPlFY !== primaryTarget.y) {
              primaryTarget.x = _sohPlFX; primaryTarget.y = _sohPlFY;
              events.push({ type: 'summon_pull', unitId: primaryTarget.id, attackerId: attacker.id, newX: _sohPlFX, newY: _sohPlFY });
            }
          }
          break;
      }
    }
  }

  // 2. Pierce: hit enemies along the attacker→target direction vector
  if (attacker.pierceTargets > 0 && grid) {
    var _pierceDx = primaryTarget.x - attacker.x, _pierceDy = primaryTarget.y - attacker.y;
    var _pierceNx = _pierceDx === 0 ? 0 : (_pierceDx > 0 ? 1 : -1);
    var _pierceNy = _pierceDy === 0 ? 0 : (_pierceDy > 0 ? 1 : -1);
    if (_pierceNx === 0 && _pierceNy === 0) _pierceNx = 1;
    var _pierceX = primaryTarget.x + _pierceNx, _pierceY = primaryTarget.y + _pierceNy;
    var _piercedCount = 0;
    for (var _pri = 0; _pri < 8 && _piercedCount < attacker.pierceTargets; _pri++) {
      if (_pierceX < 0 || _pierceX >= gridW || _pierceY < 0 || _pierceY >= gridH) break;
      var _pierceUnit = getUnitAtPosition(combat, _pierceX, _pierceY);
      if (_pierceUnit && _pierceUnit.alive && _pierceUnit.type === 'enemy' && !_pierceUnit.isPlayerSummon) {
        var _pierceRes = executeBasicAttack(combat, attacker.id, _pierceUnit.id);
        if (_pierceRes.success) {
          if (_pierceRes.targetDied) handleUnitDeath(combat, _pierceUnit.id, attacker.id);
          events.push({ type: 'summon_pierce', attackerId: attacker.id, targetId: _pierceUnit.id,
            damage: _pierceRes.damage, actualDamage: _pierceRes.actualDamage,
            targetDied: _pierceRes.targetDied, targetHp: _pierceRes.targetHp });
          _piercedCount++;
        }
      }
      _pierceX += _pierceNx; _pierceY += _pierceNy;
    }
  }

  // 3. Chain: bounce to nearest unhit enemy at falloff damage
  if (attacker.chainBounces > 0) {
    var _chainFalloff = attacker.chainFalloff || 0.6;
    var _chainHit = [primaryTarget.id];
    var _chainFrom = primaryTarget;
    var _chainDmg = (attacker.combat && attacker.combat.atk) ? attacker.combat.atk : atkDmg;
    for (var _cbi = 0; _cbi < attacker.chainBounces; _cbi++) {
      _chainDmg = Math.round(_chainDmg * _chainFalloff);
      if (_chainDmg < 1) break;
      var _chainNearest = null, _chainNearestDist = 99;
      combat.units.forEach(function(u) {
        if (!u.alive || u.type !== 'enemy' || u.isPlayerSummon) return;
        if (_chainHit.indexOf(u.id) !== -1) return;
        var _cd = Math.abs(u.x - _chainFrom.x) + Math.abs(u.y - _chainFrom.y);
        if (_cd <= 6 && _cd < _chainNearestDist) { _chainNearest = u; _chainNearestDist = _cd; }
      });
      if (!_chainNearest) break;
      _chainHit.push(_chainNearest.id);
      var _chainDef = (_chainNearest.combat && _chainNearest.combat.def) ? _chainNearest.combat.def : 0;
      var _chainActual = Math.max(1, _chainDmg - _chainDef);
      _chainNearest.hp = Math.max(0, (_chainNearest.hp || 0) - _chainActual);
      var _chainDied = _chainNearest.hp <= 0;
      if (_chainDied) { _chainNearest.alive = false; handleUnitDeath(combat, _chainNearest.id, attacker.id); }
      events.push({ type: 'summon_chain', attackerId: attacker.id, targetId: _chainNearest.id,
        damage: _chainDmg, actualDamage: _chainActual, targetDied: _chainDied,
        targetHp: _chainNearest.hp, bounce: _cbi + 1 });
      _chainFrom = _chainNearest;
    }
  }
}

/**
 * Execute an AI-decided action for an enemy unit.
 * Returns array of event objects for broadcasting.
 */
function executeAIAction(combat, enemy, action, playerUnits) {
  var events = [];

  if (!action) return events;

  switch (action.type) {
    case 'move':
      if (action.movePath && action.movePath.length > 1) {
        var moveResult = executeMove(combat, enemy.id, action.movePath);
        events.push({
          type: 'enemy_move',
          unitId: enemy.id,
          path: action.movePath,
          tilesMoved: moveResult.tilesMoved,
          finalX: enemy.x,
          finalY: enemy.y,
        });
        if (moveResult.events) {
          events = events.concat(moveResult.events);
        }
      }
      break;

    case 'attack':
      if (action.targetId) {
        var atkResult = executeBasicAttack(combat, enemy.id, action.targetId);
        if (atkResult.success) {
          if (atkResult.targetDied) {
            handleUnitDeath(combat, action.targetId, enemy.id);
            var atkDeathTarget = combat.units.get(action.targetId);
            if (atkDeathTarget && atkDeathTarget.alive) {
              atkResult.targetDied = false;
              atkResult.targetHp = atkDeathTarget.hp;
            }
          }

          events.push({
            type: 'enemy_attack',
            attackerId: enemy.id,
            targetId: action.targetId,
            damage: atkResult.damage,
            actualDamage: atkResult.actualDamage,
            isCrit: atkResult.isCrit,
            dodged: atkResult.dodged || false,
            blocked: atkResult.blocked || false,
            shieldAbsorbed: atkResult.shieldAbsorbed,
            manaShieldAbsorbed: atkResult.manaShieldAbsorbed || 0,
            targetDied: atkResult.targetDied,
            targetHp: atkResult.targetHp,
            targetMaxHp: atkResult.targetMaxHp,
            lifestealHeal: atkResult.lifestealHeal || 0,
            reflectDamage: atkResult.reflectDamage || 0,
          });

          if (enemy.isPlayerSummon && !atkResult.dodged && atkResult.actualDamage > 0) {
            var _atkSohTarget = combat.units.get(action.targetId);
            if (_atkSohTarget) _applySummonOnHit(combat, enemy, _atkSohTarget, atkResult.actualDamage, events);
          }
        }
      }
      break;

    case 'move_attack':
      if (action.movePath && action.movePath.length > 1) {
        var trimmedPath = trimPathForAttack(combat, enemy, action.movePath, action.targetId);
        if (trimmedPath.length > 1) {
          var mResult = executeMove(combat, enemy.id, trimmedPath);
          events.push({
            type: 'enemy_move',
            unitId: enemy.id,
            path: trimmedPath,
            tilesMoved: mResult.tilesMoved,
            finalX: enemy.x,
            finalY: enemy.y,
          });
          if (mResult.events) {
            events = events.concat(mResult.events);
          }
          if (mResult.died) break;
        }
      }

      if (action.targetId && enemy.ap > 0 && enemy.alive) {
        var target = combat.units.get(action.targetId);
        if (target && target.alive) {
          var attackRange2 = (enemy.combat && enemy.combat.range) ? enemy.combat.range : 1;
          if (chebyshevDist(enemy.x, enemy.y, target.x, target.y) <= attackRange2) {
            var aResult = executeBasicAttack(combat, enemy.id, action.targetId);
            if (aResult.success) {
              if (aResult.targetDied) {
                handleUnitDeath(combat, action.targetId, enemy.id);
                var maDeathTarget = combat.units.get(action.targetId);
                if (maDeathTarget && maDeathTarget.alive) {
                  aResult.targetDied = false;
                  aResult.targetHp = maDeathTarget.hp;
                }
              }

              events.push({
                type: 'enemy_attack',
                attackerId: enemy.id,
                targetId: action.targetId,
                damage: aResult.damage,
                actualDamage: aResult.actualDamage,
                isCrit: aResult.isCrit,
                dodged: aResult.dodged || false,
                blocked: aResult.blocked || false,
                shieldAbsorbed: aResult.shieldAbsorbed,
                manaShieldAbsorbed: aResult.manaShieldAbsorbed || 0,
                targetDied: aResult.targetDied,
                targetHp: aResult.targetHp,
                targetMaxHp: aResult.targetMaxHp,
                lifestealHeal: aResult.lifestealHeal || 0,
                reflectDamage: aResult.reflectDamage || 0,
              });

              if (enemy.isPlayerSummon && !aResult.dodged && aResult.actualDamage > 0) {
                var _maSohTarget = combat.units.get(action.targetId);
                if (_maSohTarget) _applySummonOnHit(combat, enemy, _maSohTarget, aResult.actualDamage, events);
              }
            }
          }
        }
      }
      break;

    case 'ability':
      if (action.abilityId) {
        var abilityRes = executeAbility(combat, enemy.id, action.abilityId, action.targetX || enemy.x, action.targetY || enemy.y);
        if (abilityRes.success) {
          events.push({
            type: 'enemy_ability',
            unitId: enemy.id,
            abilityName: abilityRes.abilityName,
            abilityId: abilityRes.abilityId,
            effects: abilityRes.effects,
            targetX: action.targetX,
            targetY: action.targetY,
          });
          if (abilityRes.effects) {
            for (var abi = 0; abi < abilityRes.effects.length; abi++) {
              if (abilityRes.effects[abi].targetDied) {
                handleUnitDeath(combat, abilityRes.effects[abi].targetId, enemy.id);
              }
            }
          }
        } else {
          events.push({ type: 'enemy_wait', unitId: enemy.id });
        }
      } else {
        events.push({ type: 'enemy_wait', unitId: enemy.id });
      }
      break;

    case 'wait':
    default:
      events.push({ type: 'enemy_wait', unitId: enemy.id });
      break;
  }

  return events;
}

/**
 * Trim a movement path so the enemy stops adjacent to the target.
 */
function trimPathForAttack(combat, enemy, path, targetId) {
  var target = combat.units.get(targetId);
  if (!target) return path;

  var attackRange = (enemy.combat && enemy.combat.range) ? enemy.combat.range : 1;

  var bestStop = 0;

  for (var i = 1; i < path.length && i <= enemy.mp; i++) {
    var tile = path[i];
    if (chebyshevDist(tile.x, tile.y, target.x, target.y) <= attackRange) {
      bestStop = i;
      break;
    }
    bestStop = i;
  }

  if (bestStop === 0) return path;

  return path.slice(0, bestStop + 1);
}

module.exports = {
  init: init,
  processNPCActions: processNPCActions,
  decideNPCAction: decideNPCAction,
  pauseForReaction: pauseForReaction,
  findPlayerAttackEvent: findPlayerAttackEvent,
  finishEnemyTurn: finishEnemyTurn,
  startEnemyTurn: startEnemyTurn,
  fallbackAI: fallbackAI,
  executeAIAction: executeAIAction,
  trimPathForAttack: trimPathForAttack,
};
