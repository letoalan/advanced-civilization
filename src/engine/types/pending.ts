/**
 * Types pour les choix en suspens (calamités, réductions, pertes et sélections interactives).
 */

import type { PlayerId, UnitSet } from './core.js';

/** Décision d'attribution des pertes secondaires d'une calamité (§29.64). */
export interface PendingAllocation {
  calamityId: string;
  holder: PlayerId;
  kind: 'unitPoints' | 'cities';
  pool: number;
  caps: Record<PlayerId, number>;
  cityWorth: number;
  areas?: string[];
  before: Record<string, { city?: PlayerId; tokens: Record<PlayerId, number> }>;
  overviewBefore: string;
}

/** Choix des cités à réduire par la victime principale d'une calamité (§30.321). */
export interface PendingCityChoice {
  calamityId: string;
  holder: PlayerId;
  count: number;
  before: Record<string, { city?: PlayerId; tokens: Record<PlayerId, number> }>;
  overviewBefore: string;
}

/** Choix des pions/cités à sacrifier ou céder (§29.63). */
export interface PendingUnitLoss {
  calamityId: string;
  holder: PlayerId;
  points: number;
  cityWorth: number;
  mode: 'remove' | 'cede';
  beneficiary?: PlayerId;
  areas?: string[];
  before: Record<string, { city?: PlayerId; tokens: Record<PlayerId, number> }>;
  overviewBefore: string;
}

/** Défausse obligatoire en cas de dépassement de la limite de main de 8 cartes (§31.71). */
export interface PendingDiscard {
  holder: PlayerId;
  count: number;
}

/** Perte secondaire individuelle ordonnée par la victime principale. */
export interface SecondaryLoss {
  victim: PlayerId;
  kind: 'unitPoints' | 'cities';
  amount: number;
  cityWorth: number;
  areas?: string[];
}

/** Réduction forcée de cités pour défaut de soutien (§26.32 / §30.42). */
export interface PendingSupport {
  holder: PlayerId;
  candidates: string[];
  lock: number;
  mode: 'support' | 'slaverevolt';
  before?: Record<string, { city?: PlayerId; tokens: Record<PlayerId, number> }>;
  overviewBefore?: string;
}

/** Sélection de cités par un acteur désigné (Trahison, Inondation, Piraterie, etc.). */
export interface PendingPick {
  chooser: PlayerId;
  stage: 'treachery' | 'floodCity' | 'piracyPrimary' | 'piracySecondary' | 'volcanoSite' | 'earthquakeSite' | 'barbarian' | 'taxRevolt';
  march?: { here: string | null; visited: string[] };
  victim: PlayerId;
  trader?: PlayerId;
  count: number;
  candidates: string[];
  before?: Record<string, { city?: PlayerId; tokens: Record<PlayerId, number> }>;
  overviewBefore?: string;
}

/** File d'attente des pertes secondaires à résoudre par chaque victime. */
export interface PendingSecondary {
  calamityId: string;
  primary: PlayerId;
  queue: SecondaryLoss[];
  before: Record<string, { city?: PlayerId; tokens: Record<PlayerId, number> }>;
  overviewBefore: string;
}

/** Résolution interactive d'une Guerre Civile (§30.41). */
export interface PendingCivilWar {
  victim: PlayerId;
  beneficiary: PlayerId;
  stage: 'victimSelect' | 'beneficiarySelect' | 'victimKeep';
  victimPoints: number;
  beneficiaryPoints: number;
  philosophy: boolean;
  military: boolean;
  faction1: UnitSet;
  faction2?: UnitSet;
  before: Record<string, { city?: PlayerId; tokens: Record<PlayerId, number> }>;
  overviewBefore: string;
}

/** Décision de pillage après la prise d'une cité (§24.52). */
export interface PendingPillage {
  attacker: PlayerId;
  area: string;
  taken: number;
}
