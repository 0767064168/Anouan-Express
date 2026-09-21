const messagesService = require('./messages.service');

class MessagesController {
  async getConversations(req, res, next) {
    try {
      const result = await messagesService.getConversations(req.user.id);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getConversation(req, res, next) {
    try {
      const { partnerId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await messagesService.getConversation(req.user.id, partnerId, page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const messageData = {
        ...req.body,
        ...(req.file && {
          attachmentUrl: `/uploads/messages/${req.file.filename}`,
          attachmentType: req.file.mimetype,
          attachmentName: req.file.originalname,
        }),
      };
      const message = await messagesService.sendMessage(req.user.id, messageData);
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req, res, next) {
    try {
      const { partnerId } = req.params;
      const result = await messagesService.markAllRead(req.user.id, partnerId);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MessagesController();
