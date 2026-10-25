import fs from 'node:fs';

const ref = JSON.parse(fs.readFileSync('docs/board-geometry-reference.json', 'utf8'));

// Dictionnaire des 16 points homologues
const GCP_DATA = [
  // --- 10 POINTS D'AJUSTEMENT (FITTING) ---
  { id: 'baetica', name: 'Baetica / Gibraltar', type: 'fit', realLng: -5.35, realLat: 36.14, region: 'Ouest' },
  { id: 'roma', name: 'Roma', type: 'fit', realLng: 12.48, realLat: 41.89, region: 'Centre' },
  { id: 'syracus', name: 'Syracus (Sicile)', type: 'fit', realLng: 15.28, realLat: 37.07, region: 'Centre' },
  { id: 'carthago', name: 'Carthago (Tunisie)', type: 'fit', realLng: 10.33, realLat: 36.85, region: 'Ouest' },
  { id: 'sparta', name: 'Sparta (Péloponnèse)', type: 'fit', realLng: 22.43, realLat: 37.07, region: 'Centre' },
  { id: 'bycantinum', name: 'Bycantinum (Bosphore)', type: 'fit', realLng: 28.98, realLat: 41.01, region: 'Centre' },
  { id: 'alexandria', name: 'Alexandria (Nil)', type: 'fit', realLng: 29.92, realLat: 31.20, region: 'Centre' },
  { id: 'babylon', name: 'Babylon (Irak)', type: 'fit', realLng: 44.42, realLat: 32.54, region: 'Est' },
  { id: 'banda-abbas', name: 'Banda-Abbas (Ormuz)', type: 'fit', realLng: 56.28, realLat: 27.18, region: 'Est' },
  { id: 'karachi', name: 'Karachi (Indus)', type: 'fit', realLng: 67.01, realLat: 24.86, region: 'Est' },

  // --- 6 POINTS DE CONTRÔLE INDÉPENDANTS (TEST) ---
  { id: 'lusitania', name: 'Lusitania (Lisbonne)', type: 'test', realLng: -9.14, realLat: 38.72, region: 'Ouest' },
  { id: 'massilia', name: 'Massilia (Marseille)', type: 'test', realLng: 5.37, realLat: 43.30, region: 'Ouest' },
  { id: 'knossos', name: 'Knossos (Crète)', type: 'test', realLng: 25.16, realLat: 35.30, region: 'Centre' },
  { id: 'crimea', name: 'Crimea (Crimée)', type: 'test', realLng: 34.10, realLat: 44.50, region: 'Centre' },
  { id: 'sinai', name: 'Sinai (Mer Rouge)', type: 'test', realLng: 34.00, realLat: 28.50, region: 'Centre' },
  { id: 'susa', name: 'Susa (Iran)', type: 'test', realLng: 48.24, realLat: 32.19, region: 'Est' }
];

// Enrichir avec les coordonnées pixel réelles
const points = GCP_DATA.map(g => {
  const cell = ref.cells.find(c => c.areaId === g.id);
  if (!cell) throw new Error(`Cellule introuvable pour ${g.id}`);
  return {
    ...g,
    px: cell.anchor.x,
    py: cell.anchor.y
  };
});

