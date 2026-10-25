# Modernisation cartographique et visuelle du plateau (Atlas Antique)

Ce document consigne la refonte visuelle et ergonomique de la carte du jeu, réalisée selon les spécifications strictes de [`carte.md`](../../carte.md) et validée par les points d'arrêt des lots 0 à 5 (Livraisons C, D, E, F).

---

## 1. Contexte et Décision Cartographique (Lots 0, 1 & 2)

L'audit (Lot 0 dans [`docs/carte-audit.md`](../carte-audit.md)) et l'export de référence (Lot 1 dans [`docs/board-geometry-reference.json`](../board-geometry-reference.json)) ont confirmé l'intégrité des 222 territoires jouables et 140 découpages côtiers dans l'espace natif `3800 × 1405`.

L'expérimentation de géoréférencement (Lot 2 dans [`docs/georeferencing-report.md`](../georeferencing-report.md)) a prouvé que la carte historique d'Avalon Hill (1991) est une projection ludique non euclidienne (Grèce et Égée agrandies pour la jouabilité, Ouest et mer Noire compressés). La déformation résiduelle (RMSE ≈ 478 km) a conduit à la **Décision C** de `carte.md` §7 :
> **Conserver le plateau en pixels natifs (3800 × 1405) et moderniser l'affichage avec le langage visuel d'un Atlas Antique Méditerranéen (style Arda).**

---

## 2. Direction Artistique — Atlas Antique Méditerranéen

### Palette et Couleurs
- **Mer profonde** : Dégradé bleu ardoise/marine (`#122c3a` à `#0b1d27`) avec calligraphie latine classique filigranée en fond (`MARE NOSTRUM`, `PONTUS EUXINUS`, `MARE TYRRHENUM`, `MARE AEGAEUM`, etc.).
- **Ondelettes bathymétriques côtières** : Ondes concentriques de relief bathymétrique bordant le littoral insulaire et continental, conférant l'aspect des cartes marines vénitiennes et des grands atlas du XVIe–XVIIIe siècle (Ortelius, Blaeu).
- **Terres** : Tons chauds de parchemin antique (`#ede3cd` / `#e4d8bf`), avec trait de côte net bronze foncé (`#3a2b1c`, largeur 1.4px) et frontières intérieures pointillées en encre sépia (`#7c6346`, largeur 1.1px).
- **Zones masquées (hors jeu)** : Fond ardoise foncé avec trame de hachures géométriques discrètes et contour pointillé doré.

### Bascule de Style (Livraison F)
Le composant conserve une conformité 100% avec l'affichage originel grâce à un sélecteur instantané dans la barre d'outils :
- **Atlas Antique** (par défaut, moderne, relief et parchemin)
- **Classique** (rendu Avalon Hill 1991 vectoriel sobre)
Le choix est mémorisé localement dans `localStorage.getItem('advciv-board-style')`.

---

## 3. Architecture Modulaire (`src/ui/components/board/`)

Chaque fichier respecte scrupuleusement la contrainte stricte de **taille < 200 lignes** :

| Fichier | Lignes | Rôle |
|---|---|---|
| [`boardTheme.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/boardTheme.ts) | 68 | Tokens de couleur, palettes et persistance `localStorage` |
| [`BoardAntiqueDefs.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardAntiqueDefs.tsx) | 55 | Filtres SVG, dégradés mer/parchemin, biseaux 3D et ombres portées |
| [`BoardAntiqueBackground.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardAntiqueBackground.tsx) | 125 | Ondes bathymétriques, dégradés parchemin, calligraphie latine |
| [`BoardClassicBackground.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardClassicBackground.tsx) | 52 | Rendu classique 1991 préservé sans modification |
| [`BoardBackground.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardBackground.tsx) | 73 | Aiguilleur de fond (Atlas / Classique / VASSAL) et masques de cadrage |
| [`BoardPieceIcons.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardPieceIcons.tsx) | 144 | Trières/galères grecques vectorielles, acropole/citadelle, médaillons de terrain |
| [`BoardClassicTokens.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardClassicTokens.tsx) | 57 | Rendu polygonal classique pour jetons et cités carrées/octogonales |
| [`BoardTokens.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardTokens.tsx) | 166 | Pions bois biseautés tactiles, citadelles, galères, médaillons et badges |
| [`BoardLabels.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardLabels.tsx) | 56 | Niveaux de détail (LOD) avec noms de provinces en serif noble et contour contrasté |
| [`useBoardNavigation.ts`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/useBoardNavigation.ts) | 134 | Zoom focal fluide à la molette, pan avec protection anti-clic et mémorisation |
| [`BoardControls.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/BoardControls.tsx) | 88 | Barre d'outils tactile : Zoom, 100%, Vue générale, Style, Terrains |
| [`Board.tsx`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/ui/components/board/Board.tsx) | 185 | Orchestrateur central de la carte (< 200 lignes) |

---

## 4. Modernisation des Pièces et Marqueurs Tactiles (§12)

- **Pions de population** : Cubes de bois biseautés avec reflet de surface (`atlas-token-bevel`), ombre portée (`atlas-piece-shadow`) et chiffre d'effectif bold avec contour noir à fort contraste. Pions barbares dotés d'une teinte sombre et contour rouge incisif.
- **Cités** : Silhouette vectorielle d'acropole antique avec fronton triangulaire, colonnade stylobate et assise en pierre à la couleur de la civilisation. Citadelles pirates reconnaissables à leurs remparts crénelés sombres et emblème menaçant.
- **Navires** : Véritable galère de guerre méditerranéenne (trière) avec éperon rostral en bronze, poupe relevée, voile carrée et rangée de rames, remplaçant le pictogramme emoji standard.
- **Médaillons de terrain** : Médaillons métalliques gravés pour les volcans (Théra, Campanie, etc.), cités et plaines inondables, avec bascule visuelle instantanée.

---

## 5. Navigation et Cadrage (§10 & §11)

- **Largeur de table (100%)** : Base de 2400px garantissant que la hauteur du plateau remplit le champ vertical de jeu sans barres vides et permet un centrage automatique fluide sur la nation active (`scrollBoardTo`).
- **Vue générale** : Bouton `📐 Vue générale` pour afficher l'intégralité du bassin méditerranéen d'un seul clic.
- **Zoom continu centré sur le curseur** : Utilisation de la molette pour zoomer précisément sur la zone pointée par la souris.
- **Protection anti-déclenchement au glissement** : Le déplacement à la souris (`drag-pan`) ne risque jamais de sélectionner involontairement un territoire lors du relâchement.
- **LOD (Level of Detail)** : Apparition progressive des noms de provinces historiques (`Rome`, `Athènes`, `Sparte`, `Thèbes`, `Babylone`, etc.) en typographie sérif noble avec contour halo lorsque le zoom le permet.

---

## 6. Vérifications et Non-Régression

- **TypeScript** : `npm run typecheck` — 0 erreur.
- **Vitest** : `npm test` — **305/305 tests passants** sur l'ensemble des 36 suites.
- **Modularité** : `npm run check:lines` — **221/221 fichiers dans `src/` sont strictement inférieurs à 200 lignes**.
- **Production Bundle** : `npm run build:ui` — compilation propre en 2.5s sans erreur.
- **Intégrité des règles** : Zéro modification de graphe d'adjacence, de logique maritime ou de règles Avalon Hill 1991.
