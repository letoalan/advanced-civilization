import { describe, expect, it } from 'vitest';
import { adapter, normalize } from './index.js';
import { pieceCounts } from '../data/index.js';
import { pieceConservationProblems } from './helpers.js';
import type { GameState } from './types.js';
import { base, coastal, fixSupply } from './ships.testHelpers.js';

describe('undoing a ship build or scrap this phase (report 87b486cd)', () => {
  const atShipBuilding = (setup: (s: GameState, x: string) => void) => {
    let s = base();
    const x = coastal[0]!.id;
    setup(s, x);
    fixSupply(s); s.players['egypt']!.stock -= 5; s.players['egypt']!.treasury = 5;
    s.phase = 'census'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    normalize(s);
    while (adapter.currentActor(s) !== 'egypt') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    return { s, x };
  };

  it('nothing to undo until you build or scrap', () => {
    const { s } = atShipBuilding((st, x) => { st.areas[x] = { tokens: { egypt: 3 } }; });
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'undoShip')).toBe(false);
    expect(() => adapter.applyAction(s, { type: 'undoShip' }, 'egypt')).toThrow(/nothing|no ship/);
  });

  it('undoing a build refunds its 2 tokens to where they came from', () => {
    let { s, x } = atShipBuilding((st, x) => { st.areas[x] = { tokens: { egypt: 3 } }; });
    const before = structuredClone(s.players['egypt']!);
    s = adapter.applyAction(s, { type: 'buildShips', builds: [{ area: x, count: 1, payFrom: 'treasury' }] }, 'egypt');
    s = adapter.applyAction(s, { type: 'buildShips', builds: [{ area: x, count: 1, payFrom: 'area' }] }, 'egypt');
    expect(s.areas[x]!.tokens['egypt']).toBe(1);
    s = adapter.applyAction(s, { type: 'undoShip' }, 'egypt');
    expect(s.areas[x]!.tokens['egypt']).toBe(3);
    expect(s.areas[x]!.ships?.['egypt']).toBe(1);
    s = adapter.applyAction(s, { type: 'undoShip' }, 'egypt');
    expect(s.areas[x]!.ships?.['egypt'] ?? 0).toBe(0);
    expect(s.players['egypt']!.treasury).toBe(before.treasury);
    expect(s.players['egypt']!.stock).toBe(before.stock);
    expect(s.players['egypt']!.shipsAvailable).toBe(before.shipsAvailable);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('undoing a scrap keeps the ship — and it owes maintenance again', () => {
    let { s, x } = atShipBuilding((st, x) => { st.areas[x] = { tokens: { egypt: 1 }, ships: { egypt: 1 } }; });
    s = adapter.applyAction(s, { type: 'scrapShip', area: x }, 'egypt');
    s = adapter.applyAction(s, { type: 'undoShip' }, 'egypt');
    expect(s.areas[x]!.ships?.['egypt']).toBe(1);
    while (s.phase === 'shipConstruction') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.players['egypt']!.treasury).toBe(4);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('undoes last-first, so scrap-then-rebuild unwinds cleanly', () => {
    let { s, x } = atShipBuilding((st, x) => { st.areas[x] = { tokens: { egypt: 3 }, ships: { egypt: 1 } }; });
    s = adapter.applyAction(s, { type: 'scrapShip', area: x }, 'egypt');
    s = adapter.applyAction(s, { type: 'buildShips', builds: [{ area: x, count: 1, payFrom: 'treasury' }] }, 'egypt');
    s = adapter.applyAction(s, { type: 'undoShip' }, 'egypt');
    expect(s.players['egypt']!.treasury).toBe(5);
    expect(s.areas[x]!.ships?.['egypt'] ?? 0).toBe(0);
    s = adapter.applyAction(s, { type: 'undoShip' }, 'egypt');
    expect(s.areas[x]!.ships?.['egypt']).toBe(1);
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'scrapShip')).toBe(true);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('builds a ship for 1 population + 1 treasury (§22.1 "a combination of the two")', () => {
    let { s, x } = atShipBuilding((st, x) => { st.areas[x] = { tokens: { egypt: 4 } }; });
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'buildShips' && a.builds[0]!.payFrom === 'split')).toBe(true);
    s = adapter.applyAction(s, { type: 'buildShips', builds: [{ area: x, count: 1, payFrom: 'split' }] }, 'egypt');
    expect(s.areas[x]!.tokens['egypt']).toBe(3);
    expect(s.players['egypt']!.treasury).toBe(4);
    expect(s.areas[x]!.ships?.['egypt']).toBe(1);
    s = adapter.applyAction(s, { type: 'undoShip' }, 'egypt');
    expect(s.areas[x]!.tokens['egypt']).toBe(4);
    expect(s.players['egypt']!.treasury).toBe(5);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('maintains a ship by a levy from its own area instead of treasury (§22.3)', () => {
    let { s, x } = atShipBuilding((st, x) => { st.areas[x] = { tokens: { egypt: 3 }, ships: { egypt: 1 } }; });
    s = adapter.applyAction(s, { type: 'maintainShip', area: x }, 'egypt');
    expect(s.areas[x]!.tokens['egypt']).toBe(2);
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'scrapShip' || a.type === 'maintainShip')).toBe(false);
    const undone = adapter.applyAction(s, { type: 'undoShip' }, 'egypt');
    expect(undone.areas[x]!.tokens['egypt']).toBe(3);
    expect(adapter.legalActions(undone, 'egypt').some((a) => a.type === 'maintainShip')).toBe(true);
    while (s.phase === 'shipConstruction') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.players['egypt']!.treasury).toBe(5);
    expect(s.areas[x]!.ships?.['egypt']).toBe(1);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });
});
