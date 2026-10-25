# Fiche Wiki : `taxation.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/taxation.ts`
- **Rôle principal** : Gestion de la phase de taxation (§19) : collecte des impôts, passage de stock vers le trésor, gestion des défauts de paiement et prise de contrôle des cités révoltées par les rivaux.
- **Domaine** : Moteur de jeu / Phase 1 — Taxation
- **Taille** : 84 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../helpers.js` : Ordre AST, compte de cités et état joueur (`astOrder`, `cityCount`, `player`).
  - `../logging.js` : Traçabilité des impôts et révoltes.
  - `../primitives.js` : Primitives d'unités (`areaName`, `citiesOf`, `has`, `isPlayer`).
- **Exports publics** :
  - `collectTax(s, id, rate)` : Prélève l'impôt pour un joueur au taux indiqué (1 à 3).
  - `bestRevoltTaker(s, owner)` : Identifie le rival prioritaire ayant le plus de réserves pour s'emparer d'une cité révoltée (§19.32).
  - `resolvePendingRevolts(s)` : Résout les révoltes en ordre AST ; met en pause si un choix de cité par le rival est nécessaire.
  - `setupTaxation(s)` : Initialise la phase de taxation en prélevant automatiquement à taux 2 (sauf pour les détenteurs de *Monnayage* qui choisissent leur taux).

## 3. Logique Interne & Règles Avalon Hill (§19)
- **Taux standard et Monnayage (§19.1 - §19.2)** : Le taux par défaut est de 2 pions par cité versés au trésor. Avec *Monnayage*, le joueur peut choisir un taux de 1, 2 ou 3.
- **Défaut de paiement & Démocratie (§19.31, §19.34)** : Si le stock est insuffisant pour couvrir toutes les cités, le joueur paie pour le maximum possible, et les cités restantes se révoltent. Les détenteurs de *Démocratie* sont exempts de révolte.
- **Prise de contrôle (§19.32)** : Le rival ayant le plus de réserves (stock + 5 * cités dispo) qui possède encore une pièce de cité disponible choisit quelle cité révoltée il annexe. Si aucun joueur ne peut reprendre la cité, celle-ci s'effondre (§19.33).

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Les révoltes sont toujours résolues **après** que tous les joueurs ont payé leurs impôts pour éviter que le paiement d'un joueur ne dépende d'une annexion intervenue au même tour.
- **Tests associés** : `src/engine/engine.phases.test.ts`.
