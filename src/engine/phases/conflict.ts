import { Rng } from 'digital-boardgame-framework';
import { areaById } from '../../data/index.js';
import { player } from '../helpers.js';
import { lastLogSeq, log, logMsgsSince } from '../logging.js';
import { areaName, isNeutral, isPlayer, PIRATE, returnLostToStock, setTokens } from '../primitives.js';
import { combatModifiers, forcesIn, hasEng, hasMetal, offerPillage, pname, stealCardFromVictim } from './conflictHelpers.js';
import type { CombatEvent, GameState, PlayerId } from '../types.js';

/** Token-vs-token attrition (§24.2). Nations remove their own tokens one at a
 *  time in round-robin, in removal order — non-Metalworking before Metalworking
 *  (§24.24), and fewest tokens first (§24.21, generalized to ascending strength
 *  for 3+ nations, §24.23). Stops when one nation remains or the total no longer
 *  exceeds `limit` (coexistence, §24.21/§24.1 — `limit` is 0 when a city is
 *  present, since a city makes an area fully populated). */
export function resolveTokenCombat(s: GameState, aid: string, limit: number): void {
  const a = s.areas[aid]!;
  const seatIdx = new Map(s.seating.map((p, i) => [p, i]));
  const live = () => Object.keys(a.tokens).filter((o) => (a.tokens[o] ?? 0) > 0);
  if (live().length < 2) return;
  const order = live().sort((x, y) => {
    const mx = hasMetal(s, x) ? 1 : 0, my = hasMetal(s, y) ? 1 : 0;
    if (mx !== my) return mx - my;
    const cx = a.tokens[x] ?? 0, cy = a.tokens[y] ?? 0;
    if (cx !== cy) return cx - cy;
    return (seatIdx.get(x) ?? 0) - (seatIdx.get(y) ?? 0);
  });
  const before = Object.fromEntries(order.map((o) => [o, a.tokens[o] ?? 0]));
  const sum = (l: string[]) => l.reduce((t, o) => t + (a.tokens[o] ?? 0), 0);
  const removalOrder = (l: string[]) => l.slice().sort((x, y) => {
    const mx = hasMetal(s, x) ? 1 : 0, my = hasMetal(s, y) ? 1 : 0;
    if (mx !== my) return mx - my;
    const cx = a.tokens[x] ?? 0, cy = a.tokens[y] ?? 0;
    if (cx !== cy) return cx - cy;
    return (seatIdx.get(x) ?? 0) - (seatIdx.get(y) ?? 0);
  });
  let guard = 0;
  while (guard++ < 5000) {
    const l = live();
    if (l.length < 2 || sum(l) <= limit) break;
    const ord = removalOrder(l);
    let i = 0, stop = false;
    while (i < ord.length && !stop) {
      const metal = hasMetal(s, ord[i]!), cnt = a.tokens[ord[i]!] ?? 0;
      let j = i;
      while (j < ord.length && hasMetal(s, ord[j]!) === metal && (a.tokens[ord[j]!] ?? 0) === cnt) j++;
      for (let k = i; k < j; k++) {
        setTokens(s, aid, ord[k]!, (a.tokens[ord[k]!] ?? 0) - 1);
        returnLostToStock(s, ord[k]!, 1);
      }
      i = j;
      const lv = live();
      if (lv.length < 2 || sum(lv) <= limit) stop = true;
    }
    if (stop) break;
  }
  const losses = order.map((o) => `${isNeutral(o) ? pname(s, o) : o} -${before[o]! - (a.tokens[o] ?? 0)}`).filter((x) => !x.endsWith('-0'));
  if (losses.length) {
    log(s, 'conflict.losses', null, `Conflict in ${areaName(aid)}: ${losses.join(', ')}.`, {
      area: aid,
      losses: Object.fromEntries(order.map((o) => [o, before[o]! - (a.tokens[o] ?? 0)]).filter(([, d]) => (d as number) > 0)),
    });
  }
}

