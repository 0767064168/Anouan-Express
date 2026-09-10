const Joi = require('joi');
const { validate } = require('../../middlewares/validate');

const submitReviewSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  orderId: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).allow('', null).optional(),
  images: Joi.array().items(Joi.string().uri()).optional()
});

module.exports = {
  validateSubmitReview: validate(submitReviewSchema)
};
