# Fiche Wiki : features.ts

## 1. Fiche d'Identité
- **Fichier source** : `src/config/features.ts`
- **Rôle principal** : Centralise les drapeaux d'activation (feature flags) pour isoler les services distants et garantir l'autonomie locale.
- **Domaine** : Configuration
- **Taille** : ~25 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** : Aucun (module pur de configuration statique).
- **Exports publics** :
  - `features` : objet constant immuable (`as const`) définissant l'état des drapeaux.
  - `Features` : type extrait de l'objet `features`.
- **Modules dépendants** :
  - `src/ui/main.tsx` : conditionne l'accès au lobby en ligne et les rapports d'erreurs.
  - `src/ui/App.tsx` : conditionne l'envoi de statistiques de partie (`recordPlay`, `recordFinish`).

## 3. Spécification de l'API Publique
### Types & Interfaces
```typescript
export interface Features {
  readonly onlineMultiplayer: boolean;
  readonly externalIdentity: boolean;
  readonly remoteReports: boolean;
  readonly externalHub: boolean;
}
```

### Constante exportée
- `features.onlineMultiplayer` (`false`) : désactive les fonctionnalités de salon multijoueur distant.
- `features.externalIdentity` (`false`) : désactive l'authentification et les profils distants.
- `features.remoteReports` (`false`) : désactive les appels API vers la base Supabase de signalement de bugs.
- `features.externalHub` (`false`) : désactive l'envoi de métriques de début et de fin de partie au hub d'origine.

## 4. Logique Interne & Règles Métier
- Ce fichier applique les exigences du **Lot 1** de [plan.md](../../plan.md) et [implementation.md](../../implementation.md).
- L'isolation est stricte : au lieu de simplement cacher des boutons dans l'interface, les fonctions de réseau testent ces drapeaux pour ne déclencher aucun appel HTTP ou socket en arrière-plan.

## 5. Exemple d'Utilisation
```typescript
import { features } from '../config/features.js';

if (features.remoteReports) {
  // Envoi de rapport distant (désactivé en mode autonome)
  submitReport(...);
} else {
  // Journalisation locale pure
  console.info('Mode autonome : rapport distant non émis.');
}
```

## 6. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Maintenir tous les drapeaux à `false` pour la version locale autonome.
- **Tests associés** : Les tests d'intégration vérifient que le lancement ne produit aucune requête réseau.
