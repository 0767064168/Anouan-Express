# Anouan Express — Marketplace E-Commerce & Retrait Magasin

> Marketplace e-commerce omnicanale (Web & Mobile Android) avec retrait sécurisé en magasins relais — Bouaké, Côte d'Ivoire.  
> Déploiement unifié sur **Vercel** (`https://anouan-express.vercel.app`) et **Supabase** (PostgreSQL & Storage).

---

## 🏛️ Architecture du Monorepo

```
Anouan-Express/
├── anouan-express-api/          # Backend Node.js / Express 5 REST API
│   ├── src/                     # Contrôleurs, services, middlewares, utils
│   ├── test/                    # Suite de tests Jest (53 tests unitaires & intégration)
│   ├── api/index.js             # Entrypoint serverless standalone pour Vercel
│   └── vercel.json              # Configuration de routage API
│
├── anouan-express-web/          # Frontend React 18 / Vite / Tailwind CSS
│   ├── src/                     # Pages (Client, Vendeur, Admin, Agent), Composants
│   ├── android/                 # Projet natif Android Capacitor 8
│   └── vercel.json              # Configuration proxy et routage SPA
│
├── api/
│   └── index.js                 # Entrypoint serverless Vercel racine (Monorepo)
│
├── mobile-builds/               # APKs Android compilés
│   └── AnouanExpress-Production.apk # APK officiel connecté à la production
│
├── vercel.json                  # Déploiement monorepo unifié Vercel
├── package.json                 # Workspaces npm (API + Web)
└── lancer-serveurs.bat          # Script de démarrage local Windows (IP 192.168.11.40)
```

---

## 🚀 Technologies & Stack

| Composant | Technologie | Version / Détails |
|---|---|---|
| **Frontend Web** | React + Vite + Tailwind CSS | React 18, Vite 5, Tailwind 3 |
| **Mobile** | Capacitor Android | Capacitor 8 (APK Android natif) |
| **Backend API** | Node.js + Express | Express 5 (`v5.2.1`), PostgreSQL `pg` pooler |
| **Base de données** | Supabase PostgreSQL | Pooler Transaction `6543` / Session `5432` |
| **Stockage Fichiers** | Supabase Storage | Bucket `anouan-uploads` (CDN public & URLs signées) |
| **Authentification** | JWT sécurisé | Access token (15m) + Refresh token (7j) HTTP-only |
| **Hébergement** | Vercel Serverless | Production : `https://anouan-express.vercel.app` |

---

## 🌐 Déploiement en Production

La plateforme utilise un déploiement monorepo Vercel unifié :
- **URL Publique** : `https://anouan-express.vercel.app`
- **Frontend SPA** : Servi à la racine (`/`)
- **API Backend** : Accessible directement sous `/api/*` et `/health`
- **CDN Uploads** : Redirection automatique vers Supabase Storage (`/uploads/*`)

### Variables d'environnement critiques (Vercel) :
- `DATABASE_URL` : `postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
- `DB_SSL` : `true`
- `SUPABASE_URL` : `https://<PROJECT_REF>.supabase.co`
- `SUPABASE_STORAGE_BUCKET` : `anouan-uploads`
- `JWT_SECRET` & `JWT_REFRESH_SECRET` : Clés secrètes fortes (min 32 caractères)

---

## 💻 Développement Local

### Prérequis
- Node.js ≥ 18
- npm ≥ 9

### Démarrage rapide (Windows)
Double-cliquez sur `lancer-serveurs.bat` ou exécutez dans le terminal :
```bash
# Installation des dépendances du monorepo
npm install

# Démarrer l'API backend (port 5000)
cd anouan-express-api
npm run dev

# Démarrer le frontend web (port 3000)
cd ../anouan-express-web
npm run dev
```

### Lancer les tests
```bash
npm test
# Exécute la suite complète Jest (16 suites, 53 tests)
```

---

## 📱 Application Mobile Android

L'application Android est configurée avec Capacitor et synchronisée avec le bundle Vite :
- Pour recompiler l'application mobile de production :
  ```bash
  cd anouan-express-web
  npm run build:mobile
  cd android
  ./gradlew assembleRelease
  ```
- L'APK officiel prêt à installer se trouve dans :
  `mobile-builds/AnouanExpress-Production.apk`
