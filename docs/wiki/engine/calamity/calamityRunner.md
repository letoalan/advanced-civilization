# Fiche Wiki : `calamityRunner.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/calamity/calamityRunner.ts`
- **Rôle principal** : Orchestrateur central de la phase de calamités : boucle d'exécution par sévérité croissante (§29.6), mise en pause pour choix interactifs, traitement des effets secondaires en file d'attente, et transition finale vers le soutien des cités.
- **Domaine** : Moteur de jeu / Orchestration des Calamités
- **Taille** : 160 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `digital-boardgame-framework` : RNG (`Rng`).
  - `../../data/index.js` : Métadonnées (`calamityById`).
  - `../helpers.js` : Fonctions d'état (`cityCount`, `player`).
  - `../logging.js` : Logs d'exécution.
  - `../primitives.js` : Primitives d'unités (`has`).
  - `../phases/monotheism.js` : Conversion de Monothéisme post-calamité (`setupCalamityConversion`).
  - `../phases/surplus.js` : Vérification du soutien des cités (`checkCitySupport`).
  - `./calamityBarbarians.js` / `./calamityCivilWar.js` : Déclencheurs spécifiques (`startBarbarians`, `startCivilWar`).
  - `./calamityEvents.js` : Événements et plafonds (`capCalamitiesPerPlayer`, `nextHeldCalamity`, `pushCalamityEvent`, `snapAreas`).
  - `./calamityGeography.js` / `./calamityPrimary.js` : Calculs de dégâts primaires et secondaires.
- **Exports publics** :
  - `secondaryAllocationFor(s, calId, holder)` : Détermine si la calamité génère des effets secondaires nécessitant une allocation par la victime principale.
  - `startPrimary(s, calId, holder, before, overviewBefore, rng)` : Initie l'effet primaire de la calamité.
  - `finishPrimary(s, calId, holder, before, overviewBefore, interactive)` : Poursuit vers les effets secondaires ou consigne l'événement si aucun choix secondaire n'est requis.
  - `resumeAfterChoice(s, calId, holder, before, overviewBefore)` : Reprend la boucle après qu'un joueur a résolu un choix primaire.
  - `finalizePick(s, calamityId, victim, before, overviewBefore)` : Enregistre l'événement issu d'un pick interactif et relance `runCalamity`.
  - `startNextSecondary(s)` : Dépile et exécute les pertes secondaires des autres joueurs séquentiellement.
  - `runCalamity(s)` : Fonction motrice exécutant toutes les calamités en main jusqu'à épuisement ou mise en pause pour choix.

## 3. Logique Interne & Cycle de Vie
```text
runCalamity(s)
 ├── 1. Si premier appel : capCalamitiesPerPlayer (règle des 2 calamités max)
 ├── 2. Boucle while (next = nextHeldCalamity(s)) [ordre de gravité]
 │       ├── Défausse de la carte sous sa pile commerciale (§29.4)
 │       ├── startPrimary(...)
 │       │     └── Si interaction requise -> pause (sauvegarde RNG et retour)
 │       └── finishPrimary(...)
 │             └── Si allocation secondaire requise -> pause (pendingAllocation)
 └── 3. Toutes calamités résolues :
         ├── calamityActive = false
         ├── setupCalamityConversion (si un joueur possède Monothéisme)
         └── checkCitySupport(s) (élimination des cités non soutenues)
```

## 4. Spécification de l'API Publique
#### `runCalamity(s: GameState): void`
Moteur idempotent de résolution des calamités. Si une interaction est nécessaire, `s.pendingPick`, `s.pendingUnitLoss`, `s.pendingCityChoice`, `s.pendingCivilWar`, ou `s.pendingAllocation` est positionné et la fonction retourne immédiatement pour laisser le joueur agir via l'interface.

#### `finalizePick(s: GameState, calamityId: string, victim: PlayerId, before: AreaSnapshot, overviewBefore: string): void`
Complète une sélection nommée issue de `calamityNamedPicks.ts`, consigne l'événement et réenclenche `runCalamity(s)`.

## 5. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Toujours sérialiser `s.rngState` avant toute pause d'interaction pour assurer un déterminisme parfait en reprise de partie / rejeu.
- **Tests associés** : Tous les tests `src/engine/calamity.*.test.ts`.
