#!/usr/bin/env node
// scripts/migrate-production.js
// Lance toutes les migrations dans l ordre sur la base de donnees de production
// Usage : node scripts/migrate-production.js
// Ou via DATABASE_URL : DATABASE_URL="postgres://..." node scripts/migrate-production.js

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const migrations = [
  '001_schema.sql',
  '002_seeds.sql',
  '003_add_flash_sale_columns.sql',
  '004_add_payout_destination.sql',
  '005_add_account_and_dispute_fields.sql',
  '006_add_flash_sale_inventory.sql',
  '007_add_banner_updated_at.sql',
  '008_add_banner_display_fields.sql',
  '009_add_agent_store_assignment.sql',
  '010_add_message_attachments.sql',
];

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  const isSsl = process.env.DB_SSL === 'true' || 
    (connectionString && (
      connectionString.includes('supabase') || 
      connectionString.includes('sslmode=require') || 
      connectionString.includes('render.com') ||
      process.env.NODE_ENV === 'production'
    ));

  const client = new Client({
    connectionString: connectionString || undefined,
    host: !connectionString ? (process.env.DB_HOST || 'localhost') : undefined,
    port: !connectionString ? parseInt(process.env.DB_PORT || '5432') : undefined,
    database: !connectionString ? (process.env.DB_NAME || 'anouan_express') : undefined,
    user: !connectionString ? (process.env.DB_USER || 'postgres') : undefined,
    password: !connectionString ? (process.env.DB_PASSWORD || '') : undefined,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connexion PostgreSQL etablie');

    for (const file of migrations) {
      const filePath = path.join(__dirname, '..', 'migrations', file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Migration introuvable : ${file} — ignoree`);
        continue;
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      try {
        await client.query(sql);
        console.log(`✅ ${file}`);
      } catch (err) {
        // Ignorer les erreurs "deja existant"
        if (err.code === '42P07' || err.code === '42710' || err.message.includes('already exists')) {
          console.log(`⚠️  ${file} — deja appliquee (ignoree)`);
        } else {
          console.error(`❌ ${file} — ERREUR : ${err.message}`);
          throw err;
        }
      }
    }

    console.log('\n🎉 Toutes les migrations ont ete appliquees !');
  } finally {
    await client.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration echouee :', err.message);
  process.exit(1);
});
