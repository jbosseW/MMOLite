const rpgData = require('./rpg-data.js');

const cards = rpgData.CARD_TEMPLATES || [];
const rarities = ['legendary', 'mythic_rare', 'godly', 'relic'];
const legendaries = cards.filter(c => rarities.includes(c.rarity));

const byArch = {};
legendaries.forEach(card => {
  const arch = card.archetype || 'unknown';
  if (!byArch[arch]) byArch[arch] = [];
  byArch[arch].push(card);
});

Object.keys(byArch).sort().forEach(arch => {
  console.log('\n' + '='.repeat(120));
  console.log('ARCHETYPE: ' + arch + ' (' + byArch[arch].length + ' cards)');
  console.log('='.repeat(120));
  
  // Sort by rarity (relic > godly > mythic_rare > legendary) then by name
  const rarityOrder = { relic: 0, godly: 1, mythic_rare: 2, legendary: 3 };
  byArch[arch].sort((a, b) => {
    if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    }
    return a.name.localeCompare(b.name);
  });
  
  byArch[arch].forEach(card => {
    console.log('\n> ' + card.name + ' [' + card.rarity.toUpperCase() + ']');
    console.log('  CardId: ' + card.cardId);
    console.log('  Type: ' + card.type);
    if (card.archetypeSecondary && card.archetypeSecondary.length > 0) {
      console.log('  Secondary Archetypes: ' + card.archetypeSecondary.join(', '));
    }
    if (card.combatType) {
      console.log('  Combat Type: ' + card.combatType);
    }
    console.log('  Effects:');
    card.effects.forEach(eff => {
      const str = JSON.stringify(eff)
        .replace(/,/g, ', ')
        .replace(/{/g, '{ ')
        .replace(/}/g, ' }');
      console.log('    ' + str);
    });
  });
});
