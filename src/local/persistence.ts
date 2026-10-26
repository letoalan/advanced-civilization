/**
 * Moteur de persistance locale : sauvegarde automatique (localStorage) et import/export JSON.
 */

import { adapter } from '../engine/index.js';
import { validateSessionConfig } from './session.js';
import type { LocalSaveFile, LocalSessionConfig, SaveValidationResult } from './types.js';
import type { GameState } from '../engine/types.js';

export const LOCAL_AUTOSAVE_KEY = 'advciv-local-save';
export const CURRENT_SAVE_FORMAT = 1;
export const CURRENT_APP_VERSION = '0.2.0-local';

export function saveLocalGame(config: LocalSessionConfig, state: GameState): boolean {
  try {
    const payload: LocalSaveFile = {
      formatVersion: CURRENT_SAVE_FORMAT,
      appVersion: CURRENT_APP_VERSION,
      savedAt: Date.now(),
      config,
      state,
    };
    localStorage.setItem(LOCAL_AUTOSAVE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Échec de la sauvegarde locale dans localStorage:', err);
    return false;
  }
}

export function loadLocalSave(): LocalSaveFile | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTOSAVE_KEY);
    if (!raw) return null;
    const result = importSaveFromJson(raw);
    return result.ok ? result.save : null;
  } catch {
    return null;
  }
}

export function clearLocalSave(): void {
  try {
    localStorage.removeItem(LOCAL_AUTOSAVE_KEY);
  } catch {
    // Ignore les erreurs d'effacement
  }
}

export function importSaveFromJson(rawJson: string): SaveValidationResult {
  try {
    if (!rawJson || typeof rawJson !== 'string' || rawJson.length > 5_000_000) {
      return { ok: false, error: 'Fichier de sauvegarde vide ou de taille anormale.' };
    }

    const data = JSON.parse(rawJson) as Partial<LocalSaveFile>;

    if (data.formatVersion !== CURRENT_SAVE_FORMAT) {
      return { ok: false, error: `Version de format de sauvegarde incompatible : reçu ${data.formatVersion}, attendu ${CURRENT_SAVE_FORMAT}.` };
    }

    if (!data.config || !data.state) {
      return { ok: false, error: 'Structure de sauvegarde incomplète (config ou état manquant).' };
    }

    // Valider la configuration de session
    const configValid = validateSessionConfig(data.config);
    if (!configValid.valid) {
      return { ok: false, error: `Configuration de session invalide : ${configValid.reason}` };
    }

    // Valider le schéma du moteur et migrer si besoin
    if (data.state.schemaVersion !== adapter.schemaVersion) {
      if (typeof data.state.schemaVersion === 'number' && data.state.schemaVersion < adapter.schemaVersion && adapter.migrate) {
        data.state = adapter.migrate(data.state, data.state.schemaVersion);
      } else {
        return { ok: false, error: `Version du moteur de règles incompatible : ${data.state.schemaVersion} vs ${adapter.schemaVersion}.` };
      }
    }

    return {
      ok: true,
      save: {
        formatVersion: CURRENT_SAVE_FORMAT,
        appVersion: data.appVersion || CURRENT_APP_VERSION,
        savedAt: data.savedAt || Date.now(),
        config: data.config,
        state: data.state,
      },
    };
  } catch (err) {
    return { ok: false, error: `Erreur de syntaxe JSON : ${err instanceof Error ? err.message : String(err)}` };
  }
}

export function exportSaveAsJson(save: LocalSaveFile): string {
  return JSON.stringify(save, null, 2);
}

export function downloadSaveFile(save: LocalSaveFile, filename?: string): void {
  try {
    const json = exportSaveAsJson(save);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ?? `advciv-save-tour-${save.state.turn}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Échec du téléchargement du fichier JSON:', err);
  }
}

