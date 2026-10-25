import { describe, expect, it } from 'vitest';
import { adapter } from './index.js';
import { pieceCounts } from '../data/index.js';
import { pieceConservationProblems, populationCount } from './helpers.js';
import { land, scenario, resolve } from './calamity.testHelpers.js';

describe('§30.22 Treachery', () => {
  it('a traded card hands one of the victim’s cities to the trader (§30.221)', () => {
    let s = scenario({
      tokens: { babylon: { [land[2]!.id]: 2 } }, // babylon can support the annexed city (§26.3)
      cities: { egypt: [land[1]!.id] },
      hands: { egypt: { 'calamity:treachery': 1 } },
      tradedFrom: { treachery: 'babylon' },
    });
    s = resolve(s);
    expect(s.areas[land[1]!.id]?.city).toBe('babylon'); // the city defected to the trader
  });

  it('the trader chooses WHICH of the victim’s cities defects (§30.221)', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 2 }, babylon: { [land[3]!.id]: 2 } }, // support for each kept city
      cities: { egypt: [land[1]!.id, land[2]!.id] },
      hands: { egypt: { 'calamity:treachery': 1 } },
      tradedFrom: { treachery: 'babylon' },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingPick?.stage).toBe('treachery');
    expect(adapter.currentActor(s)).toBe('babylon'); // the trader selects
    s = adapter.applyAction(s, { type: 'pickAreas', areas: [land[2]!.id] }, 'babylon'); // picks the second city
    expect(s.areas[land[2]!.id]?.city).toBe('babylon'); // the chosen city defected
    expect(s.areas[land[1]!.id]?.city).toBe('egypt'); // the other stayed with egypt
  });

  it('a traded card whose trader has no spare city ELIMINATES the city, not reduces it (§30.221)', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 2 } },
      cities: { egypt: [land[1]!.id] },
      hands: { egypt: { 'calamity:treachery': 1 } },
      tradedFrom: { treachery: 'babylon' },
    });
    s.players['babylon']!.citiesAvailable = 0; // babylon cannot install a city
    s = resolve(s);
    expect(s.areas[land[1]!.id]?.city).toBeUndefined(); // city destroyed
    expect(s.areas[land[1]!.id]?.tokens['egypt'] ?? 0).toBe(0); // NOT reduced to tokens
    expect(s.areas[land[1]!.id]?.tokens['babylon'] ?? 0).toBe(0); // babylon gained nothing
  });

  it('a drawn (untraded) card merely reduces the city to tokens (§30.222)', () => {
    let s = scenario({
      cities: { egypt: [land[1]!.id] },
      hands: { egypt: { 'calamity:treachery': 1 } },
    });
    s = resolve(s);
    expect(s.areas[land[1]!.id]?.city).toBeUndefined();
    expect(s.areas[land[1]!.id]?.tokens['egypt'] ?? 0).toBeGreaterThan(0); // reduced, not eliminated
  });
});

