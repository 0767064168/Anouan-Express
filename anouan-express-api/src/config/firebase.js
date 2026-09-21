// src/config/firebase.js
// Initialisation Firebase Admin SDK pour les notifications push (FCM)

let admin = null;
let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    admin = require('firebase-admin');

    // Vérifier si les credentials Firebase sont configurés
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT non configuré — Push notifications désactivées');
      return null;
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch {
      console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT invalide (JSON mal formé)');
      return null;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('🔔 Firebase Admin SDK initialisé — Push notifications actives');
    return firebaseApp;
  } catch (err) {
    console.warn('⚠️  Firebase Admin SDK non disponible :', err.message);
    return null;
  }
};

/**
 * Envoie une notification push FCM à un device
 * @param {string} fcmToken  - Token FCM du device cible
 * @param {string} title     - Titre de la notification
 * @param {string} body      - Corps de la notification
 * @param {object} data      - Données additionnelles (optionnel)
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;

  const app = initFirebase();
  if (!app || !admin) return; // Firebase non configuré — silencieux

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          icon: 'ic_notification',
          color: '#f97316',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Push envoyé à ${fcmToken.substring(0, 20)}... — ${response}`);
    return response;
  } catch (err) {
    // Token invalide ou expiré — ne pas crasher
    if (err.code === 'messaging/registration-token-not-registered') {
      console.warn(`⚠️  Token FCM invalide/expiré : ${fcmToken.substring(0, 20)}...`);
    } else {
      console.error('❌ Erreur push FCM :', err.message);
    }
  }
};

// Initialisation au démarrage (non bloquant)
initFirebase();

module.exports = { sendPushNotification };
