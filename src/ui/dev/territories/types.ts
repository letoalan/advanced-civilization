import type { TerritoryRegion } from '../../../data/territories.js';

export type GameArea = { id: string; name: string; isWater: boolean; pt: [number, number] };

export type Drag =
  | { kind: 'vertex'; id: number; index: number }
  | { kind: 'move'; id: number; last: [number, number] }
  | null;

export type Ring = [number, number][];

export type CutState = { id: number; pts: [number, number][] } | null;

export type NameStatus =
  | { kind: 'ok'; area: GameArea }
  | { kind: 'merged'; areas: GameArea[] }
  | { kind: 'empty' }
  | { kind: 'mismatch'; area: GameArea };
