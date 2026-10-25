import { describe, expect, it } from 'vitest';
import { createGame, adapter, normalize, setupTaxation } from './index.js';
import type { Action } from './types.js';

describe('commodity-card hand limit (§31.71)', () => {
  it('pauses for the player to choose which surplus cards to discard; calamities are exempt', () => {
    const s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    s.players['egypt']!.hand = { ochre: 5, gold: 5, 'calamity:flood': 1 }; // 10 commodities + 1 calamity
    s.phase = 'astAdjustment'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    normalize(s); // astAdjustment pauses for the over-limit discard choice

    // §31.71: the over-limit player (egypt) must choose 2 cards to surrender.
    expect(adapter.currentActor(s)).toBe('egypt');
    expect(s.pendingDiscard).toEqual({ holder: 'egypt', count: 2 });
    const offered = adapter.legalActions(s, 'egypt');
    expect(offered).toHaveLength(1);
    expect(offered[0]).toMatchObject({ type: 'chooseDiscard' });
    expect((offered[0] as { cards: string[] }).cards).toEqual(['ochre', 'ochre']); // cheapest-first default

    // The player may pick any 2 commodity cards (here: drop 2 gold, keep the ochre).
    const after = adapter.applyAction(s, { type: 'chooseDiscard', cards: ['gold', 'gold'] }, 'egypt');
    const h = after.players['egypt']!.hand;
    const commodities = Object.entries(h).filter(([c]) => !c.startsWith('calamity:')).reduce((t, [, n]) => t + n, 0);
    expect(commodities).toBe(8); // 8 of 10 kept
    expect(h['gold']).toBe(3); // surrendered the 2 chosen
    expect(h['ochre']).toBe(5); // kept the ochre the player elected to keep
    expect(h['calamity:flood']).toBe(1); // calamity retained, doesn't count toward the 8
    expect(after.pendingDiscard).toBeUndefined(); // resolved; phase resumes

    // Discarding the wrong count is rejected (§31.71).
    expect(() => adapter.applyAction(s, { type: 'chooseDiscard', cards: ['gold'] }, 'egypt')).toThrow(/exactly 2/);
  });
});

describe('population expansion (§13 placement when stock-limited)', () => {
  it('auto-grows when stock is ample (no pause at expansion)', () => {
    const ample = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    expect(ample.phase).not.toBe('populationExpansion'); // grew automatically
  });

  it('pauses for the player to place limited tokens', async () => {
    const { areas } = await import('../data/index.js');
    let s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    const ids = areas.filter((a) => !a.isWater).slice(0, 8).map((a) => a.id); // 8 land areas
    s.areas = {} as typeof s.areas;
    for (const a of ids) s.areas[a] = { tokens: { egypt: 2 } }; // each wants +2 → needs 16 growth
    s.players['egypt']!.stock = 4; s.players['egypt']!.treasury = 20;
    s.players['babylon']!.stock = 4; s.players['babylon']!.treasury = 20;
    s.phase = 'taxation'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    setupTaxation(s); // prime taxation (no Coinage → auto-collect; 0 cities → no-op)
    normalize(s); // → population expansion; egypt is stock-short → pauses
    expect(s.phase).toBe('populationExpansion');
    expect(adapter.currentActor(s)).toBe('egypt');
    expect(s.expansion!.remaining['egypt']!).toBeGreaterThan(0);
    const legal = adapter.legalActions(s, 'egypt').filter((a): a is Extract<Action, { type: 'placeTokens' }> => a.type === 'placeTokens');
    expect(legal.length).toBeGreaterThan(0);
    const before = s.players['egypt']!.stock;
    const aid = Object.keys(legal[0]!.placements)[0]!;
    s = adapter.applyAction(s, { type: 'placeTokens', placements: { [aid]: 1 } }, 'egypt');
    expect(s.players['egypt']!.stock).toBe(before - 1);
    expect(s.areas[aid]!.tokens['egypt']).toBe(3); // 2 + 1 placed
  });

  it('growth may not be voluntarily curtailed — no passing with stock left to place (§20.2, report 417b45f3)', async () => {
    const { areas } = await import('../data/index.js');
    let s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    const ids = areas.filter((a) => !a.isWater).slice(0, 8).map((a) => a.id);
    s.areas = {} as typeof s.areas;
    for (const a of ids) s.areas[a] = { tokens: { egypt: 2 } };
    s.players['egypt']!.stock = 3; s.players['egypt']!.treasury = 20;
    s.players['babylon']!.stock = 4; s.players['babylon']!.treasury = 20;
    s.phase = 'taxation'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    setupTaxation(s);
    normalize(s);
    expect(adapter.currentActor(s)).toBe('egypt');
    // Where the tokens go is the player's call; whether to place them is not.
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'pass')).toBe(false);
    expect(() => adapter.applyAction(s, { type: 'pass' }, 'egypt')).toThrow(/20\.2|curtail/);
    for (let i = 0; i < 3; i++) {
      const legal = adapter.legalActions(s, 'egypt').filter((a): a is Extract<Action, { type: 'placeTokens' }> => a.type === 'placeTokens');
      s = adapter.applyAction(s, legal[0]!, 'egypt');
    }
    expect(s.players['egypt']!.stock).toBe(0);
    // All placed: the player confirms (or resets) before the phase moves on.
    expect(adapter.currentActor(s)).toBe('egypt');
    s = adapter.applyAction(s, { type: 'pass' }, 'egypt');
    expect(s.phase).not.toBe('populationExpansion');
  });

  it('a stock-short player can reset their placement and start over (report 271f360c)', async () => {
    const { areas } = await import('../data/index.js');
    let s = createGame({ players: ['egypt', 'babylon'], seed: 7 });
    const ids = areas.filter((a) => !a.isWater).slice(0, 8).map((a) => a.id);
    s.areas = {} as typeof s.areas;
    for (const a of ids) s.areas[a] = { tokens: { egypt: 2 } };
    s.players['egypt']!.stock = 3; s.players['egypt']!.treasury = 20;
    s.players['babylon']!.stock = 4; s.players['babylon']!.treasury = 20;
    s.phase = 'taxation'; s.activeOrder = ['egypt', 'babylon']; s.actedThisPhase = [];
    setupTaxation(s);
    normalize(s);
    const capsBefore = { ...s.expansion!.caps['egypt']! };
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'resetPlacement')).toBe(false);
    const first = ids[0]!;
    for (let i = 0; i < 2; i++) s = adapter.applyAction(s, { type: 'placeTokens', placements: { [first]: 1 } }, 'egypt');
    s = adapter.applyAction(s, { type: 'placeTokens', placements: { [ids[1]!]: 1 } }, 'egypt');
    expect(s.players['egypt']!.stock).toBe(0);
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'resetPlacement')).toBe(true);
    s = adapter.applyAction(s, { type: 'resetPlacement' }, 'egypt');
    expect(s.phase).toBe('populationExpansion');
    expect(s.players['egypt']!.stock).toBe(3);
    expect(s.expansion!.remaining['egypt']).toBe(3);
    expect(s.expansion!.caps['egypt']).toEqual(capsBefore);
    expect(s.areas[first]!.tokens['egypt']).toBe(2);
    expect(s.areas[ids[1]!]!.tokens['egypt']).toBe(2);
    expect(adapter.legalActions(s, 'egypt').some((a) => a.type === 'pass')).toBe(false); // must place again
  });
});
