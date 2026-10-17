// src/app.js
// Point d'entrée principal de l'API Anouan Express

const express = require('express');
const fs = require('fs');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const { testConnection } = require('./config/database');
const { initSocket } = require('./config/socket');
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
    if (!origin || env.cors.origins.includes(origin) || origin === 'capacitor://localhost' || origin === 'http://localhost' || origin === 'https://localhost') {
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
if (process.env.VERCEL) {
  app.use('/uploads', async (req, res, next) => {
    const { supabaseUrl, serviceRoleKey, bucket } = env.storage;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(503).json({ success: false, message: 'Supabase Storage n’est pas configuré.' });
    }

    const objectPath = req.path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
    if (!objectPath) return next();

    try {
      const response = await fetch(
        `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${objectPath}`,
        {
          method: 'POST',
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expiresIn: 3600 }),
        }
      );
      if (!response.ok) {
        return res.status(404).json({ success: false, message: 'Fichier introuvable dans Supabase Storage.' });
      }
      const { signedURL } = await response.json();
      return res.redirect(302, new URL(signedURL, supabaseUrl).toString());
    } catch (error) {
      return next(error);
    }
  });
}
app.use('/uploads', express.static(path.resolve(env.upload.dir)));

// Serve the Vite build when the frontend is deployed with the API.
const webBuildPath = path.resolve(__dirname, '../../anouan-express-web/dist');
const hasWebBuild = fs.existsSync(path.join(webBuildPath, 'index.html'));
if (hasWebBuild) {
  app.use(express.static(webBuildPath));
}

// ─── Route d'accueil & Santé ─────────────────────────────────
app.get(['/', '/api'], (req, res) => {
  res.json({
    success: true,
    message: "Bienvenue sur l'API Anouan Express",
    app: env.app.name,
    version: '1.0.1',
    status: 'online',
    health: '/health',
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: env.app.name,
    version: '1.0.1',
    env: env.app.env,
    database: env.db.connectionString ? 'configured' : 'not_configured',
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

app.use((req, res, next) => {
  if (
    !hasWebBuild ||
    req.method !== 'GET' ||
    req.path === '/health' ||
    req.path === API ||
    req.path.startsWith(`${API}/`) ||
    req.path === '/uploads' ||
    req.path.startsWith('/uploads/') ||
    req.path === '/socket.io' ||
    req.path.startsWith('/socket.io/')
  ) {
    return next();
  }

  return res.sendFile(path.join(webBuildPath, 'index.html'));
});

// ─── Gestion des erreurs ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Démarrage ────────────────────────────────────────────────
const server = process.env.VERCEL ? null : http.createServer(app);
const io = server ? initSocket(server) : null;

const start = async () => {
  try {
    await testConnection();
    server.listen(env.app.port, '0.0.0.0', () => {
      console.log(`\n🚀 ${env.app.name} démarré avec WebSockets`);
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

if (env.app.env !== 'test' && !process.env.JEST_WORKER_ID && !process.env.VERCEL) {
  start();
}

module.exports = app;
module.exports.app = app;
module.exports.server = server;
module.exports.io = io;
