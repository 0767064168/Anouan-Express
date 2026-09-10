const Joi = require('joi');

const createPayoutSchema = Joi.object({
  vendorId: Joi.string().uuid().required(),
  periodStart: Joi.date().iso().required(),
  periodEnd: Joi.date().iso().min(Joi.ref('periodStart')).required(),
  amountDue: Joi.number().positive().required(),
  notes: Joi.string().allow('', null).optional()
});

const dateRangeSchema = Joi.object({
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional()
});

const payoutIdParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const paymentRefSchema = Joi.object({
  paymentRef: Joi.string().required()
});

module.exports = {
  createPayoutSchema,
  dateRangeSchema,
  payoutIdParamSchema,
  paymentRefSchema
};
