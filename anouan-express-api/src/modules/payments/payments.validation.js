const Joi = require('joi');

const initiatePaymentSchema = Joi.object({
  orderId: Joi.number().integer().required(),
  provider: Joi.string().valid('cinetpay').default('cinetpay')
});

module.exports = {
  initiatePaymentSchema
};