/** Token-vs-city assault (§24.3, §24.35, §24.5). */
export function resolveCityAssault(s: GameState, aid: string, attacker: PlayerId, rng: Rng): void {
  const a = s.areas[aid]!;
  const defender = a.city;
  if (!defender) return;
  const atk = a.tokens[attacker] ?? 0;
  if (defender === PIRATE) {
    const req = hasEng(s, attacker) ? 6 : 7;
    if (atk < req) {
      setTokens(s, aid, attacker, 0);
      returnLostToStock(s, attacker, atk);
      log(s, 'city.storm.fail', attacker, `${attacker} failed to take the pirate city in ${areaName(aid)} (needed ${req}).`, { area: aid, pirate: true, required: req, lost: atk });
      return;
    }
    delete a.city; delete a.pirateCity;
    a.tokens[PIRATE] = req - 1;
    resolveTokenCombat(s, aid, 0);
    delete a.tokens[PIRATE];
    log(s, 'city.storm', attacker, `${attacker} destroyed the pirate city in ${areaName(aid)}.`, { area: aid, pirate: true });
    offerPillage(s, attacker, aid);
    return;
  }
  const attEng = hasEng(s, attacker), defEng = hasEng(s, defender);
  let required = 7, replacement = 6;
  if (attEng && !defEng) { required = 6; replacement = 5; }
  else if (defEng && !attEng) { required = 8; replacement = 7; }
  if (atk < required) {
    setTokens(s, aid, attacker, 0);
    returnLostToStock(s, attacker, atk);
    log(s, 'city.storm.fail', attacker, `${attacker} could not storm ${defender}'s city in ${areaName(aid)} (needed ${required}); ${atk} tokens lost.`, { area: aid, defender, required, lost: atk });
    return;
  }
  delete a.city;
  player(s, defender).citiesAvailable += 1;
  const place = Math.min(replacement, player(s, defender).stock);
  if (place > 0) { a.tokens[defender] = (a.tokens[defender] ?? 0) + place; player(s, defender).stock -= place; }
  log(s, 'city.storm', attacker, `${attacker} stormed ${defender}'s city in ${areaName(aid)} (defended by ${place}).`, { area: aid, defender, defendedBy: place });
  resolveTokenCombat(s, aid, 0);
  if (isPlayer(s, attacker)) {
    stealCardFromVictim(s, attacker, defender, rng);
    offerPillage(s, attacker, aid);
  }
}

/** Resolve all conflict in one area (§24.3). */
export function resolveAreaCombat(s: GameState, aid: string, rng: Rng, combats?: CombatEvent[]): void {
  const a = s.areas[aid]!;
  const area = areaById.get(aid);
  const limit = a.city ? 0 : (area?.sustains ?? 0);
  const before = forcesIn(s, aid);
  const modifiers = combatModifiers(s, aid);
  const logSeq = lastLogSeq(s);
  if (Object.keys(a.tokens).filter((o) => (a.tokens[o] ?? 0) > 0).length >= 2) {
    resolveTokenCombat(s, aid, limit);
  }
  if (a.city) {
    const attackers = Object.keys(a.tokens).filter((o) => o !== a.city && (a.tokens[o] ?? 0) > 0);
    if (attackers.length === 1) resolveCityAssault(s, aid, attackers[0]!, rng);
  }
  combats?.push({ area: aid, before, after: forcesIn(s, aid), modifiers, note: logMsgsSince(s, logSeq).join(' ') });
}

export function runConflict(s: GameState): void {
  const rng = Rng.fromState(s.rngState);
  const combats: CombatEvent[] = [];
  const conflictAreas: string[] = [];
  for (const [aid, a] of Object.entries(s.areas)) {
    const owners = Object.keys(a.tokens).filter((o) => (a.tokens[o] ?? 0) > 0);
    const enemyAtCity = a.city != null && owners.some((o) => o !== a.city);
    if (owners.length >= 2 || enemyAtCity) conflictAreas.push(aid);
  }
  const before: Record<string, ReturnType<typeof forcesIn>> = {};
  const modifiers: Record<string, string[]> = {};
  const note: Record<string, string[]> = {};
  for (const aid of conflictAreas) { before[aid] = forcesIn(s, aid); modifiers[aid] = combatModifiers(s, aid); note[aid] = []; }
  for (const aid of conflictAreas) {
    const a = s.areas[aid]!;
    if (Object.keys(a.tokens).filter((o) => (a.tokens[o] ?? 0) > 0).length >= 2) {
      const limit = a.city ? 0 : (areaById.get(aid)?.sustains ?? 0);
      const l0 = lastLogSeq(s); resolveTokenCombat(s, aid, limit); note[aid]!.push(...logMsgsSince(s, l0));
    }
  }
  for (const aid of conflictAreas) {
    const a = s.areas[aid]!;
    if (a.city) {
      const attackers = Object.keys(a.tokens).filter((o) => o !== a.city && (a.tokens[o] ?? 0) > 0);
      if (attackers.length === 1) { const l0 = lastLogSeq(s); resolveCityAssault(s, aid, attackers[0]!, rng); note[aid]!.push(...logMsgsSince(s, l0)); }
    }
  }
  for (const aid of conflictAreas) combats.push({ area: aid, before: before[aid]!, after: forcesIn(s, aid), modifiers: modifiers[aid]!, note: note[aid]!.join(' ') });
  s.lastCombats = combats;
  s.rngState = rng.serialize();
}
