// src/modules/pickup/pickup.service.js
// Logique de réception au magasin et remise avec code de retrait

const { query, withTransaction } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const { generatePickupCode, getCodeExpiry, normalizeCode } = require('../../utils/pickupCode');
const { buildPickupQRData, generateQRDataURL } = require('../../utils/qrCode');
const { sendPickupCode: sendPickupEmail } = require('../../utils/emailService');
const { smsPickupReady } = require('../../utils/smsService');
const { pushPickupReady } = require('../../utils/pushNotification');
const { logAudit } = require('../../middlewares/auditLog');
const env = require('../../config/env');

// ─── Réception d'un article par l'agent ──────────────────────

/**
 * L'agent scanne/saisit le bordereau d'une commande vendeur
 * et enregistre la réception de l'article
 */
const receiveItem = async (agentId, storeId, {
  orderId,
  orderItemId,
  bordereauRef,
  condition = 'good',
  conditionNotes = null,
  storageLocation = null,
}) => {
  // Vérifier que l'item existe et appartient à cette commande
  const itemRes = await query(
    `SELECT oi.id, oi.status, oi.order_id, oi.vendor_id, oi.title,
            o.store_id, o.client_id, o.status AS order_status
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.id = $1 AND oi.order_id = $2`,
    [orderItemId, orderId]
  );

  if (!itemRes.rows.length) throw new AppError('Article ou commande introuvable.', 404, 'ITEM_NOT_FOUND');
  const item = itemRes.rows[0];

  if (item.status === 'received_at_store') {
    throw new AppError('Cet article a déjà été réceptionné.', 409, 'ALREADY_RECEIVED');
  }
  if (item.store_id && item.store_id !== storeId) {
    throw new AppError('Cet article n\'est pas destiné à votre magasin.', 403, 'WRONG_STORE');
  }

  // Enregistrer la réception + mettre à jour le statut de l'item
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO store_receptions
       (order_item_id, store_id, agent_id, condition, condition_notes, storage_location, bordereau_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orderItemId, storeId, agentId, condition, conditionNotes, storageLocation, bordereauRef || null]
    );

    await client.query(
      `UPDATE order_items SET status = 'received_at_store', updated_at = NOW() WHERE id = $1`,
      [orderItemId]
    );
  });

  // Vérifier si TOUS les items de la commande sont réceptionnés
  await checkAndGeneratePickupCode(orderId, item.client_id);

  await logAudit({
    action: 'store.item_received',
    entityType: 'order_item',
    entityId: orderItemId,
    metadata: { orderId, condition, storageLocation },
    userId: agentId,
  });

  return { message: 'Article réceptionné avec succès.', itemId: orderItemId };
};

/**
 * Vérifie si tous les items sont reçus et génère le code de retrait si oui
 */
const checkAndGeneratePickupCode = async (orderId, clientId) => {
  // Compter les items non encore reçus
  const pendingRes = await query(
    `SELECT COUNT(*) as pending
     FROM order_items
     WHERE order_id = $1 AND status != 'received_at_store' AND status != 'picked_up'`,
    [orderId]
  );

  const pending = parseInt(pendingRes.rows[0].pending, 10);
  if (pending > 0) return; // Pas encore tous reçus

  // Vérifier qu'il n'y a pas déjà un code actif
  const existing = await query(
    'SELECT id FROM pickup_codes WHERE order_id = $1 AND status = $2',
    [orderId, 'active']
  );
  if (existing.rows.length) return; // Code déjà généré

  // Générer un code unique
  let code;
  let attempts = 0;
  do {
    code = generatePickupCode();
    const dup = await query('SELECT id FROM pickup_codes WHERE code = $1', [code]);
    if (!dup.rows.length) break;
    attempts++;
  } while (attempts < 10);

  const expiresAt = getCodeExpiry();
  const qrData = buildPickupQRData(code, orderId);
  const qrDataUrl = await generateQRDataURL(qrData);

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO pickup_codes (order_id, code, qr_data, status, expires_at)
       VALUES ($1, $2, $3, 'active', $4)`,
      [orderId, code, qrData, expiresAt]
    );
    await client.query(
      `UPDATE orders SET status = 'ready_for_pickup', updated_at = NOW() WHERE id = $1`,
      [orderId]
    );
    // In-app notification
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, metadata)
       VALUES ($1, 'pickup_ready', 'Commande prête !', $2, $3)`,
      [
        clientId,
        `Votre commande est disponible en magasin. Code : ${code}`,
        JSON.stringify({ orderId, code }),
      ]
    );
  });

  // Récupérer infos client et magasin pour les notifications
  const infoRes = await query(
    `SELECT u.email, u.phone, u.fcm_token, u.name,
            s.name AS store_name, s.address AS store_address
     FROM orders o
     JOIN users u ON u.id = o.client_id
     LEFT JOIN stores s ON s.id = o.store_id
     WHERE o.id = $1`,
    [orderId]
  );

  if (infoRes.rows.length) {
    const info = infoRes.rows[0];
    const notifData = { orderId, code, expiresAt, storeName: info.store_name, storeAddress: info.store_address };

    // Notifications asynchrones
    if (info.email) sendPickupEmail(info.email, notifData).catch(console.error);
    if (info.phone) smsPickupReady(info.phone, notifData).catch(console.error);
    if (info.fcm_token) pushPickupReady(info.fcm_token, orderId, code).catch(console.error);
  }
};

