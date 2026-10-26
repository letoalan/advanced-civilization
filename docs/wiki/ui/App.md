# Fiche Wiki : Orchestrateur Principal de Jeu (`ui/App.tsx`)

## 1. Fiche d'Identité
- **Fichier source** : `src/ui/App.tsx`
- **Rôle principal** : Conteneur orchestrateur de la partie en cours. Gère la boucle de jeu locale, le cycle de vie de l'état (`GameState`), les tours de l'IA avec cadence réglable, l'autosauvegarde locale automatique, les modales d'événements, le Glass HUD flottant (`GlassTopBar` et `ActionDock`), la main interactive de cartes (`CardHand`), le mode cinématique (`PhaseBanner`, `useAnimatedMove`) et le popover de province (`ZonePopover`).
- **Domaine** : UI / Orchestration de jeu
- **Taille** : 189 lignes (entièrement conforme au seuil strict < 200 lignes).

## 2. Architecture & Dépendances
- **Imports clés** :
  - `components/board/` : `Board`, `MapArtBanner`, `AreaPeekProvider`, `nationFocusArea`, `scrollBoardTo`.
  - `components/hud/` : `ZonePopover`, `GlassTopBar`, `CivBadge`, `ResourceCaskets`, `CalamityAlertBadge`, `SettingsModal`.
  - `components/dock/` : `ActionDock`, `DockCodexButtons`.
  - `cards/` : `CardHand`, `CommodityCard`, `CalamityCard`.
  - `components/cinematic/` : `PhaseBanner`.
  - `components/navigation/` : `ImperialTopBar`, `DecisionRibbon`, `CodexOverlayModal`, `TurnOrderTabs`, `PlayerHandoffModal`.
  - `hooks/` : `useFocusMode`, `useAnimatedMove`, `useAnimatedNumber`, `useReducedMotion`.
  - `sound/` : `soundManager`.
  - `local/` : `createLocalSession`, `saveLocalGame`, `clearLocalSave`.
  - `ai/heuristic.js` : Moteur de décision pour les sièges contrôlés par l'IA.
- **Exports publics** :
  - `default function App(props: AppProps): JSX.Element`
  - Re-exports universels pour compatibilité ascendante (`online.tsx`, tests).

## 3. Spécification de l'API Publique
```typescript
export interface AppProps {
  /** Configuration d'une nouvelle session locale. */
  sessionConfig?: LocalSessionConfig;
  /** Sauvegarde restaurée à reprendre. */
  initialSave?: LocalSaveFile;
  /** Callback de retour à l'écran d'accueil. */
  onExitToMenu?: () => void;
}
```

## 4. Logique Interne & Boucle de Jeu
1. **Initialisation** : Hydrate la partie soit depuis un fichier de sauvegarde (`initialSave`), soit en créant une session locale neuve (`sessionConfig`), soit avec les 4 nations par défaut (§16.6).
2. **Autosauvegarde réactive** : Chaque transition d'état enregistre l'état complet dans `localStorage` via `saveLocalGame(config, state)` (ou nettoie la sauvegarde en cas de victoire finale).
3. **Passement de main hotseat** : Si le mode `handoff` est actif et que le tour passe d'un humain à un autre, la modale occultante `PlayerHandoffModal` s'active pour préserver le secret des mains et calamités (§27.4).
4. **Exécution de l'IA** : Déclenchée automatiquement lorsque le siège actif est de type `'heuristic-ai'`. La cadence est modulée selon `config.aiPace` (220 ms en mode lisible pour observer les mouvements sur la carte, 0 ms en mode instantané).

## 5. Exemple d'Utilisation
```tsx
import App from './App.js';

function MyContainer() {
  return (
    <App
      sessionConfig={{
        boardPresetId: 'raw-4p',
        privacyMode: 'handoff',
        aiPace: 'readable',
        seats: [
          { civilizationId: 'egypt', controller: 'human', displayName: 'Alice' },
          { civilizationId: 'babylon', controller: 'heuristic-ai' },
        ],
      }}
      onExitToMenu={() => console.log('Retour')}
    />
  );
}
```
