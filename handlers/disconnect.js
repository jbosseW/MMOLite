// handlers/disconnect.js
// Socket handler: disconnect (full cleanup including friend offline notifications)

module.exports = {
  init(io, socket, deps) {
    var { socketAccountMap, accounts, state, game, lobbyManager, lieroManager, tcgBattleManager, tcgTradeManager, tcgTableManager, coinFlipManager, saveChipsForSocket, saveAllLobbyChips, _removeFromIpTracking, ratelimit, sessionTokens, _unlinkSocket } = deps;
    var shardBridge;
    try { shardBridge = require('../shard-bridge'); } catch (_) { shardBridge = null; }

    socket.on('disconnect', (reason) => {
      try {
        ratelimit.decrementConnections();
        _removeFromIpTracking();

        const disconnectingUser = state.users.get(socket.id);
        if (!disconnectingUser) {
          console.log(`[disconnect] Unknown socket ${socket.id} (${reason})`);
          return;
        }

        const accKey = socketAccountMap.get(socket.id);
        const wasTemp = accKey ? accounts.isTempAccount(accKey) : true;

        // Notify friends this user went offline
        if (accKey && !wasTemp) {
          try {
            var friendsData = accounts.getFriendsData(accKey);
            if (friendsData && friendsData.friends.length > 0) {
              for (var fi = 0; fi < friendsData.friends.length; fi++) {
                var fk = friendsData.friends[fi].key;
                for (var [sid, skey] of socketAccountMap) {
                  if (skey === fk && sid !== socket.id) {
                    var fSocket = io.sockets.sockets.get(sid);
                    if (fSocket) fSocket.emit('friend_status_changed', { key: accKey, online: false });
                  }
                }
              }
            }
          } catch (_) {}
        }

        if (accKey) {
          if (wasTemp) {
            accounts.deleteAccount(accKey);
          } else {
            const acc = accounts.loadAccount(accKey);
            if (acc) {
              acc.lastSeen = Date.now();
              if (acc.dms) acc.dms = { conversations: {} };
              accounts.saveAccount(acc);
            }
            // Checkin character back to master server
            if (shardBridge && shardBridge.isMasterMode) {
              shardBridge.checkinCharacter(accKey, function(err) {
                if (err) console.error('[disconnect] Checkin failed:', err.message);
              });
            }
          }
          // Clean up both socketAccountMap and accountSocketMap reverse index (C-5 fix).
          // Previously only socketAccountMap was cleared, leaving a dead socket ID
          // in accountSocketMap which caused "already connected" lockout on reconnect.
          if (typeof _unlinkSocket === 'function') {
            _unlinkSocket(socket.id);
          } else {
            socketAccountMap.delete(socket.id);
          }
        }

        // Clean up session tokens
        if (sessionTokens) {
          for (const [token, data] of sessionTokens) {
            if (data.socketId === socket.id) sessionTokens.delete(token);
          }
        }

        const userName = disconnectingUser.name;

        // Leave current zone and broadcast to zone members
        var currentZoneId = state.playerZones.get(socket.id);
        if (currentZoneId) {
          socket.to('zone:' + currentZoneId).emit('player_left_zone', {
            playerId: socket.id,
            playerName: userName,
            zoneId: currentZoneId,
          });
        }

        // Leave party
        var party = state.getPlayerParty(socket.id);
        if (party) {
          party.members.delete(socket.id);
          socket.leave('party:' + party.id);
          if (party.leader === socket.id) {
            if (party.members.size > 0) {
              party.leader = party.members.values().next().value;
            } else {
              state.parties.delete(party.id);
            }
          }
          if (state.parties.has(party.id)) {
            var memberList = [];
            for (var memberId of party.members) {
              var u = state.users.get(memberId);
              if (u) memberList.push({ id: u.id, name: u.name, color: u.color });
            }
            io.to('party:' + party.id).emit('party_updated', {
              partyId: party.id,
              leader: party.leader,
              members: memberList,
              event: userName + ' disconnected',
            });
          }
        }

        // Clean up active battles
        for (var [battleId, battle] of state.activeBattles) {
          var isParticipant = false;
          for (var bi = 0; bi < battle.participants.length; bi++) {
            if (battle.participants[bi].socketId === socket.id) { isParticipant = true; break; }
          }
          if (isParticipant) {
            battle.state = 'finished';
            for (var bj = 0; bj < battle.participants.length; bj++) {
              if (battle.participants[bj].socketId !== socket.id) {
                io.to(battle.participants[bj].socketId).emit('battle_end', {
                  battleId: battleId,
                  reason: 'opponent_disconnected',
                });
              }
            }
            state.endBattle(battleId);
          }
        }

        // Clean up game — Worker thread (BossOrbs + BossBrawl)
        if (game && typeof game.disconnectCleanup === 'function') {
          game.disconnectCleanup(socket.id);
        }

        // Clean up card game lobby
        if (lobbyManager) {
          const cardLobbyId = lobbyManager.getPlayerLobbyId(socket.id);
          if (cardLobbyId) {
            const cardLobby = lobbyManager.lobbies.get(cardLobbyId);
            if (cardLobby) {
              const p = cardLobby.players.get(socket.id);
              if (p) saveChipsForSocket(socket.id, p.chips);
            }
          }
          const cardResult = lobbyManager.leaveLobby(socket.id);
          if (cardResult && !cardResult.destroyed && cardResult.lobby) {
            if (lobbyManager.getHumanCount(cardResult.lobbyId) === 0) {
              lobbyManager.removeBots(cardResult.lobbyId);
            }
            const freshLobby = lobbyManager.lobbies.get(cardResult.lobbyId);
            if (freshLobby && freshLobby.state === 'waiting') {
              saveAllLobbyChips(freshLobby);
              lobbyManager.rebuyBrokePlayers(freshLobby);
            }
            if (freshLobby) {
              for (const [pid] of freshLobby.players) {
                const s = io.sockets.sockets.get(pid);
                if (s) s.emit('card_lobby_update', lobbyManager.getLobbyState(cardResult.lobbyId, pid));
              }
            }
            io.to('lobby:cards').emit('card_lobbies_updated', { lobbies: lobbyManager.getLobbies() });
          } else if (cardResult) {
            io.to('lobby:cards').emit('card_lobbies_updated', { lobbies: lobbyManager.getLobbies() });
          }
        }

        // Clean up TCG table
        if (tcgTableManager) {
          const tableResult = tcgTableManager.leaveTable(socket.id);
          if (tableResult) {
            if (tableResult.removed && tableResult.guestSocketId) {
              const guestSock = io.sockets.sockets.get(tableResult.guestSocketId);
              if (guestSock) guestSock.emit('tcg_table_closed', { reason: 'Host disconnected' });
            } else if (!tableResult.removed && tableResult.table && tableResult.table.host) {
              const hostSock = io.sockets.sockets.get(tableResult.table.host.socketId);
              if (hostSock) {
                const updatedTable = tcgTableManager.getTable(tableResult.table.id);
                if (updatedTable) hostSock.emit('tcg_table_updated', updatedTable);
              }
            }
          }
        }
        if (tcgBattleManager) {
          const tcgResult = tcgBattleManager.leaveBattle(socket.id);
          if (tcgResult && tcgResult.battle) {
            for (const [pid] of tcgResult.battle.players) {
              if (pid !== socket.id) {
                const s = io.sockets.sockets.get(pid);
                if (s) s.emit('tcg_battle_update', tcgBattleManager.getBattleState(tcgResult.battle.id, pid));
              }
            }
          }
        }
        if (tcgTradeManager) tcgTradeManager.cancel(socket.id);

        // Clean up coin flip lobby
        if (coinFlipManager) {
          const cfResult = coinFlipManager.leaveLobby(socket.id);
          if (cfResult && !cfResult.destroyed) {
            io.to('cflobby:' + cfResult.lobbyId).emit('cf_lobby_update', coinFlipManager.getLobbyState(cfResult.lobbyId));
          }
          if (cfResult) io.emit('cf_lobbies_updated', { lobbies: coinFlipManager.getLobbies() });
        }

        // Liero proxy cache cleanup
        if (lieroManager && typeof lieroManager._playerLobbies === 'object') {
          lieroManager._playerLobbies.delete(socket.id);
        }

        state.removeUser(socket.id);

        console.log(`[disconnect] ${userName} (${socket.id}) -- ${reason}`);
      } catch (err) {
        console.error('[disconnect] Error during cleanup:', err.message);
        try { state.removeUser(socket.id); } catch (_) {}
      }
    });
  }
};
