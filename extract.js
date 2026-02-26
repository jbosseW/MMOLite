const rpgData = require('./rpg-data.js');

const cards = rpgData.CARD_TEMPLATES || [];
const rarities = ['legendary', 'mythic_rare', 'godly', 'relic'];
const legendaries = cards.filter(c => rarities.includes(c.rarity));

console.log('Total legendary+ cards:', legendaries.length);

const byArch = {};
legendaries.forEach(card => {
  const arch = card.archetype || 'unknown';
  if (!byArch[arch]) byArch[arch] = [];
  byArch[arch].push(card);
});

Object.keys(byArch).sort().forEach(arch => {
  console.log('\n' + '='.repeat(100));
  console.log('ARCHETYPE: ' + arch + ' (' + byArch[arch].length + ' cards)');
  console.log('='.repeat(100));
  
  byArch[arch].forEach(card => {
    console.log('\nCardId: ' + card.cardId);
    console.log('  Name: ' + card.name);
    console.log('  Type: ' + card.type);
    console.log('  Rarity: ' + card.rarity);
    if (card.archetypeSecondary) console.log('  Secondary: ' + JSON.stringify(card.archetypeSecondary));
    if (card.combatType) console.log('  CombatType: ' + card.combatType);
    console.log('  Effects:');
    card.effects.forEach(eff => {
      console.log('    - ' + JSON.stringify(eff));
    });
  });
});
