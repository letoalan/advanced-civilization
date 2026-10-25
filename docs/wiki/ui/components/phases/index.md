# Fiche Wiki : Contrôles d'Actions des Phases de Jeu (`ui/components/phases`)

## 1. Fiche d'Identité
- **Fichiers sources** :
  - `src/ui/components/phases/ActionList.tsx` (84 lignes)
  - `src/ui/components/phases/TaxationControls.tsx` (31 lignes)
  - `src/ui/components/phases/ExpansionControls.tsx` (47 lignes)
  - `src/ui/components/phases/ShipControls.tsx` (87 lignes)
  - `src/ui/components/phases/CityConstructionControls.tsx` (64 lignes)
  - `src/ui/components/phases/StartControls.tsx` (47 lignes)
  - `src/ui/components/phases/NinthStackControls.tsx` (31 lignes)
  - `src/ui/components/phases/PillageControls.tsx` (34 lignes)
  - `src/ui/components/phases/SupportControls.tsx` (35 lignes)
  - `src/ui/components/phases/DiscardControls.tsx` (48 lignes)
  - `src/ui/components/phases/CityChoiceControls.tsx` (48 lignes)
  - `src/ui/components/phases/AllocationControls.tsx` (56 lignes)
  - `src/ui/components/phases/PickControls.tsx` (67 lignes)
  - `src/ui/components/phases/ConversionControls.tsx` (33 lignes)
  - `src/ui/components/phases/UnitLossControls.tsx` (104 lignes)
  - `src/ui/components/phases/CivilWarControls.tsx` (108 lignes)
  - `src/ui/components/phases/AdvancePicker.tsx` (128 lignes)
  - `src/ui/components/phases/trade/OfferBuilder.tsx` (110 lignes)
  - `src/ui/components/phases/trade/TradeControls.tsx` (134 lignes)
  - `src/ui/components/phases/movement/*` (6 sous-fichiers, tous < 185 lignes)
- **Rôle principal** : Composants interactifs guidant les décisions du joueur humain à chaque étape du tour de jeu conformément aux règles d'Avalon Hill (1991).
- **Domaine** : UI / Phase Controls
- **Taille** : 100 % des composants sous la barre stricte des 185 lignes.

## 2. Architecture & Dépendances
- **Routeur d'actions (`ActionList.tsx`)** : Aiguille automatiquement vers le composant approprié selon l'état (`state.phase`, `state.pending*`).
- **Phase maritime et terrestre (`movement/`)** : Découpage modulaire du calcul d'itinéraires (`walkVoyage`), de la prévisualisation (`movementPreview`), des vérifications de légalité (`movementLegality`) et des escales multiples (`useVoyagePlanner`).
- **Négociation et commerce (`trade/`)** : Construction des lots d'échange (§28.2), bluff et annonces garanties (§28.3), tableau des offres publiques et contre-offres.
- **Acquisitions technologiques (`AdvancePicker.tsx`)** : Panier d'achat multi-progrès avec déduction des réductions antérieures (§31.53), vérification des prérequis (§31.62) et compensation monétaire (§31.41).

## 3. Conformité aux Règles Avalon Hill
- **Fiscalité (§19, §32.421)** : Gestion du taux de taxe par cité avec effet Monnayage.
- **Croissance démographique (§20)** : Détection d'épuisement de stock et placement obligé sans tronquage (§20.2).
- **Entretien des flottes (§22.3)** : Prélèvement local de population ou sur le trésor, ou démantèlement immédiat.
- **Soutien des cités (§26.31)** : Règle des 2 pions par cité requise sur le reste du plateau.
- **Calamités interactives (§29, §30)** :
  - *Guerre Civile* (§30.41) : Constitution successive des factions et choix de la faction conservée.
  - *Famine & Poterie* (§30.312) : Engagement de cartes Grain pour amortir les pertes.
  - *Épidémie* (§30.612) : Conservation obligatoire d'au moins 1 pion par zone.
  - *Monothéisme* (§32.94) : Conversion d'une zone adverse adjacente.

## 4. Exemple d'Utilisation
```tsx
import { ActionList } from './components/phases/index.js';

function PhasePanel({ legalActions, state, activeActor, onApply }) {
  return (
    <ActionList
      legal={legalActions}
      selectedArea={null}
      phase={state.phase}
      onApply={onApply}
      state={state}
      actor={activeActor}
    />
  );
}
```
