// public/firebase-messaging-sw.js
// Service Worker Firebase — reçoit les notifications push en arrière-plan

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Configuration Firebase (remplacer par vos valeurs une fois le projet créé)
// Ces valeurs sont publiques — pas de secret ici
const firebaseConfig = {
  apiKey:            self.FIREBASE_API_KEY || '',
  authDomain:        self.FIREBASE_AUTH_DOMAIN || '',
  projectId:         self.FIREBASE_PROJECT_ID || '',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             self.FIREBASE_APP_ID || '',
};

// Initialiser uniquement si configuré
if (firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Gérer les notifications en arrière-plan
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Message reçu en arrière-plan :', payload);

    const { title, body, icon } = payload.notification || {};
    const data = payload.data || {};

    const notificationTitle = title || '🛒 Anouan Express';
    const notificationOptions = {
      body: body || 'Vous avez une nouvelle notification',
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data,
      actions: [],
      vibrate: [200, 100, 200],
      tag: data.type || 'anouan-notification',
    };

    // Actions contextuelles selon le type
    if (data.type === 'order_status_changed' && data.orderId) {
      notificationOptions.actions = [
        { action: 'view_order', title: '📦 Voir commande' },
      ];
    } else if (data.type === 'new_message') {
      notificationOptions.actions = [
        { action: 'open_chat', title: '💬 Répondre' },
      ];
    }

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

  // Gérer le clic sur une notification
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data || {};

    let url = '/';
    if (data.orderId) url = `/order/${data.orderId}`;
    else if (data.senderId) url = `/chat`;

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
    );
  });
}
