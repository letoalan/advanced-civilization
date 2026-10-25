# Fiche Wiki : src/ui/cards/

## 1. Fiche d'Identité
- **Fichier source** : `src/ui/cards/` (`CardFrame.tsx`, `CommodityCard.tsx`, `CalamityCard.tsx`, `AdvanceCard.tsx`)
- **Rôle principal** : Système de rendu graphique des cartes du jeu (marchandises, calamités, progrès) avec support d'assets externes et repli CSS stylisé automatique.
- **Domaine** : Interface Utilisateur
- **Taille** : Chaque fichier fait < 130 lignes.

## 2. Architecture & Dépendances
- **Organisation interne** :
  - `CardFrame.tsx` : composant de base gérant l'encadrement, les badges, l'image `/assets/cards/...` et le fallback vectoriel CSS.
  - `CommodityCard.tsx` : carte de marchandise avec valeur unitaire, calcul de série ($n^2 \times v$) et pile.
  - `CalamityCard.tsx` : carte de calamité avec gravité et badge négociable/non-négociable.
  - `AdvanceCard.tsx` : carte de progrès technologique avec coût, domaine coloré et prérequis.
- **Dossier d'assets associé** : `public/assets/cards/` (`commodities/`, `calamities/`, `advances/`, `back/`).
- **Modules dépendants** : Vues de jeu (`TradeView`, `GoodsView`, `AdvancePicker`, `CalamityModal`).

## 3. Spécification de l'API Publique
```typescript
<CommodityCard id="iron" count={3} isSelected={false} onClick={() => {}} />
<CalamityCard id="epidemic" isSelected={true} onClick={() => {}} />
<AdvanceCard id="astronomy" owned={false} effectiveCost={60} onClick={() => {}} />
```

## 4. Logique Interne & Résilience
- **Zéro crash en l'absence d'images** : Grâce à l'événement `onError` du tag `<img>`, si le fichier d'asset `.webp` n'est pas encore présent sur disque, le composant bascule instantanément vers un rendu CSS texturé aux couleurs antiques sans faire planter React.
- **Nomenclature stricte** : Les 54 identifiants correspondent exactement aux IDs des fichiers JSON de `src/data/` ([commodities.json](../../../src/data/commodities.json), [calamities.json](../../../src/data/calamities.json), [advances.json](../../../src/data/advances.json)).
- **Traductions françaises** : Dictionnaires `COMMODITY_NAMES_FR`, `CALAMITY_NAMES_FR`, `ADVANCE_NAMES_FR`.

## 5. Guide de Maintenance & Extension
- Pour ajouter une illustration, déposer le fichier `.webp` sous `public/assets/cards/[categorie]/[id].webp`.
- Tests associés : `src/ui/cards/cards.test.ts`.
