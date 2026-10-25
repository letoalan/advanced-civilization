import { TERRITORIES, polygonCentroid, type TerritoryRegion, type Category } from '../../../data/territories.js';
import areasJson from '../../../data/areas.json' with { type: 'json' };
import type { GameArea } from './types.js';

export const AREA_PTS: GameArea[] = (() => {
  const WEST_W = 782.177, MAIN_W = 2323.12, HH = 1587.4;
  const OFF: Record<string, number> = { western: 0, main: WEST_W, eastern: WEST_W + MAIN_W };
  const COMB_W = WEST_W + MAIN_W + 1189.066;
  const sx = TERRITORIES.image.width / COMB_W, sy = TERRITORIES.image.height / HH;
  return (areasJson as unknown as Array<{ id: string; name: string; isWater: boolean; board: string; path: number[][] }>)
    .filter((a) => a.path && a.path.length >= 3)
    .map((a) => {
      const c = polygonCentroid(a.path as [number, number][]);
      return { id: a.id, name: a.name, isWater: a.isWater, pt: [(c[0] + (OFF[a.board] ?? 0)) * sx, c[1] * sy] as [number, number] };
    });
})();

export const BOARD_SRC = '/dev-assets/board.png';
export const NATIVE_W = TERRITORIES.image.width;
export const NATIVE_H = TERRITORIES.image.height;
export const DISPLAY_W = 1900;
export const SCALE = DISPLAY_W / NATIVE_W;
export const DISPLAY_H = Math.round(NATIVE_H * SCALE);
export const INV_SCALE = NATIVE_W / DISPLAY_W;

export const RASTER_MAX = 700;
export const MIN_COMPONENT_AREA = 150;
export const CATS: Category[] = ['openSea', 'coastal', 'land', 'cosmetic'];

export const nextId = (rs: TerritoryRegion[]) => rs.reduce((m, r) => Math.max(m, r.id), -1) + 1;
