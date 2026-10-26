# ux-plateau-deluxe.md — Spécifications UX Piste 3 & Refonte du Plateau de Jeu

## 1. Vision et Orientation Générale

Le projet adopte la **Piste 3 (« Plateau Physique Numérique Deluxe »)** : l'interface et le plateau doivent procurer la sensation d'un jeu de société haut de gamme (matières nobles, gravure, encadrements cuivrés/bronze, textures papyrus et cire), tout en exploitant les forces du numérique (fluidité, affichage adaptatif, interactions nettes).

Le plateau actuel souffre d'un aspect trop « aplat vectoriel brut » (bords noirs épais, contrastes durs, mer uniforme sans profondeur). Il doit devenir une pièce d'orfèvrerie cartographique tout en préservant à 100 % la logique et la géométrie des 222 zones.

---

## 2. Refonte Spécifique du Plateau de Jeu

### A. Rendu des Mers et des Littoraux (*Mare Nostrum*)
- **Dégradé bathymétrique subtil :** Remplacer le bleu pétrole plat par un dégradé radial/linéaire profond (bleu ardoise impérial `#102a3a` vers turquoise antique sombre `#1a4254` au large).
- **Lignes de rivage concentriques (*Ripples*) :** 2 à 3 filets clairs très fins (opacité 20-35 %) suivant le profil des côtes pour donner vie au littoral méditerranéen.
- **Toponymie maritime gravée :** Noms des mers (*Mare Nostrum*, *Sinus Persicus*, *Pontus Euxinus*) intégrés directement dans le fond marin avec une typographie romaine noble (*Cinzel* ou serif lapidaire), en lettres capitales incurvées à faible opacité (25-30 %), ne gênant aucun pion.

### B. Traitement des Terres et des Frontières
- **Texture parchemin/cuir clair :** Délicate texture grainée ivoire/sable (`#ebd9b4` vers `#dfc698`), sans bruit agressif, assurant un contraste maximal pour les pions de couleur.
- **Hiérarchisation des tracés :**
  1. *Trait de côte (terre/mer) :* Ligne noire nette et élégante (1.8px) soulignée d'un liseré chaud.
  2. *Frontières entre provinces :* Trait fin brun sépia ou bronze estompé (1px, opacité 60 %) pour structurer sans encombrer.
  3. *Provinces hors-jeu (Veil §16) :* Hachures de gravure antique ou teinté ardoise désaturé, clairement distinct des zones jouables.
- **Reliefs et grands fleuves gravés :** Estompage doux des chaînes de montagnes (Atlas, Alpes, Taurus, Zagros) sous forme de gravures à l'ancienne et tracé bleu fin des fleuves historiques (Nil, Tigre, Euphrate, Danube).

### C. Noms de Provinces et Indicateurs de Capacité
- **Intégration organique :** Remplacer les infobulles carrées flottantes par une typographie posée sur la province (ex : *Ionia*, *Corduba*, *Etruria*) visible dès le zoom intermédiaire.
- **Badge de capacité élégant :** Petite cartouche ronde ou sceau discret indiquant la limite de population (`≤2`, `≤3`, `≤4`), placé à côté de l'ancre du territoire.

---

## 3. Matérialité des Pièces de Jeu (Composants Tactiles)

| Élément | Rendu Actuel | Rendu « Plateau Deluxe » |
| :--- | :--- | :--- |
| **Pions de Population** | Carrés plats avec chiffre | Jetons circulaires biseautés façon bois laqué ou résine d'époque, avec chanfrein lumineux supérieur, ombre portée douce (`drop-shadow`), et chiffre gravé blanc cerclé de noir. |
| **Cités sur site naturel (coût 6)** | Octogone plat monochrome | Cité fortifiée antique en perspective cavalière légère (temple ou acropole crénelée), aux couleurs héraldiques de la faction, avec relief marqué. |
| **Cités hors site (coût 12)** | Identique au site | Variante visuelle renforcée (double enceinte ou base monumentale). |
| **Navires** | Emoji `⛵` | Galère / Trière grecque ou phénicienne vectorielle stylisée, coque bois patiné, voile aux armes de la civilisation, pavillon de proue. |
| **Marqueurs neutres** | Icônes sommaires | Médaillons de fer battu : gladius croisés pour les Barbares (⚔), pavillon noir à tête de mort gravée pour les Cités Pirates (☠). |

---

