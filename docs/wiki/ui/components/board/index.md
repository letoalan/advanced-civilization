# Fiche Wiki : Composants du Plateau de Jeu (`ui/components/board`)

## 1. Fiche d'Identité
- **Fichiers sources** :
  - `src/ui/components/board/Board.tsx` (129 lignes)
  - `src/ui/components/board/BoardBackground.tsx` (90 lignes)
  - `src/ui/components/board/BoardTokens.tsx` (115 lignes)
  - `src/ui/components/board/AreaTooltip.tsx` (85 lignes)
  - `src/ui/components/board/Minimap.tsx` (47 lignes)
  - `src/ui/components/board/BoardPicker.tsx` (47 lignes)
  - `src/ui/components/board/MapArtBanner.tsx` (78 lignes)
  - `src/ui/components/board/AreaPeekContext.tsx` (34 lignes)
  - `src/ui/components/board/boardHelpers.ts` (56 lignes)
  - `src/ui/components/board/index.ts` (9 lignes)
- **Rôle principal** : Rendu SVG complet et interactif du plateau de jeu de Civilization (zones géographiques, côtes, voiles de recadrage §16, pions de population carrés, cités octogonales, navires, infobulles, minimap et sélecteur de plateau).
- **Domaine** : UI / Affichage cartographique
- **Taille** : 100 % des fichiers sous le seuil strict de 150 lignes.

## 2. Architecture & Dépendances
- **Imports clés** :
  - `anchors.js` : Coordonnées SVG des territoires (`anchors`), boîte englobante (`BOARD_VIEWBOX`), polygones géométriques (`ALL_SHAPES`, `COAST_SUBS`).
  - `engine/helpers.js` : Calcul des zones hors-jeu (`outOfPlay(state)`).
  - `engine/boards.js` : Configurations et préréglages officiels selon le nombre de joueurs (`boardPresets`).
- **Exports publics** :
  - `Board` : Composant SVG principal avec zoom, recadrage et gestion des clics interactifs.
  - `Minimap` : Vue miniature cliquable pour recentrage rapide de la caméra.
  - `BoardPicker` : Sélecteur de plateau conforme aux règles §16.
  - `AreaPeekProvider` & `useAreaPeek` : Contexte de surbrillance rose au survol des boutons des panneaux latéraux.
  - `scrollBoardTo` & `nationFocusArea` : Utilitaires de défilement fluide et de centrage sur les positions stratégiques.

## 3. Logique Interne & Spécifications Métier
- **Distinction visuelle des unités** : Les pions de population sont tracés sous forme de cubes/carrés (`tokenPoints`), les cités sous forme d'octogones fortifiés (`cityPoints`), et les navires avec le glyphe ⛵ (§17.1, §21, §22).
- **Recadrage du plateau selon les joueurs (§16)** : Les panneaux non utilisés (extension Ouest, extension Est) sont occultés par des rectangles sombres, et les zones découpées du plateau central (`crops`) reçoivent le masque vectoriel officiel Avalon Hill (`cropCovers`).
- **Capacité de subsistance** : Badge `≤N` affiché sur les territoires occupés pour rappeler la limite démographique locale sans survoler (§20.1).

## 4. Exemple d'Utilisation
```tsx
import { Board, Minimap, AreaPeekProvider } from './components/board/index.js';

function GameScreen({ state }: { state: GameState }) {
  return (
    <AreaPeekProvider>
      <Board state={state} selected={null} onSelect={console.log} highlight={new Set()} />
    </AreaPeekProvider>
  );
}
```
