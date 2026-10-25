# Fiche Wiki : `expansion.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/expansion.ts`
- **Rôle principal** : Gestion de la phase de croissance démographique (§18) : calcul automatique du gain de population (1 pion si 1 présent, 2 pions si 2+ présents, 0 en présence de cité) et gestion interactive des pénuries de stock avec annulation possible.
- **Domaine** : Moteur de jeu / Phase 2 — Croissance de population
- **Taille** : 85 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../helpers.js` : Ordre AST et état joueur.
  - `../logging.js` : Logs d'expansion.
  - `../primitives.js` : Manipulation de pions de plateau.
- **Exports publics** :
  - `growthCaps(s, id)` : Calcule le potentiel d'expansion par province (1 ou 2 pions, 0 si cité présente).
  - `setupPopulationExpansion(s)` : Déploie automatiquement la croissance si le stock suffit, ou ouvre une phase de placement interactif si le stock est insuffisant (§18.2).
  - `applyPlaceTokens(s, actor, placements)` : Placement manuel sous contrainte de stock limité.
  - `applyResetPlacement(s, actor)` : Annulation et reprise à zéro du placement de la phase.

## 3. Logique Interne & Règles Avalon Hill (§18)
- **Règle de croissance (§18.1)** :
  - Une province sans cité contenant exactement 1 pion gagne 1 pion supplémentaire.
  - Une province sans cité contenant 2 pions ou plus gagne 2 pions supplémentaires.
  - Les provinces contenant une cité ne connaissent aucune croissance (§20.1).
- **Gestion de pénurie (§18.2)** :
  - Si le stock est suffisant pour satisfaire toute la croissance, elle est appliquée en un seul bloc instantané.
  - Si le stock est insuffisant, le joueur place manuellement son stock restant dans les provinces éligibles selon ses priorités stratégiques.
  - Le joueur peut à tout moment utiliser `resetPlacement` pour reprendre ses choix tant qu'il n'a pas validé son tour.

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Toujours déduire le stock (`p.stock -= n`) lors du placement et le réinjecter scrupuleusement lors du reset.
- **Tests associés** : `src/engine/engine.expansion.test.ts`.
