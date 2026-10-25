# Fiche Wiki : Sous-système des Calamités (`src/engine/calamity/`)

## 1. Fiche d'Identité
- **Dossier source** : `src/engine/calamity/`
- **Rôle principal** : Résolution exhaustive des 12 calamités officielles d'Avalon Hill 1991 (§29-§30) avec gestion des effets primaires, secondaires, plafonnement à deux calamités, choix interactifs et files d'attente.
- **Domaine** : Moteur de jeu / Calamités.
- **Taille globale** : 8 modules spécialisés, tous strictement < 200 lignes :
  - [calamityGeography.ts](calamityGeography.md) (105 lignes) : Zones inondables, volcans, calcul de points d'unités.
  - [calamityPrimary.ts](calamityPrimary.md) (192 lignes) : Déclenchements primaires (Séisme, Éruption, Inondation, Révolte d'esclaves, calculs de pertes de cités).
  - [calamityCivilWar.ts](calamityCivilWar.md) (160 lignes) : Sélection et annexion des factions lors d'une Guerre Civile (§30.41).
  - [calamityBarbarians.ts](calamityBarbarians.md) (112 lignes) : Débarquement, marche, et colonisation des Hordes Barbares (§30.52).
  - [calamityPicks.ts](calamityPicks.md) (179 lignes) : Allocations secondaires, choix des unités sacrifiées et poterie/céréales (§30.312).
  - [calamityNamedPicks.ts](calamityNamedPicks.md) (141 lignes) : Choix nominatifs de cités (Trahison, Piraterie, Cité inondée, Choix du site volcanique).
  - [calamityEvents.ts](calamityEvents.md) (101 lignes) : Instantanés avant/après, calcul des diffs d'effets pour la modale, tri par gravité et plafond des 2 calamités (§29.5).
  - [calamityRunner.ts](calamityRunner.md) (160 lignes) : Boucle générale d'exécution, ordonnancement par gravité croissante et reprises après décision.

## 2. Architecture & Dépendances
- **Flux d'Exécution** :
  ```text
  Phase Calamité (enterPhase)
         │
         ▼
  runCalamity() [calamityRunner.ts]
         │
         ├── 1. Plafond 2 calamités par joueur (§29.5) [calamityEvents.ts]
         ├── 2. Tri par gravité croissante (§29.6) [calamityEvents.ts]
         ├── 3. Déclenchement de l'effet primaire [calamityPrimary / CivilWar / Barbarians / NamedPicks]
         │      ├── Si choix joueur requis ──> PAUSE (pendingCityChoice / pendingUnitLoss / pendingCivilWar...)
         │      └── Si auto ──> application immédiate
         ├── 4. Déclenchement de l'effet secondaire [calamityPicks / calamityRunner]
         │      ├── Si allocation requise ──> PAUSE (pendingAllocation)
         │      └── Si choix victime ──> PAUSE séquentielle (startNextSecondary)
         └── 5. Fin de la calamité ──> Enregistrement dans lastCalamities et passage à la suivante
  ```

## 3. Spécification des Règles Métier Modélisées
1. **Plafond de 2 calamités primaires par joueur (§29.5)** : Si un joueur détient 3+ cartes de calamité, deux sont tirées au sort, les autres sont défaussées sans effet au fond de leur pile respective.
2. **Ordre de gravité (§29.6)** : Résolution en ordre de sévérité croissante (1 à 12).
3. **Poterie et Famine (§30.312)** : Le joueur possédant Poterie peut engager des cartes Céréales pour réduire la perte de 4 points par carte.
4. **Guerre Civile (§30.41)** : La faction 1 est choisie par la victime (15 pts + Musique/Drame/Démocratie) et le bénéficiaire (20 pts), puis la victime choisit quelle faction conserver.
5. **Hordes Barbares (§30.52)** : 15 pions neutres débarquent dans la zone de départ la plus destructrice, combattent, puis le surplus au-delà de la capacité d'accueil marche vers les zones adjacentes infligeant le plus de dégâts.
6. **Inondation (§30.51)** : Se produit dans la plaine inondable où la victime a le plus de points d'unités (limité à 17 pts, ou 7 avec Ingénierie).
7. **Monothéisme (§32.94)** : Conversion d'une zone ennemie adjacente en fin de phase de calamité.

## 4. Tests Associés
- `src/engine/calamity.barbarians.test.ts`
- `src/engine/calamity.civilwar.test.ts`
- `src/engine/calamity.effects.test.ts`
- `src/engine/calamity.geography.test.ts`
- `src/engine/calamity.secondary.test.ts`
- `src/engine/calamity.treachery.test.ts`
