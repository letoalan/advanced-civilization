/**
 * Générateur d'export de diagnostics techniques locaux.
 */

import type { GameState } from '../engine/types.js';
import type { LocalSessionConfig } from './types.js';
import { CURRENT_APP_VERSION } from './persistence.js';

export interface DiagnosticOptions {
  userNote?: string;
  anonymizeNames?: boolean;
  includeFullState?: boolean;
}

export function generateLocalDiagnostic(
  state: GameState,
  config?: LocalSessionConfig,
  options: DiagnosticOptions = {}
): string {
  const dateStr = new Date().toISOString();
  const seats = config?.seats.map((s) => ({
    civ: s.civilizationId,
    controller: s.controller,
    name: options.anonymizeNames ? `Joueur (${s.controller})` : s.displayName || s.civilizationId,
  })) || [];

  const logLines = state.log.slice(-60).map((entry, idx) => {
    const msg = typeof entry === 'string' ? entry : entry.msg;
    return `[#${idx + 1}] ${msg}`;
  });

  const header = [
    '======================================================================',
    `RAPPORT DE DIAGNOSTIC LOCAL — ADVANCED CIVILIZATION`,
    '======================================================================',
    `Date           : ${dateStr}`,
    `Version App    : ${CURRENT_APP_VERSION}`,
    `Tour / Phase   : Tour ${state.turn} | Phase : ${state.phase}`,
    `Acteur actif   : ${state.activeOrder[0] || 'Aucun'}`,
    `Plateau        : ${config?.boardPresetId || (state.board ? (state.board.west ? 'west-extension' : 'standard') : 'défaut')}`,
    `Sièges         : ${seats.map((s) => `${s.name} [${s.civ}]`).join(', ')}`,
    '----------------------------------------------------------------------',
  ];

  if (options.userNote) {
    header.push(`NOTE DE L'UTILISATEUR :`, options.userNote, '----------------------------------------------------------------------');
  }

  header.push(`JOURNAL DES ÉVÉNEMENTS RÉCENTS (60 DERNIÈRES ENTRÉES) :`, ...logLines, '----------------------------------------------------------------------');

  if (options.includeFullState) {
    header.push(`ÉTAT SÉRIALISÉ DU MOTEUR (ATTENTION : CONTIENT LES CARTES EN MAIN) :`, JSON.stringify(state, null, 2));
  }

  return header.join('\n');
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
