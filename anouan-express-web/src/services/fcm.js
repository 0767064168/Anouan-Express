// src/services/fcm.js
// Client Firebase Cloud Messaging — Notifications push Android

// ⚠️ Ces variables d'environnement doivent être définies dans .env
// VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_MESSAGING_SENDER_ID,
// VITE_FIREBASE_APP_ID, VITE_FIREBASE_VAPID_KEY

let messaging = null;
let firebaseApp = null;

const FIREBASE_CONFIG_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const isFirebaseConfigured = () =>
  FIREBASE_CONFIG_KEYS.every((k) => import.meta.env[k]);

/**
 * Initialise Firebase et retourne le service messaging
 */
const initFirebaseMessaging = async () => {
  if (messaging) return messaging;
  if (!isFirebaseConfigured()) {
    console.warn('⚠️ Firebase non configuré — variables VITE_FIREBASE_* manquantes');
    return null;
  }

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, isSupported } = await import('firebase/messaging');

    const supported = await isSupported();
    if (!supported) {
      console.warn('⚠️ Notifications push non supportées sur ce navigateur/device');
      return null;
    }

    const firebaseConfig = {
      apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain:        `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    };

    firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    messaging = getMessaging(firebaseApp);
    console.log('🔔 Firebase Messaging initialisé');
    return messaging;
  } catch (err) {
    console.warn('⚠️ Erreur init Firebase Messaging :', err.message);
    return null;
  }
};

/**
 * Retourne le token FCM uniquement si la permission a déjà été accordée.
 * @returns {Promise<string|null>} FCM token ou null
 */
export const getFcmToken = async () => {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return null;

    const msg = await initFirebaseMessaging();
    if (!msg) return null;

    const { getToken } = await import('firebase/messaging');
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(msg, { vapidKey });

    console.log('🔔 FCM Token obtenu :', token?.substring(0, 30) + '...');
    return token;
  } catch (err) {
    console.warn('⚠️ Erreur récupération token FCM :', err.message);
    return null;
  }
};

/**
 * Demande explicitement la permission de notification après une action utilisateur.
 * @returns {Promise<string|null>} FCM token ou null
 */
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window) || Notification.permission !== 'default') return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    return getFcmToken();
  } catch (err) {
    console.warn('⚠️ Erreur récupération token FCM :', err.message);
    return null;
  }
};

/**
 * Sauvegarde le token FCM sur le serveur
 * @param {string} token - FCM token
 */
export const saveFcmToken = async (token) => {
  if (!token) return;
  try {
    const { default: api } = await import('./api');
    await api.put('/users/me/fcm-token', { fcmToken: token });
    console.log('✅ FCM token sauvegardé sur le serveur');
  } catch (err) {
    console.warn('⚠️ Impossible de sauvegarder le FCM token :', err.message);
  }
};

/**
 * Écoute les messages en foreground (app ouverte)
 * @param {function} onMessage - Callback appelé avec le message reçu
 */
export const onForegroundMessage = async (onMessage) => {
  const msg = await initFirebaseMessaging();
  if (!msg) return () => {};

  const { onMessage: fbOnMessage } = await import('firebase/messaging');
  return fbOnMessage(msg, (payload) => {
    console.log('📩 Message FCM reçu en foreground :', payload);
    onMessage?.(payload);
  });
};
