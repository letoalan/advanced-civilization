import { describe, expect, it } from 'vitest';
import { adapter, floodPlainOf } from './index.js';
import { areas } from '../data/index.js';
import { cityCount, populationCount } from './helpers.js';
import { coastal, land, scenario, resolve } from './calamity.testHelpers.js';
import type { GameState } from './types.js';

describe('Flood & Volcano geography (§30.51 / §30.21)', () => {
  const nile = ['alexandria', 'tanis', 'memphis', 'fayum', 'upper-egypt']; // one flood-plain region

  function floodPop(adv: string[]): number {
    const tokens: Record<string, number> = {};
    for (const aid of nile) tokens[aid] = 4; // 20 unit points on the Nile flood plain
    let s = scenario({ tokens: { egypt: tokens }, hands: { egypt: { 'calamity:flood': 1 } } });
    s.players['egypt']!.advances = adv;
    return populationCount(resolve(s), 'egypt');
  }
  it('Flood removes up to 17 unit points from the flood plain, 7 with Engineering (§30.511/.515)', () => {
    expect(floodPop([])).toBe(3); // 20 − 17
    expect(floodPop(['engineering'])).toBe(13); // 20 − 7
  });

  it('Flood: the primary directs 10 points of secondary loss on the same flood plain (§30.512)', () => {
    const tokens: Record<string, number> = {};
    for (const aid of nile.slice(0, 4)) tokens[aid] = 4; // egypt: 16 pts on the Nile
    let s = scenario({
      tokens: { egypt: tokens, babylon: { [nile[4]!]: 12 } }, // babylon: 12 pts on the same plain
      hands: { egypt: { 'calamity:flood': 1 } },
    });
    s = resolve(s); // egypt sheds 16; then directs the 10-point secondary loss onto babylon
    expect(populationCount(s, 'egypt')).toBe(0); // lost its 16 (capped at 17)
    expect(populationCount(s, 'babylon')).toBe(2); // directed to lose 10 of its 12 on the plain
  });

  it('Flood: a secondary victim with Engineering loses at most 7 on the flood plain (§30.515)', () => {
    const tokens: Record<string, number> = {};
    for (const aid of nile.slice(0, 4)) tokens[aid] = 4;
    let s = scenario({
      tokens: { egypt: tokens, babylon: { [nile[4]!]: 12 } },
      hands: { egypt: { 'calamity:flood': 1 } },
    });
    s.players['babylon']!.advances = ['engineering'];
    s = resolve(s);
    expect(populationCount(s, 'babylon')).toBe(5); // capped at 7 → 12 − 7
  });

  it('every flood-plain area belongs to exactly one listed flood plain (§4.42)', () => {
    const fp = areas.filter((a) => a.isFloodplain && !a.isWater).map((a) => a.id).sort();
    expect([...floodPlainOf.keys()].sort()).toEqual(fp);
  });

  it('Flood stays on its own plain: Etruria borders Gaul but they are separate plains (report 132ad04e)', () => {
    let s = scenario({
      tokens: { egypt: { 'etruria-2': 4 }, babylon: { rubicon: 3, gaul: 5 } },
      hands: { egypt: { 'calamity:flood': 1 } },
    });
    s = resolve(s);
    expect(s.areas['rubicon']?.tokens['babylon'] ?? 0).toBe(0); // same plain: hit
    expect(s.areas['gaul']?.tokens['babylon']).toBe(5);        // different plain: untouched
  });

  it('Flood with no flood-plain units eliminates a coastal city (§30.514)', () => {
    const dry = coastal.find((a) => !a.isFloodplain)!.id; // a coastal, non-flood-plain area
    let s = scenario({ tokens: { egypt: { [dry]: 6 } }, cities: { egypt: [dry] }, hands: { egypt: { 'calamity:flood': 1 } } });
    s = resolve(s);
    expect(s.areas[dry]?.city).toBeUndefined(); // the coastal city is gone
  });

  it('Volcanic Eruption destroys every unit in the volcano’s areas (§30.211)', () => {
    let s = scenario({ tokens: { egypt: { campania: 3, neapolis: 2 } }, cities: { egypt: ['campania'] }, hands: { egypt: { 'calamity:volcano': 1 } } });
    s = resolve(s);
    expect(s.areas['campania']?.city).toBeUndefined();
    expect(populationCount(s, 'egypt')).toBe(0); // Vesuvius wipes campania + neapolis
  });

  it('Volcano: an exact site-damage tie is broken by the primary victim (§30.211)', () => {
    const safe = land.find((a) => !['campania', 'neapolis', 'milazzo', 'syracus', 'thera'].includes(a.id))!.id;
    let s = scenario({
      tokens: { egypt: { [safe]: 4 } }, // support for the surviving city
      cities: { egypt: ['campania', 'milazzo'] }, // one city in each of two volcanoes ⇒ equal damage
      hands: { egypt: { 'calamity:volcano': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingPick?.stage).toBe('volcanoSite');
    expect(adapter.currentActor(s)).toBe('egypt'); // the primary chooses
    s = adapter.applyAction(s, { type: 'pickAreas', areas: ['campania'] }, 'egypt'); // erupt Vesuvius
    expect(s.areas['campania']?.city).toBeUndefined(); // erupted
    expect(s.areas['milazzo']?.city).toBe('egypt'); // the other volcano spared
  });

  it('volcano-site data matches the three §4.41 volcanoes (guards the engine grouping)', () => {
    const ids = areas.filter((a) => a.isVolcanoSite).map((a) => a.id).sort();
    expect(ids).toEqual(['campania', 'milazzo', 'neapolis', 'syracus', 'thera'].sort());
  });

  it('Earthquake (no volcano-area city) destroys a city; Engineering reduces it instead (§30.212/.213)', () => {
    function quakePop(eng: boolean): number {
      let s = scenario({
        tokens: { egypt: { [land[0]!.id]: 6 } }, // enough to support the surviving city
        cities: { egypt: [land[1]!.id, land[2]!.id] },
        hands: { egypt: { 'calamity:volcano': 1 } },
      });
      s.players['egypt']!.advances = eng ? ['engineering'] : [];
      s = resolve(s);
      expect(cityCount(s, 'egypt')).toBe(1); // exactly one city lost either way
      return populationCount(s, 'egypt');
    }
    expect(quakePop(true)).toBeGreaterThan(quakePop(false)); // Engineering substitutes tokens
  });
});

describe('§29.3 upcoming calamities are public while resolving (report dcd11871)', () => {
  it('shows what is still to come, to every player, and clears when done', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 30 }, babylon: { [land[1]!.id]: 30 } },
      hands: { egypt: { 'calamity:famine': 1 }, babylon: { 'calamity:epidemic': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    // Famine (level 3) resolves first and pauses for a choice; Epidemic (6) waits.
    expect(s.phase).toBe('calamity');
    expect(adapter.currentActor(s)).not.toBeNull();
    expect(s.calamityQueue).toEqual([{ calamity: 'epidemic', holder: 'babylon' }]);
    // Public: egypt's view carries it even though babylon's hand is hidden from egypt.
    const egyptView = adapter.viewFor(s, 'egypt');
    expect(egyptView.calamityQueue).toEqual([{ calamity: 'epidemic', holder: 'babylon' }]);
    expect(egyptView.players['babylon']!.hand).toEqual({});
    s = resolve(s);
    expect(s.calamityQueue).toBeUndefined();
  });
});

describe('§29.5 at most two calamities per primary victim', () => {
  it('a player holding three has one drawn out at random and returned to its stack (report 78ce4aab)', () => {
    const cards = ['calamity:famine', 'calamity:epidemic', 'calamity:civildisorder'];
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 30 }, babylon: { [land[1]!.id]: 30 } },
      hands: { egypt: Object.fromEntries(cards.map((c) => [c, 1])) },
    });
    const inStacks = (st: GameState, c: string) => Object.values(st.trade.stacks).flat().filter((x) => x === c).length;
    const before = cards.map((c) => inStacks(s, c));
    s = resolve(s);
    const struck = new Set((s.lastCalamities ?? []).filter((e) => e.holder === 'egypt').map((e) => e.calamityId));
    expect(struck.size).toBe(2);
    const dropped = s.log.filter((e) => e.kind === 'calamity.disregarded');
    expect(dropped).toHaveLength(1);
    const droppedIds = (dropped[0]!.payload as { calamities: string[] }).calamities;
    expect(droppedIds).toHaveLength(1);
    expect(struck.has(droppedIds[0]!)).toBe(false);
    // All three leave the hand and go back to their stacks (§29.5 / §29.7).
    expect(Object.keys(s.players['egypt']!.hand).filter((c) => c.startsWith('calamity:'))).toEqual([]);
    expect(cards.map((c) => inStacks(s, c))).toEqual(before.map((n) => n + 1));
  });

  it('two calamities both strike — the cap only bites above two', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 30 }, babylon: { [land[1]!.id]: 30 } },
      hands: { egypt: { 'calamity:famine': 1, 'calamity:epidemic': 1 } },
    });
    s = resolve(s);
    expect((s.lastCalamities ?? []).filter((e) => e.holder === 'egypt')).toHaveLength(2);
    expect(s.log.some((e) => e.kind === 'calamity.disregarded')).toBe(false);
  });
});
