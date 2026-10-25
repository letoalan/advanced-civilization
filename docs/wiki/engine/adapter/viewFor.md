# Fiche Wiki : `viewFor.ts`

## 1. Fiche d'Identité
- **Fichier source** : `src/engine/adapter/viewFor.ts`
- **Rôle principal** : Masquage des informations privées (mains de cartes de commerce, cartes de calamités cachées, cartes échangées en négociation secrète) pour un joueur observateur ou distant (§27.4).
- **Domaine** : Moteur de jeu / Gestion de la vie privée & Anti-triche
- **Taille** : 21 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `../primitives.js` : Clonage profond d'état (`clone`).
- **Exports publics** :
  - `viewFor(state: GameState, _viewer: PlayerId | null): GameState`

## 3. Logique Métier & Règles Avalon Hill (§27.4)
- **Observateur global (`_viewer == null`)** : L'état complet est retourné sans masquage (pour le mode arbitre, debug ou sauvegarde maître).
- **Joueur individuel (`_viewer != null`)** :
  - La main réelle (`hand`) de chaque joueur adverse est vidée : `p.hand = {}`.
  - La liste des calamités adverses `p.calamities` est vidée.
  - Le nombre total de cartes détenues (`p.handCount`) est conservé public.
  - Dans les offres et contre-offres commerciales (`v.negotiation.offers`), les cartes réelles transférées (`give.actual`) sont masquées pour les tiers (`actual = {}`), seules les déclarations publiques (`give.stated`) restent visibles.
  - L'historique des accords terminés (`v.negotiation.completed`) n'affiche que ceux impliquant directement le joueur.

## 4. Guide de Maintenance & Réexploitabilité
- **Points de vigilance** : Toujours opérer sur un clone profond de l'état pour ne pas altérer l'état de jeu serveur réel.
- **Tests associés** : `src/server/multiplayer.test.ts`.
