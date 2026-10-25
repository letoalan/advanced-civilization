# Fiche Wiki : `calamityGeography.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/calamity/calamityGeography.ts`
- **Rôle principal** : Définition des constantes géographiques des calamités (groupes de volcans, plaines inondables) et fonctions utilitaires de calcul et destruction d'unités/cités par zone.
- **Domaine** : Moteur de jeu / Géographie des Calamités
- **Taille** : 105 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../../data/index.js` : Métadonnées statiques des provinces (`areaById`).
  - `../helpers.js` : Fonctions d'état (`inPlay`, `neighbors`, `player`).
  - `../primitives.js` : Primitives de plateau (`isCoastal`, `isPlayer`, `setTokens`).
  - `../types.js` : Types `GameState`, `PlayerId`.
- **Exports publics** :
  - `VOLCANO_GROUPS` : Groupes de provinces associées aux volcans (Campania, Milazzo, Théra).
  - `FLOOD_PLAINS` : Liste des plaines inondables (Nil, Mésopotamie, Indus, Danube, etc.).
  - `floodPlainOf` : Map reliant chaque province inondable à son indice de plaine.
  - `floodRegions(s)` : Composantes connexes inondables actives en jeu (avec cache WeakMap).
  - `unitPointsInAreas(s, owner, areaIds)` : Calcul du total de points de présence (1 pion = 1 pt, 1 cité = 5 pts).
  - `removeUnitPointsInAreas(s, owner, areaIds, points, cityWorth)` : Retrait progressif de points (pions d'abord, puis cités).
  - `eliminateOneCoastalCity(s, owner)` : Suppression d'une cité côtière (pour la Piraterie).
  - `destroyAllInAreas(s, areaIds)` : Destruction totale de toute présence dans une liste de provinces (Éruption / Séisme).
  - `boardUnitPoints(s, id)` : Total de points d'unités d'un joueur sur tout le plateau.

## 3. Spécification de l'API Publique
### Fonctions principales
#### `floodRegions(s: GameState): string[][]`
Retourne les groupes de provinces inondables adjacentes actuellement en jeu. Mémorisé par `WeakMap` sur `s`.

#### `unitPointsInAreas(s: GameState, owner: PlayerId, areaIds: readonly string[]): number`
Totalise les points d'unités pour `owner` : `tokens + (city ? 5 : 0)`.

#### `removeUnitPointsInAreas(s: GameState, owner: PlayerId, areaIds: readonly string[], points: number, cityWorth = 5): number`
Déduit `points` d'unités en retirant d'abord les pions (remis en stock), puis en réduisant les cités (remises dans les cités disponibles). Retourne le nombre effectif de points retirés.

## 4. Logique Interne & Règles Métier
- **Règles Avalon Hill (§30.1 Éruption, §30.2 Séisme, §30.51 Inondation, §30.53 Piraterie)** :
  - Les cités valent 5 points de perte (§29.2).
  - L'inondation détruit jusqu'à 17 points d'unités dans la plaine inondable où la victime a la présence la plus forte.
  - La piraterie cible les cités côtières.

## 5. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Toujours remettre les pions dans le stock (`player.stock`) et les cités dans `player.citiesAvailable` pour respecter la conservation des composants physiques (§3).
- **Tests associés** : `src/engine/calamity.geography.test.ts`.
