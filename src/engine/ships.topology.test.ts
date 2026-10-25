import { describe, expect, it } from 'vitest';
import { adapter, normalize } from './index.js';
import { pieceCounts, areaById, adjacency, shipNeighbors } from '../data/index.js';
import { navalDestinations, pieceConservationProblems } from './helpers.js';
import { base, fixSupply, isCoastal } from './ships.testHelpers.js';

describe('map geometry from the 2026-09-24 report queue', () => {
  it('§23.57 applies only in Greece: a ship rounds the toe of Italy through Campania (report de91eafe)', () => {
    const s = base();
    s.areas['tarentum'] = { tokens: {}, ships: { egypt: 1 } };
    fixSupply(s); s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const out = adapter.applyAction(s, { type: 'move', moves: [], voyages: [[
      { area: 'tarentum' }, { area: 'campania' }, { area: 'neapolis' },
    ]] }, 'egypt');
    expect(out.areas['neapolis']!.ships!['egypt']).toBe(1);
  });
  it('Babylonia touches the Gulf inlet, so it is coastal and can launch ships (report c9e6e49b)', () => {
    expect(isCoastal('babylonia')).toBe(true);
    expect(navalDestinations(null, 'babylonia', 4, false).has('ur')).toBe(true);
  });
  it('areas meeting only at a four-corner point are not adjacent (report fe47506e)', () => {
    expect(adjacency['gulashkird']).not.toContain('pasagardes');
    expect(adjacency['pasagardes']).not.toContain('gulashkird');
    expect(adjacency['carmania']).not.toContain('kerman');
    expect(adjacency['gulashkird']).toContain('carmania'); // real borders stay
    expect(adjacency['pasagardes']).toContain('kerman');
  });
});

describe('map data from the 2026-09-27 report queue', () => {
  it('Crimea and Kuban are split by the Kerch Strait: ship-only, no overland move (report c5f03706)', () => {
    expect(adjacency['crimea']).not.toContain('kuban');
    expect(adjacency['kuban']).not.toContain('crimea');
    expect(shipNeighbors.get('crimea')?.some((h) => h.to === 'kuban')).toBe(true); // ships still cross
    let s = base();
    s.areas['crimea'] = { tokens: { egypt: 3 } };
    s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const dests = new Set<string>();
    for (const a of adapter.legalActions(s, 'egypt'))
      if (a.type === 'move') for (const m of (a as { moves: { from: string; to: string; byShip?: boolean }[] }).moves)
        if (!m.byShip) dests.add(`${m.from}->${m.to}`);
    expect(dests.has('crimea->kuban')).toBe(false);
    expect(dests.has('crimea->scythia')).toBe(true); // the isthmus is still land
  });
  it('a ship sails straight from Troy to Sardes: their border runs through water to the coast (§4.33, report 27521e2c)', () => {
    expect(shipNeighbors.get('troy')?.some((h) => h.to === 'sardes')).toBe(true);
    expect(navalDestinations(null, 'troy', 1, false).has('sardes')).toBe(true); // one hop, not via Lesbos
  });
  it('population limits match the printed board (report 68e55bcc + full audit)', () => {
    expect(areaById.get('west-mauretania')!.sustains).toBe(2);
    expect(areaById.get('siwa')!.sustains).toBe(1);
  });
});

