import { describe, expect, it } from 'vitest';
import { adapter } from './index.js';
import { areaById, adjacency, shipNeighbors } from '../data/index.js';
import { navalDestinations } from './helpers.js';
import { base, coastal, fixSupply } from './ships.testHelpers.js';

describe('ships cross a border on any coastline it is wet on (report 0354a3c2)', () => {
  it('sails Sparta → Corinth → Delphi along the Ionian shore', () => {
    const s = base();
    s.areas['sparta'] = { tokens: {}, ships: { egypt: 1 } };
    fixSupply(s); s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const out = adapter.applyAction(s, { type: 'move', moves: [], voyages: [[
      { area: 'sparta' }, { area: 'corinth' }, { area: 'delphi' },
    ]] }, 'egypt');
    expect(out.areas['delphi']!.ships!['egypt']).toBe(1);
    expect(navalDestinations(null, 'sparta', 4, false).has('delphi')).toBe(true);
  });
});

describe('naval range helper', () => {
  it('reaches at least as far with more range, and Astronomy never reduces reach', () => {
    const a = coastal.find((c) => navalDestinations(null, c.id, 4, false).size > 0)!.id;
    const r4 = navalDestinations(null, a, 4, false);
    const r5 = navalDestinations(null, a, 5, false);
    const r4astro = navalDestinations(null, a, 4, true);
    for (const d of r4) expect(r5.has(d)).toBe(true);          // range 5 ⊇ range 4
    for (const d of r4) expect(r4astro.has(d)).toBe(true);     // Astronomy ⊇ no-Astronomy
  });
});

describe('§23.3 islands are all-water — population must embark to leave (issue #1)', () => {
  // Each island group and its members; every off-island land edge must be cut so
  // tokens can only leave by ship. (Owner-confirmed against the board.)
  const ISLANDS: Record<string, string[]> = {
    crete: ['knossos', 'phaestos'], cyprus: ['cyprus', 'salamis'], corsica: ['corsica-2'],
    sardinia: ['sardinia-2', 'carales-2'], mallorca: ['baleares'], ibiza: ['ebusus'],
    britain: ['britannia', 'londinium'], ithaka: ['ithaka'], masirah: ['mazirah'], bahrain: ['tilmun'],
    rhodes: ['rhodes'], thera: ['thera'], lesbos: ['lesbos'], sicily: ['syracus', 'milazzo', 'palermo'],
    euboea: ['chalkis', 'eretria'], lemnos: ['lemnos'],
  };
  it('no island area has a land neighbour outside its own island', () => {
    for (const members of Object.values(ISLANDS)) {
      const set = new Set(members);
      for (const id of members)
        for (const n of adjacency[id] ?? [])
          if (!areaById.get(n)?.isWater && !set.has(n))
            throw new Error(`${id} still walks to off-island land area ${n}`);
    }
  });
  it('the engine offers no on-foot move off Crete or across the Strait of Messina', () => {
    let s = base();
    s.areas['phaestos'] = { tokens: { egypt: 3 } };
    s.areas['syracus'] = { tokens: { egypt: 3 } };
    s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const dests = new Set<string>();
    for (const a of adapter.legalActions(s, 'egypt'))
      if (a.type === 'move') for (const m of (a as { moves: { from: string; to: string }[] }).moves) dests.add(`${m.from}->${m.to}`);
    expect(dests.has('phaestos->argos')).toBe(false);
    expect(dests.has('phaestos->sparta')).toBe(false);
    expect(dests.has('syracus->campania')).toBe(false); // Messina is ship-only
  });
  it('does not walk onto or off Lemnos: an island with water on every border', () => {
    let s = base();
    s.areas['troy'] = { tokens: { egypt: 3 } };
    s.areas['lemnos'] = { tokens: { egypt: 2 } };
    s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const dests = new Set<string>();
    for (const a of adapter.legalActions(s, 'egypt'))
      if (a.type === 'move') for (const m of (a as { moves: { from: string; to: string; byShip?: boolean }[] }).moves)
        if (!m.byShip) dests.add(`${m.from}->${m.to}`);
    expect([...dests].filter((d) => d.includes('lemnos'))).toEqual([]);
    // Every former land link is still a ship crossing.
    for (const n of ['troy', 'thrace', 'thessalonica', 'bycantinum'])
      expect(shipNeighbors.get('lemnos')?.some((h) => h.to === n)).toBe(true);
  });
  it('does not walk onto or off Euboea: Athens/Delphi↔Chalkis/Eretria is water (report d4cb0ffe)', () => {
    let s = base();
    s.areas['athens'] = { tokens: { egypt: 3 } };
    s.areas['delphi'] = { tokens: { egypt: 3 } };
    s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const dests = new Set<string>();
    for (const a of adapter.legalActions(s, 'egypt'))
      if (a.type === 'move') for (const m of (a as { moves: { from: string; to: string }[] }).moves) dests.add(`${m.from}->${m.to}`);
    expect(dests.has('athens->eretria')).toBe(false);
    expect(dests.has('athens->chalkis')).toBe(false);
    expect(dests.has('delphi->chalkis')).toBe(false);
    expect(adjacency['chalkis']).toContain('eretria'); // the island's internal border stays
  });
  it('does not walk Thapsus->Tripoli: their shared border is all water (report 96195bca)', () => {
    // The two meet only out in the gulf — no land boundary — so §23.3 gives no
    // overland move. The land route runs inland through Sabrata.
    expect(adjacency['thapsus']).not.toContain('tripoli');
    expect(adjacency['tripoli']).not.toContain('thapsus');
    expect(adjacency['thapsus']).toContain('sabrata');
    expect(adjacency['sabrata']).toContain('tripoli');
    let s = base();
    s.areas['thapsus'] = { tokens: { egypt: 3 } };
    s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const dests = new Set<string>();
    for (const a of adapter.legalActions(s, 'egypt'))
      if (a.type === 'move') for (const m of (a as { moves: { from: string; to: string; byShip?: boolean }[] }).moves)
        if (!m.byShip) dests.add(`${m.from}->${m.to}`);
    expect(dests.has('thapsus->tripoli')).toBe(false);
    expect(dests.has('thapsus->sabrata')).toBe(true);
  });
});
