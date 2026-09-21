const Joi = require('joi');

const bannerLinkSchema = Joi.string()
  .pattern(/^(https?:\/\/|\/)/)
  .optional()
  .allow('', null);

const createBannerSchema = Joi.object({
  title: Joi.string().required(),
  imageUrl: Joi.string().uri().required(),
  linkUrl: bannerLinkSchema,
  subtitle: Joi.string().allow('', null).optional(),
  badge: Joi.string().max(100).allow('', null).optional(),
  themeColor: Joi.string().max(100).allow('', null).optional(),
  productName: Joi.string().allow('', null).optional(),
  productPrice: Joi.number().integer().min(0).allow(null).optional(),
  productOldPrice: Joi.number().integer().min(0).allow(null).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  position: Joi.number().integer().default(0),
  startsAt: Joi.date().iso().optional().allow(null),
  endsAt: Joi.date().iso().optional().allow(null)
});

const updateBannerSchema = Joi.object({
  title: Joi.string().optional(),
  imageUrl: Joi.string().uri().optional(),
  linkUrl: bannerLinkSchema,
  subtitle: Joi.string().allow('', null).optional(),
  badge: Joi.string().max(100).allow('', null).optional(),
  themeColor: Joi.string().max(100).allow('', null).optional(),
  productName: Joi.string().allow('', null).optional(),
  productPrice: Joi.number().integer().min(0).allow(null).optional(),
  productOldPrice: Joi.number().integer().min(0).allow(null).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  position: Joi.number().integer().optional(),
  startsAt: Joi.date().iso().optional().allow(null),
  endsAt: Joi.date().iso().optional().allow(null)
}).min(1);

const createFlashSaleSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  discountPercent: Joi.number().integer().min(1).max(99).required(),
  flashPrice: Joi.number().integer().positive().required(),
  stock: Joi.number().integer().min(0).required(),
  imageUrl: Joi.string().uri().allow('', null).optional(),
  startsAt: Joi.date().iso().required(),
  endsAt: Joi.date().iso().min(Joi.ref('startsAt')).required()
});

const createFlashSalesSchema = Joi.object({
  startsAt: Joi.date().iso().required(),
  endsAt: Joi.date().iso().min(Joi.ref('startsAt')).required(),
  products: Joi.array().items(Joi.object({
    productId: Joi.string().uuid().required(),
    discountPercent: Joi.number().integer().min(1).max(99).required(),
    flashPrice: Joi.number().integer().positive().required(),
    stock: Joi.number().integer().min(0).required(),
    imageUrl: Joi.string().uri().allow('', null).optional()
  })).min(1).required()
});

const updateFlashSaleSchema = Joi.object({
  discountPercent: Joi.number().integer().min(1).max(99).optional(),
  flashPrice: Joi.number().integer().positive().optional(),
  stock: Joi.number().integer().min(0).optional(),
  imageUrl: Joi.string().uri().allow('', null).optional(),
  startsAt: Joi.date().iso().optional(),
  endsAt: Joi.date().iso().optional()
}).min(1);

const updateSettingSchema = Joi.object({
  value: Joi.any().required()
});

const assignRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'agent').required()
});

const createAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().trim().lowercase().email().max(255).required(),
  phone: Joi.string().trim().max(20).allow('', null).optional(),
  password: Joi.string().min(8).max(128).required()
});

const createAgentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().trim().lowercase().email().max(255).required(),
  phone: Joi.string().trim().max(20).allow('', null).optional(),
  password: Joi.string().min(8).max(128).required(),
  storeId: Joi.string().uuid().required()
});

const assignAgentStoreSchema = Joi.object({
  storeId: Joi.string().uuid().required()
});

const updateAgentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  phone: Joi.string().trim().max(20).allow('', null).optional(),
  storeId: Joi.string().uuid().required()
});

module.exports = {
  createBannerSchema,
  updateBannerSchema,
  createFlashSaleSchema,
  createFlashSalesSchema,
  updateFlashSaleSchema,
  updateSettingSchema,
  assignRoleSchema,
  createAdminSchema,
  createAgentSchema,
  assignAgentStoreSchema,
  updateAgentSchema
};