// Distance géodésique en km (formule de Haversine)
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Moindres carrés pour transformation affine : Lng = a*px + b*py + c, Lat = d*px + e*py + f
function solveAffine(fitPoints) {
  // Matrice normale 3x3 pour [a, b, c]
  let sxx = 0, syy = 0, sxy = 0, sx = 0, sy = 0, n = fitPoints.length;
  let sx_lng = 0, sy_lng = 0, s_lng = 0;
  let sx_lat = 0, sy_lat = 0, s_lat = 0;

  for (const p of fitPoints) {
    sxx += p.px * p.px;
    syy += p.py * p.py;
    sxy += p.px * p.py;
    sx += p.px;
    sy += p.py;
    sx_lng += p.px * p.realLng;
    sy_lng += p.py * p.realLng;
    s_lng += p.realLng;
    sx_lat += p.px * p.realLat;
    sy_lat += p.py * p.realLat;
    s_lat += p.realLat;
  }

  // Résolution simple par pivot de Gauss 3x3
  function solve3x3(A, B) {
    const M = [
      [A[0][0], A[0][1], A[0][2], B[0]],
      [A[1][0], A[1][1], A[1][2], B[1]],
      [A[2][0], A[2][1], A[2][2], B[2]]
    ];
    for (let i = 0; i < 3; i++) {
      let maxRow = i;
      for (let k = i + 1; k < 3; k++) {
        if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
      }
      [M[i], M[maxRow]] = [M[maxRow], M[i]];
      const pivot = M[i][i];
      for (let j = i; j < 4; j++) M[i][j] /= pivot;
      for (let k = 0; k < 3; k++) {
        if (k !== i) {
          const factor = M[k][i];
          for (let j = i; j < 4; j++) M[k][j] -= factor * M[i][j];
        }
      }
    }
    return [M[0][3], M[1][3], M[2][3]];
  }

  const ATA = [
    [sxx, sxy, sx],
    [sxy, syy, sy],
    [sx, sy, n]
  ];

  const [a, b, c] = solve3x3(ATA, [sx_lng, sy_lng, s_lng]);
  const [d, e, f] = solve3x3(ATA, [sx_lat, sy_lat, s_lat]);

  return { a, b, c, d, e, f };
}

const fitPts = points.filter(p => p.type === 'fit');
const testPts = points.filter(p => p.type === 'test');

const affine = solveAffine(fitPts);
console.log('=== PARAMÈTRES DE LA TRANSFORMATION AFFINE GLOBALE ===');
console.log(`Lng = (${affine.a.toFixed(6)}) * px + (${affine.b.toFixed(6)}) * py + (${affine.c.toFixed(4)})`);
console.log(`Lat = (${affine.d.toFixed(6)}) * px + (${affine.e.toFixed(6)}) * py + (${affine.f.toFixed(4)})`);

// Évaluation des écarts
console.log('\n=== RÉSULTATS PAR POINT (ÉCART EN KM ET EN PIXELS) ===');
let sumSqKmFit = 0, sumSqKmTest = 0;
const regionErrors = { Ouest: [], Centre: [], Est: [] };

for (const p of points) {
  const predLng = affine.a * p.px + affine.b * p.py + affine.c;
  const predLat = affine.d * p.px + affine.e * p.py + affine.f;
  const distKm = haversineKm(p.realLat, p.realLng, predLat, predLng);

  // Équivalent pixel approximatif : la largeur de 3800px couvre ~76° de longitude (~0.02°/px, ~1.8km/px)
  const dLng = Math.abs(predLng - p.realLng);
  const dLat = Math.abs(predLat - p.realLat);
  const errPx = Math.sqrt(Math.pow(dLng / 0.020, 2) + Math.pow(dLat / 0.020, 2));

  regionErrors[p.region].push(distKm);
  if (p.type === 'fit') sumSqKmFit += distKm * distKm;
  else sumSqKmTest += distKm * distKm;

  console.log(`[${p.type.toUpperCase()}] ${p.name.padEnd(24)}: Erreur = ${distKm.toFixed(0).padStart(4)} km (${errPx.toFixed(1).padStart(5)} px) [Région: ${p.region}]`);
}

const rmseFit = Math.sqrt(sumSqKmFit / fitPts.length);
const rmseTest = Math.sqrt(sumSqKmTest / testPts.length);

console.log('\n=== BILAN STATISTIQUE DES ERREURS ===');
console.log(`RMSE sur les 10 points d'ajustement : ${rmseFit.toFixed(1)} km (~${(rmseFit / 1.8).toFixed(0)} pixels de plateau)`);
console.log(`RMSE sur les 6 points de contrôle : ${rmseTest.toFixed(1)} km (~${(rmseTest / 1.8).toFixed(0)} pixels de plateau)`);

for (const [r, errs] of Object.entries(regionErrors)) {
  const avg = errs.reduce((a, b) => a + b, 0) / errs.length;
  const max = Math.max(...errs);
  console.log(`Région ${r.padEnd(7)} : Erreur moyenne = ${avg.toFixed(0).padStart(4)} km, Erreur Max = ${max.toFixed(0).padStart(4)} km`);
}
