// handlers/npc-shop.js
// NPC Shop system with supply/demand price fluctuation.
// Prices fluctuate based on player buy/sell activity, drifting back to base over time.
// Events: npc_shop_browse, npc_shop_buy, npc_shop_sell, npc_shop_prices

var rpgData = require('../rpg-data');

// ---------------------------------------------------------------------------
// Base prices for all tradeable resources (in coins)
// ---------------------------------------------------------------------------

var BASE_PRICES = {
  wood: 5,
  stone: 8,
  iron_ore: 15,
  iron_bar: 35,
  bronze_ore: 12,
  bronze_bar: 30,
  fish: 10,
  cooked_fish: 25,
  shellfish: 12,
  seaweed: 6,
  wheat: 8,
  herbs: 12,
  vegetables: 8,
  mushroom: 10,
  bread: 20,
  stew: 45,
  glass_sand: 10,
  glass: 25,
  glass_lens: 60,
  glass_vial: 30,
  cogs: 15,
  gears: 25,
  springs: 20,
  clockwork_core: 120,
  mana_crystal: 50,
  gem_rough: 40,
  gem_cut: 100,
  potion_health: 35,
  potion_mana: 40,
};

// ---------------------------------------------------------------------------
// Shop definitions by location/biome
// ---------------------------------------------------------------------------

var SHOPS = {
  general: {
    name: 'General Store',
    description: 'Buys and sells common goods',
    inventory: ['wood', 'stone', 'iron_ore', 'iron_bar', 'wheat', 'herbs', 'vegetables', 'bread'],
  },
  blacksmith: {
    name: 'Blacksmith',
    description: 'Metals and forged goods',
    inventory: ['iron_ore', 'iron_bar', 'bronze_ore', 'bronze_bar', 'cogs', 'gears', 'springs'],
  },
  fishmonger: {
    name: 'Fishmonger',
    description: 'Fresh catch from the seas',
    inventory: ['fish', 'cooked_fish', 'shellfish', 'seaweed'],
  },
  alchemist: {
    name: 'Alchemist',
    description: 'Potions, crystals, and glassware',
    inventory: ['glass_vial', 'glass', 'glass_lens', 'mana_crystal', 'potion_health', 'potion_mana', 'herbs'],
  },
  jeweler: {
    name: 'Jeweler',
    description: 'Gems and precious materials',
    inventory: ['gem_rough', 'gem_cut', 'glass_lens', 'mana_crystal'],
  },
  engineer: {
    name: 'Gnomish Engineer',
    description: 'Clockwork parts and mechanisms',
    inventory: ['cogs', 'gears', 'springs', 'clockwork_core', 'glass_lens'],
  },
  provisions: {
    name: 'Provisions Merchant',
    description: 'Food and cooking supplies',
    inventory: ['wheat', 'herbs', 'vegetables', 'mushroom', 'fish', 'bread', 'stew', 'cooked_fish'],
  },
};

// ---------------------------------------------------------------------------
// Price fluctuation state
// ---------------------------------------------------------------------------

// Current price multipliers: tracks how far each resource is from base
// Starts at 1.0 (base price). Range: 0.3 to 3.0
var priceMultipliers = {};
// Pressure: positive = buying pressure (price goes up), negative = selling pressure (price goes down)
var pricePressure = {};

// Initialize
for (var res in BASE_PRICES) {
  priceMultipliers[res] = 1.0;
  pricePressure[res] = 0;
}

// Price tick settings
var TICK_INTERVAL_MS = 30000; // Update prices every 30 seconds
var PRESSURE_DECAY = 0.85;    // Pressure decays by 15% each tick
var PRESSURE_TO_PRICE = 0.02; // How much pressure affects price per tick
var DRIFT_RATE = 0.005;       // Natural drift back toward base price per tick
var MIN_MULTIPLIER = 0.5;
var MAX_MULTIPLIER = 2.0;

// Buy/sell markup
var BUY_MARKUP = 1.2;   // Players pay 20% over current market price
var SELL_DISCOUNT = 0.8; // Players receive 80% of current market price

var priceTickTimer = null;

function tickPrices() {
  for (var res in BASE_PRICES) {
    // Apply pressure to multiplier
    var pressure = pricePressure[res] || 0;
    priceMultipliers[res] += pressure * PRESSURE_TO_PRICE;

    // Natural drift back toward 1.0
    if (priceMultipliers[res] > 1.0) {
      priceMultipliers[res] -= DRIFT_RATE;
      if (priceMultipliers[res] < 1.0) priceMultipliers[res] = 1.0;
    } else if (priceMultipliers[res] < 1.0) {
      priceMultipliers[res] += DRIFT_RATE;
      if (priceMultipliers[res] > 1.0) priceMultipliers[res] = 1.0;
    }

    // Clamp
    if (priceMultipliers[res] < MIN_MULTIPLIER) priceMultipliers[res] = MIN_MULTIPLIER;
    if (priceMultipliers[res] > MAX_MULTIPLIER) priceMultipliers[res] = MAX_MULTIPLIER;

    // Decay pressure
    pricePressure[res] = (pricePressure[res] || 0) * PRESSURE_DECAY;
  }
}

