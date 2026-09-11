const express = require('express');
const router = express.Router();
const vendorController = require('./vendors.controller');
const { applySchema, updateProfileSchema, validateVendorSchema, setCommissionSchema } = require('./vendors.validation');
const { authenticate, authenticateOptional } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { auditMiddleware } = require('../../middlewares/auditLog');

router.post('/apply', authenticate, authorize('client'), validate({ body: applySchema }), vendorController.apply);
router.get('/me', authenticate, authorize('vendor'), vendorController.getMyProfile);
router.put('/me', authenticate, authorize('vendor'), validate({ body: updateProfileSchema }), vendorController.updateMyProfile);
router.get('/me/stats', authenticate, authorize('vendor'), vendorController.getStats);

router.get('/', authenticate, authorize('admin'), vendorController.getAllVendors);
router.get('/:id/public', authenticateOptional, vendorController.getPublicProfile);
router.get('/:id', authenticate, authorize('admin'), vendorController.getVendor);
router.put('/:id/validate', authenticate, authorize('admin'), validate({ body: validateVendorSchema }), auditMiddleware('vendor.validate'), vendorController.validateVendor);
router.put('/:id/commission', authenticate, authorize('admin'), validate({ body: setCommissionSchema }), vendorController.setCommission);

module.exports = router;
