import { areaName, citiesOf, coastalCitiesOf, has, isPlayer, PIRATE } from '../primitives.js';
import { cityCount, neighbors, player, populationCount } from '../helpers.js';
import { log } from '../logging.js';
import { reduceForSupport, reduceSpecificCity } from '../phases/surplus.js';
import {
  destroyAllInAreas,
  floodRegions,
  unitPointsInAreas,
  VOLCANO_GROUPS,
} from './calamityGeography.js';
import type { GameState, PendingAllocation, PlayerId } from '../types.js';

export type AllocationSpec = Omit<PendingAllocation, 'before' | 'overviewBefore'>;

export function volcanoDamage(s: GameState, g: readonly string[]): number {
  return g.reduce((m, aid) => {
    const a = s.areas[aid];
    if (!a) return m;
    let pts = 0;
    for (const [o, n] of Object.entries(a.tokens)) if (isPlayer(s, o)) pts += n;
    if (a.city && isPlayer(s, a.city)) pts += 5;
    return m + pts;
  }, 0);
}

export function enemyCityNear(s: GameState, holder: PlayerId, aid: string): string | undefined {
  return neighbors(s, aid).find((n) => {
    const c = s.areas[n]?.city;
    return !!c && c !== holder && isPlayer(s, c) && !has(player(s, c), 'engineering');
  });
}

export function resolveEruption(s: GameState, holder: PlayerId, group: readonly string[]): void {
  destroyAllInAreas(s, group);
  log(s, 'calamity.volcano', holder, `${holder} suffers a Volcanic Eruption — all units in ${group.map(areaName).join(' & ')} are destroyed (§30.211).`, { calamity: 'volcano', areas: [...group] });
}

export function resolveEarthquake(s: GameState, holder: PlayerId, target: string): void {
  const eng = has(player(s, holder), 'engineering');
  if (eng) {
    reduceSpecificCity(s, holder, target);
    log(s, 'calamity.earthquake', holder, `${holder} suffers an Earthquake — Engineering reduces the city in ${areaName(target)} (§30.213).`, { calamity: 'earthquake', area: target, reduced: true });
  } else {
    delete s.areas[target]!.city;
    player(s, holder).citiesAvailable += 1;
    log(s, 'calamity.earthquake', holder, `${holder} suffers an Earthquake — the city in ${areaName(target)} is destroyed (§30.212).`, { calamity: 'earthquake', area: target, destroyed: true });
  }
  const victimArea = enemyCityNear(s, holder, target);
  if (victimArea) {
    const o = s.areas[victimArea]!.city!;
    reduceSpecificCity(s, o, victimArea);
    log(s, 'calamity.earthquake.secondary', o, `${o}'s city in ${areaName(victimArea)} is reduced by the Earthquake (§30.212).`, { calamity: 'earthquake', area: victimArea });
  }
}

export function startVolcano(s: GameState, holder: PlayerId, before: unknown, overviewBefore: string): boolean {
  const erupting = VOLCANO_GROUPS.filter((g) => g.some((aid) => s.areas[aid]?.city === holder));
  if (erupting.length) {
    const best = Math.max(...erupting.map((g) => volcanoDamage(s, g)));
    const tied = erupting.filter((g) => volcanoDamage(s, g) === best);
    if (tied.length > 1) {
      s.pendingPick = { chooser: holder, stage: 'volcanoSite', victim: holder, count: 1, candidates: tied.map((g) => g[0]!), before: before as any, overviewBefore };
      return true;
    }
    resolveEruption(s, holder, tied[0]!);
    return false;
  }
  const myCities = Object.keys(s.areas).filter((aid) => s.areas[aid]!.city === holder);
  if (myCities.length === 0) {
    log(s, 'calamity.earthquake', holder, `${holder} suffers an Earthquake but holds no city to damage.`, { calamity: 'earthquake', noEffect: true });
    return false;
  }
  const dmg = (aid: string) => (enemyCityNear(s, holder, aid) ? 5 : 0);
  const best = Math.max(...myCities.map(dmg));
  const tied = myCities.filter((aid) => dmg(aid) === best);
  if (tied.length > 1) {
    s.pendingPick = { chooser: holder, stage: 'earthquakeSite', victim: holder, count: 1, candidates: tied, before: before as any, overviewBefore };
    return true;
  }
  resolveEarthquake(s, holder, tied[0]!);
  return false;
}

export function bestFloodRegion(s: GameState, holder: PlayerId): string[] | null {
  let best: string[] | null = null, bestPts = 0;
  for (const region of floodRegions(s)) {
    const pts = unitPointsInAreas(s, holder, region);
    if (pts > bestPts) { bestPts = pts; best = region; }
  }
  return best;
}

export function floodAllocationSpec(s: GameState, holder: PlayerId, region: string[]): AllocationSpec | null {
  const trader = s.calamityTradedFrom['flood'];
  const caps: Record<PlayerId, number> = {};
  for (const v of s.seating) {
    if (v === holder || v === trader) continue;
    const onPlain = unitPointsInAreas(s, v, region);
    if (onPlain <= 0) continue;
    caps[v] = Math.min(onPlain, has(player(s, v), 'engineering') ? 7 : 10);
  }
  return Object.keys(caps).length ? { calamityId: 'flood', holder, kind: 'unitPoints', pool: 10, caps, cityWorth: 5 } : null;
}

