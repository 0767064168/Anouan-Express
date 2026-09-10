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

# Exécuter les migrations + seeds
psql -U postgres -d anouan_express -f migrations/001_schema.sql
psql -U postgres -d anouan_express -f migrations/002_seeds.sql
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
