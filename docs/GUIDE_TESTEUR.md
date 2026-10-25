# Guide du Testeur — Advanced Civilization (Version Locale Autonome)

Bienvenue dans le guide de test de la version numérique locale autonome d'**Advanced Civilization** (Avalon Hill 1991).

---

## 1. Démarrage de l'Application

### Prérequis
- Node.js (version 18 ou supérieure)
- Navigateur web moderne (Chrome, Firefox, Edge, Safari)

### Lancement en mode développement
```powershell
npm run dev
```
Ouvrez votre navigateur à l'adresse indiquée (généralement `http://localhost:5173/`).

---

## 2. Parcours de Test Recommandés

### Test 1 : Configuration et Lancement de Partie Locale
1. Sur l'écran d'accueil en français, cliquez sur **« Nouvelle Partie Locale »**.
2. Sur l'écran de configuration :
   - Choisissez entre 2 et 8 civilisations.
   - Attribuez le rôle de chaque siège : **Humain (Hotseat)** ou **IA Heuristique**.
   - Sélectionnez la variante de plateau : *Full Board*, *Western Expansion*, etc.
   - Choisissez le mode de confidentialité : **Rideau de passage de main (recommandé)** ou **Table ouverte**.
3. Cliquez sur **« Lancer la partie »**.
4. **Vérification** : La partie démarre directement sans aucun appel réseau sortant.

---

### Test 2 : Rideau de Confidentialité Hotseat (Passage de main)
1. Lors du passage d'un joueur humain à un autre joueur humain sur la même machine, un écran opaque apparaît :
   - Affiche le nom de la nation appelée à jouer.
   - Masque l'ensemble du plateau et des cartes en main.
2. Le nouveau joueur clique sur **« Prêt, voir mon jeu »** pour révéler son interface.
3. **Vérification** : Aucun adversaire ne peut voir les cartes en main ni les offres secrètes du joueur précédent.

---

### Test 3 : Affichage des Cartes et Repli Visuel (CSS Fallback)
1. Rendez-vous dans l'onglet **Commerce**, **Inventaire** ou lors de l'achat d'**Avances de civilisation**.
2. Observez le rendu des cartes :
   - Si les fichiers `.webp` sont présents dans `public/assets/cards/`, l'illustration apparaît.
   - En l'absence d'image, le composant bascule sans erreur vers un encadrement or antique avec texture CSS, badge de valeur et cartouche français.
3. **Vérification** : Aucun plantage React ou icône d'image brisée.

---

### Test 4 : Cartographie Interactive (Pan & Zoom)
1. Sur la vue principale du plateau de jeu :
   - **Glisser-Déplacer (Click & Drag)** : Cliquez n'importe où sur la carte et faites glisser pour déplacer la vue.
   - **Zoom Molette (Wheel Zoom)** : Utilisez la molette de la souris pour zoomer avant ou arrière.
   - **Mini-carte** : Cliquez sur la mini-carte en bas à droite pour repositionner immédiatement la caméra.
2. **Vérification** : La navigation est fluide et les pions/cités restent parfaitement positionnés sur leurs provinces.

---

### Test 5 : Sauvegarde Locale Automatique et Export/Import JSON
1. Jouez quelques actions (placement de pions, mouvements, ou phase de commerce).
2. Rechargez la page du navigateur (`F5`).
3. **Vérification** : La partie reprend exactement au même point de décision (stockée dans `localStorage`).
4. Dans le menu de contrôle, cliquez sur **« Exporter la sauvegarde »** : un fichier `advciv-save-*.json` est téléchargé.
5. Sur l'écran d'accueil, cliquez sur **« Charger une sauvegarde »** et importez le fichier : la partie reprend fidèlement.

---

### Test 6 : Validation Technique Complète
Pour exécuter les contrôles de qualité automatisés :
```powershell
# 1. Contrôle strict de la règle des 200 lignes
node scripts/check-line-counts.mjs

# 2. Contrôle statique TypeScript
npm run typecheck

# 3. Exécution de tous les tests unitaires et d'intégration
npm test

# 4. Compilation de production UI
npm run build:ui
```
**Critère de succès** : 100 % de réussite sur chaque commande.
