import { describe, expect, it } from 'vitest';
import { adapter } from './index.js';
import { pieceCounts, areaById, shipNeighbors } from '../data/index.js';
import { navalDestinations, pieceConservationProblems } from './helpers.js';
import type { GameState } from './types.js';
import { base, coastal, fixSupply } from './ships.testHelpers.js';

describe('§23.5 naval movement', () => {
  it('ferries tokens across water and relocates the ship', () => {
    let x = '', y = '';
    for (const a of coastal) {
      const d = navalDestinations(null, a.id, 4, false);
      if (d.size) { x = a.id; y = [...d][0]!; break; }
    }
    expect(x).not.toBe('');
    const s = base();
    s.areas[x] = { tokens: { egypt: 4 }, ships: { egypt: 1 } };
    fixSupply(s);
    s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const out = adapter.applyAction(s, { type: 'move', moves: [{ from: x, to: y, count: 3, byShip: true }] }, 'egypt');
    expect(out.areas[y]!.tokens['egypt']).toBe(3);
    expect(out.areas[x]!.tokens['egypt']).toBe(1);
    expect(out.areas[y]!.ships!['egypt']).toBe(1);
    expect(out.areas[x]!.ships?.['egypt'] ?? 0).toBe(0);
    expect(pieceConservationProblems(out, pieceCounts)).toEqual([]);
  });

  it('rejects a sea move with no ship, over capacity, or out of range', () => {
    let x = '', y = '';
    for (const a of coastal) {
      const d = navalDestinations(null, a.id, 4, false);
      if (d.size) { x = a.id; y = [...d][0]!; break; }
    }
    const s = base();
    s.areas[x] = { tokens: { egypt: 8 } };
    fixSupply(s);
    s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    expect(() => adapter.applyAction(s, { type: 'move', moves: [{ from: x, to: y, count: 3, byShip: true }] }, 'egypt')).toThrow();
    s.areas[x]!.ships = { egypt: 1 };
    expect(() => adapter.applyAction(s, { type: 'move', moves: [{ from: x, to: y, count: 6, byShip: true }] }, 'egypt')).toThrow();
  });

  it('one ship makes one sailing: a second sailing from the same area is rejected (report ce1713db)', () => {
    let x = '', y = '', z = '';
    for (const a of coastal) {
      const d = [...navalDestinations(null, a.id, 4, false)];
      if (d.length >= 2) { x = a.id; y = d[0]!; z = d[1]!; break; }
    }
    expect(x).not.toBe('');
    const s = base();
    s.areas[x] = { tokens: { egypt: 6 }, ships: { egypt: 1 } };
    fixSupply(s);
    s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    expect(() => adapter.applyAction(s, { type: 'move', moves: [
      { from: x, to: y, count: 2, byShip: true },
      { from: x, to: z, count: 2, byShip: true },
    ] }, 'egypt')).toThrow();
    s.areas[x]!.ships = { egypt: 2 };
    fixSupply(s);
    const out = adapter.applyAction(s, { type: 'move', moves: [
      { from: x, to: y, count: 2, byShip: true },
      { from: x, to: z, count: 2, byShip: true },
    ] }, 'egypt');
    expect(out.areas[y]!.ships!['egypt']).toBe(1);
    expect(out.areas[z]!.ships!['egypt']).toBe(1);
    expect(out.areas[x]!.ships?.['egypt'] ?? 0).toBe(0);
    expect(pieceConservationProblems(out, pieceCounts)).toEqual([]);
  });
});

