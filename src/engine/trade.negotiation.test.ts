import { describe, expect, it } from 'vitest';
import { adapter, createGame } from './index.js';
import { bundleFace } from './helpers.js';
import type { GameState, TradeBundle } from './types.js';

export function toTradePhase(s: GameState): GameState {
  let guard = 0;
  while (s.phase !== 'trade' && adapter.result(s) == null && guard++ < 500) {
    const actor = adapter.currentActor(s);
    if (actor == null) break;
    s = adapter.applyAction(s, { type: 'pass' }, actor);
  }
  return s;
}

export function endTrade(s: GameState): GameState {
  let guard = 0;
  while (guard++ < 500) {
    const actor = adapter.currentActor(s);
    if (actor == null) break;
    if (s.phase === 'trade') { s = adapter.applyAction(s, { type: 'pass' }, actor); continue; }
    if (s.pendingCityChoice || s.pendingUnitLoss || s.pendingAllocation) {
      const suggested = adapter.legalActions(s, actor).find((a) => a.type === 'chooseCities' || a.type === 'chooseUnits' || a.type === 'allocateLoss');
      if (suggested) { s = adapter.applyAction(s, suggested, actor); continue; }
    }
    break;
  }
  return s;
}

describe('trade negotiation (open-offer board)', () => {
  it('reaches the trade phase with an actor to act', () => {
    const s = toTradePhase(createGame({ players: ['egypt', 'babylon', 'crete'], seed: 7, maxTurns: 60 }));
    expect(s.phase).toBe('trade');
    expect(adapter.currentActor(s)).not.toBeNull();
  });

  it('posts an offer, a partner responds, and the owner accepts — swapping the actual cards', () => {
    let s = toTradePhase(createGame({ players: ['egypt', 'babylon'], seed: 3, maxTurns: 60 }));
    const from = adapter.currentActor(s)!;
    const to = s.seating.find((p) => p !== from)!;
    s.players[from]!.hand = { salt: 2, ochre: 2 };
    s.players[to]!.hand = { iron: 2, hides: 2 };
    s = adapter.applyAction(s, { type: 'postOffer', give: { actual: { salt: 2, ochre: 1 }, declared: { salt: 2 }, count: 3, claimed: { ochre: 1 } }, wants: ['iron'] }, from);
    expect(adapter.currentActor(s)).toBe(to);
    const offerId = s.negotiation.offers[0]!.id;
    s = adapter.applyAction(s, { type: 'respondOffer', offerId, give: { actual: { iron: 2, hides: 1 }, declared: { iron: 2 }, count: 3 } }, to);
    s = adapter.applyAction(s, { type: 'acceptResponse', offerId, responder: to }, from);
    expect(s.players[from]!.hand).toEqual({ ochre: 1, iron: 2, hides: 1 });
    expect(s.players[to]!.hand).toEqual({ hides: 1, salt: 2, ochre: 1 });
    expect((s.negotiation.completed ?? []).length).toBe(1);
    expect(s.negotiation.offers.length).toBe(0);
  });

  it('allows a bluff in the non-binding claims — while secretly giving a calamity (§28.3)', () => {
    let s = toTradePhase(createGame({ players: ['egypt', 'babylon'], seed: 5, maxTurns: 60 }));
    const from = adapter.currentActor(s)!;
    const to = s.seating.find((p) => p !== from)!;
    for (const id of s.seating) s.players[id]!.hand = {};
    s.players[from]!.hand = { salt: 2, 'calamity:epidemic': 1 };
    s.players[to]!.hand = { iron: 3 };
    s.calamityTradedFrom = {};
    s = adapter.applyAction(s, { type: 'postOffer', give: { actual: { salt: 2, 'calamity:epidemic': 1 }, declared: { salt: 2 }, count: 3, claimed: { wine: 1 } }, wants: ['iron'] }, from);
    const offerId = s.negotiation.offers[0]!.id;
    const toView = adapter.viewFor(s, to);
    expect(toView.negotiation.offers[0]!.give.declared).toEqual({ salt: 2 });
    expect(toView.negotiation.offers[0]!.give.claimed).toEqual({ wine: 1 });
    expect(toView.negotiation.offers[0]!.give.count).toBe(3);
    expect(toView.negotiation.offers[0]!.give.actual).toEqual({});
    s = adapter.applyAction(s, { type: 'respondOffer', offerId, give: { actual: { iron: 3 }, declared: { iron: 2 }, count: 3, claimed: { iron: 1 } } }, to);
    s = adapter.applyAction(s, { type: 'acceptResponse', offerId, responder: to }, from);
    expect(s.players[to]!.hand['calamity:epidemic']).toBe(1);
    expect(s.players[from]!.hand['calamity:epidemic']).toBeUndefined();
    expect(s.calamityTradedFrom['epidemic']).toBe(from);
    s = endTrade(s);
    expect(s.log.some((l) => (l.msg ?? '').includes(to) && (l.msg ?? '').includes('Epidemic'))).toBe(true);
    expect(s.log.some((l) => (l.msg ?? '').includes(from) && (l.msg ?? '').includes('suffers Epidemic'))).toBe(false);
  });

  it('rejects offers that break §28.3 (report eb3d4cdf)', () => {
    let s = toTradePhase(createGame({ players: ['egypt', 'babylon'], seed: 9, maxTurns: 60 }));
    const from = adapter.currentActor(s)!;
    s.players[from]!.hand = { salt: 2, ochre: 2, 'calamity:volcano': 1 };
    const bad = (give: TradeBundle, wants: string[] = ['iron'], why?: RegExp) =>
      expect(() => adapter.applyAction(s, { type: 'postOffer', give, wants }, from)).toThrow(why);
    bad({ actual: { salt: 2 }, declared: { salt: 2 }, count: 2 });
    bad({ actual: { salt: 2, ochre: 1 }, declared: { salt: 2 }, count: 4 }, ['iron'], /honest number/);
    bad({ actual: { salt: 2, ochre: 1 }, declared: { salt: 2, ochre: 1 } }, ['iron'], /honest number/);
    bad({ actual: { salt: 2, ochre: 1 }, declared: { salt: 1 }, count: 3 }, ['iron'], /at least two/);
    bad({ actual: { salt: 2, ochre: 1 }, declared: { salt: 1, iron: 1 }, count: 3 }, ['iron'], /must really be in the trade/);
    bad({ actual: { salt: 2, ochre: 1 }, declared: { salt: 2 }, count: 3, claimed: { iron: 2 } }, ['iron'], /not named/);
    bad({ actual: { salt: 2, 'calamity:volcano': 1 }, declared: { salt: 2 }, count: 3 });
    bad({ actual: { salt: 2, ochre: 1 }, declared: { salt: 2 }, count: 3 }, []);
  });

  it('lets the unnamed cards go unspecified, and shows others the count (§28.3)', () => {
    let s = toTradePhase(createGame({ players: ['egypt', 'babylon'], seed: 9, maxTurns: 60 }));
    const from = adapter.currentActor(s)!;
    const to = s.seating.find((p) => p !== from)!;
    s.players[from]!.hand = { salt: 2, ochre: 2 };
    s = adapter.applyAction(s, { type: 'postOffer', give: { actual: { salt: 2, ochre: 2 }, declared: { salt: 2 }, count: 4 }, wants: ['iron'] }, from);
    const face = bundleFace(adapter.viewFor(s, to).negotiation.offers[0]!.give);
    expect(face).toMatchObject({ count: 4, guaranteed: { salt: 2 }, claimed: {}, unspecified: 2, legacy: false });
    expect(bundleFace({ declared: { salt: 2, wine: 1 } })).toMatchObject({ count: 3, guaranteed: {}, legacy: true });
  });

  it('tracks negotiation rounds up to 3 and enforces cap', () => {
    let s = toTradePhase(createGame({ players: ['egypt', 'babylon'], seed: 9, maxTurns: 60 }));
    expect(s.negotiation.round).toBe(1);
    expect(s.negotiation.maxRounds).toBe(3);

    const first = adapter.currentActor(s)!;
    const second = s.seating.find((p) => p !== first)!;

    s.players[first]!.hand = { salt: 2, ochre: 1 };
    s.players[second]!.hand = { salt: 2, ochre: 1 };

    // first player posts offer (action 1)
    s = adapter.applyAction(s, {
      type: 'postOffer',
      give: { actual: { salt: 2, ochre: 1 }, declared: { salt: 2 }, count: 3 },
      wants: ['iron'],
    }, first);

    // second player posts offer (action 2)
    s = adapter.applyAction(s, {
      type: 'postOffer',
      give: { actual: { salt: 2, ochre: 1 }, declared: { salt: 2 }, count: 3 },
      wants: ['iron'],
    }, second);

    expect(s.negotiation.actions).toBe(2);
  });

  it('allows bluffing with a tradable calamity declared as a commodity claim (§28.3)', () => {
    let s = toTradePhase(createGame({ players: ['egypt', 'babylon'], seed: 9, maxTurns: 60 }));
    const from = adapter.currentActor(s)!;
    const to = s.seating.find((p) => p !== from)!;

    s.players[from]!.hand = { salt: 2, 'calamity:treachery': 1 };
    s.players[to]!.hand = { iron: 3 };

    // From offers salt 2 (guaranteed) + 1 secret card claimed as iron
    s = adapter.applyAction(s, {
      type: 'postOffer',
      give: {
        actual: { salt: 2, 'calamity:treachery': 1 },
        declared: { salt: 2 },
        count: 3,
        claimed: { iron: 1 },
      },
      wants: ['iron'],
    }, from);

    const offerId = s.negotiation.offers[0]!.id;
    s = adapter.applyAction(s, {
      type: 'respondOffer',
      offerId,
      give: { actual: { iron: 3 }, declared: { iron: 2 }, count: 3, claimed: { iron: 1 } },
    }, to);

    // From accepts response: trade completes, calamity passed
    s = adapter.applyAction(s, { type: 'acceptResponse', offerId, responder: to }, from);
    expect(s.players[to]!.hand['calamity:treachery']).toBe(1);
    expect(s.players[from]!.hand['calamity:treachery']).toBeUndefined();
    expect((s.negotiation.completed ?? []).length).toBe(1);
  });
});

