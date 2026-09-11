// src/middlewares/rateLimiter.js
// Rate limiting pour protéger les endpoints sensibles

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * Limiteur général — appliqué à toutes les routes
 */
const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,    // 15 minutes par défaut
  max: env.rateLimit.max,             // 100 requêtes max
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.',
    },
  },
});

/**
 * Limiteur strict pour les endpoints d'authentification
 * (login, register, OTP) — prévient le brute force
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,           // 15 minutes
  max: env.rateLimit.authMax,         // 10 tentatives max
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    },
  },
});

/**
 * Limiteur dédié au flux de mot de passe oublié / réinitialisation
 * protège les demandes répétées d’envoi de lien et les tentatives de reset
 */
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'PASSWORD_RESET_RATE_LIMIT',
      message: 'Trop de demandes de réinitialisation. Réessayez dans 15 minutes.',
    },
  },
});

/**
 * Limiteur pour la validation du code de retrait
 */
const pickupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,          // 10 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'PICKUP_RATE_LIMIT',
      message: 'Trop de tentatives de validation de code.',
    },
  },
});

/**
 * Limiteur pour le paiement
 */
const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,           // 5 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'PAYMENT_RATE_LIMIT',
      message: 'Trop de tentatives de paiement.',
    },
  },
});

module.exports = { globalLimiter, authLimiter, passwordResetLimiter, pickupLimiter, paymentLimiter };
