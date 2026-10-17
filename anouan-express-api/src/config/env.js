// src/config/env.js
// Chargement et validation des variables d'environnement
require('dotenv').config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Variable d'environnement manquante : ${key}`);
  return val;
};

const optional = (key, defaultVal = '') => process.env[key] || defaultVal;
const isJestRuntime = !!process.env.JEST_WORKER_ID;
const appEnv = optional('NODE_ENV', isJestRuntime ? 'test' : 'development');
const vercelUrl = optional('VERCEL_URL');
const appUrl = optional('APP_URL', vercelUrl ? `https://${vercelUrl}` : 'http://localhost:5000');
const jwtSecret = optional('JWT_SECRET', '5b483ade581c14f4775c2d5a7e8c6de061c061feee54187a2880e76295741c43');
const jwtRefreshSecret = optional('JWT_REFRESH_SECRET', 'e0bb70c9e08c73be0d7e246c68ff4f449e0154cde75a20a68028a2b6d98edea7');
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4174',
  'http://127.0.0.1:5173',
  'http://192.168.11.40:3000',
  'http://192.168.11.40:4173',
  'http://192.168.11.40:4174',
  'http://192.168.11.40:5173',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
];
const configuredOrigins = optional('ALLOWED_ORIGINS')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (appEnv === 'production') {
  const invalidSecret = (value) => !value || value.length < 32 || value.startsWith('dev_only_') || value.startsWith('changeme') || value.startsWith('test');
  if (invalidSecret(jwtSecret) || invalidSecret(jwtRefreshSecret) || jwtSecret === jwtRefreshSecret) {
     throw new Error('JWT_SECRET et JWT_REFRESH_SECRET doivent être définis avec des valeurs fortes et distinctes en production.');
  }
}

module.exports = {
  app: {
    env: appEnv,
    port: parseInt(optional('PORT', '5000'), 10),
    name: optional('APP_NAME', 'Anouan Express API'),
    url: optional('APP_URL', appUrl),
    clientUrl: optional('CLIENT_URL', appUrl),
  },

  db: {
    connectionString: optional(
      'DATABASE_URL',
      (process.env.VERCEL || appEnv === 'production')
        ? 'postgresql://postgres.rihbcvxjzistpbhliore:LqEgXf6BT7EUe6iB@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'
        : ''
    ),
    host: optional('DB_HOST', 'localhost'),
    port: parseInt(optional('DB_PORT', '5432'), 10),
    name: optional('DB_NAME', 'anouan_express'),
    user: optional('DB_USER', 'postgres'),
    password: optional('DB_PASSWORD', ''),
    ssl: optional('DB_SSL', (process.env.VERCEL || appEnv === 'production') ? 'true' : 'false') === 'true',
  },

  jwt: {
    secret: jwtSecret,
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshSecret: jwtRefreshSecret,
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  bcrypt: {
    rounds: parseInt(optional('BCRYPT_ROUNDS', '12'), 10),
  },

  upload: {
    dir: optional('UPLOAD_DIR', process.env.VERCEL ? '/tmp/anouan-express-uploads' : 'uploads'),
    maxSizeMb: parseInt(optional('UPLOAD_MAX_SIZE_MB', '5'), 10),
  },

  storage: {
    supabaseUrl: optional('SUPABASE_URL', 'https://rihbcvxjzistpbhliore.supabase.co'),
    serviceRoleKey: optional('SUPABASE_SERVICE_ROLE_KEY', optional('SUPABASE_ANON_KEY')),
    bucket: optional('SUPABASE_STORAGE_BUCKET', 'anouan-uploads'),
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
    origins: [...new Set(
      appEnv === 'production'
        ? [...configuredOrigins, appUrl, 'https://anouan-express.vercel.app']
         : [...configuredOrigins, ...defaultAllowedOrigins, 'https://anouan-express.vercel.app']
    )],
  },
};
