import { describe, expect, it } from 'vitest';
import { validateSessionConfig, createLocalSession, isHumanActor } from './session.js';
import { importSaveFromJson, exportSaveAsJson, CURRENT_SAVE_FORMAT, CURRENT_APP_VERSION } from './persistence.js';
import { generateLocalDiagnostic } from './diagnostics.js';
import type { LocalSessionConfig } from './types.js';

describe('Couche locale autonome', () => {
  const validConfig: LocalSessionConfig = {
    seats: [
      { civilizationId: 'italy', controller: 'human', displayName: 'Joueur 1' },
      { civilizationId: 'africa', controller: 'heuristic-ai' },
    ],
    boardPresetId: 'raw-2p',
    privacyMode: 'handoff',
    aiPace: 'instant',
    seed: 42,
  };

  it('valide une configuration locale saine', () => {
    const res = validateSessionConfig(validConfig);
    expect(res.valid).toBe(true);
  });

  it('rejette une configuration sans joueur humain', () => {
    const noHuman: LocalSessionConfig = {
      ...validConfig,
      seats: [
        { civilizationId: 'egypt', controller: 'heuristic-ai' },
        { civilizationId: 'babylon', controller: 'heuristic-ai' },
      ],
    };
    const res = validateSessionConfig(noHuman);
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.reason).toContain('humain');
    }
  });

  it('rejette une configuration avec des civilisations en double', () => {
    const dupes: LocalSessionConfig = {
      ...validConfig,
      seats: [
        { civilizationId: 'egypt', controller: 'human' },
        { civilizationId: 'egypt', controller: 'heuristic-ai' },
      ],
    };
    const res = validateSessionConfig(dupes);
    expect(res.valid).toBe(false);
  });

  it('instancie une partie valide à partir de la configuration', () => {
    const state = createLocalSession(validConfig);
    expect(state).toBeDefined();
    expect(state.turn).toBe(1);
    expect(state.players['italy']).toBeDefined();
    expect(state.players['africa']).toBeDefined();
    expect(isHumanActor(validConfig, 'italy')).toBe(true);
    expect(isHumanActor(validConfig, 'africa')).toBe(false);
  });

  it('sérialise et importe une sauvegarde sans perte', () => {
    const state = createLocalSession(validConfig);
    const saveObj = {
      formatVersion: 1 as const,
      appVersion: CURRENT_APP_VERSION,
      savedAt: Date.now(),
      config: validConfig,
      state,
    };
    const jsonStr = exportSaveAsJson(saveObj);
    const imported = importSaveFromJson(jsonStr);
    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.save.config.seats.length).toBe(2);
      expect(imported.save.state.turn).toBe(1);
    }
  });

  it('rejette un JSON de sauvegarde corrompu ou incomplet', () => {
    const badJson = '{"formatVersion": 999}';
    const res = importSaveFromJson(badJson);
    expect(res.ok).toBe(false);
  });

  it('génère un rapport de diagnostic technique complet', () => {
    const state = createLocalSession(validConfig);
    const diag = generateLocalDiagnostic(state, validConfig, {
      userNote: 'Test de diagnostic',
      anonymizeNames: true,
    });
    expect(diag).toContain('RAPPORT DE DIAGNOSTIC LOCAL');
    expect(diag).toContain('Test de diagnostic');
    expect(diag).toContain('Joueur (human)');
  });
});
