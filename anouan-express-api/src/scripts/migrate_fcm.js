const { query } = require('../config/database');

async function run() {
  try {
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT');
    console.log('✅ Colonne fcm_token vérifiée / ajoutée avec succès.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la migration fcm_token:', err.message);
    process.exit(1);
  }
}

run();
