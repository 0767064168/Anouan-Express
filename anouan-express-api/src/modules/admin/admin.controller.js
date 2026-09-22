const adminService = require('./admin.service');

const getBanners = async (req, res, next) => {
  try {
    const activeOnly = req.path.startsWith('/public/') || req.query.activeOnly === 'true';
    const data = await adminService.getBanners(activeOnly);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createBanner = async (req, res, next) => {
  try {
    const data = await adminService.createBanner(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateBanner = async (req, res, next) => {
  try {
    const data = await adminService.updateBanner(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    await adminService.deleteBanner(req.params.id);
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const toggleBannerActive = async (req, res, next) => {
  try {
    const data = await adminService.toggleBannerActive(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getFlashSales = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const activeOnly = req.query.activeOnly === 'true';
    const result = await adminService.getFlashSales(page, limit, activeOnly);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const createFlashSale = async (req, res, next) => {
  try {
    const data = await adminService.createFlashSale(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createFlashSales = async (req, res, next) => {
  try {
    const data = await adminService.createFlashSales(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const updateFlashSale = async (req, res, next) => {
  try {
    const data = await adminService.updateFlashSale(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const deleteFlashSale = async (req, res, next) => {
  try {
    await adminService.deleteFlashSale(req.params.id);
    res.json({ success: true, message: 'Flash sale deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const toggleFlashSaleActive = async (req, res, next) => {
  try {
    const data = await adminService.toggleFlashSaleActive(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const data = await adminService.getDashboardStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getPlatformSettings = async (req, res, next) => {
  try {
    const data = await adminService.getPlatformSettings();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const data = await adminService.updateSetting(req.params.key, req.body.value, adminId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getUserRoles = async (req, res, next) => {
  try {
    const data = await adminService.getUserRoles();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createAdmin = async (req, res, next) => {
  try {
    const data = await adminService.createAdmin(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createAgent = async (req, res, next) => {
  try {
    const data = await adminService.createAgent(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const assignAgentStore = async (req, res, next) => {
  try {
    const data = await adminService.assignAgentStore(req.user.id, req.params.userId, req.body.storeId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateAgent = async (req, res, next) => {
  try {
    const data = await adminService.updateAgent(req.user.id, req.params.userId, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const data = await adminService.assignRole(adminId, req.params.userId, req.body.role);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      action: req.query.action,
      userId: req.query.userId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    const result = await adminService.getAuditLogs(page, limit, filters);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getWeeklyReport = async (req, res, next) => {
  try {
    const weekOffset = parseInt(req.query.weekOffset || '0', 10);
    const data = await adminService.getWeeklyReport(weekOffset);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  getFlashSales,
  createFlashSale,
  createFlashSales,
  updateFlashSale,
  deleteFlashSale,
  toggleFlashSaleActive,
  getStats,
  getPlatformSettings,
  updateSetting,
  getUserRoles,
  createAdmin,
  createAgent,
  assignAgentStore,
  updateAgent,
  assignRole,
  getAuditLogs,
  getWeeklyReport,
};
