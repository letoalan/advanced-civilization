# Fiche Wiki : Adaptateur de Jeu (`src/engine/adapter/`)

## 1. Fiche d'Identité
- **Dossier source** : `src/engine/adapter/`
- **Rôle principal** : Implémentation du contrat `GameAdapter<GameState, Action, PlayerId>` pour intégration avec `digital-boardgame-framework`, dispatching des actions et masquage d'informations secrètes.
- **Domaine** : Moteur de jeu / Game Adapter.
- **Taille globale** : 6 modules spécialisés, tous strictement < 200 lignes :
  - [CivAdapter.ts](CivAdapter.md) (61 lignes) : Classe principale implémentant `GameAdapter`.
  - [currentActor.ts](currentActor.md) (23 lignes) : Détermination du joueur en cours de décision.
  - [legalActions.ts](legalActions.md) (180 lignes) : Énumération des actions jouables pour l'acteur actuel.
  - [viewFor.ts](viewFor.md) (21 lignes) : Masquage des mains et offres secrètes pour un spectateur (§27.4).
  - [applyAction.ts](applyAction.md) (189 lignes) : Dispatching des actions régulières et normalisation.
  - [applyCalamityAction.ts](applyCalamityAction.md) (165 lignes) : Dispatching des actions interactives de calamité.

## 2. Spécification de l'API Publique
### Méthodes de `CivAdapter`
#### `currentActor(state: GameState): PlayerId | null`
- Renvoie l'identifiant du joueur dont c'est le tour d'agir (choix de départ, achat pile 9, défausse, soutien, pillage, calamités, ou joueur actif de la phase).

#### `legalActions(state: GameState, actor: PlayerId): Action[]`
- Énumère l'ensemble des actions disponibles pour `actor`. Si `actor !== currentActor(state)`, renvoie un tableau vide `[]`.

#### `viewFor(state: GameState, viewer: PlayerId | null): GameState`
- Renvoie une vue filtrée préservant les informations secrètes : le nombre total de cartes des rivaux reste visible, mais la liste de leurs cartes est masquée, de même que le contenu réel des offres non encore conclues.

#### `applyAction(state: GameState, action: Action, actor: PlayerId): GameState`
- Applique l'action sur une copie profonde de l'état, puis déclenche `normalize(s)` pour avancer automatiquement jusqu'au prochain point de décision.

## 3. Tests Associés
- `src/engine/engine.setup.test.ts`
- `src/engine/engine.data.test.ts`
- `src/server/multiplayer.test.ts`
