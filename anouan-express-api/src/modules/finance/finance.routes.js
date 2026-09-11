const express = require('express');
const router = express.Router();
const financeController = require('./finance.controller');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { logAudit } = require('../../middlewares/auditLog');
const { createPayoutSchema, requestVendorPayoutSchema, dateRangeSchema, payoutIdParamSchema, paymentRefSchema } = require('./finance.validation');

// Vendor routes
router.get('/vendor/stats', authenticate, authorize('vendor'), validate({ query: dateRangeSchema }), financeController.getVendorStats);
router.get('/vendor/payouts', authenticate, authorize('vendor'), financeController.getVendorPayouts);
router.post('/vendor/payout', authenticate, authorize('vendor'), validate({ body: requestVendorPayoutSchema }), financeController.requestVendorPayout);

// Admin routes
router.get('/admin/stats', authenticate, authorize('admin'), validate({ query: dateRangeSchema }), financeController.getAdminStats);
router.get('/admin/payouts', authenticate, authorize('admin'), financeController.getAllPayouts);
router.post('/admin/payouts', authenticate, authorize('admin'), validate({ body: createPayoutSchema }), financeController.createPayout);
router.put('/admin/payouts/:id/paid', authenticate, authorize('admin'), validate({ params: payoutIdParamSchema }), validate({ body: paymentRefSchema }), financeController.markPayoutPaid);
router.get('/admin/export', authenticate, authorize('admin'), validate({ query: dateRangeSchema }), financeController.exportOrdersCSV);

module.exports = router;
