const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  icon: Joi.string().allow(null, ''),
  imageUrl: Joi.string().uri().allow(null, ''),
  parentId: Joi.string().uuid().allow(null),
  sortOrder: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true)
});

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  icon: Joi.string().allow(null, ''),
  imageUrl: Joi.string().uri().allow(null, ''),
  parentId: Joi.string().uuid().allow(null),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean()
}).min(1);

module.exports = {
  createSchema,
  updateSchema
};
