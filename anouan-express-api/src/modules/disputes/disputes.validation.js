const Joi = require('joi');
const { validate } = require('../../middlewares/validate');

const openDisputeSchema = Joi.object({
  orderId: Joi.string().required(),
  reason: Joi.string().min(5).required(),
  type: Joi.string().allow('', null).optional(),
  images: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
});

const resolveDisputeSchema = Joi.object({
  resolution: Joi.string().required(),
  refundAmount: Joi.number().min(0).optional()
});

module.exports = {
  validateOpenDispute: validate({ body: openDisputeSchema }),
  validateResolveDispute: validate({ body: resolveDisputeSchema })
};
