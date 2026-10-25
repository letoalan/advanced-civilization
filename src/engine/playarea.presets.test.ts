// Rules §16 — THE NUMBER OF PLAYERS: board configurations and presets.
import { describe, expect, it } from 'vitest';
import { createGame } from './index.js';
import { adjacency, areaById } from '../data/index.js';
import { availableNations, boardPresets, outOfPlaySet } from './boards.js';

const sorted = (xs: string[]) => [...xs].sort();

describe('§16 board presets', () => {
  it('gives each player count its rules token count (§16.2-16.8)', () => {
    const expected: Record<number, number> = { 2: 55, 3: 47, 4: 55, 5: 47, 6: 55, 7: 55, 8: 47 };
    for (const [n, tokens] of Object.entries(expected)) {
      const presets = boardPresets(Number(n)).filter((b) => b.rule !== 'house');
      expect(presets.length).toBeGreaterThan(0);
      for (const b of presets) expect(b.tokensPerPlayer).toBe(tokens);
    }
  });

  it('reproduces the §16 nation lists', () => {
    const at = (n: number, id: string) => availableNations(boardPresets(n).find((b) => b.id === id)!.config);
    expect(sorted(at(2, 'raw-2p'))).toEqual(sorted(['italy', 'africa', 'illyria', 'thrace']));
    expect(sorted(at(3, 'raw-3p'))).toEqual(sorted(['italy', 'africa', 'illyria', 'thrace', 'crete']));
    expect(sorted(at(4, 'raw-4p-east'))).toEqual(sorted(['egypt', 'babylon', 'assyria', 'asia']));
    expect(sorted(at(4, 'raw-4p-west'))).toEqual(sorted(['iberia', 'africa', 'illyria', 'thrace', 'crete']));
  });

  it('fields Iberia in place of Italy whenever the Western Extension is in play', () => {
    for (let n = 2; n <= 8; n++) {
      for (const preset of boardPresets(n)) {
        const nations = availableNations(preset.config);
        expect(nations.includes('italy') && nations.includes('iberia'), `${preset.id} (${n}p) fields both`).toBe(false);
        if (preset.config.west) expect(nations, `${preset.id} (${n}p)`).not.toContain('italy');
      }
    }
    const withExt = availableNations({ west: true, east: false, crops: [] });
    const withoutExt = availableNations({ west: false, east: false, crops: [] });
    expect(withExt).toContain('iberia');
    expect(withExt).not.toContain('italy');
    expect(withoutExt).toContain('italy');
    expect(withoutExt).not.toContain('iberia');
    expect(() => createGame({ players: ['italy', 'iberia', 'africa'], board: { west: true, east: false, crops: [] }, seed: 1 })).toThrow(/not available/);
  });

  it('keeps every preset board one connected component', () => {
    for (let n = 2; n <= 8; n++) {
      for (const preset of boardPresets(n)) {
        const out = outOfPlaySet(preset.config);
        const all = [...areaById.keys()].filter((id) => !out.has(id));
        const seen = new Set<string>([all[0]!]);
        const stack = [all[0]!];
        while (stack.length) {
          const x = stack.pop()!;
          for (const nb of adjacency[x] ?? []) if (!out.has(nb) && !seen.has(nb)) { seen.add(nb); stack.push(nb); }
        }
        expect(seen.size, `${preset.id} (${n}p) splits the board`).toBe(all.length);
      }
    }
  });

  it('leaves enough selectable nations for the player count', () => {
    for (let n = 2; n <= 8; n++) {
      for (const preset of boardPresets(n)) {
        expect(availableNations(preset.config).length, `${preset.id} (${n}p)`).toBeGreaterThanOrEqual(n);
      }
    }
  });
});
