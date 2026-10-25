// Système de sélection nommée des cités et pertes de calamités
import { Rng } from 'digital-boardgame-framework';
import { areaById } from '../../data/index.js';
import { player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, BARBARIAN, has, isPlayer } from '../primitives.js';
import { victoryScore } from '../phases/ast.js';
import { resolveAreaCombat } from '../phases/conflict.js';
import { setupPopulationExpansion } from '../phases/expansion.js';
import { areaLimitFor, markCityAcquired, reduceSpecificCity } from '../phases/surplus.js';
import { resolvePendingRevolts } from '../phases/taxation.js';
import { marchBarbarianStep, marchBarbarians } from './calamityBarbarians.js';
import { type AreaSnapshot } from './calamityEvents.js';
import { VOLCANO_GROUPS } from './calamityGeography.js';
import {
  razeCityToPirate,
  resolveEarthquake,
  resolveEruption,
  setupPiracySecondary,
} from './calamityPrimary.js';
import type { GameState, PendingPick, PlayerId } from '../types.js';

export function requiredPickCount(_s: GameState, pk: PendingPick): number {
  if (pk.stage === 'piracySecondary') return Math.min(pk.count, new Set(pk.candidates.map((a) => _s.areas[a]!.city)).size);
  return Math.min(pk.count, pk.candidates.length);
}

export function suggestPick(s: GameState, pk: PendingPick): string[] {
  const need = requiredPickCount(s, pk);
  const selfLoss = pk.chooser === pk.victim && pk.stage !== 'piracySecondary';
  if (pk.stage === 'piracySecondary') {
    const byOwner = new Map<PlayerId, string[]>();
    for (const a of pk.candidates) {
      const o = s.areas[a]!.city as PlayerId;
      (byOwner.get(o) ?? byOwner.set(o, []).get(o)!).push(a);
    }
    const owners = [...byOwner.keys()].sort((x, y) => victoryScore(s, y) - victoryScore(s, x));
    return owners.slice(0, need).map((o) => byOwner.get(o)![0]!);
  }
  return [...pk.candidates].sort((x, y) => {
    const sx = areaById.get(x)?.isCitySite ? 0 : 1, sy = areaById.get(y)?.isCitySite ? 0 : 1;
    return selfLoss ? sx - sy : sy - sx;
  }).slice(0, need);
}

export function validatePick(s: GameState, pk: PendingPick, areas: string[]): void {
  const need = requiredPickCount(s, pk);
  if (areas.length !== need) throw new Error(`pick exactly ${need} cit${need === 1 ? 'y' : 'ies'} (§30)`);
  for (const aid of areas) if (!pk.candidates.includes(aid)) throw new Error(`${areaName(aid)} is not a valid choice here`);
  if (pk.stage === 'piracySecondary') {
    const owners = areas.map((a) => s.areas[a]!.city);
    if (new Set(owners).size !== owners.length) throw new Error('each secondary victim may lose only one city (§30.912)');
  }
}

export interface PickResolution {
  calamityId: string;
  victim: PlayerId;
  before: AreaSnapshot;
  overviewBefore: string;
}

