# Fiche Wiki : `currentActor.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/adapter/currentActor.ts`
- **Rôle principal** : Résolution du joueur actif courant en tenant compte des priorités d'interruptions (démarrage, 9e carte, défausse, pillage, soutien des cités, choix de calamités, négociations commerciales, ou ordre de tour standard).
- **Domaine** : Moteur de jeu / Gestion de tour
- **Taille** : 23 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../helpers.js` : Joueur actif standard selon la phase (`actingPlayer`).
  - `../calamity/calamityCivilWar.js` : Joueur actif en guerre civile (`civilWarActor`).
  - `../phases/tradeNegotiation.js` : Joueur actif en phase commerciale (`tradeActor`).
  - `../primitives.js` : Ensemble des phases automatiques (`AUTO_PHASES`).
- **Exports publics** :
  - `currentActor(state: GameState): PlayerId | null`

## 3. Logique Interne & Priorités de Décision
La fonction résout le joueur actif dans l'ordre strict de priorité suivant :
1. `pendingStart` : joueur devant choisir son placement initial.
2. `ninthStack.awaiting` : joueur éligible à la 9e carte de commerce.
3. Fin de partie en phase de taxation : `null`.
4. `pendingDiscard` : joueur devant défausser son excédent de cartes commerciales (§27).
5. `pendingPillage` : agresseur choisissant les cartes pillées (§20.5).
6. `pendingSupport` : joueur réduisant ses cités non soutenues (§21).
7. `AUTO_PHASES` (recensement, etc.) : `null` (aucun joueur n'est attendu).
8. Interruptions de calamité :
   - `pendingCityChoice` : joueur réduisant des cités.
   - `pendingUnitLoss` : joueur sacrifiant des unités.
   - `pendingAllocation` : victime primaire distribuant les pertes secondaires.
   - `pendingCivilWar` : victime ou bénéficiaire constituant/choisissant une faction.
   - `pendingPick` : joueur effectuant un choix de province nommée.
9. Phase de commerce : `tradeActor` (joueur dont une offre ou contre-proposition attend une réponse).
10. Par défaut : `actingPlayer(state)`.

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Ne jamais réintroduire d'import circulaire en important des types d'orchestration ; `AUTO_PHASES` est importé directement depuis `primitives.ts`.
- **Tests associés** : `src/engine/engine.phases.test.ts`.
