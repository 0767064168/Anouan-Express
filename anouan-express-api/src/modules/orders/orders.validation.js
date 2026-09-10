const Joi = require('joi');

const createOrderSchema = Joi.object({
  storeId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  paymentMethod: Joi.string().valid(
    'card', 'mobile_money', 'cash', 'orange', 'mtn', 'moov', 'wave', 'orange_money', 'mtn_momo', 'pickup'
  ).required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      variantId: Joi.alternatives().try(Joi.string(), Joi.number()).optional().allow(null, ''),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required()
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().optional().allow(''),
  vendorId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  storeId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional()
});

const updateItemStatusSchema = Joi.object({
  status: Joi.string().valid('preparing', 'shipped_to_store', 'received_at_store', 'ready_for_pickup', 'picked_up', 'cancelled').required()
});

module.exports = {
  createOrderSchema,
  paginationSchema,
  updateItemStatusSchema
};
