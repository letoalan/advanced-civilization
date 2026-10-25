import { describe, expect, it } from 'vitest';
import { adapter } from './index.js';
import { pieceCounts } from '../data/index.js';
import { cityCount, pieceConservationProblems, populationCount } from './helpers.js';
import { coastal, land, scenario, resolve } from './calamity.testHelpers.js';
import type { Action } from './types.js';

describe('interactive secondary-victim allocation (§29.64)', () => {
  it('pauses for the primary victim to direct the losses, who may choose the split', () => {
    let s = scenario({
      players: ['egypt', 'babylon', 'crete'],
      tokens: { egypt: { [land[0]!.id]: 20 }, babylon: { [land[1]!.id]: 30 }, crete: { [land[2]!.id]: 30 } },
      hands: { egypt: { 'calamity:epidemic': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    // Epidemic's primary loss is itself an interactive unit choice — resolve it first.
    while (s.pendingUnitLoss) s = adapter.applyAction(s, adapter.legalActions(s, 'egypt').find((a) => a.type === 'chooseUnits')!, 'egypt');
    expect(s.pendingAllocation?.calamityId).toBe('epidemic');
    expect(adapter.currentActor(s)).toBe('egypt'); // the primary victim directs
    // Caps are 10 each (§30.611); pool 25 > total capacity 20, so egypt must order 20.
    expect(() => adapter.applyAction(s, { type: 'allocateLoss', allocation: { babylon: 20 } }, 'egypt')).toThrow(); // over cap
    expect(() => adapter.applyAction(s, { type: 'allocateLoss', allocation: { babylon: 10 } }, 'egypt')).toThrow(); // must direct the full 20
    s = adapter.applyAction(s, { type: 'allocateLoss', allocation: { babylon: 10, crete: 10 } }, 'egypt'); // egypt's chosen split
    expect(s.pendingAllocation).toBeUndefined();
    // §30.611: each secondary victim now chooses which of their own units to lose.
    expect(adapter.currentActor(s)).toBe('babylon');
    while (s.pendingUnitLoss) {
      const v = adapter.currentActor(s)!;
      s = adapter.applyAction(s, adapter.legalActions(s, v).find((a) => a.type === 'chooseUnits')!, v);
    }
    expect(populationCount(s, 'babylon')).toBe(20);
    expect(populationCount(s, 'crete')).toBe(20);
  });

  it('a secondary victim chooses which of their OWN units to lose (§30.311)', () => {
    let s = scenario({
      players: ['egypt', 'babylon'],
      tokens: { egypt: { [land[0]!.id]: 20 }, babylon: { [land[1]!.id]: 5, [land[2]!.id]: 5 } },
      hands: { egypt: { 'calamity:famine': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    while (s.pendingUnitLoss) s = adapter.applyAction(s, adapter.legalActions(s, 'egypt').find((a) => a.type === 'chooseUnits')!, 'egypt'); // egypt's own loss
    s = adapter.applyAction(s, { type: 'allocateLoss', allocation: { babylon: 8 } }, 'egypt'); // egypt directs 8 (the §30.311 cap)
    // §30.311: babylon — not egypt — decides which of its units go.
    expect(adapter.currentActor(s)).toBe('babylon');
    expect(s.pendingUnitLoss?.points).toBe(8);
    s = adapter.applyAction(s, { type: 'chooseUnits', tokens: { [land[1]!.id]: 5, [land[2]!.id]: 3 }, cities: [] }, 'babylon');
    expect(s.areas[land[1]!.id]?.tokens['babylon'] ?? 0).toBe(0); // babylon's chosen split is honoured
    expect(s.areas[land[2]!.id]?.tokens['babylon']).toBe(2);
    expect(s.pendingSecondary).toBeUndefined(); // queue drained; calamity finalized
  });

  it('the engine suggests directing losses at the leader first (§29.64)', () => {
    let s = scenario({
      players: ['egypt', 'babylon', 'crete', 'asia'],
      tokens: { egypt: { [land[0]!.id]: 30 }, babylon: { [land[1]!.id]: 12 }, crete: { [land[2]!.id]: 12 }, asia: { [land[3]!.id]: 12 } },
      hands: { egypt: { 'calamity:epidemic': 1 } },
    });
    s.players['crete']!.advances = ['pottery', 'clothmaking', 'metalworking']; // crete leads, asia trails
    s.players['babylon']!.advances = ['pottery'];
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    while (s.pendingUnitLoss) s = adapter.applyAction(s, adapter.legalActions(s, 'egypt').find((a) => a.type === 'chooseUnits')!, 'egypt'); // resolve egypt's own loss first
    const suggested = (adapter.legalActions(s, 'egypt')[0] as Extract<Action, { type: 'allocateLoss' }>).allocation;
    // Pool 25, caps 10 each: leader and runner-up maxed at 10, the laggard takes the rest.
    expect(suggested['crete']).toBe(10); // leader hit first, to its cap
    expect(suggested['asia']).toBeLessThan(10); // the trailing nation absorbs the remainder
  });
});

describe('§30.61 Epidemic secondary victims', () => {
  it('orders 25 unit points of loss onto the strongest rival, sparing the trader', () => {
    let s = scenario({
      players: ['egypt', 'babylon', 'crete'],
      tokens: { egypt: { [land[0]!.id]: 20 }, babylon: { [land[1]!.id]: 30 }, crete: { [land[2]!.id]: 30 } },
      hands: { egypt: { 'calamity:epidemic': 1 } },
      tradedFrom: { epidemic: 'crete' }, // crete is exempt from secondary effects
    });
    s = resolve(s);
    expect(populationCount(s, 'egypt')).toBe(20 - 16); // primary -16
    // §30.611: no more than 10 may be ordered from any one player. crete (the
    // trader) is exempt, so babylon — the only eligible rival — absorbs just 10.
    expect(populationCount(s, 'babylon')).toBe(30 - 10);
    expect(populationCount(s, 'crete')).toBe(30); // the trader is untouched
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });
});

describe('§30.81 Iconoclasm secondary victims', () => {
  it('reduces 2 rival cities, sparing the trader and any Theology holder', () => {
    const cityAreas = land.filter((a) => a.isCitySite).slice(0, 8).map((a) => a.id);
    const supp = land.filter((a) => !cityAreas.includes(a.id));
    let s = scenario({
      players: ['egypt', 'babylon', 'crete', 'assyria'],
      cities: { egypt: [cityAreas[0]!, cityAreas[1]!], babylon: [cityAreas[2]!, cityAreas[3]!], assyria: [cityAreas[4]!] },
      // support tokens spread one-per-area so they survive (2 per city).
      tokens: {
        egypt: { [supp[0]!.id]: 1, [supp[1]!.id]: 1, [supp[2]!.id]: 1, [supp[3]!.id]: 1 },
        babylon: { [supp[4]!.id]: 1, [supp[5]!.id]: 1, [supp[6]!.id]: 1, [supp[7]!.id]: 1 },
        assyria: { [supp[8]!.id]: 1, [supp[9]!.id]: 1 },
      },
      hands: { egypt: { 'calamity:iconoclasm': 1 } },
      tradedFrom: { iconoclasm: 'crete' },
    });
    s.players['assyria']!.advances = ['enlightenment', 'theology']; // Theology -> immune as secondary
    expect(cityCount(s, 'egypt')).toBe(2);
    s = resolve(s);
    expect(cityCount(s, 'egypt')).toBe(0); // primary loses up to 4 -> both its cities
    expect(cityCount(s, 'babylon')).toBe(0); // 2 secondary cities fall on the strongest rival
    expect(cityCount(s, 'assyria')).toBe(1); // Theology holder spared
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });
});

describe('§30.91 Piracy', () => {
  it('turns the victim\'s and secondary victims\' coastal cities into pirate cities', () => {
    let s = scenario({
      players: ['egypt', 'babylon', 'crete'],
      cities: { egypt: [coastal[0]!.id, coastal[1]!.id], babylon: [coastal[2]!.id] },
      tokens: { egypt: { [land[5]!.id]: 4 }, babylon: { [land[6]!.id]: 4 } }, // support
      hands: { egypt: { 'calamity:piracy': 1 } },
      tradedFrom: { piracy: 'crete' }, // crete (the trader) cannot be a secondary victim
    });
    expect(cityCount(s, 'egypt')).toBe(2);
    expect(cityCount(s, 'babylon')).toBe(1);
    s = resolve(s);
    expect(cityCount(s, 'egypt')).toBe(0); // both coastal cities lost
    expect(cityCount(s, 'babylon')).toBe(0); // secondary victim lost its coastal city
    // Pirate cities now stand on those coasts.
    expect(s.areas[coastal[0]!.id]!.city).toBe('__pirate__');
    expect(s.areas[coastal[0]!.id]!.pirateCity).toBe(true);
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });

  it('the trader picks the victim’s cities, then the primary picks the secondaries’ (§30.911-912)', () => {
    const c0 = coastal[0]!.id, c1 = coastal[1]!.id, c2 = coastal[2]!.id, c3 = coastal[3]!.id;
    let s = scenario({
      players: ['egypt', 'babylon', 'crete'],
      cities: { egypt: [c0, c1], babylon: [c2], crete: [c3] },
      tokens: { crete: { [land[7]!.id]: 2 } }, // crete keeps its (un-pirated) city supported
      hands: { egypt: { 'calamity:piracy': 1 } },
      tradedFrom: { piracy: 'crete' }, // crete traded it ⇒ exempt as a secondary (§30.912)
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    // §30.911: the trader (crete) selects the victim's two coastal cities.
    expect(s.pendingPick?.stage).toBe('piracyPrimary');
    expect(adapter.currentActor(s)).toBe('crete');
    s = adapter.applyAction(s, { type: 'pickAreas', areas: [c0, c1] }, 'crete');
    expect(s.areas[c0]?.pirateCity).toBe(true);
    expect(s.areas[c1]?.pirateCity).toBe(true);
    // §30.912: the primary (egypt) selects the secondary victims' cities — crete is
    // exempt as the trader, so only babylon's coast is a candidate.
    expect(s.pendingPick?.stage).toBe('piracySecondary');
    expect(adapter.currentActor(s)).toBe('egypt');
    expect(s.pendingPick?.candidates).toEqual([c2]);
    s = adapter.applyAction(s, { type: 'pickAreas', areas: [c2] }, 'egypt');
    expect(s.areas[c2]?.pirateCity).toBe(true);
    expect(s.areas[c3]?.city).toBe('crete'); // the trader's coast is untouched
    expect(pieceConservationProblems(s, pieceCounts)).toEqual([]);
  });
});
