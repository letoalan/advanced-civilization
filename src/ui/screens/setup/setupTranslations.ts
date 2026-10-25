/**
 * Traductions françaises et métadonnées d'affichage pour l'écran de configuration locale.
 */

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

export const PRESET_INFO_FR: Record<string, { label: string; desc: string }> = {
  'raw-2p': {
    label: 'Panneaux Centraux (Ouest des pointillés)',
    desc: 'Plateau resserré pour 2 joueurs · Règles §16.8',
  },
  'raw-3p': {
    label: 'Panneaux Centraux (Ouest des pointillés)',
    desc: 'Configuration équilibrée pour 3 joueurs · Règles §16.7',
  },
  'raw-4p-east': {
    label: 'Panneaux Orientaux (Est des pointillés)',
    desc: 'Égypte, Babylone, Assyrie, Asie · Règles §16.6',
  },
  'raw-4p-west': {
    label: 'Portion Occidentale + Extension Ouest',
    desc: 'Ibérie, Afrique, Illyrie, Thrace, Crète · Règles §16.6',
  },
  'raw-5p-east': {
    label: 'Panneaux 2 à 4 (Orient)',
    desc: 'Configuration 5 joueurs est · Règles §16.5',
  },
  'raw-5p-mid': {
    label: 'Panneaux 1 à 3 (Centre)',
    desc: 'Configuration 5 joueurs centre · Règles §16.5',
  },
  'raw-5p-west': {
    label: 'Extension Ouest + Panneaux 1-2',
    desc: 'Configuration 5 joueurs ouest · Règles §16.5',
  },
  'raw-6p': {
    label: 'Les 4 Panneaux Principaux',
    desc: 'Carte standard complète sans extensions · Règles §16.4',
  },
  'raw-6p-west': {
    label: 'Extension Ouest + Panneaux 1 à 3',
    desc: 'Variante occidentale 6 joueurs · Règles §16.4',
  },
  'raw-7p': {
    label: 'Tous les Panneaux + Extension Ouest',
    desc: 'Grande carte 7 joueurs · Règles §16.3',
  },
  'raw-8p': {
    label: 'Tous les Panneaux + Extension Ouest',
    desc: 'Grande carte 8 joueurs · Règles §16.2',
  },
  'main-only': {
    label: 'Plateau Principal Seul (Sans extensions)',
    desc: 'Carte classique 4 panneaux · Variante standard',
  },
  'full-map': {
    label: 'Carte Complète (Tous plateaux)',
    desc: 'Plateau étendu avec toutes les extensions · Variante libre',
  },
};

export function translateReason(reason: string | undefined): string {
  if (!reason) return '';
  if (reason.includes('Iberia replaces Italy')) {
    return 'L’Ibérie remplace l’Italie sur l’Extension Ouest';
  }
  if (reason.includes('Iberia plays only')) {
    return 'L’Ibérie nécessite l’Extension Ouest';
  }
  if (reason.includes('Not one of the nations §16')) {
    return 'Non sélectionnable selon §16 pour cet effectif';
  }
  if (reason.includes('No start area in play')) {
    return 'Zone de départ hors plateau (§16.12)';
  }
  return reason;
}
