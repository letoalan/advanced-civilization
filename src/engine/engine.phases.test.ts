import { describe, expect, it } from 'vitest';
import { createGame, adapter, victoryScore, normalize, setupTaxation } from './index.js';
import type { Action, GameState } from './types.js';

describe('victory scoring', () => {
  it('counts AST, cities, treasury, cards and commodities', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 5 });
    const p = s.players['egypt']!;
    p.treasury = 50;
    p.astSpace = 2;
    p.advances = ['pottery']; // face 45
    p.hand = { salt: 2 }; // 4*3 = 12
    // find an empty area to give egypt a city
    const aid = Object.keys(s.areas)[0]!;
    s.areas[aid] = { tokens: {}, city: 'egypt' };
    const score = victoryScore(s, 'egypt');
    // 45 (advance) + 12 (salt set) + 50 (treasury) + 2*100 (ast) + 1*50 (city)
    expect(score).toBe(45 + 12 + 50 + 200 + 50);
  });
});

describe('movement & trade-card acquisition rules', () => {
  // Advance the game (everyone passing) until it reaches the given phase.
  function advanceToPhase(s: GameState, phase: string, cap = 400): GameState {
    let g = s, n = 0;
    while (g.phase !== phase && n++ < cap) {
      const actor = adapter.currentActor(g);
      if (!actor) break;
      g = adapter.applyAction(g, { type: 'pass' }, actor);
    }
    return g;
  }

  it('accepts a partial-count move via tryApplyAction (subset of a stack)', () => {
    const g = advanceToPhase(createGame({ players: ['egypt', 'babylon'], seed: 7 }), 'movement');
    expect(g.phase).toBe('movement');
    const actor = adapter.currentActor(g)!;
    // Find an area where the actor has >= 2 tokens and a non-water neighbour.
    const moves = adapter.legalActions(g, actor).filter((a): a is Extract<Action, { type: 'move' }> => a.type === 'move' && !a.moves[0]!.byShip);
    const full = moves.find((m) => m.moves[0]!.count >= 2)!;
    expect(full).toBeTruthy();
    const { from, to } = full.moves[0]!;
    const before = g.areas[from]!.tokens[actor]!;
    // Move just ONE token — not an enumerated full-stack option.
    const r = adapter.tryApplyAction(g, { type: 'move', moves: [{ from, to, count: 1 }] }, actor);
    expect(r.ok).toBe(true);
    expect(r.state.areas[from]!.tokens[actor] ?? 0).toBe(before - 1);
    expect(r.state.areas[to]!.tokens[actor] ?? 0).toBe(1);
  });

  it('rejects an illegal move (too many tokens) via tryApplyAction', () => {
    const g = advanceToPhase(createGame({ players: ['egypt', 'babylon'], seed: 7 }), 'movement');
    const actor = adapter.currentActor(g)!;
    const move = adapter.legalActions(g, actor).find((a): a is Extract<Action, { type: 'move' }> => a.type === 'move')!;
    const { from, to } = move.moves[0]!;
    const r = adapter.tryApplyAction(g, { type: 'move', moves: [{ from, to, count: 999 }] }, actor);
    expect(r.ok).toBe(false);
  });

  it('a city-less player draws no trade cards (§27.1)', () => {
    // Everyone passes for a full turn, so no city is ever built.
    let g = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    let n = 0;
    while (g.turn < 2 && n++ < 400) {
      const actor = adapter.currentActor(g);
      if (!actor) break;
      g = adapter.applyAction(g, { type: 'pass' }, actor);
    }
    // A full turn (incl. trade-card acquisition) has elapsed with no cities.
    for (const id of g.seating) {
      const cities = Object.values(g.areas).filter((a) => a.city === id).length;
      const hand = Object.values(g.players[id]!.hand).reduce((x, y) => x + y, 0);
      expect(cities).toBe(0);
      expect(hand).toBe(0);
    }
  });
});

