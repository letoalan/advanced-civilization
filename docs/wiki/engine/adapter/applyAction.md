# Fiche Wiki : `applyAction.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/adapter/applyAction.ts`
- **Rôle principal** : Dispatcher central et application atomique des actions de jeu avec clonage de protection et normalisation d'état post-action.
- **Domaine** : Moteur de jeu / Dispatcher d'actions
- **Taille** : 189 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../helpers.js` : Joueur.
  - `../logging.js` : Logs d'actions.
  - `../primitives.js` : Clonage profond d'état (`clone`), application de pions.
  - `../phases/` : Fonctions d'application spécifiques (`collectTax`, `applyPlaceTokens`, `applyMovement`, `applyBuildShips`, `applyBuildCity`, `applyBuyAdvance`, `applyPillage`, `applyConvert`, `applyDiscard`).
  - `../phases/normalization.js` : Validation de fin de tour et passage de phase (`applyPass`, `normalize`).
  - `./currentActor.js` : Validation du tour du joueur appelant.
  - `./applyCalamityAction.js` : Dispatcher spécialisé des actions de calamité (`tryApplyCalamityAction`).
- **Exports publics** :
  - `applyAction(state: GameState, action: Action, actor: PlayerId): GameState`

## 3. Spécification de l'API Publique
#### `applyAction(state: GameState, action: Action, actor: PlayerId): GameState`
1. Clone profondément l'état passé en argument (immutabilité de l'entrée).
2. Valide que `currentActor(s) === actor`.
3. Tente d'abord la résolution via `tryApplyCalamityAction(s, action, actor)`. Si géré, déclenche `normalize(s)` et retourne.
4. Sinon, route selon `action.type` vers le gestionnaire de phase dédié (`taxation`, `populationExpansion`, `shipConstruction`, `movement`, `cityConstruction`, `acquireAdvances`, `trade`, etc.).
5. Déclenche `normalize(s)` en cas de passe ou de fin d'action de phase pour enclencher les transitions automatiques.

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Toujours exécuter `normalize(s)` en sortie pour garantir que les phases automatiques (recensement, combats résolus, etc.) soient résolues sans attendre un coup joueur inutile.
- **Tests associés** : `src/engine/engine.phases.test.ts`.
