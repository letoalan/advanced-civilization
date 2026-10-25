# Fiche Wiki : Barre de Navigation & Statut (`ui/components/navigation`)

## 1. Fiche d'Identité
- **Fichiers sources** :
  - `src/ui/components/navigation/StatusPanel.tsx` (68 lignes)
  - `src/ui/components/navigation/UpcomingCalamities.tsx` (28 lignes)
  - `src/ui/components/navigation/GameOverSummary.tsx` (46 lignes)
  - `src/ui/components/navigation/TurnOrderTabs.tsx` (32 lignes)
  - `src/ui/components/navigation/ViewNav.tsx` (42 lignes)
  - `src/ui/components/navigation/PlayerHandoffModal.tsx` (111 lignes)
  - `src/ui/components/navigation/index.ts` (7 lignes)
- **Rôle principal** : Orchestration de la navigation dans l'interface de jeu, affichage du panneau d'état des stocks/cités/trésors, file des calamités, classement de fin de partie, et rideau de passage de main secret en mode hotseat (§27.4/§28).
- **Domaine** : UI / Navigation & Statut
- **Taille** : Tous les fichiers sont strictement sous le seuil de 120 lignes.

## 2. Architecture & Dépendances
- **Imports clés** :
  - `data/index.js` : Définitions des civilisations, des époques AST et des calamités.
  - `engine/helpers.js` : Calcul des scores de victoire (`victoryScore`).
  - `local/types.js` : Configuration des sièges et gestion des contrôleurs humain/IA.
- **Exports publics** :
  - `StatusPanel` : Panneau récapitulatif des pièces en réserve, sur le plateau, du trésor et de la case AST.
  - `UpcomingCalamities` : Bandeau d'alerte des calamités révélées en attente de résolution (§29.3).
  - `GameOverSummary` : Tableau des scores finaux et couronnement du vainqueur (§35).
  - `TurnOrderTabs` : Onglets colorés indiquant l'ordre de jeu et la nation active.
  - `ViewNav` : Boutons de bascule vers les vues secondaires et retour au menu.
  - `PlayerHandoffModal` : Écran occultant intermédiaire pour le secret des cartes lors des changements de joueur sur un même écran.

## 3. Logique Métier
- **Conservation des composants** : La `StatusPanel` affiche les 3 stocks cruciaux (pions, cités, navires) pour que le joueur surveille ses réserves avant toute expansion (§17.1).
- **Rideau de confidentialité (`PlayerHandoffModal`)** : Empêche la divulgation des cartes de calamités et de marchandises d'un joueur à un autre lorsqu'ils partagent le même poste de travail (§27.4). Possibilité de basculer en mode « Table ouverte » à la volée.

## 4. Exemple d'Utilisation
```tsx
import { StatusPanel, TurnOrderTabs, PlayerHandoffModal } from './components/navigation/index.js';

function Dashboard({ state, activeActor, seats }: { state: GameState; activeActor: PlayerId; seats: Record<PlayerId, 'human' | 'ai'> }) {
  return (
    <div>
      <StatusPanel state={state} id={activeActor} />
      <TurnOrderTabs state={state} actor={activeActor} seats={seats} />
    </div>
  );
}
```
