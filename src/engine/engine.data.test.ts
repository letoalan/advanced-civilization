import { describe, expect, it } from 'vitest';
import { validateData, advanceById, commodities, calamities } from '../data/index.js';
import {
  commoditySetValue,
  handValue,
  creditTowards,
  netAdvanceCost,
  cardGroupsHeld,
} from './helpers.js';
import { createGame, adapter } from './index.js';

describe('data integrity', () => {
  it('has no cross-reference problems', () => {
    expect(validateData()).toEqual([]);
  });
  it('has 114 commodity cards total', () => {
    expect(commodities.reduce((s, c) => s + c.count, 0)).toBe(114);
  });
  it('forms one connected map across all three panels (seam areas merged)', async () => {
    const { areas, adjacency, areaById } = await import('../data/index.js');
    // BFS over the whole adjacency graph from any area.
    const seen = new Set<string>([areas[0]!.id]);
    const stack = [areas[0]!.id];
    while (stack.length) { const x = stack.pop()!; for (const n of adjacency[x] ?? []) if (!seen.has(n)) { seen.add(n); stack.push(n); } }
    expect(seen.size).toBe(areas.length); // single connected component
    // All three panels are represented and therefore mutually reachable.
    const boards = new Set(areas.map((a) => a.board));
    expect(boards).toEqual(new Set(['western', 'main', 'eastern']));
    // Adjacency is symmetric and references only real areas.
    for (const [id, nbrs] of Object.entries(adjacency)) {
      for (const n of nbrs) { expect(areaById.has(n)).toBe(true); expect(adjacency[n]).toContain(id); }
    }
  });
});

describe('calamity trade status (verified vs rules §9.1)', () => {
  it('is exactly 8 tradable / 4 non-tradable', () => {
    expect(calamities.filter((c) => c.tradable).map((c) => c.id).sort()).toEqual(
      ['barbarianhordes', 'civildisorder', 'epidemic', 'iconoclasm', 'piracy', 'slaverevolt', 'superstition', 'treachery'].sort(),
    );
    expect(calamities.filter((c) => !c.tradable).map((c) => c.id).sort()).toEqual(
      ['civilwar', 'famine', 'flood', 'volcano'].sort(),
    );
  });
});

describe('commodity scoring', () => {
  it('values a set as n^2 * value, capped at count', () => {
    expect(commoditySetValue('salt', 3)).toBe(9 * 3); // value 3
    expect(commoditySetValue('gold', 2)).toBe(4 * 9);
    // capped at count (salt count 9)
    expect(commoditySetValue('salt', 99)).toBe(81 * 3);
  });
  it('sums hand value across commodities', () => {
    expect(handValue({ salt: 2, gold: 1 })).toBe(4 * 3 + 1 * 9);
  });
  it('matches the printed card value rows (verified vs rules p.5)', () => {
    // Iron (value 2, 8 cards): 2,8,18,32,50,72,98,128
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((n) => commoditySetValue('iron', n))).toEqual([2, 8, 18, 32, 50, 72, 98, 128]);
    // Wine (value 5, 6 cards): 5,20,45,80,125,180
    expect([1, 2, 3, 4, 5, 6].map((n) => commoditySetValue('wine', n))).toEqual([5, 20, 45, 80, 125, 180]);
    // Ivory (value 9, 4 cards): 9,36,81,144
    expect([1, 2, 3, 4].map((n) => commoditySetValue('ivory', n))).toEqual([9, 36, 81, 144]);
  });
  it('mining bumps the best mineable set by one card', () => {
    const base = handValue({ iron: 2 });
    const mined = handValue({ iron: 2 }, { mining: true });
    expect(mined).toBeGreaterThan(base);
    // iron value 2: set of 3 (18) vs set of 2 (8) => gain 10
    expect(mined - base).toBe(commoditySetValue('iron', 3) - commoditySetValue('iron', 2));
  });
});

