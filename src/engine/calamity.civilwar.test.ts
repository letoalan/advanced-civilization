import { describe, expect, it } from 'vitest';
import { adapter } from './index.js';
import { pieceCounts } from '../data/index.js';
import { pieceConservationProblems, populationCount } from './helpers.js';
import { land, scenario, resolve } from './calamity.testHelpers.js';
import type { Action } from './types.js';

describe('§30.41 Civil War', () => {
  it('splits into a 35-point first faction; the victim keeps the larger half', () => {
    // egypt (victim) has a big board army; babylon sits in reserve (most stock).
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 40 } },
      hands: { egypt: { 'calamity:civilwar': 1 } },
    });
    expect(populationCount(s, 'babylon')).toBe(0);
    s = resolve(s);
    // §30.412: the first faction is 35 (15 picked by egypt + 20 by babylon); the
    // second is the remaining 5. §30.415: egypt keeps the larger (35); the 5-point
    // faction is annexed by babylon (the player with the most reserves §30.411).
    expect(populationCount(s, 'egypt')).toBe(35);
    expect(populationCount(s, 'babylon')).toBe(5);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('fizzles when the victim holds the most reserves', () => {
    // egypt has almost nothing on board (huge reserve); babylon also reserve.
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 40 }, babylon: { [land[1]!.id]: 40 } },
      hands: { egypt: { 'calamity:civilwar': 1 } },
    });
    // Make egypt the reserve leader by emptying its board after stock is set.
    s.players['egypt']!.stock += 40; s.areas[land[0]!.id]!.tokens['egypt'] = 0;
    s = resolve(s);
    expect(populationCount(s, 'babylon')).toBe(40); // unchanged: no defection
  });

  it('fizzles when the nation is too small to leave a second faction (§30.413)', () => {
    // board = 35 = first-faction size (15 + 20); nothing left over → no Civil War.
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 35 } },
      hands: { egypt: { 'calamity:civilwar': 1 } },
    });
    s = resolve(s);
    expect(populationCount(s, 'egypt')).toBe(35); // intact
    expect(populationCount(s, 'babylon')).toBe(0);
  });

  it('Philosophy: the beneficiary alone picks the 15-point first faction (§30.4124)', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 30 } },
      hands: { egypt: { 'calamity:civilwar': 1 } },
    });
    s.players['egypt']!.advances = ['philosophy'];
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    // No victim selection step — it begins with the beneficiary choosing.
    expect(s.pendingCivilWar?.stage).toBe('beneficiarySelect');
    expect(s.pendingCivilWar?.victimPoints).toBe(0);
    expect(s.pendingCivilWar?.beneficiaryPoints).toBe(15);
    s = resolve(s);
    // First faction 15, second 15; egypt keeps the larger (tie → first), babylon annexes 15.
    expect(populationCount(s, 'egypt')).toBe(15);
    expect(populationCount(s, 'babylon')).toBe(15);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('Military removes 5 unit points from each faction (§30.414)', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 40 } },
      hands: { egypt: { 'calamity:civilwar': 1 } },
    });
    s.players['egypt']!.advances = ['military'];
    s = resolve(s);
    // Factions 35 / 5; Military strips 5 from each → 30 / 0. egypt keeps 30; babylon
    // annexes the now-empty second faction, so its population is unchanged.
    expect(populationCount(s, 'egypt')).toBe(30);
    expect(populationCount(s, 'babylon')).toBe(0);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });
});

