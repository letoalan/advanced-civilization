import { describe, expect, it } from 'vitest';
import { Rng } from 'digital-boardgame-framework';
import { civById, pieceCounts } from '../data/index.js';
import { FULL_BOARD, startAreasFor } from './boards.js';
import { pieceCensus, pieceConservationProblems } from './helpers.js';
import { createGame, adapter, victoryScore } from './index.js';
import type { Action, GameState } from './types.js';

describe('game setup', () => {
  it('creates a normalized state waiting on an interactive decision', () => {
    const s = createGame({ players: ['egypt', 'babylon', 'crete'], seed: 7 });
    expect(s.turn).toBe(1);
    // After the auto phases (taxation/expansion/census) the first interactive
    // phase with a waiting actor is ship construction.
    expect(adapter.currentActor(s)).not.toBeNull();
    expect(['shipConstruction', 'movement', 'cityConstruction', 'acquireAdvances']).toContain(s.phase);
  });
  it('places one starting token per civ and stocks the rest', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 1 });
    // population should be >=1 each after growth
    for (const id of s.seating) {
      let pop = 0;
      for (const a of Object.values(s.areas)) pop += a.tokens[id] ?? 0;
      expect(pop).toBeGreaterThanOrEqual(1);
    }
  });
  it('lets each nation choose its start area, in a random selection order (§16.3, report 5e4b210c)', () => {
    const s = createGame({ players: ['egypt', 'babylon', 'thrace'], seed: 3, chooseStartAreas: true });
    // Thrace has a single start area, so it is placed at once; the others choose.
    expect(s.areas['scythia']?.tokens['thrace']).toBe(1);
    expect(new Set(s.pendingStart!.order)).toEqual(new Set(['egypt', 'babylon']));
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
    const first = adapter.currentActor(s)!;
    expect(first).toBe(s.pendingStart!.order[0]);
    // Exactly its own start areas are offered, and nothing else may happen first.
    const offered = adapter.legalActions(s, first).map((a) => (a as Extract<Action, { type: 'placeStart' }>).area);
    expect([...offered].sort()).toEqual([...startAreasFor(FULL_BOARD, first)].sort());
    expect(() => adapter.applyAction(s, { type: 'pass' }, first)).toThrow(/start area/);
    expect(() => adapter.applyAction(s, { type: 'placeStart', area: first === 'egypt' ? 'susa' : 'thebes' }, first)).toThrow(/§16\.3/);
    // Pick something other than the old fixed default, to prove the choice sticks.
    const pick = startAreasFor(FULL_BOARD, first).find((a) => a !== civById.get(first)!.start)!;
    let t = adapter.applyAction(s, { type: 'placeStart', area: pick }, first);
    const second = adapter.currentActor(t)!;
    expect(second).not.toBe(first);
    expect(t.pendingStart!.order).toEqual([second]);
    t = adapter.applyAction(t, { type: 'placeStart', area: startAreasFor(FULL_BOARD, second)[0]! }, second);
    // Everyone has placed: turn 1 runs as usual, growing from the chosen area.
    expect(t.pendingStart).toBeUndefined();
    expect(t.turn).toBe(1);
    expect(adapter.currentActor(t)).not.toBeNull();
    expect(t.areas[pick]!.tokens[first]).toBeGreaterThanOrEqual(1);
    expect(t.log.filter((e) => e.kind === 'setup.start')).toHaveLength(3);
    expect(pieceConservationProblems(t, pieceCounts)).toEqual([]);
  });
  it('shuffles the selection order by seed, and is off unless asked for', () => {
    const firsts = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) firsts.add(createGame({ players: ['egypt', 'babylon'], seed, chooseStartAreas: true }).pendingStart!.order[0]!);
    expect(firsts).toEqual(new Set(['egypt', 'babylon']));
    expect(createGame({ players: ['egypt', 'babylon'], seed: 1 }).pendingStart).toBeUndefined();
  });
});

