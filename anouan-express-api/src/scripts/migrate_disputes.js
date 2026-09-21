const { query } = require('../config/database');

async function run() {
  try {
    await query(`
      ALTER TABLE disputes 
      ADD COLUMN IF NOT EXISTS images TEXT[],
      ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'quality';
    `);
    console.log('✅ Colonnes images et type vérifiées / ajoutées sur la table disputes.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur migration disputes:', err.message);
    process.exit(1);
  }
}

run();
