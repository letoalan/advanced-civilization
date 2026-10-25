import { areaById } from '../../data/index.js';
import type { Action, GameState, PlayerId } from '../../engine/types.js';

export type Move = Extract<Action, { type: 'move' }>['moves'][number];

export const BARBARIAN = '__barbarian__';

export const rivalsIn = (state: GameState, actor: PlayerId, aid: string) => {
  const a = state.areas[aid];
  return !!a && ((!!a.city && a.city !== actor) || Object.entries(a.tokens).some(([o, n]) => o !== actor && n > 0));
};

/** Tokens left to support cities once surplus is removed (§26.31). */
export function supportAfter(
  state: GameState,
  actor: PlayerId,
  tokens: Record<string, number>,
  skip: ReadonlySet<string>,
): number {
  let n = 0;
  for (const [aid, t] of Object.entries(tokens)) {
    if (t <= 0 || skip.has(aid) || state.areas[aid]?.city) continue;
    n += Math.min(t, areaById.get(aid)?.sustains ?? 0);
  }
  return n;
}

/** Two-sided token fight as the engine resolves it (§24.2). */
export function fight(
  att: number,
  def: number,
  limit: number,
  attMetal: boolean,
  defMetal: boolean,
): [number, number] {
  let a = att,
    d = def;
  while (a > 0 && d > 0 && a + d > limit) {
    const aFirst = attMetal !== defMetal ? defMetal : a < d;
    if (attMetal === defMetal && a === d) {
      a--;
      d--;
      continue;
    }
    if (aFirst) {
      a--;
      if (a > 0 && a + d > limit) d--;
    } else {
      d--;
      if (d > 0 && a + d > limit) a--;
    }
  }
  return [a, d];
}
