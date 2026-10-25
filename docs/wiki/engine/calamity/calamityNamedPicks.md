# Fiche Wiki : `calamityNamedPicks.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/calamity/calamityNamedPicks.ts`
- **Rôle principal** : Gestion et validation des choix de provinces nommées (sélection de cités pour Trahison, Cité inondée, Piraterie, sites volcaniques, et étapes de marche barbare).
- **Domaine** : Moteur de jeu / Sélections nommées
- **Taille** : 141 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `digital-boardgame-framework` : RNG sérialisable (`Rng`).
  - `../../data/index.js` : Métadonnées des provinces (`areaById`).
  - `../helpers.js` : Accès joueur.
  - `../logging.js` : Traces des prises de cités et défections.
  - `../primitives.js` : Primitives d'unités (`areaName`, `BARBARIAN`, `has`, `isPlayer`).
  - `../phases/ast.js` : Classement aux points de victoire pour heuristique IA.
  - `../phases/conflict.js` : Combats locaux lors de la marche barbare (`resolveAreaCombat`).
  - `../phases/surplus.js` : Limites de soutien et marquage de cités acquises.
  - `./calamityBarbarians.js` : Fonctions de marche barbare (`marchBarbarianStep`, `marchBarbarians`).
  - `./calamityPrimary.js` : Prise pirate et résolutions de séisme/éruption (`razeCityToPirate`, `resolveEarthquake`, `resolveEruption`, `setupPiracySecondary`).
- **Exports publics** :
  - `requiredPickCount(_s, pk)` : Nombre requis de cités ou zones à sélectionner selon le stade du pick.
  - `suggestPick(s, pk)` : Heuristique suggérant le meilleur choix selon que la perte soit personnelle ou infligée à autrui.
  - `validatePick(s, pk, areas)` : Validation stricte des critères de choix (§30).
  - `PickResolution` : Interface décrivant le résultat d'un choix pour finalisation par `finalizePick`.
  - `applyPick(s, pk, areas)` : Application de la décision choisie, retournant un descripteur `PickResolution | null`.

## 3. Spécification de l'API Publique
### Types & Interfaces
```typescript
export interface PickResolution {
  calamityId: string;
  victim: PlayerId;
  before: AreaSnapshot;
  overviewBefore: string;
}
```

### Mécanisme de découplage DAG
Pour éviter toute dépendance cyclique entre `calamityNamedPicks.ts` et `calamityRunner.ts` :
1. `applyPick` applique l'impact immédiat sur le plateau (`s.areas`, `player.stock`, `citiesAvailable`).
2. Si la calamité nécessite la suite de la boucle (ex: passages aux effets secondaires ou enregistrement d'événement), `applyPick` renvoie l'objet `PickResolution`.
3. Le dispatcher `applyCalamityAction.ts` consomme cette résolution et invoque `finalizePick(s, res.calamityId, res.victim, res.before, res.overviewBefore)`.

## 4. Logique Interne & Règles Métier
- **Trahison (§30.221-§30.222)** : Si la calamité a été troquée, le joueur troqueur prend possession de la cité si son stock le permet, sinon elle est détruite. Si la victime l'a piochée elle-même, la cité est réduite en pions de population.
- **Inondation côtière (§30.514)** : Perte de la cité côtière, réduite au lieu d'être détruite si le joueur possède *Ingénierie*.
- **Piraterie secondaire (§30.912)** : Chaque victime secondaire ne peut perdre qu'une seule cité côtière au maximum.

## 5. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Ne jamais réimporter `calamityRunner.ts` directement dans ce module ; passer par `PickResolution` et `finalizePick`.
- **Tests associés** : `src/engine/calamity.treachery.test.ts`, `src/engine/calamity.effects.test.ts`.
