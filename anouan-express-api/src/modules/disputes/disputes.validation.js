const Joi = require('joi');
const { validate } = require('../../middlewares/validate');

const openDisputeSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  reason: Joi.string().min(20).required()
});

const resolveDisputeSchema = Joi.object({
  resolution: Joi.string().required(),
  refundAmount: Joi.number().min(0).optional()
});

module.exports = {
  validateOpenDispute: validate(openDisputeSchema),
  validateResolveDispute: validate(resolveDisputeSchema)
};
