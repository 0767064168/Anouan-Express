const storesService = require('./stores.service');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, activeOnly = 'true' } = req.query;
    const isActiveOnly = activeOnly === 'true' && req.user?.role !== 'admin';
    const result = await storesService.getAll(isActiveOnly, parseInt(page, 10), parseInt(limit, 10));
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const store = await storesService.getById(req.params.id);
    res.json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const store = await storesService.create(req.body);
    res.status(201).json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const store = await storesService.update(req.params.id, req.body);
    res.json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const store = await storesService.toggleActive(req.params.id);
    res.json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const store = await storesService.delete(req.params.id);
    res.json({ success: true, message: 'Point relais supprimé avec succès.', data: store });
  } catch (err) {
    next(err);
  }
};