describe('§23.5 ship model: area-to-area voyages (reports 5d177c1b, 2811ba36)', () => {
  function movePhase(s: GameState) { s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = []; }

  it('sails Thapsus->Carthago->Palermo->Milazzo->Campania: 4 areas, legal at range 4 without Astronomy (§23.52, report 5d177c1b)', () => {
    expect(navalDestinations(null, 'thapsus', 4, false).has('campania')).toBe(true);
    const s = base();
    s.areas['thapsus'] = { tokens: { egypt: 4 }, ships: { egypt: 1 } };
    fixSupply(s); movePhase(s);
    const out = adapter.applyAction(s, { type: 'move', moves: [{ from: 'thapsus', to: 'campania', count: 3, byShip: true }] }, 'egypt');
    expect(out.areas['campania']!.tokens['egypt']).toBe(3);
    expect(out.areas['campania']!.ships!['egypt']).toBe(1);
    expect(pieceConservationProblems(out, pieceCounts)).toEqual([]);
  });

  it('ferries two loads across the Carthago|Palermo strait with one ship (§23.56, report 2811ba36)', () => {
    const s = base();
    s.areas['carthago'] = { tokens: { egypt: 8 }, ships: { egypt: 1 } };
    fixSupply(s); movePhase(s);
    const out = adapter.applyAction(s, { type: 'move', moves: [], voyages: [[
      { area: 'carthago', load: 5 }, { area: 'palermo', unload: 5 },
      { area: 'carthago', load: 3 }, { area: 'palermo', unload: 3 },
    ]] }, 'egypt');
    expect(out.areas['palermo']!.tokens['egypt']).toBe(8);
    expect(out.areas['carthago']!.tokens['egypt'] ?? 0).toBe(0);
    expect(out.areas['palermo']!.ships!['egypt']).toBe(1);
    expect(pieceConservationProblems(out, pieceCounts)).toEqual([]);
  });

  it('rejects a voyage that leaves tokens aboard at phase end (§23.56)', () => {
    const s = base();
    s.areas['carthago'] = { tokens: { egypt: 4 }, ships: { egypt: 1 } };
    fixSupply(s); movePhase(s);
    expect(() => adapter.applyAction(s, { type: 'move', moves: [], voyages: [[
      { area: 'carthago', load: 2 }, { area: 'palermo' },
    ]] }, 'egypt')).toThrow(/23\.56/);
  });

  it('a debarked token has moved: it may not board a second ship this phase (§23.56)', () => {
    const s = base();
    s.areas['carthago'] = { tokens: { egypt: 2 }, ships: { egypt: 1 } };
    s.areas['palermo'] = { tokens: {}, ships: { egypt: 1 } };
    fixSupply(s); movePhase(s);
    expect(() => adapter.applyAction(s, { type: 'move', moves: [], voyages: [
      [{ area: 'carthago', load: 2 }, { area: 'palermo', unload: 2 }],
      [{ area: 'palermo', load: 2 }, { area: 'milazzo', unload: 2 }],
    ] }, 'egypt')).toThrow(/23\.5/);
  });

  it('caps cargo at 5 at every moment of the voyage (§23.51)', () => {
    const s = base();
    s.areas['carthago'] = { tokens: { egypt: 3 }, ships: { egypt: 1 } };
    s.areas['palermo'] = { tokens: { egypt: 5 } };
    fixSupply(s); movePhase(s);
    expect(() => adapter.applyAction(s, { type: 'move', moves: [], voyages: [[
      { area: 'carthago', load: 3 }, { area: 'palermo', load: 3 }, { area: 'milazzo', unload: 6 },
    ]] }, 'egypt')).toThrow(/23\.51/);
  });

  it('blocks open sea without Astronomy, and forbids ENDING on open sea even with it (§23.52/.54/.55)', () => {
    const s = base();
    s.areas['phaestos'] = { tokens: { egypt: 1 }, ships: { egypt: 1 } };
    fixSupply(s); movePhase(s);
    expect(() => adapter.applyAction(s, { type: 'move', moves: [], voyages: [[
      { area: 'phaestos' }, { area: 'central-mediterranean' },
    ]] }, 'egypt')).toThrow(/Astronomy|23\.5/);
    s.players['egypt']!.advances.push('astronomy');
    expect(() => adapter.applyAction(s, { type: 'move', moves: [], voyages: [[
      { area: 'phaestos' }, { area: 'central-mediterranean' },
    ]] }, 'egypt')).toThrow(/23\.55/);
  });

  it('the Gulf of Oman / Persia, Red, Black and Caspian Seas are open sea — no crossing without Astronomy (§4.23/§23.54, report 72da16b4)', () => {
    for (const sea of ['gulf-of-oman', 'gulf-of-persia', 'red-sea', 'black-sea', 'caspian-sea']) {
      expect(areaById.get(sea)?.isOpenSea).toBe(true);
    }
    const s = base();
    s.areas['makkan'] = { tokens: { egypt: 1 }, ships: { egypt: 1 } };
    fixSupply(s); movePhase(s);
    expect(() => adapter.applyAction(s, { type: 'move', moves: [], voyages: [[
      { area: 'makkan' }, { area: 'gulf-of-oman' }, { area: 'harmoza' },
    ]] }, 'egypt')).toThrow(/Astronomy|23\.5/);
    const out = adapter.applyAction(s, { type: 'move', moves: [], voyages: [[
      { area: 'makkan', load: 1 }, { area: 'basri' }, { area: 'onitas', unload: 1 },
    ]] }, 'egypt');
    expect(out.areas['onitas']!.tokens['egypt']).toBe(1);
  });

  it('the Aegean and Adriatic are open seas: Astronomy to enter, and no voyage ends there (§23.52/.54/.55)', () => {
    const s = base();
    s.areas['phaestos'] = { tokens: {}, ships: { egypt: 1 } };
    s.areas['tarentum'] = { tokens: {}, ships: { egypt: 1 } };
    fixSupply(s); movePhase(s);
    const sail = (st: GameState, ...areas: string[]) => adapter.applyAction(st, { type: 'move', moves: [], voyages: [areas.map((area) => ({ area }))] }, 'egypt');
    expect(() => sail(s, 'phaestos', 'aegean-sea', 'troy')).toThrow(/Astronomy/);
    expect(() => sail(s, 'tarentum', 'adriatic-sea', 'dalmatia')).toThrow(/Astronomy/);
    expect(navalDestinations(null, 'phaestos', 4, false).has('aegean-sea')).toBe(false);
    expect(navalDestinations(null, 'aegean-sea', 4, false).size).toBeGreaterThan(0);
    expect(navalDestinations(null, 'adriatic-sea', 4, false).size).toBeGreaterThan(0);
    s.players['egypt']!.advances = ['astronomy'];
    expect(() => sail(s, 'phaestos', 'aegean-sea')).toThrow(/§23\.55/);
    const out = sail(s, 'phaestos', 'aegean-sea', 'troy');
    expect(out.areas['troy']!.ships!['egypt']).toBe(1);
    expect(pieceConservationProblems(out, pieceCounts)).toEqual([]);
  });

  it('a two-coastline area must be left by the coastline it was entered (§23.57)', () => {
    let X = '', M = '', Y = '';
    outer: for (const [m, hops] of shipNeighbors) {
      for (const h1 of hops) for (const h2 of hops) {
        if (h1.to === h2.to) continue;
        const inSides = hops.filter((h) => h.to === h1.to).map((h) => h.side);
        const outSides = hops.filter((h) => h.to === h2.to).map((h) => h.side);
        if ([...inSides, ...outSides].every((x) => x != null) && !inSides.some((x) => outSides.includes(x))) { M = m; X = h1.to; Y = h2.to; break outer; }
      }
    }
    expect(M).not.toBe('');
    const s = base();
    s.areas[X] = { tokens: {}, ships: { egypt: 1 } };
    fixSupply(s); movePhase(s);
    expect(() => adapter.applyAction(s, { type: 'move', moves: [], voyages: [[
      { area: X }, { area: M }, { area: Y },
    ]] }, 'egypt')).toThrow(/23\.57/);
  });
});
