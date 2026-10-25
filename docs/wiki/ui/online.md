# Fiche Wiki : Composants Multijoueur en Ligne (`src/ui/online`)

## 1. Fiche d'Identité
- **Fichier source** : `src/ui/online/index.ts`, `src/ui/online/Lobby.tsx`, `src/ui/online/OnlineGame.tsx`
- **Rôle principal** : Salon de création de partie distante (Lobby) et interface de jeu en ligne pilotée par `useGame` avec remontée de rapports de bugs.
- **Domaine** : Interface Utilisateur (Multijoueur Web)
- **Taille** : Moins de 170 lignes par composant (strictement < 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `digital-boardgame-framework/client` : hooks `useGame`, `useIdentity`, composant `SignInBar`.
  - `src/engine/index.js` : types et règles de jeu.
  - `src/ui/App.js` : composants modulaires du plateau, modales, contrôleurs d'action.
- **Exports publics** :
  - `Lobby` : composant de sélection des nations et de création de partie réseau ou contre IA.
  - `OnlineGame` : vue de partie en ligne avec rafraîchissement temps réel (Supabase/polling).
- **Modules dépendants** : `src/ui/main.tsx`.

## 3. Spécification de l'API Publique
### Composants
#### `<Lobby />`
- **Rôle** : Permet de choisir 2 à 6 nations compatibles avec le découpage du plateau choisi (§16), puis génère la partie et les liens d'invitation.

#### `<OnlineGame gameId={string} token={string} />`
- **Rôle** : Se connecte au serveur de jeu avec le jeton de joueur, affiche le plateau et les contrôleurs de phase adaptés aux actions légales reçues.

## 4. Logique Interne & Règles Métier
- **Filtrage des nations** : Vérifie la compatibilité des nations avec la variante de plateau sélectionnée (`availableNations`).
- **Mode classé** : Transmet l'identité du joueur authentifié pour enregistrement sur le tableau des scores.

## 5. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Maintenir l'exécution inconditionnelle des hooks React avant tout affichage d'erreur ou d'état de chargement.
