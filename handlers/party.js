// handlers/party.js
// Party formation, management, and party chat.

module.exports = {
  init(io, socket, deps) {
    var { user, state, checkEventRate } = deps;

    // --- party_create: create a new party ---
    socket.on('party_create', function() {

      // Check if already in a party
      var existing = state.getPlayerParty(socket.id);
      if (existing) {
        socket.emit('party_error', { message: 'Already in a party. Leave first.' });
        return;
      }

      var party = state.createParty(socket.id);
      socket.join('party:' + party.id);
      socket.emit('party_created', {
        partyId: party.id,
        leader: socket.id,
        members: [{ id: socket.id, name: user.name, color: user.color }],
      });
    });

    // --- party_invite: invite a player ---
    socket.on('party_invite', function(data) {
      if (!data || typeof data.targetId !== 'string') return;

      var party = state.getPlayerParty(socket.id);
      if (!party) {
        socket.emit('party_error', { message: 'Not in a party' });
        return;
      }
      if (party.leader !== socket.id) {
        socket.emit('party_error', { message: 'Only the leader can invite' });
        return;
      }
      if (party.members.size >= party.maxMembers) {
        socket.emit('party_error', { message: 'Party is full' });
        return;
      }

      // Check target is online
      var targetUser = state.users.get(data.targetId);
      if (!targetUser) {
        socket.emit('party_error', { message: 'Player not found' });
        return;
      }

      io.to(data.targetId).emit('party_invite_received', {
        partyId: party.id,
        fromId: socket.id,
        fromName: user.name,
      });

      socket.emit('party_invite_sent', { targetId: data.targetId });
    });

    // --- party_accept: accept a party invite ---
    socket.on('party_accept', function(data) {
      if (!data || typeof data.partyId !== 'string') return;

      // Check if already in a party
      var existing = state.getPlayerParty(socket.id);
      if (existing) {
        socket.emit('party_error', { message: 'Already in a party' });
        return;
      }

      var party = state.parties.get(data.partyId);
      if (!party) {
        socket.emit('party_error', { message: 'Party no longer exists' });
        return;
      }
      if (party.members.size >= party.maxMembers) {
        socket.emit('party_error', { message: 'Party is full' });
        return;
      }

      party.members.add(socket.id);
      if (state.playerPartyMap) state.playerPartyMap.set(socket.id, party.id);
      socket.join('party:' + party.id);

      // Get member list
      var memberList = [];
      for (var memberId of party.members) {
        var u = state.users.get(memberId);
        if (u) memberList.push({ id: u.id, name: u.name, color: u.color });
      }

      io.to('party:' + party.id).emit('party_updated', {
        partyId: party.id,
        leader: party.leader,
        members: memberList,
        event: user.name + ' joined the party',
      });
    });

    // --- party_leave: leave current party ---
    socket.on('party_leave', function() {

      var party = state.getPlayerParty(socket.id);
      if (!party) {
        socket.emit('party_error', { message: 'Not in a party' });
        return;
      }

      party.members.delete(socket.id);
      if (state.playerPartyMap) state.playerPartyMap.delete(socket.id);
      socket.leave('party:' + party.id);

      // Transfer leadership or disband
      if (party.leader === socket.id) {
        if (party.members.size > 0) {
          party.leader = party.members.values().next().value;
        } else {
          state.parties.delete(party.id);
          socket.emit('party_disbanded', { partyId: party.id });
          return;
        }
      }

      // Notify remaining members
      var memberList = [];
      for (var memberId of party.members) {
        var u = state.users.get(memberId);
        if (u) memberList.push({ id: u.id, name: u.name, color: u.color });
      }

      io.to('party:' + party.id).emit('party_updated', {
        partyId: party.id,
        leader: party.leader,
        members: memberList,
        event: user.name + ' left the party',
      });

      socket.emit('party_left', { partyId: party.id });
    });

    // --- party_chat: send message to party ---
    socket.on('party_chat', function(data) {
      if (!data || typeof data.message !== 'string') return;

      var party = state.getPlayerParty(socket.id);
      if (!party) return;

      var content = state.sanitizeText(data.message).slice(0, 200);
      if (content.length === 0) return;

      io.to('party:' + party.id).emit('party_message', {
        authorId: socket.id,
        authorName: user.name,
        authorColor: user.color,
        content: content,
        timestamp: Date.now(),
      });
    });
  }
};
