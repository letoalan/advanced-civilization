# Fiche Wiki : Utilitaires du Commerce & Calamités (`tradeHelpers.ts`)

## 1. Fiche d'Identité
- **Fichier source** : [src/engine/tradeHelpers.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/engine/tradeHelpers.ts)
- **Rôle principal** : Manipulation mathématique et validation des paquets de cartes de commerce et calamités échangées (§28).
- **Domaine** : Moteur de jeu / Commerce & Négociation.
- **Taille** : 67 lignes (< 200 lignes).

## 2. Architecture & Dépendances
- **Imports clés** :
  - `calamityById` : Dictionnaire des calamités et de leurs propriétés.
  - `TradeBundle` : Structure d'un lot d'échange (cartes réelles vs déclarées).
- **Exports publics** :
  - `isCalamityCard(card)` : Prédicat déterminant si une carte est une calamité (`'calamity:<id>'`).
  - `calamityIdOf(card)` : Extraction de l'identifiant brut de la calamité.
  - `bundleSize(bundle)` : Décompte du nombre de cartes dans un lot.
  - `isGivable(card)` : Prédicat autorisant la cession (marchandise ou calamité négociable).
  - `isSubMultiset(sub, super)` : Vérification de sous-ensemble multiensemble.
  - `validateBundle(bundle, hand)` : Validation stricte des règles d'échange (§28.3).
  - `removeCards(hand, cards)` : Retrait de cartes d'une main.
  - `addCards(hand, cards)` : Ajout de cartes dans une main.
  - `transferCards(from, to, cards)` : Déplacement atomique entre deux mains.

## 3. Spécification de l'API Publique
### Fonctions
#### `validateBundle(bundle: TradeBundle, hand: Record<string, number>): void`
- **Rôle** : Vérifie :
  1. Que le lot contient au moins 3 cartes (§28.3).
  2. Que toutes les cartes réelles sont des marchandises ou des calamités négociables (les calamités non négociables ne peuvent jamais être échangées, §28.32).
  3. Que le joueur détient bien les cartes réelles qu'il propose.
  4. Que la déclaration publique annonce exactement 2 cartes sincères (§28.33).

## 4. Logique Interne & Règles Métier
- **Bluff et Déclaration** (§28.3) : Une offre commerciale comporte au moins 3 cartes. Deux cartes doivent être nommées sincèrement ; la troisième (et les suivantes) peuvent être gardées secrètes ou faire l'objet d'un bluff.
- **Calamités Non Échangeables** : Éruption Volcanique / Tremblement de terre, Famine, Guerre Civile et Inondation ont la propriété `tradable: false` dans `calamities.json` et sont rejetées par `isGivable`.

## 5. Exemple d'Utilisation
```typescript
import { validateBundle, transferCards } from './src/engine/tradeHelpers';

validateBundle(offer.give, playerA.hand);
transferCards(playerA.hand, playerB.hand, offer.give.actual);
```

## 6. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Ne jamais assouplir la contrainte des 3 cartes minimum ni autoriser l'échange d'une calamité non-négociable.
- **Tests associés** : `src/engine/trade.negotiation.test.ts`.
