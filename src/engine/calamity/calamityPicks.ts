import { areaById, calamityById } from '../../data/index.js';
import { player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, has, removeTokensFromBoard, setTokens } from '../primitives.js';
import { areaLimitFor, reduceSpecificCity } from '../phases/surplus.js';
import { victoryScore } from '../phases/ast.js';
import { unitInventory } from './calamityCivilWar.js';
import type { GameState, PendingAllocation, PendingUnitLoss, PlayerId, SecondaryLoss } from '../types.js';

export function maxAllocatable(a: PendingAllocation): number {
  return Math.min(a.pool, Object.values(a.caps).reduce((t, c) => t + c, 0));
}

export function suggestAllocation(s: GameState, a: PendingAllocation): Record<PlayerId, number> {
  const out: Record<PlayerId, number> = {};
  let left = maxAllocatable(a);
  const order = Object.keys(a.caps).sort((x, y) => victoryScore(s, y) - victoryScore(s, x));
  for (const v of order) {
    if (left <= 0) break;
    const take = Math.min(a.caps[v]!, left);
    if (take > 0) { out[v] = take; left -= take; }
  }
  return out;
}

export function validateAllocation(a: PendingAllocation, allocation: Record<PlayerId, number>): void {
  let sum = 0;
  for (const [v, amt] of Object.entries(allocation)) {
    if (!Number.isInteger(amt) || amt < 0) throw new Error(`bad allocation amount for ${v}`);
    if (amt === 0) continue;
    if (!(v in a.caps)) throw new Error(`${v} is not an eligible secondary victim`);
    if (amt > a.caps[v]!) throw new Error(`${v} can lose at most ${a.caps[v]} (§30)`);
    sum += amt;
  }
  if (sum !== maxAllocatable(a)) throw new Error(`must direct ${maxAllocatable(a)} (got ${sum}) — §29.64`);
}

export function secondaryLossesFromAllocation(s: GameState, a: PendingAllocation, allocation: Record<PlayerId, number>): SecondaryLoss[] {
  const out: SecondaryLoss[] = [];
  for (const [v, amt] of Object.entries(allocation)) {
    if (amt <= 0) continue;
    if (a.kind === 'cities') {
      out.push({ victim: v, kind: 'cities', amount: amt, cityWorth: a.cityWorth });
    } else {
      let actual = amt;
      if (a.calamityId === 'epidemic') {
        if (has(player(s, v), 'medicine')) actual -= 5;
        if (has(player(s, v), 'roadbuilding')) actual += 5;
      }
      out.push({ victim: v, kind: 'unitPoints', amount: Math.max(0, actual), cityWorth: a.cityWorth, areas: a.areas });
    }
  }
  return out;
}

export const grainCards = (p: { hand: Record<string, number> }) => p.hand['grain'] ?? 0;

export function removableTokens(n: number, epidemic: boolean): number {
  return epidemic ? Math.max(0, n - 1) : n;
}

export function maxUnitLoss(s: GameState, u: PendingUnitLoss): number {
  const inv = unitInventory(s, u.holder, u.areas);
  const epi = u.calamityId === 'epidemic';
  const tok = Object.values(inv.tokens).reduce((t, n) => t + removableTokens(n, epi), 0);
  return Math.min(u.points, tok + inv.cities.length * u.cityWorth);
}

export function suggestUnits(s: GameState, u: PendingUnitLoss): { tokens: Record<string, number>; cities: string[] } {
  const inv = unitInventory(s, u.holder, u.areas);
  const epi = u.calamityId === 'epidemic';
  let need = maxUnitLoss(s, u);
  const tokens: Record<string, number> = {};
  for (const [aid, n] of Object.entries(inv.tokens).sort((a, b) => a[1] - b[1])) {
    if (need <= 0) break;
    const take = Math.min(removableTokens(n, epi), need);
    if (take > 0) { tokens[aid] = take; need -= take; }
  }
  const cities: string[] = [];
  for (const aid of inv.cities) {
    if (need <= 0) break;
    cities.push(aid);
    need -= u.cityWorth;
  }
  return { tokens, cities };
}

export function cityKeep(u: PendingUnitLoss, choice: { cityKeep?: Record<string, number> }, aid: string): number {
  if (u.mode !== 'remove') return 0;
  const min = u.calamityId === 'epidemic' ? 1 : 0;
  return choice.cityKeep?.[aid] ?? min;
}

export function cityLossWorth(u: PendingUnitLoss, keep: number): number {
  if (u.mode !== 'remove') return u.cityWorth;
  return u.cityWorth - (keep - (u.calamityId === 'epidemic' ? 1 : 0));
}

