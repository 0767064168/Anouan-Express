const Joi = require('joi');

const createBannerSchema = Joi.object({
  title: Joi.string().required(),
  imageUrl: Joi.string().uri().required(),
  linkUrl: Joi.string().uri().optional().allow('', null),
  position: Joi.number().integer().default(0),
  startsAt: Joi.date().iso().optional().allow(null),
  endsAt: Joi.date().iso().optional().allow(null)
});

const updateBannerSchema = Joi.object({
  title: Joi.string().optional(),
  imageUrl: Joi.string().uri().optional(),
  linkUrl: Joi.string().uri().optional().allow('', null),
  position: Joi.number().integer().optional(),
  startsAt: Joi.date().iso().optional().allow(null),
  endsAt: Joi.date().iso().optional().allow(null)
}).min(1);

const createFlashSaleSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  discountPercent: Joi.number().integer().min(1).max(99).required(),
  flashPrice: Joi.number().integer().positive().required(),
  startsAt: Joi.date().iso().required(),
  endsAt: Joi.date().iso().min(Joi.ref('startsAt')).required()
});

const updateSettingSchema = Joi.object({
  value: Joi.any().required()
});

const assignRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'agent').required()
});

module.exports = {
  createBannerSchema,
  updateBannerSchema,
  createFlashSaleSchema,
  updateSettingSchema,
  assignRoleSchema
};
