# carte.md — Modernisation cartographique et visuelle du plateau

## 1. Mission et contexte

Le jeu a été testé par son propriétaire et est fonctionnel. Préserver ce fonctionnement est prioritaire. Construire un prototype cartographique indépendant avant de remplacer le plateau. Étudier la réutilisation des modes de représentation d’Arda, puis ajouter les cases du jeu comme couche zonale.

Ce document est un cahier des charges, pas une autorisation de déploiement ou de modification d’infrastructure. Ne pas publier, pousser de commits ou modifier un service distant sans accord distinct.

## 2. Résultats attendus

1. Audit des données et de leur provenance.
2. Export de référence des cases et des ancrages.
3. Prototype MapLibre de géoréférencement et rapport des écarts.
4. Décision explicite : migration, adaptation locale ou maintien du rendu actuel.
5. Modernisation progressive du fond, de la navigation, des informations et des pièces.
6. Comparaison avant/après sur une même situation de jeu.

Hors périmètre : règles, équilibrage, IA stratégique, réseau, comptes, refonte des cartes de marchandises et de la vue des progrès. Ces deux derniers sujets nécessitent un chantier ultérieur.

## 3. Sources à inspecter avant toute modification

Dépôt cible : letoalan/advanced-civilization.
Dépôt de référence visuelle : letoalan/Arda.

Fichiers repérés dans le fork :
- src/data/territories.json et territories.ts : contours en coordonnées d’image ; trous possibles ; catégories land/coastal/openSea/cosmetic.
- src/data/areas.json : identités, propriétés et géométries utilisées par le jeu.
- src/data/coastlines.json et coastlines.ts : sous-zones terrestres et maritimes.
- src/data/adjacency.json : graphe logique à préserver.
- src/data/water-graph.json et ship-edges.json : routage maritime à inspecter.
- src/data/playAreas.json : configurations jouables et masques.
- src/ui/anchors.ts : référentiel combiné 3800 × 1405 annoncé, ancrages, formes affichées et zones côtières internes exclues du rendu.
- scripts/trace-territories.mjs : extraction depuis les frontières des SVG assemblés.
- scripts/build-crosswalk.mjs : correspondance par inclusion de centroïdes ; à auditer, pas à considérer comme preuve de correspondance parfaite.
- scripts/build-board.mjs : réécriture des géométries ; attention à une seconde transformation de coordonnées déjà converties.
- src/ui/App.tsx et éventuels composants board/ de la version locale.

Les composants Board.tsx, BoardBackground.tsx, BoardTokens.tsx annoncés par Antigravity doivent être localisés dans le workspace réel. Ne pas supposer leur présence dans main. Noter branche, commit et différences locales.

Arda déclare MapLibre et des outils GeoJSON/projections. Inspecter les implémentations réelles avant de promettre une réutilisation. Ne pas importer tout Arda et ne pas ouvrir/copier ses secrets ou fichiers .env.

Documentation publique :
- https://maplibre.org/maplibre-style-spec/sources/
- https://maplibre.org/maplibre-gl-js/docs/API/classes/LngLat/

## 4. Invariants non négociables

- Aucun changement de règle, capacité, propriété de terrain ou comportement IA.
- Identifiants du moteur et graphes de déplacement inchangés.
- Ne jamais déduire une nouvelle adjacency de deux polygones qui se touchent.
- Ne pas confondre territoire côtier, sous-zone de mer et case cliquable.
- Ne pas recharger une partie privée complète dans un rendu destiné à un joueur ne devant voir qu’une vue filtrée.
- Ancien rendu conservé et sélectionnable pendant l’expérimentation.
- Prototype désactivé par défaut jusqu’à validation.
- Aucune tuile ni ressource tierce sans provenance, conditions d’usage et attribution identifiées.
- Aucun appel nouveau vers le hub, la télémétrie ou les services de l’auteur.

## 5. Lot 0 — Référence et audit en lecture seule

