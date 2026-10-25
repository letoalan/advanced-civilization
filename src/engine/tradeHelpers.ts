import { calamityById, commodityById } from '../data/index.js';
import { player } from './helpers.js';
import type { GameState, PlayerId } from './types.js';

export const isCalamityCard = (card: string) => card.startsWith('calamity:');
export const calamityIdOf = (card: string) => card.slice('calamity:'.length);
export const bundleSize = (m: Record<string, number>) => Object.values(m).reduce((s, n) => s + n, 0);

/** A card is givable in trade iff it's a commodity or a *tradable* calamity. */
export function isGivable(card: string): boolean {
  if (!isCalamityCard(card)) return true;
  return calamityById.get(calamityIdOf(card))?.tradable === true;
}

/** Is `sub` a sub-multiset of `set`? */
export function isSubMultiset(sub: Record<string, number>, set: Record<string, number>): boolean {
  return Object.entries(sub).every(([k, n]) => n <= 0 || (set[k] ?? 0) >= n);
}

/** Validate one side's bundle against §28.3. `owner` must hold the actual cards;
 *  the bundle must have >=`minCards`, state its honest `count`, NAME at least two
 *  cards that really are in it (binding), and never give (or name) a
 *  non-tradable calamity. Anything said about the unnamed cards goes in the
 *  non-binding `claimed` — bluffs are legal there ("regardless of what was
 *  said"), but you can't claim more cards than you left unnamed. Returns an
 *  error string or null. */
export function validateBundle(
  s: GameState,
  owner: PlayerId,
  b: { actual: Record<string, number>; declared: Record<string, number>; count?: number; claimed?: Record<string, number> },
  minCards: number,
): string | null {
  const hand = player(s, owner).hand;
  if (bundleSize(b.actual) < minCards) return `bundle must have at least ${minCards} cards`;
  if (!isSubMultiset(b.actual, hand)) return `${owner} does not hold the offered cards`;
  for (const card of Object.keys(b.actual)) {
    if ((b.actual[card] ?? 0) > 0 && !isGivable(card)) return `${card} is a non-tradable calamity and may not be traded`;
  }
  // Named and claimed cards must be real tradable card ids (commodities or tradable calamities).
  const claimed = b.claimed ?? {};
  for (const card of [...Object.keys(b.declared), ...Object.keys(claimed)]) {
    if (!commodityById.get(card) && !isGivable(card)) return `cannot name ${card}`;
  }
  if (b.count !== bundleSize(b.actual)) return 'state the honest number of cards you are trading (§28.3)';
  if (bundleSize(b.declared) < 2) return 'name at least two of the cards you are trading (§28.3)';
  if (!isSubMultiset(b.declared, b.actual)) return 'the cards you name must really be in the trade (§28.3) — say anything else as a claim';
  if (bundleSize(claimed) > b.count - bundleSize(b.declared)) return 'you can only make claims about the cards you have not named';
  return null;
}

export function removeCards(hand: Record<string, number>, cards: Record<string, number>): void {
  for (const [c, n] of Object.entries(cards)) {
    if (n <= 0) continue;
    hand[c] = (hand[c] ?? 0) - n;
    if (hand[c]! <= 0) delete hand[c];
  }
}

export function addCards(hand: Record<string, number>, cards: Record<string, number>): void {
  for (const [c, n] of Object.entries(cards)) {
    if (n <= 0) continue;
    hand[c] = (hand[c] ?? 0) + n;
  }
}

/** Move a side's cards from giver to receiver and record calamity provenance
 *  (the giver may not later be named a secondary victim, §29.61). */
export function transferCards(s: GameState, giver: PlayerId, receiver: PlayerId, cards: Record<string, number>): void {
  removeCards(player(s, giver).hand, cards);
  addCards(player(s, receiver).hand, cards);
  for (const [c, n] of Object.entries(cards)) {
    if (n > 0 && isCalamityCard(c)) s.calamityTradedFrom[calamityIdOf(c)] = giver;
  }
}
