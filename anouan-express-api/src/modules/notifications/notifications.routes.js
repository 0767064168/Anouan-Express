// src/modules/notifications/notifications.routes.js
const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');
const { authenticate } = require('../../middlewares/authenticate');
const { addClient, removeClient } = require('./sse');

// ─── Endpoint SSE — connexion temps réel ──────────────────────
router.get('/stream', authenticate, (req, res) => {
  const userId = String(req.user.id);

  // Headers SSE obligatoires
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx : désactive le buffering
  res.flushHeaders();

  // Message de connexion initiale
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Flux SSE actif', userId })}\n\n`);

  // Enregistrer ce client
  addClient(userId, res);

  // Keepalive toutes les 25 secondes (évite timeout proxy)
  const keepAlive = setInterval(() => {
    try { res.write(': keepalive\n\n'); } catch { clearInterval(keepAlive); }
  }, 25000);

  // Nettoyage à la déconnexion
  req.on('close', () => {
    clearInterval(keepAlive);
    removeClient(userId, res);
  });
});

// ─── Routes REST notifications ────────────────────────────────
router.get('/',             authenticate, notificationsController.getMyNotifications);
router.get('/unread-count', authenticate, notificationsController.getUnreadCount);
router.put('/read-all',     authenticate, notificationsController.markAllAsRead);
router.put('/:id/read',     authenticate, notificationsController.markAsRead);
router.post('/push/subscribe',   authenticate, notificationsController.subscribeFcmToken);
router.delete('/push/subscribe', authenticate, notificationsController.unsubscribeFcmToken);

module.exports = router;
