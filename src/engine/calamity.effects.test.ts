import { describe, expect, it } from 'vitest';
import { adapter } from './index.js';
import { adjacency, areaById } from '../data/index.js';
import { cityCount, populationCount } from './helpers.js';
import { land, scenario, resolve } from './calamity.testHelpers.js';

describe('advance modifiers on calamities (§30/§32)', () => {
  const cityAreas = [land[1]!.id, land[2]!.id, land[3]!.id, land[4]!.id, land[5]!.id, land[6]!.id];

  function superstitionCitiesLeft(adv: string[]): number {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 20 } },
      cities: { egypt: cityAreas.slice(0, 4) },
      hands: { egypt: { 'calamity:superstition': 1 } },
    });
    s.players['egypt']!.advances = adv;
    return cityCount(resolve(s), 'egypt');
  }
  it('Superstition reduces 3 cities, softened by the highest Religion card (§30.322)', () => {
    expect(superstitionCitiesLeft([])).toBe(1); // 4 - 3
    expect(superstitionCitiesLeft(['mysticism'])).toBe(2); // 4 - 2
    expect(superstitionCitiesLeft(['deism'])).toBe(3); // 4 - 1
    expect(superstitionCitiesLeft(['enlightenment'])).toBe(4); // nullified
    expect(superstitionCitiesLeft(['mysticism', 'deism', 'enlightenment'])).toBe(4); // highest governs
  });

  function faminePopLeft(adv: string[], grain: number): number {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 10 }, babylon: { [land[7]!.id]: 30 } },
      hands: { egypt: { 'calamity:famine': 1, grain } },
    });
    s.players['egypt']!.advances = adv;
    return populationCount(resolve(s), 'egypt');
  }
  it('Famine costs 10 unit points; Pottery softens 4 per Grain card held (§30.312)', () => {
    expect(faminePopLeft([], 0)).toBe(0); // lost all 10
    expect(faminePopLeft(['pottery'], 2)).toBe(8); // 10 - 8 = 2 lost
    expect(faminePopLeft(['pottery'], 0)).toBe(0); // Pottery without Grain does nothing
  });

  function disorderCitiesLeft(adv: string[]): number {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 20 } },
      cities: { egypt: cityAreas.slice(0, 6) },
      hands: { egypt: { 'calamity:civildisorder': 1 } },
    });
    s.players['egypt']!.advances = adv;
    return cityCount(resolve(s), 'egypt');
  }
  it('Civil Disorder reduces all but 3 cities, ±1 per advance (§30.712-.714)', () => {
    expect(disorderCitiesLeft([])).toBe(3); // 6 → keep 3
    expect(disorderCitiesLeft(['music', 'drama'])).toBe(5); // 3 reduced − 2 = 1 reduced
    expect(disorderCitiesLeft(['music', 'drama', 'law', 'democracy'])).toBe(6); // none reduced
    expect(disorderCitiesLeft(['military'])).toBe(2); // 3 + 1 = 4 reduced
  });

  function slaveRevoltCitiesLeft(adv: string[]): number {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 20 } },
      cities: { egypt: cityAreas.slice(0, 5) },
      hands: { egypt: { 'calamity:slaverevolt': 1 } },
    });
    s.players['egypt']!.advances = adv;
    return cityCount(resolve(s), 'egypt');
  }
  it('Slave Revolt: Enlightenment eases it, Mining worsens it (§30.423)', () => {
    const none = slaveRevoltCitiesLeft([]);
    expect(slaveRevoltCitiesLeft(['enlightenment'])).toBeGreaterThanOrEqual(none);
    expect(slaveRevoltCitiesLeft(['mining'])).toBeLessThanOrEqual(none);
    expect(slaveRevoltCitiesLeft(['mining'])).toBeLessThan(5); // it does bite
  });

  it('Slave Revolt reduces newly-built cities first, then the victim chooses (§30.42/§26.32)', () => {
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 17 } }, // 17 on board; lock 15 ⇒ 2 support tokens (supports 1 city)
      cities: { egypt: [land[1]!.id, land[2]!.id, land[3]!.id] },
      hands: { egypt: { 'calamity:slaverevolt': 1 } },
    });
    s.players['egypt']!.stock = 0; // reductions place no tokens ⇒ clean support arithmetic
    s.players['egypt']!.citiesBuiltThisTurn = [land[3]!.id]; // land[3] was built this turn
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    // §26.32: the newly-built city is reduced first (forced), then a genuine choice
    // remains between the two older cities.
    expect(s.areas[land[3]!.id]?.city).toBeUndefined();
    expect(s.pendingSupport?.mode).toBe('slaverevolt');
    expect(new Set(s.pendingSupport?.candidates)).toEqual(new Set([land[1]!.id, land[2]!.id]));
    // egypt keeps land[1], reduces land[2].
    s = adapter.applyAction(s, { type: 'chooseCities', areas: [land[2]!.id] }, 'egypt');
    expect(s.areas[land[2]!.id]?.city).toBeUndefined(); // the chosen city went
    expect(s.areas[land[1]!.id]?.city).toBe('egypt'); // the other was kept
    expect(s.pendingSupport).toBeUndefined(); // fully resolved
  });

  it('Slave Revolt withholds only the tokens on the board; reduced cities\' tokens support (§30.422)', () => {
    // 9 tokens on board, 3 cities: all 9 are withheld (not a flat 15), so the
    // 4+ tokens a reduced city leaves behind support the other two cities.
    const big = land.slice(1).filter((a) => a.sustains >= 4).slice(0, 3).map((a) => a.id);
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 9 } },
      cities: { egypt: big },
      hands: { egypt: { 'calamity:slaverevolt': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingSupport?.mode).toBe('slaverevolt');
    expect(s.pendingSupport?.lock).toBe(9);
    s = adapter.applyAction(s, { type: 'chooseCities', areas: [s.pendingSupport!.candidates[0]!] }, 'egypt');
    expect(s.pendingSupport).toBeUndefined(); // one reduction was enough
    expect(cityCount(s, 'egypt')).toBe(2); // a flat 15 would have reduced all three
  });

  it('Earthquake: Engineering reduces a city instead of destroying an area (§30.213)', () => {
    function quakePop(eng: boolean): number {
      let s = scenario({
        tokens: { egypt: { [land[0]!.id]: 8 } },
        cities: { egypt: [land[1]!.id] },
        hands: { egypt: { 'calamity:volcano': 1 } },
      });
      s.players['egypt']!.advances = eng ? ['engineering'] : [];
      return populationCount(resolve(s), 'egypt');
    }
    expect(quakePop(true)).toBeGreaterThan(quakePop(false)); // keeps the 8-token area
  });

  it('reduced cities are replaced by tokens, +1 with Agriculture (§26.41/§32.241)', () => {
    function sub(adv: string[]): number {
      let s = scenario({
        tokens: { egypt: { [land[0]!.id]: 20 } },
        cities: { egypt: [land[1]!.id] },
        hands: { egypt: { 'calamity:superstition': 1 } },
      });
      s.players['egypt']!.advances = adv;
      s = resolve(s);
      return s.areas[land[1]!.id]?.tokens['egypt'] ?? 0;
    }
    const limit = areaById.get(land[1]!.id)!.sustains;
    expect(sub([])).toBe(limit); // city → max tokens the area allows
    expect(sub(['agriculture'])).toBe(limit + 1); // Agriculture clause 2
  });
});

