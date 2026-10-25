import { describe, it, expect } from 'vitest';
import { boardPresets } from '../../../engine/boards.js';
import type { LocalSeat } from '../../../local/types.js';
import { reconcileSeats, swapOrUpdateSeatCiv } from './seatReconciliation.js';

describe('seatReconciliation', () => {
  it('guarantees unique civilizations when expanding player count', () => {
    const presets4 = boardPresets(4);
    const preset4East = presets4.find((b) => b.id === 'raw-4p-east')!;

    const initialSeats: LocalSeat[] = [
      { civilizationId: 'egypt', controller: 'human', displayName: 'Joueur 1' },
      { civilizationId: 'babylon', controller: 'heuristic-ai' },
      { civilizationId: 'assyria', controller: 'heuristic-ai' },
      { civilizationId: 'asia', controller: 'heuristic-ai' },
    ];

    // Expand to 5 players on Full Map
    const presets5 = boardPresets(5);
    const fullMap = presets5.find((b) => b.id === 'full-map')!;

    const seats5 = reconcileSeats(initialSeats, 5, fullMap.config);

    expect(seats5).toHaveLength(5);
    const civs = seats5.map((s) => s.civilizationId);
    const uniqueCivs = new Set(civs);
    expect(uniqueCivs.size).toBe(5);
    expect(civs).not.toContain('');
    // Seat 5 must NOT duplicate Babylon!
    expect(civs.filter((c) => c === 'babylon')).toHaveLength(1);
  });

  it('reconciles invalid civilizations when changing board preset', () => {
    // 4 seats on Full Map with Iberia
    const presets4 = boardPresets(4);
    const fullMap = presets4.find((b) => b.id === 'full-map')!;
    const eastPreset = presets4.find((b) => b.id === 'raw-4p-east')!;

    const seatsWithIberia: LocalSeat[] = [
      { civilizationId: 'iberia', controller: 'human' },
      { civilizationId: 'babylon', controller: 'heuristic-ai' },
      { civilizationId: 'assyria', controller: 'heuristic-ai' },
      { civilizationId: 'asia', controller: 'heuristic-ai' },
    ];

    // Reconcile onto Eastern panels (where Iberia is not allowed)
    const reconciled = reconcileSeats(seatsWithIberia, 4, eastPreset.config);

    expect(reconciled).toHaveLength(4);
    const civs = reconciled.map((s) => s.civilizationId);
    expect(civs).not.toContain('iberia');
    expect(civs).toContain('egypt');
    expect(new Set(civs).size).toBe(4);
  });

  it('swaps civilizations when user selects an already taken civ', () => {
    const seats: LocalSeat[] = [
      { civilizationId: 'iberia', controller: 'human' },
      { civilizationId: 'babylon', controller: 'heuristic-ai' },
      { civilizationId: 'assyria', controller: 'heuristic-ai' },
      { civilizationId: 'asia', controller: 'heuristic-ai' },
    ];

    // Seat 0 (Iberia) selects Babylon (currently held by Seat 1)
    const swapped = swapOrUpdateSeatCiv(seats, 0, 'babylon');

    expect(swapped[0]!.civilizationId).toBe('babylon');
    expect(swapped[1]!.civilizationId).toBe('iberia');
    expect(swapped[2]!.civilizationId).toBe('assyria');
    expect(swapped[3]!.civilizationId).toBe('asia');

    // No duplicates
    const civs = swapped.map((s) => s.civilizationId);
    expect(new Set(civs).size).toBe(4);
  });

  it('simply updates civilization when selecting an unassigned civ', () => {
    const seats: LocalSeat[] = [
      { civilizationId: 'egypt', controller: 'human' },
      { civilizationId: 'babylon', controller: 'heuristic-ai' },
    ];

    const updated = swapOrUpdateSeatCiv(seats, 1, 'assyria');
    expect(updated[1]!.civilizationId).toBe('assyria');
    expect(updated[0]!.civilizationId).toBe('egypt');
  });
});
