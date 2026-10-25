import { areaById, civById } from '../../data/index.js';
import { landNeighbors, navalDestinations, neighbors } from '../../engine/helpers.js';
import type { Action, GameState, PlayerId } from '../../engine/types.js';

export function shipCount(state: GameState, actor: PlayerId): number {
  let n = 0;
  for (const a of Object.values(state.areas)) n += a.ships?.[actor] ?? 0;
  return n;
}

/** Land a ship at `aid` can carry tokens to that they couldn't walk to in the
 *  same move. */
export function overseas(state: GameState, aid: string, range: number, astro: boolean): Set<string> {
  const walk = new Set(landNeighbors(state, aid));
  return new Set([...navalDestinations(state, aid, range, astro)].filter((to) => !walk.has(to)));
}

/** Whether a ship in `aid` earns its upkeep. */
export function shipUseful(state: GameState, actor: PlayerId, aid: string, tokensThere: number): boolean {
  if (tokensThere < 3) return false;
  const p = state.players[actor]!;
  const range = 4 + (p.advances.includes('clothmaking') ? 1 : 0);
  return [...overseas(state, aid, range, p.advances.includes('astronomy'))].some((to) => {
    const area = areaById.get(to);
    return (
      !!area &&
      !area.isWater &&
      area.sustains > 0 &&
      !Object.values(state.areas[to]?.tokens ?? {}).some((n) => n > 0) &&
      !state.areas[to]?.city
    );
  });
}

/** Worth of a Monotheism conversion target. */
export function convertValue(state: GameState, aid: string): number {
  const a = state.areas[aid];
  if (!a) return 0;
  const cityBonus = a.city && a.city in state.players ? 12 : 0;
  const tokens = Object.entries(a.tokens)
    .filter(([o]) => o in state.players)
    .reduce((m, [, n]) => Math.max(m, n), 0);
  return cityBonus + tokens;
}

/** §16.3 start-area choice: favour a fertile area with fertile land to grow into. */
export function bestStart(
  state: GameState,
  actor: PlayerId,
  starts: Extract<Action, { type: 'placeStart' }>[],
): Action {
  const rivalNear = (aid: string) =>
    [aid, ...neighbors(state, aid)].some((n) =>
      Object.entries(state.areas[n]?.tokens ?? {}).some(([owner, k]) => owner !== actor && k > 0),
    );
  const score = (aid: string) => {
    const room = neighbors(state, aid)
      .filter((n) => !areaById.get(n)?.isWater)
      .reduce((t, n) => t + (areaById.get(n)?.sustains ?? 0), 0);
    return (
      2 * (areaById.get(aid)?.sustains ?? 0) +
      0.5 * room -
      (rivalNear(aid) ? 6 : 0) +
      (civById.get(actor)?.start === aid ? 1 : 0)
    );
  };
  return starts.reduce((best, a) => (score(a.area) > score(best.area) ? a : best));
}
