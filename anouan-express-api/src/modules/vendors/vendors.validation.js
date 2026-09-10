const Joi = require('joi');

const applySchema = Joi.object({
  shopName: Joi.string().required(),
  description: Joi.string().optional(),
  legalDocUrl: Joi.string().uri().optional()
});

const updateProfileSchema = Joi.object({
  shopName: Joi.string().optional(),
  description: Joi.string().optional(),
  logoUrl: Joi.string().uri().optional()
});

const validateVendorSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject', 'suspend', 'reactivate').required(),
  reason: Joi.string().optional()
});

const setCommissionSchema = Joi.object({
  rate: Joi.number().min(0).max(50).required()
});

module.exports = {
  applySchema,
  updateProfileSchema,
  validateVendorSchema,
  setCommissionSchema
};
