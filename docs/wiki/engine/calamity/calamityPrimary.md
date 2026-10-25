# Fiche Wiki : `calamityPrimary.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/calamity/calamityPrimary.ts`
- **Rôle principal** : Déclenchement et résolution des effets primaires des calamités majeures (Volcan/Séisme, Inondation, Révolte d'esclaves, Superstition, Désordre civil, Iconoclasme, Trahison, Piraterie).
- **Domaine** : Moteur de jeu / Effets primaires de calamités
- **Taille** : 192 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../primitives.js` : Manipulation de cités (`citiesOf`, `coastalCitiesOf`, `has`, `isPlayer`, `PIRATE`).
  - `../helpers.js` : Calculs d'état (`cityCount`, `neighbors`, `player`, `populationCount`).
  - `../logging.js` : Traçabilité des événements de calamité.
  - `../phases/surplus.js` : Réduction de cités pour le soutien (`reduceForSupport`, `reduceSpecificCity`).
  - `./calamityGeography.js` : Groupes de volcans, plaines, destruction de zones (`destroyAllInAreas`, `floodRegions`, `unitPointsInAreas`, `VOLCANO_GROUPS`).
- **Exports publics** :
  - `volcanoDamage(s, g)` : Calcul des dégâts infligés par un volcan sur un groupe de zones.
  - `enemyCityNear(s, holder, aid)` : Recherche d'une cité ennemie adjacente sans Ingénierie.
  - `resolveEruption(s, holder, group)` : Destruction totale du groupe volcanique (§30.211).
  - `resolveEarthquake(s, holder, target)` : Résolution du séisme sur la cité cible et dommage collatéral (§30.212-§30.213).
  - `startVolcano(s, holder, before, overviewBefore)` : Déclenchement de l'éruption ou du séisme selon la présence de cités volcaniques.
  - `bestFloodRegion(s, holder)` : Plaine inondable où la victime subit le plus de pertes.
  - `floodAllocationSpec(s, holder, region)` : Spécification d'allocation secondaire pour les victimes tierces de l'inondation.
  - `startSlaveRevolt(s, holder, before, overviewBefore)` : Révolte d'esclaves (verrouillage de 15 pions de population du soutien des cités, ajusté par Exploitation minière / Lumières).
  - `primaryCityCount(s, calId, holder)` : Nombre de cités à réduire pour Superstition, Désordre Civil ou Iconoclasme avec modificateurs de civilisation.
  - `razeCityToPirate(s, aid)` : Prise de cité côtière par les pirates (§30.91).
  - `startTreachery(s, victim, before, overviewBefore)` : Déclenchement de la Trahison.
  - `startFloodCity(s, victim, before, overviewBefore)` : Sélection de la cité inondée si la victime n'a pas de plaine inondable.
  - `startPiracy(s, victim, before, overviewBefore)` : Déclenchement de la Piraterie primaire (2 cités côtières) puis secondaire.
  - `setupPiracySecondary(s, victim, trader, before, overviewBefore)` : Mise en place des victimes secondaires de la piraterie.

## 3. Spécification de l'API Publique
### Fonctions clés
#### `startVolcano(s: GameState, holder: PlayerId, before: unknown, overviewBefore: string): boolean`
Si le joueur a une cité sur un site volcanique, déclenche une Éruption. En cas d'égalité sur plusieurs volcans, crée un `pendingPick`. S'il n'a pas de cité volcanique, déclenche un Séisme sur l'une de ses cités.

#### `primaryCityCount(s: GameState, calId: string, holder: PlayerId): number | null`
Calcule le nombre exact de cités perdues selon les progrès de la victime :
- Superstition : 3 cités de base, décrémenté par Déisme, Mysticisme, ou annulé par Lumières (§30.12).
- Désordre civil : toutes les cités au-delà de 3, diminué par Musique, Drame, Droit, Démocratie, augmenté par Militaire et Construction routière (§30.41).
- Iconoclasme : 4 cités, réduit par Droit, Philosophie, Théologie, augmenté par Monothéisme et Construction routière (§30.61).

## 4. Logique Interne & Règles Métier
- **Effets secondaires de séisme** : Une cité ennemie adjacente sans Ingénierie est réduite (§30.212).
- **Prise par les pirates** : Une cité prise par la piraterie devient `pirateCity = true` avec le marqueur `PIRATE`.
- **Conservation** : Les cités détruites retournent toujours dans `player.citiesAvailable`.

## 5. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Maintenir l'ordre de priorité des modificateurs de progrès civiques (ex: Théologie -3, Philosophie -1, Monothéisme +1).
- **Tests associés** : `src/engine/calamity.effects.test.ts`, `src/engine/calamity.treachery.test.ts`.
