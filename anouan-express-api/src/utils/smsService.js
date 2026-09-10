// src/utils/smsService.js
// Envoi de SMS via Infobip (ou simulation en mode développement)

const axios = require('axios');
const env = require('../config/env');

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
const smsOrderConfirmed = (to, { orderId }) =>
  sendSMS(
    to,
    `Anouan Express : Votre commande #${orderId.slice(0, 8).toUpperCase()} est confirmée. Nous vous préviendrons dès qu'elle sera prête.`
  );

/**
 * SMS : code de retrait disponible
 */
const smsPickupReady = (to, { orderId, code, expiresAt }) =>
  sendSMS(
    to,
    `Anouan Express : Votre commande #${orderId.slice(0, 8).toUpperCase()} est prête ! Code de retrait : ${code}. Valable jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-CI')}.`
  );

/**
 * SMS : rappel de retrait
 */
const smsPickupReminder = (to, { code }) =>
  sendSMS(
    to,
    `Anouan Express : Rappel — votre commande vous attend au magasin. Code : ${code}. Venez la récupérer avant expiration.`
  );

/**
 * SMS : nouvelle commande reçue (pour le vendeur)
 */
const smsNewOrder = (to, { orderId, itemsCount }) =>
  sendSMS(
    to,
    `Anouan Express : Nouvelle commande #${orderId.slice(0, 8).toUpperCase()} — ${itemsCount} article(s) à préparer. Connectez-vous à votre tableau de bord.`
  );

module.exports = {
  sendSMS,
  smsOrderConfirmed,
  smsPickupReady,
  smsPickupReminder,
  smsNewOrder,
};
