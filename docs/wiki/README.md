# Documentation Wiki — Advanced Civilization

Bienvenue dans la documentation technique du portage numérique d'**Advanced Civilization**.

Conformément à nos standards d'ingénierie, **chaque fichier source du projet est documenté individuellement** selon un gabarit standardisé ([TEMPLATE.md](TEMPLATE.md)), garantissant une lisibilité intégrale et une réexploitabilité par n'importe quel développeur tiers.

---

## Charte de Conception
- **Règle stricte des 200 lignes** : Aucun fichier source ne dépasse 200 lignes.
- **Principe de responsabilité unique (SRP)** : Chaque module remplit une fonction délimitée et testée.
- **Typage statique strict** : TypeScript sans contournement (`noEmit` vérifié en continu).
- **Zéro dépendance réseau en local** : Moteur déterministe autonome.

---

## Index Général des Fiches par Domaine

### 1. Configuration & Drapeaux de Fonctionnalités (`src/config/`)
- [features.ts](config/features.md) : Feature flags centraux (isolation réseau, mode hors ligne).

### 2. Couche Locale Autonome (`src/local/`)
- [types.ts](local/types.md) : Interfaces de la session locale, sièges humains et IA.
- [session.ts](local/session.md) : Gestionnaire d'état de configuration de partie.
- [persistence.ts](local/persistence.md) : Moteur de sauvegarde automatique (`localStorage`) et sérialisation.
- [save-format.ts](local/save-format.md) : Schéma et validation stricte des imports/exports JSON.
- [diagnostics.ts](local/diagnostics.md) : Générateur de rapports de diagnostic locaux anonymisés.

### 3. Système de Cartes & Assets Graphiques (`src/ui/cards/`)
- [CardFrame.tsx](ui/cards/CardFrame.md) : Cadre de carte universel avec repli automatique CSS.
- [CommodityCard.tsx](ui/cards/CommodityCard.md) : Carte de marchandise (18 produits, séries et piles).
- [CalamityCard.tsx](ui/cards/CalamityCard.md) : Carte de calamité (12 fléaux, négociabilité et sévérité).
- [AdvanceCard.tsx](ui/cards/AdvanceCard.md) : Carte de progrès / technologie (24 avances et crédits).

### 4. Interface Utilisateur & Écrans (`src/ui/screens/`)
- [HomeScreen.tsx](ui/screens/HomeScreen.md) : Écran d'accueil en français.
- [LocalSetupScreen.tsx](ui/screens/LocalSetupScreen.md) : Configuration des civilisations et joueurs.
- [GameScreen.tsx](ui/screens/GameScreen.md) : Conteneur principal de jeu modulaire.

### 5. Composants de Jeu (`src/ui/components/`)
- **Plateau & Navigation** :
  - [BoardView.tsx](ui/components/board/BoardView.md) : Carte vectorielle SVG avec Pan & Zoom interactif.
  - [BoardTokens.tsx](ui/components/board/BoardTokens.md) : Couche de rendu des pions, cités, bateaux.
  - [Minimap.tsx](ui/components/board/Minimap.md) : Mini-carte vectorielle de repérage rapide.
- **Barre de Contrôle** :
  - [ControlBar.tsx](ui/components/navigation/ControlBar.md) : Barre inférieure et sélecteur de vues.
  - [StatusPanel.tsx](ui/components/navigation/StatusPanel.md) : Indicateurs de stock, trésor et cités.
  - [PlayerHandoffModal.tsx](ui/components/navigation/PlayerHandoffModal.md) : Rideau de confidentialité Hotseat.
- **Vues Spécialisées** :
  - [AstView.tsx](ui/components/views/AstView.md) : Frise chronologique A.S.T. par époque.
  - [TechTreeView.tsx](ui/components/views/TechTreeView.md) : Arbre technologique des 24 avances.
  - [TradeView.tsx](ui/components/views/TradeView.md) : Comptoir de négociation de cartes.
  - [CensusView.tsx](ui/components/views/CensusView.md) : Recensement et démographie.
  - [LogView.tsx](ui/components/views/LogView.md) : Journal d'événements.

### 6. Moteur de Règles Modulaire (`src/engine/`)
- [CivAdapter.ts](engine/core/CivAdapter.md) : Adaptateur de jeu principal `GameAdapter`.
- [normalization.ts](engine/core/normalization.md) : Machine d'avancement des phases automatiques.
- [legality.ts](engine/core/legality.md) : Détermination des actions légales selon la phase.
- **Phases individuelles** :
  - [taxation.ts](engine/phases/taxation.md), [expansion.ts](engine/phases/expansion.md), [census.ts](engine/phases/census.md)
  - [ships.ts](engine/phases/ships.md), [movement.ts](engine/phases/movement.md), [combat.ts](engine/phases/combat.md)
  - [cities.ts](engine/phases/cities.md), [surplus.ts](engine/phases/surplus.md), [trade.ts](engine/phases/trade.md)
  - [calamity.ts](engine/phases/calamity.md), [advances.ts](engine/phases/advances.md), [ast.ts](engine/phases/ast.md)

### 7. Intelligence Artificielle (`src/ai/`)
- [heuristic.ts](ai/heuristic.md) : Contrôleur heuristique principal.
- [tradePlanner.ts](ai/tradePlanner.md) : Algorithme de proposition et réponse aux échanges.
- [movePlanner.ts](ai/movePlanner.md) : Stratégie de déplacement terrestre et convoi naval.
