# Fiche Wiki : `calamityCivilWar.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/calamity/calamityCivilWar.ts`
- **Rôle principal** : Résolution de la Guerre Civile (§30.41) : désignation du bénéficiaire, constitution des factions par la victime et le bénéficiaire, choix de faction et annexion sur le plateau.
- **Domaine** : Moteur de jeu / Guerre Civile
- **Taille** : 160 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../helpers.js` : Calculs de réserve et validation de points (`civilWarSelectionOk`, `player`).
  - `../logging.js` : Logs d'événements.
  - `../primitives.js` : Noms de zones et application de pions (`areaName`, `has`, `setTokens`).
  - `../phases/surplus.js` : Enregistrement de conquête de cité (`markCityAcquired`).
  - `./calamityGeography.js` : Calcul de la présence globale (`boardUnitPoints`).
- **Exports publics** :
  - `cwReserves(s, id)` : Calcul des réserves en stock et cités d'un joueur.
  - `civilWarBeneficiary(s, victim)` : Désignation du joueur éligible ayant le plus de réserves (§30.411).
  - `unitSetPoints(set)` : Calcul des points d'un sous-ensemble d'unités (pions + 5 * cités).
  - `unitInventory(s, holder, areas?)` : Inventaire complet des unités et cités d'un joueur.
  - `pickUnits(inv, points, valuable)` : Algorithme glouton de sélection optimale d'unités.
  - `subtractSet(inv, set)` : Soustraction d'unités pour déterminer les unités restantes.
  - `militaryReduceFaction(s, victim, set, points)` : Réduction de faction imposée par le progrès Militaire.
  - `annexFaction(s, victim, beneficiary, set)` : Conversion et prise de contrôle des unités de la faction rebelle par le bénéficiaire (ou d'autres joueurs en cas d'épuisement de stock).
  - `startCivilWar(s, victim, before, overviewBefore)` : Initialisation de la machine d'état de guerre civile (`pendingCivilWar`).
  - `suggestCivilWarSelect(s)` : Proposition automatique de sélection d'unités (pour l'IA ou suggestion UI).
  - `civilWarActor(cw)` : Joueur actuellement appelé à agir (victime ou bénéficiaire).
  - `validateCivilWarSelect(s, cw, sel, target)` : Vérification de conformité des points sélectionnés.

## 3. Logique Interne & Règles Métier
1. **Désignation du bénéficiaire (§30.411)** : Le joueur autre que la victime ayant le plus de réserves combinées (stock de pions + 5 * cités disponibles). Si la victime a au moins autant de réserves que quiconque, la guerre civile fait long feu (*fizzles*).
2. **Effets des progrès** :
   - *Philosophie* : Inverse l'ordre (le bénéficiaire sélectionne en premier une faction de 15 points, la victime ne sélectionne rien) (§30.415).
   - *Musique / Drame / Démocratie* : Augmentent les points de la faction 1 (respectivement +5, +5, +10).
   - *Militaire* : Réduit de 5 points la faction du bénéficiaire.
3. **Annexion & Conservation (§3)** : Les pions et cités de la faction rebelle sont retirés pour la victime et replacés par ceux du bénéficiaire (s'il en a en stock/cités disponibles, sinon attribués aux autres joueurs par ordre décroissant de réserves).

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Toujours utiliser `civilWarSelectionOk` pour valider que le total de points atteint exactement la cible ou s'en approche au plus près lorsque le compte de cités rend impossible l'exactitude stricte.
- **Tests associés** : `src/engine/calamity.civilwar.test.ts`.
