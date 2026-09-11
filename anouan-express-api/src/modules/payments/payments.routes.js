const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { validate } = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { paymentLimiter } = require('../../middlewares/rateLimiter');
const { initiatePaymentSchema } = require('./payments.validation');

router.post('/initiate', authenticate, authorize('client'), paymentLimiter, validate({ body: initiatePaymentSchema }), paymentsController.initiatePayment);
router.post('/webhook', paymentsController.handleWebhook);
router.get('/history', authenticate, authorize('client'), paymentsController.getPaymentHistory);
router.get('/order/:orderId', authenticate, paymentsController.getPaymentByOrder);

module.exports = router;
