import { describe, expect, it } from 'vitest';
import { adapter, createGame, normalize } from './index.js';
import { pieceConservationProblems } from './helpers.js';
import { pieceCounts } from '../data/index.js';
import type { GameState, TradeBundle } from './types.js';
import { toTradePhase } from './trade.negotiation.test.js';

describe('trade acquisition and ninth stack (§27.51)', () => {
  const toCollection = (treasury: Record<string, number>) => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 11, maxTurns: 60 });
    s.areas['thebes'] = { tokens: {}, city: 'egypt' };
    s.areas['susa'] = { tokens: {}, city: 'babylon' };
    for (const id of s.seating) {
      const p = s.players[id]!;
      p.citiesAvailable -= 1; p.hand = {}; p.treasury = treasury[id] ?? 0;
      let board = 0; for (const a of Object.values(s.areas)) board += a.tokens[id] ?? 0;
      p.stock = 55 - board - p.treasury;
    }
    s.phase = 'tradeAcquisition'; s.ninthStack = undefined; s.activeOrder = [...s.seating]; s.actedThisPhase = [];
    normalize(s);
    return s;
  };

  it('offers Gold/Ivory right after a player draws, before the next player draws (§27.51)', () => {
    let s = toCollection({ egypt: 40 });
    expect(s.ninthStack?.awaiting).toBe(true);
    expect(adapter.currentActor(s)).toBe('egypt');
    const draws = () => s.log.filter((e) => e.kind === 'trade.cards.draw').map((e) => e.side);
    expect(draws()).toEqual(['egypt']);
    const counts = adapter.legalActions(s, 'egypt').filter((a) => a.type === 'buyTradeCard').map((a) => (a as { count: number }).count);
    expect(counts).toEqual([1, 2]);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
    s = adapter.applyAction(s, { type: 'buyTradeCard', count: 1 }, 'egypt');
    expect(s.players['egypt']!.treasury).toBe(22);
    expect(Object.values(s.players['egypt']!.hand).reduce((x, y) => x + y, 0)).toBe(2);
    const kinds = s.log.filter((e) => e.kind === 'trade.buyNinth' || e.kind === 'trade.cards.draw').map((e) => `${e.kind}:${e.side}`);
    expect(kinds).toEqual(['trade.cards.draw:egypt', 'trade.buyNinth:egypt', 'trade.cards.draw:babylon']);
    expect(s.ninthStack).toBeUndefined();
    expect(s.phase).toBe('trade');
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('skips the window for players who cannot afford a card, and may be declined', () => {
    let s = toCollection({ babylon: 18 });
    expect(adapter.currentActor(s)).toBe('babylon');
    s = adapter.applyAction(s, { type: 'pass' }, 'babylon');
    expect(s.players['babylon']!.treasury).toBe(18);
    expect(s.log.some((e) => e.kind === 'trade.buyNinth.skip')).toBe(true);
    expect(s.phase).toBe('trade');
  });

  it('no longer sells Gold/Ivory during trading', () => {
    let s = toTradePhase(createGame({ players: ['egypt', 'babylon'], seed: 11, maxTurns: 60 }));
    const actor = adapter.currentActor(s)!;
    s.players[actor]!.stock -= 40; s.players[actor]!.treasury += 40;
    expect(() => adapter.applyAction(s, { type: 'buyTradeCard', count: 1 }, actor)).toThrow(/§27\.51/);
    expect(adapter.legalActions(s, actor).some((a) => a.type === 'buyTradeCard')).toBe(false);
  });

  it('redacts open offers/responses and completed deals per seat', () => {
    let s = toTradePhase(createGame({ players: ['egypt', 'babylon', 'crete'], seed: 13, maxTurns: 60 }));
    const from = adapter.currentActor(s)!;
    const other = s.seating.find((p) => p !== from)!;
    s.players[from]!.hand = { salt: 2, ochre: 1 };
    s = adapter.applyAction(s, { type: 'postOffer', give: { actual: { salt: 2, ochre: 1 }, declared: { salt: 2 }, count: 3, claimed: { ochre: 1 } }, wants: ['iron'] }, from);
    const otherView = adapter.viewFor(s, other);
    expect(otherView.negotiation.offers[0]!.give.declared).toEqual({ salt: 2 });
    expect(otherView.negotiation.offers[0]!.give.count).toBe(3);
    expect(otherView.negotiation.offers[0]!.give.actual).toEqual({});
    expect(otherView.players[from]!.hand).toEqual({});
  });
});

