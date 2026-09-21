const Joi = require('joi');
const { validate } = require('../../middlewares/validate');

const submitReviewSchema = Joi.object({
  productId: Joi.string().required(),
  orderId: Joi.string().allow('', null).optional(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow('', null).optional(),
  images: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
});

module.exports = {
  validateSubmitReview: validate({ body: submitReviewSchema })
};