function getBuyPrice(resource) {
  var base = BASE_PRICES[resource];
  if (!base) return null;
  return Math.max(1, Math.round(base * (priceMultipliers[resource] || 1.0) * BUY_MARKUP));
}

function getSellPrice(resource) {
  var base = BASE_PRICES[resource];
  if (!base) return null;
  return Math.max(1, Math.round(base * (priceMultipliers[resource] || 1.0) * SELL_DISCOUNT));
}

function getShopPrices(shopId) {
  var shop = SHOPS[shopId];
  if (!shop) return null;

  var prices = [];
  for (var i = 0; i < shop.inventory.length; i++) {
    var res = shop.inventory[i];
    var displayName = res.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    prices.push({
      resource: res,
      name: displayName,
      buyPrice: getBuyPrice(res),
      sellPrice: getSellPrice(res),
      basePrice: BASE_PRICES[res],
      trend: (priceMultipliers[res] || 1.0) > 1.05 ? 'up' : (priceMultipliers[res] || 1.0) < 0.95 ? 'down' : 'stable',
      multiplier: Math.round((priceMultipliers[res] || 1.0) * 100) / 100,
    });
  }
  return { shop: { id: shopId, name: shop.name, description: shop.description }, prices: prices };
}

// Per-account purchase lock to prevent concurrent buy/sell race conditions
var purchaseLocks = new Set();

