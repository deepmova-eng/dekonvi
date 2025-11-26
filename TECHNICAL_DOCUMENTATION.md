# Documentation Technique Complète - Dekonvi

Cette documentation détaille l'architecture, les workflows et les implémentations techniques de la plateforme Dekonvi.

## 📁 1. ARCHITECTURE DU PROJET

### A. Structure des fichiers et dossiers

Le projet suit une structure React/Vite standard :

```
/src
  /components       # Composants réutilisables
    /chat           # Composants de messagerie (Conversation, MessageList...)
    /common         # Composants génériques (LoadingFallback, Button...)
    /home           # Composants de la page d'accueil (Hero, SearchBar...)
    /layout         # Layouts (Navbar, BottomNav...)
    /notifications  # Système de notifications
    /ui             # Composants UI de base (EmptyState, Skeletons...)
  /config           # Configuration statique (catégories, constantes)
  /contexts         # Contextes React (SupabaseContext...)
  /hooks            # Custom Hooks (useConversations, useMessages...)
  /lib              # Bibliothèques et clients (supabase.ts)
  /pages            # Pages principales (Home, Messages, CreateListing...)
  /types            # Définitions TypeScript (supabase.ts, database...)
  /utils            # Fonctions utilitaires (formatters, helpers)
  App.tsx           # Point d'entrée avec Routing
  main.tsx          # Montage de l'application
  *.css             # Fichiers de styles globaux et modules
```

### B. Technologies utilisées

*   **Frontend Framework** : React 18
*   **Build Tool** : Vite
*   **Langage** : TypeScript
*   **Routing** : React Router DOM v6
*   **Styling** : Tailwind CSS + CSS Modules (`premium-ui.css`, etc.)
*   **Backend/BaaS** : Supabase (Auth, Database, Storage, Realtime)
*   **Icons** : Lucide React
*   **Notifications** : React Hot Toast
*   **Dates** : date-fns

### C. Configuration

*   **`package.json`** : Définit les dépendances et scripts (`dev`, `build`, `lint`).
*   **`vite.config.ts`** : Configuration du bundler Vite.
*   **`tsconfig.json`** : Configuration TypeScript.
*   **Variables d'environnement** (`.env`) :
    *   `VITE_SUPABASE_URL` : URL de l'instance Supabase.
    *   `VITE_SUPABASE_ANON_KEY` : Clé publique anonyme Supabase.

---

## 🔄 2. WORKFLOWS DE NAVIGATION

### A. Flux d'authentification

L'authentification est gérée par `SupabaseContext`.

1.  **Connexion** : `signIn(email, password)` appelle `supabase.auth.signInWithPassword`.
2.  **Inscription** : `signUp(email, password, name)` crée le compte Auth et une entrée dans la table `profiles`.
3.  **Session** : Persistance automatique via `supabase-js` (localStorage).
4.  **Logout** : `signOut()` détruit la session locale et serveur.

### B. Navigation principale

Définie dans `App.tsx` via `<Routes>` :

*   `/` : Accueil (Recherche)
*   `/messages` : Messagerie
*   `/favorites` : Favoris
*   `/create` : Création d'annonce
*   `/profile` : Profil utilisateur
*   `/listings/:id` : Détail annonce
*   `/admin` : Panel Admin (Protégé par `AdminRoute`)

**Guards** :
*   `AdminRoute` : Vérifie si l'utilisateur est connecté ET si son email est `admin@dekonvi.com`.

### C. Flux d'utilisation principaux

*   **Créer une annonce** : Formulaire multi-étapes (`CreateListing.tsx`) avec upload d'images, validation et prévisualisation.
*   **Consulter une annonce** : Page `ProductDetails.tsx` chargeant les données via ID URL.
*   **Messagerie** : `Messages.tsx` gère la liste des conversations et le chat en direct.

---

## ⚙️ 3. GESTION D'ÉTAT

### A. État global

Géré via React Context (`src/contexts/`):

