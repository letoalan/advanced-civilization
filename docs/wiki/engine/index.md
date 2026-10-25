# Fiche Wiki : Moteur de Jeu Advanced Civilization (`src/engine/`)

## 1. Fiche d'Identité
- **Fichier source** : [src/engine/index.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/engine/index.ts) & [src/engine/engine.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/engine/engine.ts)
- **Rôle principal** : Point d'entrée public et façade de réexportation du moteur de jeu complet pour *Advanced Civilization* (Avalon Hill, 1991).
- **Domaine** : Moteur de jeu (Game Engine) / State Machine.
- **Taille** : `index.ts` (23 lignes), `engine.ts` (14 lignes) (< 200 lignes).

## 2. Architecture & Dépendances
- **Architecture modulaire** :
  - `src/engine/adapter/` : Adaptateur pour `digital-boardgame-framework` (`CivAdapter`, `legalActions`, `currentActor`, `viewFor`, `applyAction`).
  - `src/engine/phases/` : Découpage par phase de jeu (Taxation, Expansion, Recensement, Flotte, Mouvement, Conflit, Surplus, Commerce, Progrès, AST, Monothéisme, Normalisation).
  - `src/engine/calamity/` : Moteur de résolution des calamités (Géographie, Primaire, Guerre Civile, Barbares, Choix de Pertes, Choix Nominatifs, Exécution).
  - `src/engine/primitives.ts` : Mutations élémentaires du plateau (pions, cités, détection côtière).
  - `src/engine/logging.ts` : Journalisation d'événements typés v2.
  - `src/engine/tradeHelpers.ts` : Utilitaires pour les cartes de commerce et calamités.
- **Exports publics** :
  - `CivAdapter` : Classe d'adaptation du jeu.
  - `createGame(opts)` : Fabrique d'une partie neuve normalisée.
  - `normalize(s)` : Boucle d'avancement des phases automatiques.
  - `victoryScore(s, id)` : Calcul des points de victoire (§35).
- **Modules dépendants** : `src/ui/App.tsx`, `src/local/session.ts`, `src/ai/heuristic.ts`, serveurs et tests.

## 3. Spécification de l'API Publique
### Fonctions
#### `createGame(opts: NewGameOptions): GameState`
- **Paramètres** : `opts` (seating, plateau, seed, variantes).
- **Retour** : Un `GameState` prêt à jouer, normalisé au premier choix interactif du tour 1.

#### `normalize(s: GameState): void`
- **Paramètres** : `s` (état du jeu modifié sur place).
- **Comportement** : Fait progresser les phases automatiques et les tours jusqu'à la fin de partie ou jusqu'à ce qu'un joueur humain doive prendre une décision.

## 4. Logique Interne & Règles Métier
- **Cycle des 11 phases officielles** :
  1. *Taxation* (§19) : prélèvement et révoltes fiscales.
  2. *Expansion de population* (§20) : croissance automatique ou manuelle en cas de rupture de stock.
  3. *Recensement* (§21) : détermination de l'ordre du tour.
  4. *Construction navale* (§22) : levée et entretien des flottes.
  5. *Mouvements* (§23) : déplacements terrestres, par voie de mer et traversée de détroits.
  6. *Conflits* (§24-25) : combats par attrition et assauts de cités.
  7. *Érection de cités* (§25.1) : conversion de 6 ou 12 pions en cité.
  8. *Surplus et soutien de cités* (§26) : vérification de la subsistance (2 pions par cité).
  9. *Acquisition de cartes de commerce* (§27) : pioche d'une carte par cité.
  10. *Commerce & Calamités* (§28-30) : négociation libre puis résolution des calamités.
  11. *Avances de civilisation & AST* (§31-33) : achats de progrès et avancée sur la table de succession archéologique.

## 5. Exemple d'Utilisation
```typescript
import { createGame, CivAdapter } from './src/engine';

const state = createGame({
  seating: ['rome', 'egypt', 'greece'],
  board: 'standard',
  seed: 42,
});

const adapter = new CivAdapter();
const nextActor = adapter.currentActor(state);
const actions = adapter.legalActions(state, nextActor!);
```

## 6. Guide de Maintenance & Réexploitabilité
- **Invariance** : Tout nouveau fichier de phase ou de sous-système doit rester sous la limite de 200 lignes.
- **Tests associés** : Suite complète de tests Vitest dans `src/engine/*.test.ts` (295 tests au vert).
