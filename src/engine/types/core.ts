/**
 * Types fondamentaux pour Advanced Civilization : joueurs, phases et états territoriaux.
 */

export type PlayerId = string; // Identifiant de la civilisation (ex: "egypt", "babylon")

/** Séquence de jeu officielle selon les règles §18. */
export type Phase =
  | 'taxation'            // Collecte de l'impôt et révoltes fiscales
  | 'populationExpansion' // Croissance démographique
  | 'census'              // Recensement et ordre du tour
  | 'shipConstruction'    // Construction et entretien naval
  | 'movement'            // Déplacements terrestres et maritimes
  | 'conflict'            // Résolution des combats et assauts
  | 'cityConstruction'    // Érection de cités
  | 'removeSurplus'       // Retrait des surplus et soutien des cités
  | 'tradeAcquisition'    // Pioche des cartes de commerce
  | 'trade'               // Négociation bilatérale ouverte
  | 'calamity'            // Résolution des calamités
  | 'acquireAdvances'     // Achat d'avances de civilisation
  | 'astAdjustment';      // Progression sur l'AST et victoire

export const PHASE_ORDER: Phase[] = [
  'taxation',
  'populationExpansion',
  'census',
  'shipConstruction',
  'movement',
  'conflict',
  'cityConstruction',
  'removeSurplus',
  'tradeAcquisition',
  'trade',
  'calamity',
  'acquireAdvances',
  'astAdjustment',
];

/** Contenu mutable d'un joueur. */
export interface PlayerState {
  id: PlayerId;
  /** Pions disponibles en réserve hors plateau (le stock). */
  stock: number;
  /** Pions dans le trésor (monnaie d'achat d'avances et d'entretien). */
  treasury: number;
  /** Cités disponibles en réserve (max 9). */
  citiesAvailable: number;
  /** Navires disponibles en réserve (max 4). */
  shipsAvailable: number;
  /** Recensement de la population sur la carte ce tour-ci. */
  census: number;
  /** Taux d'imposition (1-3, modifiable avec Monnayage §32.421; défaut 2). */
  taxRate?: number;
  /** Identifiants des avances de civilisation possédées. */
  advances: string[];
  /** Cartes de commerce en main : id -> quantité (produits ou calamity:<id>). */
  hand: Record<string, number>;
  /** Déprécié : conservé pour compatibilité des sauvegardes. */
  calamities: string[];
  /** Nombre public de cartes tenues en main (masquage d'information §27.4). */
  handCount?: number;
  /** Position sur la piste AST (indice 0..16). */
  astSpace: number;
  /** Époque actuelle (Stone, Early Bronze, etc.). */
  epoch: string;
  /** Indique si la nation a été temporairement rayée de la carte ce tour. */
  eliminatedFromBoard?: boolean;
  /** Conversion Monothéisme effectuée ce tour (§32.941). */
  convertedThisTurn?: boolean;
  /** Construction avec trésor Architecture effectuée ce tour (§32.631). */
  builtWithTreasuryThisTurn?: boolean;
  /** Cartes Grain engagées pour adoucir la Famine via Poterie (§30.312). */
  grainLockedThisTurn?: number;
  /** Bonus d'Exploitation Minière utilisé ce tour (§32.261). */
  miningUsedThisTurn?: boolean;
  /** Cités bâties ou conquises ce tour (réduites en priorité §26.32). */
  citiesBuiltThisTurn?: string[];
  /** Avances acquises ce tour (crédits différés au tour suivant §31.53). */
  advancesThisTurn?: string[];
}

/** Contenu d'une région ou zone de carte. */
export interface AreaState {
  /** Nombre de pions par propriétaire (owner id -> pions). */
  tokens: Record<PlayerId, number>;
  /** Propriétaire de la cité si une cité s'y trouve. */
  city?: PlayerId;
  /** Indique s'il s'agit d'une cité pirate autonome. */
  pirateCity?: boolean;
  /** Navires présents (owner id -> navires). */
  ships?: Record<PlayerId, number>;
}

/** Ensemble de pions et cités d'un joueur (ex: faction de Guerre Civile §30.412). */
export interface UnitSet {
  tokens: Record<string, number>;
  cities: string[];
}

/** Étape d'un convoi naval de navires (§23.5). */
export interface VoyageStep {
  area: string;
  load?: number;
  unload?: number;
}

/** Action unitaire de construction ou démantèlement naval (§22.3). */
export type ShipPhaseStep =
  | { kind: 'build'; area: string; fromArea: number; fromTreasury: number }
  | { kind: 'scrap'; area: string }
  | { kind: 'maintain'; area: string };
