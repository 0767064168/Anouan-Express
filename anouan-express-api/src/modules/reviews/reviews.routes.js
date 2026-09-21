const express = require('express');
const router = express.Router();
const reviewsController = require('./reviews.controller');
const { validateSubmitReview } = require('./reviews.validation');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { uploadReviewImages } = require('../../middlewares/upload');
const { optimizeUploadedImage } = require('../../middlewares/imageOptimizer');

router.post(
  '/',
  authenticate,
  authorize('client'),
  uploadReviewImages,
  optimizeUploadedImage,
  validateSubmitReview,
  reviewsController.submitReview
);
router.get('/product/:productId', reviewsController.getProductReviews);
router.get('/vendor/:vendorId', reviewsController.getVendorReviews);
router.delete('/:id', authenticate, authorize('admin'), reviewsController.deleteReview);

module.exports = router;
