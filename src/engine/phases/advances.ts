import { advanceById, commodityById } from '../../data/index.js';
import { creditTowards, handValue, miningAvailable, player } from '../helpers.js';
import { log } from '../logging.js';
import { has } from '../primitives.js';
import { isCalamityCard } from '../tradeHelpers.js';
import type { GameState, PlayerId, PlayerState } from '../types.js';

/** Commodity cards a player may spend on advances: not calamity cards, and not
 *  Grain locked against Famine this turn (§30.312). */
export function spendableHand(p: PlayerState): Record<string, number> {
  const commHand: Record<string, number> = {};
  for (const [c, n] of Object.entries(p.hand)) if (!isCalamityCard(c) && n > 0) commHand[c] = n;
  if (commHand['grain']) {
    commHand['grain'] -= (p.grainLockedThisTurn ?? 0);
    if (commHand['grain'] <= 0) delete commHand['grain'];
  }
  return commHand;
}

/** §31: acquire one or more civilization cards. A batch is ONE transaction —
 *  the summed cost is met by a single pooled payment of commodity-card sets,
 *  treasury and credits, and any excess value is lost (§31.58). Credits come
 *  only from cards owned BEFORE this turn (§31.53), so nothing bought in this
 *  batch (or earlier this turn) discounts anything else in it. */
export function applyBuyAdvance(
  s: GameState,
  actor: PlayerId,
  advanceIds: string[],
  spendCommodities: Record<string, number> = {},
  spendTreasury = 0,
): void {
  const p = player(s, actor);
  const ids = [...new Set(advanceIds.filter(Boolean))];
  if (ids.length === 0) throw new Error('pick at least one civilization advance to buy');
  const advs = ids.map((id) => {
    const adv = advanceById.get(id);
    if (!adv) throw new Error(`unknown advance ${id}`);
    if (has(p, id)) throw new Error('already owned');
    return adv;
  });
  const boughtThisTurn = new Set([...(p.advancesThisTurn ?? []), ...ids]);
  for (const adv of advs) {
    for (const pre of adv.prerequisites ?? []) {
      if (boughtThisTurn.has(pre)) throw new Error(`${advanceById.get(pre)?.name ?? pre} must have been acquired in an earlier turn (§31.62)`);
      if (!has(p, pre)) throw new Error(`missing prerequisite ${pre}`);
    }
  }
  for (const [cid, n] of Object.entries(spendCommodities)) {
    if (n <= 0) continue;
    if (isCalamityCard(cid)) throw new Error('calamity cards cannot be spent on advances');
    if ((p.hand[cid] ?? 0) < n) throw new Error(`not enough ${cid} cards`);
    if (cid === 'grain' && (p.hand['grain'] ?? 0) - (p.grainLockedThisTurn ?? 0) < n) {
      throw new Error(`${p.grainLockedThisTurn} Grain card(s) are locked against Famine until next turn (§30.312)`);
    }
  }
  if (spendTreasury > p.treasury) throw new Error('not enough treasury');
  const spentHand: Record<string, number> = {};
  for (const [cid, n] of Object.entries(spendCommodities)) if (n > 0) spentHand[cid] = n;
  const creditEligible = p.advances.filter((a) => !(p.advancesThisTurn ?? []).includes(a));
  const credit = advs.reduce((t, adv) => t + creditTowards(creditEligible, adv.id), 0);
  const cost = advs.reduce((t, adv) => t + adv.cost, 0);
  const plainValue = handValue(spentHand);
  const minedValue = miningAvailable(p) ? handValue(spentHand, { mining: true }) : plainValue;
  const useMining = minedValue > plainValue && plainValue + credit < cost;
  const cardValue = useMining ? minedValue : plainValue;
  spendTreasury = Math.min(spendTreasury, Math.max(0, cost - cardValue - credit));
  const paid = cardValue + spendTreasury + credit;
  if (paid < cost) throw new Error(`insufficient payment: ${paid} < ${cost}`);
  for (const [cid, n] of Object.entries(spendCommodities)) {
    if (n <= 0) continue;
    p.hand[cid] = (p.hand[cid] ?? 0) - n;
    if (p.hand[cid]! <= 0) delete p.hand[cid];
    const stack = commodityById.get(cid)?.stack;
    if (stack) for (let i = 0; i < n; i++) s.trade.stacks[stack]!.unshift(cid);
  }
  p.treasury -= spendTreasury;
  p.stock += spendTreasury;
  if (useMining) p.miningUsedThisTurn = true;
  for (const adv of advs) {
    p.advances.push(adv.id);
    (p.advancesThisTurn ??= []).push(adv.id);
  }
  const names = advs.map((a) => a.name).join(', ');
  log(s, 'advance.buy', actor, `${actor} acquired ${names} (paid ${paid} for ${cost}).`, { advance: advs[0]!.id, advances: ids, cost, paid });
}
