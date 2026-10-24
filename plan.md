<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Plan d’implémentation — version locale autonome

## 1. Objectif

Transformer le fork en une application accessible sans identification, permettant de jouer sur un seul ordinateur :

- un humain contre des IA ;
- plusieurs humains, avec ou sans IA ;
- une interface utilisable sur grand écran ;
- des sauvegardes et diagnostics locaux ;
- aucune dépendance à un compte ou à un service distant pendant une partie.

Le principe directeur est l’**autonomie** : conserver le moteur et les fonctionnalités locales existantes, puis isoler les intégrations externes sans réécrire les règles.

Ce document constitue le cahier des charges de l’implémentation. Les fichiers mentionnés sont les points d’entrée repérés lors de l’analyse précédente ; l’agent devra confirmer leur rôle avant modification.

## 2. Périmètre de la première livraison

### Inclus

- Accueil en français.
- Suppression de l’identification dans le parcours local.
- Configuration des joueurs humains et IA.
- Réutilisation de l’IA heuristique existante.
- Indication claire du joueur actif.
- Gestion du passage entre humains.
- Mode « table ouverte » et écran de confidentialité optionnel.
- Sauvegarde automatique locale.
- Export/import de sauvegardes.
- Export d’un journal de diagnostic.
- Multijoueur en ligne visible, mais désactivé.
- Absence d’appels aux services hérités dans le parcours local.


### Exclus

- Modification des règles et de l’équilibrage.
- Ajout d’une IA fondée sur un LLM.
- Multijoueur réseau, même sur réseau local.
- Comptes, classements et identification.
- Refonte complète du plateau.
- Refactorisation générale du moteur.
- Garantie de fonctionnement hors connexion après un premier chargement.

Une application sans service distant nécessaire pour jouer n’est pas encore une application installable et entièrement hors ligne. Ce second objectif fera l’objet d’une étape séparée.

## 3. Parcours utilisateur cible

```text
Démarrage
    │
    ▼
Accueil
    ├── Nouvelle partie locale
    │       └── Configuration
    │               └── Partie
    │
    ├── Reprendre la partie
    │       └── Dernière sauvegarde valide
    │
    ├── Importer une sauvegarde
    │       └── Validation
    │               └── Partie
    │
    ├── Multijoueur en ligne — indisponible
    │
    └── Paramètres
```


### Accueil

Afficher :

- le titre de l’application ;
- « Nouvelle partie locale » ;
- « Reprendre la partie », désactivé en l’absence de sauvegarde ;
- « Importer une sauvegarde » ;
- « Multijoueur en ligne — prévu ultérieurement », désactivé ;
- les paramètres et les informations de version.

Aucune demande de connexion, aucun lien vers le hub de l’auteur et aucune initialisation de session distante.

### Configuration

Pour chaque emplacement :


| Champ | Comportement |
| :-- | :-- |
| Civilisation | Sélection parmi les civilisations autorisées par le plateau |
| Contrôle | Humain ou IA |
| Nom | Facultatif pour un humain |
| Activation | Selon les limites du préréglage retenu |

Paramètres communs :

- préréglage de plateau ;
- informations humaines ouvertes ou masquées ;
- rythme d’affichage des actions de l’IA ;
- graine aléatoire facultative dans les options avancées.

Ne pas proposer de niveaux de difficulté tant qu’ils ne correspondent pas à des comportements réellement implémentés.

## 4. Architecture cible

Séparer trois catégories d’état :


| Catégorie | Contenu |
| :-- | :-- |
| État du moteur | Civilisations, territoires, cartes, phases, progression, hasard |
| Configuration de session | Humains/IA, noms, mode de confidentialité |
| État de présentation | Panneau ouvert, sélection, transition, vitesse d’affichage |

Les préférences d’interface ne doivent pas modifier les règles du moteur.

### Organisation proposée

Adapter les noms à l’existant plutôt que créer des doublons.

