# Fiche Wiki : Fonctions Auxiliaires Pures du Moteur (`src/engine/helpers`)

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/helpers.ts` et sous-modules dans `src/engine/helpers/` (`valuation.ts`, `topology.ts`, `orders.ts`, `conservation.ts`)
- **Rôle principal** : Fonctions pures et déterministes d'évaluation de cartes, navigation spatiale/maritime, décompte de recensement et contrôle de conservation des pièces.
- **Domaine** : Moteur de règles
- **Taille** : Moins de 85 lignes par fichier (strictement < 200 lignes)

## 2. Architecture & Dépendances
- **Sous-modules** :
  - `valuation.ts` : calcul de la valeur des séries de marchandises (§28.51), bonus de Mine (§32.261), crédits d'avances (§31.5) et faces publiques des offres de commerce (§28.3).
  - `topology.ts` : zones hors-jeu (§16), adjacence terrestre, navigation maritime BFS (§23.52) avec contrainte de côtes (§23.57) et astronomie.
  - `orders.ts` : comptage de cités et de population, ordre A.S.T. (§17.4), ordre de recensement et détermination du joueur actif.
  - `conservation.ts` : vérification stricte de conservation de la réserve de pièces et du paquet de cartes de commerce, légalité des sélections de guerre civile (§30.412).
- **Modules dépendants** : `src/engine/engine.ts`, `src/ai/*`, `src/ui/*`, tests unitaires.

## 3. Spécification de l'API Publique
### Fonctions Clés
#### `commoditySetValue(commodityId: string, n: number): number`
- **Rôle** : Calcule `n^2 * valeur` plafonné au nombre de cartes maximum de la marchandise (§28.51).

#### `creditTowards(owned: string[], targetId: string): number`
- **Rôle** : Calcule le rabais accordé par les cartes possédées pour l'achat de la carte cible (somme des crédits directs et de groupe).

#### `shipReachable(s, start, range, astronomy): Map<string, string[]>`
- **Rôle** : Parcours en largeur (BFS) sur le graphe naval retournant le chemin le plus court vers chaque destination accessible.

#### `pieceConservationProblems(state, expected): string[]`
- **Rôle** : Contrôle d'invariant vérifiant que pions, cités et navires totalisent exactement la dotation initiale.

## 4. Logique Interne & Règles Métier
- **Algorithme maritime** : Prend en compte les zones à deux côtes (Corinthe, Delphes) où un navire doit ressortir par la côte d'entrée.
- **Bris d'égalité A.S.T.** : L'ordre A.S.T. fixe sert à départager les égalités de population au recensement.

## 5. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Maintenir impérativement le caractère pur et sans effet de bord de ces fonctions.
- **Tests associés** : `src/engine/surplus.test.ts`, `src/engine/ships.test.ts`, `src/engine/engine.test.ts`.
