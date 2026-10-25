import { areaById } from '../../data/index.js';
import { cityCount, player, populationCount } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, has, isNeutral, isPlayer, returnLostToStock, setTokens } from '../primitives.js';
import type { GameState, PendingSupport, PlayerId } from '../types.js';

export function areaLimitFor(s: GameState, aid: string, owner: PlayerId): number {
  const area = areaById.get(aid);
  if (!area) return 0;
  const owners = Object.keys(s.areas[aid]!.tokens).filter((o) => (s.areas[aid]!.tokens[o] ?? 0) > 0);
  let limit = area.sustains;
  if (owners.length <= 1 && isPlayer(s, owner) && has(player(s, owner), 'agriculture')) limit += 1;
  return limit;
}

/** §26.32: record that `owner` built or acquired the city in `aid` this turn, so
 *  it is reduced before older cities when support is short. Cleared at rollover. */
export function markCityAcquired(s: GameState, owner: PlayerId, aid: string): void {
  const p = player(s, owner);
  (p.citiesBuiltThisTurn ??= []);
  if (!p.citiesBuiltThisTurn.includes(aid)) p.citiesBuiltThisTurn.push(aid);
}

/** Reduce one specific city to tokens (§26.41 substitution, Agriculture +1). */
export function reduceSpecificCity(s: GameState, owner: PlayerId, aid: string): void {
  const a = s.areas[aid];
  if (!a || a.city !== owner) return;
  delete a.city; player(s, owner).citiesAvailable += 1;
  const place = Math.min(areaLimitFor(s, aid, owner), player(s, owner).stock);
  if (place > 0) { a.tokens[owner] = (a.tokens[owner] ?? 0) + place; player(s, owner).stock -= place; }
}

/** §26.32: the cities a player may reduce now — newly-built ones first (these
 *  must be reduced before older cities), otherwise any of their cities. */
export function supportCandidates(s: GameState, id: PlayerId): string[] {
  const all = Object.keys(s.areas).filter((a) => s.areas[a]!.city === id);
  const newest = (player(s, id).citiesBuiltThisTurn ?? []).filter((a) => s.areas[a]?.city === id);
  return newest.length ? newest : all;
}

export type SupportCtx = { mode: 'support' | 'slaverevolt'; before?: unknown; overviewBefore?: string };

/** §26.31/.32/.5: reduce `id`'s cities until support is met (on-board tokens minus
 *  any withheld `lock` ≥ two per city). When the player has a real choice of which
 *  city to reduce, PAUSE for their decision (§26.32); when forced (one candidate),
 *  reduce directly. A reduced city is replaced by the max tokens its area allows
 *  (§26.41), which can then support the rest. Returns true if it paused. */
export function reduceForSupport(s: GameState, id: PlayerId, lock: number, ctx: SupportCtx): boolean {
  let guard = 0;
  while (guard++ < 100) {
    const cities = cityCount(s, id);
    if (cities === 0) return false;
    if (populationCount(s, id) - lock >= 2 * cities) return false;
    const cands = supportCandidates(s, id);
    if (cands.length === 0) return false;
    if (cands.length > 1) {
      s.pendingSupport = { holder: id, candidates: cands, lock, mode: ctx.mode, before: ctx.before as any, overviewBefore: ctx.overviewBefore };
      return true;
    }
    reduceSpecificCity(s, id, cands[0]!);
    log(s, 'city.reduce', id, `${id} lacked city support — reduced the city in ${areaName(cands[0]!)} (§26.32).`, { area: cands[0]!, reason: 'support' });
  }
  return false;
}

/** §26.31 / §26.5: every player must have two on-board tokens per city. Pauses for
 *  the first player who must choose which city to reduce; resumes via chooseCities. */
export function checkCitySupport(s: GameState): void {
  for (const id of s.seating) {
    if (reduceForSupport(s, id, 0, { mode: 'support' })) return;
  }
}

/** §26.32 default: reduce the cheapest city to rebuild (a city-site needs 6, not 12). */
export function suggestSupportReduce(s: GameState, sup: PendingSupport): string {
  return [...sup.candidates].sort((x, y) => (areaById.get(x)?.isCitySite ? 0 : 1) - (areaById.get(y)?.isCitySite ? 0 : 1))[0]!;
}

/** §26 Removal of surplus population, then a city-support check. */
export function runRemoveSurplus(s: GameState): void {
  for (const [aid, a] of Object.entries(s.areas)) {
    for (const o of Object.keys(a.tokens)) {
      if (isNeutral(o)) continue;
      const t = a.tokens[o] ?? 0;
      if (t <= 0) continue;
      const limit = a.city ? 0 : areaLimitFor(s, aid, o);
      if (t > limit) {
        setTokens(s, aid, o, limit);
        returnLostToStock(s, o, t - limit);
        log(s, 'surplus.removed', o, `${o} lost ${t - limit} surplus token${t - limit === 1 ? '' : 's'} in ${areaName(aid)} — ${a.city ? 'the city stands alone' : `population limit ${limit}`} (§26.1).`, { area: aid, lost: t - limit, kept: limit });
      }
    }
  }
  checkCitySupport(s);
}
