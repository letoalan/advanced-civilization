import { areaById } from '../../data/index.js';
import { cityCount, citySiteIn, neighbors, populationCount } from '../../engine/helpers.js';
import type { Action, GameState, PlayerId } from '../../engine/types.js';
import { rivalsIn, supportAfter, type Move } from './movementCombat.js';
import { defendCities, executeAttacks } from './movementAttacks.js';
import { overseas } from './shipsAndMisc.js';

export function planMovement(
  state: GameState,
  actor: PlayerId,
  aggressive: boolean,
  defensive: boolean,
): Action | null {
  const free: Record<string, number> = {};
  for (const [aid, a] of Object.entries(state.areas)) {
    const t = a.tokens[actor] ?? 0;
    if (t > 0 && !areaById.get(aid)?.isWater) free[aid] = t;
  }
  const after: Record<string, number> = { ...free };
  const moves: Move[] = [];
  const shift = (from: string, to: string, count: number, byShip = false) => {
    if (count <= 0) return;
    free[from] = (free[from] ?? 0) - count;
    after[from] = (after[from] ?? 0) - count;
    after[to] = (after[to] ?? 0) + count;
    const last = moves[moves.length - 1];
    if (!byShip && last && !last.byShip && last.from === from && last.to === to) last.count += count;
    else moves.push(byShip ? { from, to, count, byShip: true } : { from, to, count });
  };
  const sustains = (aid: string) => areaById.get(aid)?.sustains ?? 0;
  const land = (aid: string) => neighbors(state, aid).filter((n) => !areaById.get(n)?.isWater);
  const targets = new Set<string>();

  // 1. Ships.
  const sailed = new Set<string>();
  const p = state.players[actor]!;
  const range = 4 + (p.advances.includes('clothmaking') ? 1 : 0);
  const astro = p.advances.includes('astronomy');
  for (const [aid, a] of Object.entries(state.areas)) {
    if ((a.ships?.[actor] ?? 0) <= 0 || (free[aid] ?? 0) < 3) continue;
    let best: string | null = null,
      bestScore = 0;
    for (const to of overseas(state, aid, range, astro)) {
      const area = areaById.get(to);
      if (!area || area.isWater || (after[to] ?? 0) > 0 || rivalsIn(state, actor, to)) continue;
      const score = area.sustains + (citySiteIn(state, to) ? 3 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = to;
      }
    }
    if (best) {
      shift(aid, best, Math.min(5, free[aid]! - 2), true);
      sailed.add(aid);
    }
  }

  const metal = (id: string) => !!state.players[id]?.advances.includes('metalworking');
  const eng = (id: string) => !!state.players[id]?.advances.includes('engineering');
  const toStorm = (att: string, def: string) =>
    eng(att) && !eng(def) ? 6 : eng(def) && !eng(att) ? 8 : 7;

  // 2. Defence.
  if (defensive) {
    defendCities(state, actor, land, sustains, toStorm, metal, free, after, moves, shift, targets);
  }

  // 3. Cities.
  const pop = populationCount(state, actor);
  const cities = cityCount(state, actor);
  const open = (aid: string) =>
    !targets.has(aid) &&
    !areaById.get(aid)?.isWater &&
    !state.areas[aid]?.city &&
    !rivalsIn(state, actor, aid);
  const gatherable = (site: string) =>
    (after[site] ?? 0) +
    land(site).reduce((t, n) => t + (targets.has(n) ? 0 : Math.max(0, free[n] ?? 0)), 0);
  const areaIds = [...new Set([...Object.keys(state.areas), ...Object.keys(after)])];

  const tryGather = (site: string, need: number): boolean => {
    const snapFree = { ...free },
      snapAfter = { ...after },
      snapMoves = moves.map((m) => ({ ...m }));
    const donors = land(site)
      .filter((n) => !targets.has(n) && (free[n] ?? 0) > 0)
      .sort((x, y) => (after[y] ?? 0) - sustains(y) - ((after[x] ?? 0) - sustains(x)));
    for (const n of donors) {
      const short = need - (after[site] ?? 0);
      if (short <= 0) break;
      shift(n, site, Math.min(short, free[n]!));
    }
    if (
      (after[site] ?? 0) >= need &&
      supportAfter(state, actor, after, new Set([...targets, site])) >= 2 * (cities + targets.size + 1)
    ) {
      targets.add(site);
      free[site] = 0;
      return true;
    }
    Object.assign(free, snapFree);
    for (const k of Object.keys(after)) after[k] = snapAfter[k] ?? 0;
    moves.length = 0;
    moves.push(...snapMoves);
    return false;
  };

  while (targets.size < p.citiesAvailable && pop >= 8 * (targets.size + 1) + 2 * cities) {
    const sites = areaIds
      .filter((aid) => open(aid) && citySiteIn(state, aid) && gatherable(aid) >= 6)
      .sort((x, y) => (after[y] ?? 0) - (after[x] ?? 0));
    if (!sites.some((site) => tryGather(site, 6))) break;
  }
  if (targets.size === 0 && p.citiesAvailable > 0 && pop >= 30 + 2 * cities) {
    const fields = areaIds
      .filter((aid) => open(aid) && !citySiteIn(state, aid) && gatherable(aid) >= 12)
      .sort((x, y) => (after[y] ?? 0) - (after[x] ?? 0));
    fields.some((aid) => tryGather(aid, 12));
  }

  // 4. Attacks.
  if (aggressive) {
    executeAttacks(
      state, actor, land, sustains, toStorm, metal, eng, free, after, moves, shift, targets,
      areaIds, pop, cities, sailed, range, astro,
    );
  }

  // 5. Surplus.
  const dist = new Map<string, number>();
  let ring = areaIds.filter(
    (aid) =>
      (open(aid) && citySiteIn(state, aid)) ||
      (aggressive && !!state.areas[aid]?.city && state.areas[aid]!.city !== actor),
  );
  for (const aid of ring) dist.set(aid, 0);
  for (let d = 1; d <= 3 && ring.length; d++) {
    const next: string[] = [];
    for (const aid of ring) {
      for (const n of land(aid)) {
        if (!dist.has(n) && !rivalsIn(state, actor, n)) {
          dist.set(n, d);
          next.push(n);
        }
      }
    }
    ring = next;
  }

  for (const pass of ['seed', 'march', 'fill'] as const) {
    for (const aid of Object.keys(free)) {
      if (targets.has(aid) || state.areas[aid]?.city) continue;
      for (const n of land(aid)) {
        const excess = Math.min(free[aid] ?? 0, (after[aid] ?? 0) - sustains(aid));
        if (excess <= 0) break;
        if (targets.has(n) || state.areas[n]?.city || rivalsIn(state, actor, n) || sustains(n) <= 0) continue;
        if (pass === 'seed' && (after[n] ?? 0) === 0) shift(aid, n, 1);
        else if (pass === 'march' && (dist.get(aid) ?? 0) >= 2 && dist.get(n) === dist.get(aid)! - 1)
          shift(aid, n, excess);
        else if (pass === 'fill' && (after[n] ?? 0) > 0)
          shift(aid, n, Math.min(excess, sustains(n) - (after[n] ?? 0)));
      }
    }
  }

  return moves.length ? { type: 'move', moves } : null;
}
