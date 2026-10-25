import { describe, expect, it } from 'vitest';
import { Rng } from 'digital-boardgame-framework';
import { adapter, createGame } from '../engine/index.js';
import { HeuristicAI } from './heuristic.js';
import type { GameState, PlayerId } from '../engine/types.js';

const ai = new HeuristicAI();

function tradeState(hands: Record<PlayerId, Record<string, number>>): GameState {
  const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
  for (const id of s.seating) s.players[id]!.hand = hands[id] ?? {};
  s.phase = 'trade';
  s.activeOrder = ['egypt', 'babylon'];
  s.actedThisPhase = [];
  s.negotiation = { turnPointer: 0, passStreak: 0, actions: 0, nextOfferId: 0, offers: [], completed: [] };
  return s;
}

async function runTradePhase(s0: GameState, seed = 1): Promise<GameState> {
  let s = s0;
  let guard = 0;
  while (guard++ < 60) {
    const actor = adapter.currentActor(s);
    if (!actor || s.phase !== 'trade') break;
    const action = await ai.selectAction({ state: s, actor, adapter, rng: new Rng(seed + guard) });
    s = adapter.applyAction(s, action, actor);
  }
  return s;
}

describe('AI trade negotiation (open-offer board)', () => {
  it('posts, responds to, and completes a set-building swap', async () => {
    const s = await runTradePhase(
      tradeState({
        egypt: { salt: 4, iron: 4, ochre: 2 },
        babylon: { iron: 5, salt: 2, hides: 2 },
      }),
    );
    expect((s.negotiation.completed ?? []).length).toBeGreaterThan(0);
    expect(s.players['egypt']!.hand['salt']! + s.players['babylon']!.hand['iron']!).toBeGreaterThan(6);
  });

  it('posts an offer even with no visible willing partner (multiplayer-fair, blind)', async () => {
    const s = tradeState({ egypt: { salt: 3, iron: 2, ochre: 1 }, babylon: {} });
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    expect(action.type).toBe('postOffer');
  });

  it('offers fair value when it asks for a valuable card (report 257661f3)', async () => {
    const s = tradeState({ egypt: { gold: 2, ochre: 3, hides: 2, wine: 1, salt: 1 }, babylon: {} });
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    expect(action.type).toBe('postOffer');
    if (action.type !== 'postOffer') return;
    expect(action.wants).toEqual(['gold']);
    const worth = Object.entries(action.give.actual).reduce(
      (t, [c, k]) => t + k * ({ ochre: 1, hides: 1, salt: 3, wine: 5 } as Record<string, number>)[c]!,
      0,
    );
    expect(worth).toBeGreaterThanOrEqual(11);
    expect(action.give.declared['wine']).toBe(1);
  });

  it('never lowballs, nor pays a better card for a worse one, when spares fall short', async () => {
    const s = tradeState({ egypt: { gold: 1, salt: 1, ochre: 2, hides: 1 }, babylon: {} });
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    if (action.type === 'postOffer') {
      expect(action.wants).not.toEqual(['gold']);
      expect(action.give.actual['gold'] ?? 0).toBe(0);
    }
  });

  it('dumps a tradable calamity onto a trade partner (bluffed, then passed on the deal)', async () => {
    const s = await runTradePhase(
      tradeState({
        egypt: { salt: 3, iron: 2, 'calamity:epidemic': 1 },
        babylon: { iron: 3, salt: 2, hides: 1 },
      }),
    );
    expect(s.players['egypt']!.hand['calamity:epidemic']).toBeUndefined();
    expect((s.negotiation.completed ?? []).length).toBeGreaterThan(0);
    expect(
      s.log.some((l) => (l.msg ?? '').includes('egypt') && (l.msg ?? '').includes('suffers Epidemic')),
    ).toBe(false);
  });

  it('passes rather than respond to an offer it cannot benefit from', async () => {
    const s = tradeState({ egypt: { iron: 5, ochre: 1 }, babylon: { wine: 3 } });
    s.negotiation.offers = [
      {
        id: 1,
        from: 'egypt',
        wants: ['salt'],
        responses: [],
        give: { actual: { iron: 2, ochre: 1 }, declared: { iron: 2, ochre: 1 } },
      },
    ];
    s.negotiation.turnPointer = 1;
    const respond = await ai.selectAction({ state: s, actor: 'babylon', adapter, rng: new Rng(1) });
    expect(respond.type).toBe('pass');
  });

  const ownOffer = () => ({
    id: 2,
    from: 'babylon',
    wants: ['salt'],
    responses: [],
    give: { actual: { hides: 2, ochre: 1 }, declared: { hides: 2 }, count: 3, claimed: { ochre: 1 } },
  });

  it("hands over a good wanted card when the offer's named cards repay it", async () => {
    const s = tradeState({ egypt: { bronze: 2, ochre: 1 }, babylon: { wine: 1, ochre: 2, hides: 2 } });
    s.negotiation.offers = [
      {
        id: 1,
        from: 'egypt',
        wants: ['wine'],
        responses: [],
        give: { actual: { bronze: 2, ochre: 1 }, declared: { bronze: 2 }, count: 3, claimed: { ochre: 1 } },
      },
      ownOffer(),
    ];
    s.negotiation.turnPointer = 1;
    const respond = await ai.selectAction({ state: s, actor: 'babylon', adapter, rng: new Rng(1) });
    expect(respond.type).toBe('respondOffer');
    if (respond.type === 'respondOffer') expect(respond.give.declared['wine']).toBe(1);
  });

  it('keeps a good card when the offer only names cheap ones', async () => {
    const s = tradeState({ egypt: { ochre: 2, hides: 1 }, babylon: { gold: 1, ochre: 1, iron: 2, papyrus: 2 } });
    s.negotiation.offers = [
      {
        id: 1,
        from: 'egypt',
        wants: ['gold'],
        responses: [],
        give: { actual: { ochre: 2, hides: 1 }, declared: { ochre: 2 }, count: 3, claimed: { hides: 1 } },
      },
      ownOffer(),
    ];
    s.negotiation.turnPointer = 1;
    const respond = await ai.selectAction({ state: s, actor: 'babylon', adapter, rng: new Rng(1) });
    expect(respond.type).toBe('respondOffer');
    if (respond.type === 'respondOffer') expect(respond.give.actual['gold'] ?? 0).toBe(0);
  });

  it('builds a ship from a coastal foothold with spare tokens', async () => {
    const { areas, adjacency, areaById } = await import('../data/index.js');
    const coast = areas.find(
      (a) => !a.isWater && (adjacency[a.id] ?? []).some((n) => areaById.get(n)?.isWater),
    )!;
    const s = createGame({ players: ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
    s.areas = { [coast.id]: { tokens: { egypt: 6 } } };
    s.players['egypt']!.stock = 55 - 6;
    s.players['egypt']!.shipsAvailable = 4;
    s.phase = 'shipConstruction';
    s.activeOrder = ['egypt', 'babylon'];
    s.actedThisPhase = [];
    const action = await ai.selectAction({ state: s, actor: 'egypt', adapter, rng: new Rng(1) });
    expect(action.type).toBe('buildShips');
  });
});