```text
src/
  config/
    features.ts

  local/
    types.ts
    session.ts
    persistence.ts
    save-format.ts
    diagnostics.ts

  ui/
    screens/
      HomeScreen.tsx
      LocalSetupScreen.tsx

    local/
      LocalGameShell.tsx
      PlayerTransition.tsx
      LocalGameMenu.tsx
      ImportSaveDialog.tsx
```

Conserver les modules du moteur, de l’IA et du serveur. Le serveur et le client en ligne restent hors du parcours local.

## 5. Lot 0 — Établir une référence technique

### Actions

1. Créer une branche dédiée, par exemple `feat/local-first`.
2. Relever le commit de départ.
3. Examiner le parcours actuel dans :
    - `src/ui/main.tsx` ;
    - `src/ui/App.tsx` ;
    - `src/ui/online.tsx`.
4. Identifier :
    - le démarrage du jeu local ;
    - l’exécution de l’IA ;
    - les sauvegardes existantes ;
    - les mécanismes de dissimulation ;
    - les appels réseau et systèmes de rapports.
5. Exécuter :
```bash
npm ci
npm run typecheck
npm test
npm run build:ui
```


### Livrable

Un journal technique court recensant :

- les commandes exécutées ;
- leurs résultats ;
- les éventuels échecs préexistants ;
- les mécanismes existants qui seront réutilisés.


### Critère de sortie

Les résultats initiaux sont connus. Tout échec préexistant est distingué des régressions futures.

## 6. Lot 1 — Isoler les services externes

### Actions

Créer une configuration centrale de fonctionnalités, avec les valeurs suivantes pour cette livraison :

```ts
export const features = {
  onlineMultiplayer: false,
  externalIdentity: false,
  remoteReports: false,
  externalHub: false,
} as const;
```

Cette configuration doit empêcher l’initialisation des fonctions désactivées, et pas seulement masquer leurs boutons.

À examiner :

- chargement du client Supabase ;
- récupération d’identité ;
- hub et classement ;
- compteurs distants ;
- notifications ;
- envoi de rapports ;
- traitement des paramètres d’invitation.


### Comportement des anciennes invitations

Si l’URL contient une invitation en ligne :

- ne pas tenter de connexion ;
- afficher « Le multijoueur en ligne n’est pas disponible dans cette version » ;
- proposer un retour à l’accueil ;
- ne pas intégrer les jetons de l’URL dans les exports de diagnostic.


### Contraintes

- Ne supprimer ni les attributions ni les licences.
- Ne pas modifier le moteur pour désactiver le réseau.
- Ne pas recopier les identifiants ou secrets de production de l’auteur.
- Ne pas présenter un simple masquage de menu comme une isolation effective.


### Critère de sortie

Le démarrage et une partie locale ne déclenchent aucun appel applicatif aux services hérités.

## 7. Lot 2 — Installer l’accueil local

### Actions

- Remplacer le choix initial par le nouvel accueil.
- Afficher le multijoueur en ligne comme indisponible.
- Détecter la présence d’une sauvegarde valide.
- Ajouter un accès aux informations de version et aux crédits.
- Utiliser des composants simples sans refondre l’ensemble du style.


### Critères de sortie

- Aucun écran d’identification.
- Nouvelle partie accessible directement.
- Reprise indisponible si aucune sauvegarde valide n’existe.
- Un clic sur le multijoueur désactivé ne provoque aucune action.
- Navigation utilisable au clavier.


## 8. Lot 3 — Configurer humains et IA

### Modèle de configuration proposé

```ts
type LocalSeat = {
  civilizationId: string;
  controller: "human" | "heuristic-ai";
  displayName?: string;
};

type LocalSessionConfig = {
  seats: LocalSeat[];
  boardPresetId: string;
  privacyMode: "open-table" | "handoff";
  aiPace: "instant" | "readable";
  seed?: number;
};
```


### Validations

Avant de créer la partie :

- au moins un humain ;
- nombre de participants compatible avec la configuration retenue ;
- aucune civilisation en double ;
- civilisations disponibles sur le plateau sélectionné ;
- respect des exclusions prévues par les données et le moteur ;
- graine valide lorsqu’elle est renseignée.

