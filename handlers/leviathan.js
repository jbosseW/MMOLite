// handlers/leviathan.js
// Socket event handler for ocean leviathan interactions.
// Events: leviathan_flee, leviathan_engage, leviathan_info

'use strict';

module.exports = {
  init: function(io, socket, deps) {
    var checkEventRate = deps.checkEventRate;
    var socketAccountMap = deps.socketAccountMap;
    var accounts = deps.accounts;
    var directorOcean = deps.directorOcean;

    // --- leviathan_flee: attempt to flee during aggro window ---
    socket.on('leviathan_flee', function(data) {
      if (!data || typeof data.leviathanId !== 'string') return;
      if (!directorOcean) return;

      var accKey = socketAccountMap.get(socket.id);
      var acc = accKey ? accounts.loadAccount(accKey) : null;
      if (!acc) return;

      directorOcean.handleFleeWithAccount(socket, data.leviathanId, acc, io);
    });

    // --- leviathan_engage: voluntarily attack a warning-range leviathan ---
    socket.on('leviathan_engage', function(data) {
      if (!data || typeof data.leviathanId !== 'string') return;
      if (!directorOcean) return;

      directorOcean.handleEngage(socket, data.leviathanId, io);
    });

    // --- leviathan_info: inspect a visible leviathan ---
    socket.on('leviathan_info', function(data) {
      if (!data || typeof data.leviathanId !== 'string') return;
      if (!directorOcean) return;

      var info = directorOcean.getLeviathanInfo(data.leviathanId);
      if (info) {
        socket.emit('leviathan_info_result', info);
      }
    });

    // --- cleanup on disconnect ---
    socket.on('disconnect', function() {
      if (directorOcean) {
        directorOcean.handleDisconnect(socket.id);
      }
    });
  }
};
