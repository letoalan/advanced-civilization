# Fiche Wiki : Contrôleur d'IA Heuristique (`src/ai/heuristic`)

## 1. Fiche d'Identité
- **Fichier source** : `src/ai/heuristic.ts` et sous-modules dans `src/ai/heuristic/` (`HeuristicAI.ts`, `movement.ts`, `movementCombat.ts`, `movementAttacks.ts`, `advances.ts`, `trade.ts`, `shipsAndMisc.ts`, `index.ts`)
- **Rôle principal** : Joueur artificiel déterministe, glouton et équitable (sans triche sur les mains cachées) implémentant `PlayerController`.
- **Domaine** : Intelligence Artificielle (IA)
- **Taille** : Moins de 170 lignes par fichier (strictement < 200 lignes)

## 2. Architecture & Dépendances
- **Sous-modules** :
  - `HeuristicAI.ts` : classe principale orientant les décisions par phase de jeu.
  - `movement.ts` : planification globale du mouvement (transport naval, cités, repli).
  - `movementAttacks.ts` : assauts de cités (§24.3) et renforts défensifs (§24.41).
  - `movementCombat.ts` : résolution mathématique de combat et support de population.
  - `advances.ts` : optimisation d'achat de paniers de progrès avec minimisation du gaspillage de cartes.
  - `trade.ts` : propositions et acceptations d'offres de commerce équitables et défausse d'opportunité de calamités.
  - `shipsAndMisc.ts` : construction/sabordage naval et choix d'implantation initiale (§16.3).
- **Modules dépendants** : `src/ui/*`, `src/server/*`, tests unitaires.

## 3. Spécification de l'API Publique
### Classe
#### `HeuristicAI(opts?: { aggressive?: boolean; defensive?: boolean })`
- **Méthode** : `selectAction(ctx: ControllerContext<GameState, Action, PlayerId>): Promise<Action>`
- **Comportement** :
  - `movement` : regroupe les jetons sur les cités, défend contre les assauts probables, disperse le surplus.
  - `cityConstruction` : érige systématiquement des cités si la population résiduelle assure le support (§26.31).
  - `acquireAdvances` : privilégie les nouvelles couleurs A.S.T., puis le meilleur ratio coût/valeur faciale.
  - `trade` : échange pour compléter ses séries, tente de refiler les calamités négociables.

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Ne jamais lire la main d'un adversaire (respect absolu du brouillard d'information multijoueur).
- **Tests associés** : `src/ai/heuristic.test.ts`.
