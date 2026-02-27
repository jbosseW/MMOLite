// account-inventory.js — Badge/title inventory + MMO item inventory
// Needs loadAccount/saveAccount via init(deps).

var loadAccount;
var saveAccount;

var MAX_INVENTORY = 200;

function init(deps) {
  loadAccount = deps.loadAccount;
  saveAccount = deps.saveAccount;
}

function addInventoryItem(key, instanceItem) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.inventory) account.inventory = [];
  if (account.inventory.length >= MAX_INVENTORY) return { error: 'Inventory full' };
  account.inventory.push({
    id: instanceItem.instanceId,
    itemId: instanceItem.itemId,
    modifier: instanceItem.modifier || null,
    serial: instanceItem.serial || null,
    obtainedAt: instanceItem.obtainedAt || Date.now(),
    source: instanceItem.source || 'unknown',
  });
  saveAccount(account);
  return account.inventory;
}

function removeInventoryItem(key, instanceId) {
  const account = loadAccount(key);
  if (!account || !account.inventory) return null;
  const idx = account.inventory.findIndex(i => i.id === instanceId);
  if (idx === -1) return null;
  const removed = account.inventory.splice(idx, 1)[0];
  // Unequip if this item was equipped
  if (account.equipped) {
    if (account.equipped.badge === removed.itemId) account.equipped.badge = null;
    if (account.equipped.title === removed.itemId) account.equipped.title = null;
  }
  saveAccount(account);
  return removed;
}

function equipItem(key, instanceId) {
  const account = loadAccount(key);
  if (!account || !account.inventory) return null;
  const invItem = account.inventory.find(i => i.id === instanceId);
  if (!invItem) return null;
  if (!account.equipped) account.equipped = { badge: null, title: null };
  // Determine type from itemId prefix
  if (invItem.itemId.startsWith('badge_')) {
    account.equipped.badge = invItem.itemId;
  } else if (invItem.itemId.startsWith('title_')) {
    account.equipped.title = invItem.itemId;
  } else {
    return null; // collectibles can't be equipped
  }
  saveAccount(account);
  return account.equipped;
}

function unequipItem(key, type) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.equipped) account.equipped = { badge: null, title: null };
  if (type === 'badge') account.equipped.badge = null;
  else if (type === 'title') account.equipped.title = null;
  else return null;
  saveAccount(account);
  return account.equipped;
}

function getInventory(key) {
  const account = loadAccount(key);
  if (!account) return { inventory: [], equipped: { badge: null, title: null } };
  return {
    inventory: account.inventory || [],
    equipped: account.equipped || { badge: null, title: null },
  };
}

function getMMOInventory(key) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.mmoInventory) return { wood: 0, stone: 0, iron_ore: 0, iron_bar: 0, items: [] };
  return account.mmoInventory;
}

function addMMOItem(key, item) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.mmoInventory) account.mmoInventory = { wood: 0, stone: 0, iron_ore: 0, iron_bar: 0, items: [] };
  if (!account.mmoInventory.items) account.mmoInventory.items = [];
  if (account.mmoInventory.items.length >= 100) return { error: 'Inventory full' };
  account.mmoInventory.items.push(item);
  saveAccount(account);
  return account.mmoInventory;
}

function removeMMOItem(key, itemId) {
  const account = loadAccount(key);
  if (!account) return null;
  if (!account.mmoInventory || !account.mmoInventory.items) return null;
  var idx = account.mmoInventory.items.findIndex(function(i) { return i.id === itemId; });
  if (idx === -1) return null;
  var removed = account.mmoInventory.items.splice(idx, 1)[0];
  saveAccount(account);
  return removed;
}

module.exports = {
  init,
  MAX_INVENTORY,
  addInventoryItem,
  removeInventoryItem,
  equipItem,
  unequipItem,
  getInventory,
  getMMOInventory,
  addMMOItem,
  removeMMOItem,
};
