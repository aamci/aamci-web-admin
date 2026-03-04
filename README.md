# @health/web-admin — Portail Administrateur

Interface d'administration de la plateforme santé. Réservé aux comptes avec le rôle `ADMIN`.

## Description

Application Next.js 15 (App Router) permettant aux administrateurs de gérer les utilisateurs, les médecins, les établissements, les transactions financières, les rendez-vous, la configuration du chiffrement et les journaux d'audit. L'accès est protégé par un guard côté client (`AdminGuard`) et validé côté serveur via JWT.

**Port local :** `3003`
**Proxy API :** `/api/*` → `http://localhost:3002` (web-pro backend)

---

## Stack technique

<!-- STACK:START -->
| Module | Version | Type | Description |
|--------|---------|------|-------------|
| next | 15.0.0 | Framework | Framework React avec App Router, Server Components, routing basé fichiers |
| react | 18.2.0 | Framework | Bibliothèque UI — composants, hooks, contexte |
| react-dom | 18.2.0 | Framework | Rendu React dans le DOM |
| @radix-ui/react-avatar | 1.x | UI | Composant Avatar accessible (image + fallback) |
| @radix-ui/react-dialog | 1.x | UI | Composant Dialog/Modal accessible |
| @radix-ui/react-dropdown-menu | 2.x | UI | Menu déroulant accessible |
| @radix-ui/react-label | 2.x | UI | Label accessible lié à un champ de formulaire |
| @radix-ui/react-progress | 1.x | UI | Barre de progression accessible |
| @radix-ui/react-scroll-area | 1.x | UI | Zone de défilement personnalisée accessible |
| @radix-ui/react-select | 2.x | UI | Select accessible avec recherche et groupes |
| @radix-ui/react-slot | 1.x | UI | Primitif Slot — composition de composants polymorphiques |
| @radix-ui/react-tabs | 1.x | UI | Onglets accessibles (ARIA) |
| class-variance-authority | 0.7.x | UI | Gestion des variantes CSS pour les composants shadcn/ui |
| clsx | 2.x | UI | Utilitaire de concaténation conditionnelle de classes CSS |
| date-fns | 4.x | Utilitaire | Manipulation et formatage des dates |
| jwt-decode | 3.x | Auth | Décodage côté client des JWT (sans vérification de signature) |
| lucide-react | 0.553.x | UI | Bibliothèque d'icônes SVG |
| recharts | 2.x | UI | Graphiques React (statistiques, dashboards) |
| tailwind-merge | 3.x | UI | Fusion intelligente des classes Tailwind (évite les conflits) |
| tailwindcss-animate | 1.x | UI | Plugin Tailwind pour les animations |
| zod | 3.x | Validation | Validation et parsing de schémas TypeScript |
| tailwindcss | 3.x | CSS | Framework CSS utility-first |
| postcss | 8.x | CSS | Processeur CSS (requis par Tailwind) |
| autoprefixer | 10.x | CSS | Plugin PostCSS — ajout automatique des préfixes vendor |
| typescript | 5.x | Dev | Compilateur TypeScript |
| vitest | 4.x | Test | Framework de tests unitaires compatible Vite |
| @vitejs/plugin-react | 5.x | Test | Plugin Vite/Vitest pour le support React (JSX transform, Fast Refresh) |
| @testing-library/react | 16.x | Test | Tests des composants React — render, queries, interactions |
| @testing-library/jest-dom | 6.x | Test | Matchers Jest/Vitest pour les assertions DOM |
| @testing-library/user-event | 14.x | Test | Simulation d'interactions utilisateur réalistes |
| jsdom | 28.x | Test | Implémentation DOM pour les tests en environnement Node.js |
<!-- STACK:END -->

---

## Variables d'environnement

Fichier : `.env.local`

| Variable | Obligatoire | Description |
|----------|:-----------:|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Oui | URL de base de l'API NestJS — ex: `http://localhost:3000` (dev) ou `https://api.healthplatform.com` (prod) |

---

## Lancement en local

### Prérequis

- Node.js ≥ 20
- pnpm ≥ 9
- L'API (`@health/api`) démarrée sur le port `3000`

### Démarrage

```bash
# 1. Depuis la racine du monorepo — installer les dépendances
pnpm install

# 2. Configurer l'environnement
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:3000" > apps/web-admin/.env.local

# 3. Démarrer le serveur de développement
cd apps/web-admin
pnpm dev
```

L'interface est accessible sur `http://localhost:3003`.

### Commandes utiles

```bash
pnpm dev           # Serveur de développement (port 3003)
pnpm build         # Build de production
pnpm start         # Serveur de production (port 3003)
pnpm test          # Tests en mode watch
pnpm test:run      # Tests une fois (CI)
pnpm test:coverage # Tests avec rapport de couverture
node scripts/validate-readme.js  # Vérifier la cohérence README ↔ package.json
```

### Pages disponibles

| Route | Description |
|-------|-------------|
| `/login` | Authentification (ADMIN uniquement) |
| `/dashboard` | Vue d'ensemble — statistiques globales |
| `/users` | Gestion des utilisateurs |
| `/users/[id]` | Détail d'un utilisateur |
| `/doctors` | Gestion des médecins et profils |
| `/facilities` | Gestion des établissements |
| `/appointments` | Vue globale des rendez-vous |
| `/transactions` | Historique des transactions financières |
| `/audit` | Journaux d'audit |
| `/encryption` | Configuration du chiffrement AES-256-GCM |
| `/settings` | Paramètres de la plateforme |
| `/403` | Page d'accès refusé |

### Configuration Next.js notable

- `output: 'standalone'` — build autonome pour Docker
- Proxy `/api/*` → `http://localhost:3002` — redirige vers l'API en développement
- `reactStrictMode: true`
