# Fiche Wiki : `ships.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/ships.ts`
- **Rôle principal** : Gestion de la phase de construction navale (§22) : entretien des navires existants (1 pion par navire, trésor ou prélevé sur place), construction (coût 2, max 4 navires en jeu), sabordage et annulation d'action (`undo`).
- **Domaine** : Moteur de jeu / Phase 4 — Construction navale
- **Taille** : 142 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../../data/index.js` : Métadonnées des provinces (`areaById`).
  - `../helpers.js` : Joueur.
  - `../logging.js` : Logs d'entretien, construction et sabordage.
  - `../primitives.js` : Détection côtière (`isCoastal`) et gestion de pions (`setTokens`).
- **Exports publics** :
  - `shipCount(s, id)` : Nombre total de navires d'un joueur en jeu (plafond strict de 4, §22.4).
  - `setupShipMaintenance(s)` : Initialise les dettes d'entretien pour la phase.
  - `scrappableShips(s, id, area)` : Nombre de navires déjà présents au début du tour pouvant être sabordés ou entretenus.
  - `payShipMaintenance(s, id)` : Prélèvement final d'entretien (trésor d'abord, puis pions locaux, sinon destruction).
  - `applyBuildShips(s, actor, builds)` : Construction de navires (financement stock local, trésor ou partagé 1/1).
  - `applyScrapShip(s, actor, area)` : Sabordage volontaire pour éviter le coût d'entretien.
  - `applyMaintainShip(s, actor, area)` : Entretien manuel par pion prélevé dans la province.
  - `applyUndoShip(s, actor)` : Annulation du dernier coup naval (reprise du pion/trésor, remise en stock).

## 3. Logique Interne & Règles Avalon Hill (§22)
- **Entretien (§22.3)** : Chaque navire maintenu en jeu coûte 1 pion par tour. Ce pion provient en priorité du trésor du joueur. À défaut de trésor, le joueur peut sacrifier un pion de population dans la même province côtière. Si aucun paiement n'est possible, le navire est sabordé et retourne dans la réserve (`shipsAvailable`).
- **Construction (§22.2)** : Les navires ne peuvent être construits que dans une province côtière occupée par le joueur (pions ou cité). Le coût est de 2 pions (issus de la province ou du trésor). Un joueur ne peut posséder plus de 4 navires sur le plateau (§22.4).
- **Annulation (`undoShip`)** : Permet au joueur en cours de recalculer et ajuster ses choix de construction navale sans pénalité avant de passer son tour.

## 4. Tests Associés
- `src/engine/ships.build.test.ts`
- `src/engine/ships.undo.test.ts`.
