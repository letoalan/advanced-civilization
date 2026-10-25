import {
  adjacency,
  areaById,
  shipNeighbors,
} from '../../data/index.js';
import type { GameState } from '../types.js';
import { hasCitySite, outOfPlaySet } from '../boards.js';

const EMPTY_SET: ReadonlySet<string> = new Set();
const outCache = new WeakMap<GameState, ReadonlySet<string>>();

/** The area ids out of play for this game (empty for older saves / full map). */
export function outOfPlay(s: GameState | null | undefined): ReadonlySet<string> {
  if (!s?.board) return EMPTY_SET;
  let v = outCache.get(s);
  if (!v) {
    v = outOfPlaySet(s.board);
    outCache.set(s, v);
  }
  return v;
}

export function inPlay(s: GameState | null | undefined, areaId: string): boolean {
  return !outOfPlay(s).has(areaId);
}

/** §16.11/§16.8: does the area count as having a city site in this game? */
export function citySiteIn(s: GameState | null | undefined, areaId: string): boolean {
  return hasCitySite(s?.board, areaId);
}

export function neighbors(s: GameState | null | undefined, areaId: string): string[] {
  const out = outOfPlay(s);
  if (out.has(areaId)) return [];
  return (adjacency[areaId] ?? []).filter((n) => !out.has(n));
}

export function landNeighbors(s: GameState | null | undefined, areaId: string): string[] {
  return neighbors(s, areaId).filter((n) => !areaById.get(n)?.isWater);
}

/** Ship-voyage BFS over the §23.52 ship-move graph. */
export function shipReachable(
  s: GameState | null | undefined,
  start: string,
  range: number,
  astronomy: boolean,
): Map<string, string[]> {
  const out = outOfPlay(s);
  const found = new Map<string, string[]>();
  if (out.has(start) || !areaById.get(start)) return found;

  const seen = new Set<string>([`${start}|*`]);
  let frontier: { area: string; side: string | null; path: string[] }[] = [{ area: start, side: null, path: [] }];

  for (let depth = 1; depth <= range && frontier.length; depth++) {
    const next: typeof frontier = [];
    for (const cur of frontier) {
      for (const hop of shipNeighbors.get(cur.area) ?? []) {
        if (cur.path.length > 0 && cur.side != null && hop.side != null && hop.side !== cur.side) continue;
        const a = areaById.get(hop.to);
        if (!a || out.has(hop.to)) continue;
        if (a.isOpenSea && !astronomy) continue;
        const key = `${hop.to}|${hop.toSide ?? '*'}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const path = [...cur.path, hop.to];
        if (!a.isOpenSea && !found.has(hop.to)) found.set(hop.to, path);
        next.push({ area: hop.to, side: hop.toSide, path });
      }
    }
    frontier = next;
  }
  found.delete(start);
  return found;
}

/** Coastal LAND areas a ship at `start` can sail to (§23.5). */
export function navalDestinations(
  s: GameState | null | undefined,
  start: string,
  range: number,
  astronomy: boolean,
): Set<string> {
  const dests = new Set<string>();
  for (const [dest] of shipReachable(s, start, range, astronomy)) {
    if (!areaById.get(dest)?.isWater) dests.add(dest);
  }
  return dests;
}
