# Fiche Wiki : src/local/

## 1. Fiche d'Identité
- **Fichier source** : `src/local/` (`types.ts`, `session.ts`, `persistence.ts`, `diagnostics.ts`)
- **Rôle principal** : Couche d'orchestration pour le jeu local autonome sur un seul poste (configuration des sièges humains et IA, persistance automatique, import/export et diagnostics).
- **Domaine** : Gestion Locale & Persistance
- **Taille** : Chaque module fait < 140 lignes.

## 2. Architecture & Dépendances
- **Organisation interne** :
  - `types.ts` : interfaces `LocalSessionConfig`, `LocalSeat`, `LocalSaveFile`.
  - `session.ts` : validation des configurations de partie et instanciation du moteur via `createGame()`.
  - `persistence.ts` : lecture/écriture dans le `localStorage` et validation des imports JSON (avec migration automatique de schéma le cas échéant).
  - `diagnostics.ts` : génération d'exports de diagnostic anonymisés sans connexion réseau.
- **Modules dépendants** : `src/ui/screens/` (`HomeScreen.tsx`, `LocalSetupScreen.tsx`, `GameScreen.tsx`).

## 3. Spécification de l'API Publique
```typescript
// Validation et création
const validation = validateSessionConfig(config);
const gameState = createLocalSession(config);

// Sauvegarde et reprise
saveLocalGame(config, gameState);
const save = loadLocalSave();
clearLocalSave();

// Import / Export JSON
const json = exportSaveAsJson(save);
const res = importSaveFromJson(rawJson);

// Diagnostic technique
const report = generateLocalDiagnostic(state, config, { anonymizeNames: true });
downloadTextFile('diagnostic.txt', report);
```

## 4. Logique Interne & Sécurité
- **Validation stricte** : Empêche la création d'une partie sans joueur humain ou avec des civilisations non autorisées par le préréglage de plateau retenu.
- **Protection anti-corruption** : Rejette les fichiers JSON corrompus ou trop volumineux (> 5 Mo) sans jamais altérer la partie en cours.
- **Confidentialité** : Les diagnostics anonymisent les noms de joueurs et n'intègrent l'état complet qu'avec confirmation expresse.

## 5. Guide de Maintenance
- Tests associés : `src/local/local.test.ts`.
