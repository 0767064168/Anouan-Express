const financeService = require('./finance.service');
const { AppError } = require('../../middlewares/errorHandler');

const getVendorStats = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const vendorId = req.user.id;
    const data = await financeService.getVendorStats(vendorId, { dateFrom, dateTo });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getVendorPayouts = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await financeService.getVendorPayouts(vendorId, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getAllPayouts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      status: req.query.status,
      vendorId: req.query.vendorId
    };
    const result = await financeService.getAllPayouts(page, limit, filters);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const createPayout = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const data = await financeService.createPayout(adminId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const markPayoutPaid = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const payoutId = req.params.id;
    const { paymentRef } = req.body;
    const data = await financeService.markPayoutPaid(adminId, payoutId, { paymentRef });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await financeService.getAdminStats({ dateFrom, dateTo });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const exportOrdersCSV = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      status: req.query.status
    };
    const csvString = await financeService.exportOrdersCSV(filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
    res.send(csvString);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVendorStats,
  getVendorPayouts,
  getAllPayouts,
  createPayout,
  markPayoutPaid,
  getAdminStats,
  exportOrdersCSV
};
