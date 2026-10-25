import { areaById } from '../../data/index.js';
import { inPlay, neighbors, player } from '../helpers.js';
import { isCoastal, isPlayer, setTokens } from '../primitives.js';
import type { GameState, PlayerId } from '../types.js';

export const VOLCANO_GROUPS: readonly (readonly string[])[] = [
  ['campania', 'neapolis'],
  ['milazzo', 'syracus'],
  ['thera'],
];

export const FLOOD_PLAINS: readonly (readonly string[])[] = [
  ['alexandria', 'tanis', 'memphis', 'fayum', 'upper-egypt'],
  ['mesopotamia', 'babylon', 'babylonia', 'sumeria', 'ur', 'charax', 'susa'],
  ['karachi', 'pala', 'port-dialx', 'mochendo-daro', 'shahi-tumo', 'chanhu-daro'],
  ['danube', 'moesia', 'thyras'],
  ['etruria-2', 'rubicon'],
  ['gaul', 'narbo'],
  ['herat', 'pura', 'artacona'],
  ['seistan-superior'],
];

export const floodPlainOf: ReadonlyMap<string, number> = new Map(
  FLOOD_PLAINS.flatMap((plain, i) => plain.map((a) => [a, i] as const))
);

const _floodRegions = new WeakMap<GameState, string[][]>();

export function floodRegions(s: GameState): string[][] {
  const cached = _floodRegions.get(s);
  if (cached) return cached;
  const fp = [...areaById.values()].filter((a) => a.isFloodplain && inPlay(s, a.id)).map((a) => a.id);
  const set = new Set(fp), seen = new Set<string>(), out: string[][] = [];
  for (const id of fp) {
    if (seen.has(id)) continue;
    const stack = [id], comp: string[] = [];
    seen.add(id);
    while (stack.length) {
      const x = stack.pop()!;
      comp.push(x);
      for (const n of neighbors(s, x)) {
        if (set.has(n) && !seen.has(n) && floodPlainOf.get(n) === floodPlainOf.get(x)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    out.push(comp);
  }
  _floodRegions.set(s, out);
  return out;
}

export function unitPointsInAreas(s: GameState, owner: PlayerId, areaIds: readonly string[]): number {
  let pts = 0;
  for (const aid of areaIds) {
    const a = s.areas[aid];
    if (!a) continue;
    pts += a.tokens[owner] ?? 0;
    if (a.city === owner) pts += 5;
  }
  return pts;
}

export function removeUnitPointsInAreas(s: GameState, owner: PlayerId, areaIds: readonly string[], points: number, cityWorth = 5): number {
  const before = unitPointsInAreas(s, owner, areaIds);
  let remaining = points;
  for (const aid of areaIds) {
    if (remaining <= 0) break;
    const t = s.areas[aid]?.tokens[owner] ?? 0;
    const take = Math.min(t, remaining);
    if (take > 0) { setTokens(s, aid, owner, t - take); player(s, owner).stock += take; remaining -= take; }
  }
  for (const aid of areaIds) {
    if (remaining <= 0) break;
    if (s.areas[aid]?.city === owner) { delete s.areas[aid]!.city; player(s, owner).citiesAvailable += 1; remaining -= cityWorth; }
  }
  return before - unitPointsInAreas(s, owner, areaIds);
}

export function eliminateOneCoastalCity(s: GameState, owner: PlayerId): boolean {
  for (const [aid, a] of Object.entries(s.areas)) {
    if (a.city === owner && isCoastal(s, aid)) { delete a.city; player(s, owner).citiesAvailable += 1; return true; }
  }
  return false;
}

export function destroyAllInAreas(s: GameState, areaIds: readonly string[]): void {
  for (const aid of areaIds) {
    const a = s.areas[aid];
    if (!a) continue;
    for (const [o, n] of Object.entries(a.tokens)) { if (n > 0 && isPlayer(s, o)) player(s, o).stock += n; delete a.tokens[o]; }
    if (a.city) { if (isPlayer(s, a.city)) player(s, a.city).citiesAvailable += 1; delete a.city; delete a.pirateCity; }
  }
}

export function boardUnitPoints(s: GameState, id: PlayerId): number {
  let pts = 0;
  for (const a of Object.values(s.areas)) {
    pts += a.tokens[id] ?? 0;
    if (a.city === id) pts += 5;
  }
  return pts;
}