Ne pas coder dans l’interface une nouvelle liste de civilisations qui divergerait de celle du moteur.

### Exécution des tours

- Réutiliser le contrôleur heuristique existant.
- Lancer l’IA uniquement lorsqu’elle est l’acteur attendu.
- Empêcher les doubles soumissions.
- Désactiver les actions humaines pendant une résolution.
- Arrêter proprement la boucle d’IA au retour à l’accueil ou au chargement d’une autre partie.
- Ne pas modifier la logique du moteur pour ralentir les animations.


### Critère de sortie

Les trois configurations suivantes passent plusieurs changements de phase sans blocage :

1. Un humain et des IA.
2. Deux humains et une IA.
3. Deux humains sans IA, si le préréglage l’autorise.

## 9. Lot 4 — Organiser la table locale et les informations privées

### Mode par défaut : table ouverte

- Les informations des joueurs humains peuvent être affichées sur l’écran partagé.
- Un avertissement indique que ce mode modifie la confidentialité entre humains.
- L’IA conserve son accès normal aux informations autorisées : ne pas lui donner une vision omnisciente pour faciliter le développement.


### Mode optionnel : passage de main

Lorsqu’un nouvel humain doit consulter ses informations :

```text
Au tour de [nom / civilisation]

Les informations du joueur précédent sont masquées.

[Afficher mon tour]
```

Règles :

- masquer les informations avant d’afficher la transition ;
- ne jamais afficher brièvement la main précédente ;
- prévoir un bouton « Masquer les informations » ;
- avertir que ce mode ne garantit pas la confidentialité sur un écran projeté.


### Lisibilité sur grand écran

Afficher en permanence :

- tour et phase ;
- civilisation active ;
- nature du contrôle : humain ou IA ;
- action attendue ;
- message expliquant pourquoi une action est impossible.


### Critère de sortie

Le passage entre humains est compréhensible et ne révèle pas accidentellement les informations du joueur précédent.

## 10. Lot 5 — Sauvegarde, reprise et import/export

### Principe

Auditer la persistance existante avant d’en ajouter une seconde. Réutiliser le codec du moteur s’il convient ; éviter une sérialisation parallèle susceptible d’oublier une partie de l’état.

### Contenu d’une sauvegarde

```text
Format et version de sauvegarde
Version de l’application
Date de sauvegarde
Configuration de session locale
État sérialisé du moteur
```

Inclure notamment :

- les contrôles humains/IA ;
- l’état du hasard ;
- les décisions et négociations en attente ;
- les informations nécessaires à une reprise cohérente.

Ne pas inclure :

- jetons d’invitation ;
- identités distantes ;
- secrets ;
- URL complète du navigateur.


### Sauvegarde automatique

- Sauvegarder après chaque action terminée et normalisée.
- Ne pas remplacer une sauvegarde valide par un état incomplet.
- Signaler explicitement un échec d’écriture.
- Demander confirmation avant d’écraser une partie lors d’un nouveau démarrage.
- Définir un comportement sûr si deux onglets ouvrent la même partie.


### Import

Valider avant tout remplacement :

- taille du fichier ;
- syntaxe ;
- identifiant du format ;
- version compatible ;
- cohérence minimale de l’état et de la session.

Une importation invalide doit laisser la partie courante intacte.

### Critères de sortie

- Rechargement du navigateur sans perte de progression.
- Export/import conservant le même état.
- Fichier invalide refusé avec un message compréhensible.
- Version incompatible signalée.
- Échec de stockage affiché sans faire planter la partie.


## 11. Lot 6 — Diagnostics locaux

Remplacer l’envoi distant du parcours local par :

- « Exporter un diagnostic » ;
- « Exporter la sauvegarde » ;
- éventuellement « Copier les informations techniques ».


### Contenu du diagnostic

- version de l’application ;
- phase et tour ;
- civilisation active ;
- configuration de session ;
- journal des événements ;
- message libre du testeur ;
- état complet uniquement avec une option explicite.

Prévenir qu’un export contenant l’état complet peut révéler les cartes cachées. Prévoir aussi une option d’exclusion des noms saisis par les joueurs.

