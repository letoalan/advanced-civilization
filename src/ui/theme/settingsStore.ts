import { useEffect, useState } from 'react';

export type EffectsLevel = 'full' | 'reduced' | 'off';

export interface UiSettings {
  effects: EffectsLevel;
  sound: boolean;
  soundVolume: number;
  focusMode: boolean;
  focusIdleSeconds: number;
}

const STORAGE_KEY = 'advciv_ui_settings';

const DEFAULT_SETTINGS: UiSettings = {
  effects: 'full',
  sound: false,
  soundVolume: 0.5,
  focusMode: false,
  focusIdleSeconds: 4,
};

let currentSettings: UiSettings = loadSettings();
const listeners = new Set<(s: UiSettings) => void>();

function loadSettings(): UiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: UiSettings) {
  currentSettings = s;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
  listeners.forEach((l) => l(s));
}

export function updateUiSettings(partial: Partial<UiSettings>) {
  saveSettings({ ...currentSettings, ...partial });
}

export function getUiSettings(): UiSettings {
  return currentSettings;
}

export function useUiSettings(): [UiSettings, (partial: Partial<UiSettings>) => void] {
  const [settings, setSettings] = useState<UiSettings>(currentSettings);

  useEffect(() => {
    listeners.add(setSettings);
    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  return [settings, updateUiSettings];
}
