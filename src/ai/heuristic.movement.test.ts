import { describe, expect, it } from 'vitest';
import { Rng } from 'digital-boardgame-framework';
import { adapter, createGame } from '../engine/index.js';
import { pieceCounts } from '../data/index.js';
import { HeuristicAI } from './heuristic.js';
import type { GameState } from '../engine/types.js';

const ai = new HeuristicAI();

function at(phase: GameState['phase'], tokens: Record<string, number>): GameState {
  const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
  s.areas = Object.fromEntries(Object.entries(tokens).map(([aid, n]) => [aid, { tokens: { egypt: n } }]));
  s.players['egypt']!.stock = pieceCounts.tokens - Object.values(tokens).reduce((t, n) => t + n, 0);
  s.phase = phase;
  s.activeOrder = ['egypt', 'babylon'];
  s.actedThisPhase = [];
  return s;
}

describe('heuristic AI: movement and advances (reports 341f4378 / 9b9885cd)', () => {
  it('gathers for every city it can support and spreads surplus, all in one movement', async () => {
    const s = at('movement', { alexandria: 5, tanis: 4, fayum: 6, 'upper-egypt': 5 });
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    expect(action.type).toBe('move');
    const t = adapter.applyAction(s, action, 'egypt');
    const sites = ['alexandria', 'tanis', 'fayum', 'memphis'].filter(
      (aid) => (t.areas[aid]?.tokens['egypt'] ?? 0) >= 6,
    );
    expect(sites.length).toBe(2);
    const seeded = Object.keys(t.areas).filter(
      (aid) => !(aid in s.areas) && aid !== 'memphis' && (t.areas[aid]?.tokens['egypt'] ?? 0) > 0,
    );
    expect(seeded.length).toBeGreaterThan(0);
  });

  it('storms a rival city it can take (§24.3)', async () => {
    const s = at('movement', { alexandria: 6, tanis: 6, fayum: 6 });
    s.areas['memphis'] = { tokens: {}, city: 'babylon' };
    s.players['egypt']!.citiesAvailable = 0;
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    const t = adapter.applyAction(s, action, 'egypt');
    expect(t.areas['memphis']?.tokens['egypt']).toBeGreaterThanOrEqual(7);
    const calm = await new HeuristicAI({ aggressive: false }).selectAction({
      state: s,
      actor: 'egypt',
      adapter,
      rng: new Rng(1),
    });
    const u = adapter.applyAction(s, calm, 'egypt');
    expect(u.areas['memphis']?.tokens['egypt'] ?? 0).toBe(0);
  });

  it('lands tokens by ship to complete a storm force (§23.51)', async () => {
    const s = at('movement', { memphis: 4, tanis: 4, gaza: 2, thebes: 6 });
    s.areas['gaza']!.ships = { egypt: 1 };
    s.players['egypt']!.shipsAvailable -= 1;
    s.areas['alexandria'] = { tokens: {}, city: 'babylon' };
    s.players['egypt']!.citiesAvailable = 0;
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    if (action.type !== 'move') throw new Error(`expected a move, got ${action.type}`);
    expect(action.moves).toContainEqual({ from: 'gaza', to: 'alexandria', count: 1, byShip: true });
    const t = adapter.applyAction(s, action, 'egypt');
    expect(t.areas['alexandria']?.tokens['egypt']).toBe(7);
  });

  it('clears Barbarians off land with regular tokens, not just surplus (report 39184c86)', async () => {
    const s = at('movement', { tanis: 4 });
    s.areas['sinai'] = { tokens: { __barbarian__: 2 } };
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    if (action.type !== 'move') throw new Error(`expected a move, got ${action.type}`);
    expect(action.moves).toContainEqual({ from: 'tanis', to: 'sinai', count: 3 });
    s.areas['sinai'] = { tokens: { babylon: 2 } };
    s.areas['tanis']!.tokens['egypt'] = 3;
    const calm = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    expect(calm.type === 'move' && calm.moves.some((m) => m.to === 'sinai')).toBe(false);
  });

  it('defends a city a rival could storm, with just enough tokens (§24.41)', async () => {
    const s = at('movement', { alexandria: 4, tanis: 4 });
    s.areas['memphis'] = { tokens: {}, city: 'egypt' };
    s.areas['western-desert'] = { tokens: { babylon: 8 } };
    s.players['egypt']!.citiesAvailable -= 1;
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    const t = adapter.applyAction(s, action, 'egypt');
    expect(t.areas['memphis']?.tokens['egypt']).toBe(2);
    delete s.areas['western-desert'];
    const calm = adapter.applyAction(
      s,
      await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) }),
      'egypt',
    );
    expect(calm.areas['memphis']?.tokens['egypt'] ?? 0).toBe(0);
  });

  it('throws surplus tokens at a rival it can clear off the land (§24.2)', async () => {
    const s = at('movement', { tanis: 6 });
    s.areas['sinai'] = { tokens: { babylon: 2 } };
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    expect(action.type).toBe('move');
    if (action.type !== 'move') return;
    expect(action.moves).toContainEqual({ from: 'tanis', to: 'sinai', count: 3 });
  });

  it('scraps a stranded ship instead of paying its upkeep (§22.3, report c2fa4b00)', async () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
    s.areas = { babylon: { tokens: { babylon: 4 } }, niniveh: { tokens: {}, ships: { babylon: 1 } } };
    s.players['babylon']!.stock = pieceCounts.tokens - 4;
    s.players['babylon']!.shipsAvailable -= 1;
    s.players['babylon']!.treasury = 5;
    s.phase = 'shipConstruction';
    s.activeOrder = ['babylon', 'egypt'];
    s.actedThisPhase = [];
    s.shipMaintOwed = { babylon: 1, egypt: 0 };
    s.shipsBuiltThisPhase = {};
    s.shipSteps = {};
    const action = await ai.selectAction({ state: s, actor: 'babylon', adapter, rng: new Rng(1) });
    expect(action).toEqual({ type: 'scrapShip', area: 'niniveh' });
  });

  it("won't build a ship just to carry tokens to a land neighbour (report 03a70fab)", async () => {
    const s = createGame({ players: ['assyria', 'babylon'], seed: 1, maxTurns: 60 });
    s.areas = {
      elam: { tokens: { assyria: 5 } },
      armenia: { tokens: { babylon: 1 } },
      caucasus: { tokens: { babylon: 1 } },
      nisa: { tokens: { babylon: 1 } },
    };
    s.players['assyria']!.stock = pieceCounts.tokens - 5;
    s.players['assyria']!.treasury = 10;
    s.players['babylon']!.stock = pieceCounts.tokens - 3;
    s.phase = 'shipConstruction';
    s.activeOrder = ['assyria', 'babylon'];
    s.actedThisPhase = [];
    s.shipMaintOwed = { assyria: 0, babylon: 0 };
    s.shipsBuiltThisPhase = {};
    s.shipSteps = {};
    const action = await ai.selectAction({ state: s, actor: 'assyria', adapter, rng: new Rng(1) });
    expect(action.type).toBe('pass');
    s.areas['nisa'] = { tokens: {} };
    const again = await ai.selectAction({ state: s, actor: 'assyria', adapter, rng: new Rng(1) });
    expect(again.type).toBe('buildShips');
  });

  it('pays for a new ship from treasury so the shore keeps tokens to sail', async () => {
    const { areas, adjacency, areaById } = await import('../data/index.js');
    const coast = areas.find(
      (a) => !a.isWater && a.sustains > 0 && (adjacency[a.id] ?? []).some((n) => areaById.get(n)?.isWater),
    )!;
    const s = at('shipConstruction', { [coast.id]: 4 });
    s.players['egypt']!.treasury = 6;
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    expect(action.type).toBe('buildShips');
    if (action.type === 'buildShips') expect(action.builds[0]!.payFrom).toBe('treasury');
  });

  it('buys a basket of advances with whole sets, wasting as little as possible', async () => {
    const s = at('acquireAdvances', { thebes: 2 });
    s.players['egypt']!.hand = { salt: 4, wine: 3, hides: 2 };
    s.players['egypt']!.treasury = 0;
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    expect(action.type).toBe('buyAdvance');
    if (action.type !== 'buyAdvance') return;
    expect(action.advances?.length ?? 1).toBeGreaterThanOrEqual(2);
    const t = adapter.applyAction(s, action, 'egypt');
    expect(t.players['egypt']!.advances.length).toBeGreaterThanOrEqual(2);
    const buy = t.log.find((e) => e.kind === 'advance.buy')!.payload as { cost: number; paid: number };
    expect(buy.paid - buy.cost).toBeLessThanOrEqual(4);
  });
});
