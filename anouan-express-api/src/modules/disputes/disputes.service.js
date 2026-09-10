const { query, withTransaction } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const notificationsService = require('../notifications/notifications.service'); // Assuming structure

class DisputesService {
  async openDispute(clientId, { orderId, reason }) {
    return withTransaction(async (client) => {
      const orderRes = await client.query(
        `SELECT id, status FROM orders WHERE id = $1 AND client_id = $2`,
        [orderId, clientId]
      );
      
      if (orderRes.rows.length === 0) {
        throw new AppError('Order not found or unauthorized', 404);
      }
      
      const order = orderRes.rows[0];
      if (order.status === 'cancelled') {
        throw new AppError('Cannot open dispute on cancelled order', 400);
      }

      const existRes = await client.query(
        `SELECT id FROM disputes WHERE order_id = $1 AND status != 'closed'`,
        [orderId]
      );
      
      if (existRes.rows.length > 0) {
        throw new AppError('An open dispute already exists for this order', 400);
      }

      const disputeRes = await client.query(
        `INSERT INTO disputes (client_id, order_id, reason, status)
         VALUES ($1, $2, $3, 'open')
         RETURNING *`,
        [clientId, orderId, reason]
      );

      await client.query(
        `UPDATE orders SET status = 'disputed' WHERE id = $1`,
        [orderId]
      );

      // In a real app we'd get admin IDs to notify
      // notificationsService.createNotification(...)
      
      return disputeRes.rows[0];
    });
  }

  async getMyDisputes(clientId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const countRes = await query(
      `SELECT COUNT(*) FROM disputes WHERE client_id = $1`,
      [clientId]
    );
    const total = parseInt(countRes.rows[0].count);

    const res = await query(
      `SELECT * FROM disputes WHERE client_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [clientId, limit, offset]
    );

    return {
      data: res.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getAllDisputes(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let filterQuery = '';
    const params = [];
    
    if (filters.status) {
      params.push(filters.status);
      filterQuery = `WHERE d.status = $1`;
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM disputes d ${filterQuery}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    const queryParams = [...params, limit, offset];
    
    const res = await query(
      `SELECT d.*, u.full_name as client_name, o.total_amount 
       FROM disputes d
       JOIN users u ON d.client_id = u.id
       JOIN orders o ON d.order_id = o.id
       ${filterQuery}
       ORDER BY d.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      queryParams
    );

    return {
      data: res.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getDisputeById(disputeId, requestingUser) {
    const res = await query(
      `SELECT d.*, u.full_name as client_name 
       FROM disputes d
       JOIN users u ON d.client_id = u.id
       WHERE d.id = $1`,
      [disputeId]
    );

    if (res.rows.length === 0) {
      throw new AppError('Dispute not found', 404);
    }

    const dispute = res.rows[0];
    if (requestingUser.role === 'client' && dispute.client_id !== requestingUser.id) {
      throw new AppError('Unauthorized access to dispute', 403);
    }

    return { data: dispute };
  }

  async resolveDispute(disputeId, adminId, { resolution, refundAmount = 0 }) {
    return withTransaction(async (client) => {
      const res = await client.query(
        `UPDATE disputes 
         SET status = 'resolved', resolution = $1, refund_amount = $2, resolved_by = $3, resolved_at = NOW()
         WHERE id = $4 RETURNING *`,
        [resolution, refundAmount, adminId, disputeId]
      );
      
      if (res.rows.length === 0) {
        throw new AppError('Dispute not found', 404);
      }
      const dispute = res.rows[0];

      if (refundAmount > 0) {
        await client.query(
          `UPDATE payments SET status = 'refunded' WHERE order_id = $1`,
          [dispute.order_id]
        );
      }

      await client.query(
        `UPDATE orders SET status = $1 WHERE id = $2`,
        [refundAmount > 0 ? 'cancelled' : 'completed', dispute.order_id]
      );

      // In real scenario, log audit and send notification
      
      return dispute;
    });
  }
}

module.exports = new DisputesService();
