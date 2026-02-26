// handlers/overworld.js
// NPC interaction, item pickup, wild encounters — world interaction handler.

module.exports = {
  init(io, socket, deps) {
    var { user, state, socketAccountMap, accounts, loot, checkEventRate } = deps;

    // --- npc_interact: talk to an NPC ---
    socket.on('npc_interact', function(data) {
      if (!data || typeof data.npcId !== 'string') return;

      var zoneId = state.playerZones.get(socket.id);
      if (!zoneId) return;

      var zone = state.zones.get(zoneId);
      if (!zone) return;

      var npc = zone.npcs.find(function(n) { return n.id === data.npcId; });
      if (!npc) {
        socket.emit('npc_error', { message: 'NPC not found' });
        return;
      }

      // Handle NPC type
      switch (npc.type) {
        case 'heal':
          // TODO: Heal all monsters in party
          socket.emit('npc_dialog', {
            npcId: npc.id,
            npcName: npc.name,
            type: 'heal',
            dialog: npc.dialog || ['Your monsters have been healed!'],
            healed: true,
          });
          break;

        case 'shop':
          // TODO: Send shop inventory
          socket.emit('npc_dialog', {
            npcId: npc.id,
            npcName: npc.name,
            type: 'shop',
            dialog: npc.dialog || ['Welcome to the shop!'],
            items: [], // stub: shop items will be populated later
          });
          break;

        case 'quest':
          // TODO: Check/give quests
          socket.emit('npc_dialog', {
            npcId: npc.id,
            npcName: npc.name,
            type: 'quest',
            dialog: npc.dialog || ['I have a task for you...'],
            quests: [], // stub: available quests
          });
          break;

        case 'storage':
          // TODO: Open monster storage
          socket.emit('npc_dialog', {
            npcId: npc.id,
            npcName: npc.name,
            type: 'storage',
            dialog: npc.dialog || ['Access your storage.'],
          });
          break;

        case 'game':
          // Game Corner NPC — tell client to open game UI
          socket.emit('npc_dialog', {
            npcId: npc.id,
            npcName: npc.name,
            type: 'game',
            dialog: npc.dialog || ['Ready to play?'],
          });
          break;

        default:
          socket.emit('npc_dialog', {
            npcId: npc.id,
            npcName: npc.name,
            type: 'talk',
            dialog: npc.dialog || ['...'],
          });
      }
    });

    // --- item_pickup: pick up an overworld item ---
    socket.on('item_pickup', function(data) {
      if (!data || typeof data.itemIndex !== 'number') return;

      var zoneId = state.playerZones.get(socket.id);
      if (!zoneId) return;

      var zone = state.zones.get(zoneId);
      if (!zone || !zone.items) return;

      var itemIdx = data.itemIndex;
      if (itemIdx < 0 || itemIdx >= zone.items.length) return;

      var item = zone.items[itemIdx];
      if (!item || item.pickedUp) return;

      // Mark as picked up
      item.pickedUp = true;
      item.pickedBy = socket.id;

      // Add to player inventory
      var key = socketAccountMap.get(socket.id);
      if (key) {
        accounts.addInventoryItem(key, {
          itemId: item.itemId,
          source: 'overworld_pickup',
        });
      }

      socket.emit('item_picked', { itemIndex: itemIdx, item: item });

      // Broadcast removal to zone
      io.to('zone:' + zoneId).emit('item_removed', { itemIndex: itemIdx });
    });

    // --- wild_encounter_check: server validates if encounter triggers ---
    socket.on('wild_encounter_check', function(data) {

      var zoneId = state.playerZones.get(socket.id);
      if (!zoneId) return;

      var zone = state.zones.get(zoneId);
      if (!zone || !zone.spawns || zone.spawns.length === 0) return;

      // Roll encounter chance (base 15% per check in grass/wild zones)
      if (Math.random() > 0.15) {
        socket.emit('wild_encounter_result', { encountered: false });
        return;
      }

      // Weighted random monster selection
      var totalWeight = 0;
      for (var i = 0; i < zone.spawns.length; i++) {
        totalWeight += zone.spawns[i].weight;
      }
      var roll = Math.random() * totalWeight;
      var cumulative = 0;
      var selected = zone.spawns[0];
      for (var j = 0; j < zone.spawns.length; j++) {
        cumulative += zone.spawns[j].weight;
        if (roll <= cumulative) {
          selected = zone.spawns[j];
          break;
        }
      }

      // Roll level within range
      var minLvl = selected.level[0] || 1;
      var maxLvl = selected.level[1] || minLvl;
      var level = minLvl + Math.floor(Math.random() * (maxLvl - minLvl + 1));

      var encounter = {
        encountered: true,
        monster: {
          monsterId: selected.monsterId,
          level: level,
          // TODO: Generate full monster stats from monster database
        },
      };

      // TODO: Create battle instance via state.createBattle()
      socket.emit('wild_encounter_result', encounter);
    });
  }
};
