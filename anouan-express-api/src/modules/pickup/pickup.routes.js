// src/modules/pickup/pickup.routes.js

const router = require('express').Router();
const ctrl = require('./pickup.controller');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { pickupLimiter } = require('../../middlewares/rateLimiter');
const { auditMiddleware } = require('../../middlewares/auditLog');

// Agent : réception des articles vendeurs
router.post(
  '/receive',
  authenticate,
  authorize('agent', 'admin'),
  ctrl.receiveItem
);

// Agent : liste des articles en attente de réception
router.get(
  '/pending',
  authenticate,
  authorize('agent', 'admin'),
  ctrl.getPendingReceptions
);

// Agent / Admin : stock temporaire du magasin
router.get(
  '/stock',
  authenticate,
  authorize('agent', 'admin'),
  ctrl.getStoreStock
);

// Agent : validation du code de retrait client (rate-limited)
router.post(
  '/validate',
  authenticate,
  authorize('agent', 'admin'),
  pickupLimiter,
  auditMiddleware('pickup.validate_attempt'),
  ctrl.validateCode
);

// Client : consulter son code de retrait + QR code
router.get(
  '/code/:orderId',
  authenticate,
  authorize('client'),
  ctrl.getMyPickupCode
);

// Client : désigner un tiers pour le retrait
router.post(
  '/code/:orderId/delegate',
  authenticate,
  authorize('client'),
  ctrl.setDelegate
);

// Admin : regénérer un code de retrait
router.put(
  '/code/:orderId/regenerate',
  authenticate,
  authorize('admin'),
  auditMiddleware('pickup.code_regenerated'),
  ctrl.regenerateCode
);

module.exports = router;
