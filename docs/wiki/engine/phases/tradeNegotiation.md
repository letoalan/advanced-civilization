# Fiche Wiki : `tradeNegotiation.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/tradeNegotiation.ts`
- **Rôle principal** : Gestion des échanges commerciaux (§28) : dépôt d'offres publiques (`postOffer`), contre-propositions (`respondOffer`), acceptation bilatérale (`acceptResponse`), retrait (`withdrawOffer`), avec respect strict des règles de bluff officiel (taille exacte et ≥ 2 cartes annoncées véridiques, §28.3).
- **Domaine** : Moteur de jeu / Phase 10 — Échanges commerciaux
- **Taille** : 114 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../../data/index.js` : Métadonnées des calamités et marchandises.
  - `../helpers.js` : Joueur.
  - `../logging.js` : Logs d'offres, réponses et échanges conclus.
  - `../tradeHelpers.js` : Validation de lot (`validateBundle`), transfert bilatéral de cartes (`transferCards`), sous-multi-ensembles (`isSubMultiset`).
- **Exports publics** :
  - `tradePhaseEnded(s)` : Vérifie si la phase est terminée (tous les joueurs ont passé consécutivement ou plafond de négociations atteint).
  - `tradeActor(s)` : Identifie le joueur au tour de négocier en round-robin.
  - `tradableCards(s, id)` : Nombre de cartes échangeables en main (marchandises + calamités échangeables).
  - `applyPostOffer(s, actor, a)` : Crée ou remplace l'offre ouverte du joueur.
  - `applyRespondOffer(s, actor, a)` : Dépose une contre-proposition sur l'offre d'un tiers.
  - `applyAcceptResponse(s, actor, a)` : Valide l'échange, transfère les cartes secrètes des deux mains et nettoie les offres obsolètes.
  - `applyWithdrawOffer(s, actor)` : Retire une offre en cours.

## 3. Logique Interne & Règles Avalon Hill (§28)
- **Règles d'échange (§28.2 - §28.3)** :
  - Un lot d'échange doit comporter au moins 3 cartes.
  - Le joueur doit annoncer publiquement le nombre exact de cartes données et 1 ou 2 marchandises précises.
  - Les 2 marchandises déclarées doivent être réellement présentes dans le lot (règle anti-triche).
  - Les autres cartes du lot peuvent être n'importe quelle autre marchandise ou une carte de calamité échangeable (bluff légal, §28.31).
- **Exécution (§28.2)** : Les deux joueurs échangent simultanément l'intégralité de leur lot réel (`actual`). Si une carte de calamité est transmise, le receveur en devient la nouvelle victime et l'émetteur est noté pour les effets secondaires éventuels.

## 4. Tests Associés
- `src/engine/trade.negotiation.test.ts`
- `src/ai/heuristic.trade.test.ts`.
