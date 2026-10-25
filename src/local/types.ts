/**
 * Types pour la session et la persistance locale autonome.
 */

import type { PlayerId, GameState } from '../engine/types.js';

export type ControllerType = 'human' | 'heuristic-ai';

/** Configuration d'un siège de joueur local. */
export interface LocalSeat {
  civilizationId: PlayerId;
  controller: ControllerType;
  displayName?: string;
}

/** Paramètres d'une partie locale autonome. */
export interface LocalSessionConfig {
  seats: LocalSeat[];
  boardPresetId?: string | null;
  /** Mode de confidentialité : table ouverte (visible) ou passage de main (secret). */
  privacyMode: 'open-table' | 'handoff';
  /** Cadence d'exécution de l'IA : instantanée ou lisible (délai d'observation). */
  aiPace: 'instant' | 'readable';
  seed?: number;
}

/** Format officiel d'un fichier de sauvegarde locale (.json). */
export interface LocalSaveFile {
  formatVersion: 1;
  appVersion: string;
  savedAt: number;
  config: LocalSessionConfig;
  state: GameState;
}

/** Résultat de validation d'un import de sauvegarde. */
export type SaveValidationResult =
  | { ok: true; save: LocalSaveFile }
  | { ok: false; error: string };
