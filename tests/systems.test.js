// tests/systems.test.js
// Layer 6: Unit tests for all new game systems.
// Covers: karma, factions, prison, companions, pets, ascension,
//         rumor-system, loot-generator, leviathan-data.
// Tests exported utility functions only — socket handlers not tested here.

// ascension.js requires rpg-data at load time — mock what it actually uses
jest.mock('../rpg-data', () => ({
  overallXpForLevel: (n) => Math.floor(200 * Math.pow(n, 1.6)),
  getCardSlotCount: () => 2,
  getActiveCardSlotCount: () => 1,
  getPassiveCardSlotCount: () => 1,
  getDefaultSkills: () => ({}),
  getDefaultStats:  () => ({ vigor: 5, might: 5, finesse: 5, acumen: 5, resolve: 5, presence: 5, ingenuity: 5 }),
  RARITY_TIERS: [],
  SKILL_DEFINITIONS: {},
  STAT_NAMES: {},
  CARD_TEMPLATES: [],
  WORLD_QUEST_TEMPLATES: [],
}));

const karma       = require('../handlers/karma');
const factions    = require('../handlers/factions');
const prison      = require('../handlers/prison');
const companions  = require('../handlers/companions');
const pets        = require('../handlers/pets');
const ascension   = require('../handlers/ascension');
const rumors      = require('../rumor-system');
const loot        = require('../loot-generator');
const leviathan   = require('../leviathan-data');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAccount(overrides) {
  return Object.assign({
    key: 'test', username: 'Tester', chips: 500,
    level: 1, karma: 0, race: 'human',
    factionRep: {}, companions: [], petData: [],
    jailState: null, ascensionCount: 0, ascensionPoints: 0,
    ascensionTree: {},
  }, overrides);
}

// ===========================================================================
// KARMA
// ===========================================================================

describe('karma — addKarma', () => {
  test('adds positive delta', () => {
    const acc = makeAccount({ karma: 10 });
    karma.addKarma(acc, 5, 'quest_complete');
    expect(acc.karma).toBe(15);
  });

  test('subtracts negative delta', () => {
    const acc = makeAccount({ karma: 0 });
    karma.addKarma(acc, -20, 'assault');
    expect(acc.karma).toBe(-20);
  });

  test('clamps to -100 minimum', () => {
    const acc = makeAccount({ karma: -90 });
    karma.addKarma(acc, -50, 'murder');
    expect(acc.karma).toBe(-100);
  });

  test('clamps to +100 maximum', () => {
    const acc = makeAccount({ karma: 95 });
    karma.addKarma(acc, 50, 'quest_complete');
    expect(acc.karma).toBe(100);
  });

  test('auto-places bounty when karma falls <= -20', () => {
    const acc = makeAccount({ karma: -15 });
    karma.addKarma(acc, -10, 'assault');
    expect(acc.activeBounty).not.toBeNull();
    expect(acc.activeBounty.reason).toBe('assault');
  });

  test('does NOT place bounty if karma stays above threshold', () => {
    const acc = makeAccount({ karma: -10 });
    karma.addKarma(acc, -5, 'node_theft');
    expect(acc.activeBounty).toBeFalsy();
  });

  test('clears bounty when karma recovers above threshold', () => {
    const acc = makeAccount({ karma: -25, activeBounty: { amount: 250, reason: 'murder', issuedAt: Date.now() } });
    karma.addKarma(acc, 30, 'quest_complete');
    expect(acc.activeBounty).toBeNull();
  });

  test('records crime history (max 10 entries)', () => {
    const acc = makeAccount();
    for (let i = 0; i < 15; i++) karma.addKarma(acc, 1, 'help'); // positive — no crime history
    for (let i = 0; i < 12; i++) karma.addKarma(acc, -1, 'vandalism');
    expect(acc.crimeHistory.length).toBeLessThanOrEqual(10);
  });
});

