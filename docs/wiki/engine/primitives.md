# Fiche Wiki : Primitives du Plateau (`primitives.ts`)

## 1. Fiche d'Identité
- **Fichier source** : [src/engine/primitives.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/engine/primitives.ts)
- **Rôle principal** : Fonctions de mutation bas niveau et requêtes spatiales fondamentales (pions, cités, détection côtière, unités neutres).
- **Domaine** : Moteur de jeu / State Management.
- **Taille** : 56 lignes (< 200 lignes).

## 2. Architecture & Dépendances
- **Imports clés** :
  - `areaById` : Catalogue statique des caractéristiques géographiques.
  - `neighbors`, `player` : Fonctions utilitaires du graphe de plateau.
  - `GameState`, `PlayerId` : Types de données du moteur.
- **Exports publics** :
  - `BARBARIAN`, `PIRATE` : Identifiants réservés aux factions neutres.
  - `clone<T>(x)` : Clonage profond d'état (`structuredClone`).
  - `has(p, id)` : Vérification de possession d'un progrès.
  - `isPlayer(s, id)`, `isNeutral(id)` : Prédicats d'identité.
  - `citiesOf(s, owner)`, `coastalCitiesOf(s, owner)` : Énumération des cités par possession.
  - `isCoastal(s, aid)`, `isCoastal2(s, aid)` : Détection d'adjacence maritime.
  - `areaName(aid)` : Résolution du nom lisible d'un territoire.
  - `setTokens(s, aid, owner, n)` : Mutation atomique du stock d'une zone.
  - `returnLostToStock(s, owner, n)` : Restitution de pions à la réserve nationale.
  - `removeTokensFromBoard(s, owner, pts)` : Retrait ordonné par plus petites zones.

## 3. Spécification de l'API Publique
### Fonctions
#### `setTokens(s: GameState, aid: string, owner: PlayerId, n: number): void`
- **Rôle** : Met à jour le nombre de pions du propriétaire `owner` dans la case `aid`. Si `n <= 0`, supprime la clé pour économiser la mémoire et assurer des objets propres.

#### `isCoastal(s: GameState, aid: string): boolean`
- **Rôle** : Renvoie `true` si le territoire `aid` possède au moins un voisin aquatique (`isWater = true`).

## 4. Logique Interne & Règles Métier
- **Factions Neutres** : Les Barbares (`__barbarian__`) et les Pirates (`__pirate__`) n'ont pas de réserve (`stock`) : leurs pions détruits sont retirés du jeu et ne sont jamais restitués (§30.211, §30.52).
- **Règle de conservation** : Chaque pion retiré d'une nation joueuse retourne immédiatement dans son stock disponible.

## 5. Exemple d'Utilisation
```typescript
import { isCoastal, setTokens } from './src/engine/primitives';

if (isCoastal(state, 'rome')) {
  setTokens(state, 'rome', 'rome', 3);
}
```

## 6. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Toujours utiliser `setTokens` plutôt que de modifier `s.areas[aid].tokens` directement, afin d'assurer la suppression des clés à valeur 0.
- **Tests associés** : `src/engine/ships.topology.test.ts`, `src/engine/combat.test.ts`.
