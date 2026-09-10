// src/middlewares/authorize.js
// Contrôle d'accès basé sur les rôles

const { AppError } = require('./errorHandler');

/**
 * Autorise uniquement les rôles spécifiés.
 * Doit être utilisé après `authenticate`.
 *
 * @param {...string} roles - Rôles autorisés ('admin', 'vendor', 'client', 'agent')
 * @example
 *   router.get('/admin-only', authenticate, authorize('admin'), handler)
 *   router.get('/vendor-or-admin', authenticate, authorize('vendor', 'admin'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentification requise.', 401, 'MISSING_TOKEN'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Accès refusé. Rôle requis : ${roles.join(' ou ')}.`,
          403,
          'FORBIDDEN'
        )
      );
    }
    return next();
  };
};

/**
 * Vérifie que l'utilisateur courant est le propriétaire de la ressource
 * OU possède un rôle admin
 * @param {Function} getOwnerId - Async function(req) → UUID du propriétaire
 */
const authorizeOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentification requise.', 401, 'MISSING_TOKEN'));
      }
      if (req.user.role === 'admin') return next();

      const ownerId = await getOwnerId(req);
      if (ownerId !== req.user.id) {
        return next(new AppError('Accès refusé.', 403, 'FORBIDDEN'));
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = { authorize, authorizeOwnerOrAdmin };
