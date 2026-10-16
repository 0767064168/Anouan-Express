// Entrypoint Vercel Serverless pour l'API Express
const app = require('../src/app');

module.exports = (req, res) => {
  return app(req, res);
};