describe('§30.312 Pottery grain-card lock & §30.612 Epidemic minimums', () => {
  it('Pottery: the player CHOOSES how much Grain to commit, which locks it (§30.312)', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 20 } },
      hands: { egypt: { 'calamity:famine': 1, grain: 4 } },
    });
    s.players['egypt']!.advances = ['pottery'];
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    // Famine now pauses for the victim's choice (grain is NOT auto-committed).
    expect(s.pendingUnitLoss?.calamityId).toBe('famine');
    expect(s.pendingUnitLoss?.points).toBe(10);
    // Commit 3 Grain (12 pts) to fully negate the loss — choose no units.
    s = adapter.applyAction(s, { type: 'chooseUnits', tokens: {}, cities: [], grainCommit: 3 }, 'egypt');
    expect(s.players['egypt']!.grainLockedThisTurn).toBe(3);
    expect(populationCount(s, 'egypt')).toBe(20); // negated — no tokens lost
  });

  it('Pottery: committing no Grain takes the full Famine loss (player declines)', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 20 } },
      hands: { egypt: { 'calamity:famine': 1, grain: 4 } },
    });
    s.players['egypt']!.advances = ['pottery'];
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    s = adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[0]!.id]: 10 }, cities: [], grainCommit: 0 }, 'egypt');
    expect(s.players['egypt']!.grainLockedThisTurn ?? 0).toBe(0); // no Grain locked
    expect(populationCount(s, 'egypt')).toBe(10); // took the full 10-point loss
  });

  it('Epidemic leaves ≥1 token per area and turns an eliminated city into one token (§30.612)', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 10 } },
      cities: { egypt: [land[1]!.id] },
      hands: { egypt: { 'calamity:epidemic': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingUnitLoss?.calamityId).toBe('epidemic');
    // Cannot empty an area — must leave one token (§30.612).
    expect(() => adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[0]!.id]: 10 }, cities: [] }, 'egypt')).toThrow(/at least one/);
    s = adapter.applyAction(s, adapter.legalActions(s, 'egypt').find((a) => a.type === 'chooseUnits')!, 'egypt');
    expect(s.areas[land[0]!.id]?.tokens['egypt']).toBe(1); // one token left behind
    expect(s.areas[land[1]!.id]?.city).toBeUndefined(); // city eliminated
    expect(s.areas[land[1]!.id]?.tokens['egypt']).toBe(1); // replaced by exactly one token (city = 4 pts)
  });
});

describe('§29.62 cities given up to a calamity', () => {
  const sus2 = land.find((a) => a.sustains === 2 && a.id !== land[0]!.id)!.id;

  it('a Famine city counted as 5 points is eliminated outright — no tokens left', () => {
    let s = scenario({ tokens: { egypt: { [land[0]!.id]: 5 } }, cities: { egypt: [sus2] }, hands: { egypt: { 'calamity:famine': 1 } } });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingUnitLoss?.calamityId).toBe('famine');
    s = adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[0]!.id]: 5 }, cities: [sus2] }, 'egypt');
    expect(s.areas[sus2]?.city).toBeUndefined();
    expect(s.areas[sus2]?.tokens['egypt'] ?? 0).toBe(0);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('the owner may leave tokens where the city stood; each one makes it count a point less', () => {
    let s = scenario({ tokens: { egypt: { [land[0]!.id]: 8 } }, cities: { egypt: [sus2] }, hands: { egypt: { 'calamity:famine': 1 } } });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    // city leaving 2 = 3 points; 3 + 5 tokens falls short of 10.
    expect(() => adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[0]!.id]: 5 }, cities: [sus2], cityKeep: { [sus2]: 2 } }, 'egypt')).toThrow(/give up/);
    expect(() => adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[0]!.id]: 7 }, cities: [sus2], cityKeep: { [sus2]: 3 } }, 'egypt')).toThrow(/tokens behind/);
    s = adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[0]!.id]: 7 }, cities: [sus2], cityKeep: { [sus2]: 2 } }, 'egypt');
    expect(s.areas[sus2]?.city).toBeUndefined();
    expect(s.areas[sus2]?.tokens['egypt']).toBe(2);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('Epidemic: a city may leave more than its one mandatory token (§30.612)', () => {
    let s = scenario({ tokens: { egypt: { [land[0]!.id]: 16 } }, cities: { egypt: [sus2] }, hands: { egypt: { 'calamity:epidemic': 1 } } });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingUnitLoss?.calamityId).toBe('epidemic');
    expect(() => adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[0]!.id]: 12 }, cities: [sus2], cityKeep: { [sus2]: 0 } }, 'egypt')).toThrow(/tokens behind/);
    s = adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[0]!.id]: 13 }, cities: [sus2], cityKeep: { [sus2]: 2 } }, 'egypt');
    expect(s.areas[sus2]?.tokens['egypt']).toBe(2); // 13 + (4 − 1) = 16
    expect(s.areas[land[0]!.id]?.tokens['egypt']).toBe(3);
  });
});
