const express = require('express');
const router = express.Router();
const financeController = require('./finance.controller');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { logAudit } = require('../../middlewares/auditLog');
const { createPayoutSchema, requestVendorPayoutSchema, dateRangeSchema, payoutIdParamSchema, paymentRefSchema, rejectPayoutSchema } = require('./finance.validation');

// Vendor routes
router.get('/vendor/stats', authenticate, authorize('vendor'), validate({ query: dateRangeSchema }), financeController.getVendorStats);
router.get('/vendor/payouts', authenticate, authorize('vendor'), financeController.getVendorPayouts);
router.get('/vendor/history', authenticate, authorize('vendor'), financeController.getVendorPayouts);
router.post('/vendor/payout', authenticate, authorize('vendor'), validate({ body: requestVendorPayoutSchema }), financeController.requestVendorPayout);
router.get('/vendor/export/orders', authenticate, authorize('vendor'), validate({ query: dateRangeSchema }), financeController.exportVendorOrdersCSV);
router.get('/vendor/export/inventory', authenticate, authorize('vendor'), financeController.exportVendorInventoryCSV);

// Admin routes
router.get('/admin/stats', authenticate, authorize('admin'), validate({ query: dateRangeSchema }), financeController.getAdminStats);
router.get('/admin/payouts', authenticate, authorize('admin'), financeController.getAllPayouts);
router.post('/admin/payouts', authenticate, authorize('admin'), validate({ body: createPayoutSchema }), financeController.createPayout);
router.put('/admin/payouts/:id/paid', authenticate, authorize('admin'), validate({ params: payoutIdParamSchema }), validate({ body: paymentRefSchema }), financeController.markPayoutPaid);
router.put('/admin/payouts/:id/rejected', authenticate, authorize('admin'), validate({ params: payoutIdParamSchema }), validate({ body: rejectPayoutSchema }), financeController.rejectPayout);
router.get('/admin/export', authenticate, authorize('admin'), validate({ query: dateRangeSchema }), financeController.exportOrdersCSV);
router.get('/admin/export/orders', authenticate, authorize('admin'), validate({ query: dateRangeSchema }), financeController.exportOrdersCSV);
router.get('/admin/export/inventory', authenticate, authorize('admin'), financeController.exportInventoryCSV);
router.get('/admin/export/payouts', authenticate, authorize('admin'), validate({ query: dateRangeSchema }), financeController.exportPayoutsCSV);

module.exports = router;
