# Fiche Wiki : LocalDiagnosticModal.tsx

## 1. Fiche d'Identité
- **Fichier source** : `src/ui/components/modals/LocalDiagnosticModal.tsx`
- **Rôle principal** : Interface utilisateur pour exporter un rapport de diagnostic technique complet au format texte ou dans le presse-papiers, sans aucun recours au réseau.
- **Domaine** : Interface Utilisateur / Diagnostics
- **Taille** : ~130 lignes (< 200 lignes)

## 2. Architecture & Dépendances
- **Imports clés** :
  - `src/local/diagnostics.ts` : génération du texte de rapport et déclenchement du téléchargement.
- **Modules dépendants** : Barre de commande inférieure (`ControlBar.tsx` / `App.tsx`).

## 3. Spécification de l'API Publique
```typescript
<LocalDiagnosticModal
  state={gameState}
  config={sessionConfig}
  onClose={() => setModalOpen(false)}
/>
```

## 4. Logique Interne & Sécurité
- **Respect de la vie privée** : Permet d'anonymiser les noms saisis par les joueurs.
- **Avertissement de divulgation** : Prévient l'utilisateur que l'inclusion de l'état complet peut révéler les mains de cartes cachées.
- **Zéro télémétrie** : Fonctionne de manière 100 % déconnectée.
