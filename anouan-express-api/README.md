# Anouan Express — API Backend

> API REST Node.js + Express + PostgreSQL  
> Marketplace e-commerce avec retrait sécurisé en magasin — Bouaké, Côte d'Ivoire

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Runtime | Node.js |
| Framework | Express 4 |
| Base de données | PostgreSQL |
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
- PostgreSQL ≥ 14
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

### 4. Base de données
```bash
# Créer la base de données
psql -U postgres -c "CREATE DATABASE anouan_express;"

# Exécuter toutes les migrations + seeds
npm run migrate:unix

# Ou sous Windows PowerShell avec les variables DB_* configurées
npm run migrate
```

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

## Checklist de déploiement Render / Vercel

### Render — API

Configurer ces variables dans le service API Render :

```text
NODE_ENV=production
CLIENT_URL=https://<votre-projet>.vercel.app
ALLOWED_ORIGINS=https://<votre-projet>.vercel.app
JWT_SECRET=<secret aleatoire de 32 caracteres minimum>
JWT_REFRESH_SECRET=<autre secret aleatoire de 32 caracteres minimum>
CINETPAY_NOTIFY_URL=https://<api-render>.onrender.com/api/payments/webhook
CINETPAY_RETURN_URL=https://<votre-projet>.vercel.app/payment/callback
```

Ajouter également les variables PostgreSQL (`DATABASE_URL` ou `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) et les identifiants réellement utilisés : CinetPay, SMTP, Infobip et Firebase. Les deux secrets JWT doivent être distincts et ne doivent jamais reprendre les valeurs de `.env.example`.

### Vercel — frontend

Dans les variables d’environnement du projet Vercel, configurer pour l’environnement Production :

```text
VITE_API_URL=https://<api-render>.onrender.com/api
```

Après modification de `VITE_API_URL`, relancer un déploiement Vercel : les variables `VITE_*` sont intégrées au build frontend.

### Vérification avant mise en ligne

Depuis `anouan-express-api` :

```bash
npm test -- --runInBand
node scripts/deploy-check.js
```

Tester ensuite `https://<api-render>.onrender.com/health`, la connexion frontend, le rafraîchissement de session, un paiement de test et la réception du webhook CinetPay. Ne pas utiliser `*` dans `ALLOWED_ORIGINS` avec les cookies d’authentification.
