import { calamityById, commodityById } from '../../data/index.js';
import { player } from '../helpers.js';
import { log } from '../logging.js';
import {
  bundleSize,
  calamityIdOf,
  isCalamityCard,
  isGivable,
  isSubMultiset,
  transferCards,
  validateBundle,
} from '../tradeHelpers.js';
import type { GameState, PlayerId, TradeBundle } from '../types.js';

/** Calculate the current negotiation round and max rounds (standard digital/turn cap is 3 rounds). */
export function tradeRound(s: GameState): { current: number; max: number } {
  const n = s.negotiation;
  const max = n.maxRounds ?? 3;
  const playersCount = Math.max(1, s.activeOrder.length);
  const current = Math.min(max, Math.floor((n.actions ?? 0) / playersCount) + 1);
  return { current, max };
}

/** The trade phase is over (no pending offer) once everyone has passed in a row,
 *  or the 3-round negotiation cap is reached. */
export function tradePhaseEnded(s: GameState): boolean {
  const n = s.negotiation;
  const maxRounds = n.maxRounds ?? 3;
  const cap = maxRounds * Math.max(1, s.activeOrder.length);
  const done = n.done ?? [];
  const trading = s.activeOrder.filter((p) => !done.includes(p));
  return trading.length === 0 || (n.actions ?? 0) >= cap || (n.waitStreak ?? 0) >= trading.length;
}

export const commodityName = (c: string): string =>
  isCalamityCard(c) ? calamityById.get(calamityIdOf(c))?.name ?? c : commodityById.get(c)?.name ?? c;

/** Whose turn it is in the trade phase: round-robin from the pointer, skipping
 *  players who are done trading. */
export function tradeActor(s: GameState): PlayerId | null {
  if (tradePhaseEnded(s)) return null;
  const n = s.negotiation;
  const done = n.done ?? [];
  const order = s.activeOrder;
  for (let i = 0; i < order.length; i++) {
    const cand = order[(n.turnPointer + i) % order.length];
    if (cand && !done.includes(cand)) return cand;
  }
  return null;
}

/** Commodities plus tradable calamities: the cards that count towards §28.3's
 *  three-card minimum. */
export function tradableCards(s: GameState, id: PlayerId): number {
  return Object.entries(player(s, id).hand).reduce((t, [c, n]) => t + (n > 0 && isGivable(c) ? n : 0), 0);
}

/** Post or replace the actor's standing open offer (§28). Bluffs allowed; the
 *  announced count and ≥2 announced cards must be truthful. */
export function applyPostOffer(s: GameState, actor: PlayerId, a: { give: TradeBundle; wants: string[] }): void {
  const err = validateBundle(s, actor, a.give, 3);
  if (err) throw new Error(`postOffer: ${err}`);
  const wants = [...new Set((a.wants ?? []).filter((w) => commodityById.get(w)))];
  if (wants.length < 1 || wants.length > 5) throw new Error('name 1–5 commodities you want in return (§28)');
  const n = s.negotiation;
  n.offers = n.offers.filter((o) => o.from !== actor);
  n.nextOfferId = (n.nextOfferId ?? 0) + 1;
  n.offers.push({ id: n.nextOfferId, from: actor, give: a.give, wants, responses: [] });
  n.actions = (n.actions ?? 0) + 1;
  n.passStreak = 0;
  log(s, 'trade.offer', actor, `${actor} posts a trade offer (gives ${bundleSize(a.give.actual)}, wants ${wants.map(commodityName).join(' or ')}).`, { gives: bundleSize(a.give.actual), wants });
}

/** Attach or replace the actor's counter-give to another player's open offer. */
export function applyRespondOffer(s: GameState, actor: PlayerId, a: { offerId: number; give: TradeBundle }): void {
  const o = s.negotiation.offers.find((x) => x.id === a.offerId);
  if (!o) throw new Error('that offer is no longer on the board');
  if (o.from === actor) throw new Error('cannot respond to your own offer');
  const err = validateBundle(s, actor, a.give, 3);
  if (err) throw new Error(`respondOffer: ${err}`);
  o.responses = o.responses.filter((r) => r.from !== actor);
  o.responses.push({ from: actor, give: a.give });
  const n = s.negotiation;
  if ((n.done ?? []).includes(o.from)) {
    n.done = n.done!.filter((p) => p !== o.from);
    log(s, 'trade.wake', o.from, `${o.from} rejoins trading to answer ${actor}'s response.`, { by: actor, offerId: o.id });
  }
  s.negotiation.actions = (s.negotiation.actions ?? 0) + 1;
  s.negotiation.passStreak = 0;
  log(s, 'trade.respond', actor, `${actor} responds to ${o.from}'s offer.`, { to: o.from, offerId: o.id });
}

/** The offer's owner accepts one responder's counter — executes the §28.2 deal. */
export function applyAcceptResponse(s: GameState, actor: PlayerId, a: { offerId: number; responder: PlayerId }): void {
  const o = s.negotiation.offers.find((x) => x.id === a.offerId);
  if (!o) throw new Error('that offer is no longer on the board');
  if (o.from !== actor) throw new Error('only the offer owner may accept a response');
  const r = o.responses.find((x) => x.from === a.responder);
  if (!r) throw new Error('no such response');
  if (!isSubMultiset(o.give.actual, player(s, actor).hand)) {
    s.negotiation.offers = s.negotiation.offers.filter((x) => x.id !== o.id);
    s.negotiation.actions = (s.negotiation.actions ?? 0) + 1;
    log(s, 'trade.offer.expire', actor, `${actor}'s trade offer expired (cards no longer held).`);
    return;
  }
  if (!isSubMultiset(r.give.actual, player(s, r.from).hand)) {
    o.responses = o.responses.filter((x) => x.from !== r.from);
    s.negotiation.actions = (s.negotiation.actions ?? 0) + 1;
    log(s, 'trade.response.expire', r.from, `${r.from}'s trade response expired (cards no longer held).`);
    return;
  }
  transferCards(s, actor, r.from, o.give.actual);
  transferCards(s, r.from, actor, r.give.actual);
  (s.negotiation.completed ??= []).push({ a: actor, b: r.from, aGave: o.give, bGave: r.give });
  s.negotiation.offers = s.negotiation.offers.filter((x) => x.from !== actor && x.from !== r.from);
  s.negotiation.actions = (s.negotiation.actions ?? 0) + 1;
  s.negotiation.passStreak = 0;
  log(s, 'trade.complete', actor, `${actor} and ${r.from} completed a trade (${bundleSize(o.give.actual)}↔${bundleSize(r.give.actual)} cards).`, { with: r.from, gave: bundleSize(o.give.actual), got: bundleSize(r.give.actual) });
}

export function applyWithdrawOffer(s: GameState, actor: PlayerId): void {
  s.negotiation.offers = s.negotiation.offers.filter((o) => o.from !== actor);
}
