import type { SupportedLanguage } from '../../theme/settingsStore.js';

export const CIV_NAMES_FR: Record<string, string> = {
  egypt: 'Égypte',
  babylon: 'Babylone',
  assyria: 'Assyrie',
  asia: 'Asie',
  africa: 'Afrique',
  iberia: 'Ibérie',
  italy: 'Italie',
  illyria: 'Illyrie',
  thrace: 'Thrace',
  crete: 'Crète',
  persia: 'Perse',
  indus: 'Indus',
};

export function getCivNameFr(civId: string): string {
  return CIV_NAMES_FR[civId] ?? civId;
}

export interface PresetInfo {
  label: string;
  desc: string;
}

export const PRESET_INFO_BY_LANG: Record<SupportedLanguage, Record<string, PresetInfo>> = {
  fr: {
    'raw-2p': { label: 'Panneaux Centraux (Ouest des pointillés)', desc: 'Plateau resserré pour 2 joueurs · Règles §16.8' },
    'raw-3p': { label: 'Panneaux Centraux (Ouest des pointillés)', desc: 'Configuration équilibrée pour 3 joueurs · Règles §16.7' },
    'raw-4p-east': { label: 'Panneaux Orientaux (Est des pointillés)', desc: 'Égypte, Babylone, Assyrie, Asie · Règles §16.6' },
    'raw-4p-west': { label: 'Portion Occidentale + Extension Ouest', desc: 'Ibérie, Afrique, Illyrie, Thrace, Crète · Règles §16.6' },
    'raw-5p-east': { label: 'Panneaux 2 à 4 (Orient)', desc: 'Configuration 5 joueurs est · Règles §16.5' },
    'raw-5p-mid': { label: 'Panneaux 1 à 3 (Centre)', desc: 'Configuration 5 joueurs centre · Règles §16.5' },
    'raw-5p-west': { label: 'Extension Ouest + Panneaux 1-2', desc: 'Configuration 5 joueurs ouest · Règles §16.5' },
    'raw-6p': { label: 'Les 4 Panneaux Principaux', desc: 'Carte standard complète sans extensions · Règles §16.4' },
    'raw-6p-west': { label: 'Extension Ouest + Panneaux 1 à 3', desc: 'Variante occidentale 6 joueurs · Règles §16.4' },
    'raw-7p': { label: 'Tous les Panneaux + Extension Ouest', desc: 'Grande carte 7 joueurs · Règles §16.3' },
    'raw-8p': { label: 'Tous les Panneaux + Extension Ouest', desc: 'Grande carte 8 joueurs · Règles §16.2' },
    'main-only': { label: 'Plateau Principal Seul (Sans extensions)', desc: 'Carte classique 4 panneaux · Variante standard' },
    'full-map': { label: 'Carte Complète (Tous plateaux)', desc: 'Plateau étendu avec toutes les extensions · Variante libre' },
  },
  en: {
    'raw-2p': { label: 'Central Panels (West of dotted line)', desc: 'Tight board for 2 players · Rules §16.8' },
    'raw-3p': { label: 'Central Panels (West of dotted line)', desc: 'Balanced setup for 3 players · Rules §16.7' },
    'raw-4p-east': { label: 'Eastern Panels (East of dotted line)', desc: 'Egypt, Babylon, Assyria, Asia · Rules §16.6' },
    'raw-4p-west': { label: 'Western Portion + Western Extension', desc: 'Iberia, Africa, Illyria, Thrace, Crete · Rules §16.6' },
    'raw-5p-east': { label: 'Panels 2 to 4 (East)', desc: '5-player eastern setup · Rules §16.5' },
    'raw-5p-mid': { label: 'Panels 1 to 3 (Center)', desc: '5-player central setup · Rules §16.5' },
    'raw-5p-west': { label: 'Western Extension + Panels 1-2', desc: '5-player western setup · Rules §16.5' },
    'raw-6p': { label: 'All 4 Main Panels', desc: 'Standard full map without extensions · Rules §16.4' },
    'raw-6p-west': { label: 'Western Extension + Panels 1 to 3', desc: '6-player western variant · Rules §16.4' },
    'raw-7p': { label: 'All Panels + Western Extension', desc: 'Grand 7-player map · Rules §16.3' },
    'raw-8p': { label: 'All Panels + Western Extension', desc: 'Grand 8-player map · Rules §16.2' },
    'main-only': { label: 'Main Board Only (No extensions)', desc: 'Classic 4-panel map · Standard variant' },
    'full-map': { label: 'Full Map (All boards)', desc: 'Extended map with all expansions · Open variant' },
  },
  de: {
    'raw-2p': { label: 'Zentrale Tafeln (Westlich der Punktlinie)', desc: 'Kompakter Spielplan für 2 Spieler · Regeln §16.8' },
    'raw-3p': { label: 'Zentrale Tafeln (Westlich der Punktlinie)', desc: 'Ausgewogenes Szenario für 3 Spieler · Regeln §16.7' },
    'raw-4p-east': { label: 'Östliche Tafeln (Östlich der Punktlinie)', desc: 'Ägypten, Babylon, Assyrien, Asien · Regeln §16.6' },
    'raw-4p-west': { label: 'Westteil + Westerweiterung', desc: 'Iberien, Afrika, Illyrien, Thrakien, Kreta · Regeln §16.6' },
    'raw-5p-east': { label: 'Tafeln 2 bis 4 (Orient)', desc: '5-Spieler-Szenario Ost · Regeln §16.5' },
    'raw-5p-mid': { label: 'Tafeln 1 bis 3 (Zentrum)', desc: '5-Spieler-Szenario Zentrum · Regeln §16.5' },
    'raw-5p-west': { label: 'Westerweiterung + Tafeln 1-2', desc: '5-Spieler-Szenario West · Regeln §16.5' },
    'raw-6p': { label: 'Die 4 Haupttafeln', desc: 'Standard-Vollkarte ohne Erweiterungen · Regeln §16.4' },
    'raw-6p-west': { label: 'Westerweiterung + Tafeln 1 bis 3', desc: 'Westliche 6-Spieler-Variante · Regeln §16.4' },
    'raw-7p': { label: 'Alle Tafeln + Westerweiterung', desc: 'Große Karte für 7 Spieler · Regeln §16.3' },
    'raw-8p': { label: 'Alle Tafeln + Westerweiterung', desc: 'Große Karte für 8 Spieler · Regeln §16.2' },
    'main-only': { label: 'Nur Hauptplan (Ohne Erweiterungen)', desc: 'Klassische 4-Tafel-Karte · Standardvariante' },
    'full-map': { label: 'Gesamte Karte (Alle Tafeln)', desc: 'Erweiterter Spielplan mit allen Zusätzen · Freie Variante' },
  },
  es: {
    'raw-2p': { label: 'Paneles Centrales (Oeste de la línea punteada)', desc: 'Tablero compacto para 2 jugadores · Reglas §16.8' },
    'raw-3p': { label: 'Paneles Centrales (Oeste de la línea punteada)', desc: 'Configuración equilibrada para 3 jugadores · Reglas §16.7' },
    'raw-4p-east': { label: 'Paneles Orientales (Este de la línea punteada)', desc: 'Egipto, Babilonia, Asiria, Asia · Reglas §16.6' },
    'raw-4p-west': { label: 'Porción Occidental + Extensión Oeste', desc: 'Iberia, África, Iliria, Tracia, Creta · Reglas §16.6' },
    'raw-5p-east': { label: 'Paneles 2 a 4 (Oriente)', desc: 'Configuración 5 jugadores este · Reglas §16.5' },
    'raw-5p-mid': { label: 'Paneles 1 a 3 (Centro)', desc: 'Configuración 5 jugadores centro · Reglas §16.5' },
    'raw-5p-west': { label: 'Extensión Oeste + Paneles 1-2', desc: 'Configuración 5 jugadores oeste · Reglas §16.5' },
    'raw-6p': { label: 'Los 4 Paneles Principales', desc: 'Mapa estándar completo sin extensiones · Reglas §16.4' },
    'raw-6p-west': { label: 'Extensión Oeste + Paneles 1 a 3', desc: 'Variante occidental 6 jugadores · Reglas §16.4' },
    'raw-7p': { label: 'Todos los Paneles + Extensión Oeste', desc: 'Gran mapa para 7 jugadores · Reglas §16.3' },
    'raw-8p': { label: 'Todos los Paneles + Extensión Oeste', desc: 'Gran mapa para 8 jugadores · Reglas §16.2' },
    'main-only': { label: 'Tablero Principal Solo (Sin extensiones)', desc: 'Mapa clásico de 4 paneles · Variante estándar' },
    'full-map': { label: 'Mapa Completo (Todos los tableros)', desc: 'Tablero ampliado con todas las expansiones · Variante libre' },
  },
};

