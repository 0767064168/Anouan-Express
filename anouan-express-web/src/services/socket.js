// src/services/socket.js
// Client WebSocket Socket.io pour Anouan Express

import { io } from 'socket.io-client';

const getViteApiUrl = () => {
  try {
    return import.meta.env?.VITE_API_URL || undefined;
  } catch (error) {
    return undefined;
  }
};

let socket = null;

// Déterminer l'URL du serveur WebSocket (retirer le suffixe /api)
export const getSocketUrl = (origin = typeof window !== 'undefined' ? window.location.origin : '') => {
  const normalizedOrigin = origin || '';
  const envUrl = getViteApiUrl();

  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/api\/?$/, '');
  }

  const isLocalDevFrontend = /:(3000|3001|3002|5173|4173)(?:\/|$)/.test(normalizedOrigin)
    || normalizedOrigin.includes('localhost')
    || normalizedOrigin.includes('127.0.0.1');

  if (normalizedOrigin === 'http://localhost' || normalizedOrigin === 'capacitor://localhost') {
    return 'http://192.168.11.40:5000';
  }

  if (isLocalDevFrontend) {
    return 'http://localhost:5000';
  }

  return normalizedOrigin || 'http://localhost:5000';
};

export const connectSocket = (token, userId) => {
  if (socket?.connected) return socket;

  const url = getSocketUrl();
  socket = io(url, {
    auth: { token },
    query: { userId },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000
  });

  socket.on('connect', () => {
    console.log('⚡ Connecté au serveur temps réel Socket.io :', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Déconnecté du serveur temps réel :', reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChatRoom = (roomId) => {
  if (socket) {
    socket.emit('join_chat', roomId);
  }
};

export const leaveChatRoom = (roomId) => {
  if (socket) {
    socket.emit('leave_chat', roomId);
  }
};

export const trackOrderRoom = (orderId) => {
  if (socket) {
    socket.emit('track_order', orderId);
  }
};
