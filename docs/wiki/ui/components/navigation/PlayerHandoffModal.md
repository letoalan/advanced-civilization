# Fiche Wiki : PlayerHandoffModal.tsx

## 1. Fiche d'Identité
- **Fichier source** : `src/ui/components/navigation/PlayerHandoffModal.tsx`
- **Rôle principal** : Rideau de confidentialité plein écran interdisant la révélation accidentelle des mains de cartes lors du changement de joueur en mode hotseat sur un même écran.
- **Domaine** : Interface Utilisateur / Confidentialité
- **Taille** : ~105 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `src/data/index.ts` : consultation des couleurs et noms officiels des civilisations (`civById`).
  - `src/local/types.ts` : consultation du siège actif (`LocalSeat`).
- **Modules dépendants** : Conteneur de jeu (`GameScreen` / `App.tsx`).

## 3. Spécification de l'API Publique
```typescript
<PlayerHandoffModal
  actor="babylon"
  seat={{ civilizationId: 'babylon', controller: 'human', displayName: 'Alice' }}
  onReveal={() => setHandoffPending(false)}
  onSwitchToOpenTable={() => setPrivacyMode('open-table')}
/>
```

## 4. Logique Interne & Règles Métier
- **Protection des mains cachées (§27.4 & §28)** : Dans Advanced Civilization, les mains de cartes et les calamités reçues en échange sont secrètes. Lorsqu'un humain passe la main à un autre humain, la modale occulte intégralement l'écran jusqu'à ce que le joueur actif clique sur « Afficher mon tour ».
- **Option Table Ouverte** : Permet de désactiver cette barrière pour les parties conviviales ou didactiques où les joueurs jouent cartes sur table.

## 5. Guide de Maintenance
- Le composant doit rester autonome et ne jamais dépendre du moteur de jeu directement.