export function applyPick(s: GameState, pk: PendingPick, areas: string[]): PickResolution | null {
  const { victim, trader } = pk;
  if (pk.stage === 'taxRevolt') {
    for (const aid of areas) {
      if (s.areas[aid]?.city !== victim) continue;
      delete s.areas[aid]!.city; player(s, victim).citiesAvailable += 1;
      s.areas[aid]!.city = pk.chooser; player(s, pk.chooser).citiesAvailable -= 1; markCityAcquired(s, pk.chooser, aid);
      log(s, 'city.takeover', pk.chooser, `The revolting city in ${areaName(aid)} is taken over by ${pk.chooser} (§19.32).`, { area: aid, from: victim });
    }
    if (s.pendingRevolts) s.pendingRevolts[victim] = Math.max(0, (s.pendingRevolts[victim] ?? 0) - areas.length);
    s.pendingPick = undefined;
    if (resolvePendingRevolts(s)) return null;
    setupPopulationExpansion(s);
    return null;
  }
  const before = pk.before! as AreaSnapshot, overviewBefore = pk.overviewBefore!;
  if (pk.stage === 'treachery') {
    const aid = areas[0]!; const a = s.areas[aid]!;
    delete a.city; player(s, victim).citiesAvailable += 1;
    if (trader && player(s, trader).citiesAvailable > 0) {
      a.city = trader; player(s, trader).citiesAvailable -= 1; markCityAcquired(s, trader, aid);
      log(s, 'calamity.treachery', victim, `${victim} suffers Treachery: the city in ${areaName(aid)} defects to ${trader} (§30.221).`, { calamity: 'treachery', area: aid, defectsTo: trader });
    } else if (trader) {
      log(s, 'calamity.treachery', victim, `${victim} suffers Treachery: the city in ${areaName(aid)} is destroyed — ${trader} had no city to install (§30.221).`, { calamity: 'treachery', area: aid, destroyed: true });
    } else {
      const place = Math.min(areaLimitFor(s, aid, victim), player(s, victim).stock);
      if (place > 0) { a.tokens[victim] = (a.tokens[victim] ?? 0) + place; player(s, victim).stock -= place; }
      log(s, 'calamity.treachery', victim, `${victim} suffers Treachery: the city in ${areaName(aid)} is reduced (§30.222).`, { calamity: 'treachery', area: aid, reduced: true });
    }
    return { calamityId: 'treachery', victim, before, overviewBefore };
  }
  if (pk.stage === 'floodCity') {
    const aid = areas[0]!;
    if (has(player(s, victim), 'engineering')) {
      reduceSpecificCity(s, victim, aid);
      log(s, 'calamity.flood', victim, `${victim}'s Flood reduces the coastal city in ${areaName(aid)} (Engineering, §30.515).`, { calamity: 'flood', area: aid, reduced: true });
    } else {
      delete s.areas[aid]!.city; player(s, victim).citiesAvailable += 1;
      log(s, 'calamity.flood', victim, `${victim} loses the coastal city in ${areaName(aid)} to Flood (§30.514).`, { calamity: 'flood', area: aid, destroyed: true });
    }
    return { calamityId: 'flood', victim, before, overviewBefore };
  }
  if (pk.stage === 'barbarian') {
    const rng = Rng.fromState(s.rngState);
    const chosen = areas[0]!; const m = pk.march!; const vis = new Set(m.visited);
    s.pendingPick = undefined;
    if (m.here === null) {
      (s.areas[chosen] ??= { tokens: {} }).tokens[BARBARIAN] = (s.areas[chosen]!.tokens[BARBARIAN] ?? 0) + 15;
      log(s, 'calamity.barbarians.land', null, `Barbarian Hordes (15) descend on ${areaName(chosen)}.`, { calamity: 'barbarianhordes', area: chosen, count: 15 });
      resolveAreaCombat(s, chosen, rng);
    } else {
      const barbs = s.areas[m.here]!.tokens[BARBARIAN] ?? 0;
      const limit = areaById.get(m.here)?.sustains ?? 0;
      marchBarbarianStep(s, m.here, chosen, barbs - limit, limit, rng);
    }
    vis.add(chosen);
    const paused = marchBarbarians(s, victim, chosen, vis, rng, before, overviewBefore);
    s.rngState = rng.serialize();
    if (paused) return null;
    log(s, 'calamity.barbarians', victim, `${victim} is ravaged by Barbarian Hordes.`, { calamity: 'barbarianhordes' });
    return { calamityId: 'barbarianhordes', victim, before, overviewBefore };
  }
  if (pk.stage === 'volcanoSite') {
    const group = VOLCANO_GROUPS.find((g: readonly string[]) => g.includes(areas[0]!)) ?? [areas[0]!];
    resolveEruption(s, victim, group);
    return { calamityId: 'volcano', victim, before, overviewBefore };
  }
  if (pk.stage === 'earthquakeSite') {
    resolveEarthquake(s, victim, areas[0]!);
    return { calamityId: 'volcano', victim, before, overviewBefore };
  }
  for (const aid of areas) razeCityToPirate(s, aid);
  if (pk.stage === 'piracyPrimary') {
    s.pendingPick = undefined;
    if (setupPiracySecondary(s, victim, trader, before, overviewBefore)) return null;
  }
  return { calamityId: 'piracy', victim, before, overviewBefore };
}
