# Fiche Wiki : `conflict.ts` & `conflictHelpers.ts`

## 1. Fiche d'Identité
- **Fichiers source** : `src/engine/phases/conflict.ts` et `src/engine/phases/conflictHelpers.ts`
- **Rôle principal** : Résolution de la phase de conflit (§24) : attrition round-robin pion-contre-pion (avec avantage de *Travail des métaux*), assauts de cités (seuils modulés par *Ingénierie*), pillage de cartes commerciales (§24.51) et de trésor (§24.52).
- **Domaine** : Moteur de jeu / Phase 6 — Conflits
- **Taille** : `conflict.ts` (158 lignes) et `conflictHelpers.ts` (93 lignes), tous deux < 200 lignes.

## 2. Architecture & Dépendances
- **Imports clés** :
  - `digital-boardgame-framework` : RNG (`Rng`).
  - `../../data/index.js` : Métadonnées des provinces et civilisations.
  - `../helpers.js` : Accès joueur.
  - `../logging.js` : Traces et captures des messages de combats pour l'UI (`logMsgsSince`).
  - `../primitives.js` : Constantes d'unités (`BARBARIAN`, `PIRATE`, `returnLostToStock`).
  - `../tradeHelpers.js` : Détection et transfert de cartes de calamité pillées (`calamityIdOf`, `isCalamityCard`).
- **Exports publics** :
  - `resolveTokenCombat(s, aid, limit)` : Résout le combat d'attrition de pions jusqu'à la limite de coexistence ou survie unique.
  - `resolveCityAssault(s, aid, attacker, rng)` : Résout l'assaut d'une cité adverse ou cité pirate.
  - `resolveAreaCombat(s, aid, rng, combats?)` : Point d'entrée pour un combat dans une province unique (utilisé aussi par les Hordes Barbares).
  - `runConflict(s)` : Boucle globale exécutant tous les combats du tour et enregistrant `s.lastCombats`.
  - `forcesIn(s, aid)` / `combatModifiers(s, aid)` : Génération de l'état des forces et textes explicatifs pour l'interface.
  - `offerPillage(s, attacker, aid)` / `applyPillage(s, actor, count)` : Mécanisme de pillage de 0 à 3 pions de stock vers le trésor (§24.52).
  - `stealCardFromVictim(s, attacker, victim, rng)` : Vol aléatoire d'une carte commerciale en main du défenseur (§24.51).

## 3. Logique Interne & Règles Avalon Hill (§24)
- **Combat de pions (§24.2)** :
  - Les pertes sont retirées tour par tour, un pion à la fois par joueur.
  - Ordre de retrait : les civilisations sans *Travail des métaux* perdent leurs pions en premier (§24.24) ; au sein d'une même catégorie technologique, les civilisations les plus faibles en nombre de pions perdent d'abord (§24.21, §24.23).
  - Le combat s'arrête dès que la somme des pions restants ne dépasse plus la capacité de soutien de la province (`limit`), permettant la coexistence pacifiste. En présence d'une cité, `limit = 0` (aucune coexistence permise avec une cité ennemie).
- **Assaut de cité (§24.3, §24.35)** :
  - 7 pions attaquants nécessaires pour forcer une cité (remplacée par 6 pions défenseurs avant combat).
  - Si l'attaquant possède *Ingénierie* et pas le défenseur : 6 pions requis (remplacée par 5 pions).
  - Si le défenseur possède *Ingénierie* et pas l'attaquant : 8 pions requis (remplacée par 7 pions).
  - Si l'attaquant n'a pas le nombre de pions requis : échec total, tous les pions attaquants sont détruits et retournent au stock.
- **Pillage (§24.5)** :
  - L'attaquant victorieux vole 1 carte de commerce au hasard dans la main du défenseur (§24.51). Si c'est une calamité, l'attaquant en devient la nouvelle victime et le défenseur est noté comme "troqueur".
  - L'attaquant transfère jusqu'à 3 pions de son stock vers son trésor (§24.52).

## 4. Tests Associés
- `src/engine/combat.test.ts`.
