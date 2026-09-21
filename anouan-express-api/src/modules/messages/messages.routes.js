const express = require('express');
const router = express.Router();
const messagesController = require('./messages.controller');
const { validateSendMessage } = require('./messages.validation');
const { authenticate } = require('../../middlewares/authenticate');
const { uploadMessageAttachment } = require('../../middlewares/upload');

router.get('/', authenticate, messagesController.getConversations);
router.get('/:partnerId', authenticate, messagesController.getConversation);
router.post('/', authenticate, uploadMessageAttachment, validateSendMessage, messagesController.sendMessage);
router.put('/:partnerId/read', authenticate, messagesController.markAllRead);

module.exports = router;
