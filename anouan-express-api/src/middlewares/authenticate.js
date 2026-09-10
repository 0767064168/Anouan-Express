// src/middlewares/authenticate.js
// Vérification du JWT et chargement de l'utilisateur courant

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const env = require('../config/env');
const { AppError } = require('./errorHandler');

/**
 * Vérifie le Bearer Token et attache req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;

    if (!authHeader && !cookieToken) {
      throw new AppError('Authentification requise.', 401, 'MISSING_TOKEN');
    }
    if (authHeader && !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentification requise.', 401, 'MISSING_TOKEN');
    }

    const token = authHeader ? authHeader.split(' ')[1] : cookieToken;
    const decoded = jwt.verify(token, env.jwt.secret);

    // Vérification que l'utilisateur existe encore et est actif
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.avatar_url, v.id as vendor_id
       FROM users u
       LEFT JOIN vendors v ON v.user_id = u.id
       WHERE u.id = $1`,
      [decoded.sub]
    );

    if (!result.rows.length) {
      throw new AppError('Utilisateur introuvable.', 401, 'USER_NOT_FOUND');
    }

    const user = result.rows[0];
    if (user.status === 'banned') {
      throw new AppError('Compte suspendu. Contactez le support.', 403, 'ACCOUNT_BANNED');
    }
    if (user.status === 'inactive') {
      throw new AppError('Compte inactif.', 403, 'ACCOUNT_INACTIVE');
    }

    user.vendorId = user.vendor_id || user.id;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Authentification optionnelle — attache req.user si token présent, continue sinon
 */
const authenticateOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
};

module.exports = { authenticate, authenticateOptional };