describe('trade turns: waiting, waking, who opens (report 102e774c)', () => {
  function trading(): GameState {
    const s = createGame({ players: ['egypt', 'babylon', 'crete'], seed: 1, maxTurns: 60 });
    s.players['egypt']!.hand = { salt: 3, iron: 2 };
    s.players['babylon']!.hand = { iron: 3, salt: 2 };
    s.players['crete']!.hand = { wine: 3, ochre: 2 };
    s.phase = 'trade'; s.activeOrder = ['egypt', 'babylon', 'crete']; s.actedThisPhase = [];
    s.negotiation = { turnPointer: 0, passStreak: 0, actions: 0, nextOfferId: 0, done: [], offers: [], completed: [], waitStreak: 0 };
    return s;
  }
  const give = (actual: Record<string, number>): TradeBundle => ({ actual, declared: actual, count: Object.values(actual).reduce((t, n) => t + n, 0) });

  it('brings a done player back when someone answers their standing offer', () => {
    let s = trading();
    s = adapter.applyAction(s, { type: 'postOffer', give: give({ iron: 2, salt: 1 }), wants: ['salt'] }, 'egypt');
    s = adapter.applyAction(s, { type: 'pass' }, 'babylon');
    s = adapter.applyAction(s, { type: 'pass' }, 'crete');
    s = adapter.applyAction(s, { type: 'pass' }, 'egypt');
    expect(s.phase).not.toBe('trade');

    let t = trading();
    t = adapter.applyAction(t, { type: 'postOffer', give: give({ iron: 2, salt: 1 }), wants: ['salt'] }, 'egypt');
    t.negotiation.done = ['crete', 'egypt']; t.negotiation.turnPointer = 1;
    t = adapter.applyAction(t, { type: 'respondOffer', offerId: 1, give: give({ salt: 2, iron: 1 }) }, 'babylon');
    expect(t.negotiation.done).toEqual(['crete']);
    expect(adapter.currentActor(t)).toBe('egypt');
    t = adapter.applyAction(t, { type: 'acceptResponse', offerId: 1, responder: 'babylon' }, 'egypt');
    expect(t.negotiation.completed).toHaveLength(1);
  });

  it('lets a player wait out a turn, and ends after a full round of waiting', () => {
    let s = trading();
    s = adapter.applyAction(s, { type: 'tradeWait' }, 'egypt');
    expect(s.negotiation.done).toEqual([]);
    s = adapter.applyAction(s, { type: 'postOffer', give: give({ iron: 3 }), wants: ['salt'] }, 'babylon');
    expect(s.negotiation.waitStreak).toBe(0);
    s = adapter.applyAction(s, { type: 'tradeWait' }, 'crete');
    s = adapter.applyAction(s, { type: 'tradeWait' }, 'egypt');
    expect(s.phase).toBe('trade');
    s = adapter.applyAction(s, { type: 'tradeWait' }, 'babylon');
    expect(s.phase).not.toBe('trade');
  });

  it('opens trading with a different nation each turn', () => {
    const openers = [1, 2, 3].map((turn) => {
      let s = createGame({ players: ['egypt', 'babylon', 'crete'], seed: 1, maxTurns: 60 });
      s.turn = turn;
      s = toTradePhase(s);
      return s.activeOrder[s.negotiation.turnPointer % s.activeOrder.length];
    });
    expect(new Set(openers).size).toBe(3);
  });
});
