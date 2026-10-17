# Anouan Express — API Backend

> API REST Node.js + Express + PostgreSQL  
> Marketplace e-commerce avec retrait sécurisé en magasin — Bouaké, Côte d'Ivoire

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Runtime | Node.js (≥ 18) |
| Framework | Express 5 (v5.2.1) |
| Base de données | Supabase PostgreSQL (Pooler 6543 / 5432) |
| Authentification | JWT (access 15min + refresh 7j) |
| Validation | Joi |
| Upload | Multer |
| PDF | PDFKit |
| QR Code | qrcode |
| Email | Nodemailer (SMTP) |
| SMS | Infobip |
| Push notifications | Firebase Cloud Messaging |
| Paiements | CinetPay (Orange Money, MTN MoMo, Wave) |

---

## Démarrage rapide

### 1. Prérequis
- Node.js ≥ 18
- Un projet Supabase (PostgreSQL)
- Un compte CinetPay (ou autre agrégateur) pour les paiements

### 2. Installation
```bash
cd anouan-express-api
npm install
```

### 3. Configuration
```bash
copy .env.example .env
# Éditez .env avec vos valeurs (DB, JWT secret, SMTP, etc.)
```

### 4. Base de données Supabase
```bash
# Renseigner DATABASE_URL dans .env avec l'URI Supabase :
# Project Settings > Database > Connection String > URI

# Deux modes de pooler sont disponibles sur Supabase :
# 1. Port 6543 (Transaction Pooler - Recommandé en Serverless / Vercel) :
#    postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
# 2. Port 5432 (Session Pooler - Pour migrations locales ou serveurs persistants) :
#    postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Activer systématiquement le SSL :
DB_SSL=true

# Exécuter les migrations et seeds sur Supabase
npm run migrate
```

Sans `DATABASE_URL`, l'API et les migrations utilisent les variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` et `DB_PASSWORD` pour une base PostgreSQL locale.

### 5. Lancer le serveur
```bash
npm run dev    # Développement (rechargement automatique)
npm start      # Production
```

Le serveur démarre sur `http://localhost:5000`

---

## Structure du projet

```
src/
├── app.js                    # Point d'entrée Express
├── config/
│   ├── database.js           # Pool PostgreSQL
│   └── env.js                # Variables d'environnement
├── middlewares/
│   ├── authenticate.js       # JWT vérification
│   ├── authorize.js          # Contrôle rôles
│   ├── validate.js           # Validation Joi
│   ├── rateLimiter.js        # Rate limiting
│   ├── auditLog.js           # Journal d'audit
│   ├── errorHandler.js       # Gestion centralisée des erreurs
│   └── upload.js             # Upload fichiers (Multer)
├── modules/
│   ├── auth/                 # Inscription, connexion, OTP, JWT
│   ├── users/                # Profils utilisateurs
│   ├── vendors/              # Boutiques vendeurs
│   ├── categories/           # Arborescence catégories
│   ├── products/             # Catalogue, recherche, variantes
│   ├── stores/               # Magasins centraux
│   ├── orders/               # Commandes, statuts, PDF
│   ├── payments/             # CinetPay, webhooks
│   ├── pickup/               # Réception magasin + code retrait
│   ├── reviews/              # Avis et notes
│   ├── messages/             # Messagerie client-vendeur
│   ├── disputes/             # Litiges et remboursements
│   ├── notifications/        # Notifications in-app
│   ├── finance/              # Stats vendeur, versements, export
│   └── admin/                # Bannières, flash sales, paramètres
└── utils/
    ├── pickupCode.js         # Génération code retrait
    ├── qrCode.js             # QR code
    ├── pdfGenerator.js       # Factures et bordereaux PDF
    ├── emailService.js       # Envoi emails
    ├── smsService.js         # Envoi SMS
    └── pushNotification.js   # Notifications FCM
```

---

## Rôles utilisateurs

