# Fiche Wiki : `monotheism.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/monotheism.ts`
- **Rôle principal** : Résolution de la conversion religieuse du Monothéisme (§32.94) : détection des cibles valides adjacentes, vérification de l'immunité (*Théologie* ou *Monothéisme* adverse), remplacement direct des unités et cités sur le plateau en fin de phase de calamité.
- **Domaine** : Moteur de jeu / Progrès civiques — Monothéisme
- **Taille** : 72 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../helpers.js` : Voisins terrestres et accès joueur.
  - `../logging.js` : Logs de conversion.
  - `../primitives.js` : Primitives de plateau (`areaName`, `has`, `isPlayer`, `setTokens`).
  - `./surplus.js` : Marquage de cité acquise ce tour (`markCityAcquired`).
- **Exports publics** :
  - `conversionImmune(s, id)` : Vérifie si un joueur est immunisé à la conversion (détient *Monothéisme* ou *Théologie*, §32.952).
  - `soleOccupant(s, aid)` : Retourne le joueur occupant unique d'une province (aucun mélange ni unité neutre).
  - `monotheismTargets(s, holder)` : Liste des provinces éligibles à la conversion (voisine par voie terrestre, cible non immunisée, stock de pions et cités suffisant).
  - `applyConvert(s, holder, aid)` : Convertit une province en remplaçant les pions et/ou la cité ennemie par ceux du possesseur de Monothéisme.
  - `setupCalamityConversion(s)` : En fin de phase de calamités, n'active que les joueurs détenant Monothéisme et ayant des cibles légales à convertir.

## 3. Logique Interne & Règles Avalon Hill (§32.94)
- **Condition de conversion (§32.941)** : Une fois par tour, à la fin de la phase de calamités, le joueur peut convertir une province adjacente par voie terrestre occupée par un rival.
- **Immunité (§32.952)** : Tout rival possédant *Monothéisme* ou *Théologie* est totalement immunisé contre cette conversion.
- **Substitution (§32.941)** : Les unités de la victime retournent dans son stock, et sont remplacées à l'identique par les unités du convertisseur (si son stock de pions et cités disponibles le permet).

## 4. Tests Associés
- `src/engine/engine.phases.test.ts`.
