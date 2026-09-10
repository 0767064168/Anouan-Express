// src/config/env.js
// Chargement et validation des variables d'environnement
require('dotenv').config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Variable d'environnement manquante : ${key}`);
  return val;
};

const optional = (key, defaultVal = '') => process.env[key] || defaultVal;

module.exports = {
  app: {
    env: optional('NODE_ENV', 'development'),
    port: parseInt(optional('PORT', '5000'), 10),
    name: optional('APP_NAME', 'Anouan Express API'),
    url: optional('APP_URL', 'http://localhost:5000'),
    clientUrl: optional('CLIENT_URL', 'http://localhost:3000'),
  },

  db: {
    host: optional('DB_HOST', 'localhost'),
    port: parseInt(optional('DB_PORT', '5432'), 10),
    name: optional('DB_NAME', 'anouan_express'),
    user: optional('DB_USER', 'postgres'),
    password: optional('DB_PASSWORD', ''),
    ssl: optional('DB_SSL', 'false') === 'true',
  },

  jwt: {
    secret: optional('JWT_SECRET', 'changeme_secret_32_chars_minimum!!'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshSecret: optional('JWT_REFRESH_SECRET', 'changeme_refresh_secret!!'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  bcrypt: {
    rounds: parseInt(optional('BCRYPT_ROUNDS', '12'), 10),
  },

  upload: {
    dir: optional('UPLOAD_DIR', 'uploads'),
    maxSizeMb: parseInt(optional('UPLOAD_MAX_SIZE_MB', '5'), 10),
  },

  payment: {
    provider: optional('PAYMENT_PROVIDER', 'cinetpay'),
    cinetpay: {
      apiKey: optional('CINETPAY_API_KEY'),
      siteId: optional('CINETPAY_SITE_ID'),
      notifyUrl: optional('CINETPAY_NOTIFY_URL'),
      returnUrl: optional('CINETPAY_RETURN_URL'),
    },
  },

  sms: {
    provider: optional('SMS_PROVIDER', 'infobip'),
    infobip: {
      baseUrl: optional('INFOBIP_BASE_URL'),
      apiKey: optional('INFOBIP_API_KEY'),
    },
    from: optional('SMS_FROM', 'AnouanExpress'),
  },

  email: {
    host: optional('SMTP_HOST'),
    port: parseInt(optional('SMTP_PORT', '587'), 10),
    user: optional('SMTP_USER'),
    pass: optional('SMTP_PASS'),
    from: optional('EMAIL_FROM', 'noreply@anouanexpress.ci'),
    fromName: optional('EMAIL_FROM_NAME', 'Anouan Express'),
  },

  fcm: {
    projectId: optional('FCM_PROJECT_ID'),
    clientEmail: optional('FCM_CLIENT_EMAIL'),
    privateKey: optional('FCM_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
  },

  pickup: {
    codeLength: parseInt(optional('PICKUP_CODE_LENGTH', '8'), 10),
    validityDays: parseInt(optional('PICKUP_CODE_VALIDITY_DAYS', '15'), 10),
    maxAttempts: parseInt(optional('PICKUP_CODE_MAX_ATTEMPTS', '5'), 10),
  },

  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
    authMax: parseInt(optional('AUTH_RATE_LIMIT_MAX', '10'), 10),
  },

  cors: {
    origins: optional('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  },
};
