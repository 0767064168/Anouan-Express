const Joi = require('joi');
const { validate } = require('../../middlewares/validate');

const sendMessageSchema = Joi.object({
  recipientId: Joi.string().uuid().required(),
  content: Joi.string().max(2000).allow('').optional(),
  attachmentUrl: Joi.string().max(500).allow('').optional(),
  attachmentType: Joi.string().max(100).allow('').optional(),
  attachmentName: Joi.string().max(255).allow('').optional(),
  productId: Joi.string().uuid().optional(),
  orderId: Joi.string().uuid().optional()
}).or('content', 'attachmentUrl');

module.exports = {
  validateSendMessage: validate(sendMessageSchema)
};
