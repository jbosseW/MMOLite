// tests/regressions.test.js
// Layer 2: Regression tests — lock in specific bugs that were fixed.
// Each test documents the bug and asserts the fixed behavior.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readSrc(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------

describe('Regression: party_kick uses Set methods, not Array methods', () => {
  let src;
  beforeAll(() => { src = readSrc('handlers/party.js'); });

  test('uses party.members.has() not indexOf()', () => {
    expect(src).toMatch(/party\.members\.has\(data\.targetId\)/);
    expect(src).not.toMatch(/party\.members\.indexOf\(/);
  });

  test('uses party.members.delete() not splice()', () => {
    expect(src).toMatch(/party\.members\.delete\(data\.targetId\)/);
    expect(src).not.toMatch(/party\.members\.splice\(/);
  });

  test('uses party.members.size not .length in kick handler', () => {
    // The kick handler dissolution check must use .size
    const kickBlock = src.slice(src.indexOf('party_kick'), src.indexOf('party_chat'));
    expect(kickBlock).toMatch(/party\.members\.size/);
    expect(kickBlock).not.toMatch(/party\.members\.length/);
  });

  test('emits party_updated (not party_update) in kick handler', () => {
    const kickBlock = src.slice(src.indexOf('party_kick'), src.indexOf('party_chat'));
    expect(kickBlock).toMatch(/'party_updated'/);
    expect(kickBlock).not.toMatch(/'party_update'[^d]/);
  });

  test('cleans up playerPartyMap on kick', () => {
    const kickBlock = src.slice(src.indexOf('party_kick'), src.indexOf('party_chat'));
    expect(kickBlock).toMatch(/playerPartyMap.*delete\(data\.targetId\)/);
  });
});

// ---------------------------------------------------------------------------

describe('Regression: cleansCorruption typo fixed to cleanseCorruption', () => {
  test('director-lich.js exports cleanseCorruption (not cleansCorruption)', () => {
    const src = readSrc('director/director-lich.js');
    expect(src).toMatch(/cleanseCorruption/);
    expect(src).not.toMatch(/cleansCorruption/);
  });

  test('dungeon.js calls cleanseCorruption (not cleansCorruption)', () => {
    const src = readSrc('handlers/dungeon.js');
    expect(src).not.toMatch(/cleansCorruption\(/);
  });
});

// ---------------------------------------------------------------------------

describe('Regression: chip atomicity uses accounts.updateChips', () => {
  test('companions.js uses updateChips for hire fee deduction', () => {
    const src = readSrc('handlers/companions.js');
    expect(src).toMatch(/accounts\.updateChips\(/);
    // Should NOT do direct chip subtraction for the hire action
    expect(src).not.toMatch(/account\.chips\s*-=\s*hiringFee/);
  });

  test('prison.js uses updateChips for bail payment', () => {
    const src = readSrc('handlers/prison.js');
    expect(src).toMatch(/accounts\.updateChips\(/);
  });
});

// ---------------------------------------------------------------------------

describe('Regression: rumor faction dedup', () => {
  test('rumor-system.js stores faction1 in vars._faction1 to prevent duplicate', () => {
    const src = readSrc('rumor-system.js');
    expect(src).toMatch(/vars\._faction1/);
  });

  test('faction2 filters out faction1 from pool', () => {
    const src = readSrc('rumor-system.js');
    expect(src).toMatch(/FACTION_NAMES\.filter/);
  });

  // Functional: generate 100 rumors, check no faction1 === faction2
  test('generated rumors never have same faction1 and faction2', () => {
    const { generateTownRumors } = require('../rumor-system');
    let found = false;
    for (let i = 0; i < 50; i++) {
      const rumors = generateTownRumors('test_town_' + i, {});
      for (const r of rumors) {
        if (r.text) {
          const factionMatches = r.text.match(/tension between the ([^,]+?) and ([^.]+?) has been/i);
          if (factionMatches) {
            if (factionMatches[1].trim() === factionMatches[2].trim()) found = true;
          }
        }
      }
    }
    expect(found).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe('Regression: quest kill targets use valid overworld monster IDs', () => {
  test('all kill-type WORLD_QUEST_TEMPLATES target existing OVERWORLD_MONSTERS', () => {
    const rpg = require('../rpg-data');
    const monsters = require('../handlers/monsters');

    const monsterIds = new Set((monsters.OVERWORLD_MONSTERS || []).map(m => m.id));
    const killQuests = rpg.WORLD_QUEST_TEMPLATES.filter(q => q.type === 'kill');

    const broken = killQuests.filter(q => !monsterIds.has(q.target.monster));
    expect(broken).toEqual([]);
  });

  test('no craft-type quest targets an item with no recipe', () => {
    const rpg = require('../rpg-data');
    const crafting = require('../handlers/crafting');

    const recipeOutputs = new Set(
      Object.values(crafting.RECIPES || {}).map(r => r.output && r.output.type).filter(Boolean)
    );

    const craftQuests = rpg.WORLD_QUEST_TEMPLATES.filter(q => q.type === 'craft');
    const broken = craftQuests.filter(q => !recipeOutputs.has(q.target.item));
    expect(broken).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('Regression: party_kicked emitted by kick handler', () => {
  test('party.js emits party_kicked to the kicked socket', () => {
    const src = readSrc('handlers/party.js');
    expect(src).toMatch(/'party_kicked'/);
  });
});

// ---------------------------------------------------------------------------

describe('Regression: dungeon boss kill world quest tracking added', () => {
  test('dungeon.js has world quest bossKill tracking code', () => {
    const src = readSrc('handlers/dungeon.js');
    expect(src).toMatch(/wqbTmpl\.target\.bossKill/);
  });

  test('dungeon.js has world quest caveComplete tracking code', () => {
    const src = readSrc('handlers/dungeon.js');
    expect(src).toMatch(/wqbTmpl\.target\.caveComplete/);
  });

  test('dungeon.js has world quest minFloor tracking code', () => {
    const src = readSrc('handlers/dungeon.js');
    expect(src).toMatch(/wqfTmpl\.target\.minFloor/);
  });
});

// ---------------------------------------------------------------------------

describe('Regression: skill_milestone quest tracking in accounts.js', () => {
  test('accounts.js checks skill_milestone quests after level up', () => {
    const src = readSrc('accounts.js');
    expect(src).toMatch(/skill_milestone/);
    expect(src).toMatch(/_smTmpl\.target\.skill/);
  });
});