// ─── Code de retrait client ───────────────────────────────────

/**
 * Récupère le code de retrait d'une commande pour le client
 */
const getMyPickupCode = async (orderId, clientId) => {
  const res = await query(
    `SELECT pc.id, pc.code, pc.qr_data, pc.status, pc.expires_at,
            pc.delegate_name, pc.delegate_id_ref,
            o.client_id
     FROM pickup_codes pc
     JOIN orders o ON o.id = pc.order_id
     WHERE pc.order_id = $1`,
    [orderId]
  );

  if (!res.rows.length) throw new AppError('Code de retrait non encore généré ou commande introuvable.', 404, 'CODE_NOT_FOUND');
  const code = res.rows[0];

  if (code.client_id !== clientId) throw new AppError('Accès refusé.', 403, 'FORBIDDEN');

  // Générer QR data URL à la volée
  const qrDataUrl = await generateQRDataURL(code.qr_data);

  return {
    code: code.code,
    qrDataUrl,
    status: code.status,
    expiresAt: code.expires_at,
    delegateName: code.delegate_name,
    delegateIdRef: code.delegate_id_ref,
  };
};

/**
 * Le client désigne un tiers pour récupérer à sa place
 */
const setDelegate = async (orderId, clientId, { delegateName, delegateIdRef }) => {
  const res = await query(
    `SELECT pc.id FROM pickup_codes pc
     JOIN orders o ON o.id = pc.order_id
     WHERE pc.order_id = $1 AND o.client_id = $2 AND pc.status = 'active'`,
    [orderId, clientId]
  );
  if (!res.rows.length) throw new AppError('Code de retrait introuvable ou inactif.', 404, 'CODE_NOT_FOUND');

  await query(
    `UPDATE pickup_codes SET delegate_name = $1, delegate_id_ref = $2 WHERE id = $3`,
    [delegateName, delegateIdRef, res.rows[0].id]
  );

  return { message: 'Tiers autorisé enregistré.' };
};

// ─── Validation du code par l'agent ──────────────────────────

/**
 * L'agent saisit ou scanne le code du client pour finaliser le retrait
 */
