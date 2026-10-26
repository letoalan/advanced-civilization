import type { GameState } from '../../../../engine/types.js';

export interface QueuedMove {
  from: string;
  to: string;
  count: number;
  byShip?: boolean;
  via?: string;
}

export interface VoyageStep {
  area: string;
  load?: number;
  unload?: number;
}

export interface SurplusWarning {
  area: string;
  name: string;
  tokens: number;
  keep: number;
  lost: number;
  canBuild: boolean;
}

export interface MovementPlanner {
  active: boolean;
  origin: string | null;
  count: number;
  queued: QueuedMove[];
  highlight: Set<string>;
  available: (area: string) => number;
  destinations: { to: string; byShip?: boolean }[];
  embarkHint: string | null;
  surplusWarnings: SurplusWarning[];
  onBoardClick: (area: string | null) => void;
  setCount: (n: number) => void;
  removeQueued: (i: number) => void;
  voyage: VoyageStep[] | null;
  voyageInfo: { used: number; range: number; cargo: number; cargoAfter: number[]; canFinish: boolean } | null;
  startVoyage: () => void;
  startVoyageAt: (area: string) => void;
  playerShips: { area: string; count: number; available: number }[];
  cancelVoyage: () => void;
  undoStop: () => void;
  finishVoyage: () => void;
  setStopLoad: (i: number, n: number) => void;
  setStopUnload: (i: number, n: number) => void;
  queuedVoyages: VoyageStep[][];
  removeQueuedVoyage: (i: number) => void;
  shipsAt: (area: string) => number;
  undoLast: () => void;
  commit: () => void;
  pass: () => void;
  previewState: GameState;
  moved: Set<string>;
}