| Rôle | Description |
|------|-------------|
| `client` | Acheteur : catalogue, panier, commandes, retrait |
| `vendor` | Vendeur : boutique, produits, commandes reçues |
| `admin` | Administrateur plateforme : back-office complet |
| `agent` | Agent magasin : réception colis, remise code |

---

## Endpoints principaux

| Module | Base URL |
|--------|----------|
| Authentification | `POST /api/auth/register` |
| Catalogue | `GET /api/products` |
| Commandes | `POST /api/orders` |
| Paiements | `POST /api/payments/initiate` |
| Code retrait | `GET /api/pickup/code/:orderId` |
| Réception agent | `POST /api/pickup/receive` |
| Validation code | `POST /api/pickup/validate` |
| Stats admin | `GET /api/finance/admin/stats` |

---

## Compte administrateur

Le compte administrateur est créé par `npm run db:setup` à partir de `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `.env`. Aucun mot de passe administrateur n'est inclus dans le dépôt.

---

## Sécurité

- JWT access token (15 min) + refresh token (7 jours)
- Bcrypt avec 12 rounds
- Helmet.js (headers HTTP sécurisés)
- CORS restreint aux origines autorisées
- Rate limiting sur auth, paiements, code de retrait
- Requêtes paramétrées (protection injection SQL)
- Audit log des actions sensibles
- Code de retrait : usage unique, expiration configurable, blocage après N tentatives

---

## Variables d'environnement clés

Voir `.env.example` pour la liste complète.

| Variable | Description |
|----------|-------------|
| `DB_*` | Connexion PostgreSQL |
| `JWT_SECRET` | Clé de signature JWT (min 32 chars) |
| `CINETPAY_API_KEY` | Clé API agrégateur paiement |
| `FCM_*` | Firebase Cloud Messaging |
| `SMTP_*` | Configuration email |
| `INFOBIP_*` | Passerelle SMS |

## Déploiement Vercel unifié

La configuration `vercel.json` à la racine construit la boutique React/Vite et expose l'API Express sous `/api` dans le même projet Vercel (`https://anouan-express.vercel.app`). L'API se connecte à Supabase PostgreSQL via `DATABASE_URL` et authentifie les utilisateurs via JWT.

1. **Root Directory** : Laisser à la racine du dépôt pour le projet principal.
2. **Variables d'environnement Vercel** :
   - `DATABASE_URL` : URI du pooler Supabase (port `6543` en mode Transaction pooler pour serverless, ou port `5432` en session pooler) :
     `postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
   - `DB_SSL=true`
   - `JWT_SECRET` et `JWT_REFRESH_SECRET` : Clés fortes et distinctes d'au moins 32 caractères.
   - `SUPABASE_URL` : `https://<PROJECT_REF>.supabase.co`
   - `SUPABASE_STORAGE_BUCKET` : `anouan-uploads`
   - `SUPABASE_SERVICE_ROLE_KEY` : (Optionnel) Clé service-role pour générer des URLs signées si le bucket est privé.
   - Services tiers : CinetPay, Infobip, Nodemailer SMTP, Firebase Admin.
3. **Point d'entrée Serverless** :
   - [api/index.js](file:///c:/Users/hp/Documents/Anouan%20Express/api/index.js) (monorepo unifié) et [anouan-express-api/api/index.js](file:///c:/Users/hp/Documents/Anouan%20Express/anouan-express-api/api/index.js) (projet standalone API) garantissent le chargement des variables d'environnement en production et isolent l'Express app.
4. **Stockage d'images (Supabase Storage)** :
   - L'API gère automatiquement à la fois les buckets privés (génération d'URLs signées temporaires sécurisées) et les buckets publics (redirection directe haute performance vers le CDN public Supabase `/storage/v1/object/public/...`).
5. **Temps réel et polling** :
   - Les fonctions Vercel étant stateless, Socket.IO est actif en local, tandis que la production (web et application mobile Android) utilise un rafraîchissement périodique optimisé (polling 3s pour le chat actif, 10s pour le suivi de commande).
