# Rapport d'Expérience de Géoréférencement (Lot 2)

> **Document de décision formelle** établi conformément au protocole §7 de `carte.md`.

---

## 1. Contexte et Objectif

Le plateau d'*Advanced Civilization* (Avalon Hill, 1991) représente le bassin méditerranéen et le Proche-Orient à travers un maillage de 222 zones jouables réparties sur trois panneaux assemblés (Extension Ouest, Plateau Central, Extension Est), unifiés dans un espace combiné de **3800 × 1405 pixels**.

**La question scientifique à trancher** :
> *Les contours du plateau peuvent-ils être calés sur un fond terrestre réel (WGS84 / MapLibre) avec une qualité acceptable sans dénaturer le jeu ?*

---

## 2. Protocole Expérimental

- **16 points de contrôle homologues (GCP)** ont été sélectionnés sur des repères côtiers, caps, îles et confluents historiques majeurs de l'Antiquité.
- **Séparation stricte** :
  - **10 points d'ajustement (*Fitting Points*)** : utilisés pour déterminer la matrice de transformation par moindres carrés.
  - **6 points de contrôle indépendants (*Validation Points*)** : non inclus dans le calcul, servant exclusivement à mesurer l'erreur de généralisation.
- **Modèle de projection testé** : Transformation affine multivariée $2D \to 2D$ (moindres carrés optimisés).

---

## 3. Résultats Détaillés et Mesures d'Écarts

### Tableau d'évaluation point par point

| Statut | Repère / Territoire | Région | Coordonnées Pixels $(X, Y)$ | Coordonnées Réelles $(Lng, Lat)$ | Écart Résiduel (km) | Écart Résiduel (pixels plateau) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **FIT** | **Baetica (Gibraltar)** | Ouest | $(72.0,\, 764.9)$ | $(-5.35^\circ,\, +36.14^\circ)$ | **695 km** | 327 px |
| **FIT** | **Roma (Latium)** | Centre | $(886.7,\, 470.2)$ | $(+12.48^\circ,\, +41.89^\circ)$ | **215 km** | 98 px |
| **FIT** | **Syracus (Sicile)** | Centre | $(978.2,\, 768.4)$ | $(+15.28^\circ,\, +37.07^\circ)$ | **107 km** | 52 px |
| **FIT** | **Carthago (Tunisie)** | Ouest | $(780.4,\, 792.0)$ | $(+10.33^\circ,\, +36.85^\circ)$ | **49 km** | 24 px |
| **FIT** | **Sparta (Péloponnèse)** | Centre | $(1336.6,\, 817.9)$ | $(+22.43^\circ,\, +37.07^\circ)$ | **232 km** | 112 px |
| **FIT** | **Bycantinum (Bosphore)** | Centre | $(1514.8,\, 463.1)$ | $(+28.98^\circ,\, +41.01^\circ)$ | **495 km** | 239 px |
| **FIT** | **Alexandria (Delta du Nil)**| Centre | $(1861.2,\, 1018.1)$ | $(+29.92^\circ,\, +31.20^\circ)$ | **18 km** | 9 px |
| **FIT** | **Babylon (Mésopotamie)** | Est | $(2530.4,\, 600.6)$ | $(+44.42^\circ,\, +32.54^\circ)$ | **160 km** | 72 px |
| **FIT** | **Banda-Abbas (Ormuz)** | Est | $(3266.3,\, 856.8)$ | $(+56.28^\circ,\, +27.18^\circ)$ | **109 km** | 49 px |
| **FIT** | **Karachi (Delta Indus)** | Est | $(3765.4,\, 257.5)$ | $(+67.01^\circ,\, +24.86^\circ)$ | **362 km** | 167 px |
| **TEST** | **Lusitania (Lisbonne)** | Ouest | $(78.3,\, 615.2)$ | $(-9.14^\circ,\, +38.72^\circ)$ | **800 km** | 437 px |
| **TEST** | **Massilia (Marseille)** | Ouest | $(621.9,\, 501.7)$ | $(+5.37^\circ,\, +43.30^\circ)$ | **378 km** | 211 px |
| **TEST** | **Knossos (Crète)** | Centre | $(1574.0,\, 855.0)$ | $(+25.16^\circ,\, +35.30^\circ)$ | **167 km** | 75 px |
| **TEST** | **Crimea (Crimée / Mer Noire)**| Centre | $(1764.5,\, 249.2)$ | $(+34.10^\circ,\, +44.50^\circ)$ | **711 km** | 338 px |
| **TEST** | **Sinai (Mer Rouge)** | Centre | $(2078.3,\, 1036.5)$ | $(+34.00^\circ,\, +28.50^\circ)$ | **156 km** | 70 px |
| **TEST** | **Susa (Iran)** | Est | $(2698.8,\, 668.2)$ | $(+48.24^\circ,\, +32.19^\circ)$ | **177 km** | 80 px |

