// src/middlewares/errorHandler.js
// Gestionnaire d'erreurs centralisé — dernière middleware de la chaîne Express

const env = require('../config/env');

/**
 * Classe d'erreur applicative avec code HTTP
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware Express de gestion des erreurs
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, code } = err;

  // Erreurs de validation Joi
  if (err.isJoi) {
    statusCode = 422;
    message = err.details.map((d) => d.message).join('; ');
    code = 'VALIDATION_ERROR';
  }

  // Erreurs PostgreSQL
  if (err.code === '23505') {
    // Violation unique
    statusCode = 409;
    message = 'Cette ressource existe déjà.';
    code = 'DUPLICATE_ENTRY';
  } else if (err.code === '23503') {
    // Violation de clé étrangère
    statusCode = 400;
    message = 'Référence invalide.';
    code = 'FOREIGN_KEY_VIOLATION';
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide.';
    code = 'INVALID_TOKEN';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré.';
    code = 'TOKEN_EXPIRED';
  }

  // Log en développement
  if (env.app.env === 'development') {
    console.error(`[ERROR ${statusCode}] ${message}`, err.stack);
  } else if (statusCode >= 500) {
    console.error(`[ERROR ${statusCode}] ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: code || 'INTERNAL_ERROR',
      message: statusCode >= 500 && env.app.env === 'production'
        ? 'Une erreur interne est survenue.'
        : message,
    },
    ...(env.app.env === 'development' && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  });
};

/**
 * Middleware pour les routes non trouvées (404)
 */
const notFound = (req, res, next) => {
  next(new AppError(`Route introuvable : ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
};

module.exports = { errorHandler, notFound, AppError };
