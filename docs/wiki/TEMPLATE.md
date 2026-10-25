# Fiche Wiki : [NomDuComposantOuModule]

## 1. Fiche d'Identité
- **Fichier source** : `src/[chemin/vers/fichier.ts]`
- **Rôle principal** : [Résumé clair en 1 ou 2 phrases de la responsabilité unique du fichier]
- **Domaine** : [Moteur / UI / Données / IA / Persistance / Configuration]
- **Taille** : [Nombre de lignes] (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `dep-1` : rôle de l'importation.
  - `dep-2` : rôle de l'importation.
- **Exports publics** :
  - `SymbolA` : description du symbole exporté.
  - `SymbolB` : description du symbole exporté.
- **Modules dépendants** : [Quels fichiers ou composants consomment ce module ?]

## 3. Spécification de l'API Publique
### Types & Interfaces
```typescript
export interface MonInterfaceProps {
  /** Description du champ */
  champ: string;
}
```

### Fonctions / Composants
#### `maFonction(param1: Type1, param2: Type2): ReturnType`
- **Paramètres** :
  - `param1` : rôle et contraintes du paramètre.
  - `param2` : rôle et contraintes du paramètre.
- **Retour** : description de la valeur retournée.
- **Exceptions / Rejets** : cas d'erreurs ou conditions d'échec.

## 4. Logique Interne & Règles Métier
- **Algorithme sous-jacent** : Explication étape par étape de la logique.
- **Règles officielles Avalon Hill** : Référence (§ article de règle 1991, ex: §18, §28).
- **Décisions de conception & cas limites** : Gestion des exceptions, invariants maintenus.

## 5. Exemple d'Utilisation
```typescript
import { maFonction } from './chemin';

// Exemple concret d'appel ou de rendu
const resultat = maFonction(arg1, arg2);
```

## 6. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Ce qu'il ne faut pas casser lors d'une évolution.
- **Tests associés** : Fichier de test correspondant (ex: `src/[chemin/fichier.test.ts]`).
- **Pistes d'extension** : Comment un développeur tiers peut ajouter de nouvelles fonctionnalités à ce module.
