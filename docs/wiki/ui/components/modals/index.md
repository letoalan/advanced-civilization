# Fiche Wiki : Modales & Événements Pas-à-Pas (`ui/components/modals`)

## 1. Fiche d'Identité
- **Fichiers sources** :
  - `src/ui/components/modals/StepModal.tsx` (55 lignes)
  - `src/ui/components/modals/CalamityModal.tsx` (70 lignes)
  - `src/ui/components/modals/CombatModal.tsx` (68 lignes)
  - `src/ui/components/modals/LocalDiagnosticModal.tsx` (122 lignes)
  - `src/ui/components/modals/ReportModal.tsx` (45 lignes)
  - `src/ui/components/modals/index.ts` (6 lignes)
- **Rôle principal** : Présentation séquentielle et interactive des événements de jeu majeurs (batailles navales/terrestres, calamités subies et transmises, rapport de diagnostic technique sans réseau).
- **Domaine** : UI / Modales & Événements
- **Taille** : 100 % des composants sous la barre de 125 lignes.

## 2. Architecture & Dépendances
- **Imports clés** :
  - `StepModal` : Cadre générique de pagination pas-à-pas avec bouton "Suivant" et "Passer".
  - `local/diagnostics.js` : Générateur d'archives et de rapports de diagnostic anonymisés (`generateLocalDiagnostic`, `downloadTextFile`).
  - `data/index.js` : Dénominations des zones, civilisations et modificateurs de combat (Travail du Métal, Ingénierie).
- **Exports publics** :
  - `CalamityModal` : Récit séquentiel des calamités de la phase (victime, description, pertes directes et secondaires, bilan).
  - `CombatModal` : Déroulement pas-à-pas des conflits (§24) avec forces en présence, modificateurs et pertes.
  - `LocalDiagnosticModal` : Exportation locale complète (ou anonymisée) de la partie pour analyse de bogues sans connexion.
  - `ReportModal` : Fallback de signalement de problème.

## 3. Logique Métier
- **Résolution ordonnée (§29.6)** : La modale des calamités présente les événements dans l'ordre de sévérité croissante prescrit par Avalon Hill.
- **Transparence du combat (§24)** : Affichage explicite des forces initiales, des bonus de cartes technologiques et du décompte des pertes avant d'appliquer les changements de possession territoriale.

## 4. Exemple d'Utilisation
```tsx
import { CombatModal, CalamityModal } from './components/modals/index.js';

function Overlays({ state, player }) {
  return (
    <>
      <CombatModal events={state.lastCombats ?? []} you={player} />
      <CalamityModal events={state.lastCalamities ?? []} you={player} />
    </>
  );
}
```
