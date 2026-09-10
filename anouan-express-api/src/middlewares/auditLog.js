// src/middlewares/auditLog.js
// Journalisation horodatée des actions sensibles dans la table audit_logs

const { query } = require('../config/database');

/**
 * Enregistre une action sensible dans la table audit_logs.
 * @param {object} params
 * @param {string} params.action      - Identifiant de l'action (ex: 'vendor.validate')
 * @param {string} [params.entityType] - Type d'entité concernée (ex: 'vendor')
 * @param {string} [params.entityId]   - UUID de l'entité concernée
 * @param {object} [params.metadata]   - Données supplémentaires (JSON)
 * @param {string} [params.userId]     - UUID de l'utilisateur ayant effectué l'action
 * @param {string} [params.ipAddress]  - Adresse IP
 */
const logAudit = async ({
  action,
  entityType = null,
  entityId = null,
  metadata = {},
  userId = null,
  ipAddress = null,
}) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId, JSON.stringify(metadata), ipAddress]
    );
  } catch (err) {
    // On ne bloque jamais une requête à cause d'un échec d'audit
    console.error('[AUDIT] Erreur lors de l\'enregistrement :', err.message);
  }
};

/**
 * Factory de middleware Express qui enregistre l'action APRÈS la réponse.
 * @param {string} action - Identifiant de l'action
 * @param {Function} [getEntityInfo] - Optionnel : async (req, res) => { entityType, entityId, metadata }
 */
const auditMiddleware = (action, getEntityInfo = null) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode < 400) {
        // Log asynchrone — ne bloque pas la réponse
        Promise.resolve(getEntityInfo ? getEntityInfo(req, body) : {}).then((info = {}) => {
          logAudit({
            action,
            entityType: info.entityType || null,
            entityId: info.entityId || null,
            metadata: { ...info.metadata, reqBody: req.body },
            userId: req.user?.id || null,
            ipAddress: req.ip,
          });
        });
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = { logAudit, auditMiddleware };