## 4. Architecture de l'Interface Globale (HUD & UX)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Écusson Civ + Nom]  [Ère / AST]  [Pop: 53/55] [Cités: 2/9] [Or: 0]   │ ← Bandeau Supérieur
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                                                                        │
│                             PLATEAU CENTRAL                            │
│                        (100% de l'espace utile)                        │
│                                                                        │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│ [🗂️ Fiches Civs]   [🏛️ Progrès]   [🏺 Commerce]   [📜 Chroniques]      │ ← Barre d'Outils
│ ────────────────────────────────────────────────────────────────────── │
│ ▶ PHASE NAVALE : Construire à Corduba (2 pop)   [ TERMINER LE TOUR ➔ ] │ ← Ruban d'Action
└────────────────────────────────────────────────────────────────────────┘
```

### A. Bandeau Supérieur (Tableau de Bord Impérial)
- **Cadre :** Frise discrète en bronze martelé ou bois sombre avec liseré d'or patiné.
- **Identité de faction :** Médaillon orné de la civilisation active (ex. *Iberia* en vert olive noble), rappel de l'Ère (*Âge de Pierre*) et position sur l'AST.
- **Ressources sous forme de coffrets :** 
  - *Population :* Icône de jeton avec jauge Réserve / En jeu.
  - *Cités :* Cités construites / Stock disponible.
  - *Flotte :* Navires à flot / Cale sèche.
  - *Trésor :* Bourses de pièces antiques dorées.

### B. Suppression du Panneau Latéral Droit & Maximisation du Plateau
- Le plateau de jeu s'étend désormais sur **toute la largeur de l'écran**.
- La minimap fixe est retirée : un bouton discret en haut à droite permet un recentrage instantané (*Vue d'ensemble* ou *Ma zone*).

### C. Ruban d'Action Inférieur (Plateau de Décision)
- Situé en bas au centre, ce bandeau horizontal réunit l'ensemble des interactions de la phase active.
- **Phase navale / Déplacement :** Sélection de la province concernée avec bouton d'action tactile clair : `[ + Construire Galère (2 pop) ]`.
- **Validation maîtresse :** Grand bouton doré biseauté à droite : `[ Terminer la phase navale (Passer) ➔ ]`.

### D. Tiroirs Modaux Riches (*Overlays Thématiques*)
Les vues secondaires s'ouvrent en superposition élégante façon parchemins déroulés :
1. **L'Arbre des Progrès :** Grand codex antique sur fond de papyrus, regroupant les 24 civilisations par familles (Arts, Métiers, Sciences, Religion, Civisme) avec leurs réductions croisées reliées par des enluminures dorées.
2. **La Table de Négociation (Commerce) :** Vue modale spatialisée où les cartes de marchandises sont de véritables cartes à jouer illustrées (Vin, Étain, Soie, Or...), facilitant la sélection des 3 cartes à échanger.
3. **Le Registre AST :** Frise chronologique monumentale à 16 cases gravées dans la pierre, avec les jetons des 14 nations progressant vers 1600.
4. **Les Chroniques (Journal) :** Livre des annales historiques avec filtres par tour et par civilisation.

---

## 5. Plan de Travail pour Antigravity

1. **Jalon 1 (Plateau) :** Remplacement des aplats actuels par le fond parchemin texturé, les littoraux en dégradé d'eau et les tracés de frontières sépia allégés.
2. **Jalon 2 (HUD & Disposition) :** Déplacement du panneau latéral droit vers le ruban d'action inférieur et mise en place du bandeau de statut supérieur en bronze.
3. **Jalon 3 (Pièces & Symboles) :** Remplacement des pions carrés, cités octogonales et navires emojis par les composants SVG en relief avec ombres portées.
4. **Jalon 4 (Écrans Codex) :** Habillage de l'arbre des progrès et du registre AST selon la charte « Plateau Deluxe ».

---

## 6. Synthèse de l'Implémentation Réalisée (Glass HUD + Cartes en Main + Mode Cinématique)

- **Fondations & Design System :** `src/ui/theme/theme.css` (tokens bronze/or/ardoise, glassmorphism `glass-panel`, `glass-btn`, `glass-dock`, keyframes, support `prefers-reduced-motion`), typographie *Cinzel*, jeu d'icônes SVG haute précision (`src/ui/theme/icons/`).
- **Glass Top HUD :** `GlassTopBar` flottante avec `CivBadge` (médaillon héraldique, nom, ère, progression AST), `ResourceCaskets` avec compteurs animés (`useAnimatedNumber`), `CalamityAlertBadge` avec alerte vibrante et menu déroulant, boutons de recentrage et paramètres.
- **Action Dock Flottant :** `ActionDock` centré en bas de l'écran, avec pastille de phase active, indicateur de joueur actif, contrôles contextuels, bouton maître doré « Terminer la phase » et raccourcis Codex.
- **Popover de Zone :** `ZonePopover` ancré à la zone cliquée affichant le statut maritime/terrestre, capacité de population, sites de cité, volcans, plaines inondables et garnison présente.
- **Cartes en Main & Drag & Drop :** `CardHand` avec éventail interactif des cartes de marchandises et calamités détenues, survol ascendant avec zoom et ombre portée, dépliage/repliage animé, et hook de glisser-déposer natif `useCardDrag` sans dépendance externe avec fantôme de carte.
- **Table de Négociation & Modularisation :** `OfferBuilder` et `TradeControls` modernisés avec zones de dépôt `civ-drop-zone` et scindés en composants modulaires de moins de 200 lignes (`VisualBundleFace`, `WantsPicker`, `CompletedTradeHistory`).
- **Mode Cinématique & Audio :** `PhaseBanner` avec bandeau or plein écran à chaque transition de phase, secousses lors des calamités, et `SoundManager` natif (Web Audio API synthétisant pièces, cartes, tonnerre et fanfares).
- **Mode Focus & Accessibilité :** Atténuation automatique du HUD lors de l'inactivité sur la carte (`useFocusMode`), modal de réglages complet (`SettingsModal`), respect intégral de la règle des 200 lignes par fichier (250/250 fichiers conformes) et 315/315 tests passants.

---

## 7. Direction Artistique « Musée Archéologique » (MANN Napoli & Acropolis Museum Athens)

Pour quitter définitivement l'esthétique cartonné/marronnasse des jeux de plateau des années 80 (Avalon Hill) et offrir une expérience digne des grands portails muséaux méditerranéens (Museo Archeologico Nazionale di Napoli, Musée de l'Acropole d'Athènes) :

- **Typographies Lapidaires & Galerie :**
  - Titres et en-têtes : *Cinzel* et *Cormorant Garamond* (inscriptions lapidaires romaines et grecques, gravures antiques).
  - Textes d'interface et cartels : *Outfit* (sans-serif géométrique contemporain, lisibilité de signalétique muséale).
- **Palette Minérale & Matériaux Nobles :**
  - Fonds et plinthes : Obsidienne / Basalte profond (`#0a0d12`, `#10141b`, `#151a23`), abolissant les anciens bruns plastiques (`#24180d`, `#382816`).
  - Accents et bordures : Feuille d'or antique patinée (`#d4af37`), liserés hairlines or (`rgba(212, 175, 55, 0.35)`).
  - Textes : Marbre pentélique (`#f7f4ec`), vélin antique (`#e8e0d0`), gris ardoise (`#959fad`).
  - Époques AST : Patines archéologiques de stéatite (`#384353`), bronze archaïque (`#225d7e`), malachite (`#2b6a50`), cuivre/fer (`#875314`) et or impérial (`#b85d18`).
- **Cartels d'Exposition Archéologique (`.museum-cartel`) :**
  - Tooltips de survol et popovers structurés comme de véritables cartels de vitrine (typographie fine, petits-titres or en capitales, terminologie en français : *Bassin maritime*, *Haute mer*, *Terres libres*, *Site de Cité naturel*, etc.).
- **Socle Vitrine Architectural (`ActionDock`) :**
  - Refonte du dock inférieur en un plinth compact à deux étages en verre fumé (`border-radius: 14px`, suppression de la déformation en œuf `9999px`).
  - Suppression de la collision avec la frise d'ordre du tour (`TurnOrderTabs`), ancrée de façon autonome en bas à gauche.
  - Bouton maître unique en médaille dorée impériale sans doublon lors des déplacements.
- **Cartographie & Level of Detail (LOD) :**
  - Cadrage automatique instantané de la caméra sur la capitale de la nation active dès l'inauguration de la partie.
  - Décluttering à faible zoom : masquage des micro-provinces et des pilules de capacité numériques à l'échelle méditerranéenne globale, ne les révélant qu'au zoom tactique ou au survol.
- **Portails & Modales :**
  - Écran d'accueil (`HomeScreen`) transformé en portail d'exposition numérique (*« L'Aube des Empires de la Méditerranée Antique »*).
  - Écran de configuration (`LocalSetupScreen`) structuré en *« Organisation de l'Expédition »* avec cartes de sièges en marbre sombre.
  - Le Grand Codex (`CodexOverlayModal`) renommé en *« Archives & Collections Impériales »*.
  - Rideaux de transition (`PlayerHandoffModal`) stylisés en transmission d'audience impériale.

