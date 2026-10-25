# Fiche Wiki : `calamityBarbarians.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/calamity/calamityBarbarians.ts`
- **Rôle principal** : Simulation intégrale des Hordes Barbares (§30.52) : sélection de la zone de débarquement la plus destructrice, combat immédiat, puis marche du surplus de barbares de province en province selon les règles de limitation de population.
- **Domaine** : Moteur de jeu / Hordes Barbares
- **Taille** : 112 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `digital-boardgame-framework` : RNG sérialisable (`Rng`).
  - `../../data/index.js` : Métadonnées géographiques et de civilisation (`areaById`, `civById`, `shipNeighbors`).
  - `../helpers.js` : Voisins terrestres et état du joueur (`inPlay`, `landNeighbors`, `player`).
  - `../logging.js` : Traces détaillées du débarquement et de la marche barbare.
  - `../primitives.js` : Constante `BARBARIAN` et noms de provinces (`areaName`).
  - `../phases/conflict.js` : Résolution des combats locaux (`resolveAreaCombat`).
- **Exports publics** :
  - `damageTo(s, aid, primary)` : Dégâts potentiels infligés à la victime dans une province (pions + 5 * cité).
  - `barbarianChooser(s, primary)` : Joueur chargé de départager les choix en cas d'égalité (le joueur ayant troqué la calamité, ou le joueur avec le plus de pions en stock).
  - `barbarianNeighbors(s, aid)` : Provinces accessibles par voie terrestre ou traversée navale autorisée aux barbares.
  - `marchBarbarianStep(s, here, next, surplus, limit, rng)` : Déplacement d'un groupe barbare et résolution du combat.
  - `stepsTowardVictim(s, here, primary)` : Recherche du chemin le plus court vers les unités de la victime par parcours en largeur (BFS).
  - `marchBarbarians(s, primary, start, visited, rng, before, overviewBefore)` : Boucle de marche automatique des barbares tant qu'un surplus subsiste.
  - `startBarbarians(s, primary, before, overviewBefore, rng)` : Point d'entrée de la calamité des Hordes Barbares.

## 3. Logique Interne & Règles Métier
1. **Immunité Crétoise (§30.527)** : La Crète est strictement immunisée contre les Hordes Barbares.
2. **Débarquement (§30.521)** : 15 pions neutres (`BARBARIAN`) apparaissent dans une province de départ de la victime infligeant un maximum de pertes. En cas d'égalité, `barbarianChooser` tranche.
3. **Combat (§30.522)** : Chaque entrée barbare résout immédiatement un combat dans la province (§20).
4. **Marche du surplus (§30.523)** :
   - Si le nombre de barbares survivants dépasse la capacité de population (`area.sustains`), le surplus marche vers la province adjacente non encore visitée infligeant le maximum de pertes à la victime.
   - Si aucune province adjacente n'a d'unités de la victime, ils avancent vers la province la plus proche en contenant via `stepsTowardVictim`.
   - Les pions jusqu'à la capacité de soutien restent dans la province d'origine.

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Conserver la boucle de marche sous garde (`guard < 200`) et sérialiser l'état RNG (`s.rngState = rng.serialize()`) en cas de mise en pause pour un choix joueur (`pendingPick`).
- **Tests associés** : `src/engine/calamity.barbarians.test.ts`.
