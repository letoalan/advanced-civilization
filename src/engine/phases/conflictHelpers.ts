import { Rng } from 'digital-boardgame-framework';
import { civById } from '../../data/index.js';
import { player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, BARBARIAN, has, isNeutral, isPlayer, PIRATE } from '../primitives.js';
import { calamityIdOf, isCalamityCard } from '../tradeHelpers.js';
import type { CombatForce, GameState, PlayerId } from '../types.js';

export const hasMetal = (s: GameState, id: PlayerId): boolean => isPlayer(s, id) && has(player(s, id), 'metalworking');
export const hasEng = (s: GameState, id: PlayerId): boolean => isPlayer(s, id) && has(player(s, id), 'engineering');

export const pname = (s: GameState, id: PlayerId): string =>
  id === BARBARIAN ? 'Barbarians' : id === PIRATE ? 'Pirates' : civById.get(id)?.name ?? id;

/** Forces present in an area (token owners + the city owner), for combat display. */
export function forcesIn(s: GameState, aid: string): CombatForce[] {
  const a = s.areas[aid];
  if (!a) return [];
  const ids = new Set<string>();
  for (const [o, n] of Object.entries(a.tokens)) if (n > 0) ids.add(o);
  if (a.city) ids.add(a.city);
  return [...ids].map((id) => ({ id, tokens: a.tokens[id] ?? 0, city: a.city === id }));
}

/** Rules that shape an area's combat (Metalworking removal order, Engineering
 *  city-assault thresholds), as human-readable strings. */
export function combatModifiers(s: GameState, aid: string): string[] {
  const a = s.areas[aid]!;
  const out: string[] = [];
  const owners = Object.keys(a.tokens).filter((o) => (a.tokens[o] ?? 0) > 0);
  const metal = owners.filter((o) => hasMetal(s, o));
  if (metal.length && metal.length < owners.length) {
    out.push(`Metalworking — ${metal.map((o) => pname(s, o)).join(', ')} lose tokens last (§32.231)`);
  }
  if (a.city) {
    const attackers = owners.filter((o) => o !== a.city);
    if (attackers.length === 1) {
      const atk = attackers[0]!, def = a.city;
      const ae = hasEng(s, atk), de = hasEng(s, def);
      const thr = ae && !de ? 6 : de && !ae ? 8 : 7;
      out.push(`City assault — ${thr} tokens needed to take ${pname(s, def)}’s city${ae ? ', attacker has Engineering' : ''}${de ? ', defender has Engineering' : ''} (§24.35)`);
    } else if (a.pirateCity) {
      out.push('Pirate city — 7 tokens needed to storm it (§24.34)');
    }
  }
  return out;
}

/** §24.52: a player who storms a city "may transfer UP TO three tokens from his
 *  stock to his treasury ... may choose to transfer fewer than three if he
 *  wishes." The maximum is taken now (so nothing else in this conflict phase
 *  sees a different stock), and the attacker is then asked how many to keep —
 *  the rest goes straight back to stock. Neutral attackers (Barbarians) never
 *  pillage (§24.53). */
export function offerPillage(s: GameState, attacker: PlayerId, aid: string): void {
  if (!isPlayer(s, attacker)) return;
  const p = player(s, attacker);
  const taken = Math.min(3, p.stock);
  if (taken <= 0) return;
  p.stock -= taken; p.treasury += taken;
  (s.pendingPillage ??= []).push({ attacker, area: aid, taken });
}

/** Settle one §24.52 pillage: keep `count` of the tokens already moved to the
 *  treasury and return the remainder to stock. */
export function applyPillage(s: GameState, actor: PlayerId, count: number): void {
  const head = s.pendingPillage?.[0];
  if (!head) throw new Error('no pillage to settle');
  if (head.attacker !== actor) throw new Error(`the pillage in ${areaName(head.area)} is ${head.attacker}'s choice`);
  if (!Number.isInteger(count) || count < 0 || count > head.taken) throw new Error(`pillage must be 0-${head.taken} tokens (§24.52)`);
  const p = player(s, actor);
  const back = head.taken - count;
  p.treasury -= back; p.stock += back;
  log(s, 'combat.pillage.take', actor, `${actor} pillaged ${count} token${count === 1 ? '' : 's'} from the destroyed city in ${areaName(head.area)} (§24.52).`, { area: head.area, count, max: head.taken });
  s.pendingPillage = s.pendingPillage!.slice(1);
  if (!s.pendingPillage.length) s.pendingPillage = undefined;
}

/** Move one random trade card from the victim's hand to the attacker (§24.51).
 *  No-op if the victim has no cards. */
export function stealCardFromVictim(s: GameState, attacker: PlayerId, victim: PlayerId, rng: Rng): void {
  const vhand = player(s, victim).hand;
  const flat: string[] = [];
  for (const [c, n] of Object.entries(vhand)) for (let i = 0; i < n; i++) flat.push(c);
  if (flat.length === 0) return;
  const card = rng.pick(flat);
  vhand[card] = (vhand[card] ?? 0) - 1;
  if (vhand[card]! <= 0) delete vhand[card];
  player(s, attacker).hand[card] = (player(s, attacker).hand[card] ?? 0) + 1;
  if (isCalamityCard(card)) s.calamityTradedFrom[calamityIdOf(card)] = victim;
  log(s, 'combat.pillage', attacker, `${attacker} pillages a trade card from ${victim}.`, { victim });
}
