// src/app.js
// Point d'entrée principal de l'API Anouan Express

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const { testConnection } = require('./config/database');
const { globalLimiter } = require('./middlewares/rateLimiter');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { sanitizeInputs } = require('./middlewares/sanitize');
const { csrfProtection } = require('./middlewares/csrf');

// ─── Import des routes ────────────────────────────────────────
const authRoutes         = require('./modules/auth/auth.routes');
const usersRoutes        = require('./modules/users/users.routes');
const vendorsRoutes      = require('./modules/vendors/vendors.routes');
const categoriesRoutes   = require('./modules/categories/categories.routes');
const productsRoutes     = require('./modules/products/products.routes');
const storesRoutes       = require('./modules/stores/stores.routes');
const ordersRoutes       = require('./modules/orders/orders.routes');
const paymentsRoutes     = require('./modules/payments/payments.routes');
const pickupRoutes       = require('./modules/pickup/pickup.routes');
const reviewsRoutes      = require('./modules/reviews/reviews.routes');
const messagesRoutes     = require('./modules/messages/messages.routes');
const disputesRoutes     = require('./modules/disputes/disputes.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const financeRoutes      = require('./modules/finance/finance.routes');
const adminRoutes        = require('./modules/admin/admin.routes');

// ─── Initialisation Express ───────────────────────────────────
const app = express();

// ─── Sécurité ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:            ["'self'"],
      scriptSrc:             ["'self'", "'unsafe-inline'"], // Vite HMR dev
      styleSrc:              ["'self'", "'unsafe-inline'"],
      imgSrc:                ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc:            ["'self'", 'http://localhost:*', 'https:'],
      fontSrc:               ["'self'", 'https:', 'data:'],
      objectSrc:             ["'none'"],
      frameAncestors:        ["'none'"],
      upgradeInsecureRequests: env.app.env === 'production' ? [] : null,
    },
  },
  hsts: env.app.env === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  noSniff: true,
  xssFilter: true,
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Autorise les appels sans origin (mobile apps, Postman)
    if (!origin || env.cors.origins.includes(origin) || origin === 'capacitor://localhost' || origin === 'http://localhost') {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origine non autorisée — ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// ─── Parsers ──────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(csrfProtection);

// ─── Sanitisation XSS ─────────────────────────────────────────
app.use(sanitizeInputs);

// ─── Logging ──────────────────────────────────────────────────
if (env.app.env !== 'test') {
  app.use(morgan(env.app.env === 'development' ? 'dev' : 'combined'));
}

// ─── Rate limiting global ─────────────────────────────────────
app.use('/api', globalLimiter);

// ─── Fichiers statiques (uploads) ────────────────────────────
app.use('/uploads', express.static(path.resolve(env.upload.dir)));

// ─── Route de santé ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: env.app.name,
    version: '1.0.0',
    env: env.app.env,
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes API ───────────────────────────────────────────────
const API = '/api';

app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/users`,         usersRoutes);
app.use(`${API}/vendors`,       vendorsRoutes);
app.use(`${API}/categories`,    categoriesRoutes);
app.use(`${API}/products`,      productsRoutes);
app.use(`${API}/stores`,        storesRoutes);
app.use(`${API}/orders`,        ordersRoutes);
app.use(`${API}/payments`,      paymentsRoutes);
app.use(`${API}/pickup`,        pickupRoutes);
app.use(`${API}/reviews`,       reviewsRoutes);
app.use(`${API}/messages`,      messagesRoutes);
app.use(`${API}/disputes`,      disputesRoutes);
app.use(`${API}/notifications`, notificationsRoutes);
app.use(`${API}/finance`,       financeRoutes);
app.use(`${API}/admin`,         adminRoutes);

// ─── Gestion des erreurs ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Démarrage ────────────────────────────────────────────────
const start = async () => {
  try {
    await testConnection();
    app.listen(env.app.port, '0.0.0.0', () => {
      console.log(`\n🚀 ${env.app.name} démarré`);
      console.log(`   Environnement : ${env.app.env}`);
      console.log(`   Port          : ${env.app.port}`);
      console.log(`   URL           : ${env.app.url}`);
      console.log(`   Réseau        : http://192.168.11.40:${env.app.port}\n`);
    });
  } catch (err) {
    console.error('❌ Impossible de démarrer le serveur :', err.message);
    process.exit(1);
  }
};

if (env.app.env !== 'test') {
  start();
}

module.exports = app; // Pour les tests
