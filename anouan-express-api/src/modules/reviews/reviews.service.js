const { query, withTransaction } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class ReviewsService {
  async submitReview(clientId, { productId, orderId, rating, comment, images }) {
    return withTransaction(async (client) => {
      const orderRes = await client.query(
        `SELECT o.id, o.status FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.id = $1 AND o.client_id = $2 AND oi.product_id = $3`,
        [orderId, clientId, productId]
      );

      if (orderRes.rows.length === 0) {
        throw new AppError('Order not found or does not contain this product', 404);
      }

      const order = orderRes.rows[0];
      if (order.status !== 'picked_up') {
        throw new AppError('Can only review products from completed (picked_up) orders', 400);
      }

      const existingRes = await client.query(
        `SELECT id FROM reviews WHERE product_id = $1 AND client_id = $2 AND order_id = $3`,
        [productId, clientId, orderId]
      );

      if (existingRes.rows.length > 0) {
        throw new AppError('You have already reviewed this product for this order', 400);
      }

      const insertRes = await client.query(
        `INSERT INTO reviews (client_id, product_id, order_id, rating, comment, images, is_visible)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING *`,
        [clientId, productId, orderId, rating, comment, images || []]
      );
      
      const newReview = insertRes.rows[0];

      await client.query(
        `UPDATE products 
         SET avg_rating = (SELECT COALESCE(AVG(rating), 0)::numeric(2,1) FROM reviews WHERE product_id = $1 AND is_visible = true),
             review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND is_visible = true)
         WHERE id = $1`,
        [productId]
      );

      await client.query(
        `UPDATE vendors v
         SET avg_rating = (
           SELECT COALESCE(AVG(r.rating), 0)::numeric(2,1) 
           FROM reviews r 
           JOIN products p ON r.product_id = p.id 
           WHERE p.vendor_id = v.id AND r.is_visible = true
         )
         FROM products p
         WHERE p.vendor_id = v.id AND p.id = $1`,
        [productId]
      );

      return newReview;
    });
  }

  async getProductReviews(productId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const countRes = await query(
      `SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND is_visible = true`,
      [productId]
    );
    const total = parseInt(countRes.rows[0].count);

    const res = await query(
      `SELECT r.*, u.full_name as client_name 
       FROM reviews r
       JOIN users u ON r.client_id = u.id
       WHERE r.product_id = $1 AND r.is_visible = true
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );

    return {
      data: res.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getVendorReviews(vendorId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const countRes = await query(
      `SELECT COUNT(r.*) 
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       WHERE p.vendor_id = $1 AND r.is_visible = true`,
      [vendorId]
    );
    const total = parseInt(countRes.rows[0].count);

    const res = await query(
      `SELECT r.*, u.full_name as client_name, p.title as product_title
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       JOIN users u ON r.client_id = u.id
       WHERE p.vendor_id = $1 AND r.is_visible = true
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [vendorId, limit, offset]
    );

    return {
      data: res.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async deleteReview(reviewId, adminId) {
    const res = await query(
      `UPDATE reviews SET is_visible = false WHERE id = $1 RETURNING *`,
      [reviewId]
    );
    
    if (res.rows.length === 0) {
      throw new AppError('Review not found', 404);
    }
    
    return res.rows[0];
  }
}

module.exports = new ReviewsService();
