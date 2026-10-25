# Fiche Wiki : `calamityPicks.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/calamity/calamityPicks.ts`
- **Rôle principal** : Gestion des choix et validations pour les allocations secondaires de dégâts, les pertes d'unités (pions et cités avec soutien conservé) et les engagements de cartes céréales.
- **Domaine** : Moteur de jeu / Choix d'allocations et de pertes
- **Taille** : 179 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../../data/index.js` : Métadonnées des calamités et des provinces.
  - `../helpers.js` : Accès joueur.
  - `../logging.js` : Logs d'application des pertes.
  - `../primitives.js` : Primitives (`areaName`, `has`, `setTokens`, `removeTokensFromBoard`).
  - `../phases/surplus.js` : Limites de zones et réductions de cités (`areaLimitFor`, `reduceSpecificCity`).
  - `../phases/ast.js` : Score de victoire pour ordonnancement IA (`victoryScore`).
  - `./calamityCivilWar.js` : Inventaire d'unités (`unitInventory`).
- **Exports publics** :
  - `maxAllocatable(a)` : Plafond d'allocation distribuable selon les limites des victimes secondaires.
  - `suggestAllocation(s, a)` : Suggestion heuristique d'allocation secondaire (cible les leaders aux points).
  - `validateAllocation(a, allocation)` : Contrôle d'intégrité de la distribution de points (§29.64).
  - `secondaryLossesFromAllocation(s, a, allocation)` : Conversion en file d'attente `SecondaryLoss[]` avec ajustements civiques (ex: Médecine / Construction routière pour Épidémie).
  - `grainCards(p)` : Nombre de cartes céréales en main d'un joueur.
  - `removableTokens(n, epidemic)` : Pions retirables (l'Épidémie doit laisser 1 pion par zone, §30.612).
  - `maxUnitLoss(s, u)` : Total effectif de points de perte atteignable.
  - `suggestUnits(s, u)` : Suggestion de pions et cités à sacrifier.
  - `cityKeep(u, choice, aid)` / `cityLossWorth(u, keep)` : Calcul des pions laissés sur place lors de la réduction de cité.
  - `validateUnits(s, u, choice)` : Vérification de la validité du sacrifice d'unités selon les règles §29.63.
  - `applyChosenUnits(s, u, choice)` : Retrait effectif des pions/cités ou défection vers le bénéficiaire en guerre civile.
  - `suggestCities(s, holder, count)` / `reduceChosenCities(s, holder, areas)` : Suggestion et application de réductions de cités nommées.

## 3. Logique Interne & Règles Métier
- **Règle des sacrifices d'unités (§29.63)** : Une victime doit donner le nombre exact de points d'unités requis, sauf si elle ne possède pas assez d'unités sur le plateau (dans ce cas, elle donne tout ce qu'elle a).
- **Épidémie (§30.612)** : L'Épidémie détruit jusqu'à 16 points mais doit obligatoirement laisser au moins un pion dans chaque province touchée.
- **Poterie & Famine (§30.312)** : Permet d'engager des cartes Céréales pour épargner 4 points par carte.

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : En mode défection (`u.mode !== 'remove'`), les unités sont transférées directement au bénéficiaire et non au stock neutre, et les stocks des deux joueurs sont scrupuleusement ajustés.
- **Tests associés** : `src/engine/calamity.secondary.test.ts`.