describe('advance credits', () => {
  it('pottery credits 10 to other crafts and to democracy/monotheism', () => {
    expect(creditTowards(['pottery'], 'clothmaking')).toBe(10);
    expect(creditTowards(['pottery'], 'democracy')).toBe(10);
    expect(creditTowards(['pottery'], 'astronomy')).toBe(0); // sciences, not credited by pottery
  });
  it('credits reduce net cost but never below zero', () => {
    // engineering (140) gives 20 to philosophy; with many sciences could exceed.
    const owned = ['astronomy', 'coinage', 'medicine', 'engineering', 'mathematics'];
    const net = netAdvanceCost(owned, 'philosophy');
    expect(net).toBeGreaterThanOrEqual(0);
    expect(net).toBeLessThan(advanceById.get('philosophy')!.cost);
  });
  it('counts dual-group cards in both groups', () => {
    // mysticism is Religion + Arts
    const groups = cardGroupsHeld(['mysticism']);
    expect(groups.has('Religion')).toBe(true);
    expect(groups.has('Arts')).toBe(true);
  });
  it('does not grant a freshly-bought card’s credit in the same turn (§31.53)', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
    s.phase = 'acquireAdvances'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    s.players['egypt']!.hand = {}; s.players['egypt']!.treasury = 80; // pay by treasury only
    // Buy Pottery (45). It credits 10 toward Cloth Making — but not until next turn.
    const after = adapter.applyAction(s, { type: 'buyAdvance', advance: 'pottery', spendCommodities: {}, spendTreasury: 45 }, 'egypt');
    expect(after.players['egypt']!.advances).toContain('pottery');
    // 35 treasury left; Cloth Making costs 45. With the (illegal) same-turn credit it
    // would be affordable; §31.53 forbids it, so this must be rejected.
    expect(() => adapter.applyAction(after, { type: 'buyAdvance', advance: 'clothmaking', spendCommodities: {}, spendTreasury: 35 }, 'egypt')).toThrow(/insufficient/);
  });
  it('buys several cards as one pooled transaction, excess lost (§31.1/§31.58)', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
    s.phase = 'acquireAdvances'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    // 7 ochre = 49 (a set of 7 in stack 1). Pottery 45 + Cloth Making 45 = 90.
    s.players['egypt']!.hand = { ochre: 7 }; s.players['egypt']!.treasury = 60;
    const after = adapter.applyAction(s, { type: 'buyAdvance', advances: ['pottery', 'clothmaking'], spendCommodities: { ochre: 7 }, spendTreasury: 60 }, 'egypt');
    const p = after.players['egypt']!;
    expect(p.advances).toContain('pottery');
    expect(p.advances).toContain('clothmaking');
    // 90 owed, 49 from cards — exactly 41 comes out of treasury (§31.41: no
    // deliberate overpay), and the 4 points of card value over the top are lost.
    expect(p.treasury).toBe(19);
  });
  it('gives no basket-mate discount inside one transaction (§31.53)', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
    s.phase = 'acquireAdvances'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    s.players['egypt']!.hand = {}; s.players['egypt']!.treasury = 89; // 90 - the illegal 10 credit
    expect(() => adapter.applyAction(s, { type: 'buyAdvance', advances: ['pottery', 'clothmaking'], spendCommodities: {}, spendTreasury: 89 }, 'egypt')).toThrow(/insufficient/);
  });
  it('uses Mining only once per turn (§32.261, report cc8187aa)', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
    s.phase = 'acquireAdvances'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const p = s.players['egypt']!;
    // Music and Drama are Arts: Mining's Crafts credit doesn't touch them.
    p.advances = ['mining']; p.hand = { gems: 2, gold: 1 }; p.treasury = 30;
    // Gems ×2 is 32, or 72 with Mining — Music (60) needs no treasury with it.
    const after = adapter.applyAction(s, { type: 'buyAdvance', advance: 'music', spendCommodities: { gems: 2 }, spendTreasury: 30 }, 'egypt');
    expect(after.players['egypt']!.advances).toContain('music');
    expect(after.players['egypt']!.treasury).toBe(30); // Mining covered it
    // Gold ×1 (9) + 30 treasury = 39 < 60. Mining would make the Gold 36 (66 in
    // all), but it has already been used this turn.
    expect(() => adapter.applyAction(after, { type: 'buyAdvance', advance: 'drama', spendCommodities: { gold: 1 }, spendTreasury: 30 }, 'egypt')).toThrow(/insufficient/);
    expect(adapter.legalActions(after, 'egypt').some((a) => a.type === 'buyAdvance' && (a as { advance?: string }).advance === 'drama')).toBe(false);
  });
  it('keeps Mining for later when a purchase does not need it (§32.261)', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
    s.phase = 'acquireAdvances'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const p = s.players['egypt']!;
    p.advances = ['mining']; p.hand = { gems: 4, gold: 1 }; p.treasury = 24;
    // Gems ×4 is 128 (200 with Mining) — Music is paid in full without Mining, so
    // Mining isn't spent on it.
    const after = adapter.applyAction(s, { type: 'buyAdvance', advance: 'music', spendCommodities: { gems: 4 }, spendTreasury: 0 }, 'egypt');
    // Gold ×1 with Mining is 36, + 24 treasury = 60: Drama is affordable.
    const done = adapter.applyAction(after, { type: 'buyAdvance', advance: 'drama', spendCommodities: { gold: 1 }, spendTreasury: 24 }, 'egypt');
    expect(done.players['egypt']!.advances).toContain('drama');
  });
  it('requires a prerequisite acquired in an earlier turn (§31.62)', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
    s.phase = 'acquireAdvances'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    s.players['egypt']!.hand = {}; s.players['egypt']!.treasury = 400;
    // Engineering (140) is required for Mining (60) — but not in the same turn.
    expect(() => adapter.applyAction(s, { type: 'buyAdvance', advances: ['engineering', 'mining'], spendCommodities: {}, spendTreasury: 200 }, 'egypt')).toThrow(/§31.62/);
    const after = adapter.applyAction(s, { type: 'buyAdvance', advance: 'engineering', spendCommodities: {}, spendTreasury: 140 }, 'egypt');
    expect(() => adapter.applyAction(after, { type: 'buyAdvance', advance: 'mining', spendCommodities: {}, spendTreasury: 60 }, 'egypt')).toThrow(/§31.62/);
  });
});
