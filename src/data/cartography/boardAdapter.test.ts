import { describe, it, expect } from 'vitest';
import { buildBoardGeometryModel, ensureClosedRing, isRingValid } from './boardAdapter.js';
import type { BoardPixelPoint } from './types.js';

describe('boardAdapter (Lot 1 - Modèle Cartographique Intermédiaire)', () => {
  it('closes open rings properly', () => {
    const openRing: BoardPixelPoint[] = [[0, 0], [10, 0], [10, 10]];
    const closed = ensureClosedRing(openRing);
    expect(closed).toHaveLength(4);
    expect(closed[0]).toEqual(closed[3]);
  });

  it('preserves already closed rings without duplicating points', () => {
    const alreadyClosed: BoardPixelPoint[] = [[0, 0], [10, 0], [10, 10], [0, 0]];
    const closed = ensureClosedRing(alreadyClosed);
    expect(closed).toHaveLength(4);
    expect(closed).toEqual(alreadyClosed);
  });

  it('builds a model containing exactly the 222 playable cells', () => {
    const model = buildBoardGeometryModel();
    expect(model.image.width).toBe(3800);
    expect(model.image.height).toBe(1405);
    expect(model.cellCount).toBe(222);
    expect(model.cells).toHaveLength(222);
  });

  it('guarantees unique area IDs and valid closed geometries for all cells', () => {
    const model = buildBoardGeometryModel();
    const ids = model.cells.map((c) => c.areaId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(222);

    for (const cell of model.cells) {
      expect(cell.geometry.exterior.length).toBeGreaterThanOrEqual(4);
      expect(isRingValid(cell.geometry.exterior)).toBe(true);

      const first = cell.geometry.exterior[0]!;
      const last = cell.geometry.exterior[cell.geometry.exterior.length - 1]!;
      expect(first).toEqual(last);

      // Anchors must be finite with positive radius
      expect(Number.isFinite(cell.anchor.x)).toBe(true);
      expect(Number.isFinite(cell.anchor.y)).toBe(true);
      expect(cell.anchor.r).toBeGreaterThan(0);
    }
  });

  it('preserves inner holes such as arabia', () => {
    const model = buildBoardGeometryModel();
    const arabia = model.cells.find((c) => c.areaId === 'arabia');
    expect(arabia).toBeDefined();
    expect(arabia?.geometry.holes).toBeDefined();
    expect(arabia?.geometry.holes?.length).toBe(1);

    const hole = arabia!.geometry.holes![0]!;
    expect(hole.length).toBeGreaterThanOrEqual(4);
    expect(hole[0]).toEqual(hole[hole.length - 1]);
    expect(isRingValid(hole)).toBe(true);
  });

  it('exports a valid reference JSON file to docs/board-geometry-reference.json', async () => {
    const fs = await import('node:fs');
    const model = buildBoardGeometryModel();
    fs.writeFileSync('docs/board-geometry-reference.json', JSON.stringify(model, null, 2), 'utf8');
    expect(fs.existsSync('docs/board-geometry-reference.json')).toBe(true);
    const stat = fs.statSync('docs/board-geometry-reference.json');
    expect(stat.size).toBeGreaterThan(100000);
  });
});