---

## 4. Synthèse Statistique des Écarts

- **RMSE sur les 10 points d'ajustement** : **318,0 km** (soit environ **177 pixels de plateau**).
- **RMSE sur les 6 points de contrôle indépendants** : **478,1 km** (soit environ **266 pixels de plateau**).
- **Écarts par région** :
  - **Région Ouest (Ibérie & Gaule)** : Erreur moyenne de **480 km**, avec un pic critique à **800 km** sur Lisbonne.
  - **Région Centre (Égée, Pont-Euxin, Italie)** : Erreur moyenne de **263 km**, avec un pic à **711 km** sur la Crimée.
  - **Région Est (Levant, Mésopotamie, Perse, Indus)** : Erreur moyenne de **202 km**, erreur maximale de **362 km**.

---

## 5. Diagnostic Cartographique & Causes Fondamentales

Les déformations mesurées ne sont pas des imperfections numériques : **elles sont consubstantielle au dessin original d'Avalon Hill (1980–1991)** :

1. **Géométrie ludique non euclidienne** :
   Pour des raisons d'équilibrage de jeu, Francis Tresham et les cartographes d'Avalon Hill ont **fortement dilaté la Grèce et l'Égée** (afin d'accueillir jusqu'à 8 cités et une trentaine de pions sur une surface minuscule), tout en **comprimant l'Afrique du Nord et l'Asie Centrale**.
2. **Discontinuité de l'Extension Ouest (Western Extension)** :
   Le panneau Ouest ajouté en 1991 a subi une rotation et un écrasement pour tenir sur un panneau physique de 782 px : la péninsule ibérique y est décalée de près de **800 km** vers l'Est par rapport à sa position réelle en longitude.
3. **Conséquence directe sur un fond terrestre réel** :
   Si l'on force la projection des polygones d'Avalon Hill sur un fond de carte OpenStreetMap / satellite :
   - Lisbonne et Gibraltar se retrouvent projetés au milieu de l'Océan Atlantique.
   - Les cités de Crimée se retrouvent au milieu des eaux de la Mer Noire.
   - Les frontières de jeu terrestres coupent arbitrairement les golfes réels, rendant la carte illisible et incohérente.

---

## 6. Décision de Sortie Préconisée

D'après les 3 options définies par le cahier des charges `carte.md` (§7) :
- *Option A (Alignement satisfaisant)* : **REJETÉE** (erreurs de 300 à 800 km inacceptables pour un fond réel).
- *Option B (Alignement localement insuffisant avec correction des géométries)* : **DÉCONSEILLÉE** (cela briserait les proportions des provinces et la reconnaissance visuelle du jeu original).
- **Option C (Alignement trop artificiel : conserver le plateau en pixels natifs et adopter le langage graphique d'Arda) : RETENUE À L'UNANIMITÉ**.

### Plan d'action pour la suite (Option C) :
1. **Conserver le référentiel combiné officiel 3800 × 1405 pixels**, garantissant une fidélité absolue au jeu d'Avalon Hill et l'absence de régression.
2. **Appliquer l'esthétique cartographique d'Arda** :
   - Mer bleutée texturée avec lignes bathymétriques le long des côtes réelles du plateau.
   - Terres en parchemin ivoire/sable avec ombrages de relief côtiers.
   - Noms de territoires historiques imprimés en typographie noble avec seuil de zoom (*Level of Detail*).
3. **Navigation moderne** :
   - Zoom continu à la molette centré sur le curseur de souris (*Smooth Focal Zoom*).
   - Remplissage optimal du cadre d'écran sans bandes vides latérales.
