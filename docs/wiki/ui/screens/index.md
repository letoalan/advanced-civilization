# Fiche Wiki : src/ui/screens/

## 1. Fiche d'Identité
- **Fichier source** : `src/ui/screens/` (`HomeScreen.tsx`, `LocalSetupScreen.tsx`, `VideoBackground.tsx`)
- **Rôle principal** : Écrans de navigation de premier niveau en français pour la version locale autonome avec fond vidéo immersif et calque transparent de contraste.
- **Domaine** : Interface Utilisateur / Parcours d'Accueil
- **Taille** : `HomeScreen.tsx` (~130 lignes), `LocalSetupScreen.tsx` (~140 lignes), `VideoBackground.tsx` (~55 lignes).

## 2. Architecture & Dépendances
- **Imports clés** :
  - `src/local/session.ts` : validation des règles de configuration (§16) avant lancement.
  - `src/local/persistence.ts` : détection d'une sauvegarde existante et import/export JSON.
  - `src/engine/boards.ts` : préréglages de plateaux autorisés selon le nombre de participants (2 à 8).
  - `VideoBackground` : iframe YouTube en boucle muette (`autoplay=1`, `loop=1`, `controls=0`, `cc_load_policy=0`) avec calque sombre transparent radial.
- **Sous-modules** : [`setup.md`](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/docs/wiki/ui/screens/setup.md) (composants modulaires d'attribution des sièges, plateaux §16 et options).
- **Modules dépendants** : `src/ui/main.tsx` ou le composant racine.

## 3. Spécification de l'API Publique
```typescript
// Accueil
<HomeScreen
  onNewGame={() => setScreen('setup')}
  onResumeGame={(save) => launchGameFromSave(save)}
  onImportSave={(save) => launchGameFromSave(save)}
/>

// Configuration
<LocalSetupScreen
  onLaunch={(config) => startNewGame(config)}
  onBack={() => setScreen('home')}
/>
```

## 4. Logique Interne & Sécurité
- **Vérifications en direct** : Interdit les doublons de civilisations, exige au moins 1 joueur humain, et filtre les civilisations autorisées par plateau (§16).
- **Options de table** : Bascule entre le mode « Table ouverte » (toutes les mains visibles) et « Passage de main » (rideau de confidentialité).
- **Zéro appel réseau** : La reprise et l'import de fichier s'exécutent entièrement côté client via l'API FileReader du navigateur.