### Critère de sortie

Un testeur peut produire un fichier exploitable pour reproduire un problème, sans envoyer de données à un service distant.

## 12. Lot 7 — Validation technique avant les tests joueurs

### Tests automatisés à ajouter

| Domaine | Vérifications |
| :-- | :-- |
| Configuration | Doublons, absence d’humain, civilisation interdite |
| Navigation | Accueil, reprise, multijoueur inactif |
| Tours | Déclenchement IA, retour à l’humain, absence de double action |
| Confidentialité | Masquage au changement de joueur |
| Persistance | Sauvegarde, reprise, import invalide, version incompatible |
| Diagnostics | Absence de jetons et d’identifiants distants |
| Autonomie | Aucun appel aux services hérités |

### Vérifications manuelles

- Démarrer une partie avec un humain et plusieurs IA.
- Jouer plusieurs tours.
- Tester deux humains et une IA.
- Fermer puis reprendre pendant une phase interactive.
- Exporter et importer pendant une négociation, si cette situation est prise en charge.
- Revenir à l’accueil pendant l’exécution d’une IA.
- Tester l’affichage sur le grand écran cible.
- Examiner les requêtes réseau.
- Vérifier les messages d’erreur.


### Commandes finales

```bash
npm run typecheck
npm test
npm run build:ui
```

Tout échec doit être corrigé ou documenté explicitement comme préexistant. Ne pas annoncer « tests réussis » sans les avoir exécutés.

## 13. Livraison pour les tests joueurs

Fournir :

1. La version locale jouable.
2. Une procédure de lancement.
3. Une liste courte des limites connues.
4. Une procédure de sauvegarde et d’export de diagnostic.
5. Une fiche de test.

### Ordre des séances

| Séance | Objectif |
| :-- | :-- |
| Un humain contre IA | Vérifier le parcours, les actions et les blocages |
| Deux humains et une IA, table ouverte | Vérifier les changements de joueur et la compréhension |
| Partie sur grand écran | Vérifier la lisibilité, le rythme et la gestion des informations |
| Partie prolongée | Vérifier la stabilité et la reprise |

Les anomalies seront classées séparément : règles, interface, IA, sauvegarde, confidentialité et performance.

## 14. Consignes pour l’agent développeur

- Confirmer les mécanismes existants avant de créer de nouveaux modules.
- Ne pas modifier les règles dans ce chantier.
- Ne pas réécrire intégralement `App.tsx` ou `engine.ts`.
- Extraire uniquement les composants nécessaires au parcours local.
- Réutiliser les contrôleurs, types et codecs existants.
- Éviter les nouvelles dépendances sans nécessité démontrée.
- Produire des changements limités et vérifiables.
- Mettre à jour la documentation après validation, pas avant.
- Ne pas déployer ni modifier d’infrastructure distante sans validation séparée.
- Signaler les incertitudes plutôt que les contourner silencieusement.


### Séquence de commits proposée

```text
1. docs: record baseline and local implementation scope
2. refactor: isolate external integrations behind feature flags
3. feat: add French local home screen
4. feat: configure human and AI local seats
5. feat: add local turn handoff and privacy controls
6. feat: add validated local save import and export
7. feat: replace remote reporting with local diagnostics
8. test: cover local flow and document player-test procedure
```


## 15. Définition de « terminé »

La première livraison est terminée lorsque :

- le jeu démarre sans identification ;
- le menu permet une partie locale avec humains et IA ;
- le multijoueur en ligne est clairement indisponible ;
- les tours s’enchaînent sans double action ;
- la gestion des informations partagées est explicite ;
- une partie peut être sauvegardée, reprise et exportée ;
- les diagnostics restent locaux ;
- aucun service hérité n’est appelé pendant le parcours local ;
- les vérifications techniques ont été exécutées et consignées ;
- les limites restantes sont connues avant tes tests joueurs.

L’objectif de cette livraison n’est pas de prouver que toutes les règles sont parfaitement implémentées : c’est d’obtenir un environnement local maîtrisé dans lequel tu pourras justement les tester.

