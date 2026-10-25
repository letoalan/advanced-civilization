# Fiche Wiki : Vues Secondaires de l'Interface (`ui/components/views`)

## 1. Fiche d'Identité
- **Fichiers sources** : 
  - `src/ui/components/views/LogView.tsx` (55 lignes)
  - `src/ui/components/views/AstView.tsx` (90 lignes)
  - `src/ui/components/views/CensusView.tsx` (90 lignes)
  - `src/ui/components/views/ToolsView.tsx` (81 lignes)
  - `src/ui/components/views/GoodsView.tsx` (50 lignes)
  - `src/ui/components/views/index.ts` (6 lignes)
- **Rôle principal** : Composants de consultation et de diagnostic de l'état de jeu (journal d'événements, table AST, démographie et cités, arbre des technologies/progrès, inventaire des marchandises et calamités).
- **Domaine** : UI / Consultation de jeu
- **Taille** : Tous les sous-fichiers sont strictement inférieurs à 100 lignes.

## 2. Architecture & Dépendances
- **Imports clés** :
  - `CommodityCard`, `CalamityCard` : Cartes visuelles avec fallback vectoriel pour le panneau des marchandises.
  - `engine/helpers.js` : Calculs de scores, de valeurs faciales de progrès (`advancesFaceValue`), calculs d'imposition et de limites de population.
  - `data/index.js` : Définitions des civilisations, des progrès, des pistes AST et des textes de règles Avalon Hill.
- **Exports publics** :
  - `LogView` : Visualiseur du journal chronologique avec filtres et coloration par joueur/calamité.
  - `AstView` : Tableau de la piste AST (Archaeological Succession Table) avec époques et critères d'avancement (§33).
  - `CensusView` : Vue récapitulative des stocks de pions (réserve, plateau, cités, bateaux, trésor).
  - `ToolsView` & `AdvanceTip` : Arbre des progrès de civilisation, bonus de groupes et infobulles d'effets.
  - `GoodsView` : Visualisation graphique des cartes de marchandises et de calamités détenues en main.
- **Modules dépendants** : Consommé par `App.tsx` et les futurs conteneurs de jeu.

## 3. Spécification de l'API Publique
```typescript
export interface ViewProps {
  state: GameState;
  focus: PlayerId;
}

export function LogView({ state, focus }: ViewProps): JSX.Element;
export function AstView({ state, focus }: ViewProps): JSX.Element;
export function CensusView({ state, focus }: ViewProps): JSX.Element;
export function ToolsView({ state, focus }: ViewProps): JSX.Element;
export function GoodsView({ state, focus }: ViewProps): JSX.Element;
export function AdvanceTip({ id }: { id: string }): JSX.Element;
```

## 4. Logique Interne & Règles Métier
- **LogView** : Affiche les entrées `state.log` inversées (les plus récentes en haut). Supporte la structure bilingue des logs d'actions et colore les calamités en rouge / avertissement.
- **AstView** : Conforme aux règles §33 d'Avalon Hill. Compare les échelons atteints sur l'AST avec les prérequis d'époque (Stone Age, Early Bronze, Late Bronze, Early Iron, Late Iron) et met en avant la victoire potentielle (§33.4).
- **CensusView** : Vérifie la conservation des 56 pions par nation (§17.1) : 47 pions de population, 9 cités, 4 navires.
- **ToolsView** : Présente les 5 familles de progrès (Crafts, Arts, Civics, Sciences, Religion) avec les crédits croisés et l'obligation des 5 groupes pour entrer dans l'Âge du Fer (§33.24).
- **GoodsView** : Utilise les composants `CommodityCard` et `CalamityCard` pour matérialiser les cartes physiques tirées lors de la phase d'acquisition (§25).

## 5. Exemple d'Utilisation
```tsx
import { AstView, GoodsView } from './components/views/index.js';

function MyDashboard({ state, activePlayer }: { state: GameState; activePlayer: PlayerId }) {
  return (
    <div>
      <AstView state={state} focus={activePlayer} />
      <GoodsView state={state} focus={activePlayer} />
    </div>
  );
}
```

## 6. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Maintenir l'accessibilité des données même sans images en utilisant les cartes CSS vectorielles automatiques.
- **Tests associés** : Les tests d'intégration du moteur `test/invariants.test.ts` et tests unitaires `src/ui/cards/cards.test.ts`.
