// Entrypoint Vercel Serverless pour l'API Express
let app;
let initError = null;

try {
  app = require('../src/app');
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