1. Relever commit, branche, modifications locales et commandes existantes.
2. Exécuter les vérifications du projet sans réécrire ses tests.
3. Capturer des situations de référence : départ, mouvement, commerce, navigation, calamité, acquisition de progrès et reprise si disponibles.
4. Inventorier données, nombre réel de zones, catégories, trous, multipolygones éventuels, ancrages, masques et référentiels.
5. Examiner les corrections localStorage prévues par les éditeurs de territoires et de littoraux ; demander un export utilisateur si la version locale fait autorité. Ne pas les effacer.
6. Ne pas lancer les scripts de régénération sur les sources : vérifier leurs préconditions et leur idempotence sur copie.

Livrables : docs/carte-audit.md et liste des questions ouvertes. Les nombres mentionnés dans d’anciens commentaires ne font pas foi : recalculer depuis les données courantes.

## 6. Lot 1 — Modèle cartographique intermédiaire

Créer un adaptateur non destructif séparant :
- identité de jeu : areaId stable ;
- géométrie d’origine : board-pixels ;
- géométrie d’affichage géographique : WGS84, si calculée ;
- ancrages des pièces ;
- métadonnées de conversion et validation.

Préférer un modèle interne explicitement nommé BoardGeometry pour les coordonnées pixels. Ne pas publier des pixels comme du GeoJSON géographique valide. L’export MapLibre utilisera longitude puis latitude.

Préserver les anneaux intérieurs. Fermer les anneaux pour l’export et valider orientation, auto-intersections, valeurs finies, unicité des identifiants et domaines des coordonnées. Gérer Polygon/MultiPolygon si les données le nécessitent. Ne pas simplifier séparément des frontières partagées au risque de produire des fentes.

Ne pas supposer qu’un centroïde arithmétique est dans le polygone. Pour les marqueurs, réutiliser un point intérieur robuste et vérifier sa relation aux sous-zones pertinentes.

Livrable : export de référence et tests du convertisseur. Aucun remplacement des JSON sources.

## 7. Lot 2 — Expérience de géoréférencement

### Question à trancher

Les contours du plateau peuvent-ils être placés sur un fond terrestre avec une qualité acceptable ? Le dessin est une géographie ludique ; l’équivalence avec un fond réel n’est pas acquise.

### Protocole

1. Choisir un fond dont la licence, l’attribution et les modalités de chargement sont connues.
2. Définir des points homologues répartis sur Ouest, centre et Est : caps, détroits, îles et littoral.
3. Séparer points d’ajustement et points de contrôle indépendants.
4. Ajuster dans un référentiel projeté explicite, puis convertir en WGS84 pour MapLibre. Ne pas assimiler linéairement pixels et latitude par défaut.
5. Comparer d’abord une transformation simple globale ; tester une déformation locale seulement si elle est justifiée.
6. Appliquer exactement la même transformation aux frontières partagées, trous, ancrages, sous-zones et masques.
7. Vérifier absence de plis, d’inversion et de franchissement incohérent des côtes.
8. Présenter les erreurs par région et sur les points indépendants : unités géographiques et pixels à des cadrages définis.

Pas de seuil de qualité inventé après observation. Proposer les critères et les faire valider avant de choisir le résultat.

### Décision de sortie

A. Alignement satisfaisant : poursuivre le prototype MapLibre.
B. Alignement localement insuffisant : proposer une géométrie d’affichage corrigée en gardant identités et graphe de jeu ; validation humaine obligatoire.
C. Alignement trop artificiel : conserver le plateau en pixels et reprendre uniquement le langage graphique d’Arda.

Une conversion affine vers un monde géographique fictif peut servir au rendu technique, mais ne doit pas être présentée comme un alignement réel avec les tuiles terrestres.

## 8. Lot 3 — Prototype MapLibre isolé

Créer un écran de développement distinct, sans changer le démarrage normal du jeu.

Ordre des couches :
1. fond terrestre et maritime ;
2. relief décoratif discret, si disponible ;
3. remplissage transparent des territoires ;
4. frontières et masques hors jeu ;
5. destinations autorisées, survol et sélection ;
6. noms et indications ;
7. pièces et marqueurs.

