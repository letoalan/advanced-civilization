// Typed loader for the static game data extracted from the VASSAL module and
// the rules. All JSON lives alongside this file; these types describe its shape
// and the named exports give the engine typed, validated access.

import areasRaw from './areas.json' with { type: 'json' };
import adjacencyRaw from './adjacency.json' with { type: 'json' };
import advancesRaw from './advances.json' with { type: 'json' };
import commoditiesRaw from './commodities.json' with { type: 'json' };
import calamitiesRaw from './calamities.json' with { type: 'json' };
import civilizationsRaw from './civilizations.json' with { type: 'json' };
import astRaw from './ast.json' with { type: 'json' };
import playAreasRaw from './playAreas.json' with { type: 'json' };

import type {
  Board,
  CropKey,
  PlayAreas,
  Area,
  AdvanceGroup,
  Advance,
  Commodity,
  Calamity,
  Civilization,
  Epoch,
  AstTrack,
  ShipHop,
} from './types.js';

export * from './types.js';
export * from './descriptions.js';
export * from './shipGraph.js';

export const areas: Area[] = areasRaw as Area[];
export const adjacency: Record<string, string[]> = adjacencyRaw as Record<string, string[]>;

export const advances: Advance[] = (advancesRaw as unknown as { advances: Advance[] }).advances;
export const advanceGroups: AdvanceGroup[] = (advancesRaw as unknown as { groups: AdvanceGroup[] }).groups;
export const commodities: Commodity[] = (commoditiesRaw as unknown as { commodities: Commodity[] }).commodities;
export const mineableCommodities: string[] = (commoditiesRaw as { mineableCommodities: string[] }).mineableCommodities;
export const calamities: Calamity[] = (calamitiesRaw as unknown as { calamities: Calamity[] }).calamities;
export const civilizations: Civilization[] = (civilizationsRaw as unknown as { civilizations: Civilization[] }).civilizations;
export const pieceCounts = (civilizationsRaw as { pieceCounts: { tokens: number; cities: number; ships: number } }).pieceCounts;
export const epochs: Epoch[] = (astRaw as { epochs: Epoch[] }).epochs;

export const playAreas: PlayAreas = playAreasRaw as unknown as PlayAreas;
export const astTrack: AstTrack = (astRaw as unknown as { track: AstTrack }).track;
export const astTracksByCiv: Record<string, AstTrack> = (astRaw as unknown as { tracksByCiv: Record<string, AstTrack> }).tracksByCiv ?? {};
export const victoryScoring = (astRaw as { victoryScoring: { pointsPerAstSpace: number; pointsPerCity: number } }).victoryScoring;

/** The AST track a nation uses (per-civ override, else the shared board track). */
export function astTrackFor(civId: string): AstTrack {
  return astTracksByCiv[civId] ?? astTrack;
}

// Indexed lookups.
export const areaById = new Map(areas.map((a) => [a.id, a]));
export const advanceById = new Map(advances.map((a) => [a.id, a]));
export const commodityById = new Map(commodities.map((c) => [c.id, c]));
export const calamityById = new Map(calamities.map((c) => [c.id, c]));
export const civById = new Map(civilizations.map((c) => [c.id, c]));

/** Validate cross-references at load; returns a list of problems (empty = ok). */
export function validateData(): string[] {
  const problems: string[] = [];
  for (const [id, nbrs] of Object.entries(adjacency)) {
    if (!areaById.has(id)) problems.push(`adjacency references unknown area ${id}`);
    for (const n of nbrs) if (!areaById.has(n)) problems.push(`adjacency ${id} -> unknown ${n}`);
  }
  for (const c of civilizations) {
    if (!areaById.has(c.start)) problems.push(`civ ${c.id} start area '${c.start}' not found`);
    if (!c.startAreas.includes(c.start)) problems.push(`civ ${c.id} start '${c.start}' not in startAreas`);
    for (const sa of c.startAreas) {
      const area = areaById.get(sa);
      if (!area) problems.push(`civ ${c.id} startArea '${sa}' not found`);
      else if (!area.startRegion) problems.push(`civ ${c.id} startArea '${sa}' is not a StartRegion zone`);
    }
  }
  for (const a of advances) {
    for (const p of a.prerequisites ?? []) if (!advanceById.has(p)) problems.push(`advance ${a.id} prereq ${p} unknown`);
    for (const card of Object.keys(a.credits.byCard)) if (!advanceById.has(card)) problems.push(`advance ${a.id} credit -> unknown ${card}`);
  }
  // §16 play-area data must reference real areas of the right kind.
  for (const [key, ids] of Object.entries(playAreas.outOfPlay)) {
    for (const id of ids) if (!areaById.has(id)) problems.push(`playAreas.outOfPlay.${key} references unknown area ${id}`);
  }
  for (const [key, ids] of Object.entries(playAreas.suppressedCitySites)) {
    for (const id of ids) if (!areaById.get(id)?.isCitySite) problems.push(`playAreas.suppressedCitySites.${key}: ${id} is not a city site`);
  }
  for (const id of playAreas.islandCitySites) {
    if (!areaById.get(id)?.isCitySite) problems.push(`playAreas.islandCitySites: ${id} is not a city site`);
  }
  // §17.4: every nation has a unique A.S.T. rank forming a 0..n-1 sequence.
  const ranks = civilizations.map((c) => c.astOrder).sort((x, y) => x - y);
  ranks.forEach((r, i) => { if (r !== i) problems.push(`civ astOrder not a 0..n-1 permutation (got ${r} at position ${i})`); });
  return problems;
}
