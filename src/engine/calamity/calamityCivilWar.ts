import { civilWarSelectionOk, player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, has, setTokens } from '../primitives.js';
import { markCityAcquired } from '../phases/surplus.js';
import { boardUnitPoints } from './calamityGeography.js';
import type { GameState, PendingCivilWar, PlayerId, UnitSet } from '../types.js';

export const cwReserves = (s: GameState, id: PlayerId) => player(s, id).stock + 5 * player(s, id).citiesAvailable;

export function civilWarBeneficiary(s: GameState, victim: PlayerId): PlayerId | null {
  let beneficiary: PlayerId | null = null, best = -1;
  for (const o of s.seating) {
    if (o === victim) continue;
    const v = cwReserves(s, o);
    if (v > best) { best = v; beneficiary = o; }
  }
  if (beneficiary == null || cwReserves(s, victim) >= best) return null;
  return beneficiary;
}

export const unitSetPoints = (set: UnitSet) =>
  Object.values(set.tokens).reduce((t, n) => t + n, 0) + set.cities.length * 5;

export function unitInventory(s: GameState, holder: PlayerId, areas?: string[]): { tokens: Record<string, number>; cities: string[] } {
  const ids = areas ?? Object.keys(s.areas);
  const tokens: Record<string, number> = {};
  const cities: string[] = [];
  for (const aid of ids) {
    const a = s.areas[aid];
    if (!a) continue;
    if ((a.tokens[holder] ?? 0) > 0) tokens[aid] = a.tokens[holder]!;
    if (a.city === holder) cities.push(aid);
  }
  return { tokens, cities };
}

export function pickUnits(inv: UnitSet, points: number, valuable: boolean): UnitSet {
  const T = Object.values(inv.tokens).reduce((t, n) => t + n, 0), C = inv.cities.length;
  const ks = Array.from({ length: C + 1 }, (_, k) => k);
  if (valuable) ks.reverse();
  const k = ks.find((k) => points - 5 * k >= 0 && points - 5 * k <= T)
    ?? Array.from({ length: C + 1 }, (_, k) => k).find((k) => 5 * k + T >= points) ?? C;
  const cities = inv.cities.slice(0, k);
  const tokens: Record<string, number> = {};
  let need = Math.max(0, Math.min(T, points - 5 * k));
  for (const aid of Object.keys(inv.tokens)) {
    const n = Math.min(need, inv.tokens[aid]!);
    if (n > 0) { tokens[aid] = n; need -= n; }
  }
  return { tokens, cities };
}

export function subtractSet(inv: UnitSet, set: UnitSet): UnitSet {
  const tokens: Record<string, number> = {};
  for (const [aid, n] of Object.entries(inv.tokens)) {
    const rem = n - (set.tokens[aid] ?? 0);
    if (rem > 0) tokens[aid] = rem;
  }
  const taken = new Set(set.cities);
  return { tokens, cities: inv.cities.filter((aid) => !taken.has(aid)) };
}

export function militaryReduceFaction(s: GameState, victim: PlayerId, set: UnitSet, points: number): void {
  let need = points;
  for (const aid of Object.keys(set.tokens)) {
    while (need > 0 && (set.tokens[aid] ?? 0) > 0) {
      setTokens(s, aid, victim, (s.areas[aid]!.tokens[victim] ?? 0) - 1);
      player(s, victim).stock += 1;
      set.tokens[aid]! -= 1;
      need -= 1;
      if (set.tokens[aid] === 0) delete set.tokens[aid];
    }
  }
  while (need > 0 && set.cities.length) {
    const aid = set.cities.shift()!;
    if (s.areas[aid]?.city === victim) {
      delete s.areas[aid]!.city;
      player(s, victim).citiesAvailable += 1;
    }
    need -= 5;
  }
}

