import { advanceById } from '../../data/index.js';
import {
  cardGroupsHeld,
  commoditySetValue,
  creditTowards,
  handValue,
} from '../../engine/helpers.js';
import type { Action } from '../../engine/types.js';

const isCal = (c: string) => c.startsWith('calamity:');

/** One pooled purchase (§31): a basket of advances and the cheapest way to pay. */
export function planAdvancePurchase(
  p: {
    advances: string[];
    advancesThisTurn?: string[];
    hand: Record<string, number>;
    treasury: number;
    grainLockedThisTurn?: number;
  },
  candidates: string[],
): Action | null {
  const hand: Record<string, number> = {};
  for (const [c, n] of Object.entries(p.hand)) if (!isCal(c) && n > 0) hand[c] = n;
  if (hand['grain']) {
    hand['grain'] -= p.grainLockedThisTurn ?? 0;
    if (hand['grain'] <= 0) delete hand['grain'];
  }
  const eligible = p.advances.filter((a) => !(p.advancesThisTurn ?? []).includes(a));
  const net = (id: string) =>
    Math.max(0, (advanceById.get(id)?.cost ?? Infinity) - creditTowards(eligible, id));
  const budget = handValue(hand) + p.treasury;

  const basket: string[] = [];
  const groups = cardGroupsHeld(p.advances);
  let need = 0;
  const pool = candidates.filter((id) => advanceById.has(id));
  while (pool.length) {
    pool.sort((x, y) => score(y) - score(x));
    const pick = pool.shift()!;
    if (need + net(pick) > budget) continue;
    basket.push(pick);
    need += net(pick);
    for (const g of advanceById.get(pick)!.groups) groups.add(g);
  }
  function score(id: string): number {
    const adv = advanceById.get(id)!;
    return (adv.groups.some((g) => !groups.has(g)) ? 1000 : 0) + adv.cost / Math.max(1, net(id));
  }
  if (basket.length === 0) return null;

  const sets = Object.keys(hand).map((c) => ({ c, v: commoditySetValue(c, hand[c]!) }));
  let best: { mask: number; waste: number; treasury: number } | null = null;
  for (let mask = 0; mask < 1 << sets.length; mask++) {
    let v = 0;
    sets.forEach((x, i) => {
      if (mask & (1 << i)) v += x.v;
    });
    const treasury = Math.max(0, need - v);
    if (treasury > p.treasury) continue;
    const waste = Math.max(0, v - need);
    if (!best || waste < best.waste || (waste === best.waste && treasury < best.treasury)) {
      best = { mask, waste, treasury };
    }
  }
  if (!best) return null;
  const spendCommodities: Record<string, number> = {};
  sets.forEach((x, i) => {
    if (best!.mask & (1 << i)) spendCommodities[x.c] = hand[x.c]!;
  });
  return basket.length === 1
    ? { type: 'buyAdvance', advance: basket[0]!, spendCommodities, spendTreasury: best.treasury }
    : { type: 'buyAdvance', advances: basket, spendCommodities, spendTreasury: best.treasury };
}
