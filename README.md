# Advanced Civilization — Édition Numérique (Atlas Antique Méditerranéen)

Portage numérique fidèle et modernisé du jeu de plateau légendaire **Advanced Civilization** d'Avalon Hill (1991), propulsé par React 19, TypeScript et [`digital-boardgame-framework`](https://www.npmjs.com/package/digital-boardgame-framework).

L'application offre une **expérience locale autonome complète** (Hotseat + IA heuristique, zéro dépendance réseau requise, sauvegarde instantanée et export/import JSON) habillée d'une direction artistique inspirée des musées archéologiques méditerranéens et des grands atlas historiques (*Atlas Antique*), tout en conservant l'infrastructure serveur pour le multijoueur asynchrone.

---

## ✨ Points Forts & Fonctionnalités

### 🏛️ Direction Artistique « Atlas Antique » & Ergonomie Moderne
- **Portail Muséal & Vidéo d'Ambiance** : Écran d'accueil immersif avec arrière-plan vidéo (*Merveilles du Monde Antique*), typographie épigraphique, panneaux en verre dépoli (*Ethereal HUD*) et sélecteur de langue.
- **Double Rendu Cartographique (`3800 × 1405` px)** : Bascule instantanée entre le thème **Atlas Antique** (mers ardoise avec ondelettes bathymétriques et calligraphie latine filigranée, terres parcheminées, frontières sépia) et le thème **Classique 1991** (rendu vectoriel sobre d'origine), ainsi que le support optionnel des planches VASSAL (`civ.vmod` mis en cache localement dans `IndexedDB`).
- **Pièces & Marqueurs Vectoriels Tactiles** : Pions de population en bois biseauté avec reflets et ombres portées, cités en silhouette d'acropole antique, galères de guerre méditerranéennes (trières à éperon rostral), citadelles pirates crénelées, pions barbares et médaillons métalliques gravés pour les volcans, plaines inondables et sites de cité.
- **Navigation Fluide & Niveau de Détail (LOD)** : Pan & Zoom focal à la molette centré sur le curseur, mini-carte interactive, centrage automatique sur la nation active, bouton de vue générale, apparition progressive des noms de provinces selon le zoom, et **Mode Regard des Dieux (*God Mode*)** activable via la barre d'`Espace` pour inspecter librement le plateau nu.
- **Cartes Illustrées & Repli CSS** : 54 illustrations dédiées au format `.webp` (`public/assets/cards/` : 18 marchandises, 12 calamités, 24 avances et dos de cartes) intégrées dans un cadre universel (`CardFrame`) avec repli vectoriel CSS doré garanti sans image brisée.
- **Internationalisation (i18n) & Audio** : Interface et données de jeu intégralement traduites en **4 langues** (**Français** par défaut, **Anglais**, **Allemand**, **Espagnol**). Synthétiseur d'effets sonores Web Audio API intégré (`soundManager` : pièces d'or, cartes, tonnerre de calamité, fanfare).

### ⚖️ Moteur de Règles Intégral & Certifié (Avalon Hill 1991)
- **Machine à États Déterministe (12 Phases)** : Implémentation complète des règles officielles (`src/engine/`) via `CivAdapter` :
  1. *Collecte des impôts* (§19) & révoltes fiscales
  2. *Expansion démographique* (§20)
  3. *Recensement* (§21) déterminant l'ordre de jeu
  4. *Construction & maintenance navale* (§22)
  5. *Mouvement terrestre & expéditions maritimes* (§23) avec planificateur interactif de trajectoire et de convoi
  6. *Conflits & assauts de cités* (§24) avec attrition round-robin, modificateurs de *Travail du Métal* / *Ingénierie*, pillage et vol de carte
  7. *Construction de cités* (§25)
  8. *Retrait des surplus & vérification du soutien des cités* (§26)
  9. *Acquisition des cartes de commerce* (§27) et achat d'Or / Ivoire dans la 9e pile (§27.5)
  10. *Négociation commerciale* (§28) bilatérale avec règle des $\ge 2$ cartes déclarées honnêtement et refilade secrète de calamités négociables
  11. *Résolution des calamités* (§29–30) : les 12 calamités complètes avec modificateurs d'avances, sélections de victimes secondaires (*Épidémie*, *Iconoclasme*), *Guerre Civile*, marche des *Hordes Barbares* et *Piraterie*
  12. *Acquisition des avances de civilisation* (§31) avec crédits de famille/prérequis et *Progression sur la piste A.S.T.* (§33–35)
