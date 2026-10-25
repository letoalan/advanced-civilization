import { describe, expect, it } from 'vitest';
import { createGame, adapter, victoryScore, monotheismTargets, militaryLast, astOrder, censusOrder } from './index.js';
import type { Action } from './types.js';

describe('advance refinements (§32.261/.631/.251)', () => {
  it('Mining boosts commodity value in the victory score (§32.261)', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    const e = s.players['egypt']!;
    e.treasury = 0; e.astSpace = 0;
    const vs = (adv: string[], hand: Record<string, number>) => { e.advances = adv; e.hand = hand; return victoryScore(s, 'egypt'); };
    const miningBase = vs(['mining'], {});
    const miningIron = vs(['mining'], { iron: 3 }); // set valued as 4 cards: 32
    const plainBase = vs([], {});
    const plainIron = vs([], { iron: 3 }); // set of 3: 18
    expect(miningIron - miningBase).toBe(32); // §32.261 one card larger
    expect(plainIron - plainBase).toBe(18);
  });

  it('Architecture assists only one city per turn (§32.631)', async () => {
    const { areas } = await import('../data/index.js');
    const sites = areas.filter((a) => !a.isWater && a.isCitySite).slice(0, 2).map((a) => a.id);
    let s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    s.areas = {} as typeof s.areas;
    for (const aid of sites) s.areas[aid] = { tokens: { egypt: 3 } }; // 3 on-board (city site needs 6)
    s.players['egypt']!.advances = ['architecture'];
    s.players['egypt']!.treasury = 20; s.players['egypt']!.citiesAvailable = 9;
    s.phase = 'cityConstruction'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    s = adapter.applyAction(s, { type: 'buildCity', area: sites[0]!, useTreasury: 3 }, 'egypt'); // ok: 3+3
    expect(s.areas[sites[0]!]!.city).toBe('egypt');
    // Second city the same turn can't draw on treasury → 3 on-board < 6 → illegal.
    expect(() => adapter.applyAction(s, { type: 'buildCity', area: sites[1]!, useTreasury: 3 }, 'egypt')).toThrow();
    // …and legalActions must NOT offer it (no dead button — report 9f6d97cb).
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'buildCity' && a.area === sites[1]!)).toBe(false);
  });

  it('Architecture is not offered where another player has tokens (§32.631)', async () => {
    const { areas } = await import('../data/index.js');
    const site = areas.find((a) => !a.isWater && a.isCitySite)!.id;
    const s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    s.areas = { [site]: { tokens: { egypt: 4, babylon: 1 } } } as typeof s.areas;
    s.players['egypt']!.advances = ['architecture'];
    s.players['egypt']!.treasury = 20; s.players['egypt']!.citiesAvailable = 9;
    s.phase = 'cityConstruction'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'buildCity' && a.area === site)).toBe(false);
    s.areas[site]!.tokens = { egypt: 4 }; // alone there: 4 on-board + 2 treasury
    expect(adapter.legalActions(s, 'egypt')).toContainEqual({ type: 'buildCity', area: site, useTreasury: 2 });
  });

  it('Roadbuilding cannot pass through an area holding an enemy city (§32.251)', async () => {
    const { adjacency, areaById } = await import('../data/index.js');
    const isLand = (id: string) => !areaById.get(id)?.isWater;
    let chain: [string, string, string] | null = null;
    for (const b of Object.keys(adjacency)) {
      if (!isLand(b)) continue;
      const nb = (adjacency[b] ?? []).filter(isLand);
      for (const a of nb) for (const c of nb) {
        if (a !== c && !(adjacency[a] ?? []).includes(c)) { chain = [a, b, c]; break; }
      }
      if (chain) break;
    }
    expect(chain).not.toBeNull();
    const [a, b, c] = chain!;
    const base = () => {
      const s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
      s.areas = {} as typeof s.areas;
      s.areas[a] = { tokens: { egypt: 3 } };
      s.players['egypt']!.advances = ['roadbuilding', 'engineering'];
      s.phase = 'movement'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
      return s;
    };
    // Clear pass-through: the road move is legal.
    let ok = base();
    ok = adapter.applyAction(ok, { type: 'move', moves: [{ from: a, to: c, count: 2, via: b }] }, 'egypt');
    expect(ok.areas[c]!.tokens['egypt']).toBe(2);
    // Enemy city in the pass-through area blocks it.
    const blocked = base();
    blocked.areas[b] = { tokens: {}, city: 'babylon' };
    expect(() => adapter.applyAction(blocked, { type: 'move', moves: [{ from: a, to: c, count: 2, via: b }] }, 'egypt')).toThrow();

    // §23.51/§32.251: tokens that arrived overland (incl. by road) may not then
    // board a ship the same phase.
    const s = base();
    expect(() => adapter.applyAction(s, { type: 'move', moves: [
      { from: a, to: c, count: 2, via: b },
      { from: c, to: a, count: 1, byShip: true },
    ] }, 'egypt')).toThrow(/board a ship/);
  });
});

