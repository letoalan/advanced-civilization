import { civById } from '../../data/index.js';
import type { GameState, PlayerId, PlayerState } from '../types.js';

/** Number of cities a player has on the board. */
export function cityCount(state: GameState, player: PlayerId): number {
  let n = 0;
  for (const a of Object.values(state.areas)) if (a.city === player) n++;
  return n;
}

/** Total on-board population (tokens) for a player — the census count. */
export function populationCount(state: GameState, player: PlayerId): number {
  let n = 0;
  for (const a of Object.values(state.areas)) n += a.tokens[player] ?? 0;
  return n;
}

/** A.S.T. rank of a nation (§17.4): Africa first … Egypt last. Lower acts first. */
export function astRank(id: PlayerId): number {
  return civById.get(id)?.astOrder ?? 99;
}

/** Players in fixed A.S.T. order (§17.4). */
export function astOrder(state: GameState): PlayerId[] {
  return [...state.seating].sort((a, b) => astRank(a) - astRank(b));
}

/** Census order: by population descending; ties broken by seating order. */
export function censusOrder(state: GameState): PlayerId[] {
  return [...state.seating].sort((a, b) => {
    const pa = populationCount(state, a);
    const pb = populationCount(state, b);
    if (pa !== pb) return pb - pa;
    return astRank(a) - astRank(b);
  });
}

/** The player whose turn it is to act in the current phase. */
export function actingPlayer(state: GameState): PlayerId | null {
  for (const p of state.activeOrder) {
    if (!state.actedThisPhase.includes(p)) return p;
  }
  return null;
}

export function player(state: GameState, id: PlayerId): PlayerState {
  const p = state.players[id];
  if (!p) throw new Error(`unknown player ${id}`);
  return p;
}
