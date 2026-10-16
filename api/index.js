// Entrypoint Vercel Serverless — Anouan Express API
// Ce fichier est à la RACINE du monorepo (api/index.js)
// Il charge l'app Express depuis anouan-express-api/src/app.js

let app;
let initError = null;

try {
  // Charger dotenv depuis le sous-dossier API
  require('../anouan-express-api/node_modules/dotenv').config({
    path: require('path').join(__dirname, '..', 'anouan-express-api', '.env')
  });
} catch (e) {
  // dotenv peut ne pas être disponible en production (env vars injectées par Vercel)
  console.log('[Vercel] dotenv not loaded (expected in production):', e.message);
}

try {
  app = require('../anouan-express-api/src/app');
} catch (err) {
  initError = err;
  console.error('[Vercel API] Fatal initialization error:', err);
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
