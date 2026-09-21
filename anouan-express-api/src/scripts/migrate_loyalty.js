const { query } = require('../config/database');
async function migrate() {
  console.log('[MIGRATION] Ajout colonne loyalty_points...');
  await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0');
  console.log('[MIGRATION] OK');
  process.exit(0);
}
migrate().catch((err) => { console.error('[MIGRATION] ERREUR:', err.message); process.exit(1); });