describe('A.S.T. order (§17.4)', () => {
  it('is a fixed nation order — Africa first, Iberia second, Egypt last (§17.4)', () => {
    const s = createGame({ players: ['egypt', 'iberia', 'africa', 'babylon'], seed: 7 });
    expect(astOrder(s)).toEqual(['africa', 'iberia', 'babylon', 'egypt']);
    // §17.4 anchors: Africa precedes all, Egypt follows all; Iberia (which replaces
    // Italy on the Western map) takes the second slot.
    const s2 = createGame({ players: ['indus', 'iberia', 'asia', 'africa', 'egypt'], seed: 1 });
    const order = astOrder(s2);
    expect(order[0]).toBe('africa');
    expect(order[1]).toBe('iberia'); // second, ahead of the rest
    expect(order.at(-1)).toBe('egypt');
    expect(order.indexOf('asia')).toBeLessThan(order.indexOf('indus'));
  });

  it('breaks census ties by A.S.T. order, not seating', () => {
    const s = createGame({ players: ['egypt', 'africa'], seed: 7 });
    // Equal population → Africa (lower A.S.T. rank) comes first regardless of seat.
    s.areas = { a: { tokens: { egypt: 1 } }, b: { tokens: { africa: 1 } } } as typeof s.areas;
    expect(censusOrder(s)).toEqual(['africa', 'egypt']);
  });
});

describe('Military move order (§32.831)', () => {
  it('puts Military holders after non-Military, preserving census order within each group', () => {
    const s = createGame({ players: ['egypt', 'babylon', 'crete'], seed: 7 });
    s.players['egypt']!.advances = ['military'];
    s.players['crete']!.advances = ['military'];
    expect(militaryLast(s, ['egypt', 'babylon', 'crete'])).toEqual(['babylon', 'egypt', 'crete']);
    expect(militaryLast(s, ['egypt', 'babylon', 'crete']).slice(-2).sort()).toEqual(['crete', 'egypt']);
  });
});

describe('Monotheism conversion (§32.94)', () => {
  async function twoAdjacentLand() {
    // Find a land area with a land neighbour, both usable.
    const { areas, adjacency } = await import('../data/index.js') as { areas: { id: string; isWater?: boolean }[]; adjacency: Record<string, string[]> };
    const water = new Set(areas.filter((a) => a.isWater).map((a) => a.id));
    for (const a of areas) {
      if (a.isWater) continue;
      const nb = (adjacency[a.id] ?? []).find((n) => !water.has(n));
      if (nb) return [a.id, nb] as const;
    }
    throw new Error('no adjacent land pair');
  }

  it('lets a Monotheism holder take over an adjacent enemy area, replacing pieces', async () => {
    let s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    const [mine, theirs] = await twoAdjacentLand();
    s.areas = {} as typeof s.areas;
    s.areas[mine] = { tokens: { egypt: 1 } };
    s.areas[theirs] = { tokens: { babylon: 3 }, city: 'babylon' };
    s.players['egypt']!.advances = ['monotheism'];
    s.players['egypt']!.stock = 5; s.players['egypt']!.citiesAvailable = 2;
    const babyStock = s.players['babylon']!.stock;
    s.phase = 'calamity'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const legal = adapter.legalActions(s, 'egypt').filter((a) => a.type === 'convertArea');
    expect(legal.some((a) => (a as Extract<Action, { type: 'convertArea' }>).area === theirs)).toBe(true);
    s = adapter.applyAction(s, { type: 'convertArea', area: theirs }, 'egypt');
    expect(s.areas[theirs]!.city).toBe('egypt');
    expect(s.areas[theirs]!.tokens['egypt']).toBe(3);
    expect(s.areas[theirs]!.tokens['babylon']).toBeUndefined();
    expect(s.players['babylon']!.stock).toBe(babyStock + 3); // their tokens returned
    expect(s.players['egypt']!.convertedThisTurn).toBe(true);
  });

  it('cannot convert a player who also holds Monotheism or Theology (§32.942/.952)', async () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    const [mine, theirs] = await twoAdjacentLand();
    s.areas = {} as typeof s.areas;
    s.areas[mine] = { tokens: { egypt: 1 } };
    s.areas[theirs] = { tokens: { babylon: 2 } };
    s.players['egypt']!.advances = ['monotheism']; s.players['egypt']!.stock = 5;
    s.players['babylon']!.advances = ['theology'];
    s.phase = 'calamity'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    const targets = monotheismTargets(s, 'egypt');
    expect(targets).not.toContain(theirs);
  });
});
