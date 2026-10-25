import { createGame } from './index.js';
import { areas, adjacency, areaById, pieceCounts } from '../data/index.js';
import type { GameState } from './types.js';

export const isCoastal = (id: string) => (adjacency[id] ?? []).some((n) => areaById.get(n)?.isWater);
export const coastal = areas.filter((a) => !a.isWater && isCoastal(a.id));

export function base(): GameState {
  const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
  s.areas = {};
  for (const id of s.seating) {
    const p = s.players[id]!;
    p.hand = {};
  }
  return s;
}

export function fixSupply(s: GameState) {
  for (const id of s.seating) {
    const p = s.players[id]!;
    let board = 0,
      ships = 0;
    for (const a of Object.values(s.areas)) {
      board += a.tokens[id] ?? 0;
      ships += a.ships?.[id] ?? 0;
    }
    p.stock = pieceCounts.tokens - board;
    p.shipsAvailable = pieceCounts.ships - ships;
  }
}
