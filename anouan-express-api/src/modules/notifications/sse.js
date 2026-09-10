// src/modules/notifications/sse.js
// Gestionnaire Server-Sent Events pour notifications push temps reel

/** Map userId => Set de Response objects SSE actifs */
const clients = new Map();

const addClient = (userId, res) => {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
  console.log(`[SSE] Client connecte userId=${userId} (total=${getClientCount()})`);
};

const removeClient = (userId, res) => {
  const set = clients.get(userId);
  if (set) {
    set.delete(res);
    if (set.size === 0) clients.delete(userId);
  }
  console.log(`[SSE] Client deconnecte userId=${userId} (total=${getClientCount()})`);
};

const sendNotification = (userId, payload) => {
  const set = clients.get(String(userId));
  if (!set || set.size === 0) return false;
  const event = `data: ${JSON.stringify({ ...payload, timestamp: new Date().toISOString() })}\n\n`;
  for (const res of set) {
    try { res.write(event); } catch (e) { set.delete(res); }
  }
  console.log(`[SSE] Notif envoyee userId=${userId} type=${payload.type}`);
  return true;
};

const broadcastToAdmins = (adminIds, payload) => {
  for (const adminId of adminIds) sendNotification(String(adminId), payload);
};

const getClientCount = () => {
  let total = 0;
  for (const set of clients.values()) total += set.size;
  return total;
};

module.exports = { addClient, removeClient, sendNotification, broadcastToAdmins, getClientCount };