export function annexFaction(s: GameState, victim: PlayerId, beneficiary: PlayerId, set: UnitSet): void {
  const takerForToken = () => [beneficiary, ...s.seating.filter((o) => o !== victim && o !== beneficiary).sort((a, b) => player(s, b).stock - player(s, a).stock)].find((o) => player(s, o).stock > 0) ?? null;
  const takerForCity = () => [beneficiary, ...s.seating.filter((o) => o !== victim && o !== beneficiary).sort((a, b) => player(s, b).citiesAvailable - player(s, a).citiesAvailable)].find((o) => player(s, o).citiesAvailable > 0) ?? null;
  for (const [aid, n] of Object.entries(set.tokens)) {
    for (let i = 0; i < n; i++) {
      setTokens(s, aid, victim, (s.areas[aid]!.tokens[victim] ?? 0) - 1);
      player(s, victim).stock += 1;
      const taker = takerForToken();
      if (taker) {
        s.areas[aid]!.tokens[taker] = (s.areas[aid]!.tokens[taker] ?? 0) + 1;
        player(s, taker).stock -= 1;
      }
    }
  }
  for (const aid of set.cities) {
    if (s.areas[aid]?.city !== victim) continue;
    delete s.areas[aid]!.city;
    player(s, victim).citiesAvailable += 1;
    const taker = takerForCity();
    if (taker) {
      s.areas[aid]!.city = taker;
      player(s, taker).citiesAvailable -= 1;
      markCityAcquired(s, taker, aid);
    }
  }
}

export function startCivilWar(s: GameState, victim: PlayerId, before: unknown, overviewBefore: string): boolean {
  const beneficiary = civilWarBeneficiary(s, victim);
  if (beneficiary == null) {
    log(s, 'calamity.civilwar.fizzle', victim, `${victim}'s Civil War fizzles — it holds the most reserves (§30.411).`, { calamity: 'civilwar' });
    return false;
  }
  const pp = player(s, victim);
  const philosophy = has(pp, 'philosophy');
  const victimPoints = philosophy ? 0 : 15 + (has(pp, 'music') ? 5 : 0) + (has(pp, 'drama') ? 5 : 0) + (has(pp, 'democracy') ? 10 : 0);
  const beneficiaryPoints = philosophy ? 15 : 20;
  const board = boardUnitPoints(s, victim);
  if (board <= victimPoints + beneficiaryPoints) {
    log(s, 'calamity.civilwar.fizzle', victim, `${victim}'s Civil War: nation too small to leave a second faction — no effect (§30.413).`, { calamity: 'civilwar' });
    return false;
  }
  s.pendingCivilWar = {
    victim, beneficiary, stage: philosophy ? 'beneficiarySelect' : 'victimSelect',
    victimPoints, beneficiaryPoints, philosophy, military: has(pp, 'military'),
    faction1: { tokens: {}, cities: [] }, before: before as any, overviewBefore,
  };
  return true;
}

export function suggestCivilWarSelect(s: GameState): UnitSet {
  const cw = s.pendingCivilWar!;
  if (cw.stage === 'victimSelect') return pickUnits(unitInventory(s, cw.victim), cw.victimPoints, false);
  const remaining = subtractSet(unitInventory(s, cw.victim), cw.faction1);
  return pickUnits(remaining, cw.beneficiaryPoints, true);
}

export function civilWarActor(cw: PendingCivilWar): PlayerId {
  return cw.stage === 'beneficiarySelect' ? cw.beneficiary : cw.victim;
}

export function validateCivilWarSelect(s: GameState, cw: PendingCivilWar, sel: UnitSet, target: number): void {
  const avail = cw.stage === 'victimSelect' ? unitInventory(s, cw.victim) : subtractSet(unitInventory(s, cw.victim), cw.faction1);
  for (const [aid, n] of Object.entries(sel.tokens)) {
    if (n < 0) throw new Error('negative token count');
    if (n > (avail.tokens[aid] ?? 0)) throw new Error(`${cw.victim} has no such units to select in ${areaName(aid)}`);
  }
  for (const aid of sel.cities) {
    if (!avail.cities.includes(aid)) throw new Error(`${areaName(aid)} is not an available city to select`);
  }
  const pts = unitSetPoints(sel);
  const availTokens = Object.values(avail.tokens).reduce((t, n) => t + n, 0);
  if (!civilWarSelectionOk(pts, target, availTokens, avail.cities.length)) {
    throw new Error(`select exactly ${target} unit points for this faction (§30.412) — ${pts} chosen`);
  }
}
