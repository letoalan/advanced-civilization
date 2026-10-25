import fs from 'node:fs';

const areas = JSON.parse(fs.readFileSync('src/data/areas.json', 'utf8'));
const territories = JSON.parse(fs.readFileSync('src/data/territories.json', 'utf8'));
const coastlines = JSON.parse(fs.readFileSync('src/data/coastlines.json', 'utf8'));
const playAreas = JSON.parse(fs.readFileSync('src/data/playAreas.json', 'utf8'));
const adjacency = JSON.parse(fs.readFileSync('src/data/adjacency.json', 'utf8'));
const waterGraph = JSON.parse(fs.readFileSync('src/data/water-graph.json', 'utf8'));
const shipEdges = JSON.parse(fs.readFileSync('src/data/ship-edges.json', 'utf8'));

console.log('=== AUDIT DES DONNÉES (LECTURE SEULE) ===');

// 1. areas.json
console.log('\n--- src/data/areas.json ---');
console.log('Total areas:', areas.length);
const coastalWater = areas.filter(a => a.coastalWater);
const playable = areas.filter(a => !a.coastalWater);
console.log('Playable areas (drawn/clickable):', playable.length);
console.log('Coastal water plumbing areas:', coastalWater.length);

const byBoard = {};
for (const a of areas) {
  byBoard[a.board] = (byBoard[a.board] || 0) + 1;
}
console.log('Areas by board panel:', byBoard);

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
let totalVertices = 0;
for (const a of areas) {
  for (const [x, y] of a.path) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    totalVertices++;
  }
}
console.log(`Bounding box: X=[${minX.toFixed(1)}, ${maxX.toFixed(1)}], Y=[${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
console.log('Total vertices:', totalVertices);
console.log('City sites:', areas.filter(a => a.isCitySite).length);
console.log('Volcano sites:', areas.filter(a => a.isVolcanoSite).length);
console.log('Floodplains:', areas.filter(a => a.isFloodplain).length);

// 2. territories.json
console.log('\n--- src/data/territories.json ---');
console.log('Image dimensions:', territories.image);
console.log('Total regions count:', territories.count, 'actual length:', territories.regions.length);
const byCat = {};
let withHoles = 0;
let totalHoles = 0;
for (const r of territories.regions) {
  byCat[r.category || 'unset'] = (byCat[r.category || 'unset'] || 0) + 1;
  if (r.holes && r.holes.length > 0) {
    withHoles++;
    totalHoles += r.holes.length;
  }
}
console.log('Regions by category:', byCat);
console.log(`Regions with inner holes: ${withHoles} (total holes: ${totalHoles})`);

// 3. coastlines.json
console.log('\n--- src/data/coastlines.json ---');
console.log('Coastlines territories count:', coastlines.territories.length);
let totalSubs = 0;
let seaSubs = 0;
let landSubs = 0;
let splitTerritories = 0;
for (const t of coastlines.territories) {
  totalSubs += t.sub.length;
  if (t.sub.length >= 2) splitTerritories++;
  for (const s of t.sub) {
    if (s.kind === 'sea') seaSubs++;
    if (s.kind === 'land') landSubs++;
  }
}
console.log(`Total sub-areas: ${totalSubs} (land: ${landSubs}, sea: ${seaSubs})`);
console.log(`Territories split into land + sea: ${splitTerritories}`);

// 4. playAreas.json
console.log('\n--- src/data/playAreas.json ---');
console.log('Out of play crops keys:', Object.keys(playAreas.outOfPlay || {}));
console.log('Cover polygons keys:', Object.keys(playAreas.coverPolygons || {}));

// 5. Adjacency & graphs
console.log('\n--- Graphes logiques ---');
console.log('Adjacency keys (nodes):', Object.keys(adjacency).length);
console.log('Water graph keys:', Object.keys(waterGraph).length);
console.log('Ship edges count:', Array.isArray(shipEdges) ? shipEdges.length : Object.keys(shipEdges).length);