describe('karma — isGuardHostile', () => {
  test('returns false when karma > -30', () => {
    expect(karma.isGuardHostile(makeAccount({ karma: -29 }))).toBe(false);
  });

  test('returns true when karma === -30 (threshold)', () => {
    expect(karma.isGuardHostile(makeAccount({ karma: -30 }))).toBe(true);
  });

  test('returns true when karma < -30', () => {
    expect(karma.isGuardHostile(makeAccount({ karma: -50 }))).toBe(true);
  });
});

describe('karma — constants', () => {
  test('GUARD_HOSTILITY_THRESHOLD is -30', () => {
    expect(karma.GUARD_HOSTILITY_THRESHOLD).toBe(-30);
  });

  test('BOUNTY_THRESHOLD is -20', () => {
    expect(karma.BOUNTY_THRESHOLD).toBe(-20);
  });

  test('CRIME_KARMA_COSTS has assault as most negative common crime', () => {
    expect(karma.CRIME_KARMA_COSTS.assault).toBeLessThan(0);
    expect(karma.CRIME_KARMA_COSTS.murder).toBeLessThan(karma.CRIME_KARMA_COSTS.assault);
  });
});

// ===========================================================================
// FACTIONS
// ===========================================================================

describe('factions — constants', () => {
  test('FACTIONS has exactly 11 factions', () => {
    expect(Object.keys(factions.FACTIONS).length).toBe(11);
  });

  test('REP_LEVELS has 8 levels', () => {
    expect(factions.REP_LEVELS.length).toBe(8);
  });

  test('REP_THRESHOLDS has 8 entries', () => {
    expect(factions.REP_THRESHOLDS.length).toBe(8);
  });

  test('REP_SHOP_DISCOUNT has 8 entries, ranging -0.20 to +0.20', () => {
    expect(factions.REP_SHOP_DISCOUNT.length).toBe(8);
    expect(Math.min(...factions.REP_SHOP_DISCOUNT)).toBe(-0.20);
    expect(Math.max(...factions.REP_SHOP_DISCOUNT)).toBe(0.20);
  });
});

describe('factions — getRepLevel / getRepLevelName / getRepDiscount', () => {
  test('new player (0 rep) is Neutral (index 3)', () => {
    expect(factions.getRepLevel(0)).toBe(3);
    expect(factions.getRepLevelName(0)).toBe('Neutral');
    expect(factions.getRepDiscount(0)).toBe(0);
  });

  test('very negative rep is Hated (index 0)', () => {
    expect(factions.getRepLevel(-15000)).toBe(0);
    expect(factions.getRepLevelName(-15000)).toBe('Hated');
    expect(factions.getRepDiscount(-15000)).toBe(-0.20);
  });

  test('maxed rep is Exalted (index 7)', () => {
    expect(factions.getRepLevel(15000)).toBe(7);
    expect(factions.getRepLevelName(15000)).toBe('Exalted');
    expect(factions.getRepDiscount(15000)).toBe(0.20);
  });

  test('isFactionHostile returns true when faction rep is Hated/Hostile', () => {
    // Signature: isFactionHostile(factionRepObject, factionId)
    expect(factions.isFactionHostile({ holy_dominion: -5000 }, 'holy_dominion')).toBe(true);
    expect(factions.isFactionHostile({ holy_dominion: 500 }, 'holy_dominion')).toBe(false);
  });
});

describe('factions — addRep', () => {
  test('addRep increases factionRep on account', () => {
    const acc = makeAccount();
    factions.addRep(acc, 'holy_dominion', 500);
    expect(acc.factionRep.holy_dominion).toBe(500);
  });

  test('addRep clamps at +15000', () => {
    const acc = makeAccount({ factionRep: { holy_dominion: 14900 } });
    factions.addRep(acc, 'holy_dominion', 1000);
    expect(acc.factionRep.holy_dominion).toBeLessThanOrEqual(15000);
  });

  test('addRep clamps at -15000', () => {
    const acc = makeAccount({ factionRep: { holy_dominion: -14900 } });
    factions.addRep(acc, 'holy_dominion', -1000);
    expect(acc.factionRep.holy_dominion).toBeGreaterThanOrEqual(-15000);
  });
});

