# Fiche Wiki : `applyCalamityAction.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/adapter/applyCalamityAction.ts`
- **Rôle principal** : Dispatcher dédié à la validation et à l'exécution de toutes les actions interactives de calamités et de soutien de cités (`allocateLoss`, `chooseCities`, `chooseUnits`, `civilWarSelect`, `civilWarKeep`, `pickAreas`).
- **Domaine** : Moteur de jeu / Actions de Calamités
- **Taille** : 165 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../calamity/calamityRunner.js` : Reprises de boucle (`finalizePick`, `resumeAfterChoice`, `runCalamity`, `startNextSecondary`).
  - `../calamity/calamityPicks.js` : Validation et application des sacrifices et allocations.
  - `../calamity/calamityCivilWar.js` : Validation et exécution des sélections de guerre civile (`annexFaction`, `militaryReduceFaction`, `validateCivilWarSelect`).
  - `../calamity/calamityNamedPicks.js` : Choix nommés de provinces (`applyPick`, `validatePick`).
  - `../phases/surplus.js` : Réductions de cités pour le soutien (`reduceForSupport`, `reduceSpecificCity`).
- **Exports publics** :
  - `tryApplyCalamityAction(s: GameState, action: Action, actor: PlayerId): boolean`

## 3. Logique Interne par Action
- `allocateLoss` : La victime primaire distribue les points de pertes secondaires aux rivaux éligibles. Crée la file `pendingSecondary` et déclenche `startNextSecondary(s)`.
- `chooseCities` : Réduction d'une ou plusieurs cités choisies (pour le soutien, une révolte d'esclaves ou une calamité primaire comme Superstition).
- `chooseUnits` : Sacrifice de pions et cités, avec possibilité d'engager des cartes de céréales si le joueur possède *Poterie* contre la Famine (§30.312).
- `civilWarSelect` / `civilWarKeep` : Constitution de la faction rebelle et choix final de la faction conservée par la victime.
- `pickAreas` : Sélection de provinces pour Trahison, Cité inondée, Piraterie, Éruption ou marche barbare, avec finalisation via `finalizePick`.

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Retourne `true` si l'action appartenait au domaine des calamités (même si aucune action supplémentaire n'est requise), `false` sinon.
- **Tests associés** : Tous les tests `src/engine/calamity.*.test.ts`.