describe('interactive unit loss & Civil War cede (§29.63 / §30.41)', () => {
  it('lets the Famine victim choose which tokens to lose', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 8, [land[1]!.id]: 8 } },
      hands: { egypt: { 'calamity:famine': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingUnitLoss?.calamityId).toBe('famine');
    expect(s.pendingUnitLoss?.points).toBe(10);
    expect(() => adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[0]!.id]: 8 }, cities: [] }, 'egypt')).toThrow(); // only 8 < required 10
    // Egypt concentrates the loss: abandon area 0 entirely (8), shed 2 from area 1.
    s = adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[0]!.id]: 8, [land[1]!.id]: 2 }, cities: [] }, 'egypt');
    expect(s.pendingUnitLoss).toBeUndefined();
    expect(s.areas[land[0]!.id]?.tokens['egypt'] ?? 0).toBe(0);
    expect(s.areas[land[1]!.id]?.tokens['egypt']).toBe(6);
  });

  it('Civil War: keeping the larger faction by default retains the city (§30.415)', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 40 } },
      cities: { egypt: [land[1]!.id] }, // board = 45 (> 35), so a war occurs
      hands: { egypt: { 'calamity:civilwar': 1 } },
    });
    s = resolve(s); // default keeps the larger faction (the first, which holds the city)
    expect(s.areas[land[1]!.id]?.city).toBe('egypt'); // city retained
    expect(populationCount(s, 'babylon')).toBeGreaterThan(0); // the smaller faction defected
  });

  it('lets the Civil War victim keep the second faction, ceding the city (§30.415)', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 40 } },
      cities: { egypt: [land[1]!.id] },
      hands: { egypt: { 'calamity:civilwar': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    // §30.4121: egypt selects 15 token points for the first faction.
    expect(s.pendingCivilWar?.stage).toBe('victimSelect');
    s = adapter.applyAction(s, { type: 'civilWarSelect', tokens: { [land[0]!.id]: 15 }, cities: [] }, 'egypt');
    // §30.4123: babylon (beneficiary) completes the first faction — grabbing the city.
    expect(s.pendingCivilWar?.stage).toBe('beneficiarySelect');
    const bene = adapter.currentActor(s)!;
    expect(bene).toBe('babylon');
    const sug = adapter.legalActions(s, bene).find((a) => a.type === 'civilWarSelect')!;
    s = adapter.applyAction(s, sug, bene);
    expect(s.pendingCivilWar?.stage).toBe('victimKeep');
    expect(s.pendingCivilWar?.faction1.cities).toContain(land[1]!.id); // the city is in the first faction
    // §30.415: egypt keeps the SECOND faction, so the city-bearing first faction defects.
    s = adapter.applyAction(s, { type: 'civilWarKeep', faction: 2 }, 'egypt');
    expect(s.areas[land[1]!.id]?.city).toBe('babylon');
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });
});

describe('§30.412 Civil War selections are exact (report acf32a84)', () => {
  it('rejects an 18-point pick for a 15-point step when 15 exactly is possible', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 40 } },
      cities: { egypt: [land[1]!.id] },
      hands: { egypt: { 'calamity:civilwar': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingCivilWar?.stage).toBe('victimSelect');
    expect(() => adapter.applyAction(s, { type: 'civilWarSelect', tokens: { [land[0]!.id]: 18 }, cities: [] }, 'egypt')).toThrow(/exactly 15/);
    expect(() => adapter.applyAction(s, { type: 'civilWarSelect', tokens: { [land[0]!.id]: 13 }, cities: [land[1]!.id] }, 'egypt')).toThrow(/exactly 15/);
    // the suggested pick lands exactly, for the victim and then the beneficiary
    const sug = adapter.legalActions(s, 'egypt').find((a) => a.type === 'civilWarSelect') as Extract<Action, { type: 'civilWarSelect' }>;
    expect(Object.values(sug.tokens).reduce((t, n) => t + n, 0) + sug.cities.length * 5).toBe(15);
    s = adapter.applyAction(s, { type: 'civilWarSelect', tokens: { [land[0]!.id]: 10 }, cities: [land[1]!.id] }, 'egypt');
    const bsug = adapter.legalActions(s, 'babylon').find((a) => a.type === 'civilWarSelect') as Extract<Action, { type: 'civilWarSelect' }>;
    expect(Object.values(bsug.tokens).reduce((t, n) => t + n, 0) + bsug.cities.length * 5).toBe(20);
  });
});
