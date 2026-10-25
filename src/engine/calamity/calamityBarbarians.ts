import { Rng } from 'digital-boardgame-framework';
import { areaById, civById, shipNeighbors } from '../../data/index.js';
import { inPlay, landNeighbors, player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, BARBARIAN, isPlayer } from '../primitives.js';
import { resolveAreaCombat } from '../phases/conflict.js';
import type { GameState, PlayerId } from '../types.js';

export function damageTo(s: GameState, aid: string, primary: PlayerId): number {
  const a = s.areas[aid];
  if (!a) return 0;
  return (a.tokens[primary] ?? 0) + (a.city === primary ? 5 : 0);
}

export function barbarianChooser(s: GameState, primary: PlayerId): PlayerId {
  const t = s.calamityTradedFrom['barbarianhordes'];
  if (t && t !== primary && isPlayer(s, t)) return t;
  return [...s.seating].sort((a, b) => player(s, b).stock - player(s, a).stock)[0]!;
}

export function barbarianNeighbors(s: GameState, aid: string): string[] {
  const out = new Set(landNeighbors(s, aid));
  for (const hop of shipNeighbors.get(aid) ?? []) {
    if (!areaById.get(hop.to)?.isWater && inPlay(s, hop.to)) out.add(hop.to);
  }
  return [...out];
}

export function marchBarbarianStep(s: GameState, here: string, next: string, surplus: number, limit: number, rng: Rng): void {
  s.areas[here]!.tokens[BARBARIAN] = limit;
  (s.areas[next] ??= { tokens: {} }).tokens[BARBARIAN] = (s.areas[next]!.tokens[BARBARIAN] ?? 0) + surplus;
  log(s, 'calamity.barbarians.march', null, `Barbarians march from ${areaName(here)} to ${areaName(next)} (${surplus})${limit > 0 ? `; ${limit} stay in ${areaName(here)}, its population limit (§30.5231)` : ''}.`, { calamity: 'barbarianhordes', from: here, to: next, count: surplus, stay: limit });
  resolveAreaCombat(s, next, rng);
}

export function stepsTowardVictim(s: GameState, here: string, primary: PlayerId): string[] {
  const dist = new Map<string, number>();
  const queue: string[] = [];
  for (const aid of Object.keys(s.areas)) {
    if (aid !== here && inPlay(s, aid) && !areaById.get(aid)?.isWater && damageTo(s, aid, primary) > 0) {
      dist.set(aid, 0);
      queue.push(aid);
    }
  }
  for (let i = 0; i < queue.length; i++) {
    const x = queue[i]!;
    for (const n of barbarianNeighbors(s, x)) {
      if (!dist.has(n)) {
        dist.set(n, dist.get(x)! + 1);
        queue.push(n);
      }
    }
  }
  const d = dist.get(here);
  if (d === undefined) return [];
  return barbarianNeighbors(s, here).filter((n) => dist.get(n) === d - 1);
}

export function marchBarbarians(s: GameState, primary: PlayerId, start: string, visited: Set<string>, rng: Rng, before: unknown, overviewBefore: string): boolean {
  let here = start, guard = 0;
  while (guard++ < 200) {
    const barbs = s.areas[here]!.tokens[BARBARIAN] ?? 0;
    const limit = areaById.get(here)?.sustains ?? 0;
    const surplus = barbs - limit;
    if (surplus <= 0 || barbs <= 0) break;
    const dests = barbarianNeighbors(s, here).filter((n) => !visited.has(n));
    const best = dests.length ? Math.max(...dests.map((d) => damageTo(s, d, primary))) : 0;
    const tied = best > 0 ? dests.filter((d) => damageTo(s, d, primary) === best) : stepsTowardVictim(s, here, primary);
    if (tied.length === 0) {
      s.areas[here]!.tokens[BARBARIAN] = limit;
      if (limit <= 0) delete s.areas[here]!.tokens[BARBARIAN];
      break;
    }
    if (tied.length > 1) {
      s.rngState = rng.serialize();
      s.pendingPick = { chooser: barbarianChooser(s, primary), stage: 'barbarian', victim: primary, count: 1, candidates: tied, march: { here, visited: [...visited] }, before: before as any, overviewBefore };
      return true;
    }
    marchBarbarianStep(s, here, tied[0]!, surplus, limit, rng);
    here = tied[0]!;
    visited.add(here);
  }
  return false;
}

export function startBarbarians(s: GameState, primary: PlayerId, before: unknown, overviewBefore: string, rng: Rng): boolean {
  if (primary === 'crete') {
    log(s, 'calamity.barbarians', primary, `Crete is immune to Barbarian Hordes (§30.527).`, { calamity: 'barbarianhordes', immune: true });
    return false;
  }
  const startAreas = (civById.get(primary)?.startAreas ?? []).filter((aid) => areaById.has(aid) && inPlay(s, aid));
  if (startAreas.length === 0) {
    log(s, 'calamity.barbarians', primary, `${primary} has no start area for Barbarians to land.`, { calamity: 'barbarianhordes', noEffect: true });
    return false;
  }
  const occupied = startAreas.filter((aid) => damageTo(s, aid, primary) > 0);
  const pool = occupied.length ? occupied : startAreas;
  const best = Math.max(...pool.map((aid) => damageTo(s, aid, primary)));
  const tied = pool.filter((aid) => damageTo(s, aid, primary) === best);
  if (tied.length > 1) {
    s.pendingPick = { chooser: barbarianChooser(s, primary), stage: 'barbarian', victim: primary, count: 1, candidates: tied, march: { here: null, visited: [] }, before: before as any, overviewBefore };
    return true;
  }
  const landing = tied[0]!;
  (s.areas[landing] ??= { tokens: {} }).tokens[BARBARIAN] = (s.areas[landing]!.tokens[BARBARIAN] ?? 0) + 15;
  log(s, 'calamity.barbarians.land', null, `Barbarian Hordes (15) descend on ${areaName(landing)}.`, { calamity: 'barbarianhordes', area: landing, count: 15 });
  resolveAreaCombat(s, landing, rng);
  if (marchBarbarians(s, primary, landing, new Set([landing]), rng, before, overviewBefore)) return true;
  log(s, 'calamity.barbarians', primary, `${primary} is ravaged by Barbarian Hordes.`, { calamity: 'barbarianhordes' });
  return false;
}
