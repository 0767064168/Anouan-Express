const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const { createSchema, updateSchema, catalogQuerySchema, adjustStockSchema } = require('./products.validation');
const { authenticate, authenticateOptional } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { uploadProductImages } = require('../../middlewares/upload');
const { optimizeUploadedImage } = require('../../middlewares/imageOptimizer');

// Public routes
router.get('/', authenticateOptional, validate({ query: catalogQuerySchema }), productsController.getCatalog);
router.get('/search', productsController.search);
router.get('/featured', productsController.getFeatured);
router.get('/flash-sales', productsController.getFlashSales);

// Vendor & Admin routes
router.get('/vendor/me', authenticate, authorize('vendor', 'admin'), productsController.getVendorProducts);
router.get('/:id', productsController.getById);
router.post('/', authenticate, authorize('vendor', 'admin'), uploadProductImages, optimizeUploadedImage, validate({ body: createSchema }), productsController.create);
router.put('/:id', authenticate, authorize('vendor', 'admin'), uploadProductImages, optimizeUploadedImage, validate({ body: updateSchema }), productsController.update);
router.patch('/:id/stock', authenticate, authorize('vendor', 'admin'), validate({ body: adjustStockSchema }), productsController.adjustStock);
router.delete('/:id', authenticate, authorize('vendor', 'admin'), productsController.softDelete);
router.post('/bulk-import', authenticate, authorize('vendor', 'admin'), productsController.bulkImportCSV);

module.exports = router;
