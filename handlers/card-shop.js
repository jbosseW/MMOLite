// handlers/card-shop.js
// Skill Card Merchant NPC — sells common & uncommon cards to players so they
// can experiment with different playstyles early.
//
// Events:
//   browse_card_shop  — returns the full merchant inventory with prices
//   buy_card          — purchase a specific card by cardId, deduct coins,
//                       create a card instance and add it to the player's collection
//
// Design notes:
//   - Cards sold are COMMON and UNCOMMON only (starter-friendly prices).
//   - The merchant inventory is static — always available, never out of stock.
//   - Players may buy duplicates; there is no restriction on owning multiple
//     copies of the same template (different instanceIds). This lets players
//     experiment with fusion or equip extras on alt characters.
//   - Card instances are created through rpgData.generateCardInstance (same
//     path as gacha packs and card_vendor_buy), ensuring full parity with
//     pack-opened cards (styles, serial numbers, effects).
//   - Presence stat discount applies the same way as npc-shop resource buys.
//   - Purchase lock prevents double-buy race conditions.

var rpgData = require('../rpg-data');
var crypto = require('crypto');

// ---------------------------------------------------------------------------
// Curated starter card list — ~45 cards across all playstyle categories.
// Only COMMON and UNCOMMON cards selected for starter experimentation.
// ---------------------------------------------------------------------------

var CARD_SHOP_INVENTORY = [
  // ── Stat Boosts (Common) — let players try different stat builds ──
  'vigor',         // +1 Vigor
  'might',         // +1 Might
  'finesse',       // +1 Finesse
  'acumen',        // +1 Acumen
  'resolve',       // +1 Resolve
  'presence',      // +1 Presence
  'ingenuity',     // +1 Ingenuity

  // ── Skill XP Boosts (Common) — gathering/crafting/combat ──
  'mining_xp',         // +10% Mining XP
  'woodcutting_xp',    // +10% Woodcutting XP
  'farming_xp',        // +10% Farming XP
  'fishing_xp',        // +10% Fishing XP
  'melee_xp',          // +10% Melee XP
  'cooking_xp',        // +10% Cooking XP
  'cogworking_xp',     // +10% Cogworking XP
  'alchemy_xp',        // +10% Alchemy XP
  'enchanting_xp',     // +10% Enchanting XP
  'crafting_xp',       // +10% Crafting XP

  // ── Passive Perks (Common) — utility ──
  'speed_boost',       // +5% Movement Speed
  'carry_weight',      // +20 Carry Weight
  'thorns',            // 15% damage reflect
  'sprint_stamina',    // +15% max sprint stamina

  // ── Skill XP Boosts (Uncommon) ──
  'magic_xp',          // +10% Magic XP
  'crafting_xp_all',   // +10% All Crafting XP

  // ── Passive Perks (Uncommon) — combat/utility ──
  'hp_regen',          // HP Regen +3/s
  'crit_boost',        // +3% Crit Chance
  'dodge_boost',       // +3% Dodge
  'magic_resist',      // +5% Magic Resist
  'lockmaster',        // +15% Lockpicking
  'treasure_sense',    // Loot & rare resource bonus
  'riposte_card',      // Counter strike reactive
  'sprint_efficiency', // Reduces sprint stamina drain

  // ── Active Abilities (Uncommon) — combat starters ──
  'heal_self_I',       // Heal Self I (magic heal)
  'ice_shard',         // Ice Shard (ranged magic damage)
  'backstab_I',        // Backstab I (stealth melee)
  'taunt',             // Taunt (tank aggro)
  'cleanse',           // Cleanse (remove debuffs)
  'oil_slick',         // Oil Slick (tile control)
  'shield_bash',       // Shield Bash (tank stun)
  'acid_flask',        // Acid Flask (alchemy damage)

  // ── Gathering Boosts (Uncommon) ──
  'bountiful_harvest', // +10% gathering bonus
  'ingredient_finder', // +8% rare resource + 5% gather
  'efficient_smelter', // +15% ingredient save chance

  // ── Crafting Passives (Uncommon) ──
  'hearty_chef',       // +20% food heal bonus
  'spice_master',      // +15% food buff potency
  'weapon_sharpener',  // +2 crafted weapon damage
  'armor_hardener',    // +2 crafted armor bonus
];

// Validate all card IDs exist at startup
var VALIDATED_INVENTORY = [];
for (var i = 0; i < CARD_SHOP_INVENTORY.length; i++) {
  var cardId = CARD_SHOP_INVENTORY[i];
  var template = rpgData.CARD_BY_ID[cardId];
  if (!template) {
    console.error('[card-shop] WARNING: Card template not found for "' + cardId + '", skipping');
    continue;
  }
  // Only allow common and uncommon cards in the starter shop
  if (template.rarity !== 'common' && template.rarity !== 'uncommon') {
    console.error('[card-shop] WARNING: Card "' + cardId + '" is rarity "' + template.rarity + '", skipping (only common/uncommon allowed)');
    continue;
  }
  VALIDATED_INVENTORY.push(cardId);
}

console.log('[card-shop] Loaded ' + VALIDATED_INVENTORY.length + ' starter cards for the Card Merchant');

// ---------------------------------------------------------------------------
// Pricing — uses the existing CARD_VENDOR_PRICES from rpg-data.js
// Common: 50 coins, Uncommon: 200 coins
// ---------------------------------------------------------------------------

function getCardPrice(template) {
  var price = rpgData.CARD_VENDOR_PRICES[template.rarity];
  if (typeof price !== 'number') return null;
  return price;
}

// ---------------------------------------------------------------------------
// Build the full shop listing (cached and rebuilt only when needed)
// ---------------------------------------------------------------------------

