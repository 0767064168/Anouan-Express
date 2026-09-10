const paymentsService = require('./payments.service');

exports.initiatePayment = async (req, res, next) => {
  try {
    const { orderId, provider } = req.body;
    const result = await paymentsService.initiatePayment(orderId, req.user.id, provider);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.handleWebhook = async (req, res, next) => {
  try {
    const result = await paymentsService.handleWebhook(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await paymentsService.getPaymentHistory(req.user.id, parseInt(page || 1, 10), parseInt(limit || 20, 10));
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentByOrder = async (req, res, next) => {
  try {
    const payment = await paymentsService.getPaymentByOrder(req.params.orderId);
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};
