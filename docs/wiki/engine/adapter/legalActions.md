# Fiche Wiki : `legalActions.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/adapter/legalActions.ts`
- **Rôle principal** : Énumération exhaustive des actions légales pour un joueur à un instant donné selon la phase de jeu et les interruptions actives.
- **Domaine** : Moteur de jeu / Énumération d'actions
- **Taille** : 180 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../../data/index.js` : Métadonnées des progrès et provinces.
  - `../helpers.js` : Fonctions d'éligibilité (`creditTowards`, `handValue`, `navalDestinations`, `player`).
  - `../primitives.js` : Primitives d'unités (`has`, `isCoastal`).
  - `./currentActor.js` : Vérification du joueur attendu.
  - `../phases/ships.js` : Calculs de navires (`scrappableShips`, `shipCount`).
  - `../phases/advances.js` : Main commerciale disponible pour achat (`spendableHand`).
  - `../phases/monotheism.js` : Cibles de conversion (`monotheismTargets`).
  - `../calamity/calamityPicks.js` / `calamityCivilWar.js` / `calamityNamedPicks.js` : Suggestions de choix de pertes et de guerre civile.
- **Exports publics** :
  - `legalActions(state: GameState, actor: PlayerId): Action[]`

## 3. Logique Interne par Phase
- **Interruptions prioritaires** :
  - `pendingStart` : Emplacements initiaux autorisés (`placeStart`).
  - `ninthStack` : Achat de la 9e carte avec le trésor (`buyTradeCard` ou `pass`).
  - `pendingDiscard` / `pendingPillage` / `pendingSupport` : Choix de défausse, pillage ou réduction de cité.
  - `pendingPick` : Sélection nommée de provinces (`pickAreas`).
- **Phases de jeu courantes** :
  - `taxation` : Choix du taux d'imposition (1, 2 ou 3) (`setTaxRate`).
  - `populationExpansion` : Placements de pions (`placeTokens`, `resetPlacement`).
  - `shipConstruction` : Construction de navires (paiement stock, trésor ou combiné), entretien, sabordage (`buildShips`, `scrapShip`, `maintainShip`, `undoShip`).
  - `movement` : Mouvements terrestres simples, routiers (avec *Construction routière*), et voyages maritimes selon portée et *Astronomie* (`move`).
  - `cityConstruction` : Fondations de cités avec 6 ou 12 pions (et trésor avec *Architecture*) (`buildCity`).
  - `acquireAdvances` : Achat de cartes de progrès selon les crédits et cartes de marchandises disponibles (`buyAdvance`).
  - `calamity` : Choix de sacrifices de cités, unités, grains (*Poterie*), allocations, guerre civile ou conversion (*Monothéisme*).
  - `trade` : Attente ou passage (`tradeWait`).

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Toujours retourner un tableau vide `[]` si `currentActor(state) !== actor`.
- **Tests associés** : `src/engine/engine.phases.test.ts`.
