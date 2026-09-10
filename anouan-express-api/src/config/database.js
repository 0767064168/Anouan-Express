// src/config/database.js
// Pool de connexions PostgreSQL avec gestion des erreurs
const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Erreur inattendue sur le pool :', err.message);
});

/**
 * Exécute une requête SQL paramétrée
 * @param {string} text - Requête SQL avec placeholders ($1, $2, ...)
 * @param {Array} params - Paramètres
 * @returns {Promise<QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Obtient un client du pool (pour les transactions)
 */
const getClient = () => pool.connect();

/**
 * Exécute plusieurs requêtes dans une transaction
 * @param {Function} callback - Async function recevant le client
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Vérifie la connexion à la base de données
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log(`[DB] Connexion PostgreSQL établie — ${env.db.host}:${env.db.port}/${env.db.name}`);
    client.release();
  } catch (err) {
    console.warn(`⚠️ [DB] PostgreSQL non joignable (${err.message}). L'API tourne en mode Mock / Standalone.`);
  }
};

module.exports = { query, getClient, withTransaction, testConnection, pool };
