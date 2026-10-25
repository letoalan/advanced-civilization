# Fiche Wiki : Sous-système des Phases de Jeu (`src/engine/phases/`)

## 1. Fiche d'Identité
- **Dossier source** : `src/engine/phases/`
- **Rôle principal** : Implémentation des 11 phases du tour de jeu d'*Advanced Civilization* et boucle de normalisation automatique.
- **Domaine** : Moteur de jeu / Gestion de tour.
- **Taille globale** : 15 modules spécialisés, tous strictement < 200 lignes :
  - [taxation.ts](taxation.md) (84 lignes) : Prélèvement fiscal et calcul des révoltes (§19).
  - [expansion.ts](expansion.md) (85 lignes) : Croissance démographique et placement sous pénurie (§20).
  - [census.ts](census.md) (18 lignes) : Calcul du recensement et ordre du tour (§21).
  - [ships.ts](ships.md) (142 lignes) : Construction, démantèlement et entretien naval (§22).
  - [movement.ts](movement.md) (121 lignes) : Mouvements terrestres et maritimes (§23).
  - [conflict.ts](conflict.md) (158 lignes) et `conflictHelpers.ts` (93 lignes) : Attrition tour par tour et assauts de cités (§24-25).
  - [cities.ts](cities.md) (34 lignes) : Bâtiment de cités et Architecture (§25.1).
  - [surplus.ts](surplus.md) (96 lignes) : Retrait du surplus et soutien de cités (2 pions/cité) (§26).
  - [tradeAcquisition.ts](tradeAcquisition.md) (77 lignes) : Distribution des cartes de commerce et achat 9e pile (§27).
  - [tradeNegotiation.ts](tradeNegotiation.md) (114 lignes) : Négociation tour par tour des offres commerciales (§28).
  - [advances.ts](advances.md) (86 lignes) : Achat de cartes de progrès, crédits et prérequis (§31).
  - [ast.ts](ast.md) (120 lignes) : Défausse d'excédent (max 8) et avancée sur la table AST (§31-33).
  - [monotheism.ts](monotheism.md) (72 lignes) : Conversion religieuse d'une zone adjacente (§32.94).
  - [normalization.ts](normalization.md) (182 lignes) : Boucle d'avancement automatique et passes forcées.

## 2. Architecture & Cycle de Normalisation
L'architecture sépare les phases en deux catégories :
1. **Phases Automatiques (`AUTO_PHASES`)** : `census`, `conflict`, `removeSurplus`, `tradeAcquisition`, `astAdjustment`. Ces phases sont exécutées automatiquement et de manière déterministe par `runAutoPhase` sans action joueur (sauf si une décision de défausse, soutien ou pillage survient).
2. **Phases Interactives** : `taxation` (si Monnayage), `populationExpansion` (si stock limité), `shipConstruction`, `movement`, `cityConstruction`, `trade`, `calamity` (si choix), `acquireAdvances`.

## 3. Détection des Passes Forcées (`forcedSkip`)
Si l'option `s.autoSkip = true` est activée, l'algorithme `forcedSkip` vérifie si le joueur en cours n'a aucune action possible autre que `pass` (ex: aucune cité bâtissable, aucun progrès achetable, aucun navire constructible). Le moteur effectue alors automatiquement l'action `pass` et consigne la raison dans le journal, évitant aux joueurs des clics inutiles.

## 4. Tests Associés
- `src/engine/engine.phases.test.ts`
- `src/engine/engine.advances.test.ts`
- `src/engine/engine.expansion.test.ts`
- `src/engine/ships.build.test.ts`
- `src/engine/ships.movement.test.ts`
- `src/engine/combat.test.ts`
- `src/engine/surplus.test.ts`
- `src/engine/ast.test.ts`
- `src/engine/autoskip.test.ts`
