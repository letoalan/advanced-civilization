import {
  advanceById,
  commodityById,
  type AdvanceGroup,
} from '../../data/index.js';

/** Value of a single commodity set of `n` identical cards (rules §28.51):
 *  n^2 * value, with n capped at the printed maximum (the card count). */
export function commoditySetValue(commodityId: string, n: number): number {
  const c = commodityById.get(commodityId);
  if (!c || n <= 0) return 0;
  const capped = Math.min(n, c.count);
  return capped * capped * c.value;
}

/** §32.261: Mining may only be used once per turn — after it has boosted one
 *  purchase, later purchases (and the retained hand) that turn get no bonus. */
export function miningAvailable(p: { advances: string[]; miningUsedThisTurn?: boolean }): boolean {
  return p.advances.includes('mining') && !p.miningUsedThisTurn;
}

/** Total value of a hand of commodity cards: sum of each commodity's set value.
 *  `mining` lets the holder treat one mineable set as one card larger (§32.261);
 *  applied to the single set that gains the most. */
export function handValue(hand: Record<string, number>, opts?: { mining?: boolean }): number {
  let total = 0;
  let bestMiningGain = 0;
  for (const [id, n] of Object.entries(hand)) {
    if (n <= 0) continue;
    total += commoditySetValue(id, n);
    if (opts?.mining) {
      const c = commodityById.get(id);
      if (c && ['iron', 'bronze', 'silver', 'gems', 'gold'].includes(id) && n < c.count) {
        const gain = commoditySetValue(id, n + 1) - commoditySetValue(id, n);
        if (gain > bestMiningGain) bestMiningGain = gain;
      }
    }
  }
  return total + bestMiningGain;
}

/** Credit a player's owned advances provide toward buying `targetId`
 *  (rules §31.5, §32). Sums byGroup credits (per matching group of the target,
 *  excluding self) and byCard credits. */
export function creditTowards(owned: string[], targetId: string): number {
  const target = advanceById.get(targetId);
  if (!target) return 0;
  let credit = 0;
  for (const ownedId of owned) {
    if (ownedId === targetId) continue;
    const a = advanceById.get(ownedId);
    if (!a) continue;
    if (a.credits.byCard[targetId]) credit += a.credits.byCard[targetId];
    for (const [group, pts] of Object.entries(a.credits.byGroup)) {
      if (target.groups.includes(group as AdvanceGroup)) {
        credit += pts ?? 0;
        break;
      }
    }
  }
  return credit;
}

/** Net cost to buy `targetId` after credits (never below 0). */
export function netAdvanceCost(owned: string[], targetId: string): number {
  const a = advanceById.get(targetId);
  if (!a) return Infinity;
  return Math.max(0, a.cost - creditTowards(owned, targetId));
}

/** Distinct AST color-groups represented by a set of owned advances. Cards in
 *  two groups count for both (§31.551 / §33.23). */
export function cardGroupsHeld(owned: string[]): Set<AdvanceGroup> {
  const groups = new Set<AdvanceGroup>();
  for (const id of owned) {
    const a = advanceById.get(id);
    if (!a) continue;
    for (const g of a.groups) groups.add(g);
  }
  return groups;
}

/** Total face value of owned advances (for AST / victory). */
export function advancesFaceValue(owned: string[]): number {
  return owned.reduce((s, id) => s + (advanceById.get(id)?.cost ?? 0), 0);
}

/** The public face of a trade bundle (§28.3). */
export function bundleFace(b: { declared: Record<string, number>; count?: number; claimed?: Record<string, number> }): {
  count: number; guaranteed: Record<string, number>; claimed: Record<string, number>; unspecified: number; legacy: boolean;
} {
  const size = (m: Record<string, number>) => Object.values(m).reduce((t, n) => t + Math.max(0, n), 0);
  if (b.count == null) return { count: size(b.declared), guaranteed: {}, claimed: { ...b.declared }, unspecified: 0, legacy: true };
  const claimed = { ...(b.claimed ?? {}) };
  return { count: b.count, guaranteed: { ...b.declared }, claimed, unspecified: Math.max(0, b.count - size(b.declared) - size(claimed)), legacy: false };
}
