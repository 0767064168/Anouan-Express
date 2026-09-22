const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const env = require('../../config/env');
const axios = require('axios');
const { sendOrderConfirmation } = require('../../utils/emailService');
const { smsOrderConfirmed } = require('../../utils/smsService');
const { pushOrderCreated } = require('../../utils/pushNotification');
const crypto = require('crypto');

class PaymentsService {
  validateWebhookSignature(payload, headers = {}, rawBody = '') {
    const envName = env.app?.env || 'development';
    const secret = env.payment?.webhookSecret || env.payment?.cinetpay?.apiKey;

    if (envName !== 'production' || !secret) return true;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody || JSON.stringify(payload || {}))
      .digest('hex');

    const receivedSignature = headers['x-cinetpay-signature'] || headers['X-CinetPay-Signature'] || headers['x-signature'] || headers['X-Signature'];

    if (!receivedSignature) {
      throw new AppError('Signature du webhook invalide.', 401, 'WEBHOOK_SIGNATURE_INVALID');
    }

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(receivedSignature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      throw new AppError('Signature du webhook invalide.', 401, 'WEBHOOK_SIGNATURE_INVALID');
    }

    return true;
  }

  async verifyCinetPayPayment(transactionId) {
    if (!env.payment.cinetpay.apiKey || !env.payment.cinetpay.siteId) return null;

    const response = await axios.post('https://api-checkout.cinetpay.com/v2/payment/check', {
      apikey: env.payment.cinetpay.apiKey,
      site_id: env.payment.cinetpay.siteId,
      transaction_id: transactionId,
    }, { timeout: 15000 });

    const data = response.data?.data || {};
    const status = String(data.payment_status || data.status || '').toUpperCase();
    return response.data?.code === '00' && ['ACCEPTED', 'SUCCESS', 'PAID'].includes(status);
  }

  async initiatePayment(orderId, clientId, provider, phoneNumber) {
    let order = null;
    try {
      const { rows: orderRows } = await query('SELECT * FROM orders WHERE id = $1 AND client_id = $2', [orderId, clientId]);
      if (orderRows.length) order = orderRows[0];
    } catch { /* DB mock mode */ }
    
    const paymentId = crypto.randomUUID();
    const amount = order?.total_amount || 15000;
    const configuredCinetPay = Boolean(env.payment.cinetpay.apiKey && env.payment.cinetpay.siteId);
    
    try {
      await query(`
        INSERT INTO payments (id, order_id, amount, provider, status, reference)
        VALUES ($1, $2, $3, $4, 'pending', $1)
      `, [paymentId, orderId, amount, configuredCinetPay ? env.payment.provider : provider]);
    } catch { /* ignore if mock */ }

    if (configuredCinetPay) {
      try {
        const response = await axios.post('https://api-checkout.cinetpay.com/v2/payment', {
          apikey: env.payment.cinetpay.apiKey,
          site_id: env.payment.cinetpay.siteId,
          transaction_id: paymentId,
          amount: Math.round(Number(amount)),
          currency: 'XOF',
          description: `Commande Anouan Express ${orderId}`,
          customer_name: 'Client Anouan Express',
          customer_phone_number: phoneNumber,
          notify_url: env.payment.cinetpay.notifyUrl,
          return_url: env.payment.cinetpay.returnUrl,
          channels: 'ALL',
          metadata: JSON.stringify({ orderId, requestedProvider: provider }),
        }, { timeout: 15000 });

        const paymentData = response.data?.data;
        if (response.data?.code !== '201' || !paymentData?.payment_url) {
          throw new Error(response.data?.message || 'CinetPay n’a pas fourni de lien de paiement.');
        }

        return {
          paymentId,
          orderId,
          provider: env.payment.provider,
          phoneNumber,
          amount,
          currency: 'XOF',
          referenceCode: paymentId,
          paymentUrl: paymentData.payment_url,
          paymentToken: paymentData.payment_token,
          status: 'pending',
          mode: 'live',
        };
      } catch (error) {
        await query("UPDATE payments SET status = 'failed' WHERE id = $1", [paymentId]).catch(() => {});
        throw new AppError(`Initialisation CinetPay impossible : ${error.response?.data?.message || error.message}`, 502, 'PAYMENT_PROVIDER_ERROR');
      }
    }
    
    // Mode Simulation Mobile Money (Orange, MTN, Wave, Cash)
    const refCode = 'ANX-CI-' + Math.floor(100000 + Math.random() * 900000);
    const ussdCode = provider === 'orange' ? '*144*82#' : provider === 'mtn' ? '*133#' : provider === 'wave' ? 'Wave App' : 'Espèces';

    return {
      paymentId,
      orderId,
      provider,
      phoneNumber,
      amount,
      currency: 'XOF',
      referenceCode: refCode,
      ussdCode,
      paymentUrl: `${process.env.APP_URL || 'http://localhost:5173'}/payment/confirm?id=${paymentId}`,
      status: 'pending',
      mode: 'simulation',
      instructions: `Composez le ${ussdCode} pour valider le règlement Mobile Money.`
    };
  }

  async handleWebhook(payload, headers = {}, rawBody = '') {
    const transactionId = payload.cpm_trans_id || payload.paymentId || payload.transaction_id;
    let paymentStatus = (payload.cpm_result === '00' || payload.status === 'success' || payload.status === 'paid') ? 'success' : 'failed';

    if (!transactionId) return { received: true, status: 'ignored' };

    try {
      this.validateWebhookSignature(payload, headers, rawBody);
    } catch (error) {
      throw error;
    }

    if (env.payment.cinetpay.apiKey && env.payment.cinetpay.siteId) {
      try {
        paymentStatus = await this.verifyCinetPayPayment(transactionId) ? 'success' : 'failed';
      } catch (error) {
        throw new AppError(`Vérification CinetPay impossible : ${error.message}`, 502, 'PAYMENT_VERIFICATION_ERROR');
      }
    }

    try {
      const { rows: paymentRows } = await query('SELECT * FROM payments WHERE id::text = $1 OR reference = $1', [transactionId]);
      if (paymentRows.length) {
        const payment = paymentRows[0];
        if (payment.status === 'success') {
          return { received: true, status: 'success', transactionId, duplicate: true };
        }
        if (paymentStatus === 'success') {
          await query("UPDATE payments SET status = 'success', confirmed_at = NOW() WHERE id = $1", [payment.id]);
          await query("UPDATE orders SET payment_status = 'paid', status = 'preparing', updated_at = NOW() WHERE id = $1", [payment.order_id]);

          // S'assurer qu'un code de retrait est généré
          const { rows: codeRows } = await query('SELECT * FROM pickup_codes WHERE order_id = $1', [payment.order_id]);
          if (!codeRows.length) {
            try {
              const { generatePickupCode, getCodeExpiry } = require('../../utils/pickupCode');
              const { buildPickupQRData } = require('../../utils/qrCode');
              const pickupCode = generatePickupCode ? generatePickupCode() : Math.random().toString(36).substring(2, 10).toUpperCase();
              const expiresAt = getCodeExpiry ? getCodeExpiry() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              const qrData = buildPickupQRData ? buildPickupQRData(pickupCode, payment.order_id) : JSON.stringify({ code: pickupCode, orderId: payment.order_id });
              await query(`
                INSERT INTO pickup_codes (order_id, code, qr_data, status, expires_at)
                VALUES ($1, $2, $3, 'active', $4)
              `, [payment.order_id, pickupCode, qrData, expiresAt]);
            } catch (pcErr) {
              console.warn('[PAYMENT] Code retrait:', pcErr.message);
            }
          }

          const { rows: orderRows } = await query('SELECT client_id, total_amount FROM orders WHERE id = $1', [payment.order_id]);
          if (orderRows.length) {
            const clientUserId = orderRows[0].client_id;
            await query(`
              INSERT INTO notifications (user_id, type, title, body, metadata)
              VALUES ($1, 'payment_confirmed', $2, $3, $4)
            `, [
              clientUserId,
              '✅ Paiement validé avec succès !',
              `Le règlement de votre commande #${payment.order_id} a été confirmé. Votre colis est en cours de préparation.`,
              JSON.stringify({ orderId: payment.order_id, amount: payment.amount })
            ]);

            try {
              const { emitToUser, emitToOrder } = require('../../config/socket');
              const notifData = {
                orderId: payment.order_id,
                paymentStatus: 'paid',
                amount: payment.amount,
                provider: payment.provider
              };
              emitToUser(clientUserId, 'payment_confirmed', notifData);
              emitToOrder(payment.order_id, 'payment_confirmed', notifData);
            } catch (sockErr) {}

            try {
              const { sendPushNotification } = require('../../config/firebase');
              const { rows: clientRows } = await query('SELECT fcm_token FROM users WHERE id = $1', [clientUserId]);
              const fcmToken = clientRows[0]?.fcm_token;
              const amountFmt = new Intl.NumberFormat('fr-CI').format(payment.amount || 0);
              await sendPushNotification(
                fcmToken,
                '✅ Paiement confirmé !',
                `Votre paiement de ${amountFmt} FCFA a été validé. Commande en préparation !`,
                { orderId: String(payment.order_id), type: 'payment_confirmed' }
              );
            } catch (pushErr) {}
          }
        } else {
          await query("UPDATE payments SET status = 'failed' WHERE id = $1", [payment.id]);
          await query("UPDATE orders SET payment_status = 'failed' WHERE id = $1", [payment.order_id]);
        }
      }
    } catch (e) {
      console.error('[WEBHOOK ERROR]', e);
    }

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

  async pollPaymentStatus(orderId) {
    const { rows } = await query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );
    if (!rows[0]) return { status: 'not_found' };
    const payment = rows[0];
    // Si pending, vérifier en temps réel via CinetPay
    if (payment.status === 'pending' && payment.reference) {
      try {
        const confirmed = await this.verifyCinetPayPayment(payment.reference);
        if (confirmed) {
          await query('UPDATE payments SET status=$1 WHERE id=$2', ['completed', payment.id]);
          await query("UPDATE orders SET status='confirmed', payment_status='paid' WHERE id=$1", [orderId]);
          return { status: 'completed', paymentId: payment.id };
        }
      } catch (verifyErr) {
        // En cas d'erreur de vérification CinetPay, on retourne le statut DB sans planter
        console.warn('[POLL] Erreur vérification CinetPay:', verifyErr.message);
      }
    }
    return { status: payment.status, paymentId: payment.id };
  }

  async getPaymentStatus(paymentId, clientId) {
    const { rows } = await query(
      `SELECT p.id, p.order_id, p.provider, p.amount, p.currency, p.status,
              p.reference, p.initiated_at, p.confirmed_at
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.id = $1 AND o.client_id = $2`,
      [paymentId, clientId]
    );

    if (!rows.length) throw new AppError('Paiement introuvable.', 404, 'PAYMENT_NOT_FOUND');
    return rows[0];
  }
}

module.exports = new PaymentsService();
