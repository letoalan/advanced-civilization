# Fiche Wiki : src/engine/types/

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/types/` (scindé depuis `src/engine/types.ts`)
- **Rôle principal** : Définition des structures de données fondamentales de l'état du jeu, des phases, des joueurs et des actions.
- **Domaine** : Moteur de Règles
- **Taille** : Chaque sous-module fait < 190 lignes (total 6 fichiers).

## 2. Architecture & Dépendances
- **Organisation interne** :
  - `core.ts` : `PlayerId`, `Phase`, `PHASE_ORDER`, `PlayerState`, `AreaState`, `UnitSet`, `ShipPhaseStep`, `VoyageStep`.
  - `trade.ts` : `TradeBundle`, `TradeResponse`, `OpenOffer`, `CompletedTrade`, `TradeStacks`.
  - `pending.ts` : Décisions interactives en attente (`PendingAllocation`, `PendingCityChoice`, `PendingUnitLoss`, `PendingDiscard`, `PendingSupport`, `PendingPick`, `PendingCivilWar`, `PendingPillage`).
  - `events.ts` : `CombatForce`, `CombatEvent`, `CalamityStep`, `CalamityEvent`.
  - `state.ts` : Interface maîtresse `GameState`.
  - `actions.ts` : Union discriminée `Action` et chaque interface d'action.
  - `index.ts` : Réexporte l'ensemble.
- **Modules dépendants** : L'ensemble du moteur (`src/engine/`), l'IA (`src/ai/`), et l'interface utilisateur (`src/ui/`).

## 3. Spécification de l'API Publique
Toutes les structures sont des interfaces TypeScript pures et sérialisables, sans aucune instance de classe ni `Map` dans l'état (requis pour la sérialisation `jsonCodec`).

## 4. Logique Interne & Règles Métier
- Conformité stricte aux 12 phases du jeu officiel Avalon Hill 1991 (§18).
- Gestion des règles de négociation bilatérale à 2 cartes déclarées vraies (§28.3).
- Modélisation des résolutions complexes de calamités (Guerre Civile §30.41, Famine, Épidémie, Piraterie).

## 5. Exemple d'Utilisation
```typescript
import type { GameState, Action, PlayerId } from '../engine/types.js';

function isPlayerActive(state: GameState, player: PlayerId): boolean {
  return state.activeOrder[0] === player;
}
```

## 6. Guide de Maintenance & Réexploitabilité
- Aucun fichier de ce module ne doit dépasser 200 lignes.
- Si de nouvelles actions ou sous-états sont créés, les ajouter dans le fichier thématique correspondant.
