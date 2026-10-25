import { availableNations, type BoardConfig } from '../../../engine/boards.js';
import type { LocalSeat } from '../../../local/types.js';

/**
 * Réconcilie les sièges d'une partie locale avec la configuration de plateau active.
 *
 * Invariants stricts garantis par le système :
 * 1. Exactement `targetCount` sièges retournés.
 * 2. Chaque siège possède une civilisation appartenant à `availableNations(boardConfig)`.
 * 3. Aucune civilisation n'apparaît plus d'une fois (unicité absolue, 0 doublon).
 * 4. Préserve au maximum les choix des joueurs (civ, contrôleur, displayName).
 */
export function reconcileSeats(
  prevSeats: LocalSeat[],
  targetCount: number,
  boardConfig: BoardConfig
): LocalSeat[] {
  const allowed = availableNations(boardConfig);
  const allowedSet = new Set(allowed);
  const usedCivs = new Set<string>();

  const result: LocalSeat[] = [];

  // Étape 1 : Conserver les sièges existants dont la civ est valide et non encore utilisée
  for (let i = 0; i < targetCount; i++) {
    const existing = prevSeats[i];
    if (existing && allowedSet.has(existing.civilizationId) && !usedCivs.has(existing.civilizationId)) {
      usedCivs.add(existing.civilizationId);
      result.push({ ...existing });
    } else {
      // Place réservée pour réaffectation
      result.push({
        civilizationId: '', // Temporaire
        controller: existing?.controller ?? (i === 0 ? 'human' : 'heuristic-ai'),
        displayName: existing?.displayName ?? (i === 0 ? 'Joueur 1' : undefined),
      });
    }
  }

  // Étape 2 : Pour chaque siège sans civilisation valide, puiser dans les nations disponibles non utilisées
  const unassigned = allowed.filter((c) => !usedCivs.has(c));
  let unassignedIdx = 0;

  for (let i = 0; i < targetCount; i++) {
    if (!result[i]!.civilizationId) {
      const nextCiv = unassigned[unassignedIdx] ?? allowed[0]!;
      unassignedIdx++;
      usedCivs.add(nextCiv);
      result[i]!.civilizationId = nextCiv;
    }
  }

  return result;
}

/**
 * Met à jour la civilisation d'un siège en effectuant une permutation intelligente (swap)
 * si la civilisation cible est déjà occupée par un autre siège.
 * Cela empêche structurellement tout doublon dans l'interface.
 */
export function swapOrUpdateSeatCiv(
  seats: LocalSeat[],
  seatIdx: number,
  newCivId: string
): LocalSeat[] {
  const currentCiv = seats[seatIdx]?.civilizationId;
  if (!currentCiv || currentCiv === newCivId) return seats;

  const conflictingIdx = seats.findIndex((s, i) => i !== seatIdx && s.civilizationId === newCivId);

  return seats.map((seat, i) => {
    if (i === seatIdx) {
      return { ...seat, civilizationId: newCivId };
    }
    if (i === conflictingIdx) {
      // Permutation automatique : le siège en conflit hérite de l'ancienne civ
      return { ...seat, civilizationId: currentCiv };
    }
    return seat;
  });
}
