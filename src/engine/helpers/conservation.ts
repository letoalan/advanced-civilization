import {
  calamities as CALAMITIES,
  commodities as COMMODITIES,
} from '../../data/index.js';
import type { GameState, PlayerId } from '../types.js';
import { player } from './orders.js';

/** Count every physical piece a nation controls, wherever it sits. */
export function pieceCensus(state: GameState, id: PlayerId): { tokens: number; cities: number; ships: number } {
  const p = player(state, id);
  let boardTokens = 0;
  let boardCities = 0;
  let boardShips = 0;
  for (const a of Object.values(state.areas)) {
    boardTokens += a.tokens[id] ?? 0;
    if (a.city === id) boardCities += 1;
    if (a.ships) boardShips += a.ships[id] ?? 0;
  }
  return {
    tokens: p.stock + p.treasury + boardTokens,
    cities: p.citiesAvailable + boardCities,
    ships: p.shipsAvailable + boardShips,
  };
}

/** Check the fixed-supply invariant for every nation. */
export function pieceConservationProblems(
  state: GameState,
  expected: { tokens: number; cities: number; ships: number },
): string[] {
  const problems: string[] = [];
  for (const id of state.seating) {
    const c = pieceCensus(state, id);
    if (c.tokens !== expected.tokens) problems.push(`${id}: ${c.tokens} tokens (expected ${expected.tokens})`);
    if (c.cities !== expected.cities) problems.push(`${id}: ${c.cities} cities (expected ${expected.cities})`);
    if (c.ships !== expected.ships) problems.push(`${id}: ${c.ships} ships (expected ${expected.ships})`);
  }
  return problems;
}

/** Check the trade-card deck is conserved. */
export function cardConservationProblems(state: GameState): string[] {
  const counts: Record<string, number> = {};
  const bump = (card: string, n: number) => {
    counts[card] = (counts[card] ?? 0) + n;
  };
  for (const pile of Object.values(state.trade.stacks)) for (const c of pile) bump(c, 1);
  for (const p of Object.values(state.players)) for (const [c, n] of Object.entries(p.hand)) bump(c, n);
  const problems: string[] = [];
  for (const c of COMMODITIES) {
    const got = counts[c.id] ?? 0;
    if (got !== c.count) problems.push(`commodity ${c.id}: ${got} (expected ${c.count})`);
  }
  for (const cal of CALAMITIES) {
    const got = counts[`calamity:${cal.id}`] ?? 0;
    if (got !== 1) problems.push(`calamity ${cal.id}: ${got} (expected 1)`);
  }
  return problems;
}

/** §30.412 Civil War faction selection legality. */
export function civilWarSelectionOk(points: number, target: number, tokens: number, cities: number): boolean {
  if (points === target) return true;
  for (let k = 0; k <= cities; k++) {
    const t = target - 5 * k;
    if (t >= 0 && t <= tokens) return false;
  }
  return points > target && points - target < 5;
}
