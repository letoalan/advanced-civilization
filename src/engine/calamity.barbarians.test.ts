import { describe, expect, it } from 'vitest';
import { adapter } from './index.js';
import { civById, adjacency, areaById, pieceCounts } from '../data/index.js';
import { cityCount, pieceConservationProblems, populationCount } from './helpers.js';
import { scenario, resolve } from './calamity.testHelpers.js';

describe('§30.52 Barbarian Hordes', () => {
  it('lands in a start area, breaks the defenders and razes the city', () => {
    const start = civById.get('egypt')!.start; // barbarians land in a start area
    let s = scenario({
      tokens: { egypt: { [start]: 3 } },
      cities: { egypt: [start] },
      hands: { egypt: { 'calamity:barbarianhordes': 1 } },
    });
    expect(cityCount(s, 'egypt')).toBe(1);
    s = resolve(s);
    expect(cityCount(s, 'egypt')).toBe(0); // 15-horde overwhelms 3 defenders, razes the city
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('Crete is immune as the primary victim', () => {
    const start = civById.get('crete')!.start;
    let s = scenario({
      players: ['crete', 'babylon'],
      tokens: { crete: { [start]: 12 } },
      hands: { crete: { 'calamity:barbarianhordes': 1 } },
    });
    s = resolve(s);
    expect(populationCount(s, 'crete')).toBe(12); // untouched
  });

  it('an exact placement-damage tie is broken by the §30.5251 chooser', () => {
    // egypt has equal token strength in two of its start areas ⇒ a tie.
    let s = scenario({
      tokens: { egypt: { thebes: 3, 'upper-egypt': 3 } },
      hands: { egypt: { 'calamity:barbarianhordes': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingPick?.stage).toBe('barbarian');
    expect(s.pendingPick?.march?.here).toBeNull(); // initial placement choice
    expect(new Set(s.pendingPick?.candidates)).toEqual(new Set(['thebes', 'upper-egypt']));
    // No trader ⇒ the player with the most stock chooses; babylon (nothing on board) leads.
    expect(adapter.currentActor(s)).toBe('babylon');
    s = adapter.applyAction(s, { type: 'pickAreas', areas: ['thebes'] }, 'babylon');
    expect(populationCount(s, 'egypt')).toBeLessThan(6); // the horde landed and fought
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('cross a water boundary to reach the victim, but never enter the sea (§30.5233)', () => {
    // Africa's only units: one token in Tunisia (a start area, so the horde lands
    // there) and one in Palermo on Sicily, which is cut off from Africa by water —
    // Carthago|Palermo is a border drawn through the sea. Overland Palermo is
    // unreachable; across that water boundary it is the one place left to hurt Africa.
    let s = scenario({
      players: ['africa', 'babylon'],
      tokens: { africa: { 'tunisia-2': 1, palermo: 1 } },
      hands: { africa: { 'calamity:barbarianhordes': 1 } },
    });
    s = resolve(s);
    const marches = s.log.filter((e) => e.kind === 'calamity.barbarians.march').map((e) => e.payload as { from: string; to: string });
    expect(marches.at(-1)).toMatchObject({ from: 'carthago', to: 'palermo' });
    expect(populationCount(s, 'africa')).toBe(0);
    expect(s.areas['palermo']?.tokens['__barbarian__']).toBe(2); // settled at Palermo's limit
    // Barbarians only ever stand in land areas.
    for (const [aid, a] of Object.entries(s.areas)) if (areaById.get(aid)?.isWater) expect(a.tokens['__barbarian__'] ?? 0).toBe(0);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('a Hordes card the victim drew and kept is untraded — the victim does not break the tie (report 982d311f)', () => {
    // Drawing a calamity records the drawer in calamityTradedFrom, so a card that
    // was never traded names its own holder there.
    let s = scenario({
      tokens: { egypt: { thebes: 3, 'upper-egypt': 3 } },
      hands: { egypt: { 'calamity:barbarianhordes': 1 } },
      tradedFrom: { barbarianhordes: 'egypt' },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingPick?.stage).toBe('barbarian');
    expect(adapter.currentActor(s)).toBe('babylon'); // most units in stock, not egypt
  });
});

describe('§30.523 Barbarian march', () => {
  it('marches surplus barbarians into an adjacent area with the victim\'s units', () => {
    const start = civById.get('egypt')!.start;
    const nbr = (adjacency[start] ?? []).find((n) => !areaById.get(n)?.isWater)!;
    let s = scenario({
      tokens: { egypt: { [start]: 2, [nbr]: 2 } },
      hands: { egypt: { 'calamity:barbarianhordes': 1 } },
    });
    s = resolve(s);
    // The horde overran the start area and marched on into the neighbour.
    expect(populationCount(s, 'egypt')).toBeLessThan(4);
    expect(s.areas[nbr]!.tokens['egypt'] ?? 0).toBe(0);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });
});

describe('§30.5241 Barbarians head for the victim', () => {
  it('march through empty areas toward the nearest victim units, then settle within the limit', () => {
    const start = civById.get('egypt')!.start;
    // An area exactly two land steps from the start area.
    const one = new Set((adjacency[start] ?? []).filter((n) => !areaById.get(n)?.isWater));
    const two = [...one].flatMap((n) => (adjacency[n] ?? []).filter((m) => !areaById.get(m)?.isWater && m !== start && !one.has(m)))[0]!;
    let s = scenario({ tokens: { egypt: { [two]: 2 } }, hands: { egypt: { 'calamity:barbarianhordes': 1 } } });
    s = resolve(s);
    expect(s.areas[two]?.tokens['egypt'] ?? 0).toBe(0); // the horde reached them
    for (const [aid, a] of Object.entries(s.areas)) expect(a.tokens['__barbarian__'] ?? 0).toBeLessThanOrEqual(areaById.get(aid)!.sustains);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });
});