*   **`SupabaseContext`** :
    *   `user` : Objet utilisateur Supabase actuel.
    *   `profile` : Données étendues du profil (nom, avatar, rating).
    *   `loading` : État de chargement initial de l'auth.

### B. État local

Utilisation intensive de `useState` et `useEffect` dans les composants :
*   Formulaires (inputs, validation).
*   Listes (annonces, messages).
*   UI (modales, menus, onglets).

### C. Persistance

*   **LocalStorage** :
    *   Sessions Supabase (`sb-<project>-auth-token`).
    *   Brouillons de formulaires (`createListingFormData`, `createListingImages`).
    *   État d'édition (`editingListing`).
*   **Synchronisation** : Les données critiques (profil, annonces) sont rechargées depuis Supabase à la connexion.

---

## 🎯 4. INTERACTIONS UTILISATEUR

### A. Formulaires

*   **Validation** : Validation côté client (HTML5 `required`, `maxLength`, types) et logique JS personnalisée (ex: limite 10 photos).
*   **Feedback** : Utilisation de `react-hot-toast` pour succès/erreur et messages d'erreur inline.

### B. Actions utilisateur

*   **Upload Photos** :
    1.  Sélection/Drag & Drop.
    2.  Prévisualisation locale (`URL.createObjectURL`).
    3.  Upload vers Supabase Storage (`listings/` bucket) à la soumission finale.
*   **Recherche** : Filtrage via requêtes Supabase (`.ilike()`, `.eq()`).

### C. Temps réel

*   **Supabase Realtime** : Utilisé pour la messagerie (nouveaux messages) et les notifications.
*   **Polling** : Fallback pour certaines mises à jour de listes.

---

## 🔌 5. INTÉGRATION BACKEND/API

### A. Endpoints API (Supabase)

Le client `supabase-js` agit comme une ORM sur l'API REST PostgREST.

*   `GET /rest/v1/listings` : Récupération des annonces.
*   `POST /rest/v1/listings` : Création.
*   `PATCH /rest/v1/listings` : Mise à jour.
*   `GET /rest/v1/messages` : Récupération des messages.

### B. Authentification API

*   **Headers** : `Authorization: Bearer <access_token>`, `apikey: <anon_key>`.
*   **Refresh** : Géré automatiquement par le client Supabase.

### C. Gestion des erreurs

*   `try/catch` autour des appels asynchrones.
*   Affichage via `toast.error()`.
*   Fallback REST si le client WebSocket échoue (implémenté dans `signIn`).

---

## 🧩 6. COMPOSANTS ET LOGIQUE MÉTIER

### A. Product Card
Affiche une annonce résumée. Gère le clic pour navigation et potentiellement l'ajout aux favoris (via contexte ou prop).

### B. Navbar
Gère la navigation responsive.
*   **Desktop** : Liens horizontaux.
*   **Mobile** : Menu hamburger + BottomNav fixe.
*   **État** : Détecte le scroll pour changer de style (`isScrolled`).

### C. Messages/Chat
*   **Structure** : Liste des conversations à gauche (ou vue principale mobile), Chat à droite.
*   **Logique** : `useConversations` hook pour fetcher les données.
*   **Temps réel** : Souscription aux changements sur la table `messages`.

### D. Formulaire création annonce (`CreateListing.tsx`)
*   **Étapes** : Photos -> Infos -> Prix/Loc -> Publication.
*   **Logique** :
    *   Sauvegarde automatique dans `localStorage`.
    *   Upload d'images en parallèle via `Promise.all`.
    *   Gestion du mode "Édition" via `editingId`.

### E. Admin Panel
*   **Accès** : Réservé à `admin@dekonvi.com`.
*   **Fonctions** : Voir/Approuver/Rejeter les annonces, Gérer les utilisateurs.

---

## 🔐 7. SÉCURITÉ

