# Fiche Wiki : `ast.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/ast.ts`
- **Rôle principal** : Gestion de la fin de tour et de la piste chronologique A.S.T. (Archaeological Succession Table, §33-§35) : défausse de l'excédent de cartes (plafond de 8 cartes de marchandises, §31.71), vérification des prérequis d'époque (cités, nombre d'avances, diversité des groupes, valeur cumulée), recul en cas de perte de cités, détection de victoire et calcul du score final (§35.1).
- **Domaine** : Moteur de jeu / Phase 12 — Piste A.S.T. & Fin de tour
- **Taille** : 120 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../../data/index.js` : Pistes AST par civilisation (`astTrackFor`), époques (`epochs`), barème de victoire (`victoryScoring`).
  - `../helpers.js` : Calculs de points (`advancesFaceValue`, `cardGroupsHeld`, `cityCount`, `handValue`, `player`).
  - `../logging.js` : Traces d'avancée, de gel ou de recul AST.
  - `../tradeHelpers.js` : Prédicat de carte de calamité (`isCalamityCard`).
- **Exports publics** :
  - `commodityCardCount(hand)` : Nombre de cartes de marchandises en main.
  - `applyDiscard(s, holder, cards)` : Défausse des cartes de marchandises sous leurs piles respectives.
  - `suggestDiscard(s, holder, count)` : Suggestion heuristique défaussant les cartes de plus faible valeur unitaire.
  - `enforceHandLimit(s)` : Vérifie si un joueur possède plus de 8 cartes de marchandises et positionne `pendingDiscard`.
  - `epochAfterSpace(civId, space)` : Époque correspondant à une case donnée sur la piste spécifique de la nation.
  - `isFinishSpace(civId, space)` : Vérifie si la case d'arrivée de la piste est atteinte.
  - `canEnterEpoch(s, id, epoch, nextSpace)` : Valide les critères d'accès à l'époque (cités, cartes, groupes, valeur faciale).
  - `runAstAdjustment(s)` : Avance ou recule les marqueurs AST de chaque joueur et déclare la fin de partie (`s.finished = true`) si un joueur franchit la ligne d'arrivée.
  - `victoryScore(state, id)` : Formule de score officiel (§35.1) additionnant avances, marchandises, trésor, points de cases AST et cités.

## 3. Logique Interne & Règles Avalon Hill (§31.71, §33, §35)
- **Limite de main (§31.71)** : Après la phase d'achat des progrès, chaque joueur ne peut conserver que 8 cartes de marchandises. Les cartes excédentaires sont remises sous leurs piles commerciales.
- **Progression sur l'AST (§33)** :
  - Un joueur avance d'une case s'il remplit toutes les conditions de l'époque visée.
  - S'il ne remplit pas les conditions, son marqueur reste gelé sur sa case actuelle.
  - Si un joueur ne possède aucune cité sur le plateau (et n'est plus à l'Âge de Pierre), son marqueur recule d'une case (§33.3).
- **Condition de victoire (§35)** : Dès qu'au moins un joueur atteint la case d'arrivée de sa piste AST, la partie se termine immédiatement et le vainqueur est désigné au total des points de victoire.

## 4. Tests Associés
- `src/engine/ast.test.ts`.
