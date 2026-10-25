export type Board = 'western' | 'main' | 'eastern';

/** A main-board crop region (rules §16): the ids name which part is OUT of play. */
export type CropKey = 'panel1' | 'panel12' | 'panel4' | 'panel34' | 'eastOfDotted' | 'westOfDotted';

/** Rules-§16 play-area data derived from the VASSAL module's overlays
 *  (scripts/derive_play_areas.py). `outOfPlay`: main-board area ids removed by
 *  each crop. `suppressedCitySites` (§16.11): areas left in play whose printed
 *  city site sits on an out-of-play panel (empty for every crop on this board —
 *  derived and kept for completeness). `islandCitySites` (§16.8): sites
 *  disregarded in 2-player games. */
export interface PlayAreas {
  outOfPlay: Record<CropKey, string[]>;
  suppressedCitySites: Record<CropKey, string[]>;
  islandCitySites: string[];
  /** Each crop's greyout cover outline, in NATIVE VASSAL main-panel coordinates
   *  — NOT the combined space `Area.path` uses. Map through anchors.ts
   *  `mainToCombined` before drawing the out-of-play veil over the board. */
  coverPolygons: Record<CropKey, [number, number][]>;
}

export interface Area {
  id: string;
  name: string;
  board: Board;
  /** Max population the area supports (0 for water). */
  sustains: number;
  isWater: boolean;
  /** Printed city site: 6 tokens build a city here; 12 elsewhere (§25.2). */
  isCitySite: boolean;
  /** Flood calamity applies here (§30.51). */
  isFloodplain: boolean;
  /** Open sea — crossable only with Astronomy (§32.411). */
  isOpenSea: boolean;
  /** Can be struck by Volcanic Eruption / Earthquake (§30.21). */
  isVolcanoSite: boolean;
  /** If set, a legal opening area for the named nation. */
  startRegion: string | null;
  /** A coastal territory's own inner water — pure naval-routing plumbing
   *  (scripts/build-water-areas.mjs). Never a move origin/destination or a
   *  ship's resting place; the UI does not draw it as a clickable cell. */
  coastalWater?: boolean;
  /** For a coastalWater area, the land area it belongs to; out of play with it. */
  parent?: string;
  path: [number, number][];
  flags: Record<string, string>;
}

export type AdvanceGroup = 'Crafts' | 'Arts' | 'Civics' | 'Sciences' | 'Religion';

export interface Advance {
  id: string;
  name: string;
  groups: AdvanceGroup[];
  cost: number;
  prerequisites?: string[];
  credits: {
    byGroup: Partial<Record<AdvanceGroup, number>>;
    byCard: Record<string, number>;
  };
}

export interface Commodity {
  id: string;
  name: string;
  stack: number;
  value: number;
  count: number;
}

export interface Calamity {
  id: string;
  name: string;
  level: number;
  tradable: boolean;
  severity: number;
  effect: { kind: string; [k: string]: unknown };
  reducedBy?: string[];
  worsenedBy?: string[];
  nullifiedBy?: string[];
}

export interface Civilization {
  id: string;
  name: string;
  color: string;
  /** Canonical default opening area (first of startAreas). */
  start: string;
  /** All legal opening areas (from VASSAL StartRegion tags). */
  startAreas: string[];
  /** Fixed A.S.T. rank (§17.4): Africa=0 first … Egypt=13 last. Used as the
   *  census tie-breaker and the primary actor order for the phases the rules run
   *  in A.S.T. order (taxation, population expansion, advance acquisition). */
  astOrder: number;
}

export interface Epoch {
  id: string;
  name: string;
  requirements: {
    cities?: number;
    cards?: number;
    cardGroups?: number;
    perSpaceCardValue?: boolean;
  };
}

export interface AstTrack {
  spaces: number;
  finishSpace: number;
  pointsPerSpace: number;
  epochStart: Record<string, number>;
  /** Civ-card point value required to enter each successive Late Iron Age space
   *  (§33.25); its length = number of LIA spaces. */
  lateIronThresholds?: number[];
}

export interface ShipHop {
  to: string;
  side: string | null;
  toSide: string | null;
}
