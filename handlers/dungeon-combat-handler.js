// handlers/dungeon-combat-handler.js
// Socket event handler for tactical turn-based combat actions
// Follows project handler pattern: exports { init(io, socket, deps) }

var dungeonCombat = require('../dungeon-combat');
var combatSync = require('../combat-sync');

module.exports = {
  init: function(io, socket, deps) {
    var checkEventRate = deps.checkEventRate;

    // tc_combat_action — client sends combat action (move, attack, ability, swap_card, wait, end_turn)
    socket.on('tc_combat_action', function(data) {

      if (!data || !data.combatId || !data.action) {
        socket.emit('tc_combat_error', { message: 'Invalid combat action data' });
        return;
      }

      // Verify player is in this combat
      var combat = dungeonCombat.getCombatState(data.combatId);
      if (!combat) {
        socket.emit('tc_combat_error', { message: 'Combat not found' });
        return;
      }

      // Find player's unit in combat
      var playerUnit = null;
      combat.units.forEach(function(unit) {
        if (unit.socketId === socket.id && unit.type === 'player') {
          playerUnit = unit;
        }
      });

      if (!playerUnit) {
        socket.emit('tc_combat_error', { message: 'You are not in this combat' });
        return;
      }

      // Validate it's this player's turn
      if (combat.state !== 'player_turn') {
        socket.emit('tc_combat_error', { message: 'Not player turn phase' });
        return;
      }

      var isInTurnGroup = false;
      for (var i = 0; i < combat.turnGroup.length; i++) {
        if (combat.turnGroup[i] === playerUnit.id) {
          isInTurnGroup = true;
          break;
        }
      }
      if (!isInTurnGroup) {
        socket.emit('tc_combat_error', { message: 'Not your turn' });
        return;
      }

      // Delegate to combat engine
      var actionData = {
        type: data.action,
        data: data.data || {}
      };

      var result = dungeonCombat.handlePlayerAction(data.combatId, socket.id, actionData);
      if (result && result.error) {
        socket.emit('tc_combat_error', { message: result.error });
      }
    });

    // tc_combat_react — client sends reaction response (counter, dodge, shield, pass)
    socket.on('tc_combat_react', function(data) {
      try {

        if (!data || !data.combatId || !data.reaction) {
          socket.emit('tc_combat_error', { message: 'Invalid reaction data' });
          return;
        }

        var combat = dungeonCombat.getCombatState(data.combatId);
        if (!combat) {
          socket.emit('tc_combat_error', { message: 'Combat not found' });
          return;
        }

        // Find player unit
        var playerUnit = null;
        combat.units.forEach(function(unit) {
          if (unit.socketId === socket.id && unit.type === 'player') {
            playerUnit = unit;
          }
        });

        if (!playerUnit) {
          socket.emit('tc_combat_error', { message: 'You are not in this combat' });
          return;
        }

        // Validate reaction type
        var validReactions = ['counter_strike', 'dodge_roll', 'magic_shield', 'pass'];
        if (validReactions.indexOf(data.reaction) === -1) {
          socket.emit('tc_combat_error', { message: 'Invalid reaction type' });
          return;
        }

        // Check if there's a pending reaction for this player
        var pending = combat.pendingReaction;
        if (!pending || pending.defenderId !== playerUnit.id) {
          socket.emit('tc_combat_error', { message: 'No pending reaction for you' });
          return;
        }

        // Execute reaction via combat engine
        var reactionResult = combatSync.executeReaction(
          combat, playerUnit.id, data.reaction, pending.attackData
        );

        // Clear pending reaction
        if (combat.reactionTimer) {
          clearTimeout(combat.reactionTimer);
          combat.reactionTimer = null;
        }
        combat.pendingReaction = null;

        // Broadcast reaction result to all players in combat
        combat.units.forEach(function(unit) {
          if (unit.type === 'player' && unit.socketId) {
            var targetSocket = io.sockets.sockets.get(unit.socketId);
            if (targetSocket) {
              targetSocket.emit('tc_combat_reaction_result', {
                combatId: combat.id,
                defenderId: playerUnit.id,
                defenderName: playerUnit.name,
                reactionType: data.reaction,
                success: reactionResult.success,
                modifiedDamage: reactionResult.modifiedDamage,
                counterDamage: reactionResult.counterDamage || 0,
                shieldAbsorbed: reactionResult.shieldAbsorbed || 0,
              });
            }
          }
        });

        // Resume combat flow after reaction resolves
        if (combat.pendingReactionCallback) {
          combat.pendingReactionCallback(reactionResult);
          combat.pendingReactionCallback = null;
        }
      } catch (err) {
        console.error('[tc_combat_react] Error:', err.message);
        // On error, skip reaction and advance turn to prevent combat deadlock
        if (data && data.combatId) {
          var errCombat = dungeonCombat.getCombatState(data.combatId);
          if (errCombat) {
            if (errCombat.reactionTimer) {
              clearTimeout(errCombat.reactionTimer);
              errCombat.reactionTimer = null;
            }
            errCombat.pendingReaction = null;
            if (errCombat.pendingReactionCallback) {
              errCombat.pendingReactionCallback({ success: false, modifiedDamage: 0, counterDamage: 0 });
              errCombat.pendingReactionCallback = null;
            }
          }
        }
        socket.emit('tc_combat_error', { message: 'Reaction failed, skipping' });
      }
    });

    // tc_combat_join_accept — player accepts a late-join offer
    socket.on('tc_combat_join_accept', function(data) {

      if (!data || !data.combatId) {
        socket.emit('tc_combat_error', { message: 'Invalid join data' });
        return;
      }

      // Make sure player is not already in combat
      var existingCombat = dungeonCombat.getCombatBySocketId(socket.id);
      if (existingCombat) {
        socket.emit('tc_combat_error', { message: 'Already in combat' });
        return;
      }

      var combat = dungeonCombat.getCombatState(data.combatId);
      if (!combat) {
        socket.emit('tc_combat_error', { message: 'Combat no longer active' });
        return;
      }

      // Build player data from deps (same pattern as dungeon.js initiateTurnCombat)
      var accKey = deps.socketAccountMap ? deps.socketAccountMap.get(socket.id) : null;
      if (!accKey) return;
      var accounts = deps.accounts;
      var acc = accounts.loadAccount(accKey);
      if (!acc) return;

      var rpgData = require('../rpg-data');
      var pos = deps.state.playerPositions.get(socket.id);
      if (!pos) return;

      var ptx = Math.floor(pos.x / 32);
      var pty = Math.floor(pos.y / 32);

      // Get or init combat state
      var combatState = null;
      if (deps.getPlayerCombat) {
        combatState = deps.getPlayerCombat(socket.id);
      }

      // Resolve equipped card IDs to full card objects (with template combat fields)
      var resolvedCards = [];
      if (acc.rpgCards && acc.equippedCards) {
        var cMap = {};
        for (var ri = 0; ri < acc.rpgCards.length; ri++) {
          cMap[acc.rpgCards[ri].instanceId] = acc.rpgCards[ri];
        }
        for (var rj = 0; rj < acc.equippedCards.length; rj++) {
          var rcid = acc.equippedCards[rj];
          if (!rcid || !cMap[rcid]) continue;
          var rInst = cMap[rcid];
          var rTmpl = rpgData.CARD_BY_ID[rInst.cardId] || {};
          var rc = {
            instanceId: rInst.instanceId,
            cardId: rInst.cardId,
            name: rInst.name,
            type: rInst.type,
            rarity: rInst.rarity,
            effects: rInst.effects || [],
            icon: rInst.icon,
            style: rInst.style,
            fusionCount: rInst.fusionCount || 0,
          };
          if (rTmpl.combatPassive) rc.combatPassive = rTmpl.combatPassive;
          if (rTmpl.combatWeapon) rc.combatWeapon = rTmpl.combatWeapon;
          if (rTmpl.combatType) rc.combatType = rTmpl.combatType;
          if (rTmpl.baseDamage !== undefined) rc.baseDamage = rTmpl.baseDamage;
          if (rTmpl.baseHeal !== undefined) rc.baseHeal = rTmpl.baseHeal;
          if (rTmpl.range !== undefined) rc.range = rTmpl.range;
          if (rTmpl.manaCost !== undefined) rc.manaCost = rTmpl.manaCost;
          if (rTmpl.cooldown !== undefined) rc.cooldown = rTmpl.cooldown;
          if (rTmpl.element) rc.element = rTmpl.element;
          if (rTmpl.targetType) rc.targetType = rTmpl.targetType;
          if (rTmpl.lifesteal !== undefined) rc.lifesteal = rTmpl.lifesteal;
          resolvedCards.push(rc);
        }
      }

      var playerData = {
        socketId: socket.id,
        x: ptx,
        y: pty,
        name: acc.username || 'Player',
        race: acc.race,
        rpgStats: acc.rpgStats || rpgData.getDefaultStats(),
        level: acc.level || 1,
        equippedCards: resolvedCards,
        combat: combatState || {},
      };

      var success = dungeonCombat.addPlayerToCombat(data.combatId, playerData);
      if (!success) {
        socket.emit('tc_combat_error', { message: 'Could not join combat' });
      }
    });

    // Handle player disconnect during combat
    socket.on('disconnect', function() {
      var combat = dungeonCombat.getCombatBySocketId(socket.id);
      if (combat) {
        dungeonCombat.handlePlayerDisconnect(combat.id, socket.id);
      }
    });
  }
};