- **Topologie & Découpages Géographiques (§16)** : Graphe unifié de **222 territoires** et **140 côtes** couvrant l'Occident, la Méditerranée centrale et l'Orient. Préréglages officiels selon le nombre de joueurs (2 à 8 joueurs), gestion automatique de la règle **Italie ↔ Ibérie** et des zones hors-jeu (greyouts dérivés de VASSAL).
- **Piste A.S.T. Authentique par Nation** : Seuils d'époques (*Âge du Bronze Ancien*, *Bronze Récent*, *Fer Ancien*, *Fer Récent*) spécifiques à chacune des 14 civilisations, extraits des planches individuelles et validés.
- **Conservation Stricte** : Tests automatisés garantissant l'invariance du stock de pions (55 pions, 9 cités, 4 navires par nation) et la circulation fermée des 126 cartes de commerce/calamités.

### 🤖 IA Heuristique & Session Locale Autonome
- **IA Heuristique Fair-Play (`src/ai/heuristic/`)** : Joue toutes les phases sans tricher (n'inspecte jamais les mains adverses), planifie ses expansions, mouvements, assauts, constructions de cités soutenues, achats d'avances optimisés et initie/évalue des offres commerciales mutuellement profitables.
- **Mode Hotseat & Confidentialité** : Configuration libre de 2 à 8 sièges panachant humains et IA, avec **Rideau de passage de main** (`PlayerHandoffModal`) masquant les informations secrètes entre deux joueurs humains ou mode **Table ouverte**.
- **Persistance & Diagnostic Local (`src/local/`)** : Sauvegarde automatique continue dans `localStorage` à chaque action, reprise directe depuis l'accueil, export et import de fichiers `.json` validés, et générateur de rapports de diagnostic anonymisés (`LocalDiagnosticModal`).

---

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** 18+ (recommandé : Node 20 ou 22)
- **npm**

### Installation & Lancement
```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement Vite (Hotseat + IA)
npm run dev
```
Ouvrez ensuite `http://localhost:5173` dans votre navigateur.

- Pour accéder à l'**outil développeur d'inspection géométrique des territoires et des côtes**, ouvrez `http://localhost:5173/?dev`.

---

## 🛠️ Commandes & Scripts

| Commande | Description |
| :--- | :--- |
| `npm run dev` | Lance l'interface React en mode développement avec rechargement à chaud (`http://localhost:5173`) |
| `npm run build:ui` | Compile le bundle de production de l'interface web dans `dist-ui/` |
| `npm run build` | Compile le code TypeScript serveur/moteur dans `dist/` |
| `npm test` | Exécute l'ensemble des suites de tests unitaires et d'intégration avec Vitest |
| `npm run test:watch` | Lance Vitest en mode écoute continue |
| `npm run typecheck` | Vérifie le typage statique TypeScript (`tsc --noEmit`) |
| `npm run check:lines` | Vérifie la charte architecturale : **aucun fichier de `src/` ne doit dépasser 200 lignes** |
| `npm run serve` | Compile et démarre le serveur HTTP multijoueur local (`:8787`, stockage fichier) |
| `npm run deploy` | Compile l'UI et déploie sur Cloudflare Pages (`wrangler pages deploy`) |

---

## 🗂️ Architecture du Projet

Le code source respecte une **charte de modularité stricte** : chaque fichier dans `src/` compte **moins de 200 lignes** (vérifié par `scripts/check-line-counts.mjs`) et possède sa fiche technique dédiée dans [`docs/wiki/`](docs/wiki/README.md).

```text
advanced-civilization/
├── src/
│   ├── config/          # Feature flags centraux (features.ts : mode local autonome vs réseau)
│   ├── data/            # Données JSON validées (222 zones, adjacences, côtes, 24 avances, 12 calamités,
│   │                    # 18 marchandises, 14 civilisations, pistes AST) & adaptateur cartographique
│   ├── engine/          # Moteur de règles déterministe (CivAdapter, 12 phases, calamités, topologie, tests)
│   ├── ai/              # Contrôleur HeuristicAI modulaire (mouvement, combat, commerce, avances, navires)
│   ├── local/           # Couche locale autonome (sessions, sauvegarde localStorage, import/export JSON, diagnostic)
│   ├── ui/              # Client React 19
│   │   ├── cards/       # Composants de cartes illustrées (Marchandises, Calamités, Avances, Main du joueur)
│   │   ├── components/  # Plateau SVG (Atlas Antique & Classique), HUD, Barre Impériale, Codex, Phases, Modales
│   │   ├── dev/         # Éditeur et inspecteur de géométrie des territoires et côtes (?dev)
│   │   ├── hooks/       # Hooks d'animation, drag-and-drop de cartes, mode focus et accessibilité
│   │   ├── i18n/        # Dictionnaires de traduction complets (FR, EN, DE, ES)
│   │   ├── online/      # Composants de salon et partie multijoueur en ligne
│   │   ├── screens/     # Portail d'accueil (HomeScreen), Configuration de partie (LocalSetupScreen), Vidéo
│   │   ├── sound/       # Synthétiseur d'effets sonores Web Audio API (soundManager.ts)
│   │   └── theme/       # Design tokens CSS, icônes vectorielles et préférences utilisateur (settingsStore.ts)
│   ├── client/          # Client HTTP & Supabase Realtime pour le mode en ligne
│   └── server/          # Serveur de jeu (GameServer, routeur HTTP/Cloudflare Workers, persistance)
├── public/
│   ├── assets/cards/    # Illustrations WebP des 54 cartes et dos de cartes
│   └── medias/          # Vidéo d'ambiance et planches PDF de référence des cartes illustrées
├── docs/
│   ├── wiki/            # Documentation technique exhaustive fichier par fichier
│   ├── GUIDE_TESTEUR.md # Guide pas-à-pas de recette et de validation fonctionnelle
│   └── *.md             # Rapports d'audit cartographique, géoréférencement et journal d'événements
├── scripts/             # Scripts d'extraction VASSAL, génération de graphes côtiers et contrôle qualité
└── functions/           # Point d'entrée serverless Cloudflare Pages Functions (/api/*)
```

---

## 📚 Documentation & Guides

- **[Wiki Technique Complet (`docs/wiki/README.md`)](docs/wiki/README.md)** : Index général documentant individuellement chaque module du moteur, de l'IA, de la couche locale et de l'interface.
- **[Modernisation Cartographique (`docs/wiki/cartography-modernization.md`)](docs/wiki/cartography-modernization.md)** : Détails sur la direction artistique *Atlas Antique*, le rendu vectoriel et l'ergonomie du plateau.
- **[Guide du Testeur (`docs/GUIDE_TESTEUR.md`)](docs/GUIDE_TESTEUR.md)** : Procédures de test pour les parties locales, le rideau de confidentialité Hotseat, la navigation sur la carte et les sauvegardes.

---

## 🌐 Mode Multijoueur Asynchrone (Optionnel)

Par défaut, l'application est configurée en **mode local autonome** (`src/config/features.ts` avec `onlineMultiplayer: false`), garantissant un fonctionnement 100 % hors-ligne sans aucune requête externe.

L'infrastructure complète pour le multijoueur en ligne (`src/server/`, `src/client/`, `functions/api/[[path]].ts`, `supabase/schema.sql`) reste présente et opérationnelle :
1. Activez les drapeaux souhaités dans `src/config/features.ts`.
2. Pour tester en local avec stockage sur disque : `npm run serve` (port `:8787`).
3. Pour déployer en production sur **Cloudflare Pages + Supabase**, appliquez `supabase/schema.sql` et configurez les variables `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (et optionnellement `RESEND_API_KEY`, `MAIL_FROM`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

---

## 📜 Licence & Crédits

Le code source original de ce dépôt (moteur de règles, intelligence artificielle, serveur et interface utilisateur) est distribué sous licence **[MIT](LICENSE)** © 2026 John Champaign.

*Advanced Civilization* est un jeu conçu par Francis Tresham et publié à l'origine par Avalon Hill (dont l'héritage se poursuit aujourd'hui avec *Mega Civilization* chez Eagle-Gryphon Games). Les données structurelles (graphe des régions, tables de coûts, caractéristiques des cartes et pistes A.S.T.) sont incluses à des fins d'interopérabilité. Ce projet non officiel est réalisé par des passionnés et n'est ni affilié à, ni approuvé par les détenteurs des droits originaux.
