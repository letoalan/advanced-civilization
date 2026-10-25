# Fiche Wiki : `calamityEvents.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/calamity/calamityEvents.ts`
- **Rôle principal** : Captures d'instantanés d'état de plateau, calcul des différentiels de dégâts pour l'affichage utilisateur (`lastCalamities`), ordonnancement des calamités en main et application du plafond officiel de 2 calamités par joueur (§29.5).
- **Domaine** : Moteur de jeu / Gestion des événements de calamité
- **Taille** : 101 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `digital-boardgame-framework` : RNG (`Rng`).
  - `../../data/index.js` : Métadonnées des calamités et descriptions (`calamityById`, `CALAMITY_DESC`).
  - `../helpers.js` : Décompte de cités et population.
  - `../logging.js` : Logs d'écartement de calamités (§29.5).
  - `../primitives.js` : Primitives d'unités (`BARBARIAN`, `isPlayer`, `PIRATE`).
  - `../phases/conflictHelpers.js` : Nom d'affichage de joueur (`pname`).
- **Exports publics** :
  - `AreaSnapshot` : Type de capture des cités et pions par province.
  - `snapAreas(s)` : Crée un instantané compact du plateau avant la résolution d'une calamité.
  - `boardOverview(s)` : Génère une ligne récapitulative des cités et pions de chaque joueur.
  - `calamitySteps(s, before, holder)` : Compare le plateau avant/après pour extraire la liste lisible des pertes et prises de cités (primaire vs secondaire).
  - `pushCalamityEvent(s, calamityId, holder, before, overviewBefore, interactive)` : Enregistre l'événement enrichi dans `s.lastCalamities` pour la modale d'animation UI.
  - `nextHeldCalamity(s)` : Identifie la prochaine calamité à résoudre selon la sévérité minimale (§29.6).
  - `heldCalamities(s)` : Liste exhaustive de toutes les calamités détenues en jeu, triées par gravité croissante puis ordre de siège.
  - `capCalamitiesPerPlayer(s, rng)` : Règle §29.5 : si un joueur détient 3+ cartes de calamité, deux sont conservées aléatoirement, les autres retournent sous leurs piles de cartes commerciales respectives.

## 3. Logique Interne & Règles Métier
- **Plafond de 2 calamités (§29.5)** :
  "No player may suffer more than two calamities in a single turn. If a player holds more than two calamity cards, two are chosen at random to take effect, and the remainder are returned to the bottom of the appropriate trade card stacks without effect."
- **Ordre de sévérité (§29.6)** :
  Les calamités sont résolues en ordre strict de gravité (1 : Volcan/Séisme, ..., 12 : Piraterie).

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Toujours appeler `snapAreas(s)` avant de débuter l'effet primaire et `pushCalamityEvent` une fois tous les effets (primaires et secondaires) complètement achevés.
- **Tests associés** : `src/engine/calamity.effects.test.ts`.
