// src/config/socket.js
// Gestionnaire centralisé Socket.io pour Anouan Express

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, env.jwt.secret);
        socket.user = decoded;
      } catch (err) {
        socket.user = null;
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id || socket.handshake.query?.userId;

    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`🔌 Socket connecté : ${socket.id} -> Salle : user_${userId}`);
    }

    socket.on('join_chat', (chatRoomId) => {
      socket.join(`chat_${chatRoomId}`);
      console.log(`💬 Socket ${socket.id} a rejoint chat_${chatRoomId}`);
    });

    socket.on('leave_chat', (chatRoomId) => {
      socket.leave(`chat_${chatRoomId}`);
    });

    socket.on('track_order', (orderId) => {
      socket.join(`order_${orderId}`);
    });

    socket.on('disconnect', () => {
      // Déconnecté
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io non initialisé.');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

const emitToChat = (chatRoomId, event, data) => {
  if (io) {
    io.to(`chat_${chatRoomId}`).emit(event, data);
  }
};

const emitToOrder = (orderId, event, data) => {
  if (io) {
    io.to(`order_${orderId}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToChat,
  emitToOrder
};
