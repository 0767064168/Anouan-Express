// src/modules/pickup/pickup.controller.js

const service = require('./pickup.service');

const receiveItem = async (req, res, next) => {
  try {
    const data = await service.receiveItem(req.user.id, req.user.storeId, {
      orderId: req.body.orderId,
      orderItemId: req.body.orderItemId,
      bordereauRef: req.body.bordereauRef,
      condition: req.body.condition,
      conditionNotes: req.body.conditionNotes,
      storageLocation: req.body.storageLocation,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getMyPickupCode = async (req, res, next) => {
  try {
    const data = await service.getMyPickupCode(req.params.orderId, req.user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const setDelegate = async (req, res, next) => {
  try {
    const data = await service.setDelegate(req.params.orderId, req.user.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const validateCode = async (req, res, next) => {
  try {
    // Récupérer le storeId depuis le profil agent (stocké dans req.user ou à chercher)
    const agentRes = await require('../../config/database').query(
      `SELECT s.id AS store_id FROM users u
       LEFT JOIN store_receptions sr ON sr.agent_id = u.id
       LEFT JOIN stores s ON s.id = sr.store_id
       WHERE u.id = $1 LIMIT 1`,
      [req.user.id]
    );
    const storeId = agentRes.rows[0]?.store_id || req.body.storeId;
    const data = await service.validatePickupCode(req.user.id, storeId, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getPendingReceptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, storeId } = req.query;
    const data = await service.getPendingReceptions(storeId || req.body.storeId, +page, +limit);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getStoreStock = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, storeId } = req.query;
    const data = await service.getStoreStock(storeId, +page, +limit);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const regenerateCode = async (req, res, next) => {
  try {
    const data = await service.regenerateCode(req.user.id, req.params.orderId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { receiveItem, getMyPickupCode, setDelegate, validateCode, getPendingReceptions, getStoreStock, regenerateCode };
