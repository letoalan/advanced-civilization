# Fiche Wiki : Module de Données Statiques (`src/data`)

## 1. Fiche d'Identité
- **Fichier source** : `src/data/index.ts`, `src/data/types.ts`, `src/data/descriptions.ts`, `src/data/shipGraph.ts`
- **Rôle principal** : Chargement typé, validation d'intégrité et exposition des tables statiques du jeu issues des données VASSAL et des règles officielles.
- **Domaine** : Données
- **Taille** : Moins de 120 lignes par fichier (strictement < 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `areas.json`, `adjacency.json`, `advances.json`, `commodities.json`, `calamities.json`, `civilizations.json`, `ast.json`, `playAreas.json` : référentiels statiques.
  - `ship-edges.json` : arêtes de transport naval.
- **Exports publics** :
  - `areas`, `adjacency`, `advances`, `commodities`, `calamities`, `civilizations`, `epochs`, `playAreas`, `astTrack`, `astTracksByCiv`, `victoryScoring`.
  - Lookups indexés : `areaById`, `advanceById`, `commodityById`, `calamityById`, `civById`.
  - Graphe naval : `shipNeighbors`, `TWO_COASTLINE_AREAS`.
  - Textes d'aide : `ADVANCE_EFFECTS`, `CALAMITY_DESC`.
  - Fonction de contrôle : `validateData()`.
- **Sous-modules** : [`cartography.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/docs/wiki/data/cartography.md) (modèle cartographique intermédiaire BoardGeometry, validation et export) et [`cartography-modernization.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/docs/wiki/cartography-modernization.md) (refonte visuelle Atlas Antique).
- **Modules dépendants** : L'ensemble du moteur (`src/engine/*`), l'IA heuristique (`src/ai/*`) et l'interface (`src/ui/*`).

## 3. Spécification de l'API Publique
### Types & Interfaces
Définies dans `src/data/types.ts` : `Area`, `Board`, `CropKey`, `PlayAreas`, `Advance`, `AdvanceGroup`, `Commodity`, `Calamity`, `Civilization`, `Epoch`, `AstTrack`, `ShipHop`.

### Fonctions Clés
#### `validateData(): string[]`
- **Rôle** : Contrôle au chargement que chaque référence croisée (adjacences, départs de civilisations, prérequis de progrès, zones de rognage §16) est valide et consistante.
- **Retour** : Tableau de chaînes décrivant les éventuelles anomalies (vide si valide).

#### `astTrackFor(civId: string): AstTrack`
- **Rôle** : Renvoie la piste A.S.T. d'une nation (override spécifique ou piste commune).

## 4. Logique Interne & Règles Métier
- **Graphe maritime** (`shipGraph.ts`) : Gère les zones à deux côtes distinctes (§23.57, Corinthe et Delphes).
- **Règles A.S.T.** (§17.4) : Les civilisations ont un rang A.S.T. unique de 0 à n-1 qui sert de bris d'égalité de recensement.

## 5. Exemple d'Utilisation
```typescript
import { areaById, validateData, ADVANCE_EFFECTS } from '../data/index.js';

const errors = validateData();
if (errors.length === 0) {
  const rome = areaById.get('rome');
  console.log(`Rome supporte ${rome?.sustains} jetons`);
}
```

## 6. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Ne pas modifier les identifiants clés sans synchroniser les fichiers JSON associés.
- **Tests associés** : `src/engine/engine.test.ts`, `src/engine/playarea.test.ts`.
