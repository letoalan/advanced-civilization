# Fiche Wiki : `normalization.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/normalization.ts`
- **Rôle principal** : Machine d'état centrale et boucle de convergence du tour de jeu : transitions de phases, exécution déterministe des phases automatiques (`runAutoPhase`), enchaînement du passage de tour (`applyPass`), détection des passes forcées sans coup utile (`forcedSkip`), et incrémentation de tour.
- **Domaine** : Moteur de jeu / Orchestration de tour
- **Taille** : 182 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../helpers.js` : Fonctions d'acteurs, ordres AST et recensement.
  - `../logging.js` : Logs de passage de tour et de fin de phase.
  - `../primitives.js` : Phases automatiques (`AUTO_PHASES`).
  - Toutes les fonctions d'entrée et d'exécution des phases (`runCensus`, `runConflict`, `runRemoveSurplus`, `runTradeAcquisition`, `runAstAdjustment`, `runCalamity`, `setupTaxation`, `setupPopulationExpansion`, `setupShipMaintenance`, `setupCalamityConversion`, etc.).
  - `../adapter/legalActions.js` : Vérification des actions légales pour `forcedSkip`.
- **Exports publics** :
  - `PHASE_NAME` : Dictionnaire des libellés lisibles de phases.
  - `nextPhase(phase)` : Détermine la phase suivante selon `PHASE_ORDER`.
  - `runAutoPhase(s)` : Déclenche l'exécution d'une phase automatique.
  - `enterPhase(s, phase)` : Initialise l'ordre d'action, réinitialise les compteurs et déclenche les configurations requises.
  - `applyPass(s, actor, skipped?)` : Traite l'action de passe (ou skip automatique) d'un joueur.
  - `closestAdvanceNote(p)` : Note explicative précisant le progrès le plus proche pour le journal.
  - `forcedSkip(s)` : Détecte si le joueur courant n'a aucune action possible hormis passer (ex: pas assez de pions pour bâtir une cité, aucun progrès abordable, moins de 3 cartes de commerce).
  - `normalize(s)` : Boucle de convergence principale exécutée après chaque action utilisateur pour avancer l'état jusqu'à la prochaine décision humaine ou fin de partie.

## 3. Logique de Normalisation & Cycle de Vie
```text
normalize(s)
 ├── Tant que l'état n'a pas convergé :
 │    ├── Si phase automatique (census, conflict, surplus, tradeAcquisition, astAdjustment) :
 │    │     ├── runAutoPhase(s)
 │    │     ├── Si pause requise (pillage, soutien, défausse, 9e carte) -> retour
 │    │     └── enterPhase(s, nextPhase) (avec rollover de tour si retour à taxation)
 │    ├── Si phase interactive :
 │    │     ├── Si tradePhaseEnded ou tous les joueurs ont agi : enterPhase(s, nextPhase)
 │    │     ├── Si forcedSkip(s) possible : applyPass(...) et continuer
 │    │     └── Sinon : STOP (attente de l'action du joueur courant)
 └── Fin
```

## 4. Tests Associés
- `src/engine/engine.phases.test.ts`
- `src/engine/autoskip.test.ts`.
