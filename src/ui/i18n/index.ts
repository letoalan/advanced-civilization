import { useUiSettings, type SupportedLanguage } from '../theme/settingsStore.js';
import type { Translations, PhaseInfo } from './types.js';
import { fr } from './locales/fr.js';
import { en } from './locales/en.js';
import { de } from './locales/de.js';
import { es } from './locales/es.js';

export * from './types.js';
export { LanguageSelector } from './LanguageSelector.js';

export const LOCALES: Record<SupportedLanguage, Translations> = { fr, en, de, es };

export function getTranslation(lang: SupportedLanguage = 'fr'): Translations {
  return LOCALES[lang] ?? fr;
}

type LangOrT = SupportedLanguage | Translations | undefined;

function resolveTranslations(arg: LangOrT): Translations {
  if (arg && typeof arg === 'object' && 'data' in arg) {
    return arg;
  }
  return getTranslation(arg as SupportedLanguage | undefined);
}

export function translateCiv(id: string, langOrT?: LangOrT): string {
  const dict = resolveTranslations(langOrT).data.civilizations;
  return dict[id.toLowerCase()] ?? id;
}

export function translateCommodity(id: string, langOrT?: LangOrT): string {
  const dict = resolveTranslations(langOrT).data.commodities;
  return dict[id.toLowerCase()] ?? id;
}

export function translateAdvance(id: string, langOrT?: LangOrT): { name: string; desc: string } {
  const dict = resolveTranslations(langOrT).data.advances;
  return dict[id.toLowerCase()] ?? { name: id, desc: '' };
}

export function translateCalamity(id: string, langOrT?: LangOrT): { name: string; desc: string } {
  const dict = resolveTranslations(langOrT).data.calamities;
  return dict[id.toLowerCase()] ?? { name: id, desc: '' };
}

export function translateEpoch(id: string, langOrT?: LangOrT): string {
  const dict = resolveTranslations(langOrT).data.epochs;
  return dict[id] ?? id;
}

export function translatePhase(phase: string, langOrT?: LangOrT): PhaseInfo {
  const dict = resolveTranslations(langOrT).phases;
  return dict[phase] ?? { num: '', title: phase, subtitle: '' };
}

export function useTranslation() {
  const [settings, setSettings] = useUiSettings();
  const lang = settings.language ?? 'fr';
  const t = getTranslation(lang);

  const setLanguage = (newLang: SupportedLanguage) => {
    setSettings({ language: newLang });
  };

  return {
    lang,
    language: lang,
    t,
    setLanguage,
    trCiv: (id: string) => translateCiv(id, lang),
    trCommodity: (id: string) => translateCommodity(id, lang),
    trAdvance: (id: string) => translateAdvance(id, lang),
    trCalamity: (id: string) => translateCalamity(id, lang),
    trEpoch: (id: string) => translateEpoch(id, lang),
    trPhase: (phase: string) => translatePhase(phase, lang),
  };
}
