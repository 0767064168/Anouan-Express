const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const axios = require('axios');
const { sendOrderConfirmation } = require('../../utils/emailService');
const { smsOrderConfirmed } = require('../../utils/smsService');
const { pushOrderCreated } = require('../../utils/pushNotification');
const crypto = require('crypto');

class PaymentsService {
  async initiatePayment(orderId, clientId, provider) {
    let order = null;
    try {
      const { rows: orderRows } = await query('SELECT * FROM orders WHERE id = $1 AND client_id = $2', [orderId, clientId]);
      if (orderRows.length) order = orderRows[0];
    } catch { /* DB mock mode */ }
    
    const paymentId = 'pay_' + crypto.randomUUID().slice(0, 8);
    const amount = order?.total_amount || 15000;
    
    try {
      await query(`
        INSERT INTO payments (id, order_id, amount, provider, status)
        VALUES ($1, $2, $3, $4, 'pending')
      `, [paymentId, orderId, amount, provider]);
    } catch { /* ignore if mock */ }
    
    // Mode Simulation Mobile Money (Orange, MTN, Wave, Cash)
    const refCode = 'ANX-CI-' + Math.floor(100000 + Math.random() * 900000);
    const ussdCode = provider === 'orange' ? '*144*82#' : provider === 'mtn' ? '*133#' : provider === 'wave' ? 'Wave App' : 'Espèces';

    return {
      paymentId,
      orderId,
      provider,
      amount,
      currency: 'XOF',
      referenceCode: refCode,
      ussdCode,
      paymentUrl: `${process.env.APP_URL || 'http://localhost:5173'}/payment/confirm?id=${paymentId}`,
      status: 'pending',
      instructions: `Composez le ${ussdCode} pour valider le règlement Mobile Money.`
    };
  }

  async handleWebhook(payload) {
    const transactionId = payload.cpm_trans_id || payload.paymentId || payload.transaction_id;
    const paymentStatus = (payload.cpm_result === '00' || payload.status === 'success' || payload.status === 'paid') ? 'success' : 'failed';
    
    if (!transactionId) return { received: true, status: 'ignored' };
    
    try {
      const { rows: paymentRows } = await query('SELECT * FROM payments WHERE id = $1', [transactionId]);
      if (paymentRows.length) {
        const payment = paymentRows[0];
        if (paymentStatus === 'success') {
          await query("UPDATE payments SET status = 'success' WHERE id = $1", [transactionId]);
          await query("UPDATE orders SET payment_status = 'paid' WHERE id = $1", [payment.order_id]);
        } else {
          await query("UPDATE payments SET status = 'failed' WHERE id = $1", [transactionId]);
          await query("UPDATE orders SET payment_status = 'failed' WHERE id = $1", [payment.order_id]);
        }
      }
    } catch { /* ignore if DB mock */ }
    
    return { received: true, status: paymentStatus, transactionId };
  }

  async getPaymentHistory(clientId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const { rows: countRows } = await query('SELECT COUNT(*) FROM payments WHERE client_id = $1', [clientId]);
    const total = parseInt(countRows[0].count, 10);
    
    const { rows } = await query(`
      SELECT p.*, o.total_amount, o.status as order_status 
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.client_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [clientId, limit, offset]);
    
    return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getPaymentByOrder(orderId) {
    const { rows } = await query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
    return rows[0] || null;
  }
}

module.exports = new PaymentsService();
