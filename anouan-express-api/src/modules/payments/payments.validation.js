const Joi = require('joi');

const initiatePaymentSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  phoneNumber: Joi.string().pattern(/^\+?[0-9\s]{8,20}$/).required(),
  provider: Joi.string().valid('orange', 'mtn', 'wave').required()
});

module.exports = {
  initiatePaymentSchema
};
