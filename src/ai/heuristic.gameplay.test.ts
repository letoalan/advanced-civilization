import { describe, expect, it } from 'vitest';
import { Rng } from 'digital-boardgame-framework';
import { adapter, createGame } from '../engine/index.js';
import { pieceConservationProblems } from '../engine/helpers.js';
import { pieceCounts } from '../data/index.js';
import { availableNations, boardPresets } from '../engine/boards.js';
import { HeuristicAI } from './heuristic.js';
import type { GameState } from '../engine/types.js';

const ai = new HeuristicAI();

describe('heuristic AI full games', () => {
  it('drives a 3-player game to a winner under a turn cap', async () => {
    let s = createGame({ players: ['egypt', 'babylon', 'crete'], seed: 11, maxTurns: 40 });
    const rng = new Rng(11);
    let steps = 0;
    while (adapter.result(s) == null && steps++ < 20000) {
      const actor = adapter.currentActor(s);
      if (actor == null) break;
      const action = await ai.selectAction({ state: s, actor, adapter, rng });
      s = adapter.applyAction(s, action, actor);
      expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
    }
    const res = adapter.result(s);
    expect(res).not.toBeNull();
    expect(res!.winners.length).toBeGreaterThanOrEqual(1);
  });

  it('drives an eight-player §16.2 game (raw-8p board, 47 tokens)', async () => {
    const nations = availableNations(boardPresets(8)[0]!.config);
    expect(nations.length).toBeGreaterThanOrEqual(8);
    let s = createGame({ players: nations.slice(0, 8), seed: 8, maxTurns: 10, boardPreset: 'raw-8p' });
    const rng = new Rng(8);
    let steps = 0;
    while (adapter.result(s) == null && steps++ < 20000) {
      const actor = adapter.currentActor(s);
      if (actor == null) break;
      s = adapter.applyAction(s, await ai.selectAction({ state: s, actor, adapter, rng }), actor);
      expect(pieceConservationProblems(s, { ...pieceCounts, tokens: 47 })).toEqual([]);
    }
    expect(adapter.result(s)).not.toBeNull();
  });

  it('builds cities and buys advances over a game (makes real progress)', async () => {
    let s = createGame({ players: ['egypt', 'babylon'], seed: 4, maxTurns: 40 });
    const rng = new Rng(4);
    let steps = 0;
    while (adapter.result(s) == null && steps++ < 20000) {
      const actor = adapter.currentActor(s);
      if (actor == null) break;
      s = adapter.applyAction(s, await ai.selectAction({ state: s, actor, adapter, rng }), actor);
    }
    const totalAdvances = Object.values(s.players).reduce((n, p) => n + p.advances.length, 0);
    expect(totalAdvances).toBeGreaterThan(0);
  });
});

describe('heuristic AI: start areas (§16.3)', () => {
  it('chooses start areas and plays on from them', async () => {
    let s = createGame({ players: ['egypt', 'babylon', 'assyria'], seed: 5, maxTurns: 3, chooseStartAreas: true });
    const rng = new Rng(5);
    let guard = 0;
    while (s.pendingStart && guard++ < 10) {
      const actor = adapter.currentActor(s)!;
      const action = await ai.selectAction({ state: s, actor, adapter, rng });
      expect(action.type).toBe('placeStart');
      s = adapter.applyAction(s, action, actor);
    }
    expect(s.pendingStart).toBeUndefined();
    let steps = 0;
    while (adapter.result(s) == null && steps++ < 3000) {
      const actor = adapter.currentActor(s);
      if (actor == null) break;
      s = adapter.applyAction(s, await ai.selectAction({ state: s, actor, adapter, rng }), actor);
      expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
    }
    expect(adapter.result(s)).not.toBeNull();
  });

  it('steers away from a rival who has already placed next door', async () => {
    const pick = async (s: GameState) =>
      (await ai.selectAction({ state: s, actor: 'persia', adapter, rng: new Rng(1) })) as {
        type: string;
        area?: string;
      };
    const s = createGame({ players: ['babylon', 'persia'], seed: 1, chooseStartAreas: true });
    const alone: GameState = { ...s, pendingStart: { order: ['persia', 'babylon'] } };
    expect((await pick(alone)).area).toBe('nisa');
    let t: GameState = { ...s, pendingStart: { order: ['babylon', 'persia'] } };
    t = adapter.applyAction(t, { type: 'placeStart', area: 'media' }, 'babylon');
    const choice = (await pick(t)).area;
    expect(choice).not.toBe('nisa');
    expect(['prophtasia', 'randamar']).toContain(choice);
  });
});
