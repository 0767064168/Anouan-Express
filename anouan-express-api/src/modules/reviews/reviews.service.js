const { query, withTransaction } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class ReviewsService {
  async submitReview(clientId, { productId, orderId, rating, comment, images }) {
    const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (!isUuid(productId)) {
      throw new AppError('Identifiant produit invalide', 400);
    }

    return withTransaction(async (client) => {
      const prodRes = await client.query(
        `SELECT id, vendor_id FROM products WHERE id = $1`,
        [productId]
      );
      if (prodRes.rows.length === 0) {
        throw new AppError('Produit introuvable', 404);
      }
      const vendorId = prodRes.rows[0].vendor_id;

      let finalOrderId = isUuid(orderId) ? orderId : null;

      if (finalOrderId) {
        const orderRes = await client.query(
          `SELECT o.id, o.status FROM orders o
           JOIN order_items oi ON o.id = oi.order_id
           WHERE o.id = $1 AND o.client_id = $2 AND oi.product_id = $3`,
          [finalOrderId, clientId, productId]
        );

        if (orderRes.rows.length === 0) {
          throw new AppError('Commande introuvable ou ne contenant pas ce produit', 404);
        }

        const order = orderRes.rows[0];
        if (order.status !== 'picked_up') {
          throw new AppError('Seuls les produits des commandes retirées peuvent être évalués', 400);
        }
      } else {
        // Recherche automatique d'une commande retirée pour ce client et ce produit
        const orderRes = await client.query(
          `SELECT o.id, o.status FROM orders o
           JOIN order_items oi ON o.id = oi.order_id
           WHERE o.client_id = $1 AND oi.product_id = $2 AND o.status = 'picked_up'
           ORDER BY o.created_at DESC LIMIT 1`,
          [clientId, productId]
        );
        if (orderRes.rows.length > 0) {
          finalOrderId = orderRes.rows[0].id;
        }
      }

      if (finalOrderId) {
        const existingRes = await client.query(
          `SELECT id FROM reviews WHERE product_id = $1 AND client_id = $2 AND order_id = $3`,
          [productId, clientId, finalOrderId]
        );
        if (existingRes.rows.length > 0) {
          throw new AppError('Vous avez déjà laissé un avis pour ce produit sur cette commande', 400);
        }
      }

      const insertRes = await client.query(
        `INSERT INTO reviews (client_id, product_id, vendor_id, order_id, rating, comment, images, is_visible)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING *`,
        [clientId, productId, vendorId, finalOrderId, rating, comment, images || []]
      );
      
      const newReview = insertRes.rows[0];

      await client.query(
        `UPDATE products 
         SET avg_rating = (SELECT COALESCE(AVG(rating), 0)::numeric(2,1) FROM reviews WHERE product_id = $1 AND is_visible = true),
             review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND is_visible = true)
         WHERE id = $1`,
        [productId]
      );

      if (vendorId) {
        await client.query(
          `UPDATE vendors v
           SET avg_rating = (
             SELECT COALESCE(AVG(r.rating), 0)::numeric(2,1) 
             FROM reviews r 
             JOIN products p ON r.product_id = p.id 
             WHERE p.vendor_id = v.id AND r.is_visible = true
           )
           WHERE v.id = $1`,
          [vendorId]
        );
      }

      return newReview;
    });
  }

  async getProductReviews(productId, page = 1, limit = 20) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    if (!isUuid) {
      return {
        data: [],
        pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, totalPages: 0 }
      };
    }

    const offset = (page - 1) * limit;
    
    const countRes = await query(
      `SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND is_visible = true`,
      [productId]
    );
    const total = parseInt(countRes.rows[0]?.count || 0);

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