Chaque feature conserve un identifiant stable relié au moteur. Les interactions passent par un adaptateur vers les actions existantes. Le fond décoratif ne doit pas masquer les cases interactives. Identifier les états visuels temporaires sans réécrire l’ensemble de la source à chaque mouvement de souris.

Commencer sans inclinaison ni rotation. Interdire la répétition du monde si elle produit des copies du plateau. Borner l’emprise et le zoom. Gérer proprement démontage du composant, écouteurs et redimensionnement.

Ne pas synchroniser un SVG séparé et une carte par deux transformations indépendantes : toutes les couches doivent partager une caméra cohérente ou une projection explicitement commune.

Les styles, glyphes, sprites, DEM et tuiles peuvent tous déclencher des téléchargements. Inventorier les dépendances. Un fonctionnement hors ligne n’est validé que si toutes les ressources nécessaires sont disponibles localement et testées sans réseau.

## 9. Direction artistique — Atlas antique méditerranéen

Objectif : relief cartographique sobre, non une patine sépia uniforme.

- Mer bleu ardoise désaturé avec variation légère.
- Terres ivoire/sable, texture discrète.
- Littoral net, plus visible que les frontières internes.
- Frontières continues fines par défaut ; pointillés seulement s’ils restent lisibles et ont une signification cohérente.
- Relief et fleuves décoratifs ne créant aucune règle implicite.
- Typographie lisible : serif sobre pour les territoires ; caractère monumental réservé aux titres.
- Ressources graphiques originales ou sous licence compatible ; polices embarquées si besoin d’autonomie.
- Palette centralisée : décor, factions, sélection, possibilités et alertes distincts.

Ne pas ajouter des fonds brillants, halos ou textures qui réduisent le contraste des effectifs. Ne pas reproduire les graphismes de 1995.

## 10. Navigation

- Zoom continu centré sur le curseur, avec limites.
- Déplacement par glisser-déposer sans déclencher un clic de territoire au relâchement.
- Commandes +, −, Vue générale et Zone active.
- Ne pas employer « capitale » sans objet correspondant dans le jeu.
- Vue générale contenant toute l’emprise jouable ; ne pas déformer la carte pour remplir le cadre.
- Recadrage au changement de taille, sans réinitialiser abusivement la caméra à chaque action.
- Alternative clavier et commandes visibles ; ne pas dépendre seulement de la molette.
- Vérifier le comportement tactile si inclus dans la livraison, sinon annoncer explicitement la limite.

## 11. Niveaux de détail

- Vue globale : pièces, états tactiques et grands ensembles ; peu de labels.
- Vue intermédiaire : noms des territoires si l’espace le permet.
- Vue rapprochée : capacités, sites et détails supplémentaires.

Déterminer les seuils avec la taille réellement affichée, pas avec un pourcentage arbitraire. Réduire les collisions entre noms, pièces et badges. L’information masquée au dézoom reste accessible dans un panneau ou une infobulle.

Les liens maritimes affichés proviennent du moteur. Ne pas inventer de routes graphiques ressemblant à des possibilités de mouvement.

## 12. Modernisation des pièces — Après validation du fond

Créer des composants SVG cohérents, conservant taille utile et zones d’interaction.

### Population
- Jeton circulaire ou cube biseauté ; relief modéré.
- Effectif très lisible, contour de texte si nécessaire.
- Ne pas distinguer les factions uniquement par la couleur.

### Cités
- Silhouette simple de murailles ou temple.
- Ombre douce, non un effet coûteux multiplié sans mesure.
- Distinguer site de ville et cité construite.
- Ne pas présenter le coût historique de construction comme une propriété actuelle de la cité si cette information n’est pas stockée ; utiliser les données du site et les règles existantes.

### Navires
- Galère/trière SVG à couleur de faction, remplaçant l’emoji.
- Ancrage dans la zone maritime pertinente, sans décaler l’identité de jeu.

