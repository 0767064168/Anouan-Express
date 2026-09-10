const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class MessagesService {
  async getConversations(userId) {
    const res = await query(
      `SELECT DISTINCT ON (partner_id) 
         partner_id,
         u.name as name, 
         u.avatar_url as avatar,
         m.content as last_message,
         m.created_at,
         (SELECT COUNT(*) FROM messages 
          WHERE sender_id = partner_id AND recipient_id = $1 AND is_read = false) as unread_count
       FROM (
         SELECT 
           CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END AS partner_id,
           id, content, created_at
         FROM messages
         WHERE sender_id = $1 OR recipient_id = $1
       ) m
       JOIN users u ON m.partner_id = u.id
       ORDER BY partner_id, m.created_at DESC`,
      [userId]
    );

    return { data: res.rows };
  }

  async getConversation(userId, partnerId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const countRes = await query(
      `SELECT COUNT(*) FROM messages 
       WHERE (sender_id = $1 AND recipient_id = $2) 
          OR (sender_id = $2 AND recipient_id = $1)`,
      [userId, partnerId]
    );
    const total = parseInt(countRes.rows[0].count);

    const res = await query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND recipient_id = $2) 
          OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, partnerId, limit, offset]
    );

    // Mark received messages as read
    await query(
      `UPDATE messages SET is_read = true 
       WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false`,
      [userId, partnerId]
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

  async sendMessage(senderId, { recipientId, content, productId, orderId }) {
    const res = await query(
      `INSERT INTO messages (sender_id, recipient_id, content, product_id, order_id, is_read)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [senderId, recipientId, content, productId || null, orderId || null]
    );
    return res.rows[0];
  }

  async markAllRead(userId, partnerId) {
    await query(
      `UPDATE messages SET is_read = true 
       WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false`,
      [userId, partnerId]
    );
    return { success: true };
  }
}

module.exports = new MessagesService();