var _cachedShopListing = null;

function buildShopListing() {
  if (_cachedShopListing) return _cachedShopListing;

  var listing = [];
  for (var i = 0; i < VALIDATED_INVENTORY.length; i++) {
    var cardId = VALIDATED_INVENTORY[i];
    var template = rpgData.CARD_BY_ID[cardId];
    if (!template) continue;
    var price = getCardPrice(template);
    if (price === null) continue;

    listing.push({
      cardId: template.cardId,
      name: template.name,
      type: template.type,
      rarity: template.rarity,
      effects: template.effects,
      icon: template.icon,
      tags: template.tags || [],
      price: price,
    });
  }

  _cachedShopListing = listing;
  return listing;
}

// ---------------------------------------------------------------------------
// Per-account purchase lock to prevent concurrent buy race conditions
// ---------------------------------------------------------------------------
var _purchaseLocks = new Set();

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = {
  init(io, socket, deps) {
    var { user, socketAccountMap, accounts, checkEventRate } = deps;

    // --- browse_card_shop: get full card merchant inventory with prices ---
    socket.on('browse_card_shop', function() {

      var key = socketAccountMap.get(socket.id);
      if (!key) return;

      var acc = accounts.loadAccount(key);
      if (!acc) return;

      // Calculate Presence-based discount for display
      var presenceDiscount = 1.0;
      if (acc.rpgStats && acc.rpgStats.presence > 5) {
        presenceDiscount = 1 - ((acc.rpgStats.presence - 5) * 0.02);
        if (presenceDiscount < 0.7) presenceDiscount = 0.7; // cap at 30% discount
      }

      var listing = buildShopListing();

      // Build listing with effective prices (after Presence discount)
      var playerListing = [];
      for (var i = 0; i < listing.length; i++) {
        var item = listing[i];
        var effectivePrice = item.price;
        if (presenceDiscount < 1.0) {
          effectivePrice = Math.max(1, Math.round(item.price * presenceDiscount));
        }
        playerListing.push({
          cardId: item.cardId,
          name: item.name,
          type: item.type,
          rarity: item.rarity,
          effects: item.effects,
          icon: item.icon,
          tags: item.tags,
          basePrice: item.price,
          price: effectivePrice,
        });
      }

      socket.emit('card_shop_inventory', {
        merchant: {
          name: 'Elara Brightscroll',
          title: 'Skill Card Merchant',
          dialogue: 'Welcome, adventurer! I carry a fine selection of skill cards to help you on your journey. Common cards are 50 coins, and uncommon cards are 200 coins. Browse at your leisure!',
        },
        cards: playerListing,
        coins: acc.chips || 0,
        presenceDiscount: presenceDiscount < 1.0 ? Math.round((1 - presenceDiscount) * 100) : 0,
      });
    });

    // --- buy_card: purchase a card from the merchant ---
    socket.on('buy_card', function(data) {
      if (!data || typeof data.cardId !== 'string') {
        socket.emit('card_shop_error', { message: 'Invalid request' });
        return;
      }

      var key = socketAccountMap.get(socket.id);
      if (!key) return;

      // Validate card is in our shop inventory
      if (VALIDATED_INVENTORY.indexOf(data.cardId) === -1) {
        socket.emit('card_shop_error', { message: 'That card is not available in this shop' });
        return;
      }

      var template = rpgData.CARD_BY_ID[data.cardId];
      if (!template) {
        socket.emit('card_shop_error', { message: 'Card template not found' });
        return;
      }

      var basePrice = getCardPrice(template);
      if (basePrice === null) {
        socket.emit('card_shop_error', { message: 'This card cannot be purchased' });
        return;
      }

      var acc = accounts.loadAccount(key);
      if (!acc) return;

      // Check card collection capacity
      if ((acc.rpgCards || []).length >= rpgData.MAX_CARD_COLLECTION) {
        socket.emit('card_shop_error', { message: 'Card collection full (' + rpgData.MAX_CARD_COLLECTION + ' max)' });
        return;
      }

      // Apply Presence stat discount
      var totalCost = basePrice;
      if (acc.rpgStats && acc.rpgStats.presence > 5) {
        var presenceDiscount = 1 - ((acc.rpgStats.presence - 5) * 0.02);
        if (presenceDiscount < 0.7) presenceDiscount = 0.7;
        totalCost = Math.max(1, Math.round(basePrice * presenceDiscount));
      }

      // Check coins
      if ((acc.chips || 0) < totalCost) {
        socket.emit('card_shop_error', { message: 'Not enough coins (need ' + totalCost + ', have ' + (acc.chips || 0) + ')' });
        return;
      }

      // Acquire purchase lock
      if (_purchaseLocks.has(key)) {
        socket.emit('card_shop_error', { message: 'Transaction in progress, try again' });
        return;
      }
      _purchaseLocks.add(key);

      try {
        // Deduct coins
        accounts.updateChips(key, -totalCost);

        // Reload account after chip deduction to avoid stale snapshot overwrite
        acc = accounts.loadAccount(key);
        if (!acc) return;

        // Create card instance via the standard rpgData function
        // This gives it an instanceId, style, serial, effects — same as gacha
        var cardInstance = rpgData.generateCardInstance(template, 'card_shop');
        if (!acc.rpgCards) acc.rpgCards = [];
        acc.rpgCards.push(cardInstance);
        accounts.saveAccount(acc);

        socket.emit('card_shop_bought', {
          card: cardInstance,
          totalCost: totalCost,
          coins: acc.chips || 0,
          message: 'Purchased ' + cardInstance.name + ' for ' + totalCost + ' coins',
        });
      } finally {
        _purchaseLocks.delete(key);
      }
    });
  }
};
