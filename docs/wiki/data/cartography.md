# Fiche Wiki : Modèle Cartographique Intermédiaire (`src/data/cartography`)

## 1. Fiche d'Identité
- **Fichier source** : `src/data/cartography/` (`types.ts`, `boardAdapter.ts`, `index.ts`)
- **Rôle principal** : Modèle géométrique intermédiaire non destructif unifiant les 222 cases jouables en coordonnées board-pixels combinées (3800 × 1405), leurs polygones fermés (avec gestion des trous), métadonnées de terrain et points d'ancrage calculés par pôle d'inaccessibilité.
- **Domaine** : Cartographie & Données Géométriques
- **Taille** : Moins de 100 lignes par fichier (strictement < 200 lignes).

## 2. Architecture & Dépendances
- **Imports clés** :
  - `src/data/index.ts` : identifiants d'aires de jeu et propriétés (§16, subsistance, cités, crues, volcans).
  - `src/data/territories.ts` : polygones vectoriels combinés (3800 × 1405) et anneaux intérieurs (*holes*).
  - `src/ui/anchors.ts` : ancrages `anchors` calculés par pôle d'inaccessibilité (`poleOfInaccessibilityWithClearance`).
- **Exports publics** :
  - `BoardGeometryModel`, `BoardCellFeature`, `BoardPixelGeometry`, `BoardAnchor` : types TypeScript formels.
  - `buildBoardGeometryModel()` : constructeur pur et non destructif du modèle.
  - `ensureClosedRing(pts)` : garantit la fermeture des anneaux (premier point = dernier point).
  - `isRingValid(ring)` : valide les coordonnées finies et la boîte englobante.
- **Modules dépendants** : Futurs prototypes de rendu moderne (MapLibre, Canvas ou SVG haute définition).

## 3. Spécification de l'API Publique
```typescript
export interface BoardCellFeature {
  areaId: string;
  name?: string;
  panel: string;
  category: string;
  isWater: boolean;
  isCitySite: boolean;
  isVolcanoSite: boolean;
  isFloodplain: boolean;
  sustains: number;
  geometry: {
    exterior: BoardPixelPoint[];
    holes?: BoardPixelPoint[][];
  };
  anchor: { x: number; y: number; r: number };
}

export function buildBoardGeometryModel(): BoardGeometryModel;
```

## 4. Invariants Métier & Sécurité
- **Zéro perte de données** : Aucun fichier JSON source n'est modifié ou réécrit.
- **Exclusion de la plomberie navale** : Les 170 zones `coastalWater` sont exclues du modèle de cellules dessinées (elles restent réservées au moteur de routage naval).
- **Gestion des enclaves / trous** : L'anneau intérieur d'`arabia` est préservé et validé.
- **Fermeture géométrique** : Tous les anneaux extérieurs et intérieurs sont strictement fermés.

## 5. Guide de Maintenance
- **Tests associés** : `src/data/cartography/boardAdapter.test.ts`.
- **Export de référence** : [`docs/board-geometry-reference.json`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/docs/board-geometry-reference.json).
