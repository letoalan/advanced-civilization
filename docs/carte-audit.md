# Rapport d'Audit Cartographique (Lot 0)

> **Document de référence en lecture seule** établi dans le cadre de la modernisation cartographique du plateau (*carte.md*).

---

## 1. État du Dépôt & Environnement

- **Branche active** : `feat/local-standalone`
- **Dernier commit** : `ddc032a` (*Next*)
- **Commandes existantes vérifiées** :
  - `npm run typecheck` (`tsc -p tsconfig.json --noEmit`) : **0 erreur**.
  - `npm test` (`vitest run`) : **35 suites de tests, 299/299 tests passés avec succès**.
  - `npm run build:ui` (`vite build`) : **Compilé proprement dans `dist-ui` en 4.95s**.
  - `node scripts/check-line-counts.mjs` : **208/208 fichiers dans `src/` strictement < 200 lignes (100 %)**.

---

## 2. Inventaire Exhaustif des Données Cartographiques

Toutes les métriques ci-dessous ont été recalculées directement depuis les fichiers sources JSON actifs du dépôt (aucun chiffre hérité d'anciens commentaires) :

### A. `src/data/areas.json` (Graphe de jeu officiel)
- **Total des zones enregistrées** : **392 zones**
- **Cases jouables (visibles & cliquables)** : **222 zones** (`coastalWater === false` ou `undefined`)
- **Zones de routage naval / plomberie côtière** : **170 zones** (`coastalWater === true`). Ces zones servent exclusivement au moteur pour le déplacement maritime le long des côtes (§19), elles ne sont ni dessinées directement, ni cliquables.
- **Répartition par panneau d'origine** :
  - `main` (plateau central Avalon Hill) : 241 zones (132 jouables + 109 plomberie)
  - `western` (Extension Ouest / péninsule ibérique) : 52 zones (33 jouables + 19 plomberie)
  - `eastern` (Extension Est) : 99 zones (57 jouables + 42 plomberie)
- **Boîte englobante (*Bounding Box*)** :
  - $X \in [0.0\,;\,3800.3]$
  - $Y \in [0.0\,;\,1404.8]$
- **Nombre total de sommets vectoriels** : 5 616 sommets.
- **Caractéristiques de terrain des zones** :
  - Sites de cité imprimés (`isCitySite: true`) : **86**
  - Sites volcaniques (`isVolcanoSite: true`) : **5**
  - Plaines inondables (`isFloodplain: true`) : **29**

### B. `src/data/territories.json` (Polygones tracés des frontières)
- **Référentiel image** : largeur = 3800 px, hauteur = 1405 px
- **Nombre total de régions** : **222 régions** (correspondance exacte 1:1 avec les 222 zones jouables de `areas.json`).
- **Classification par catégorie d'usage** :
  - Côtière (`coastal`) : **136**
  - Terrestre (`land`) : **67**
  - Haute mer (`openSea`) : **13**
  - Non renseignée (`unset`) : **6**
- **Régions avec anneaux intérieurs (*holes*)** :
  - **1 région** : `arabia` (id 155, panneau `main`), possédant 1 anneau intérieur de 6 sommets (enclave désertique).

### C. `src/data/coastlines.json` (Découpage terre / mer des littoraux)
- **Total des territoires référencés** : **222**
- **Territoires scindés par leur littoral** : **140 territoires** (possédant au moins une sous-zone terre et une sous-zone mer).
- **Nombre total de sous-zones (*sub-areas*)** : **406**
  - Sous-zones terrestres : 223
  - Sous-zones maritimes côtières : 183

### D. `src/data/playAreas.json` (Masques de restriction §16)
- **Découpages officiels Avalon Hill reconnus** :
  - `panel1`, `panel12`, `panel4`, `panel34` (crops de panneaux physiques)
  - `eastOfDotted`, `westOfDotted` (séparations de la ligne en pointillés)
- **Polygones de masquage (*coverPolygons*)** : définis pour les 6 clés de découpage.

### E. Graphes logiques de déplacement & navigation
- `adjacency.json` : **392 nœuds** d'adjacence terre/mer.
- `water-graph.json` & `ship-edges.json` : routage maritime spécialisé des galères.

---

## 3. Composants Réellement Utilisés & Chaîne de Rendu

Les composants de rendu du plateau sont tous situés dans [`src/ui/components/board/`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/) :

1. [`Board.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/Board.tsx) :
   - Conteneur SVG principal, gestion du drag-to-pan à la souris, zoom cranté (1x, 1.5x, 2x, 3x), sticky controls et détection des clics sans faux drag.
2. [`BoardBackground.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardBackground.tsx) :
   - Rendu de la mer de fond (`fill="#14506a"`), puis tracé des polygones `ALL_SHAPES` et sous-zones de côtes `COAST_SUBS`. Application des masques sombres hors jeu (§16).
3. [`BoardTokens.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardTokens.tsx) :
   - Marqueurs vectoriels : `CityMarker` (octogone), `TokenMarker` (carré incliné 45°), `ShipMarker` (emoji ⛵), `CapacityBadge` (rectangle d'accueil `≤N`) et `TerrainGlyphs`.
4. [`anchors.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/anchors.ts) :
   - Calcul des points d'ancrage `anchors` via l'algorithme du pôle d'inaccessibilité (`poleOfInaccessibilityWithClearance`) issu de `digital-boardgame-framework`.
   - Définit le référentiel combiné unique `BOARD_VIEWBOX = { w: 3800, h: 1405 }`.

---

## 4. Analyse des Clés `localStorage` des Éditeurs Dev

Dans `src/data/territories.ts` et `src/data/coastlines.ts`, des éditeurs visuels de développement conservent d'éventuelles corrections locales :
- `LS_TERRITORIES` = `'advciv-dev-territories-edits-v3'`
- `LS_COASTS` = `'advciv-dev-coastlines-edits-v1'`

> **Point de contrôle** : Aucun script ni module de production ne doit écraser ces clés. Les fichiers statiques JSON de `src/data/` font actuellement autorité en l'absence d'export manuel formulé par l'utilisateur.

---

## 5. Questions Ouvertes & Décisions Préparatoires (Lot 1 & 2)

1. **Format du Modèle Intermédiaire `BoardGeometry` (Lot 1)** :
   - Définir une structure TypeScript formelle séparant strictement `board-pixels` ($X \in [0, 3800]$, $Y \in [0, 1405]$) et de futures coordonnées géographiques, en préservant le trou intérieur d'`arabia`.
2. **Choix de la projection pour le géoréférencement (Lot 2)** :
   - Le plateau d'Avalon Hill est une carte stylisée (projection non conforme d'inspiration conique ou cylindrique modifiée de la Méditerranée et du Proche-Orient).
   - L'alignement géographique nécessite au moins 12 à 16 points de contrôle homologues vérifiés (Gibraltar, pointe du Péloponnèse, delta du Nil, embouchure du Tigre/Euphrate, Bosphore, détroit de Messine, etc.).
