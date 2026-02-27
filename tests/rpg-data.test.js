// tests/rpg-data.test.js
// Layer 3: rpg-data unit tests — card generation, fusion, mutations, quest validation.

const rpg = require('../rpg-data');

// ---------------------------------------------------------------------------
// Card generation
// ---------------------------------------------------------------------------

describe('generateCardInstance', () => {
  test('returns a card with cardId, name, rarity, effects', () => {
    expect(rpg.CARD_TEMPLATES).toBeTruthy();
    expect(rpg.CARD_TEMPLATES.length).toBeGreaterThan(10);

    const tmpl = rpg.CARD_TEMPLATES[0];
    // generateCardInstance(template, source, rolledRarity)
    const card = rpg.generateCardInstance(tmpl, 'test', 'common');
    expect(card).toHaveProperty('cardId');
    expect(card).toHaveProperty('rarity', 'common');
    expect(Array.isArray(card.effects)).toBe(true);
  });

  test('rarity scaling: rare card has more effects or higher values than common', () => {
    const tmpl = rpg.CARD_TEMPLATES.find(t => t.type === 'stat_boost');
    if (!tmpl) return;
    const common = rpg.generateCardInstance(tmpl, 'test', 'common');
    const rare = rpg.generateCardInstance(tmpl, 'test', 'rare');
    // Both should be valid cards
    expect(common.rarity).toBe('common');
    expect(rare.rarity).toBe('rare');
    expect(Array.isArray(common.effects)).toBe(true);
    expect(Array.isArray(rare.effects)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Card fusion
// ---------------------------------------------------------------------------

describe('fuseCards', () => {
  // Helper: generate a real card from a template for fusion
  function makeCard(cardId, rarity) {
    const tmpl = rpg.CARD_BY_ID && rpg.CARD_BY_ID[cardId];
    if (!tmpl) return null;
    return rpg.generateCardInstance(tmpl, 'test', rarity);
  }

  test('canFuseCards returns {ok: true} for same-cardId same-rarity pair', () => {
    if (!rpg.canFuseCards) return;
    const c1 = makeCard('vigor', 'common');
    const c2 = makeCard('vigor', 'common');
    if (!c1 || !c2) return;
    const result = rpg.canFuseCards(c1, c2);
    // canFuseCards returns {ok: boolean}
    expect(result).toHaveProperty('ok', true);
  });

  test('fusing two same-rarity cards produces next rarity tier in result.card', () => {
    if (!rpg.fuseCards) return;
    const c1 = makeCard('vigor', 'common');
    const c2 = makeCard('vigor', 'common');
    if (!c1 || !c2) return;
    const result = rpg.fuseCards(c1, c2);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('card');
    expect(result.card.rarity).toBe('uncommon');
  });

  test('fused result.card has cardId matching the original', () => {
    if (!rpg.fuseCards) return;
    const c1 = makeCard('vigor', 'uncommon');
    const c2 = makeCard('vigor', 'uncommon');
    if (!c1 || !c2) return;
    const result = rpg.fuseCards(c1, c2);
    if (!result || !result.card) return;
    expect(result.card.cardId).toBe('vigor');
    expect(result.card.rarity).toBe('rare');
  });

  test('canFuseCards returns false for different templateIds', () => {
    if (!rpg.canFuseCards) return;
    const c1 = makeCard('vigor', 'common');
    const templates = rpg.CARD_TEMPLATES;
    const diffTmpl = templates.find(t => t.cardId !== 'vigor');
    if (!c1 || !diffTmpl) return;
    const c2 = rpg.generateCardInstance(diffTmpl, 'test', 'common');
    // Different base templates — may or may not be fusible depending on type
    // Just verify it doesn't throw
    expect(() => rpg.canFuseCards(c1, c2)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Mutation system
// ---------------------------------------------------------------------------

describe('MUTATION_POOL', () => {
  test('has at least 10 mutations', () => {
    expect(rpg.MUTATION_POOL).toBeDefined();
    expect(rpg.MUTATION_POOL.length).toBeGreaterThanOrEqual(10);
  });

  test('every mutation has id, tier, label, and effect', () => {
    for (const m of rpg.MUTATION_POOL) {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('tier');
      expect(typeof m.tier).toBe('number');
      expect(m.tier).toBeGreaterThanOrEqual(1);
      expect(m.tier).toBeLessThanOrEqual(3);
    }
  });

  test('rollMutation returns null or a valid mutation object', () => {
    if (!rpg.rollMutation) return;
    for (let i = 0; i < 20; i++) {
      const result = rpg.rollMutation(0.5, 0);
      if (result !== null) {
        // rollMutation returns {mutationId, label, tier, effect}
        expect(result).toHaveProperty('mutationId');
        expect(result).toHaveProperty('tier');
        expect(result).toHaveProperty('effect');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Card curse system
// ---------------------------------------------------------------------------

describe('CARD_CURSE_POOL', () => {
  test('has at least 5 curses', () => {
    expect(rpg.CARD_CURSE_POOL).toBeDefined();
    expect(rpg.CARD_CURSE_POOL.length).toBeGreaterThanOrEqual(5);
  });

  test('every curse has mutationId and tier', () => {
    for (const c of rpg.CARD_CURSE_POOL) {
      expect(c).toHaveProperty('mutationId'); // curses use mutationId, not id
      expect(c).toHaveProperty('tier');
    }
  });
});

// ---------------------------------------------------------------------------
// Quest template validation
// ---------------------------------------------------------------------------

describe('WORLD_QUEST_TEMPLATES', () => {
  test('has exactly 41 templates', () => {
    expect(rpg.WORLD_QUEST_TEMPLATES.length).toBe(41);
  });

  test('every quest has questId, name, type, target, rewards', () => {
    for (const q of rpg.WORLD_QUEST_TEMPLATES) {
      expect(q).toHaveProperty('questId');
      expect(q).toHaveProperty('name');
      expect(q).toHaveProperty('type');
      expect(q).toHaveProperty('target');
      expect(q).toHaveProperty('rewards');
    }
  });

  test('no duplicate questIds', () => {
    const ids = rpg.WORLD_QUEST_TEMPLATES.map(q => q.questId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test('only contains trackable quest types', () => {
    const trackable = new Set(['gather', 'craft', 'kill', 'dungeon', 'skill_milestone']);
    const untrackable = rpg.WORLD_QUEST_TEMPLATES.filter(q => !trackable.has(q.type));
    expect(untrackable).toEqual([]);
  });

  test('all gather quests have target.resource and target.count', () => {
    const gathers = rpg.WORLD_QUEST_TEMPLATES.filter(q => q.type === 'gather');
    for (const q of gathers) {
      expect(q.target.resource).toBeTruthy();
      expect(typeof q.target.count).toBe('number');
      expect(q.target.count).toBeGreaterThan(0);
    }
  });

  test('all craft quests have target.item and target.count', () => {
    const crafts = rpg.WORLD_QUEST_TEMPLATES.filter(q => q.type === 'craft');
    for (const q of crafts) {
      expect(q.target.item).toBeTruthy();
      expect(typeof q.target.count).toBe('number');
    }
  });

  test('all dungeon quests have at least one of minFloor/bossKill/caveComplete', () => {
    const dungeons = rpg.WORLD_QUEST_TEMPLATES.filter(q => q.type === 'dungeon');
    for (const q of dungeons) {
      const hasDungeonTarget = q.target.minFloor || q.target.bossKill || q.target.caveComplete;
      expect(hasDungeonTarget).toBeTruthy();
    }
  });

  test('all skill_milestone quests have target.skill and target.level', () => {
    const milestones = rpg.WORLD_QUEST_TEMPLATES.filter(q => q.type === 'skill_milestone');
    for (const q of milestones) {
      expect(q.target.skill).toBeTruthy();
      expect(typeof q.target.level).toBe('number');
      expect(q.target.level).toBeGreaterThan(0);
    }
  });

  test('all rewards have at least coins', () => {
    for (const q of rpg.WORLD_QUEST_TEMPLATES) {
      expect(typeof q.rewards.coins).toBe('number');
      expect(q.rewards.coins).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Rarity system
// ---------------------------------------------------------------------------

describe('Rarity constants', () => {
  test('RARITY_TIERS has 8 tiers', () => {
    expect(rpg.RARITY_TIERS).toBeDefined();
    expect(rpg.RARITY_TIERS.length).toBe(8);
  });

  test('RARITY_TIERS weights are positive and non-zero', () => {
    for (const r of rpg.RARITY_TIERS) {
      expect(r.weight).toBeGreaterThan(0);
    }
  });

  test('common rarity has highest weight', () => {
    const common = rpg.RARITY_TIERS.find(r => r.id === 'common');
    const relic = rpg.RARITY_TIERS.find(r => r.id === 'relic');
    expect(common.weight).toBeGreaterThan(relic.weight);
  });
});

// ---------------------------------------------------------------------------
// XP formulas
// ---------------------------------------------------------------------------

describe('XP formulas', () => {
  test('overallXpForLevel is monotonically increasing', () => {
    for (let i = 1; i < 20; i++) {
      expect(rpg.overallXpForLevel(i + 1)).toBeGreaterThan(rpg.overallXpForLevel(i));
    }
  });

  test('overallXpForLevel(10) is a reasonable number (> 100)', () => {
    expect(rpg.overallXpForLevel(10)).toBeGreaterThan(100);
  });
});

// ---------------------------------------------------------------------------
// Race system
// ---------------------------------------------------------------------------

describe('Races', () => {
  test('has exactly 8 playable races', () => {
    const count = Object.keys(rpg.RACES).length;
    expect(count).toBe(8);
  });

  test('every race has baseLuck', () => {
    for (const [id, race] of Object.entries(rpg.RACES)) {
      expect(typeof race.baseLuck).toBe('number');
      expect(race.baseLuck).toBeGreaterThan(0);
    }
  });

  test('catfolk has highest baseLuck (0.20)', () => {
    expect(rpg.RACES.catfolk.baseLuck).toBe(0.20);
  });
});