const validatePickupCode = async (agentId, storeId, { code, orderId }) => {
  const normalized = normalizeCode(code);

  const res = await query(
    `SELECT pc.id, pc.code, pc.status, pc.expires_at, pc.attempt_count,
            pc.delegate_name, pc.delegate_id_ref, pc.order_id,
            o.client_id, o.store_id
     FROM pickup_codes pc
     JOIN orders o ON o.id = pc.order_id
     WHERE pc.code = $1`,
    [normalized]
  );

  if (!res.rows.length) {
    // Incrémenter les tentatives même si le code est inconnu (on ignore ici sans code spécifique)
    throw new AppError('Code de retrait invalide.', 400, 'INVALID_CODE');
  }

  const pickup = res.rows[0];

  // Incrémenter le compteur de tentatives
  const newAttempts = pickup.attempt_count + 1;
  await query(
    'UPDATE pickup_codes SET attempt_count = $1 WHERE id = $2',
    [newAttempts, pickup.id]
  );

  // Vérifications
  if (pickup.status === 'used') throw new AppError('Ce code a déjà été utilisé.', 409, 'CODE_ALREADY_USED');
  if (pickup.status === 'expired') throw new AppError('Code expiré.', 410, 'CODE_EXPIRED');
  if (pickup.status === 'blocked') throw new AppError('Code bloqué. Contactez l\'administration.', 403, 'CODE_BLOCKED');

  if (new Date() > new Date(pickup.expires_at)) {
    await query('UPDATE pickup_codes SET status = $1 WHERE id = $2', ['expired', pickup.id]);
    throw new AppError('Code expiré.', 410, 'CODE_EXPIRED');
  }

  // Bloquer après trop de tentatives erronées (mais ici le code est bon)
  if (newAttempts > env.pickup.maxAttempts && pickup.code !== normalized) {
    await query('UPDATE pickup_codes SET status = $1 WHERE id = $2', ['blocked', pickup.id]);
    throw new AppError('Code bloqué après trop de tentatives.', 403, 'CODE_BLOCKED');
  }

  // Vérifier que c'est le bon magasin
  if (pickup.store_id && pickup.store_id !== storeId) {
    throw new AppError('Ce code n\'est pas valable dans ce magasin.', 400, 'WRONG_STORE');
  }

  // Clôturer la commande
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE pickup_codes SET status = 'used', used_at = NOW(), agent_id = $1 WHERE id = $2`,
      [agentId, pickup.id]
    );
    await client.query(
      `UPDATE orders SET status = 'picked_up', updated_at = NOW() WHERE id = $1`,
      [pickup.order_id]
    );
    await client.query(
      `UPDATE order_items SET status = 'picked_up', updated_at = NOW() WHERE order_id = $1`,
      [pickup.order_id]
    );

    // Log de validation
    await client.query(
      `INSERT INTO pickup_code_logs (pickup_code_id, agent_id, success, notes)
       VALUES ($1, $2, true, 'Retrait confirmé')`,
      [pickup.id, agentId]
    );

    // Notification in-app pour le client
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, metadata)
       VALUES ($1, 'order_picked_up', 'Commande retirée', 'Votre commande a bien été récupérée. Merci !', $2)`,
      [pickup.client_id, JSON.stringify({ orderId: pickup.order_id })]
    );
  });

  await logAudit({
    action: 'pickup.code_used',
    entityType: 'pickup_code',
    entityId: pickup.id,
    metadata: { orderId: pickup.order_id, delegateUsed: !!pickup.delegate_name },
    userId: agentId,
  });

  return {
    success: true,
    message: 'Retrait validé. La commande est clôturée.',
    orderId: pickup.order_id,
    delegateName: pickup.delegate_name,
  };
};

// ─── Vue magasin pour l'agent ─────────────────────────────────

const getPendingReceptions = async (storeId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const res = await query(
    `SELECT oi.id, oi.order_id, oi.title, oi.quantity, oi.status,
            oi.updated_at, v.shop_name AS vendor_name,
            o.created_at AS order_date
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN vendors v ON v.id = oi.vendor_id
     WHERE o.store_id = $1
       AND oi.status IN ('preparing', 'shipped_to_store')
     ORDER BY o.created_at ASC
     LIMIT $2 OFFSET $3`,
    [storeId, limit, offset]
  );
  return res.rows;
};

const getStoreStock = async (storeId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const res = await query(
    `SELECT oi.id, oi.order_id, oi.title, oi.quantity,
            sr.received_at, sr.storage_location, sr.condition,
            pc.code AS pickup_code, pc.expires_at AS code_expires,
            u.name AS client_name
     FROM order_items oi
     JOIN store_receptions sr ON sr.order_item_id = oi.id
     JOIN orders o ON o.id = oi.order_id
     JOIN users u ON u.id = o.client_id
     LEFT JOIN pickup_codes pc ON pc.order_id = oi.order_id AND pc.status = 'active'
     WHERE sr.store_id = $1 AND oi.status = 'received_at_store'
     ORDER BY sr.received_at ASC
     LIMIT $2 OFFSET $3`,
    [storeId, limit, offset]
  );
  return res.rows;
};

const regenerateCode = async (adminId, orderId) => {
  const existing = await query(
    'SELECT id FROM pickup_codes WHERE order_id = $1',
    [orderId]
  );
  if (!existing.rows.length) throw new AppError('Aucun code associé à cette commande.', 404, 'CODE_NOT_FOUND');

  const newCode = generatePickupCode();
  const expiresAt = getCodeExpiry();
  const qrData = buildPickupQRData(newCode, orderId);

  await query(
    `UPDATE pickup_codes
     SET code = $1, qr_data = $2, status = 'active', expires_at = $3, used_at = NULL, attempt_count = 0
     WHERE order_id = $4`,
    [newCode, qrData, expiresAt, orderId]
  );

  await logAudit({
    action: 'pickup.code_regenerated',
    entityType: 'order',
    entityId: orderId,
    userId: adminId,
  });

  return { code: newCode, expiresAt };
};

module.exports = {
  receiveItem,
  getMyPickupCode,
  setDelegate,
  validatePickupCode,
  getPendingReceptions,
  getStoreStock,
  regenerateCode,
};
