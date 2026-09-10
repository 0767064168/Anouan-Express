// src/modules/auth/auth.validation.js
// Schémas Joi pour la validation des requêtes auth

const Joi = require('joi');

const phone = Joi.string().pattern(/^\+?[0-9]{8,15}$/).messages({
  'string.pattern.base': 'Numéro de téléphone invalide (format international requis)',
});

const password = Joi.string().min(8).max(128).messages({
  'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
});

const registerSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(150).required(),
    email: Joi.string().email().lowercase().when('phone', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    phone: phone.optional(),
    password: password.required(),
  }).or('email', 'phone'),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  }),
};

const sendOtpSchema = {
  body: Joi.object({
    phone: phone.required(),
  }),
};

const verifyOtpSchema = {
  body: Joi.object({
    phone: phone.required(),
    otp: Joi.string().length(6).required(),
  }),
};

const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().optional(),
  }),
};

const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().lowercase().required(),
  }),
};

const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required(),
    email: Joi.string().email().lowercase().required(),
    newPassword: password.required(),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
