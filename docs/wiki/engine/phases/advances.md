# Fiche Wiki : `advances.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/advances.ts`
- **Rôle principal** : Acquisition des cartes de progrès de civilisation (§31) : calcul des crédits civiques, application des prérequis technologiques stricts, valorisation des séries de marchandises (avec bonus d'*Exploitation minière*), et paiement combiné cartes/trésor.
- **Domaine** : Moteur de jeu / Phase 11 — Achat de cartes de civilisation
- **Taille** : 86 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../../data/index.js` : Métadonnées des progrès (`advanceById`) et marchandises.
  - `../helpers.js` : Calcul des crédits croisés (`creditTowards`), valorisation exponentielle de séries (`handValue`), et disponibilité minière (`miningAvailable`).
  - `../logging.js` : Logs d'achat technologique.
  - `../primitives.js` : Primitives d'unités (`has`).
  - `../tradeHelpers.js` : Détection de calamité (`isCalamityCard`).
- **Exports publics** :
  - `spendableHand(p)` : Main de marchandises éligibles à la dépense (exclut calamités et céréales engagées contre la famine, §30.312).
  - `applyBuyAdvance(s, actor, advanceIds, spendCommodities, spendTreasury)` : Exécute l'achat d'un lot de progrès en une transaction atomique (§31).

## 3. Logique Interne & Règles Avalon Hill (§31)
- **Crédits technologiques (§31.53)** : Seuls les progrès acquis **lors d'un tour antérieur** procurent des crédits pour réduire le coût d'achat. Tout progrès acheté au cours du tour présent n'octroie aucun crédit immédiat.
- **Prérequis stricts (§31.62)** : Les prérequis technologiques (ex: Droit pour Démocratie) doivent avoir été acquis lors d'un tour précédent ; ils ne peuvent pas être achetés dans le même lot d'achat.
- **Valorisation des séries de marchandises (§27.2)** : La valeur d'une série de N cartes identiques croît selon une formule triangulaire ou quadratique (ex: 1 vin = 1, 2 vins = 4, 3 vins = 9, 4 vins = 16...). Avec *Exploitation minière*, la valeur des cartes de niveau minerai est augmentée.
- **Remise en pile (§31.59)** : Toutes les cartes de marchandises dépensées retournent sous leurs piles respectives (`s.trade.stacks[stack].unshift(cid)`). Le trésor dépensé retourne en stock de pions neutres.

## 4. Tests Associés
- `src/engine/engine.advances.test.ts`.