describe('interactive city-reduction choice (§30.321/.711/.811)', () => {
  it('lets the primary victim choose which cities to reduce', () => {
    const cityAreas = [land[1]!.id, land[2]!.id, land[3]!.id, land[4]!.id, land[5]!.id];
    let s = scenario({
      tokens: { egypt: { [land[0]!.id]: 20 } }, // ample support so nothing extra is reduced
      cities: { egypt: cityAreas },
      hands: { egypt: { 'calamity:superstition': 1 } },
    });
    while (s.phase === 'trade') s = adapter.applyAction(s, { type: 'pass' }, adapter.currentActor(s)!);
    expect(s.pendingCityChoice?.count).toBe(3); // Superstition reduces 3
    expect(adapter.currentActor(s)).toBe('egypt');
    expect(() => adapter.applyAction(s, { type: 'chooseCities', areas: [cityAreas[0]!] }, 'egypt')).toThrow(); // wrong count
    expect(() => adapter.applyAction(s, { type: 'chooseCities', areas: [land[0]!.id, cityAreas[0]!, cityAreas[1]!] }, 'egypt')).toThrow(); // not a city of egypt
    const chosen = [cityAreas[0]!, cityAreas[2]!, cityAreas[4]!];
    s = adapter.applyAction(s, { type: 'chooseCities', areas: chosen }, 'egypt');
    expect(s.pendingCityChoice).toBeUndefined();
    for (const a of chosen) expect(s.areas[a]?.city).toBeUndefined(); // the chosen three fell
    expect(s.areas[cityAreas[1]!]?.city).toBe('egypt'); // the unchosen survived
    expect(s.areas[cityAreas[3]!]?.city).toBe('egypt');
  });
});

describe('Monotheism conversion timing (§29/§32.941)', () => {
  it('is offered during the calamity phase, before advance acquisition', () => {
    const a0 = land[0]!.id;
    const a1 = (adjacency[a0] ?? []).find((n) => !areaById.get(n)?.isWater)!;
    let s = scenario({ tokens: { egypt: { [a0]: 1 }, babylon: { [a1]: 2 } } });
    s.players['egypt']!.advances = ['monotheism'];
    s.players['egypt']!.stock = 10;
    s = resolve(s); // pass through trade
    expect(s.phase).toBe('calamity'); // paused here, not acquireAdvances
    expect(adapter.currentActor(s)).toBe('egypt');
    const conv = adapter.legalActions(s, 'egypt').filter((a) => a.type === 'convertArea');
    expect(conv.length).toBeGreaterThan(0);
    s = adapter.applyAction(s, conv[0]!, 'egypt');
    expect(s.areas[a1]!.tokens['egypt']).toBe(2); // took over babylon's tokens
    expect(s.phase).not.toBe('calamity'); // conversion done → phase advances
  });
});
