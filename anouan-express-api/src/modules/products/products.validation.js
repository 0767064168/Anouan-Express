const Joi = require('joi');

const requireFlashSalePrice = (value, helpers) => {
  const isActive = value.flashSaleActive === true || value.flashSaleActive === 'true';
  const hasPrice = value.flashSalePrice !== undefined && value.flashSalePrice !== null && value.flashSalePrice !== '';

  if (isActive && !hasPrice) {
    return helpers.message({ custom: 'flashSalePrice is required when flashSaleActive is true' });
  }

  return value;
};

const createSchema = Joi.object({
  title: Joi.string().allow(null, '').max(255),
  name: Joi.string().allow(null, '').max(255),
  description: Joi.string().allow(null, ''),
  price: Joi.alternatives().try(Joi.number().min(0), Joi.string()).required(),
  stock: Joi.alternatives().try(Joi.number().min(0), Joi.string()).default(0),
  categoryId: Joi.string().allow(null, '').default('cat-1'),
  category_id: Joi.string().allow(null, ''),
  flashSaleActive: Joi.alternatives().try(Joi.boolean(), Joi.string()).default(false),
  flashSalePrice: Joi.alternatives().try(Joi.number().min(0), Joi.string(), Joi.allow(null, '')),
  variants: Joi.alternatives().try(Joi.array(), Joi.string()).default([])
}).unknown(true).custom(requireFlashSalePrice);

const updateSchema = Joi.object({
  title: Joi.string().allow(null, '').max(255),
  name: Joi.string().allow(null, '').max(255),
  description: Joi.string().allow(null, ''),
  price: Joi.alternatives().try(Joi.number().min(0), Joi.string()),
  stock: Joi.alternatives().try(Joi.number().min(0), Joi.string()),
  categoryId: Joi.string().allow(null, ''),
  category_id: Joi.string().allow(null, ''),
  flashSaleActive: Joi.alternatives().try(Joi.boolean(), Joi.string()),
  flashSalePrice: Joi.alternatives().try(Joi.number().min(0), Joi.string(), Joi.allow(null, '')),
  variants: Joi.alternatives().try(Joi.array(), Joi.string())
}).unknown(true);

const catalogQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  categoryId: Joi.string().allow(null, ''),
  vendorId: Joi.string().allow(null, ''),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  search: Joi.string().allow(''),
  q: Joi.string().allow(''),
  category: Joi.string().allow(''),
  vendorOnly: Joi.alternatives().try(Joi.boolean(), Joi.string()),
  minRating: Joi.number().min(0).max(5),
  sort: Joi.string().allow('', null)
}).unknown(true);

module.exports = {
  createSchema,
  updateSchema,
  catalogQuerySchema
};