// ===========================================================================
// PRISON
// ===========================================================================

describe('prison — CRIME_DEFINITIONS', () => {
  test('has exactly 6 crime types', () => {
    expect(Object.keys(prison.CRIME_DEFINITIONS).length).toBe(6);
  });

  test('every crime has durationMs, bail, label', () => {
    for (const [id, def] of Object.entries(prison.CRIME_DEFINITIONS)) {
      expect(typeof def.durationMs).toBe('number');
      expect(def.durationMs).toBeGreaterThan(0);
      expect(typeof def.bail).toBe('number');
      expect(def.bail).toBeGreaterThan(0);
      expect(typeof def.label).toBe('string');
    }
  });

  test('murder has longest sentence', () => {
    const durs = Object.values(prison.CRIME_DEFINITIONS).map(d => d.durationMs);
    expect(prison.CRIME_DEFINITIONS.murder.durationMs).toBe(Math.max(...durs));
  });

  test('trespassing has shortest sentence', () => {
    const durs = Object.values(prison.CRIME_DEFINITIONS).map(d => d.durationMs);
    expect(prison.CRIME_DEFINITIONS.trespassing.durationMs).toBe(Math.min(...durs));
  });
});

describe('prison — arrestPlayer / isJailed / releasePlayer', () => {
  test('arrestPlayer sets jailState correctly', () => {
    const acc = makeAccount();
    const state = prison.arrestPlayer(acc, 'assault');
    expect(state.inJail).toBe(true);
    expect(state.crime).toBe('assault');
    expect(typeof state.releasedAt).toBe('number');
    expect(state.releasedAt).toBeGreaterThan(Date.now());
  });

  test('isJailed returns true after arrest', () => {
    const acc = makeAccount();
    prison.arrestPlayer(acc, 'trespassing');
    expect(prison.isJailed(acc)).toBe(true);
  });

  test('isJailed returns false for clean account', () => {
    expect(prison.isJailed(makeAccount())).toBe(false);
  });

  test('releasePlayer clears jail state', () => {
    const acc = makeAccount();
    prison.arrestPlayer(acc, 'vandalism');
    prison.releasePlayer(acc);
    expect(prison.isJailed(acc)).toBe(false);
  });

  test('isJailed returns false if sentence expired', () => {
    const acc = makeAccount();
    prison.arrestPlayer(acc, 'trespassing');
    // Backdate releasedAt to the past
    acc.jailState.releasedAt = Date.now() - 1000;
    expect(prison.isJailed(acc)).toBe(false);
  });

  test('KARMA_ARREST_THRESHOLD is -50', () => {
    expect(prison.KARMA_ARREST_THRESHOLD).toBe(-50);
  });
});

// ===========================================================================
// COMPANIONS
// ===========================================================================

describe('companions — constants', () => {
  test('MAX_COMPANIONS is 2', () => {
    expect(companions.MAX_COMPANIONS).toBe(2);
  });

  test('COMPANION_CLASSES has exactly 6 classes', () => {
    expect(Object.keys(companions.COMPANION_CLASSES).length).toBe(6);
  });

  test('every class has name, dailyWage, baseDmg, baseHp', () => {
    for (const [id, cls] of Object.entries(companions.COMPANION_CLASSES)) {
      expect(typeof cls.name).toBe('string');
      expect(typeof cls.dailyWage).toBe('number');
      expect(cls.dailyWage).toBeGreaterThan(0);
      expect(typeof cls.baseDmg).toBe('number');
      expect(typeof cls.baseHp).toBe('number');
    }
  });
});

