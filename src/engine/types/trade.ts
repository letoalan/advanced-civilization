/**
 * Types pour les échanges commerciaux et la négociation bilatérale (§28).
 */

import type { PlayerId } from './core.js';

/**
 * Lot de cartes lors d'une transaction commerciale (§28.3).
 * Comprend les cartes réellement données (`actual`, secrètes) et les déclarations publiques.
 */
export interface TradeBundle {
  /** Cartes réellement transmises (id -> count, secret). */
  actual: Record<string, number>;
  /** Déclaration obligatoire : au moins 2 cartes véridiques. */
  declared: Record<string, number>;
  /** Nombre honnête de cartes transmises (public). */
  count?: number;
  /** Déclarations non contraignantes sur les autres cartes (vérité ou bluff). */
  claimed?: Record<string, number>;
}

/** Réponse / contre-proposition d'un joueur à une offre ouverte. */
export interface TradeResponse {
  from: PlayerId;
  give: TradeBundle;
}

/** Offre publique déposée sur la table de négociation (§28). */
export interface OpenOffer {
  id: number;
  from: PlayerId;
  /** Cartes cédées par l'offreur (annoncées via declared, bluffs autorisés). */
  give: TradeBundle;
  /** Marchandises acceptées en retour (1 à 5 souhaits). */
  wants: string[];
  /** Réponses reçues des autres joueurs. */
  responses: TradeResponse[];
}

/** Accord conclu entre deux joueurs lors de la phase de commerce. */
export interface CompletedTrade {
  a: PlayerId;
  b: PlayerId;
  aGave: TradeBundle;
  bGave: TradeBundle;
}

/** Piles de cartes de commerce (1 à 9). */
export interface TradeStacks {
  /** Numéro de pile (1-9) -> liste ordonnée de cartes (marchandises ou calamités). */
  stacks: Record<number, string[]>;
}
