// scripts/setup-db.js
// Script d'initialisation et de création automatique de la base de données PostgreSQL

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbName = process.env.DB_NAME || 'anouan_express';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'root';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const connectionString = process.env.DATABASE_URL;
const isSsl = process.env.DB_SSL === 'true' ||
  (connectionString && (
    connectionString.includes('supabase') ||
    connectionString.includes('sslmode=require') ||
    process.env.NODE_ENV === 'production'
  ));
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

function createPool(database = dbName) {
  const ssl = isSsl ? { rejectUnauthorized: false } : false;
  return new Pool(connectionString
    ? { connectionString, ssl }
    : {
        host: dbHost,
        port: dbPort,
        database,
        user: dbUser,
        password: dbPassword,
        ssl,
      });
}

async function ensureDatabaseExists() {
  const rootPool = createPool('postgres');

  try {
    const client = await rootPool.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`📦 Création automatique de la base de données "${dbName}"...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Base de données "${dbName}" créée avec succès !`);
    } else {
      console.log(`ℹ️ La base de données "${dbName}" existe déjà.`);
    }
    client.release();
  } catch (err) {
    console.error('❌ Erreur lors de la vérification/création de la base :', err.message);
  } finally {
    await rootPool.end();
  }
}

async function runSetup() {
  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD sont obligatoires; le mot de passe doit contenir au moins 12 caractères.');
  }

  console.log('🔄 Connexion à PostgreSQL...');
  if (!connectionString) {
    await ensureDatabaseExists();
  }

  const targetPool = createPool();

  try {
    const client = await targetPool.connect();
    console.log('✅ Connecté avec succès à la base :', connectionString ? 'Supabase PostgreSQL' : dbName);

    const schemaPath = path.join(__dirname, '../migrations/001_schema.sql');
    const seedsPath = path.join(__dirname, '../migrations/002_seeds.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('📜 Exécution du schéma (001_schema.sql)...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('✅ Schéma appliqué avec succès !');
    }

    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10),
        ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS refresh_token TEXT;
    `);
    console.log('✅ Colonnes utilisateur de sécurité vérifiées.');

    if (fs.existsSync(seedsPath)) {
      console.log('🌱 Exécution des données de test (002_seeds.sql)...');
      const seedsSql = fs.readFileSync(seedsPath, 'utf8');
      await client.query(seedsSql);
      console.log('✅ Données initiales insérées avec succès !');
    }

    const adminHash = await bcrypt.hash(adminPassword, 12);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'admin', 'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', status = 'active'`,
      ['Administrateur', adminEmail, adminHash]
    );
    console.log(`✅ Compte administrateur configuré pour ${adminEmail}.`);

    const migration003Path = path.join(__dirname, '../migrations/003_add_flash_sale_columns.sql');
    if (fs.existsSync(migration003Path)) {
      console.log('⚡ Application de la migration flash sale (003_add_flash_sale_columns.sql)...');
      const sql003 = fs.readFileSync(migration003Path, 'utf8');
      await client.query(sql003);
      console.log('✅ Migration 003 appliquée avec succès !');
    }

    const migration004Path = path.join(__dirname, '../migrations/004_add_payout_destination.sql');
    if (fs.existsSync(migration004Path)) {
      console.log('💸 Application de la migration de destination de paiement (004_add_payout_destination.sql)...');
      const sql004 = fs.readFileSync(migration004Path, 'utf8');
      await client.query(sql004);
      console.log('✅ Migration 004 appliquée avec succès !');
    }

    const migration005Path = path.join(__dirname, '../migrations/005_add_account_and_dispute_fields.sql');
    if (fs.existsSync(migration005Path)) {
      console.log('🧩 Application des champs complémentaires (005_add_account_and_dispute_fields.sql)...');
      const sql005 = fs.readFileSync(migration005Path, 'utf8');
      await client.query(sql005);
      console.log('✅ Migration 005 appliquée avec succès !');
    }

    const migration006Path = path.join(__dirname, '../migrations/006_add_flash_sale_inventory.sql');
    if (fs.existsSync(migration006Path)) {
      console.log('📦 Application du stock et de l’image des ventes flash (006_add_flash_sale_inventory.sql)...');
      const sql006 = fs.readFileSync(migration006Path, 'utf8');
      await client.query(sql006);
      console.log('✅ Migration 006 appliquée avec succès !');
    }

    const migration007Path = path.join(__dirname, '../migrations/007_add_banner_updated_at.sql');
    if (fs.existsSync(migration007Path)) {
      console.log('🕒 Application du timestamp des bannières (007_add_banner_updated_at.sql)...');
      const sql007 = fs.readFileSync(migration007Path, 'utf8');
      await client.query(sql007);
      console.log('✅ Migration 007 appliquée avec succès !');
    }

    const migration008Path = path.join(__dirname, '../migrations/008_add_banner_display_fields.sql');
    if (fs.existsSync(migration008Path)) {
      console.log('🎨 Application des champs d’affichage des bannières (008_add_banner_display_fields.sql)...');
      const sql008 = fs.readFileSync(migration008Path, 'utf8');
      await client.query(sql008);
      console.log('✅ Migration 008 appliquée avec succès !');
    }

    const migration009Path = path.join(__dirname, '../migrations/009_add_agent_store_assignment.sql');
    if (fs.existsSync(migration009Path)) {
      console.log('📍 Application de l’affectation des Agents aux points relais (009_add_agent_store_assignment.sql)...');
      const sql009 = fs.readFileSync(migration009Path, 'utf8');
      await client.query(sql009);
      console.log('✅ Migration 009 appliquée avec succès !');
    }

    const migration010Path = path.join(__dirname, '../migrations/010_add_message_attachments.sql');
    if (fs.existsSync(migration010Path)) {
      console.log('📎 Application des pièces jointes des messages (010_add_message_attachments.sql)...');
      const sql010 = fs.readFileSync(migration010Path, 'utf8');
      await client.query(sql010);
      console.log('✅ Migration 010 appliquée avec succès !');
    }

    client.release();
    console.log('🎉 Initialisation de la base de données terminée avec succès.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la configuration de la base de données :', err.message);
    process.exit(1);
  } finally {
    await targetPool.end();
  }
}

runSetup().catch((err) => {
  console.error('❌ Configuration interrompue :', err.message);
  process.exit(1);
});
