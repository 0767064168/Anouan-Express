const Joi = require('joi');
const { validate } = require('../../middlewares/validate');

const sendMessageSchema = Joi.object({
  recipientId: Joi.string().uuid().required(),
  content: Joi.string().max(2000).required(),
  productId: Joi.string().uuid().optional(),
  orderId: Joi.string().uuid().optional()
});

module.exports = {
  validateSendMessage: validate(sendMessageSchema)
};