describe('taxation (§19 / §32.421 Coinage)', () => {
  it('auto-taxes a non-Coinage player at rate 2 (no pause)', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    // Fresh game: nobody holds Coinage, so taxation never pauses.
    expect(s.phase).not.toBe('taxation');
  });

  it('unpayable cities revolt and are taken over; Democracy is immune (§19.31/.34)', async () => {
    async function run(democracy: boolean) {
      const { areas } = await import('../data/index.js');
      const land = areas.filter((a) => !a.isWater).slice(0, 3).map((a) => a.id);
      const s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
      s.areas = {} as typeof s.areas;
      for (const aid of land) s.areas[aid] = { tokens: {}, city: 'egypt' }; // 3 egypt cities
      s.players['egypt']!.stock = 2; // can only pay for 1 city at rate 2
      s.players['egypt']!.citiesAvailable = 6;
      if (democracy) s.players['egypt']!.advances = ['democracy'];
      s.players['babylon']!.stock = 50; s.players['babylon']!.citiesAvailable = 5; // reserve leader → taker
      s.phase = 'taxation'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
      setupTaxation(s);
      normalize(s); // §19.31: revolts resolve once taxation completes (population-expansion entry)
      // §19.32: the beneficiary chooses which revolting cities to take — drive that pick.
      let st: GameState = s;
      while (st.pendingPick) { const c = adapter.currentActor(st)!; st = adapter.applyAction(st, adapter.legalActions(st, c)[0]!, c); }
      return st;
    }
    const revolted = await run(false);
    expect(Object.values(revolted.areas).filter((a) => a.city === 'egypt').length).toBe(1); // 2 revolted
    expect(Object.values(revolted.areas).filter((a) => a.city === 'babylon').length).toBe(2); // taken over
    const democratic = await run(true);
    expect(Object.values(democratic.areas).filter((a) => a.city === 'egypt').length).toBe(3); // none revolt
  });

  it('defers tax revolts until every player has paid (§19.31)', async () => {
    const { areas } = await import('../data/index.js');
    const land = areas.filter((a) => !a.isWater).slice(0, 3).map((a) => a.id);
    const s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    s.areas = {} as typeof s.areas;
    for (const aid of land) s.areas[aid] = { tokens: {}, city: 'egypt' };
    s.players['egypt']!.stock = 0; s.players['egypt']!.citiesAvailable = 6; // can't pay → all 3 revolt
    s.players['babylon']!.stock = 50; s.players['babylon']!.citiesAvailable = 5;
    s.phase = 'taxation'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    setupTaxation(s);
    expect(s.pendingRevolts!['egypt']).toBe(3); // recorded during taxation, NOT yet resolved
    expect(Object.values(s.areas).filter((a) => a.city === 'egypt').length).toBe(3);
    normalize(s); // taxation completes → revolts settle (pausing for the beneficiary's pick)
    let st: GameState = s;
    while (st.pendingPick) { const c = adapter.currentActor(st)!; st = adapter.applyAction(st, adapter.legalActions(st, c)[0]!, c); }
    expect(st.pendingRevolts).toEqual({});
    expect(Object.values(st.areas).filter((a) => a.city === 'babylon').length).toBe(3); // taken over
  });

  it('pauses for a Coinage holder with cities to choose their rate, which collects', () => {
    let s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    // Give egypt Coinage + a city + stock, then re-enter taxation.
    s.players['egypt']!.advances = ['coinage'];
    const land = Object.keys(s.areas)[0]!;
    s.areas[land] = { tokens: { egypt: 1 }, city: 'egypt' };
    s.players['egypt']!.stock = 10; s.players['egypt']!.treasury = 0;
    s.phase = 'taxation'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    setupTaxation(s); // babylon auto-collected; egypt (Coinage + city) left to choose
    normalize(s);
    expect(s.phase).toBe('taxation');
    expect(adapter.currentActor(s)).toBe('egypt');
    const rates = adapter.legalActions(s, 'egypt').filter((a) => a.type === 'setTaxRate');
    expect(rates).toHaveLength(3);
    s = adapter.applyAction(s, { type: 'setTaxRate', rate: 3 }, 'egypt');
    expect(s.players['egypt']!.treasury).toBe(3); // 1 city × rate 3, stock → treasury
    expect(s.phase).not.toBe('taxation'); // advanced past taxation
  });
});