### Terrain et calamités
- Pictogrammes homogènes pour sites, volcans, crues et forces neutres.
- Infobulle et légende ; aucun symbole ne doit suggérer une règle inexistante.

## 13. Affordances tactiques

- Survol discret ; sélection plus forte et stable.
- Destinations légales distinctes des cases simplement voisines.
- Indication des déplacements effectués à partir du journal réel, sans révéler d’informations cachées.
- Alerte de dépassement de capacité séparée d’une interdiction : certains états transitoires peuvent être légaux.
- Les animations sont facultatives, désactivables et respectent une préférence de réduction des mouvements.
- Priorité des états documentée : sélection, action possible, survol, alerte et hors-jeu.

## 14. Validation et non-régression

### Données
- Identifiants et graphe inchangés.
- Chaque zone visible correspond à la bonne identité.
- Aucune zone interne de routage créée comme case cliquable par erreur.
- Géométries valides ; trous, îles et masques conservés.
- Import/export reproductible depuis les mêmes sources.

### Jeu
- Même état et même action légale : résultat moteur identique avant/après.
- Comparaison après exclusion des seuls paramètres de caméra et de présentation.
- Pas de fuite de mains cachées via labels, logs ou overlays.

### Visuel et interaction
- Scènes identiques avant/après, caméras et tailles documentées.
- Vérification des détroits, petites îles, coutures des panneaux et limites du plateau.
- Clic correct après zoom, déplacement et redimensionnement.
- Lisibilité sur écran de bureau et grand écran cible.
- Les captures approuvées ne remplacent pas les tests fonctionnels.

### Performance
- Mesurer la référence puis le prototype sur la même machine et les mêmes scènes.
- Temps de chargement, taille des ressources, fluidité de navigation et consommation mémoire.
- Fixer les budgets après mesure de référence ; ne pas annoncer « fluide » sans observation.

### Commandes

Réutiliser les scripts réellement présents, notamment si inchangés :
```bash
npm run typecheck
npm test
npm run build:ui
```

Consigner les résultats. Ne pas supprimer ni assouplir un test pour faire valider une nouvelle présentation.

## 15. Organisation agentique et garde-fous

- Un ticket étroit par changement ; une seule branche ou worktree par expérience concurrente.
- Séparer implémentation et revue critique.
- Reviewer : chercher pertes de trous, faux alignements, interactions décalées, adjacences altérées, dépendances réseau et régressions de confidentialité.
- Protéger les fixtures et critères d’acceptation de l’auto-modification.
- Aucune optimisation de prompts ou de harness nécessaire à la première expérience.
- Harness² peut être expérimenté ultérieurement sur un ticket isolé, jamais comme dépendance du jeu. Ne pas empiler plusieurs orchestrateurs sans responsabilité claire.
- Permissions limitées ; pas de secrets de production ni de déploiement autonome.

## 16. Livraisons et points d’arrêt

A — Audit + export : validation de la source faisant autorité.
B — Géoréférencement : validation humaine de la carte d’écarts et choix A/B/C.
C — Prototype de fond : validation du style sur une région et sur l’emprise complète.
D — Navigation + territoires interactifs : validation des actions et de la lisibilité.
E — Pièces + détails tactiques : validation grand écran et performances.
F — Intégration optionnelle : nouveau rendu activable, ancien rendu conservé pendant la recette.

Ne pas poursuivre automatiquement de B vers une migration générale. En cas d’échec de l’alignement, livrer le diagnostic et la solution de repli.

## 17. Première instruction à Antigravity

Commence uniquement par les lots 0 et 1. Inspecte le workspace, repère les composants réellement utilisés, identifie les éventuelles corrections locales non exportées et documente les référentiels. Propose un export non destructif des cases visibles avec leurs identifiants et leurs ancrages. N’exécute pas les scripts de régénération sur les données de production. Présente ensuite le protocole de points de contrôle et les critères d’évaluation avant d’implémenter le géoréférencement.
