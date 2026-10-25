# Fiche Wiki : Journalisation Typée (`logging.ts`)

## 1. Fiche d'Identité
- **Fichier source** : [src/engine/logging.ts](file:///c:/Users/alano/OneDrive/Documents/GitHub/advanced-civilization/src/engine/logging.ts)
- **Rôle principal** : Émission et formatage des entrées de journal de jeu structurées (format v2) avec gestion de séquence et détection des articles de règles.
- **Domaine** : Moteur de jeu / Logging & Diagnostic.
- **Taille** : 33 lignes (< 200 lignes).

## 2. Architecture & Dépendances
- **Imports clés** :
  - `appendGameLog`, `type GameLogEntry` : Module de logging de `digital-boardgame-framework`.
  - `GameState`, `PlayerId` : Types de données du moteur.
- **Exports publics** :
  - `LOG_CAP` : Plafond d'historique conservé en mémoire vive (2 000 entrées).
  - `RULE_RE` : Expression régulière extrayant les références (§xx.xx) dans les textes de règles.
  - `lastLogSeq(s)` : Dernier numéro de séquence séquentiel émis.
  - `logMsgsSince(s, seq)` : Récupération delta des messages depuis un numéro de séquence.
  - `log(s, code, actor, text, data)` : Enregistrement d'un événement structuré.

## 3. Spécification de l'API Publique
### Fonctions
#### `log(s: GameState, code: string, actor: PlayerId | null, text: string, data: Record<string, unknown>): void`
- **Paramètres** :
  - `code` : Identifiant de catégorie typée (ex: `'calamity.volcano'`, `'trade.buyNinth'`).
  - `actor` : Joueur responsable ou affecté, ou `null` pour un événement global.
  - `text` : Texte descriptif complet, souvent porteur de référence à la règle.
  - `data` : Métadonnées structurées associées à l'action.

## 4. Logique Interne & Règles Métier
- **Extraction automatique des règles** : Si `text` contient une mention telle que `§29.5`, `RULE_RE` extrait la référence et l'ajoute dans `data.rule`.
- **Format v2 & Compatibilité** : Les entrées sont des objets complets horodatés et numérotés avec `seq`, garantissant une synchronisation réseau et un défilement local fluide sans perte de contexte.

## 5. Exemple d'Utilisation
```typescript
import { log } from './src/engine/logging';

log(state, 'city.build', 'egypt', 'Égypte bâtit une cité à Memphis (§25.1).', { area: 'memphis' });
```

## 6. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Maintenir le plafond `LOG_CAP` pour éviter les fuites de mémoire lors des parties à longue durée (100+ tours en test aléatoire).
- **Tests associés** : `src/engine/log.test.ts`.
