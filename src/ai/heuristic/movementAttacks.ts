import { areaById } from '../../data/index.js';
import { cityCount, navalDestinations } from '../../engine/helpers.js';
import type { GameState, PlayerId } from '../../engine/types.js';
import { BARBARIAN, fight, supportAfter, type Move } from './movementCombat.js';

export function defendCities(
  state: GameState,
  actor: PlayerId,
  land: (aid: string) => string[],
  sustains: (aid: string) => number,
  toStorm: (att: string, def: string) => number,
  metal: (id: string) => boolean,
  free: Record<string, number>,
  after: Record<string, number>,
  moves: Move[],
  shift: (from: string, to: string, count: number, byShip?: boolean) => void,
  targets: Set<string>,
): void {
  const acted = new Set(state.actedThisPhase);
  for (const [aid, a] of Object.entries(state.areas)) {
    if (a.city !== actor) continue;
    const donors = land(aid).filter((n) => !state.areas[n]?.city && (free[n] ?? 0) > 1);
    let need = 0;
    for (const foe of Object.keys(state.players)) {
      if (foe === actor) continue;
      const threat =
        (a.tokens[foe] ?? 0) +
        (acted.has(foe)
          ? 0
          : land(aid).reduce(
              (t, n) => t + Math.max(0, (state.areas[n]?.tokens[foe] ?? 0) - 1),
              0,
            ));
      const req = toStorm(foe, actor);
      if (threat < req) continue;
      let d = after[aid] ?? 0;
      while (d < 8 && fight(threat, d, 0, metal(foe), metal(actor))[0] >= req) d++;
      need = Math.max(need, d - (after[aid] ?? 0));
    }
    const spare = donors.reduce((t, n) => t + free[n]! - 1, 0);
    if (need <= 0 || need > 5 || spare < need) continue;
    const snapFree = { ...free },
      snapAfter = { ...after },
      snapMoves = moves.map((m) => ({ ...m }));
    donors.sort((x, y) => (after[y] ?? 0) - sustains(y) - ((after[x] ?? 0) - sustains(x)));
    let left = need;
    for (const n of donors) {
      if (left <= 0) break;
      const k = Math.min(left, free[n]! - 1);
      shift(n, aid, k);
      left -= k;
    }
    if (supportAfter(state, actor, after, targets) >= 2 * cityCount(state, actor)) {
      free[aid] = 0;
      continue;
    }
    Object.assign(free, snapFree);
    for (const k of Object.keys(after)) after[k] = snapAfter[k] ?? 0;
    moves.length = 0;
    moves.push(...snapMoves);
  }
}

