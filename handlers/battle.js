// handlers/battle.js
// Turn-based Pokemon-style battle system handler.

module.exports = {
  init(io, socket, deps) {
    var { user, state, socketAccountMap, accounts, loot, checkEventRate } = deps;

    // --- battle_action: player takes a turn ---
    socket.on('battle_action', function(data) {
      if (!data || typeof data.battleId !== 'string') return;

      var battle = state.activeBattles.get(data.battleId);
      if (!battle || battle.state !== 'active') {
        socket.emit('battle_error', { message: 'Battle not found or already ended' });
        return;
      }

      // Verify it's this player's turn
      var participant = battle.participants[battle.currentTurn];
      if (!participant || participant.socketId !== socket.id) {
        socket.emit('battle_error', { message: 'Not your turn' });
        return;
      }

      var action = data.action; // 'attack', 'item', 'switch', 'run'

      switch (action) {
        case 'attack':
          // TODO: Calculate damage using move data, type advantages, stats
          var result = {
            type: 'attack',
            moveIndex: data.moveIndex || 0,
            attacker: socket.id,
            damage: 10, // stub damage
            message: user.name + "'s monster used an attack!",
          };
          battle.log.push(result);
          battle.turn++;
          battle.currentTurn = (battle.currentTurn + 1) % battle.participants.length;

          // Emit to all participants
          for (var i = 0; i < battle.participants.length; i++) {
            io.to(battle.participants[i].socketId).emit('battle_update', {
              battleId: battle.id,
              action: result,
              turn: battle.turn,
              currentTurn: battle.currentTurn,
              state: battle.state,
            });
          }
          break;

        case 'item':
          // TODO: Use item from inventory in battle
          socket.emit('battle_update', {
            battleId: battle.id,
            action: { type: 'item', message: 'Item use not yet implemented' },
            turn: battle.turn,
            currentTurn: battle.currentTurn,
            state: battle.state,
          });
          break;

        case 'switch':
          // TODO: Switch active monster
          socket.emit('battle_update', {
            battleId: battle.id,
            action: { type: 'switch', message: 'Monster switch not yet implemented' },
            turn: battle.turn,
            currentTurn: battle.currentTurn,
            state: battle.state,
          });
          break;

        case 'run':
          // Attempt to flee
          var fled = Math.random() < 0.5;
          if (fled || battle.type === 'wild') {
            battle.state = 'finished';
            state.endBattle(battle.id);
            for (var k = 0; k < battle.participants.length; k++) {
              io.to(battle.participants[k].socketId).emit('battle_end', {
                battleId: battle.id,
                reason: 'fled',
                fled: socket.id,
              });
            }
          } else {
            battle.turn++;
            battle.currentTurn = (battle.currentTurn + 1) % battle.participants.length;
            socket.emit('battle_update', {
              battleId: battle.id,
              action: { type: 'run_failed', message: "Couldn't escape!" },
              turn: battle.turn,
              currentTurn: battle.currentTurn,
              state: battle.state,
            });
          }
          break;

        default:
          socket.emit('battle_error', { message: 'Unknown action: ' + action });
      }
    });

    // --- battle_forfeit: player surrenders ---
    socket.on('battle_forfeit', function(data) {
      if (!data || typeof data.battleId !== 'string') return;

      var battle = state.activeBattles.get(data.battleId);
      if (!battle || battle.state !== 'active') return;

      battle.state = 'finished';
      state.endBattle(battle.id);

      for (var i = 0; i < battle.participants.length; i++) {
        io.to(battle.participants[i].socketId).emit('battle_end', {
          battleId: battle.id,
          reason: 'forfeit',
          forfeitedBy: socket.id,
        });
      }
    });

    // --- battle_challenge: challenge another player ---
    socket.on('battle_challenge', function(data) {
      if (!data || typeof data.targetId !== 'string') return;

      // Check target is online and in same zone
      var myZone = state.playerZones.get(socket.id);
      var targetZone = state.playerZones.get(data.targetId);
      if (!myZone || myZone !== targetZone) {
        socket.emit('battle_error', { message: 'Target not in your zone' });
        return;
      }

      var zone = state.zones.get(myZone);
      if (zone && !zone.pvpEnabled) {
        socket.emit('battle_error', { message: 'PvP not allowed in this zone' });
        return;
      }

      io.to(data.targetId).emit('battle_challenge_received', {
        challengerId: socket.id,
        challengerName: user.name,
      });

      socket.emit('battle_challenge_sent', { targetId: data.targetId });
    });

    // --- battle_challenge_respond: accept or decline ---
    socket.on('battle_challenge_respond', function(data) {
      if (!data || typeof data.challengerId !== 'string') return;

      if (data.accept) {
        // Create battle instance
        var battle = state.createBattle('pvp', [
          { socketId: data.challengerId, monsters: [], activeMonster: 0 },
          { socketId: socket.id, monsters: [], activeMonster: 0 },
        ]);

        io.to(data.challengerId).emit('battle_start', {
          battleId: battle.id,
          type: 'pvp',
          opponent: { id: socket.id, name: user.name },
        });

        socket.emit('battle_start', {
          battleId: battle.id,
          type: 'pvp',
          opponent: { id: data.challengerId, name: '' }, // TODO: get challenger name
        });
      } else {
        io.to(data.challengerId).emit('battle_challenge_declined', {
          declinedBy: socket.id,
        });
      }
    });

    // --- disconnect: clean up any active battles this player is in ---
    socket.on('disconnect', function() {
      if (!state.activeBattles) return;
      for (var entry of state.activeBattles) {
        var battle = entry[1];
        if (battle.state !== 'active') continue;
        var inBattle = false;
        for (var pi = 0; pi < battle.participants.length; pi++) {
          if (battle.participants[pi].socketId === socket.id) {
            inBattle = true;
            break;
          }
        }
        if (inBattle) {
          battle.state = 'finished';
          state.endBattle(battle.id);
          for (var bi = 0; bi < battle.participants.length; bi++) {
            if (battle.participants[bi].socketId !== socket.id) {
              io.to(battle.participants[bi].socketId).emit('battle_end', {
                battleId: battle.id,
                reason: 'opponent_disconnected',
                disconnected: socket.id,
              });
            }
          }
        }
      }
    });
  }
};