describe('companions — getCompanionDamage / getTotalCompanionDamage', () => {
  test('getCompanionDamage returns baseDmg for healthy companion', () => {
    const comp = { class: 'soldier', hp: 50, maxHp: 100 };
    const dmg = companions.getCompanionDamage(comp);
    expect(dmg).toBeGreaterThan(0);
  });

  test('getCompanionDamage returns 0 for downed companion (hp <= 0)', () => {
    const comp = { class: 'soldier', hp: 0, maxHp: 100 };
    expect(companions.getCompanionDamage(comp)).toBe(0);
  });

  test('getTotalCompanionDamage sums all companions', () => {
    const acc = makeAccount({
      companions: [
        { class: 'soldier', hp: 50, maxHp: 100 },
        { class: 'archer',  hp: 40, maxHp: 80 },
      ],
    });
    const total = companions.getTotalCompanionDamage(acc);
    expect(total).toBeGreaterThan(0);
  });

  test('getTotalCompanionDamage is 0 with no companions', () => {
    expect(companions.getTotalCompanionDamage(makeAccount())).toBe(0);
  });
});

describe('companions — deductCompanionWages', () => {
  test('deducts wages from account chips', () => {
    const acc = makeAccount({
      chips: 1000,
      companions: [{
        id: 'c1', class: 'soldier', hp: 50, maxHp: 100,
        hired_at: Date.now() - 90000, last_paid: Date.now() - 90000,
      }],
    });
    companions.deductCompanionWages(acc);
    expect(acc.chips).toBeLessThanOrEqual(1000);
  });

  test('dismisses companion if chips insufficient (wage due after 24h)', () => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const acc = makeAccount({
      chips: 0,
      companions: [{
        id: 'c1', class: 'soldier', hp: 50, maxHp: 100,
        hired_at: Date.now() - DAY_MS - 1000,
        last_paid: Date.now() - DAY_MS - 1000, // over 24 hours ago — wage is due
      }],
    });
    companions.deductCompanionWages(acc);
    expect(acc.companions.length).toBe(0);
  });
});

// ===========================================================================
// PETS
// ===========================================================================

