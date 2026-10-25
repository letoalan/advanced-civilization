import { cityCount, player } from '../helpers.js';
import { log } from '../logging.js';
import { calamityIdOf, isCalamityCard } from '../tradeHelpers.js';
import type { GameState, PlayerId } from '../types.js';

/** §27.51: can `id` buy from the ninth stack right now (18 treasury a card)? */
export function canBuyNinth(s: GameState, id: PlayerId): boolean {
  return player(s, id).treasury >= 18 && (s.trade.stacks[9]?.length ?? 0) > 0;
}

/** §27.1: a player draws one card from each of stacks 1..N, where N is the
 *  number of cities on the board. A city-less player draws nothing — building
 *  your first city is what starts the flow of trade cards. */
export function drawTradeCards(s: GameState, id: PlayerId): void {
  const p = player(s, id);
  const cities = Math.min(9, cityCount(s, id));
  let drawn = 0;
  for (let stack = 1; stack <= cities; stack++) {
    const pile = s.trade.stacks[stack];
    if (!pile || pile.length === 0) continue;
    const card = pile.pop()!;
    p.hand[card] = (p.hand[card] ?? 0) + 1;
    drawn += 1;
    if (card.startsWith('calamity:')) {
      const calId = card.slice('calamity:'.length);
      s.calamityTradedFrom[calId] = id;
    }
  }
  if (drawn > 0) {
    log(s, 'trade.cards.draw', id, `${id} collected ${drawn} trade card${drawn === 1 ? '' : 's'} (1 per city, from stacks 1–${cities}).`, { count: drawn, cities });
  }
}

/** Trade-card collection (§27). Resumable: it pauses after a player draws if
 *  they may buy from the ninth stack (§27.51 — "immediately after the purchasing
 *  player collects his trade cards, before any other players collect theirs"),
 *  and picks up with the next drawer once they buy or skip. */
export function runTradeAcquisition(s: GameState): void {
  if (!s.ninthStack) {
    s.pendingCalamities = [];
    s.ninthStack = { order: [...s.activeOrder].sort((a, b) => cityCount(s, a) - cityCount(s, b)), at: 0, awaiting: false };
  }
  const ns = s.ninthStack;
  while (ns.at < ns.order.length) {
    if (ns.awaiting) return;
    const id = ns.order[ns.at]!;
    drawTradeCards(s, id);
    if (canBuyNinth(s, id)) { ns.awaiting = true; return; }
    ns.at += 1;
  }
  s.ninthStack = undefined;
}

/** End the current player's ninth-stack window and move to the next drawer. */
export function closeNinthWindow(s: GameState): void {
  if (!s.ninthStack) return;
  s.ninthStack.awaiting = false;
  s.ninthStack.at += 1;
}

export function applyBuyTradeCard(s: GameState, actor: PlayerId, count: number): void {
  if (count <= 0) throw new Error('count must be positive');
  const p = player(s, actor);
  const cost = 18 * count;
  if (p.treasury < cost) throw new Error(`need ${cost} treasury to buy ${count} card(s)`);
  const pile = s.trade.stacks[9] ?? [];
  if (pile.length < count) throw new Error('not enough cards in the ninth stack');
  for (let i = 0; i < count; i++) {
    const card = pile.pop()!;
    p.hand[card] = (p.hand[card] ?? 0) + 1;
    if (isCalamityCard(card)) s.calamityTradedFrom[calamityIdOf(card)] = actor;
  }
  p.treasury -= cost;
  p.stock += cost;
  log(s, 'trade.buyNinth', actor, `${actor} bought ${count} card(s) from the ninth stack for ${cost} treasury.`, { count, cost });
}