export function executeAttacks(
  state: GameState,
  actor: PlayerId,
  land: (aid: string) => string[],
  sustains: (aid: string) => number,
  toStorm: (att: string, def: string) => number,
  metal: (id: string) => boolean,
  eng: (id: string) => boolean,
  free: Record<string, number>,
  after: Record<string, number>,
  moves: Move[],
  shift: (from: string, to: string, count: number, byShip?: boolean) => void,
  targets: Set<string>,
  areaIds: string[],
  pop: number,
  cities: number,
  sailed: Set<string>,
  range: number,
  astro: boolean,
): void {
  const stormed = new Set<string>();
  const leader = (id: string) =>
    state.players[id] ? cityCount(state, id) * 10 + state.players[id]!.astSpace : 0;
  const rivalCities = areaIds
    .filter((aid) => {
      const a = state.areas[aid];
      return !!a?.city && a.city !== actor && Object.entries(a.tokens).every(([o, n]) => o === a.city || n <= 0);
    })
    .sort((x, y) => leader(state.areas[y]!.city!) - leader(state.areas[x]!.city!));

  for (const aid of rivalCities) {
    if (stormed.size >= 2) break;
    const def = state.areas[aid]!.city!;
    const pirate = !state.players[def];
    const required = pirate ? (eng(actor) ? 6 : 7) : toStorm(actor, def);
    const defenders = state.areas[aid]!.tokens[def] ?? 0;
    let force = required;
    while (force < 20 && fight(force, defenders, 0, metal(actor), metal(def))[0] < required) force++;
    const donors = land(aid).filter((n) => !targets.has(n) && !state.areas[n]?.city && (free[n] ?? 0) > 1);
    const fleets = Object.keys(state.areas).filter(
      (x) =>
        (state.areas[x]!.ships?.[actor] ?? 0) > 0 &&
        !sailed.has(x) &&
        !donors.includes(x) &&
        (free[x] ?? 0) > 1 &&
        navalDestinations(state, x, range, astro).has(aid),
    );
    const landSpare = donors.reduce((t, n) => t + free[n]! - 1, 0);
    const spare = landSpare + fleets.reduce((t, x) => t + Math.min(5, free[x]! - 1), 0);
    if (spare < force || pop < force + 4 + 2 * (cities + targets.size)) continue;
    const snapFree = { ...free },
      snapAfter = { ...after },
      snapMoves = moves.map((m) => ({ ...m }));
    const snapSailed = new Set(sailed);
    donors.sort((x, y) => (after[y] ?? 0) - sustains(y) - ((after[x] ?? 0) - sustains(x)));
    for (const n of donors) {
      const short = force - (after[aid] ?? 0);
      if (short <= 0) break;
      shift(n, aid, Math.min(short, free[n]! - 1));
    }
    for (const x of fleets) {
      const short = force - (after[aid] ?? 0);
      if (short <= 0) break;
      shift(x, aid, Math.min(short, 5, free[x]! - 1), true);
      sailed.add(x);
    }
    if (supportAfter(state, actor, after, targets) >= 2 * (cities + targets.size)) {
      stormed.add(aid);
      free[aid] = 0;
      continue;
    }
    sailed.clear();
    for (const x of snapSailed) sailed.add(x);
    Object.assign(free, snapFree);
    for (const k of Object.keys(after)) after[k] = snapAfter[k] ?? 0;
    moves.length = 0;
    moves.push(...snapMoves);
  }

  let barbFights = 0;
  for (const aid of areaIds) {
    const a = state.areas[aid];
    if (!a || a.city || areaById.get(aid)?.isWater || sustains(aid) < 1) continue;
    const foes = Object.entries(a.tokens).filter(([o, n]) => o !== actor && n > 0);
    if (foes.length !== 1) continue;
    const [foe, r] = foes[0]!;
    const barbarian = foe === BARBARIAN;
    if (barbarian && barbFights >= 2) continue;
    const surplus = (n: string) => Math.max(0, Math.min(free[n] ?? 0, (after[n] ?? 0) - sustains(n)));
    const usable = (n: string) => (barbarian ? Math.max(0, (free[n] ?? 0) - 1, surplus(n)) : surplus(n));
    const donors = land(aid)
      .filter((n) => !targets.has(n) && !stormed.has(n) && !state.areas[n]?.city && usable(n) > 0)
      .sort((x, y) => surplus(y) - surplus(x));
    const pool = donors.reduce((t, n) => t + usable(n), 0);
    let force = 0;
    for (let f = 1; f <= pool; f++) {
      const [mine, theirs] = fight(f, r, sustains(aid), metal(actor), metal(foe));
      if (theirs === 0 && mine > 0) {
        force = f;
        break;
      }
    }
    if (!force) continue;
    const snapFree = { ...free },
      snapAfter = { ...after },
      snapMoves = moves.map((m) => ({ ...m }));
    for (const n of donors) {
      const short = force - (after[aid] ?? 0);
      if (short <= 0) break;
      shift(n, aid, Math.min(short, usable(n)));
    }
    if (!barbarian || supportAfter(state, actor, after, targets) >= 2 * (cities + targets.size)) {
      free[aid] = 0;
      if (barbarian) barbFights++;
      continue;
    }
    Object.assign(free, snapFree);
    for (const k of Object.keys(after)) after[k] = snapAfter[k] ?? 0;
    moves.length = 0;
    moves.push(...snapMoves);
  }
}
