import { landNeighbors, player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, BARBARIAN, has, isPlayer, setTokens } from '../primitives.js';
import { markCityAcquired } from './surplus.js';
import type { GameState, PlayerId } from '../types.js';

/** §32.952: a player holding Monotheism or Theology is immune to conversion. */
export function conversionImmune(s: GameState, id: PlayerId): boolean {
  return isPlayer(s, id) && (has(player(s, id), 'monotheism') || has(player(s, id), 'theology'));
}

/** The single real-player occupant of an area (city owner or the token owner),
 *  or null if empty / neutral (barbarians, pirates) / mixed. */
export function soleOccupant(s: GameState, aid: string): PlayerId | null {
  const a = s.areas[aid];
  if (!a) return null;
  if (a.pirateCity) return null;
  const tokenOwners = Object.entries(a.tokens).filter(([, n]) => n > 0).map(([o]) => o);
  if (a.city && isPlayer(s, a.city)) {
    if (tokenOwners.length === 0 || (tokenOwners.length === 1 && tokenOwners[0] === a.city)) return a.city;
    return null;
  }
  if (tokenOwners.length === 1 && isPlayer(s, tokenOwners[0]!) && tokenOwners[0] !== BARBARIAN) return tokenOwners[0]!;
  return null;
}

/** Areas a Monotheism holder may convert this turn (§32.941/.942). */
export function monotheismTargets(s: GameState, holder: PlayerId): string[] {
  if (!isPlayer(s, holder) || !has(player(s, holder), 'monotheism')) return [];
  const mine = player(s, holder);
  const ownsTokens = (aid: string) => (s.areas[aid]?.tokens[holder] ?? 0) > 0 || s.areas[aid]?.city === holder;
  const out: string[] = [];
  for (const [aid, a] of Object.entries(s.areas)) {
    const victim = soleOccupant(s, aid);
    if (!victim || victim === holder) continue;
    if (conversionImmune(s, victim)) continue;
    if (!landNeighbors(s, aid).some(ownsTokens)) continue;
    const tokens = a.tokens[victim] ?? 0;
    const needsCity = a.city === victim;
    if (tokens > mine.stock) continue;
    if (needsCity && mine.citiesAvailable < 1) continue;
    out.push(aid);
  }
  return out;
}

/** Execute a Monotheism conversion: the victim's pieces in `aid` return to them,
 *  replaced one-for-one by the holder's own units (§32.941). */
export function applyConvert(s: GameState, holder: PlayerId, aid: string): void {
  if (player(s, holder).convertedThisTurn) throw new Error('Monotheism may convert only one area per turn (§32.941)');
  if (!monotheismTargets(s, holder).includes(aid)) throw new Error(`cannot convert ${areaName(aid)} (§32.94)`);
  const a = s.areas[aid]!;
  const victim = soleOccupant(s, aid)!;
  const tokens = a.tokens[victim] ?? 0;
  const hadCity = a.city === victim;
  if (tokens > 0) { setTokens(s, aid, victim, 0); player(s, victim).stock += tokens; }
  if (hadCity) { delete a.city; player(s, victim).citiesAvailable += 1; }
  if (tokens > 0) { setTokens(s, aid, holder, tokens); player(s, holder).stock -= tokens; }
  if (hadCity) { a.city = holder; player(s, holder).citiesAvailable -= 1; markCityAcquired(s, holder, aid); }
  player(s, holder).convertedThisTurn = true;
  log(s, 'monotheism.convert', holder, `${holder} converts ${areaName(aid)} from ${victim} by Monotheism (§32.94)${hadCity ? ' (city)' : ''}${tokens > 0 ? ` (${tokens} tokens)` : ''}.`, { area: aid, victim, city: hadCity, tokens });
}

/** §29/§32.941: after calamities resolve, only Monotheism holders who can still
 *  convert an area get to act this (calamity) phase; everyone else is marked done. */
export function setupCalamityConversion(s: GameState): void {
  for (const id of s.seating) {
    const eligible = has(player(s, id), 'monotheism') && !player(s, id).convertedThisTurn && monotheismTargets(s, id).length > 0;
    if (!eligible && !s.actedThisPhase.includes(id)) s.actedThisPhase.push(id);
  }
}
