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
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

async function ensureDatabaseExists() {
  const rootPool = new Pool({
    host: dbHost,
    port: dbPort,
    database: 'postgres',
    user: dbUser,
    password: dbPassword,
  });

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
  await ensureDatabaseExists();

  const targetPool = new Pool({
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPassword,
  });

  try {
    const client = await targetPool.connect();
    console.log('✅ Connecté avec succès à la base :', dbName);

    const schemaPath = path.join(__dirname, '../migrations/001_schema.sql');
    const seedsPath = path.join(__dirname, '../migrations/002_seeds.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('📜 Exécution du schéma (001_schema.sql)...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('✅ Schéma appliqué avec succès !');
    }

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
