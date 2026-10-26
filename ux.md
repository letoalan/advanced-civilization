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
