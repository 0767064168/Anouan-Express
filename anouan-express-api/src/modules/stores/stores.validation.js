const Joi = require('joi');

const createStoreSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  phone: Joi.string().optional(),
  contact_email: Joi.string().email().optional(),
  is_active: Joi.boolean().default(true)
});

const updateStoreSchema = Joi.object({
  name: Joi.string().optional(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  phone: Joi.string().optional(),
  contact_email: Joi.string().email().optional(),
  is_active: Joi.boolean().optional()
});

module.exports = {
  createStoreSchema,
  updateStoreSchema
};