describe('whole-map land-link audit against the board art (2026-09-28)', () => {
  const STRAITS: [string, string][] = [
    ['appolonia', 'tarentum'], ['belgica', 'lugdunensis'], ['crimea', 'danube'],
    ['caucasus', 'media'], ['antiochia', 'galatia'], ['banda-abbas', 'ummannar'],
  ];
  it('straits and gulfs are water: no overland step across, but ships still cross', () => {
    for (const [a, b] of STRAITS) {
      expect(adjacency[a], `${a} walks to ${b}`).not.toContain(b);
      expect(shipNeighbors.get(a)?.some((h) => h.to === b), `${a}->${b} ship crossing`).toBe(true);
    }
  });
  it('Lesser Armenia|Niniveh is a lake crossing: ship-only, and Niniveh now has a shore to build on', () => {
    expect(adjacency['lesser-armenia']).not.toContain('niniveh');
    expect(adjacency['niniveh']).not.toContain('lesser-armenia');
    expect(adjacency['niniveh']).toContain('niniveh#sea2'); // its traced lake shore
    expect(navalDestinations(null, 'lesser-armenia', 1, false).has('niniveh')).toBe(true);
    expect(navalDestinations(null, 'niniveh', 1, false).has('lesser-armenia')).toBe(true);
    let s = base();
    s.areas['niniveh'] = { tokens: { egypt: 3 } };
    fixSupply(s); s.players['egypt']!.stock -= 5; s.players['egypt']!.treasury = 5;
    s.phase = 'census'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    normalize(s);
    while (adapter.currentActor(s) !== 'egypt') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    s = adapter.applyAction(s, { type: 'buildShips', builds: [{ area: 'niniveh', count: 1, payFrom: 'treasury' }] }, 'egypt');
    expect(s.areas['niniveh']!.ships?.['egypt']).toBe(1);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });
  it('the whole lake is navigable: Armenia and Elam have shores on it too', () => {
    // Their borders with Lesser Armenia and Niniveh continue overland, so they stay
    // land neighbours — and are now also one hop apart by ship across the lake.
    for (const [a, b] of [['armenia', 'lesser-armenia'], ['armenia', 'niniveh'], ['elam', 'lesser-armenia'], ['elam', 'niniveh']] as [string, string][]) {
      expect(adjacency[a], `${a}|${b} land`).toContain(b);
      expect(navalDestinations(null, a, 1, false).has(b), `${a}->${b} by ship`).toBe(true);
    }
    expect(adjacency['armenia']).toContain('armenia#sea2');
    expect(adjacency['elam']).toContain('elam#sea2');
    // Armenia and Elam sit at opposite ends: two lake hops, not one.
    expect(navalDestinations(null, 'armenia', 1, false).has('elam')).toBe(false);
    expect(navalDestinations(null, 'armenia', 2, false).has('elam')).toBe(true);
  });
  it('Europe is its own landmass: Gibraltar, the Dardanelles and the Sea of Azov are one ship hop each', () => {
    const reach = (from: string) => {
      const seen = new Set<string>([from]); const queue = [from];
      while (queue.length) for (const n of adjacency[queue.shift()!] ?? []) if (!areaById.get(n)?.isWater && !seen.has(n)) { seen.add(n); queue.push(n); }
      return seen;
    };
    const europe = reach('roma');
    for (const a of ['baetica', 'scythia', 'bycantinum', 'corduba']) expect(europe.has(a), a).toBe(true);
    for (const a of ['thebes', 'babylonia', 'chanhu-daro', 'troy', 'kuban', 'west-mauretania']) expect(europe.has(a), a).toBe(false);
    // Asia and Africa remain joined overland (via Sinai).
    expect(reach('thebes').has('babylonia')).toBe(true);
    for (const [a, b] of [['corduba', 'west-mauretania'], ['bycantinum', 'troy'], ['kuban', 'scythia']] as [string, string][]) {
      expect(adjacency[a]).not.toContain(b);
      expect(navalDestinations(null, a, 1, false).has(b), `${a}->${b} by ship`).toBe(true);
    }
  });
});

describe('corner sweep: areas meeting only at a point are not neighbours (§4.31, 2026-09-28)', () => {
  const CORNERS: [string, string][] = [
    ['al-gharbia', 'ash-sharqija'], ['abu-dhabi', 'bat'], ['ash-sharqija', 'ummannar'], ['ash-sharqija', 'hadramaut'],
    ['moscha', 'rub-al-khali'], ['al-wusta', 'ash-sharqija'], ['arabia', 'mana'], ['gerrha', 'rub-al-khali'],
    ['artacona', 'randamar'], ['carmania', 'nurabad'], ['carmania', 'persepolis'], ['kurangan', 'pasagardes'],
    ['harmoza', 'pura'], ['gulashkird', 'megan'], ['lyan', 'shiraz'], ['nurabad', 'parsian'], ['harmoza', 'ummannar'],
  ];
  it('no overland step across a four-corner point', () => {
    for (const [a, b] of CORNERS) { expect(adjacency[a], `${a}|${b}`).not.toContain(b); expect(adjacency[b], `${b}|${a}`).not.toContain(a); }
  });
  it('no ship (or Barbarian) hop through a corner at sea or a traced sliver', () => {
    for (const [a, b] of [['al-wusta', 'mazirah'], ['harmoza', 'ummannar'], ['dalmatia', 'germania-2']] as [string, string][])
      expect(shipNeighbors.get(a)?.some((h) => h.to === b), `${a}->${b}`).toBeFalsy();
  });
  it('the Mesopotamian delta channels are rivers: borders along them stay land borders (owner ruling)', () => {
    for (const [a, b] of [['chaldaea', 'susa'], ['susa', 'ur'], ['chaldaea', 'ur']] as [string, string][])
      expect(adjacency[a], `${a}|${b}`).toContain(b);
  });
  it('...but they stay navigable to the Gulf: Ur and Babylonia remain ports (owner ruling)', () => {
    for (const port of ['ur', 'babylonia']) expect(navalDestinations(null, port, 4, false).size, port).toBeGreaterThan(0);
    expect(shipNeighbors.get('ur')?.some((h) => h.to === 'susa')).toBe(true); // up the channel to the Gulf coast
  });
  it('short real borders the sweep checked are kept', () => {
    // Two junctions joined by a short border segment — not a corner.
    for (const [a, b] of [['athens', 'corinth'], ['aracosta', 'basri'], ['herat', 'prophtasia'], ['aria', 'herat'], ['illyricum', 'pannonia-2'], ['chaldaea', 'sumeria']] as [string, string][])
      expect(adjacency[a], `${a}|${b}`).toContain(b);
  });
});
