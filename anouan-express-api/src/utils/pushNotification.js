// src/utils/pushNotification.js
// Notifications push via Firebase Cloud Messaging (FCM)
// Utilisé par les apps Flutter (desktop + mobile)

const env = require('../config/env');

let admin = null;

const getFirebaseAdmin = () => {
  if (admin) return admin;
  if (!env.fcm.projectId || !env.fcm.clientEmail || !env.fcm.privateKey) {
    return null; // FCM non configuré
  }
  try {
    // Chargement dynamique pour éviter une erreur au démarrage si non configuré
    const firebaseAdmin = require('firebase-admin');
    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId: env.fcm.projectId,
          clientEmail: env.fcm.clientEmail,
          privateKey: env.fcm.privateKey,
        }),
      });
    }
    admin = firebaseAdmin;
    return admin;
  } catch (err) {
    console.error('[FCM] Erreur d\'initialisation Firebase :', err.message);
    return null;
  }
};

/**
 * Envoie une notification push à un token FCM unique
 * @param {string} fcmToken - Token FCM de l'appareil cible
 * @param {string} title    - Titre de la notification
 * @param {string} body     - Corps de la notification
 * @param {object} [data]   - Données additionnelles (clés string uniquement)
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;

  const fb = getFirebaseAdmin();
  if (!fb) {
    if (env.app.env === 'development') {
      console.log(`[PUSH DEV] → ${fcmToken.slice(0, 20)}... | ${title} : ${body}`);
    }
    return;
  }

  try {
    await fb.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: { sound: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
      },
      apns: {
        payload: { aps: { sound: 'default' } },
      },
    });
  } catch (err) {
    console.error('[FCM] Erreur d\'envoi push :', err.message);
  }
};

/**
 * Envoie à plusieurs tokens (multicast)
 * @param {string[]} fcmTokens
 */
const sendMulticastPush = async (fcmTokens, title, body, data = {}) => {
  if (!fcmTokens?.length) return;
  await Promise.allSettled(
    fcmTokens.map((token) => sendPushNotification(token, title, body, data))
  );
};

// ─── Notifications typées ─────────────────────────────────────

const pushOrderCreated = (token, orderId) =>
  sendPushNotification(token, '✅ Commande confirmée', 'Votre commande a bien été enregistrée.', { orderId, type: 'order_created' });

const pushPickupReady = (token, orderId, code) =>
  sendPushNotification(token, '📦 Commande prête !', `Votre commande est disponible. Code : ${code}`, { orderId, code, type: 'pickup_ready' });

const pushNewOrderVendor = (token, orderId) =>
  sendPushNotification(token, '🛒 Nouvelle commande !', 'Vous avez reçu une nouvelle commande à préparer.', { orderId, type: 'new_order' });

const pushDisputeOpened = (token, orderId) =>
  sendPushNotification(token, '⚠️ Litige ouvert', 'Un litige a été ouvert sur votre commande.', { orderId, type: 'dispute_opened' });

module.exports = {
  sendPushNotification,
  sendMulticastPush,
  pushOrderCreated,
  pushPickupReady,
  pushNewOrderVendor,
  pushDisputeOpened,
};
