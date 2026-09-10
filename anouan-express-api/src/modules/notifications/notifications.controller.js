const notificationsService = require('./notifications.service');

class NotificationsController {
  async getMyNotifications(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await notificationsService.getMyNotifications(req.user.id, page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const result = await notificationsService.getUnreadCount(req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationsService.markAsRead(id, req.user.id);
      res.status(200).json({ success: true, data: notification });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationsService.markAllAsRead(req.user.id);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async subscribeFcmToken(req, res, next) {
    try {
      const { fcmToken } = req.body;
      const result = await notificationsService.subscribeFcmToken(req.user.id, fcmToken);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async unsubscribeFcmToken(req, res, next) {
    try {
      const result = await notificationsService.unsubscribeFcmToken(req.user.id);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationsController();
