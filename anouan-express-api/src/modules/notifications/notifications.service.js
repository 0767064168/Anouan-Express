const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class NotificationsService {
  async getMyNotifications(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const countRes = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countRes.rows[0].count);

    const res = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
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

  async getUnreadCount(userId) {
    const res = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return { count: parseInt(res.rows[0].count) };
  }

  async markAsRead(notificationId, userId) {
    const res = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW() 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );
    
    if (res.rows.length === 0) {
      throw new AppError('Notification not found or unauthorized', 404);
    }
    return res.rows[0];
  }

  async markAllAsRead(userId) {
    await query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW() 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return { success: true };
  }

  async createNotification(userId, type, title, body, metadata = {}) {
    const res = await query(
      `INSERT INTO notifications (user_id, type, title, body, metadata, is_read)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [userId, type, title, body, metadata]
    );
    return res.rows[0];
  }

  async subscribeFcmToken(userId, fcmToken) {
    await query(
      `UPDATE users SET fcm_token = $1 WHERE id = $2`,
      [fcmToken, userId]
    );
    return { success: true };
  }

  async unsubscribeFcmToken(userId) {
    await query(
      `UPDATE users SET fcm_token = NULL WHERE id = $1`,
      [userId]
    );
    return { success: true };
  }
}

module.exports = new NotificationsService();