export function validateUnits(s: GameState, u: PendingUnitLoss, choice: { tokens: Record<string, number>; cities: string[]; cityKeep?: Record<string, number> }): void {
  const inv = unitInventory(s, u.holder, u.areas);
  const epi = u.calamityId === 'epidemic';
  let sum = 0;
  for (const [aid, n] of Object.entries(choice.tokens)) {
    if (n <= 0) continue;
    if (!(aid in inv.tokens)) throw new Error(`no tokens of yours in ${areaName(aid)}`);
    if (n > inv.tokens[aid]!) throw new Error(`only ${inv.tokens[aid]} tokens in ${areaName(aid)}`);
    if (epi && n > inv.tokens[aid]! - 1) throw new Error(`Epidemic must leave at least one token in ${areaName(aid)} (§30.612)`);
    sum += n;
  }
  for (const aid of choice.cities) {
    if (!inv.cities.includes(aid)) throw new Error(`no city of yours in ${areaName(aid)}`);
    const keep = cityKeep(u, choice, aid);
    const lo = epi ? 1 : 0, hi = Math.max(lo, areaLimitFor(s, aid, u.holder));
    if (!Number.isInteger(keep) || keep < lo || keep > hi) throw new Error(`the city in ${areaName(aid)} can leave ${lo}–${hi} tokens behind`);
    sum += cityLossWorth(u, keep);
  }
  const need = maxUnitLoss(s, u);
  if (sum < need) throw new Error(`give up ${need} unit points (got ${sum}) — §29.63`);
  if (sum - need >= u.cityWorth) throw new Error(`giving up more than required — §29.63`);
}

export function applyChosenUnits(s: GameState, u: PendingUnitLoss, choice: { tokens: Record<string, number>; cities: string[]; cityKeep?: Record<string, number> }): void {
  if (u.mode === 'remove') {
    for (const [aid, n] of Object.entries(choice.tokens)) {
      if (n > 0) {
        setTokens(s, aid, u.holder, (s.areas[aid]!.tokens[u.holder] ?? 0) - n);
        player(s, u.holder).stock += n;
      }
    }
    for (const aid of choice.cities) {
      delete s.areas[aid]!.city;
      player(s, u.holder).citiesAvailable += 1;
      const place = Math.min(cityKeep(u, choice, aid), player(s, u.holder).stock);
      if (place > 0) {
        s.areas[aid]!.tokens[u.holder] = (s.areas[aid]!.tokens[u.holder] ?? 0) + place;
        player(s, u.holder).stock -= place;
      }
    }
    log(s, 'calamity.units', u.holder, `${u.holder} suffers ${calamityById.get(u.calamityId)?.name ?? u.calamityId} (-${u.points} unit point${u.points === 1 ? '' : 's'}).`, { calamity: u.calamityId, points: u.points });
  } else {
    const ben = u.beneficiary!;
    for (const [aid, n] of Object.entries(choice.tokens)) {
      for (let i = 0; i < n; i++) {
        setTokens(s, aid, u.holder, (s.areas[aid]!.tokens[u.holder] ?? 0) - 1);
        player(s, u.holder).stock += 1;
        if (player(s, ben).stock > 0) {
          s.areas[aid]!.tokens[ben] = (s.areas[aid]!.tokens[ben] ?? 0) + 1;
          player(s, ben).stock -= 1;
        }
      }
    }
    for (const aid of choice.cities) {
      delete s.areas[aid]!.city;
      player(s, u.holder).citiesAvailable += 1;
      if (player(s, ben).citiesAvailable > 0) {
        s.areas[aid]!.city = ben;
        player(s, ben).citiesAvailable -= 1;
      }
    }
    log(s, 'calamity.civilwar.defect', u.holder, `${u.holder} suffers Civil War: a faction worth ${u.points} defects to ${ben}.`, { calamity: 'civilwar', points: u.points, beneficiary: ben });
    if (has(player(s, u.holder), 'military')) {
      removeTokensFromBoard(s, u.holder, 5);
      removeTokensFromBoard(s, ben, 5);
      log(s, 'calamity.civilwar.military', u.holder, `Military makes the Civil War bloodier — both factions lose 5 (§30.414).`, { calamity: 'civilwar', points: 5 });
    }
  }
}

export function suggestCities(s: GameState, holder: PlayerId, count: number): string[] {
  return Object.keys(s.areas)
    .filter((aid) => s.areas[aid]!.city === holder)
    .sort((x, y) => (areaById.get(x)?.isCitySite ? 0 : 1) - (areaById.get(y)?.isCitySite ? 0 : 1))
    .slice(0, count);
}

export function reduceChosenCities(s: GameState, holder: PlayerId, areas: string[]): void {
  for (const aid of areas) reduceSpecificCity(s, holder, aid);
}