describe('pets — constants', () => {
  test('PET_CARE has hungerDecayPerHour, happinessDecayPerHour, maxStat', () => {
    expect(typeof pets.PET_CARE.hungerDecayPerHour).toBe('number');
    expect(typeof pets.PET_CARE.happinessDecayPerHour).toBe('number');
    expect(pets.PET_CARE.maxStat).toBe(100);
  });

  test('TAMEABLE_CREATURES has at least 3 biomes', () => {
    expect(Object.keys(pets.TAMEABLE_CREATURES).length).toBeGreaterThanOrEqual(3);
  });

  test('every creature type has tamingLevel and evolutions array', () => {
    for (const [biome, creatures] of Object.entries(pets.TAMEABLE_CREATURES)) {
      expect(Array.isArray(creatures)).toBe(true);
      for (const c of creatures) {
        expect(typeof c.tamingLevel).toBe('number');
        expect(Array.isArray(c.evolutions)).toBe(true);
        expect(c.evolutions.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('pets — tickPetDecay', () => {
  test('decays hunger and happiness over time', () => {
    const acc = makeAccount({
      petData: [{
        id: 'p1', type: 'cat', name: 'Mittens',
        hunger: 80, happiness: 90,
        lastDecayTick: Date.now() - 2 * 3600 * 1000, // 2 hours ago
        evolutionLevel: 0, evolutionXp: 0, evolutions: [{ level: 1, name: 'BigCat', speedBonus: 1 }],
        baseSpeed: 5,
      }],
    });
    pets.tickPetDecay(acc);
    // After 2 hours, hunger/happiness should have decreased
    const p = acc.petData[0];
    expect(p.hunger).toBeLessThan(80);
    expect(p.happiness).toBeLessThan(90);
  });

  test('hunger/happiness floor at 0', () => {
    const acc = makeAccount({
      petData: [{
        id: 'p1', type: 'cat', name: 'Mittens',
        hunger: 2, happiness: 1,
        lastDecayTick: Date.now() - 100 * 3600 * 1000, // 100 hours ago
        evolutionLevel: 0, evolutionXp: 0, evolutions: [{ level: 1, name: 'BigCat', speedBonus: 1 }],
        baseSpeed: 5,
      }],
    });
    pets.tickPetDecay(acc);
    expect(acc.petData[0].hunger).toBeGreaterThanOrEqual(0);
    expect(acc.petData[0].happiness).toBeGreaterThanOrEqual(0);
  });
});

describe('pets — awardPetEvoXp', () => {
  test('returns null when no active pet', () => {
    const acc = makeAccount({ petData: [], activePet: null });
    expect(pets.awardPetEvoXp(acc, 50)).toBeNull();
  });

  test('triggers evolution when XP crosses threshold', () => {
    const evo = [
      { level: 1, name: 'KittenGrown', speedBonus: 1 },
      { level: 2, name: 'BigCat',      speedBonus: 2 },
    ];
    const acc = makeAccount({
      activePet: 'p1',
      petData: [{
        id: 'p1', type: 'cat', name: 'Kitten',
        evolutionLevel: 0, evolutionXp: 95, evolutions: evo,
        baseSpeed: 5, hunger: 80, happiness: 80,
        lastDecayTick: Date.now(),
      }],
    });
    const result = pets.awardPetEvoXp(acc, 10);
    expect(result).not.toBeNull();
    expect(result.evolved).toBe(true);
    expect(result.newLevel).toBe(1);
  });
});

// ===========================================================================
// ASCENSION
// ===========================================================================

describe('ascension — ASCENSION_TREE', () => {
  test('has exactly 8 nodes', () => {
    expect(Object.keys(ascension.ASCENSION_TREE).length).toBe(8);
  });

  test('every node has name, desc, apCost, maxRank, effect', () => {
    for (const [id, node] of Object.entries(ascension.ASCENSION_TREE)) {
      expect(typeof node.name).toBe('string');
      expect(typeof node.apCost).toBe('number');
      expect(node.apCost).toBeGreaterThan(0);
      expect(typeof node.maxRank).toBe('number');
      expect(node.maxRank).toBeGreaterThan(0);
      expect(node.effect).toBeDefined();
    }
  });
});

describe('ascension — canAscend / doAscend / getApReward', () => {
  test('canAscend returns false below level 100', () => {
    expect(ascension.canAscend(makeAccount({ level: 99 }))).toBe(false);
  });

  test('canAscend returns true at level 100', () => {
    expect(ascension.canAscend(makeAccount({ level: 100 }))).toBe(true);
  });

  test('doAscend resets level to 1', () => {
    const acc = makeAccount({ level: 100, ascensionCount: 0, ascensionPoints: 0 });
    ascension.doAscend(acc);
    expect(acc.level).toBe(1);
  });

  test('doAscend increments ascensionCount', () => {
    const acc = makeAccount({ level: 100, ascensionCount: 0, ascensionPoints: 0 });
    ascension.doAscend(acc);
    expect(acc.ascensionCount).toBe(1);
  });

  test('doAscend grants ascension points', () => {
    const acc = makeAccount({ level: 100, ascensionCount: 0, ascensionPoints: 0 });
    ascension.doAscend(acc);
    expect(acc.ascensionPoints).toBeGreaterThan(0);
  });

  test('getApReward increases with ascension count', () => {
    expect(ascension.getApReward(1)).toBeGreaterThan(ascension.getApReward(0));
    expect(ascension.getApReward(2)).toBeGreaterThan(ascension.getApReward(1));
  });
});

// ===========================================================================
// RUMOR SYSTEM
// ===========================================================================

describe('rumor-system — RUMOR_TEMPLATES', () => {
  test('has exactly 22 templates', () => {
    expect(rumors.RUMOR_TEMPLATES.length).toBe(22);
  });

  test('every template has id, text, tags, accuracy', () => {
    for (const t of rumors.RUMOR_TEMPLATES) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.text).toBe('string');
      expect(Array.isArray(t.tags)).toBe(true);
      expect(typeof t.accuracy).toBe('number');
      expect(t.accuracy).toBeGreaterThan(0);
      expect(t.accuracy).toBeLessThanOrEqual(100);
    }
  });

  test('no duplicate template ids', () => {
    const ids = rumors.RUMOR_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('rumor-system — getTownRumors / addWorldEventRumor', () => {
  test('getTownRumors returns array for unknown town', () => {
    const result = rumors.getTownRumors('nonexistent_town');
    expect(Array.isArray(result)).toBe(true);
  });

  test('addWorldEventRumor adds a rumor to the town pool', () => {
    const zone = 'starter_town';
    rumors.addWorldEventRumor(zone, {
      text: 'Strange lights in the Rift tonight.',
      tags: ['rift', 'danger'],
      accuracy: 70,
      isWorldEvent: true,
    });
    const result = rumors.getTownRumors(zone);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].text).toBe('Strange lights in the Rift tonight.');
  });
});

// ===========================================================================
// LOOT GENERATOR
// ===========================================================================

describe('loot-generator — ITEM_MUTATION_POOL', () => {
  test('has at least 35 mutations', () => {
    expect(loot.ITEM_MUTATION_POOL.length).toBeGreaterThanOrEqual(35);
  });

  test('every mutation has id, tier (1-3)', () => {
    for (const m of loot.ITEM_MUTATION_POOL) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.tier).toBe('number');
      expect(m.tier).toBeGreaterThanOrEqual(1);
      expect(m.tier).toBeLessThanOrEqual(3);
    }
  });

  test('some mutations have canViral = true', () => {
    const viral = loot.ITEM_MUTATION_POOL.filter(m => m.canViral);
    expect(viral.length).toBeGreaterThan(0);
  });
});

describe('loot-generator — ITEM_CURSE_POOL', () => {
  test('has at least 15 curses', () => {
    expect(loot.ITEM_CURSE_POOL.length).toBeGreaterThanOrEqual(15);
  });

  test('every curse has id and tier', () => {
    for (const c of loot.ITEM_CURSE_POOL) {
      expect(typeof c.id).toBe('string');
      expect(typeof c.tier).toBe('number');
    }
  });
});

describe('loot-generator — rollItemMutation', () => {
  // rollItemMutation caps finalChance at 0.50 regardless of baseChance.
  // Test probabilistically: after enough tries at least one should succeed.
  test('eventually returns a valid mutation (50% per roll)', () => {
    let got = null;
    for (let i = 0; i < 50 && !got; i++) {
      got = loot.rollItemMutation(1.0, 0, 'weapon');
    }
    expect(got).not.toBeNull();
    expect(got).toHaveProperty('id');
    expect(got).toHaveProperty('tier');
  });

  test('when non-null, result has id and tier', () => {
    for (let i = 0; i < 30; i++) {
      const result = loot.rollItemMutation(0.5, 0, 'armor');
      if (result !== null) {
        expect(result).toHaveProperty('id');
        expect(typeof result.tier).toBe('number');
      }
    }
  });
});

describe('loot-generator — rollItemCurse', () => {
  test('eventually returns a valid curse (probabilistic)', () => {
    let got = null;
    for (let i = 0; i < 50 && !got; i++) {
      got = loot.rollItemCurse(1.0, 0);
    }
    expect(got).not.toBeNull();
    expect(got).toHaveProperty('id');
    expect(got).toHaveProperty('tier');
  });

  test('when non-null, result has id and tier', () => {
    for (let i = 0; i < 20; i++) {
      const result = loot.rollItemCurse(0.5, 0);
      if (result !== null) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('tier');
      }
    }
  });
});

describe('loot-generator — applyItemMutation / applyItemCurse / cleanseItemCurse', () => {
  test('applyItemMutation attaches mutation to item', () => {
    const item = { name: 'Iron Sword', stats: { atk: 10 }, mutations: [] };
    const mut = loot.ITEM_MUTATION_POOL[0];
    loot.applyItemMutation(item, mut);
    expect(item.mutations.length).toBe(1);
    expect(item.mutations[0].id).toBe(mut.id);
  });

  test('applyItemCurse sets item.isCursed and adds to item.curses array', () => {
    const item = { name: 'Iron Sword', stats: { atk: 10 } };
    const curse = loot.ITEM_CURSE_POOL[0];
    loot.applyItemCurse(item, curse);
    expect(item.isCursed).toBe(true);
    expect(Array.isArray(item.curses)).toBe(true);
    expect(item.curses.length).toBeGreaterThan(0);
  });

  test('cleanseItemCurse(item, curseId) removes the named curse and clears isCursed', () => {
    const item = { name: 'Iron Sword', stats: { atk: 10 } };
    const curse = loot.ITEM_CURSE_POOL.find(c => c.cleansable !== false) || loot.ITEM_CURSE_POOL[0];
    loot.applyItemCurse(item, curse);
    // Cleanse requires passing the curse id
    loot.cleanseItemCurse(item, curse.id);
    expect(item.isCursed).toBeFalsy();
  });
});

describe('loot-generator — BIOME_CURSE_CHANCE', () => {
  test('rift has highest curse chance', () => {
    const chances = Object.values(loot.BIOME_CURSE_CHANCE);
    expect(loot.BIOME_CURSE_CHANCE.rift).toBe(Math.max(...chances));
  });

  test('crafted items have lower curse chance than rift', () => {
    expect(loot.BIOME_CURSE_CHANCE.crafted).toBeLessThan(loot.BIOME_CURSE_CHANCE.rift);
  });
});

// ===========================================================================
// LEVIATHAN DATA
// ===========================================================================

describe('leviathan-data — constants', () => {
  test('LEVIATHAN_TEMPLATES has exactly 8 entries', () => {
    expect(Object.keys(leviathan.LEVIATHAN_TEMPLATES).length).toBe(8);
  });

  test('SIZE_TIERS has 3 tiers', () => {
    expect(Object.keys(leviathan.SIZE_TIERS).length).toBe(3);
  });

  test('every leviathan has id, name, tier, totalHp, phases, parts', () => {
    for (const [id, tmpl] of Object.entries(leviathan.LEVIATHAN_TEMPLATES)) {
      expect(tmpl).toHaveProperty('id');
      expect(tmpl).toHaveProperty('name');
      expect(tmpl).toHaveProperty('tier');
      expect(typeof tmpl.totalHp).toBe('number');
      expect(tmpl.totalHp).toBeGreaterThan(0);
      expect(Array.isArray(tmpl.phases)).toBe(true);
      expect(tmpl.phases.length).toBeGreaterThan(0);
      expect(Array.isArray(tmpl.parts)).toBe(true);
      expect(tmpl.parts.length).toBeGreaterThan(0);
    }
  });

  test('every part has id, name, hpPercent, atk, def', () => {
    for (const tmpl of Object.values(leviathan.LEVIATHAN_TEMPLATES)) {
      for (const part of tmpl.parts) {
        expect(typeof part.id).toBe('string');
        expect(typeof part.hpPercent).toBe('number');
        expect(part.hpPercent).toBeGreaterThan(0);
        expect(part.hpPercent).toBeLessThanOrEqual(1);
        expect(typeof part.atk).toBe('number');
      }
    }
  });

  test('phase thresholds are decreasing (triggers at lower HP)', () => {
    for (const tmpl of Object.values(leviathan.LEVIATHAN_TEMPLATES)) {
      const thresholds = tmpl.phases.map(p => p.threshold);
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i]).toBeLessThan(thresholds[i - 1]);
      }
    }
  });
});

describe('leviathan-data — scaleLeviathan', () => {
  test('returns scaled version of template', () => {
    const tmpl = Object.values(leviathan.LEVIATHAN_TEMPLATES)[0];
    const scaled = leviathan.scaleLeviathan(tmpl, 4, 20);
    expect(scaled).toHaveProperty('totalHp');
    expect(typeof scaled.totalHp).toBe('number');
    expect(scaled.totalHp).toBeGreaterThan(0);
  });

  test('more players = higher HP', () => {
    const tmpl = Object.values(leviathan.LEVIATHAN_TEMPLATES)[0];
    const solo  = leviathan.scaleLeviathan(tmpl, 1, 10);
    const group = leviathan.scaleLeviathan(tmpl, 8, 10);
    expect(group.totalHp).toBeGreaterThan(solo.totalHp);
  });
});
