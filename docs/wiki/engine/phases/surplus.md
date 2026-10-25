# Fiche Wiki : `surplus.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/surplus.ts`
- **Rôle principal** : Retrait du surplus démographique (§26.1) et vérification du soutien des cités (2 pions sur plateau par cité, §26.31). Réduction interactive des cités non soutenues (les cités récemment bâties étant réduites en premier, §26.32).
- **Domaine** : Moteur de jeu / Phase 8 — Retrait du surplus & Soutien des cités
- **Taille** : 96 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../../data/index.js` : Métadonnées des provinces (`areaById`).
  - `../helpers.js` : Décomptes de cités et de population.
  - `../logging.js` : Logs de surplus et de réduction.
  - `../primitives.js` : Primitives d'unités (`areaName`, `has`, `isNeutral`, `returnLostToStock`, `setTokens`).
- **Exports publics** :
  - `areaLimitFor(s, aid, owner)` : Capacité d'accueil de la province (+1 avec *Agriculture* si la province n'est pas partagée, §32.221).
  - `markCityAcquired(s, owner, aid)` : Enregistre qu'une cité a été bâtie ou conquise ce tour (pour priorité de réduction, §26.32).
  - `reduceSpecificCity(s, owner, aid)` : Réduit une cité en pions de population jusqu'à concurrence de la capacité d'accueil de la province (§26.41).
  - `supportCandidates(s, id)` : Liste des cités éligibles à la réduction (cités nouvellement bâties d'abord).
  - `reduceForSupport(s, id, lock, ctx)` : Réduit les cités tant que `tokens < 2 * cities` ; met en pause si un choix joueur est nécessaire.
  - `checkCitySupport(s)` : Parcourt tous les joueurs pour vérifier la condition de soutien.
  - `suggestSupportReduce(s, sup)` : Heuristique suggérant de réduire la cité la moins coûteuse à rebâtir (site naturel à 6 pions plutôt que pleine nature à 12 pions).
  - `runRemoveSurplus(s)` : Phase automatique retirant tous les pions excédentaires au-delà de la capacité de soutien (ou tous les pions dans une province hébergeant une cité, §26.1).

## 3. Logique Interne & Règles Avalon Hill (§26)
- **Surplus (§26.1)** : Tout pion au-delà de la capacité de la province retourne en réserve. Une cité occupe à elle seule toute la province (tout pion supplémentaire retourne en stock).
- **Soutien des cités (§26.31)** : Chaque cité requiert au moins 2 pions de population du même joueur sur le reste du plateau.
- **Réduction (§26.32, §26.41)** : En cas de déficit, les cités bâties ou conquises lors de ce tour sont obligatoirement réduites en premier. Une cité réduite est remplacée immédiatement par le maximum de pions autorisés dans la province (qui comptent à leur tour pour soutenir les autres cités).

## 4. Tests Associés
- `src/engine/surplus.test.ts`.
