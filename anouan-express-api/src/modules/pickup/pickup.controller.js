// src/modules/pickup/pickup.controller.js

const service = require('./pickup.service');
const { AppError } = require('../../middlewares/errorHandler');

const getAssignedStoreId = async (agentId) => {
  const result = await require('../../config/database').query(
    `SELECT store_id FROM users WHERE id = $1 AND role = 'agent'`,
    [agentId]
  );
  const storeId = result.rows[0]?.store_id;
  if (!storeId) throw new AppError('Votre compte Agent n’est pas affecté à un point relais.', 403, 'AGENT_STORE_REQUIRED');
  return storeId;
};

const receiveItem = async (req, res, next) => {
  try {
    const data = await service.receiveItem(req.user.id, await getAssignedStoreId(req.user.id), {
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
    // L'affectation admin est la source de vérité pour le point relais Agent.
    const storeId = await getAssignedStoreId(req.user.id);
    const data = await service.validatePickupCode(req.user.id, storeId, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getPendingReceptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const storeId = req.user.role === 'agent' ? await getAssignedStoreId(req.user.id) : req.query.storeId;
    if (!storeId) throw new AppError('Le magasin est requis pour cette consultation.', 400, 'STORE_REQUIRED');
    const data = await service.getPendingReceptions(storeId, +page, +limit);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getStoreStock = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const storeId = req.user.role === 'agent' ? await getAssignedStoreId(req.user.id) : req.query.storeId;
    if (!storeId) throw new AppError('Le magasin est requis pour cette consultation.', 400, 'STORE_REQUIRED');
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
