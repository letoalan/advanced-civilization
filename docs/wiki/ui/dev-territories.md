# Fiche Wiki : Éditeur Développeur de Territoires (`src/ui/dev/territories`)

## 1. Fiche d'Identité
- **Fichier source** : `src/ui/dev/TerritoriesTab.tsx` et sous-modules dans `src/ui/dev/territories/` (`types.ts`, `constants.ts`, `geometryBasic.ts`, `geometryRaster.ts`, `geometry.ts`, `TerritorySidebar.tsx`, `TerritoryCanvas.tsx`, `useTerritoryOperations.ts`)
- **Rôle principal** : Outil de retouche géométrique des polygones de la carte (catégorisation mer/côte/terre, partitionnement planaire sans chevauchement, découpe et fusion).
- **Domaine** : Outils de développement (Dev Tools)
- **Taille** : Moins de 190 lignes par fichier (strictement < 200 lignes)

## 2. Architecture & Dépendances
- **Sous-modules** :
  - `geometryBasic.ts` : algorithmes purs de géométrie 2D (point-in-poly, distance au segment, simplification Douglas-Peucker).
  - `geometryRaster.ts` : tracé de contours par masque binaire, calcul d'îles/trous et partitionnement sans recouvrement (`enforcePartition`).
  - `TerritorySidebar.tsx` : liste filtrable des cellules avec statut d'association aux zones du jeu.
  - `TerritoryCanvas.tsx` : canevas vectoriel SVG interactif avec poignées de sommets et centroïdes.
  - `useTerritoryOperations.ts` : hook d'opérations de mutation (découpe, dessin, renommage).
- **Modules dépendants** : `src/ui/dev/DevApp.tsx`.

## 3. Spécification de l'API Publique
### Composant
#### `<TerritoriesTab />`
- **Rôle** : Interface plein écran dédiée à l'ajustement des frontières du plateau et à l'export vers `territories.json`.

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Conserver la résolution raster (`RASTER_MAX = 700`) pour éviter les lenteurs de calcul géométrique sur navigateur.
