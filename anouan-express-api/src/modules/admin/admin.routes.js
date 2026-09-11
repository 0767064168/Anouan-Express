const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { uploadBanner } = require('../../middlewares/upload');
const { 
  createBannerSchema, updateBannerSchema, 
  createFlashSaleSchema, updateSettingSchema, assignRoleSchema 
} = require('./admin.validation');

// Public endpoints for home page and mobile app
router.get('/public/banners', adminController.getBanners);
router.get('/public/flash-sales', adminController.getFlashSales);

router.use(authenticate, authorize('admin'));

// Banners
router.get('/banners', adminController.getBanners);
router.post('/banners', uploadBanner, validate({ body: createBannerSchema }), adminController.createBanner);
router.put('/banners/:id', validate({ body: updateBannerSchema }), adminController.updateBanner);
router.delete('/banners/:id', adminController.deleteBanner);
router.patch('/banners/:id/toggle', adminController.toggleBannerActive);

// Stats
router.get('/stats', adminController.getStats);

// Flash Sales
router.get('/flash-sales', adminController.getFlashSales);
router.post('/flash-sales', validate({ body: createFlashSaleSchema }), adminController.createFlashSale);
router.delete('/flash-sales/:id', adminController.deleteFlashSale);

// Settings
router.get('/settings', adminController.getPlatformSettings);
router.put('/settings/:key', validate({ body: updateSettingSchema }), adminController.updateSetting);

// Roles
router.get('/roles', adminController.getUserRoles);
router.put('/roles/:userId', validate({ body: assignRoleSchema }), adminController.assignRole);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
