# Anouan Express — API Backend

> API REST Node.js + Express + PostgreSQL  
> Marketplace e-commerce avec retrait sécurisé en magasin — Bouaké, Côte d'Ivoire

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Runtime | Node.js |
| Framework | Express 4 |
| Base de données | Supabase PostgreSQL |
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
# Renseigner DATABASE_URL dans .env avec l'URI Supabase
# Project Settings > Database > Connection String > URI
# Sur Render/IPv4, choisir le pooler en mode Session (port 5432)
# Activer aussi DB_SSL=true

# Exécuter les migrations et les seeds sur Supabase
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

## Deploiement Vercel unifie

La configuration `vercel.json` a la racine construit la boutique React/Vite et expose l'API Express sous `/api` dans le meme projet Vercel. Les deux sous-projets restent dans leurs dossiers respectifs, mais partagent une URL publique. L'API se connecte a Supabase PostgreSQL via `DATABASE_URL`; l'authentification reste geree par Express.

1. Importer le depot complet dans Vercel et laisser **Root Directory** a la racine du depot.
2. Ajouter dans les variables Vercel `DATABASE_URL` (URI du pooler Supabase en mode Session, port 5432), `DB_SSL=true`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=anouan-uploads`, `JWT_SECRET` et `JWT_REFRESH_SECRET`. Configurer aussi les variables des services utilises (CinetPay, SMTP, Infobip, Firebase). Pour un domaine personnalise, definir `APP_URL` et `CLIENT_URL` avec ce domaine.
3. Recuperer l'URI dans Supabase > Project Settings > Database > Connect. Appliquer les migrations avec `npm run migrate` depuis `anouan-express-api`, puis verifier `/health` et les parcours de la boutique sur l'URL Vercel.

Le frontend utilise `/api` sur son origine courante; aucune URL API separee n'est necessaire. Les variables `DATABASE_URL` et les secrets JWT doivent rester dans l'environnement serveur, jamais dans Vite.

Les fonctions Vercel ne gardent pas de processus ni de disque persistant. Socket.IO est reserve au developpement; les builds de production (web et mobile) utilisent le polling du chat (5 secondes) et du suivi de commande (10 secondes).

Pour les fichiers, creer un bucket prive `anouan-uploads` dans Supabase Storage. Ajouter `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `SUPABASE_STORAGE_BUCKET=anouan-uploads` aux variables serveur Vercel. La cle service-role ne doit jamais etre ajoutee au frontend; l'API genere des URL signees temporaires pour lire les fichiers.
