const Joi = require('joi');

const updateMeSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  avatarUrl: Joi.string().uri().optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'banned').required()
});

const fcmTokenSchema = Joi.object({
  fcmToken: Joi.string().required()
});

module.exports = {
  updateMeSchema,
  updateStatusSchema,
  fcmTokenSchema
};
