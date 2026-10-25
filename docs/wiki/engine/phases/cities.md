# Fiche Wiki : `cities.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/cities.ts`
- **Rôle principal** : Construction de cités (§25) : conversion de 6 pions sur un site de cité ou 12 pions en pleine nature, avec possibilité d'utiliser jusqu'à la moitié en trésor via le progrès *Architecture* (§25.3).
- **Domaine** : Moteur de jeu / Phase 7 — Construction de cités
- **Taille** : 34 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../../data/index.js` : Métadonnées de terrain (`areaById`).
  - `../helpers.js` : Détection de site de cité (`citySiteIn`).
  - `../logging.js` : Logs de fondation de cité.
  - `../primitives.js` : Primitives d'unités (`has`, `setTokens`).
  - `./surplus.js` : Suivi d'acquisition de cité au tour courant (`markCityAcquired`).
- **Exports publics** :
  - `applyBuildCity(s: GameState, actor: PlayerId, area: string, useTreasury = 0): void`

## 3. Logique Interne & Règles Avalon Hill (§25)
- **Coûts de fondation (§25.1)** :
  - Sur un site de cité naturel (`citySiteIn` = true) : 6 pions.
  - En pleine nature (n'importe quelle province terrestre sans site naturel) : 12 pions.
- **Règle d'Architecture (§25.3)** :
  - Le possesseur d'*Architecture* peut substituer jusqu'à la moitié du coût en pièces de son trésor (3 pions de trésor sur un site, 6 pions de trésor hors site).
  - Cette substitution ne peut être utilisée qu'une seule fois par tour (`builtWithTreasuryThisTurn = true`).
  - Elle est strictement interdite dans une province partagée où des pions adverses ou barbares sont présents (§25.3).

## 4. Tests Associés
- `src/engine/engine.phases.test.ts`.
