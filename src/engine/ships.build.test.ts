import { describe, expect, it } from 'vitest';
import { adapter, normalize } from './index.js';
import { pieceCounts } from '../data/index.js';
import { pieceConservationProblems } from './helpers.js';
import { base, coastal, fixSupply } from './ships.testHelpers.js';

describe('§22 ship construction', () => {
  it('builds a ship for 2 tokens (returned to stock), conserving the supply', () => {
    const s = base();
    const x = coastal[0]!.id;
    s.areas[x] = { tokens: { egypt: 5 } };
    fixSupply(s); s.players['egypt']!.treasury = 0;
    s.phase = 'shipConstruction'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
    const out = adapter.applyAction(s, { type: 'buildShips', builds: [{ area: x, count: 1 }] }, 'egypt');
    expect(out.areas[x]!.ships!['egypt']).toBe(1);
    expect(out.areas[x]!.tokens['egypt']).toBe(3);
    expect(out.players['egypt']!.stock).toBe(s.players['egypt']!.stock + 2);
    expect(out.players['egypt']!.shipsAvailable).toBe(3);
    expect(pieceConservationProblems(out, pieceCounts)).toEqual([]);
  });

  it('enforces the 4-ship cap (§22.4)', () => {
    const s = base();
    const x = coastal[0]!.id;
    s.areas[x] = { tokens: { egypt: 20 }, ships: { egypt: 4 } };
    fixSupply(s);
    s.phase = 'shipConstruction'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    expect(() => adapter.applyAction(s, { type: 'buildShips', builds: [{ area: x, count: 1 }] }, 'egypt')).toThrow();
  });
});

describe('§22.3 ship maintenance', () => {
  it('scraps a ship the owner cannot pay for when finishing the phase (§22.3)', () => {
    let s = base();
    const x = coastal[0]!.id;
    s.areas[x] = { tokens: {}, ships: { egypt: 1 } };
    fixSupply(s); s.players['egypt']!.treasury = 0;
    s.phase = 'census'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    normalize(s);
    expect(s.phase).toBe('shipConstruction');
    while (s.phase === 'shipConstruction') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.areas[x]!.ships?.['egypt'] ?? 0).toBe(0);
    expect(s.players['egypt']!.shipsAvailable).toBe(4);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('maintains a ship for 1 treasury token when finishing the phase', () => {
    let s = base();
    const x = coastal[0]!.id;
    s.areas[x] = { tokens: { egypt: 1 }, ships: { egypt: 1 } };
    fixSupply(s); s.players['egypt']!.stock -= 5; s.players['egypt']!.treasury = 5;
    s.phase = 'census'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    normalize(s);
    while (s.phase === 'shipConstruction') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.areas[x]!.ships?.['egypt']).toBe(1);
    expect(s.players['egypt']!.treasury).toBe(4);
  });

  it('lets a player scrap a ship instead of maintaining it (§22.3)', () => {
    let s = base();
    const x = coastal[0]!.id;
    s.areas[x] = { tokens: { egypt: 1 }, ships: { egypt: 1 } };
    fixSupply(s); s.players['egypt']!.stock -= 5; s.players['egypt']!.treasury = 5;
    s.phase = 'census'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    normalize(s);
    const t0 = s.players['egypt']!.treasury;
    while (adapter.currentActor(s) !== 'egypt') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    s = adapter.applyAction(s, { type: 'scrapShip', area: x }, 'egypt');
    while (s.phase === 'shipConstruction') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.areas[x]!.ships?.['egypt'] ?? 0).toBe(0);
    expect(s.players['egypt']!.treasury).toBe(t0);
    expect(s.players['egypt']!.shipsAvailable).toBe(4);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('will not scrap a ship built this phase — only ships already in play go unmaintained (§22.3, report 15b9543e)', () => {
    let s = base();
    const x = coastal[0]!.id;
    s.areas[x] = { tokens: { egypt: 3 } };
    fixSupply(s); s.players['egypt']!.stock -= 5; s.players['egypt']!.treasury = 5;
    s.phase = 'census'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    normalize(s);
    while (adapter.currentActor(s) !== 'egypt') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    s = adapter.applyAction(s, { type: 'buildShips', builds: [{ area: x, count: 1, payFrom: 'treasury' }] }, 'egypt');
    expect(s.players['egypt']!.treasury).toBe(3);
    expect(() => adapter.applyAction(s, { type: 'scrapShip', area: x }, 'egypt')).toThrow(/§22\.3/);
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'scrapShip')).toBe(false);
  });

  it('scrapping an old ship after building a new one waives exactly that ship\'s maintenance (§22.3)', () => {
    let s = base();
    const x = coastal[0]!.id;
    s.areas[x] = { tokens: { egypt: 3 }, ships: { egypt: 1 } };
    fixSupply(s); s.players['egypt']!.stock -= 5; s.players['egypt']!.treasury = 5;
    s.phase = 'census'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    normalize(s);
    while (adapter.currentActor(s) !== 'egypt') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    s = adapter.applyAction(s, { type: 'buildShips', builds: [{ area: x, count: 1, payFrom: 'treasury' }] }, 'egypt');
    s = adapter.applyAction(s, { type: 'scrapShip', area: x }, 'egypt');
    expect(s.areas[x]!.ships?.['egypt']).toBe(1);
    expect(() => adapter.applyAction(s, { type: 'scrapShip', area: x }, 'egypt')).toThrow(/§22\.3/);
    while (s.phase === 'shipConstruction') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.players['egypt']!.treasury).toBe(3);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });
});
