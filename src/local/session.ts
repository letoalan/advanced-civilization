/**
 * Gestionnaire de session locale et validation des configurations de partie.
 */

import { createGame } from '../engine/index.js';
import { availableNations, boardPresets } from '../engine/boards.js';
import type { LocalSessionConfig, LocalSeat } from './types.js';
import type { GameState, PlayerId } from '../engine/types.js';

export function validateSessionConfig(config: LocalSessionConfig): { valid: true } | { valid: false; reason: string } {
  if (!config.seats || !Array.isArray(config.seats)) {
    return { valid: false, reason: 'Configuration de sièges invalide.' };
  }

  const numPlayers = config.seats.length;
  if (numPlayers < 1 || numPlayers > 8) {
    return { valid: false, reason: 'Le nombre de joueurs doit être compris entre 1 et 8.' };
  }

  // Vérifier qu'il y a au moins un joueur humain
  const hasHuman = config.seats.some((s) => s.controller === 'human');
  if (!hasHuman) {
    return { valid: false, reason: 'Au moins un joueur humain doit participer à la partie.' };
  }

  // Vérifier l'absence de doublons
  const civIds = config.seats.map((s) => s.civilizationId);
  const uniqueCivs = new Set(civIds);
  if (uniqueCivs.size !== civIds.length) {
    return { valid: false, reason: 'Chaque civilisation ne peut être choisie qu’une seule fois.' };
  }

  // Vérifier la conformité au plateau choisi
  const presets = boardPresets(numPlayers);
  const preset = presets.find((b) => b.id === config.boardPresetId) ?? presets[0]!;
  const allowed = new Set(availableNations(preset.config));

  for (const civ of civIds) {
    if (!allowed.has(civ)) {
      return { valid: false, reason: `La civilisation ${civ} n’est pas disponible sur le plateau sélectionné.` };
    }
  }

  return { valid: true };
}

export function createLocalSession(config: LocalSessionConfig): GameState {
  const validation = validateSessionConfig(config);
  if (!validation.valid) {
    throw new Error(`Configuration locale invalide : ${validation.reason}`);
  }

  const players = config.seats.map((s) => s.civilizationId);
  const seed = config.seed ?? (Date.now() & 0xffff);

  return createGame({
    players,
    seed,
    maxTurns: 60,
    boardPreset: config.boardPresetId,
    chooseStartAreas: true,
    autoSkip: true,
  });
}

export function isHumanActor(config: LocalSessionConfig, playerId: PlayerId | null | undefined): boolean {
  if (!playerId) return false;
  const seat = config.seats.find((s) => s.civilizationId === playerId);
  return seat?.controller === 'human';
}

export function seatForActor(config: LocalSessionConfig, playerId: PlayerId | null | undefined): LocalSeat | undefined {
  if (!playerId) return undefined;
  return config.seats.find((s) => s.civilizationId === playerId);
}
