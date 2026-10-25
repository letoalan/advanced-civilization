# Fiche Wiki : `CivAdapter.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/adapter/CivAdapter.ts`
- **Rôle principal** : Implémentation officielle du contrat `GameAdapter<GameState, Action, PlayerId>` de `digital-boardgame-framework` pour *Advanced Civilization*.
- **Domaine** : Moteur de jeu / Adaptateur Framework
- **Taille** : 61 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `digital-boardgame-framework` : Contrat `GameAdapter`, `GameResult`, `upgradeProseLog`.
  - `../logging.js` : Plafond d'historique `LOG_CAP`.
  - `../phases/ast.js` : Calcul des scores de victoire (`victoryScore`).
  - `./currentActor.js` : Résolution du joueur actif.
  - `./legalActions.js` : Énumération des actions légales.
  - `./viewFor.js` : Filtrage de brouillard de guerre pour mains privées.
  - `./applyAction.js` : Dispatcher des actions de jeu.
- **Exports publics** :
  - `class CivAdapter` : Adaptateur principal exposé au serveur multijoueur, au hotseat local et aux bots heuristiques.

## 3. Spécification de l'API Publique
- `migrate(rawState, fromVersion)` : Migration ascendante du journal de texte v1 vers le format d'événements structurés v2.
- `currentActor(state)` : Retourne le joueur actif attendu (ou `null` si phase automatique ou fin de partie).
- `legalActions(state, actor)` : Énumère les coups valides pour `actor`.
- `viewFor(state, viewer)` : Masque les mains et offres adverses selon le siège du joueur.
- `tryApplyAction(state, action, actor)` : Exécute une action en capturant les erreurs sous forme de retour `{ ok: false, reason }`.
- `applyAction(state, action, actor)` : Exécute une action de manière stricte (lève une exception en cas de violation).
- `result(state)` : Évalue la condition de fin de partie (§33) et retourne vainqueurs et classement final.

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Toujours préserver l'invariance du schéma v2 et déléguer aux sous-modules spécialisés pour maintenir `CivAdapter` sous 65 lignes.
- **Tests associés** : `src/engine/engine.phases.test.ts`, `src/local/local.test.ts`, `src/server/multiplayer.test.ts`.
