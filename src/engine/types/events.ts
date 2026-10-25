/**
 * Événements et journaux de combat et de calamité pour les modales et replays.
 */

import type { PlayerId } from './core.js';

/** Force en présence dans une zone pour l'affichage de combat. */
export interface CombatForce {
  id: PlayerId;
  tokens: number;
  city: boolean;
}

/** Événement de combat dans une zone. */
export interface CombatEvent {
  area: string;
  before: CombatForce[];
  after: CombatForce[];
  modifiers: string[];
  note: string;
}

/** Étape unitaire de résolution d'une calamité. */
export interface CalamityStep {
  text: string;
  player?: PlayerId;
  secondary?: boolean;
}

/** Événement complet d'une calamité pour affichage étape par étape. */
export interface CalamityEvent {
  calamity: string;
  calamityId: string;
  description: string;
  holder: PlayerId;
  steps: CalamityStep[];
  overviewBefore: string;
  overviewAfter: string;
  interactive?: boolean;
}
