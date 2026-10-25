import { areas } from '../index.js';
import { TERRITORIES } from '../territories.js';
import { anchors } from '../../ui/anchors.js';
import type {
  BoardGeometryModel,
  BoardCellFeature,
  BoardPixelRing,
  BoardPixelPoint,
} from './types.js';

/** Ferme un anneau s'il ne l'est pas déjà (premier sommet égal au dernier). */
export function ensureClosedRing(pts: BoardPixelPoint[]): BoardPixelRing {
  if (pts.length === 0) return [];
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  if (first[0] === last[0] && first[1] === last[1]) {
    return [...pts];
  }
  return [...pts, [first[0], first[1]]];
}

/** Valide que tous les sommets d'un anneau ont des coordonnées finies. */
export function isRingValid(ring: BoardPixelRing): boolean {
  if (ring.length < 4) return false; // Au moins un triangle fermé (3 points + 1 fermeture)
  return ring.every(
    ([x, y]) =>
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      x >= -5 &&
      x <= 3805 &&
      y >= -5 &&
      y <= 1410
  );
}

/**
 * Construit de manière pure et non destructive le modèle intermédiaire BoardGeometryModel
 * en croisant les identifiants de jeu (areas.json), les polygones (territories.json)
 * et les points d'ancrage calculés (anchors.ts).
 */
export function buildBoardGeometryModel(): BoardGeometryModel {
  // Indexer les régions territoriales par leur nom d'aire
  const territoryByAreaId = new Map<string, typeof TERRITORIES.regions[number]>();
  for (const r of TERRITORIES.regions) {
    if (r.name) territoryByAreaId.set(r.name, r);
  }

  const cells: BoardCellFeature[] = [];

  for (const a of areas) {
    // Exclure la plomberie de routage maritime (coastalWater)
    if (a.coastalWater) continue;

    const t = territoryByAreaId.get(a.id);
    const rawExterior: BoardPixelPoint[] = (t?.exterior ?? a.path).map(([x, y]) => [x, y]);
    const closedExterior = ensureClosedRing(rawExterior);

    const closedHoles = t?.holes
      ? t.holes.map((h) => ensureClosedRing(h.map(([x, y]) => [x, y])))
      : undefined;

    const anchor = anchors[a.id] ?? {
      x: a.path.reduce((s, p) => s + p[0], 0) / (a.path.length || 1),
      y: a.path.reduce((s, p) => s + p[1], 0) / (a.path.length || 1),
      r: 12,
    };

    cells.push({
      areaId: a.id,
      name: a.name || t?.name || a.id,
      panel: a.board,
      category: t?.category || (a.isWater ? 'openSea' : 'land'),
      isWater: a.isWater,
      isCitySite: !!a.isCitySite,
      isVolcanoSite: !!a.isVolcanoSite,
      isFloodplain: !!a.isFloodplain,
      sustains: a.sustains,
      geometry: {
        exterior: closedExterior,
        holes: closedHoles && closedHoles.length > 0 ? closedHoles : undefined,
      },
      anchor: {
        x: Math.round(anchor.x * 10) / 10,
        y: Math.round(anchor.y * 10) / 10,
        r: Math.round(anchor.r * 10) / 10,
      },
    });
  }

  return {
    image: {
      width: TERRITORIES.image?.width ?? 3800,
      height: TERRITORIES.image?.height ?? 1405,
    },
    cellCount: cells.length,
    cells,
  };
}
