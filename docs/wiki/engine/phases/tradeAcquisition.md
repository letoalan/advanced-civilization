# Fiche Wiki : `tradeAcquisition.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/tradeAcquisition.ts`
- **Rôle principal** : Acquisition des cartes de commerce (§27) : distribution d'une carte par cité depuis les piles 1 à N (N ≤ 9), et fenêtre d'achat interactive de cartes dans la 9e pile pour 18 pièces de trésor (§27.51).
- **Domaine** : Moteur de jeu / Phase 9 — Acquisition des cartes commerciales
- **Taille** : 77 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../helpers.js` : Décompte des cités et accès joueur.
  - `../logging.js` : Logs de pioche et d'achat.
  - `../tradeHelpers.js` : Détection des cartes de calamité piochées.
- **Exports publics** :
  - `canBuyNinth(s, id)` : Vérifie si le joueur possède au moins 18 pièces de trésor et si la 9e pile contient des cartes.
  - `drawTradeCards(s, id)` : Pioche 1 carte par cité détenue (de la pile 1 jusqu'à la pile N). Enregistre les calamités piochées.
  - `runTradeAcquisition(s)` : Parcourt les joueurs en ordre croissant de cités. Met en pause le moteur si un joueur peut acheter dans la 9e pile.
  - `closeNinthWindow(s)` : Clôture la fenêtre d'achat du joueur courant et passe au joueur suivant.
  - `applyBuyTradeCard(s, actor, count)` : Exécute l'achat de `count` cartes de la pile 9 pour `18 * count` trésor (transféré en stock).

## 3. Logique Interne & Règles Avalon Hill (§27)
- **Distribution (§27.1)** : Chaque joueur tire une carte de la pile 1, puis de la pile 2, etc., jusqu'à hauteur de son nombre de cités (plafonné à 9). Une civilisation sans cité ne tire aucune carte.
- **Achat dans la 9e pile (§27.51)** : Immédiatement après avoir tiré ses cartes, et avant que le joueur suivant ne tire les siennes, un joueur disposant d'au moins 18 pièces dans son trésor peut acheter une ou plusieurs cartes de la pile 9 au tarif de 18 pièces par carte.

## 4. Tests Associés
- `src/engine/trade.ninthAndTurns.test.ts`.