export function startSlaveRevolt(s: GameState, holder: PlayerId, before: unknown, overviewBefore: string): boolean {
  const p = player(s, holder);
  const nominal = Math.max(0, 15 + (has(p, 'mining') ? 5 : 0) - (has(p, 'enlightenment') ? 5 : 0));
  const lock = Math.min(nominal, populationCount(s, holder));
  log(s, 'calamity.slaverevolt', holder, `${holder} suffers Slave Revolt: ${lock} tokens withheld from city support (§30.42).`, { calamity: 'slaverevolt', withheld: lock });
  return reduceForSupport(s, holder, lock, { mode: 'slaverevolt', before, overviewBefore });
}

export function primaryCityCount(s: GameState, calId: string, holder: PlayerId): number | null {
  const p = player(s, holder);
  if (calId === 'superstition') {
    if (has(p, 'enlightenment')) return 0;
    if (has(p, 'deism')) return 1;
    if (has(p, 'mysticism')) return 2;
    return 3;
  }
  if (calId === 'civildisorder') {
    const cities = cityCount(s, holder);
    let r = Math.max(0, cities - 3);
    r -= (has(p, 'music') ? 1 : 0) + (has(p, 'drama') ? 1 : 0) + (has(p, 'law') ? 1 : 0) + (has(p, 'democracy') ? 1 : 0);
    r += (has(p, 'military') ? 1 : 0) + (has(p, 'roadbuilding') ? 1 : 0);
    return Math.max(0, Math.min(r, cities));
  }
  if (calId === 'iconoclasm') {
    let n = 4;
    if (has(p, 'law')) n -= 1;
    if (has(p, 'philosophy')) n -= 1;
    if (has(p, 'theology')) n -= 3;
    if (has(p, 'monotheism')) n += 1;
    if (has(p, 'roadbuilding')) n += 1;
    return Math.max(0, n);
  }
  return null;
}

export function razeCityToPirate(s: GameState, aid: string): void {
  const a = s.areas[aid];
  if (!a || !a.city || !isPlayer(s, a.city)) return;
  player(s, a.city).citiesAvailable += 1;
  delete a.city; a.city = PIRATE; a.pirateCity = true;
  log(s, 'calamity.piracy.raze', null, `The city in ${areaName(aid)} is taken by pirates (§30.91).`, { calamity: 'piracy', area: aid });
}

export function startTreachery(s: GameState, victim: PlayerId, before: unknown, overviewBefore: string): boolean {
  const cities = citiesOf(s, victim);
  if (!cities.length) {
    log(s, 'calamity.treachery', victim, `${victim} suffers Treachery but holds no city.`, { calamity: 'treachery', noEffect: true });
    return false;
  }
  const t = s.calamityTradedFrom['treachery'];
  const trader = t && t !== victim && isPlayer(s, t) ? t : undefined;
  s.pendingPick = { chooser: trader ?? victim, stage: 'treachery', victim, trader, count: 1, candidates: cities, before: before as any, overviewBefore };
  return true;
}

export function startFloodCity(s: GameState, victim: PlayerId, before: unknown, overviewBefore: string): boolean {
  const cities = coastalCitiesOf(s, victim);
  if (!cities.length) {
    log(s, 'calamity.flood', victim, `${victim} is unaffected by Flood (no units on a flood plain).`, { calamity: 'flood', noEffect: true });
    return false;
  }
  s.pendingPick = { chooser: victim, stage: 'floodCity', victim, count: 1, candidates: cities, before: before as any, overviewBefore };
  return true;
}

export function startPiracy(s: GameState, victim: PlayerId, before: unknown, overviewBefore: string): boolean {
  const t = s.calamityTradedFrom['piracy'];
  const trader = t && t !== victim && isPlayer(s, t) ? t : undefined;
  const cities = coastalCitiesOf(s, victim);
  if (cities.length) {
    s.pendingPick = { chooser: trader ?? victim, stage: 'piracyPrimary', victim, trader, count: Math.min(2, cities.length), candidates: cities, before: before as any, overviewBefore };
    return true;
  }
  return setupPiracySecondary(s, victim, trader, before, overviewBefore);
}

export function setupPiracySecondary(s: GameState, victim: PlayerId, trader: PlayerId | undefined, before: unknown, overviewBefore: string): boolean {
  const candidates: string[] = [];
  for (const o of s.seating) {
    if (o === victim || o === trader) continue;
    candidates.push(...coastalCitiesOf(s, o));
  }
  if (!candidates.length) return false;
  const owners = new Set(candidates.map((a) => s.areas[a]!.city));
  s.pendingPick = { chooser: victim, stage: 'piracySecondary', victim, trader, count: Math.min(2, owners.size), candidates, before: before as any, overviewBefore };
  return true;
}
