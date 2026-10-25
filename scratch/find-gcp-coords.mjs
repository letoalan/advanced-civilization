import fs from 'node:fs';

const ref = JSON.parse(fs.readFileSync('docs/board-geometry-reference.json', 'utf8'));

const targetIds = [
  'calpe', 'tangier', 'baetica', 'lusitania',
  'massilia', 'provincia',
  'carthage', 'tunisia-2',
  'rome', 'etruria-2',
  'messina', 'sicilia',
  'sparta', 'athens',
  'knossos', 'crete',
  'byzantium', 'thrace',
  'salamis', 'cyprus',
  'alexandria', 'delta', 'thebes',
  'sinai',
  'babylon', 'sumer', 'ur', 'chaldea',
  'hormuz', 'carmania',
  'karachi', 'chanhu-daro'
];

console.log('=== COORDONNÉES DES POINTS CANDIDATS ===');
for (const id of targetIds) {
  const cell = ref.cells.find(c => c.areaId === id);
  if (cell) {
    console.log(`${id.padEnd(14)} : anchor=(${cell.anchor.x.toFixed(1)}, ${cell.anchor.y.toFixed(1)}) r=${cell.anchor.r} panel=${cell.panel}`);
  } else {
    console.log(`${id.padEnd(14)} : [NON TROUVÉ]`);
  }
}
