// src/middlewares/validate.js
// Validation des payloads de requête avec Joi

const { AppError } = require('./errorHandler');

/**
 * Crée un middleware de validation Joi.
 * @param {object} schema - Schéma Joi avec les clés body, query, params (optionnelles)
 * @example
 *   router.post('/register', validate({ body: registerSchema }), controller)
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) errors.push(...error.details.map((d) => d.message));
      else req.body = schema.body.validate(req.body, { stripUnknown: true }).value;
    }

    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false, stripUnknown: true });
      if (error) errors.push(...error.details.map((d) => d.message));
      else req.query = schema.query.validate(req.query, { stripUnknown: true }).value;
    }

    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) errors.push(...error.details.map((d) => d.message));
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join('; '), 422, 'VALIDATION_ERROR'));
    }

    return next();
  };
};

module.exports = { validate };
