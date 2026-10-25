# Fiche Wiki : `movement.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/phases/movement.ts`
- **Rôle principal** : Exécution de la phase de mouvements terrestres et maritimes (§23) : déplacements simples, traversées routières de 2 provinces (*Construction routière*), et voyages maritimes avec embarquement/débarquement d'unités (portée 4 ou 5 avec *Manufacture textile*, traversée de mer ouverte avec *Astronomie*).
- **Domaine** : Moteur de jeu / Phase 5 — Mouvements
- **Taille** : 121 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../../data/index.js` : Métadonnées et graphe de voisinage maritime (`shipNeighbors`).
  - `../helpers.js` : Recherche de chemin maritime et provinces hors jeu (`shipReachable`, `outOfPlay`).
  - `../logging.js` : Logs d'étapes de voyage et mouvements terrestres.
  - `../primitives.js` : Noms de zones et application de pions.
- **Exports publics** :
  - `applyVoyage(s, actor, steps, arrivedOverland, debarked)` : Valide et résout une traversée maritime multi-étapes avec chargement/déchargement de troupes.
  - `applyMovement(s, actor, moves, voyages)` : Applique l'ensemble des mouvements terrestres et navals d'un joueur pendant son tour.

## 3. Logique Interne & Règles Avalon Hill (§23)
- **Mouvement terrestre simple (§23.3)** : Déplacement d'une province vers une province terrestre adjacente.
- **Construction routière (§32.251)** : Permet de traverser 2 provinces en un tour à condition que la province intermédiaire soit libre de toute présence ou cité ennemie.
- **Voyage maritime (§23.5)** :
  - Un navire transporte au maximum 5 pions de population (§23.51).
  - Portée de 4 zones (portée 5 avec *Manufacture textile*, §23.53).
  - Traversée de la haute mer interdite sauf possession d'*Astronomie* (§23.54).
  - Aucun navire ne peut terminer son mouvement en haute mer (§23.55).
  - Règle de cohérence côtière : un navire doit ressortir d'une province côtière par le même littoral que celui par lequel il est entré (§23.57).
  - Aucun pion ne peut rester à bord d'un navire à la fin de la phase de mouvement (§23.56).

## 4. Tests Associés
- `src/engine/ships.movement.test.ts`
- `src/engine/ships.voyages.test.ts`
- `src/engine/ships.topology.test.ts`.
