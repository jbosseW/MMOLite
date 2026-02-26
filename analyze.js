const rpgData = require('./rpg-data.js');

const cards = rpgData.CARD_TEMPLATES || [];
const rarities = ['legendary', 'mythic_rare', 'godly', 'relic'];
const legendaries = cards.filter(c => rarities.includes(c.rarity));

const byArch = {};
const rarityCount = { legendary: 0, mythic_rare: 0, godly: 0, relic: 0 };

legendaries.forEach(card => {
  const arch = card.archetype || 'unknown';
  if (!byArch[arch]) byArch[arch] = { legendary: 0, mythic_rare: 0, godly: 0, relic: 0, cards: [] };
  byArch[arch][card.rarity]++;
  byArch[arch].cards.push(card);
  rarityCount[card.rarity]++;
});

console.log('LEGENDARY+ CARDS SUMMARY');
console.log('========================\n');
console.log('Rarity Distribution:');
console.log('  Legendary: ' + rarityCount.legendary);
console.log('  Mythic Rare: ' + rarityCount.mythic_rare);
console.log('  Godly: ' + rarityCount.godly);
console.log('  Relic: ' + rarityCount.relic);
console.log('  TOTAL: ' + legendaries.length + '\n');

console.log('Archetype Breakdown:');
const archs = Object.keys(byArch).sort();
archs.forEach(arch => {
  const counts = byArch[arch];
  let summary = '  ' + arch + ': ' + counts.cards.length;
  const parts = [];
  if (counts.legendary > 0) parts.push('L:' + counts.legendary);
  if (counts.mythic_rare > 0) parts.push('M:' + counts.mythic_rare);
  if (counts.godly > 0) parts.push('G:' + counts.godly);
  if (counts.relic > 0) parts.push('R:' + counts.relic);
  console.log(summary + ' (' + parts.join(', ') + ')');
});

console.log('\n\nARCHETYPES WITH UNDERREPRESENTATION (<3 cards):');
archs.forEach(arch => {
  if (byArch[arch].cards.length < 3) {
    console.log('  - ' + arch + ': ' + byArch[arch].cards.length + ' cards');
    byArch[arch].cards.forEach(c => {
      console.log('    * ' + c.name + ' (' + c.rarity + ')');
    });
  }
});
