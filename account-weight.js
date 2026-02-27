// account-weight.js — Weight / Encumbrance System
// Pure computation on account objects. No loadAccount/saveAccount needed.

var ITEM_WEIGHTS = {
  // Resources
  wood: 1, stone: 2, iron_ore: 2, iron_bar: 3,
  bronze_ore: 2, bronze_bar: 3, fish: 1, cooked_fish: 1,
  shellfish: 1, seaweed: 0.5, wheat: 0.5, herbs: 0.5,
  vegetables: 1, mushroom: 0.5, bread: 0.5, stew: 1,
  glass_sand: 1, glass: 1, glass_lens: 0.5, glass_vial: 0.5,
  cogs: 1, gears: 1, springs: 0.5, clockwork_core: 2,
  mana_crystal: 0.5, gem_rough: 1, gem_cut: 0.5,
  potion_health: 0.5, potion_mana: 0.5,
  ale: 1, wine: 1, pickled_vegetables: 1, herb_preserves: 1,
  berry_jam: 1, fruit_jam: 1,
  // Equipment
  wooden_sword: 3, wooden_dagger: 2, wooden_mace: 4, wooden_spear: 4,
  iron_sword: 5, iron_axe: 6, iron_pickaxe: 5,
  // Structures/placeable (heavy)
  forge: 30, storage_chest: 15, wall: 10, door: 8, raft: 40, boat: 60,
  brewery: 50, preserving_station: 30, jam_maker: 20,
  default: 1,
};

function getCarryCapacity(account) {
  var vigor = (account.rpgStats && account.rpgStats.vigor) || 5;
  var base = 50;
  var vigBonus = vigor * 5;
  // Cart/pack animal bonus
  var cartBonus = 0;
  if (account.mmoInventory && account.mmoInventory.items) {
    account.mmoInventory.items.forEach(function(item) {
      if (item.type === 'cart') cartBonus += 100;
      if (item.type === 'pack_mule') cartBonus += 100;
    });
  }
  // Ascension bonus
  var ascTree = account.ascensionTree || {};
  var ascCarry = (ascTree['hoarders_instinct'] || 0) * 20;
  return base + vigBonus + cartBonus + ascCarry;
}

function getCurrentWeight(account) {
  var inv = account.mmoInventory || {};
  var weight = 0;
  // Resources (numeric fields)
  Object.keys(inv).forEach(function(key) {
    if (key === 'items') return;
    var qty = inv[key];
    if (typeof qty === 'number' && qty > 0) {
      weight += qty * (ITEM_WEIGHTS[key] || ITEM_WEIGHTS.default);
    }
  });
  // Items (array)
  if (Array.isArray(inv.items)) {
    inv.items.forEach(function(item) {
      weight += (ITEM_WEIGHTS[item.type] || ITEM_WEIGHTS.default);
    });
  }
  return weight;
}

function getEncumbranceLevel(account) {
  var cap = getCarryCapacity(account);
  var cur = getCurrentWeight(account);
  var pct = cur / cap;
  if (pct > 1.0) return 'overloaded'; // cannot move
  if (pct > 0.90) return 'heavy';    // -40% speed
  if (pct > 0.75) return 'moderate'; // -20% speed
  return 'normal';
}

function getSpeedMultiplier(account) {
  var enc = getEncumbranceLevel(account);
  var base;
  if (enc === 'overloaded') return 0;
  if (enc === 'heavy') base = 0.60;
  else if (enc === 'moderate') base = 0.80;
  else base = 1.0;
  // Ascension: Seasoned Traveler (+3% speed per rank)
  var ascTree = account.ascensionTree || {};
  var ascSpeed = (ascTree['seasoned_traveler'] || 0) * 0.03;
  return base * (1 + ascSpeed);
}

module.exports = {
  ITEM_WEIGHTS,
  getCarryCapacity,
  getCurrentWeight,
  getEncumbranceLevel,
  getSpeedMultiplier,
};
