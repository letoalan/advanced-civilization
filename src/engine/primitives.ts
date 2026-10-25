import { areaById } from '../data/index.js';
import { neighbors, player } from './helpers.js';
import type { GameState, Phase, PlayerId } from './types.js';

export const AUTO_PHASES: Set<Phase> = new Set([
  'census',
  'conflict',
  'removeSurplus',
  'tradeAcquisition',
  'astAdjustment',
]);

export const BARBARIAN = '__barbarian__';
export const PIRATE = '__pirate__';

export const clone = <T>(x: T): T => structuredClone(x);
export const has = (p: { advances: string[] }, id: string) => p.advances.includes(id);
export const isPlayer = (s: GameState, id: PlayerId): boolean => id in s.players;
export const isNeutral = (id: PlayerId): boolean => id === BARBARIAN || id === PIRATE;

export const citiesOf = (s: GameState, owner: PlayerId): string[] =>
  Object.keys(s.areas).filter((a) => s.areas[a]!.city === owner);

export function isCoastal(s: GameState, aid: string): boolean {
  return neighbors(s, aid).some((n) => areaById.get(n)?.isWater);
}

export const isCoastal2 = (s: GameState, aid: string) => neighbors(s, aid).some((n) => areaById.get(n)?.isWater);

export const coastalCitiesOf = (s: GameState, owner: PlayerId) =>
  citiesOf(s, owner).filter((a) => isCoastal2(s, a));

export function areaName(aid: string): string {
  return areaById.get(aid)?.name ?? aid;
}

export function setTokens(s: GameState, aid: string, owner: PlayerId, n: number): void {
  const a = s.areas[aid]!;
  if (n <= 0) delete a.tokens[owner];
  else a.tokens[owner] = n;
}

export function returnLostToStock(s: GameState, owner: PlayerId, n: number): void {
  // Neutral forces (Barbarians, pirates) have no stock — their pieces just vanish.
  if (isPlayer(s, owner)) player(s, owner).stock += n;
}

/** Remove up to `unitPoints` of a player's tokens from the board (smallest
 *  areas first), returning them to stock. Cities are not removed here. */
export function removeTokensFromBoard(s: GameState, owner: PlayerId, unitPoints: number): void {
  let remaining = unitPoints;
  const areas = Object.entries(s.areas)
    .filter(([, a]) => (a.tokens[owner] ?? 0) > 0)
    .sort(([, a], [, b]) => (a.tokens[owner] ?? 0) - (b.tokens[owner] ?? 0));
  for (const [aid, a] of areas) {
    if (remaining <= 0) break;
    const t = a.tokens[owner] ?? 0;
    const take = Math.min(t, remaining);
    setTokens(s, aid, owner, t - take);
    returnLostToStock(s, owner, take);
    remaining -= take;
  }
}
