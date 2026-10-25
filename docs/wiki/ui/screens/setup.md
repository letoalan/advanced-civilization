# Fiche Wiki : src/ui/screens/setup/

## 1. Fiche d'Identité
- **Dossier source** : `src/ui/screens/setup/`
- **Rôle principal** : Sous-composants modulaires d'attribution des sièges, choix de carte selon §16 et options de confidentialité/cadence pour l'écran de configuration locale.
- **Domaine** : Interface Utilisateur / Configuration de Partie
- **Taille** : 
  - `SeatCard.tsx` : ~145 lignes
  - `BoardPresetPicker.tsx` : ~80 lignes
  - `GameOptionsPicker.tsx` : ~85 lignes
  - `setupTranslations.ts` : ~85 lignes
  - `seatReconciliation.ts` : ~65 lignes
  - `index.ts` : ~7 lignes

## 2. Architecture & Dépendances
- **Imports clés** :
  - `src/data/index.ts` : liste des civilisations avec leurs couleurs et zones de départ canoniques.
  - `src/engine/boards.ts` : règles §16, préréglages de plateaux et raisons d'indisponibilité.
  - `src/local/types.ts` : types `LocalSeat`, `LocalSessionConfig`, `ControllerType`.
- **Exports publics** :
  - `SeatCard` : carte individuelle d'un siège joueur (bannière contrastée, choix de civ en français, toggle Humain/IA, nom du joueur, permutation automatique).
  - `BoardPresetPicker` : grille de sélection du plateau officiel Avalon Hill (§16) avec badges de pions et descriptions.
  - `GameOptionsPicker` : réglage de la confidentialité (passage secret / table ouverte) et cadence IA (lisible / instantané).
  - `reconcileSeats` : algorithme pur d'ajustement sans doublon des sièges selon l'effectif et le plateau.
  - `swapOrUpdateSeatCiv` : permutation automatique (smart-swap) évitant tout doublon lors du changement de faction.
  - `getCivNameFr`, `CIV_NAMES_FR`, `PRESET_INFO_FR`, `translateReason` : dictionnaire de traduction et formateurs français.
- **Modules dépendants** : `src/ui/screens/LocalSetupScreen.tsx`.

## 3. Spécification de l'API Publique
```typescript
export interface SeatCardProps {
  idx: number;
  seat: LocalSeat;
  activePreset: BoardPreset;
  allowedCivs: Set<string>;
  onUpdate: (idx: number, patch: Partial<LocalSeat>) => void;
}

export interface BoardPresetPickerProps {
  presets: BoardPreset[];
  activePresetId: string;
  onSelect: (presetId: string) => void;
}

export interface GameOptionsPickerProps {
  privacyMode: 'handoff' | 'open-table';
  aiPace: 'instant' | 'readable';
  onPrivacyChange: (mode: 'handoff' | 'open-table') => void;
  onAiPaceChange: (pace: 'instant' | 'readable') => void;
}
```

## 4. Logique Interne & Ergonomie
- **Accessibilité & Contraste WCAG AAA** : Les noms de civilisations sombres (Babylone violet `#4b0082`, Assyrie rouge `#b22222`, etc.) ne sont plus affichés en texte coloré sur fond sombre. À la place, un bandeau en dégradé de la couleur nationale est utilisé avec un texte blanc rehaussé d'une ombre portée, garantissant une lisibilité absolue.
- **Grille équilibrée** : Pour les parties à 4 joueurs (scénario canonique), les cartes de sièges s'organisent en matrice 2×2 plutôt qu'un alignement 3+1 asymétrique.
- **Prévention du débordement** : Les sélecteurs et le champ de saisie du nom de joueur sont disposés en blocs verticaux clairs, éliminant les bugs de troncature (`Joueu...`).
- **Traductions intégrales** : Tous les plateaux techniques (§16.2 à §16.8) et les justifications d'incompatibilité sont entièrement traduits en français.

## 5. Guide de Maintenance
- **Points de vigilance** : Maintenir chaque fichier strictement sous 200 lignes.
- **Tests associés** : `src/local/local.test.ts`, `src/engine/playarea.presets.test.ts`.