describe('legal actions are always non-empty and applicable', () => {
  it('every legal action applies without throwing', () => {
    const s = createGame({ players: ['egypt', 'babylon', 'crete'], seed: 3 });
    const actor = adapter.currentActor(s)!;
    const actions = adapter.legalActions(s, actor);
    expect(actions.length).toBeGreaterThan(0);
    for (const a of actions) {
      expect(() => adapter.applyAction(s, a, actor)).not.toThrow();
    }
  });
});

/** Drive a full game with random-but-legal play; it must terminate with a
 *  winner and never throw or stall. */
function playRandomGame(seed: number, maxTurns = 40): GameState {
  let s = createGame({ players: ['egypt', 'babylon', 'crete', 'assyria'], seed, maxTurns });
  const rng = new Rng(seed ^ 0x9e3779b9);
  let steps = 0;
  while (adapter.result(s) == null && steps++ < 20000) {
    const actor = adapter.currentActor(s);
    if (actor == null) break;
    const actions = adapter.legalActions(s, actor);
    // Bias slightly toward non-pass so the game progresses, but pass is always last.
    const choice = actions.length > 1 && rng.next() < 0.7
      ? actions[rng.int(actions.length - 1)]!
      : { type: 'pass' as const };
    s = adapter.applyAction(s, choice as Action, actor);
  }
  return s;
}

describe('full random playthrough', () => {
  it('terminates with a winner under a turn cap', () => {
    const s = playRandomGame(42, 30);
    const res = adapter.result(s);
    expect(res).not.toBeNull();
    expect(res!.winners.length).toBeGreaterThanOrEqual(1);
  });
  it('is deterministic for a fixed seed', () => {
    const a = playRandomGame(99, 25);
    const b = playRandomGame(99, 25);
    expect(victoryScore(a, a.seating[0]!)).toBe(victoryScore(b, b.seating[0]!));
    expect(a.turn).toBe(b.turn);
  });
});

describe('physical component conservation', () => {
  it('starts with the full fixed supply (55 tokens / 9 cities / 4 ships) per nation', () => {
    const s = createGame({ players: ['egypt', 'babylon', 'crete', 'assyria'], seed: 8 });
    for (const id of s.seating) {
      expect(pieceCensus(s, id)).toEqual({ tokens: 55, cities: 9, ships: 4 });
    }
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  // The invariant: across stock + treasury + board, every nation's tokens,
  // cities and ships must ALWAYS sum to the fixed per-nation totals — checked
  // after every action, across many seeds and player counts.
  it.each([1, 7, 21, 42, 99, 123, 777, 2024])(
    'conserves every nations pieces after every action of a full game (seed %i)',
    (seed) => {
      let s = createGame({ players: ['egypt', 'babylon', 'crete', 'assyria'], seed, maxTurns: 30 });
      const rng = new Rng(seed);
      let steps = 0;
      expect(pieceConservationProblems(s, pieceCounts)).toEqual([]); // at setup
      while (adapter.result(s) == null && steps++ < 20000) {
        const actor = adapter.currentActor(s);
        if (actor == null) break;
        const actions = adapter.legalActions(s, actor);
        const choice = actions.length > 1 && rng.next() < 0.7 ? actions[rng.int(actions.length - 1)]! : { type: 'pass' as const };
        s = adapter.applyAction(s, choice as Action, actor);
        const problems = pieceConservationProblems(s, pieceCounts);
        expect(problems, `seed ${seed} step ${steps} (${s.phase})`).toEqual([]);
      }
      expect(steps).toBeGreaterThan(5);
    },
  );

  it('holds for a 2-player and a 6-player game too', () => {
    for (const players of [['egypt', 'babylon'], ['egypt', 'babylon', 'crete', 'assyria', 'thrace', 'illyria']]) {
      let s = createGame({ players, seed: 55, maxTurns: 20 });
      const rng = new Rng(55);
      let steps = 0;
      while (adapter.result(s) == null && steps++ < 20000) {
        const actor = adapter.currentActor(s);
        if (actor == null) break;
        const actions = adapter.legalActions(s, actor);
        s = adapter.applyAction(s, (actions.length > 1 && rng.next() < 0.6 ? actions[rng.int(actions.length - 1)]! : { type: 'pass' as const }) as Action, actor);
        expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
      }
    }
  });
});
