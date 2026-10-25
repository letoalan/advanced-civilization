import { censusOrder, player, populationCount } from '../helpers.js';
import { has, isPlayer } from '../primitives.js';
import type { GameState, PlayerId } from '../types.js';

export function runCensus(s: GameState): void {
  for (const id of s.seating) player(s, id).census = populationCount(s, id);
  s.censusOrder = s.activeOrder = censusOrder(s);
  s.actedThisPhase = [];
}

export const hasMil = (s: GameState, id: PlayerId): boolean => isPlayer(s, id) && has(player(s, id), 'military');

/** §32.831: Military holders move (and build ships) AFTER non-Military players;
 *  within each group the census order is preserved (Array#sort is stable). */
export function militaryLast(s: GameState, order: PlayerId[]): PlayerId[] {
  return [...order].sort((a, b) => (hasMil(s, a) ? 1 : 0) - (hasMil(s, b) ? 1 : 0));
}