### A. Authentification
*   **JWT** : Tokens d'accès (1h) et refresh tokens.
*   **Stockage** : LocalStorage (standard Supabase).

### B. Autorisation
*   **RLS (Row Level Security)** : Configuré côté Supabase (PostgreSQL) pour restreindre l'accès aux données (ex: seul l'auteur peut modifier son annonce).
*   **Client-side** : `AdminRoute` empêche l'accès UI aux pages admin.

### C. Protection des données
*   **Sanitization** : React échappe par défaut les contenus pour éviter XSS.
*   **Validation** : Types TypeScript et contraintes DB.

---

## 🐛 8. GESTION DES ERREURS

### A. Erreurs réseau
*   Messages génériques "Une erreur est survenue" via Toast.
*   Fallback REST API pour l'auth en cas de timeout client.

### B. Erreurs de validation
*   Feedback visuel immédiat (bordures rouges, compteurs de caractères).

---

## ⚡ 9. OPTIMISATIONS

### A. Performance
*   **Vite** : Bundling optimisé (ES modules).
*   **Lazy Loading** : Routes React (implicite via import dynamique si configuré).

### B. Caching
*   **React Query** : (Non explicitement vu, mais recommandé). Actuellement cache manuel via `useState` et `localStorage`.

---

## 📱 10. RESPONSIVE ET MOBILE

### A. Breakpoints
*   Utilisation des breakpoints Tailwind par défaut (`sm`, `md`, `lg`, `xl`).
*   **Mobile-first** : Styles de base pour mobile, overrides pour desktop (`md:`).

### B. Adaptations mobile
*   **Navigation** : Bottom Bar fixe sur iOS/Android.
*   **Layout** : Grilles passant de 1 colonne (mobile) à 3/4 (desktop).
*   **Touch** : Zones de clic agrandies (`p-4`, `min-h-[44px]`).

---

## 🔄 11. WORKFLOWS SPÉCIFIQUES

### A. Workflow "Créer une annonce"
1.  **Accès** : Clic sur "Déposer une annonce" -> `/create`.
2.  **Saisie** : Remplissage formulaire, photos stockées en `File[]` en mémoire.
3.  **Soumission** :
    *   Upload images -> Storage -> Récupération URLs publiques.
    *   Insert row -> Table `listings` avec URLs images.
4.  **Post-traitement** : Redirection vers `/profile` + Toast succès.

### B. Workflow "Envoyer un message"
1.  **Déclencheur** : Page produit -> "Contacter".
2.  **Création** : Vérifie si conversation existe, sinon crée (table `conversations`).
3.  **Envoi** : Insert dans table `messages`. Trigger DB met à jour `last_message` de la conversation.

---

## 📊 12. DONNÉES ET MODÈLES

### A. Modèle User (Auth)
*   `id` (UUID), `email`, `created_at`.

### B. Modèle Profile (Public)
*   `id` (FK User), `name`, `avatar_url`, `rating`.

### C. Modèle Listing
*   `id`, `title`, `description`, `price`, `images` (Array), `category`, `location`, `seller_id` (FK), `status` (active/pending).

### D. Modèle Message
*   `id`, `conversation_id`, `sender_id`, `content`, `created_at`, `read` (boolean).

---

## 🎨 13. DESIGN SYSTEM ACTUEL

### Variables CSS (`premium-ui.css`)
*   **Couleurs** :
    *   Primary: `#2DD181` (Vert Dekonvi)
    *   Neutral: Échelle de gris (`#F9FAFB` à `#111827`)
*   **Spacing** : Échelle de 4px (`--space-1` = 4px).
*   **Radius** : `sm` (4px), `md` (8px), `lg` (12px), `xl` (16px), `full` (9999px).
*   **Shadows** : `sm`, `md`, `lg`, `xl` (douces et diffusées).
*   **Transitions** : `base` (200ms ease), `smooth` (300ms cubic-bezier).

Ce document sert de référence vivante pour le développement et la maintenance de Dekonvi.
