// Rules §16 — THE NUMBER OF PLAYERS: game setup, play area enforcement, and full game.
import { describe, expect, it } from 'vitest';
import { adapter, createGame } from './index.js';
import { adjacency, areaById, playAreas } from '../data/index.js';
import {
  availableNations,
  outOfPlaySet,
  startAreasFor,
  type BoardConfig,
} from './boards.js';
import { inPlay, neighbors, pieceConservationProblems } from './helpers.js';
import { HeuristicAI } from '../ai/heuristic.js';
import { Rng } from 'digital-boardgame-framework';
import type { GameState } from './types.js';

describe('§16 game setup', () => {
  it('seats rules-legal nations with the preset token count and rejects others', () => {
    const s = createGame({ players: ['italy', 'africa', 'crete'], boardPreset: 'raw-3p', seed: 7 });
    expect(s.tokensPerPlayer).toBe(47);
    expect(s.board?.crops).toEqual(['eastOfDotted']);
    expect(pieceConservationProblems(s, { tokens: 47, cities: 9, ships: 4 })).toEqual([]);
    expect(() => createGame({ players: ['italy', 'egypt', 'crete'], boardPreset: 'raw-3p', seed: 7 })).toThrow(/not available/);
    expect(() => createGame({ players: ['italy', 'crete'], boardPreset: 'raw-2p', seed: 7 })).toThrow(/not available/);
  });

  it('defaults to the full stitched map when no preset is named (back-compat)', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 1 });
    expect(s.tokensPerPlayer).toBe(55);
    expect(s.board).toEqual({ west: true, east: true, crops: [] });
    expect(inPlay(s, 'nisa')).toBe(true);
  });

  it('starts a nation at its alternate start when a crop removes the normal one (§16.12)', () => {
    const board: BoardConfig = { west: true, east: false, crops: ['panel12'] };
    expect(startAreasFor(board, 'africa')).toEqual(['cirta']);
    const s = createGame({ players: ['africa', 'iberia'], board, tokensPerPlayer: 47, seed: 3 });
    expect(s.areas['cirta']!.tokens['africa']).toBeGreaterThanOrEqual(1);
    expect(availableNations(board)).not.toContain('italy');
  });
});

describe('§16 play-area enforcement', () => {
  const game = () => createGame({ players: ['italy', 'africa', 'thrace'], boardPreset: 'raw-3p', seed: 11 });

  it('treats out-of-play areas as nonexistent for adjacency', () => {
    const s = game();
    const out = outOfPlaySet(s.board!);
    for (const id of [...areaById.keys()].filter((x) => !out.has(x))) {
      for (const nb of neighbors(s, id)) expect(out.has(nb), `${id} -> ${nb} crosses the board edge`).toBe(false);
    }
    expect(neighbors(s, 'jerusalem')).toEqual([]);
  });

  it('rejects a move into an out-of-play area', () => {
    const s = game();
    const out = outOfPlaySet(s.board!);
    let from = '', to = '';
    for (const id of Object.keys(adjacency)) {
      if (out.has(id) || areaById.get(id)!.isWater) continue;
      const cross = (adjacency[id] ?? []).find((n) => out.has(n) && !areaById.get(n)!.isWater);
      if (cross) { from = id; to = cross; break; }
    }
    expect(from).not.toBe('');
    s.phase = 'movement';
    s.activeOrder = [...s.seating];
    s.actedThisPhase = [];
    (s.areas[from] ??= { tokens: {} }).tokens['italy'] = 2;
    s.players['italy']!.stock -= 2;
    expect(() => adapter.applyAction(s, { type: 'move', moves: [{ from, to, count: 1 }] }, 'italy')).toThrow(/not reachable/);
  });

  it('never offers an out-of-play destination in legalActions', () => {
    const s = game();
    const out = outOfPlaySet(s.board!);
    s.phase = 'movement';
    s.activeOrder = [...s.seating];
    s.actedThisPhase = [];
    const actor = adapter.currentActor(s)!;
    for (const a of adapter.legalActions(s, actor)) {
      if (a.type !== 'move') continue;
      for (const m of a.moves) expect(out.has(m.to), `${m.from}->${m.to}`).toBe(false);
    }
  });
});

describe('§16.8 island city sites (two players)', () => {
  const setupBuild = (s: GameState, area: string, tokens: number) => {
    s.phase = 'cityConstruction';
    s.activeOrder = [...s.seating];
    s.actedThisPhase = [];
    (s.areas[area] ??= { tokens: {} }).tokens['italy'] = tokens;
    s.players['italy']!.stock -= tokens;
  };

  it('disregards island sites — 12 tokens build there, and 6 do not', () => {
    expect(playAreas.islandCitySites).toContain('knossos');
    const s = createGame({ players: ['italy', 'africa'], boardPreset: 'raw-2p', seed: 5 });
    setupBuild(s, 'knossos', 6);
    expect(() => adapter.applyAction(s, { type: 'buildCity', area: 'knossos' }, 'italy')).toThrow(/12 tokens/);
    const s2 = createGame({ players: ['italy', 'africa'], boardPreset: 'raw-2p', seed: 5 });
    setupBuild(s2, 'knossos', 12);
    const out = adapter.applyAction(s2, { type: 'buildCity', area: 'knossos' }, 'italy');
    expect(out.areas['knossos']!.city).toBe('italy');
  });

  it('keeps island sites normal in a 3-player game (§16.7)', () => {
    const s = createGame({ players: ['italy', 'africa', 'crete'], boardPreset: 'raw-3p', seed: 5 });
    setupBuild(s, 'knossos', 6);
    const out = adapter.applyAction(s, { type: 'buildCity', area: 'knossos' }, 'italy');
    expect(out.areas['knossos']!.city).toBe('italy');
  });
});

describe('§16 full game', () => {
  it('a 2-player rules game plays to completion with conserved pieces', async () => {
    let s = createGame({ players: ['italy', 'thrace'], boardPreset: 'raw-2p', seed: 42, maxTurns: 8 });
    const ai = new HeuristicAI();
    const rng = new Rng(42);
    const out = outOfPlaySet(s.board!);
    let guard = 0;
    while (!adapter.result(s) && guard++ < 4000) {
      const actor = adapter.currentActor(s);
      if (!actor) break;
      const action = await ai.selectAction({ state: s, actor, adapter, rng });
      s = adapter.applyAction(s, action, actor);
      for (const [aid, a] of Object.entries(s.areas)) {
        const occupied = Object.values(a.tokens).some((n) => n > 0) || a.city || Object.values(a.ships ?? {}).some((n) => n > 0);
        if (occupied) expect(out.has(aid), `units in out-of-play ${aid}`).toBe(false);
      }
      expect(pieceConservationProblems(s, { tokens: 55, cities: 9, ships: 4 })).toEqual([]);
    }
    expect(adapter.result(s)).not.toBeNull();
  }, 30000);
});