// Start price ticker
priceTickTimer = setInterval(tickPrices, TICK_INTERVAL_MS);

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = {
  SHOPS: SHOPS,
  BASE_PRICES: BASE_PRICES,

  init(io, socket, deps) {
    var { user, socketAccountMap, accounts, checkEventRate } = deps;

    // --- npc_shop_browse: get available shops ---
    socket.on('npc_shop_browse', function() {

      var shopList = [];
      for (var shopId in SHOPS) {
        shopList.push({
          id: shopId,
          name: SHOPS[shopId].name,
          description: SHOPS[shopId].description,
          itemCount: SHOPS[shopId].inventory.length,
        });
      }
      socket.emit('npc_shop_list', { shops: shopList });
    });

    // --- npc_shop_prices: get prices for a specific shop ---
    socket.on('npc_shop_prices', function(data) {
      if (!data || typeof data.shopId !== 'string') return;

      var result = getShopPrices(data.shopId);
      if (!result) {
        socket.emit('npc_shop_error', { message: 'Shop not found' });
        return;
      }

      socket.emit('npc_shop_prices_result', result);
    });

    // --- npc_shop_buy: buy resources from NPC ---
    socket.on('npc_shop_buy', function(data) {
      if (!data || typeof data.shopId !== 'string' || typeof data.resource !== 'string' || typeof data.amount !== 'number') {
        socket.emit('npc_shop_error', { message: 'Invalid request' });
        return;
      }

      var key = socketAccountMap.get(socket.id);
      if (!key) return;

      var shop = SHOPS[data.shopId];
      if (!shop) { socket.emit('npc_shop_error', { message: 'Shop not found' }); return; }

      // Check shop sells this resource
      if (shop.inventory.indexOf(data.resource) === -1) {
        socket.emit('npc_shop_error', { message: 'This shop does not sell ' + data.resource.replace(/_/g, ' ') });
        return;
      }

      var amount = Math.floor(data.amount);
      if (amount < 1 || amount > 100) {
        socket.emit('npc_shop_error', { message: 'Amount must be 1-100' });
        return;
      }

      var unitPrice = getBuyPrice(data.resource);
      var totalCost = unitPrice * amount;

      var acc = accounts.loadAccount(key);
      if (!acc) return;

      // Apply Presence stat discount BEFORE coin check (2% per point above 5)
      var presenceDiscount = 1.0;
      if (acc.rpgStats && acc.rpgStats.presence > 5) {
        presenceDiscount = 1 - ((acc.rpgStats.presence - 5) * 0.02);
        if (presenceDiscount < 0.7) presenceDiscount = 0.7; // cap at 30% discount
        totalCost = Math.max(amount, Math.round(totalCost * presenceDiscount));
      }

      if ((acc.chips || 0) < totalCost) {
        socket.emit('npc_shop_error', { message: 'Not enough coins (need ' + totalCost + ')' });
        return;
      }

      // Acquire purchase lock to prevent concurrent buy race conditions
      if (purchaseLocks.has(key)) {
        socket.emit('npc_shop_error', { message: 'Transaction in progress, try again' });
        return;
      }
      purchaseLocks.add(key);
      try {
        // Deduct coins and add resources
        accounts.updateChips(key, -totalCost);
        accounts.addResource(key, data.resource, amount);

        // Add buying pressure (price goes up)
        pricePressure[data.resource] = (pricePressure[data.resource] || 0) + (amount * 0.1);

        var displayName = data.resource.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        socket.emit('npc_shop_bought', {
          resource: data.resource,
          amount: amount,
          totalCost: totalCost,
          unitPrice: unitPrice,
          coins: (accounts.loadAccount(key) || {}).chips || 0,
          inventory: accounts.getMMOInventory(key),
          message: 'Bought ' + amount + ' ' + displayName + ' for ' + totalCost + ' coins',
        });
      } finally {
        purchaseLocks.delete(key);
      }
    });

    // --- npc_shop_sell: sell resources to NPC ---
    socket.on('npc_shop_sell', function(data) {
      if (!data || typeof data.resource !== 'string' || typeof data.amount !== 'number') {
        socket.emit('npc_shop_error', { message: 'Invalid request' });
        return;
      }

      var key = socketAccountMap.get(socket.id);
      if (!key) return;

      // Any shop buys anything (for convenience), but at sell discount
      var amount = Math.floor(data.amount);
      if (amount < 1 || amount > 100) {
        socket.emit('npc_shop_error', { message: 'Amount must be 1-100' });
        return;
      }

      if (!BASE_PRICES[data.resource]) {
        socket.emit('npc_shop_error', { message: 'Cannot sell that item' });
        return;
      }

      // Acquire purchase lock
      if (purchaseLocks.has(key)) {
        socket.emit('npc_shop_error', { message: 'Transaction in progress, try again' });
        return;
      }
      purchaseLocks.add(key);
      try {
        // Validate resource availability BEFORE any mutations (C-6 fix)
        var inv = accounts.getMMOInventory(key);
        if (!inv || (inv[data.resource] || 0) < amount) {
          socket.emit('npc_shop_error', { message: 'Not enough ' + data.resource.replace(/_/g, ' ') });
          return;
        }

        var unitPrice = getSellPrice(data.resource);
        var totalPayment = unitPrice * amount;

        // Apply Presence stat bonus (2% per point above 5)
        var acc = accounts.loadAccount(key);
        if (acc && acc.rpgStats && acc.rpgStats.presence > 5) {
          var presenceBonus = 1 + ((acc.rpgStats.presence - 5) * 0.02);
          if (presenceBonus > 1.3) presenceBonus = 1.3; // cap at 30% bonus
          totalPayment = Math.round(totalPayment * presenceBonus);
        }

        // Anti-arbitrage guard (C-6 fix): ensure sell price never exceeds 95% of buy price.
        // High-Presence players could otherwise buy at 0.84x and sell at 1.04x for risk-free profit.
        var buyPrice = getBuyPrice(data.resource);
        var maxSellTotal = Math.floor(buyPrice * 0.95) * amount;
        if (totalPayment > maxSellTotal) {
          totalPayment = maxSellTotal;
        }

        // Credit coins FIRST, then remove resources (C-6 fix).
        // If removeResource fails after crediting, deduct coins back.
        // This prevents the player from losing resources without compensation.
        var chipResult = accounts.updateChips(key, totalPayment);
        if (chipResult === null) {
          socket.emit('npc_shop_error', { message: 'Transaction failed' });
          return;
        }

        var removed = accounts.removeResource(key, data.resource, amount);
        if (removed === null) {
          // Rollback: deduct the coins we just credited
          accounts.updateChips(key, -totalPayment);
          socket.emit('npc_shop_error', { message: 'Not enough ' + data.resource.replace(/_/g, ' ') });
          return;
        }

        // Add selling pressure (price goes down)
        pricePressure[data.resource] = (pricePressure[data.resource] || 0) - (amount * 0.1);

        var displayName = data.resource.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        socket.emit('npc_shop_sold', {
          resource: data.resource,
          amount: amount,
          totalPayment: totalPayment,
          unitPrice: unitPrice,
          coins: (accounts.loadAccount(key) || {}).chips || 0,
          inventory: accounts.getMMOInventory(key),
          message: 'Sold ' + amount + ' ' + displayName + ' for ' + totalPayment + ' coins',
        });
      } finally {
        purchaseLocks.delete(key);
      }
    });

    // --- npc_shop_all_prices: get all resource prices (market overview) ---
    socket.on('npc_shop_all_prices', function() {

      var allPrices = [];
      for (var res in BASE_PRICES) {
        var displayName = res.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        allPrices.push({
          resource: res,
          name: displayName,
          buyPrice: getBuyPrice(res),
          sellPrice: getSellPrice(res),
          basePrice: BASE_PRICES[res],
          trend: (priceMultipliers[res] || 1.0) > 1.05 ? 'up' : (priceMultipliers[res] || 1.0) < 0.95 ? 'down' : 'stable',
          multiplier: Math.round((priceMultipliers[res] || 1.0) * 100) / 100,
        });
      }

      socket.emit('npc_shop_market_overview', { prices: allPrices });
    });
  }
};
