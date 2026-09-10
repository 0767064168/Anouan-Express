const reviewsService = require('./reviews.service');

class ReviewsController {
  async submitReview(req, res, next) {
    try {
      const clientId = req.user.id;
      const reviewData = req.body;
      const review = await reviewsService.submitReview(clientId, reviewData);
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  }

  async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await reviewsService.getProductReviews(productId, page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getVendorReviews(req, res, next) {
    try {
      const { vendorId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await reviewsService.getVendorReviews(vendorId, page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const review = await reviewsService.deleteReview(id, adminId);
      res.status(200).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReviewsController();
