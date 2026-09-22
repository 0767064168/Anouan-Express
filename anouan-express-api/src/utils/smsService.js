// src/utils/smsService.js
// Envoi de SMS via Infobip (ou simulation en mode développement)

const axios = require('axios');
const env = require('../config/env');

const normalizeOrderId = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') return String(value.orderId || value.id || '');
  return String(value);
};

const normalizeSmsPayload = (payload, fallback = {}) => {
  if (payload === undefined || payload === null) return fallback;
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    return { ...fallback, ...payload };
  }
  return { ...fallback, orderId: normalizeOrderId(payload) };
};

/**
 * Envoie un SMS
 * @param {string} to      - Numéro destinataire (format international, ex: +2250700000000)
 * @param {string} message - Contenu du SMS (max ~160 chars)
 */
const sendSMS = async (to, message) => {
  if (env.app.env === 'development' && !env.sms.infobip.apiKey) {
    console.log(`[SMS DEV] → ${to} : ${message}`);
    return { simulated: true };
  }

  try {
    if (env.sms.provider === 'infobip') {
      const response = await axios.post(
        `${env.sms.infobip.baseUrl}/sms/2/text/advanced`,
        {
          messages: [
            {
              from: env.sms.from,
              destinations: [{ to }],
              text: message,
            },
          ],
        },
        {
          headers: {
            Authorization: `App ${env.sms.infobip.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      return response.data;
    }
    throw new Error(`Fournisseur SMS non supporté : ${env.sms.provider}`);
  } catch (err) {
    console.error('[SMS] Erreur d\'envoi :', err.message);
    // Ne pas propager — un échec SMS ne doit pas bloquer le flux principal
  }
};

// ─── Messages prédéfinis ──────────────────────────────────────

/**
 * SMS : commande confirmée
 */
const smsOrderConfirmed = (to, payload) => {
  const data = normalizeSmsPayload(payload);
  const orderId = normalizeOrderId(data.orderId);
  return module.exports.sendSMS(
    to,
    `Anouan Express : Votre commande #${orderId.slice(0, 8).toUpperCase()} est confirmée. Nous vous préviendrons dès qu'elle sera prête.`
  );
};

/**
 * SMS : code de retrait disponible
 */
const smsPickupReady = (to, payload) => {
  const data = normalizeSmsPayload(payload);
  const orderId = normalizeOrderId(data.orderId);
  const expiresAt = data.expiresAt || new Date();
  return module.exports.sendSMS(
    to,
    `Anouan Express : Votre commande #${orderId.slice(0, 8).toUpperCase()} est prête ! Code de retrait : ${data.code}. Valable jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-CI')}.`
  );
};

/**
 * SMS : rappel de retrait
 */
const smsPickupReminder = (to, payload) => {
  const data = normalizeSmsPayload(payload);
  return module.exports.sendSMS(
    to,
    `Anouan Express : Rappel — votre commande vous attend au magasin. Code : ${data.code}. Venez la récupérer avant expiration.`
  );
};

/**
 * SMS : nouvelle commande reçue (pour le vendeur)
 */
const smsNewOrder = (to, payload) => {
  const data = normalizeSmsPayload(payload, { itemsCount: 1 });
  const orderId = normalizeOrderId(data.orderId);
  const itemsCount = Number(data.itemsCount || 1);
  return module.exports.sendSMS(
    to,
    `Anouan Express : Nouvelle commande #${orderId.slice(0, 8).toUpperCase()} — ${itemsCount} article(s) à préparer. Connectez-vous à votre tableau de bord.`
  );
};

/**
 * SMS : nouvelle commande dans le store (pour l'agent guichet)
 */
const smsNewOrderAgent = (to, payload) => {
  const data = normalizeSmsPayload(payload, { itemsCount: 1 });
  const orderId = normalizeOrderId(data.orderId);
  const storeName = data.storeName || 'Point relais';
  const itemsCount = Number(data.itemsCount || 1);
  return module.exports.sendSMS(
    to,
    `Anouan Express [${storeName}] : Nouvelle commande #${String(orderId).slice(0, 8).toUpperCase()} — ${itemsCount || '?'} article(s) en transit vers votre point relais. Restez disponible.`
  );
};

module.exports = {
  sendSMS,
  smsOrderConfirmed,
  smsPickupReady,
  smsPickupReminder,
  smsNewOrder,
  smsNewOrderAgent,
};
