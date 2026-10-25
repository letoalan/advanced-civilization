# Fiche Wiki : Serveur & Routage API (`server/`)

## 1. Fiche d'Identité
- **Fichiers sources** :
  - `src/server/handlers.ts` (121 lignes)
  - `src/server/reportRoutes.ts` (88 lignes)
  - `src/server/index.ts`
- **Rôle principal** : Routeur d'API agnostique de la plateforme pour le mode multijoueur (Node.js en développement local et Cloudflare Workers en production).
- **Domaine** : Serveur / API
- **Taille** : 100 % des fichiers sous le seuil strict de 130 lignes.

## 2. Architecture & Dépendances
- **Imports clés** :
  - `digital-boardgame-framework/server` : Interfaces de GameServer, gestion des sessions et des rapports d'anomalies.
  - `engine/index.js` : Création de parties (`createGame`).
- **Exports publics** :
  - `handleApi` : Point d'entrée de routage des requêtes HTTP.
  - `handleReportRoutes` : Sous-routeur spécialisé dans la gestion des signalements de bogues et de la boîte de réception des réponses.
