# Fiche Wiki : `census.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/census.ts`
- **Rôle principal** : Exécution de la phase de recensement (§19) : comptage de la population sur plateau, détermination de l'ordre de tour (`censusOrder`), et ordonnancement spécifique lié au progrès Militaire (§32.831).
- **Domaine** : Moteur de jeu / Phase 3 — Recensement
- **Taille** : 18 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../helpers.js` : Calcul de la population et de l'ordre de recensement (`censusOrder`, `populationCount`).
  - `../primitives.js` : Vérification du progrès civique (`has`).
- **Exports publics** :
  - `runCensus(s: GameState): void` : Enregistre le recensement de chaque joueur et configure l'ordre de jeu actif.
  - `hasMil(s, id): boolean` : Vérifie si un joueur possède le progrès Militaire.
  - `militaryLast(s, order): PlayerId[]` : Réordonne l'ordre de tour de sorte que les détenteurs de Militaire jouent en dernier (§32.831).

## 3. Logique Interne & Règles Métier
- **Recensement (§19)** : La valeur de recensement est la somme de tous les pions de population actuellement présents sur le plateau.
- **Ordre du tour (§19)** : Les joueurs jouent par ordre croissant de population (les plus petits jouent d'abord). En cas d'égalité, l'ordre AST départage.
- **Impact de Militaire (§32.831)** : Les civilisations possédant *Militaire* jouent après toutes celles qui ne l'ont pas, en conservant l'ordre relatif de recensement au sein de chaque groupe (grâce au tri stable de JavaScript).

## 4. Tests Associés
- `src/engine/engine.phases.test.ts`.
