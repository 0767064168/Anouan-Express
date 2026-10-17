// Entrypoint Vercel Serverless pour le projet standalone anouan-express-api
process.env.VERCEL = '1';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres.rihbcvxjzistpbhliore:LqEgXf6BT7EUe6iB@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
}
if (!process.env.DB_SSL) {
  process.env.DB_SSL = 'true';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = '5b483ade581c14f4775c2d5a7e8c6de061c061feee54187a2880e76295741c43';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'e0bb70c9e08c73be0d7e246c68ff4f449e0154cde75a20a68028a2b6d98edea7';
}
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://rihbcvxjzistpbhliore.supabase.co';
}
if (!process.env.SUPABASE_STORAGE_BUCKET) {
  process.env.SUPABASE_STORAGE_BUCKET = 'anouan-uploads';
}

let app;
let initError = null;

try {
  app = require('../src/app');
} catch (err) {
  initError = err;
  console.error('[Vercel API Standalone] Fatal initialization error:', err);
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      error: 'API_INITIALIZATION_ERROR',
      message: initError.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : initError.stack
    });
  }
  return app(req, res);
};
