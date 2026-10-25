/**
 * Modèle cartographique intermédiaire (Lot 1 - carte.md).
 * Sépare explicitement l'identité de jeu, la géométrie en coordonnées board-pixels,
 * les ancrages robustes et les métadonnées de validation.
 */

export type BoardPixelPoint = [x: number, y: number];

export type BoardPixelRing = BoardPixelPoint[];

export interface BoardPixelGeometry {
  /** Anneau extérieur fermé (le premier sommet est répété en fin d'anneau). */
  exterior: BoardPixelRing;
  /** Anneaux intérieurs découpés (trous / enclaves). */
  holes?: BoardPixelRing[];
}

export interface BoardAnchor {
  x: number;
  y: number;
  r: number;
}

export interface BoardCellFeature {
  /** Identifiant unique et immuable du moteur de jeu (ex: "thebes", "etruria-2"). */
  areaId: string;
  name?: string;
  /** western | main | eastern */
  panel: string;
  /** coastal | land | openSea | cosmetic | unset */
  category: string;
  isWater: boolean;
  isCitySite: boolean;
  isVolcanoSite: boolean;
  isFloodplain: boolean;
  sustains: number;
  /** Géométrie native en pixels dans le référentiel combiné [0..3800] x [0..1405]. */
  geometry: BoardPixelGeometry;
  /** Point d'ancrage calculé par pôle d'inaccessibilité (jamais un simple centroïde). */
  anchor: BoardAnchor;
}

export interface BoardGeometryModel {
  image: {
    width: number;
    height: number;
  };
  cellCount: number;
  cells: BoardCellFeature[];
}