export const PRESET_INFO_FR = PRESET_INFO_BY_LANG.fr;

export function getPresetInfo(id: string, lang: SupportedLanguage = 'fr'): PresetInfo | undefined {
  return PRESET_INFO_BY_LANG[lang]?.[id] ?? PRESET_INFO_BY_LANG.fr[id];
}

export function translateReason(reason: string | undefined, lang: SupportedLanguage = 'fr'): string {
  if (!reason) return '';
  if (reason.includes('Iberia replaces Italy')) {
    switch (lang) {
      case 'en': return 'Iberia replaces Italy on the Western Extension';
      case 'de': return 'Iberien ersetzt Italien auf der Westerweiterung';
      case 'es': return 'Iberia reemplaza a Italia en la Extensión Oeste';
      default: return 'L’Ibérie remplace l’Italie sur l’Extension Ouest';
    }
  }
  if (reason.includes('Iberia plays only')) {
    switch (lang) {
      case 'en': return 'Iberia requires Western Extension';
      case 'de': return 'Iberien benötigt die Westerweiterung';
      case 'es': return 'Iberia requiere la Extensión Oeste';
      default: return 'L’Ibérie nécessite l’Extension Ouest';
    }
  }
  if (reason.includes('Not one of the nations §16')) {
    switch (lang) {
      case 'en': return 'Not selectable per §16 for this player count';
      case 'de': return 'Nicht wählbar gemäß §16 für diese Spielerzahl';
      case 'es': return 'No seleccionable según §16 para este número de jugadores';
      default: return 'Non sélectionnable selon §16 pour cet effectif';
    }
  }
  if (reason.includes('No start area in play')) {
    switch (lang) {
      case 'en': return 'Start area off-board (§16.12)';
      case 'de': return 'Startgebiet außerhalb des Plans (§16.12)';
      case 'es': return 'Zona de inicio fuera del tablero (§16.12)';
      default: return 'Zone de départ hors plateau (§16.12)';
    }
  }
  return reason;
}
